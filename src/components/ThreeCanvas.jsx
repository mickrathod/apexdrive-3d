import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { Physics } from '../world/Physics';
import { World } from '../world/World';
import { Bike } from '../world/Bike';
import { Car } from '../world/Car';
import { Controls } from '../ui/Controls';
import { SoundManager } from '../audio/SoundManager';
import { Minimap } from '../ui/Minimap';

export const ThreeCanvas = ({
  onTelemetryUpdate,
  onZoneChange,
  onModalTrigger,
  onScoreUpdate,
  engineRef,
  theme
}) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let animId;
    let lastTime = performance.now();
    let cameraMode = 0; // 0: Isometric Chase, 1: Top-down

    // Scene
    const scene = new THREE.Scene();

    // Sky gradient
    const gradCanvas = document.createElement('canvas');
    gradCanvas.width = 2;
    gradCanvas.height = 256;
    const gctx = gradCanvas.getContext('2d');
    const grad = gctx.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, '#bcd6e8');
    grad.addColorStop(0.55, '#dcd2c2');
    grad.addColorStop(1, '#cbc0b0');
    gctx.fillStyle = grad;
    gctx.fillRect(0, 0, 2, 256);
    const skyTexture = new THREE.CanvasTexture(gradCanvas);
    skyTexture.colorSpace = THREE.SRGBColorSpace;
    scene.background = skyTexture;
    scene.fog = new THREE.FogExp2(0xcbc0b0, 0.007);

    // Camera
    const camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.5,
      500
    );
    camera.position.set(0, 20, 26);

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.18;

    // Systems
    const soundManager = new SoundManager();
    const physics = new Physics(soundManager);
    const controls = new Controls();
    const minimap = new Minimap('minimap-canvas', 190);

    // Modal proxy for React
    const modalProxy = {
      open: (data) => onModalTrigger({ type: 'project', data }),
      openAbout: () => onModalTrigger({ type: 'about' }),
      openContact: () => onModalTrigger({ type: 'contact' }),
      close: () => onModalTrigger(null),
      showZoneBanner: (zoneName) => onZoneChange(zoneName)
    };

    const world = new World(
      scene,
      physics,
      modalProxy,
      soundManager,
      (count, total) => onScoreUpdate(count, total)
    );

    const bike = new Bike(scene, physics, soundManager);
    const car = new Car(scene, physics, soundManager);
    car.mesh.visible = false;
    car.body.position.set(0, -100, 0);

    let activeVehicle = bike;
    let vehicleType = 'bike';

    const switchVehicle = () => {
      const pos = activeVehicle.getPosition();
      const spd = activeVehicle.speed;
      const yw = activeVehicle.yaw;

      if (vehicleType === 'bike') {
        vehicleType = 'car';
        bike.mesh.visible = false;
        bike.body.position.set(0, -100, 0);
        bike.body.velocity.set(0, 0, 0);

        car.mesh.visible = true;
        car.body.position.set(pos.x, pos.y + 0.4, pos.z);
        car.yaw = yw;
        car.speed = spd;
        activeVehicle = car;
        modalProxy.showZoneBanner('🏎️ SWITCHED TO MUSCLE CAR!');
      } else {
        vehicleType = 'bike';
        car.mesh.visible = false;
        car.body.position.set(0, -100, 0);
        car.body.velocity.set(0, 0, 0);

        bike.mesh.visible = true;
        bike.body.position.set(pos.x, pos.y + 0.4, pos.z);
        bike.yaw = yw;
        bike.speed = spd;
        activeVehicle = bike;
        modalProxy.showZoneBanner('🏍️ SWITCHED TO STUNT MOTORCYCLE!');
      }
      soundManager.playBoost();
    };

    // Controls bindings
    controls.onReset = () => activeVehicle.reset();
    controls.onHorn = () => activeVehicle.honk();
    controls.onSwitchVehicle = switchVehicle;
    controls.onToggleCamera = () => {
      cameraMode = (cameraMode + 1) % 2;
    };

    // Store references in engineRef for parent control
    if (engineRef) {
      engineRef.current = {
        scene,
        bike,
        car,
        getActiveVehicle: () => activeVehicle,
        switchVehicle,
        controls,
        soundManager,
        world,
        toggleCamera: () => {
          cameraMode = (cameraMode + 1) % 2;
        },
        resetCar: () => activeVehicle.reset(),
        honk: () => activeVehicle.honk(),
        setTheme: (t) => world.setTheme(t)
      };
    }

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    };
    window.addEventListener('resize', onResize);

    // Main animation loop
    const cameraTarget = new THREE.Vector3();

    const animate = () => {
      const now = performance.now();
      const delta = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      // 1. Step physics
      physics.step(delta);

      // 2. Update active vehicle & input
      activeVehicle.update(controls, delta);

      // 3. Update world zones & interactions
      world.update(activeVehicle, delta);

      // 4. Update camera
      const vehPos = activeVehicle.getPosition();
      const vehSpeed = Math.abs(activeVehicle.speed);

      if (cameraMode === 0) {
        const dynamicDist = 18 + (vehSpeed / activeVehicle.maxSpeed) * 8;
        const dynamicHeight = 14 + (vehSpeed / activeVehicle.maxSpeed) * 3;
        const targetPos = new THREE.Vector3(
          vehPos.x,
          vehPos.y + dynamicHeight,
          vehPos.z + dynamicDist
        );
        camera.position.lerp(targetPos, delta * 4.5);
        cameraTarget.lerp(
          new THREE.Vector3(vehPos.x, vehPos.y + 1.2, vehPos.z),
          delta * 6.5
        );
        camera.lookAt(cameraTarget);
      } else {
        const targetPos = new THREE.Vector3(vehPos.x, vehPos.y + 36, vehPos.z + 0.1);
        camera.position.lerp(targetPos, delta * 5.0);
        camera.lookAt(vehPos.x, vehPos.y, vehPos.z);
      }

      // 5. Minimap radar
      minimap.draw(vehPos, activeVehicle.getRotationY());

      // 6. Pass telemetry up to React
      const speedKmh = activeVehicle.getSpeedKmh ? activeVehicle.getSpeedKmh() : Math.round(vehSpeed * 3.6);
      let gear = 'N';
      if (activeVehicle.speed < -0.5) {
        gear = 'R';
      } else if (speedKmh === 0) {
        gear = 'N';
      } else if (speedKmh < 15) {
        gear = '1';
      } else if (speedKmh < 35) {
        gear = '2';
      } else {
        gear = '3';
      }
      onTelemetryUpdate({
        speed: speedKmh,
        gear
      });

      renderer.render(scene, camera);
      animId = requestAnimationFrame(animate);
    };

    animId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
    };
  }, []); // Mount once

  // Update theme when changed
  useEffect(() => {
    if (engineRef?.current?.world && theme) {
      engineRef.current.world.setTheme(theme);
    }
  }, [theme, engineRef]);

  return <canvas ref={canvasRef} id="webgl-canvas" />;
};
