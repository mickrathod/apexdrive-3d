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
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
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
    bike.deactivate();

    let activeVehicle = car;
    let vehicleType = 'car';

    const switchVehicle = () => {
      const pos = activeVehicle.getPosition();
      const posX = (pos && Number.isFinite(pos.x)) ? pos.x : 0;
      const posZ = (pos && Number.isFinite(pos.z)) ? pos.z : 0;
      const spd = Number.isFinite(activeVehicle.speed) ? activeVehicle.speed : 0;
      const yw = Number.isFinite(activeVehicle.yaw) ? activeVehicle.yaw : 0;

      if (vehicleType === 'bike') {
        vehicleType = 'car';
        bike.deactivate();
        car.activate({ x: posX, z: posZ }, yw, spd);
        activeVehicle = car;
        modalProxy.showZoneBanner('🏎️ SWITCHED TO FERRARI 458 ITALIA!');
      } else {
        vehicleType = 'bike';
        car.deactivate();
        bike.activate({ x: posX, z: posZ }, yw, spd);
        activeVehicle = bike;
        modalProxy.showZoneBanner('🏍️ SWITCHED TO SPORT MOTORCYCLE!');
      }
      soundManager.playBoost();
    };

    // Camera Orbit & Zoom State
    let orbitAzimuth = 0;
    let orbitPolar = 0.95; // ~54 deg elevation
    let cameraDistance = 23;
    let targetAzimuth = 0;
    let targetPolar = 0.95;
    let targetDistance = 23;

    let isDragging = false;
    let prevPointerX = 0;
    let prevPointerY = 0;

    // Mouse & Touch Orbit Event Listeners
    const onPointerDown = (e) => {
      // Ignore if clicking on UI buttons (handled by event propagation)
      if (e.target !== canvas) return;
      isDragging = true;
      prevPointerX = e.clientX;
      prevPointerY = e.clientY;
      canvas.setPointerCapture?.(e.pointerId);
    };

    const onPointerMove = (e) => {
      if (!isDragging) return;
      const dx = e.clientX - prevPointerX;
      const dy = e.clientY - prevPointerY;
      prevPointerX = e.clientX;
      prevPointerY = e.clientY;

      // Rotate azimuth (horizontal) and polar (elevation tilt)
      targetAzimuth -= dx * 0.0055;
      targetPolar -= dy * 0.0045;
      // Clamp vertical tilt to prevent gimbal lock / underground clipping
      targetPolar = Math.max(0.18, Math.min(Math.PI / 2 - 0.06, targetPolar));
    };

    const onPointerUp = (e) => {
      isDragging = false;
      canvas.releasePointerCapture?.(e.pointerId);
    };

    const onWheel = (e) => {
      e.preventDefault();
      targetDistance += e.deltaY * 0.022;
      // Clamp zoom: close up (9 units) to full arena overview (45 units)
      targetDistance = Math.max(9, Math.min(45, targetDistance));
    };

    const onDblClick = () => {
      targetAzimuth = 0;
      targetPolar = 0.95;
      targetDistance = 23;
      modalProxy.showZoneBanner('🎥 CAMERA RESET TO DEFAULT');
    };

    canvas.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('wheel', onWheel, { passive: false });
    canvas.addEventListener('dblclick', onDblClick);

    const CAMERA_MODES = [
      '🎥 ORBIT CHASE (DRAG MOUSE TO ROTATE)',
      '🛰️ TOP-DOWN TACTICAL RADAR',
      '🏎️ HOOD / COCKPIT CAM'
    ];

    const toggleCameraMode = () => {
      cameraMode = (cameraMode + 1) % 3;
      modalProxy.showZoneBanner(CAMERA_MODES[cameraMode]);
    };

    // Controls bindings
    controls.onReset = () => activeVehicle.reset();
    controls.onHorn = () => activeVehicle.honk();
    controls.onSwitchVehicle = switchVehicle;
    controls.onToggleCamera = toggleCameraMode;

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
        toggleCamera: toggleCameraMode,
        resetCar: () => activeVehicle.reset(),
        honk: () => activeVehicle.honk(),
        setTheme: (t) => world.setTheme(t)
      };
    }

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    };
    window.addEventListener('resize', onResize);

    // Main animation loop
    const cameraTarget = new THREE.Vector3();
    let lastTelemetryTime = 0;
    let lastSpeed = -1;
    let lastGear = '';

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
      const posX = (vehPos && Number.isFinite(vehPos.x)) ? vehPos.x : 0;
      const posY = (vehPos && Number.isFinite(vehPos.y)) ? Math.max(vehPos.y, 0.45) : 0.45;
      const posZ = (vehPos && Number.isFinite(vehPos.z)) ? vehPos.z : 0;
      const vehSpeed = Math.abs(Number.isFinite(activeVehicle.speed) ? activeVehicle.speed : 0);

      // Smooth interpolation for mouse orbit angles
      const smoothFactor = 1.0 - Math.exp(-12.0 * delta);
      orbitAzimuth += (targetAzimuth - orbitAzimuth) * smoothFactor;
      orbitPolar += (targetPolar - orbitPolar) * smoothFactor;
      cameraDistance += (targetDistance - cameraDistance) * smoothFactor;

      if (!Number.isFinite(orbitAzimuth)) orbitAzimuth = 0;
      if (!Number.isFinite(orbitPolar)) orbitPolar = 0.95;
      if (!Number.isFinite(cameraDistance)) cameraDistance = 23;

      if (cameraMode === 0) {
        // Free 360-degree Orbit Chase Cam
        const maxSpd = activeVehicle.maxSpeed || 30;
        const speedPush = (vehSpeed / maxSpd) * 3.5;
        const currentDist = cameraDistance + speedPush;

        const camX = posX + currentDist * Math.sin(orbitPolar) * Math.sin(orbitAzimuth);
        const camY = posY + currentDist * Math.cos(orbitPolar);
        const camZ = posZ + currentDist * Math.sin(orbitPolar) * Math.cos(orbitAzimuth);

        const targetPos = new THREE.Vector3(camX, Math.max(posY + 0.8, camY), camZ);
        camera.position.lerp(targetPos, 1.0 - Math.exp(-8.0 * delta));
        cameraTarget.lerp(
          new THREE.Vector3(posX, posY + 1.2, posZ),
          1.0 - Math.exp(-10.0 * delta)
        );
        camera.lookAt(cameraTarget);
      } else if (cameraMode === 1) {
        // Top-Down Radar Cam
        const targetPos = new THREE.Vector3(posX, posY + 40, posZ + 0.1);
        camera.position.lerp(targetPos, 1.0 - Math.exp(-7.0 * delta));
        cameraTarget.lerp(new THREE.Vector3(posX, posY, posZ), 1.0 - Math.exp(-10.0 * delta));
        camera.lookAt(cameraTarget);
      } else if (cameraMode === 2) {
        // First-Person Hood / Cockpit Cam
        const yaw = Number.isFinite(activeVehicle.yaw) ? activeVehicle.yaw : 0;
        const forwardX = Math.sin(yaw);
        const forwardZ = Math.cos(yaw);
        const hoodPos = new THREE.Vector3(
          posX + forwardX * 0.4,
          posY + 1.3,
          posZ + forwardZ * 0.4
        );
        camera.position.lerp(hoodPos, 1.0 - Math.exp(-16.0 * delta));
        cameraTarget.lerp(
          new THREE.Vector3(posX + forwardX * 20, posY + 1.1, posZ + forwardZ * 20),
          1.0 - Math.exp(-16.0 * delta)
        );
        camera.lookAt(cameraTarget);
      }

      // 5. Minimap radar
      minimap.draw(vehPos, activeVehicle.getRotationY());

      // 6. Pass telemetry up to React (throttled to 10Hz to prevent React re-render lag)
      if (now - lastTelemetryTime > 100) {
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

        if (speedKmh !== lastSpeed || gear !== lastGear) {
          lastSpeed = speedKmh;
          lastGear = gear;
          lastTelemetryTime = now;
          onTelemetryUpdate({
            speed: speedKmh,
            gear
          });
        }
      }

      renderer.render(scene, camera);
      animId = requestAnimationFrame(animate);
    };

    animId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animId);
      canvas.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('wheel', onWheel);
      canvas.removeEventListener('dblclick', onDblClick);
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
