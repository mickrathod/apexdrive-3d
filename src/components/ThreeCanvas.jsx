import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { Physics } from '../world/Physics';
import { World } from '../world/World';
import { Bike } from '../world/Bike';
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

    // Controls bindings
    controls.onReset = () => bike.reset();
    controls.onHorn = () => bike.honk();
    controls.onToggleCamera = () => {
      cameraMode = (cameraMode + 1) % 2;
    };

    // Store references in engineRef for parent control
    if (engineRef) {
      engineRef.current = {
        scene,
        bike,
        controls,
        soundManager,
        world,
        toggleCamera: () => {
          cameraMode = (cameraMode + 1) % 2;
        },
        resetCar: () => bike.reset(),
        honk: () => bike.honk(),
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

      // 2. Update bike & input
      bike.update(controls, delta);

      // 3. Update world zones & interactions
      world.update(bike, delta);

      // 4. Update camera
      const bikePos = bike.getPosition();
      const bikeSpeed = Math.abs(bike.speed);

      if (cameraMode === 0) {
        const dynamicDist = 18 + (bikeSpeed / bike.maxSpeed) * 8;
        const dynamicHeight = 14 + (bikeSpeed / bike.maxSpeed) * 3;
        const targetPos = new THREE.Vector3(
          bikePos.x,
          bikePos.y + dynamicHeight,
          bikePos.z + dynamicDist
        );
        camera.position.lerp(targetPos, delta * 4.5);
        cameraTarget.lerp(
          new THREE.Vector3(bikePos.x, bikePos.y + 1.2, bikePos.z),
          delta * 6.5
        );
        camera.lookAt(cameraTarget);
      } else {
        const targetPos = new THREE.Vector3(bikePos.x, bikePos.y + 36, bikePos.z + 0.1);
        camera.position.lerp(targetPos, delta * 5.0);
        camera.lookAt(bikePos.x, bikePos.y, bikePos.z);
      }

      // 5. Minimap radar
      minimap.draw(bikePos, bike.getRotationY());

      // 6. Pass telemetry up to React
      const speedKmh = bike.getSpeedKmh ? bike.getSpeedKmh() : Math.round(bikeSpeed * 3.6);
      let gear = 'N';
      if (bike.speed < -0.5) {
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
