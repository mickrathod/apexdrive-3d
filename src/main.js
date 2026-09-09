import * as THREE from 'three';
import { Physics } from './world/Physics.js';
import { World } from './world/World.js';
import { Bike } from './world/Bike.js';
import { Controls } from './ui/Controls.js';
import { SoundManager } from './audio/SoundManager.js';
import { Minimap } from './ui/Minimap.js';
import { ModalManager } from './ui/ModalManager.js';

class App {
    constructor() {
        this.canvas = document.getElementById('webgl-canvas');
        this.clock = new THREE.Clock();

        this.cameraMode = 0; // 0: Isometric Chase, 1: Top-Down
        this.cameraOffset = new THREE.Vector3(0, 16, 22);
        this.cameraTarget = new THREE.Vector3();

        this.initThree();
        this.initSystems();
        this.setupUIBindings();
        this.animate();
    }

    initThree() {
        // Scene setup with Bruno Simon signature warm studio clay fog & background
        this.scene = new THREE.Scene();
        this.scene.background = this.createSkyGradient();
        this.scene.fog = new THREE.FogExp2(0xcbc0b0, 0.007);

        // Camera setup
        this.camera = new THREE.PerspectiveCamera(
            45,
            window.innerWidth / window.innerHeight,
            0.5,
            500
        );
        this.camera.position.set(0, 20, 26);

        // Renderer setup
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            powerPreference: 'high-performance'
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.18;

        window.addEventListener('resize', () => this.onResize());
    }

    createSkyGradient() {
        // Soft vertical gradient: warm sandy horizon fading into a pale sky
        // blue overhead, rendered once to a small canvas and used as an
        // equirectangular-ish background (cheap - no extra draw calls).
        const canvas = document.createElement('canvas');
        canvas.width = 2;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#bcd6e8');   // pale sky blue at the top
        gradient.addColorStop(0.55, '#dcd2c2'); // soft haze transition
        gradient.addColorStop(1, '#cbc0b0');   // warm sandy horizon (matches fog)
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        return texture;
    }

    initSystems() {
        this.soundManager = new SoundManager();
        this.physics = new Physics(this.soundManager);
        this.modalManager = new ModalManager();
        this.controls = new Controls();
        this.minimap = new Minimap('minimap-canvas', 190);

        this.scoreEl = document.getElementById('score-val');
        this.themes = ['clay', 'sunset', 'night'];
        this.currentThemeIdx = 0;

        this.world = new World(
            this.scene,
            this.physics,
            this.modalManager,
            this.soundManager,
            (count, total) => this.updateScore(count, total)
        );
        this.bike = new Bike(this.scene, this.physics, this.soundManager);

        // Controls Callbacks
        this.controls.onReset = () => this.bike.reset();
        this.controls.onHorn = () => this.bike.honk();
        this.controls.onToggleCamera = () => this.toggleCamera();
    }

    setupUIBindings() {
        // Speedometer & Score elements
        this.speedEl = document.getElementById('speed-val');
        this.gearEl = document.getElementById('gear-val');

        // Theme toggle button (Studio Clay -> Sunset -> Night)
        const themeBtn = document.getElementById('btn-theme');
        if (themeBtn) {
            themeBtn.addEventListener('click', () => {
                this.currentThemeIdx = (this.currentThemeIdx + 1) % this.themes.length;
                const themeName = this.themes[this.currentThemeIdx];
                this.world.setTheme(themeName);
                const labels = { clay: '☀️ Studio', sunset: '🌅 Sunset', night: '🌙 Night' };
                themeBtn.textContent = labels[themeName] || themeName;
            });
        }

        // Mute button
        const muteBtn = document.getElementById('btn-mute');
        if (muteBtn) {
            muteBtn.addEventListener('click', () => {
                const muted = this.soundManager.toggleMute();
                muteBtn.textContent = muted ? '🔇 Muted' : '🔊 Sound';
                muteBtn.classList.toggle('active', !muted);
            });
        }

        // Camera toggle button
        const camBtn = document.getElementById('btn-camera');
        if (camBtn) {
            camBtn.addEventListener('click', () => this.toggleCamera());
        }

        // Reset bike button
        const resetBtn = document.getElementById('btn-reset-car');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.bike.reset());
        }

        // About / Help Modal buttons
        const aboutBtn = document.getElementById('btn-about');
        if (aboutBtn) {
            aboutBtn.addEventListener('click', () => this.modalManager.openAbout());
        }

        const contactBtn = document.getElementById('btn-contact');
        if (contactBtn) {
            contactBtn.addEventListener('click', () => this.modalManager.openContact());
        }
    }

    updateScore(count, total) {
        if (this.scoreEl) {
            this.scoreEl.textContent = `${count}/${total}`;
            // Pulse score element
            this.scoreEl.parentElement.classList.add('pulse');
            setTimeout(() => this.scoreEl.parentElement.classList.remove('pulse'), 300);
        }
    }

    toggleCamera() {
        this.cameraMode = (this.cameraMode + 1) % 2;
    }

    updateCamera(delta) {
        const bikePos = this.bike.getPosition();
        const bikeSpeed = Math.abs(this.bike.speed);

        if (this.cameraMode === 0) {
            // Isometric Chase Camera
            const dynamicDist = 18 + (bikeSpeed / this.bike.maxSpeed) * 8;
            const dynamicHeight = 14 + (bikeSpeed / this.bike.maxSpeed) * 3;

            const targetPos = new THREE.Vector3(
                bikePos.x,
                bikePos.y + dynamicHeight,
                bikePos.z + dynamicDist
            );

            // Smooth camera lag
            this.camera.position.lerp(targetPos, delta * 4.5);
            this.cameraTarget.lerp(bikePos, delta * 6.0);
            this.camera.lookAt(this.cameraTarget.x, this.cameraTarget.y + 0.8, this.cameraTarget.z);
        } else {
            // Top-Down Bird's-Eye View
            const topPos = new THREE.Vector3(bikePos.x, bikePos.y + 45, bikePos.z);
            this.camera.position.lerp(topPos, delta * 3.5);
            this.camera.lookAt(bikePos.x, bikePos.y, bikePos.z);
        }
    }

    updateHUD() {
        const speedKmh = this.bike.getSpeedKmh();
        if (this.speedEl) {
            this.speedEl.textContent = speedKmh.toString().padStart(2, '0');
        }

        if (this.gearEl) {
            if (this.bike.speed < -0.5) {
                this.gearEl.textContent = 'R';
            } else if (speedKmh === 0) {
                this.gearEl.textContent = 'N';
            } else if (speedKmh < 15) {
                this.gearEl.textContent = '1';
            } else if (speedKmh < 35) {
                this.gearEl.textContent = '2';
            } else {
                this.gearEl.textContent = '3';
            }
        }
    }

    onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        const delta = Math.min(this.clock.getDelta(), 0.05);

        // Step physics
        this.physics.step(delta);

        // Update bike & input
        this.bike.update(this.controls, delta);

        // Update world zones & interactions
        this.world.update(this.bike, delta);

        // Update camera
        this.updateCamera(delta);

        // Update HUD & Radar
        this.updateHUD();
        const bikePos = this.bike.getPosition();
        this.minimap.draw(bikePos, this.bike.getRotationY());

        // Render scene
        this.renderer.render(this.scene, this.camera);
    }
}

// Start application on DOM ready
window.addEventListener('DOMContentLoaded', () => {
    new App();
});
