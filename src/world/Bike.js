import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { loadGLTF } from '../loaders/modelLoader.js';

/**
 * 3D Interactive Motorcycle with Real 3D GLTF Model & Dynamic Banking Physics
 */
export class Bike {
    constructor(scene, physics, soundManager) {
        this.scene = scene;
        this.physics = physics;
        this.soundManager = soundManager;

        this.speed = 0;
        this.maxSpeed = 30;
        this.maxReverseSpeed = -9;
        this.acceleration = 44;
        this.deceleration = 18;
        this.brakingForce = 50;
        this.steeringAngle = 0;
        this.maxSteeringAngle = 0.58; // radians
        this.steerSpeed = 5.0;
        this.yaw = 0; // Current heading angle (radians)

        // Dynamic visual banking / motorcycle lean
        this.leanAngle = 0;
        this.maxLean = 0.45; // ~26 degrees into turns

        this.isBraking = false;
        this.isDrifting = false;
        this.isAccelerating = false;

        this.particles = [];

        this.createPhysicsBody();
        this.createVisualMesh();
        this.loadRealModel();
        this.createParticleSystem();
        this.createHornPopup();
    }

    createPhysicsBody() {
        // Agile collision body for a motorcycle
        const shape = new CANNON.Box(new CANNON.Vec3(0.5, 0.45, 1.25));
        this.body = new CANNON.Body({
            mass: 120,
            material: this.physics.carMaterial,
            shape: shape,
            position: new CANNON.Vec3(0, 0.55, 0),
            linearDamping: 0.05,
            angularDamping: 0.9
        });

        // Strictly lock pitch and roll so physics body never falls over
        this.body.angularFactor.set(0, 1, 0);
        this.physics.world.addBody(this.body);
    }

    createVisualMesh() {
        // Outer group follows physics position & yaw
        this.mesh = new THREE.Group();

        // Inner leaning group handles authentic motorcycle banking
        this.leanGroup = new THREE.Group();
        this.mesh.add(this.leanGroup);

        // Standby mesh shown instantly while GLTF parses
        this.createStandbyMesh();

        this.scene.add(this.mesh);
    }

    createStandbyMesh() {
        this.standbyMesh = new THREE.Group();

        // Aerodynamic sport fairing
        const bodyGeo = new THREE.BoxGeometry(0.35, 0.45, 1.4);
        const bodyMat = new THREE.MeshStandardMaterial({
            color: 0x0284c7, // Vibrant cyan
            metalness: 0.85,
            roughness: 0.25
        });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.set(0, 0.05, 0);
        body.castShadow = true;
        this.standbyMesh.add(body);

        // Front wheel
        const wheelGeo = new THREE.CylinderGeometry(0.34, 0.34, 0.16, 24);
        const wheelMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.8 });
        const fw = new THREE.Mesh(wheelGeo, wheelMat);
        fw.rotation.z = Math.PI / 2;
        fw.position.set(0, -0.21, -0.75);
        fw.castShadow = true;
        this.standbyMesh.add(fw);

        // Rear wheel
        const rw = new THREE.Mesh(wheelGeo, wheelMat);
        rw.rotation.z = Math.PI / 2;
        rw.position.set(0, -0.21, 0.75);
        rw.castShadow = true;
        this.standbyMesh.add(rw);

        this.leanGroup.add(this.standbyMesh);
    }

    loadRealModel() {
        loadGLTF('/models/motorcycle.glb').then((gltf) => {
            const bikeModel = gltf.scene;

            // Measure dimensions
            const bbox = new THREE.Box3().setFromObject(bikeModel);
            const size = new THREE.Vector3();
            bbox.getSize(size);

            // Scale to realistic motorcycle dimensions (~2.3m length)
            const maxHoriz = Math.max(size.x, size.z) || 1;
            const targetLength = 2.3;
            const scale = targetLength / maxHoriz;
            bikeModel.scale.setScalar(scale);

            // Rotate 90 deg if model was built facing along X
            if (size.x > size.z) {
                bikeModel.rotation.y = -Math.PI / 2;
            }

            // Recalculate bounding box after scale & rotation
            const finalBox = new THREE.Box3().setFromObject(bikeModel);
            const finalCenter = new THREE.Vector3();
            finalBox.getCenter(finalCenter);

            // Offset model so center is at (0, 0) and bottom sits flush with the road
            // (Chassis half-height is 0.45; road is at y=0.02. Align bottom of wheels with road)
            const targetRoadY = 0.025;
            bikeModel.position.x = -finalCenter.x;
            bikeModel.position.y = targetRoadY - 0.45 - finalBox.min.y;
            bikeModel.position.z = -finalCenter.z;

            bikeModel.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                    if (child.material) {
                        child.material.roughness = Math.min(child.material.roughness || 0.4, 0.35);
                        child.material.metalness = Math.max(child.material.metalness || 0.2, 0.4);
                    }
                }
            });

            if (this.standbyMesh) {
                this.leanGroup.remove(this.standbyMesh);
                this.standbyMesh = null;
            }

            this.leanGroup.add(bikeModel);
            this.bikeModel = bikeModel;
        }).catch((err) => {
            console.error('Error loading 3D motorcycle model:', err);
        });
    }

    createParticleSystem() {
        this.particleGeo = new THREE.DodecahedronGeometry(0.16, 0);
        this.particleMat = new THREE.MeshBasicMaterial({
            color: 0xd4c5b3,
            transparent: true,
            opacity: 0.6
        });
    }

    spawnDriftPuff(pos) {
        if (this.particles.length > 25) return;

        const p = new THREE.Mesh(this.particleGeo, this.particleMat.clone());
        p.position.copy(pos);
        p.position.y += (Math.random() - 0.5) * 0.1;
        p.scale.setScalar(Math.random() * 0.5 + 0.5);

        this.scene.add(p);
        this.particles.push({
            mesh: p,
            life: 1.0,
            velY: Math.random() * 0.5 + 0.2
        });
    }

    spawnNitroFlame(pos) {
        const flameGeo = new THREE.SphereGeometry(0.14, 8, 8);
        const flameMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.9 });
        const flame = new THREE.Mesh(flameGeo, flameMat);
        flame.position.copy(pos);
        flame.position.x += (Math.random() - 0.5) * 0.15;
        flame.position.z += (Math.random() - 0.5) * 0.15;
        this.scene.add(flame);

        this.particles.push({
            mesh: flame,
            life: 0.3,
            velY: Math.random() * 0.4
        });
    }

    createHornPopup() {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.roundRect(10, 10, 236, 108, 20);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 44px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🔊 HONK!', 128, 64);

        const tex = new THREE.CanvasTexture(canvas);
        const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: 0 });
        this.hornSprite = new THREE.Sprite(mat);
        this.hornSprite.scale.set(2.2, 1.1, 1);
        this.hornSprite.position.set(0, 2.0, 0);
        this.mesh.add(this.hornSprite);
    }

    honk() {
        this.soundManager.playHorn();
        if (this.hornSprite) {
            this.hornSprite.material.opacity = 1.0;
            setTimeout(() => {
                if (this.hornSprite) this.hornSprite.material.opacity = 0;
            }, 800);
        }
    }

    activate(pos, yaw = 0, speed = 0) {
        this.mesh.visible = true;

        const posX = (pos && Number.isFinite(pos.x)) ? pos.x : 0;
        const posZ = (pos && Number.isFinite(pos.z)) ? pos.z : 0;

        // Ensure body is in physics simulation
        if (!this.physics.world.bodies.includes(this.body)) {
            this.physics.world.addBody(this.body);
        }

        this.body.position.set(posX, 0.55, posZ);
        this.body.velocity.set(0, 0, 0);
        this.body.angularVelocity.set(0, 0, 0);
        this.yaw = Number.isFinite(yaw) ? yaw : 0;
        this.speed = Number.isFinite(speed) ? speed : 0;
        this.leanAngle = 0;
        this.steeringAngle = 0;

        this.mesh.position.copy(this.body.position);
        const quatY = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
        this.mesh.quaternion.copy(quatY);
        this.body.quaternion.set(quatY.x, quatY.y, quatY.z, quatY.w);
        this.body.wakeUp();
    }

    deactivate() {
        this.mesh.visible = false;
        this.body.velocity.set(0, 0, 0);
        this.body.angularVelocity.set(0, 0, 0);
        if (this.physics.world.bodies.includes(this.body)) {
            this.physics.world.removeBody(this.body);
        }
    }

    triggerBoost(duration = 2.5) {
        this.isBoosting = true;
        this.soundManager.playBoost();
        if (this.boostTimeout) clearTimeout(this.boostTimeout);
        this.boostTimeout = setTimeout(() => {
            this.isBoosting = false;
        }, duration * 1000);
    }

    setColor(hex) {
        if (this.bikeModel) {
            this.bikeModel.traverse((child) => {
                if (child.isMesh && child.material && child.material.color) {
                    const c = child.material.color;
                    if (c.r > 0.08 || c.g > 0.08 || c.b > 0.08) {
                        c.set(hex);
                    }
                }
            });
        }
        if (this.standbyMesh) {
            this.standbyMesh.traverse((child) => {
                if (child.isMesh && child.material && child.material.color) {
                    child.material.color.set(hex);
                }
            });
        }
    }

    reset() {
        this.body.position.set(0, 0.55, 0);
        this.body.velocity.set(0, 0, 0);
        this.body.angularVelocity.set(0, 0, 0);
        this.yaw = 0;
        this.speed = 0;
        this.steeringAngle = 0;
        this.leanAngle = 0;
        this.body.wakeUp();
    }

    update(controls, delta) {
        // 1. Steering
        let targetSteering = 0;
        if (controls.left) targetSteering = this.maxSteeringAngle;
        if (controls.right) targetSteering = -this.maxSteeringAngle;

        this.steeringAngle = THREE.MathUtils.lerp(this.steeringAngle, targetSteering, delta * this.steerSpeed);

        let turnRate = 0;
        if (Math.abs(this.speed) > 0.3) {
            const dir = this.speed >= 0 ? 1 : -1;
            turnRate = this.steeringAngle * 3.4 * dir;
        } else if (controls.left || controls.right) {
            turnRate = this.steeringAngle * 2.6;
        }
        this.yaw += turnRate * delta;

        // Bank into the turn when moving forward (authentic motorcycle lean)
        const speedRatio = Math.min(Math.abs(this.speed) / 15, 1.0);
        const targetLean = -this.steeringAngle * this.maxLean * speedRatio * (this.speed >= 0 ? 1 : -0.5);
        this.leanAngle = THREE.MathUtils.lerp(this.leanAngle, targetLean, delta * 8.0);
        this.leanGroup.rotation.z = this.leanAngle;

        // 2. Acceleration / Braking
        this.isAccelerating = controls.forward || this.isBoosting;
        this.isBraking = controls.brake || controls.backward;
        this.isDrifting = controls.brake && Math.abs(this.speed) > 6;

        if (this.isBoosting) {
            const boostTopSpeed = 48;
            this.speed += 60 * delta;
            if (this.speed > boostTopSpeed) this.speed = boostTopSpeed;
        } else if (controls.forward) {
            this.speed += this.acceleration * delta;
            if (this.speed > this.maxSpeed) this.speed = this.maxSpeed;
        } else if (controls.backward) {
            if (this.speed > 0.5) {
                this.speed -= this.brakingForce * delta;
            } else {
                this.speed -= this.acceleration * 0.7 * delta;
                if (this.speed < this.maxReverseSpeed) this.speed = this.maxReverseSpeed;
            }
        } else {
            if (this.speed > 0) {
                this.speed = Math.max(0, this.speed - this.deceleration * delta);
            } else if (this.speed < 0) {
                this.speed = Math.min(0, this.speed + this.deceleration * delta);
            }
        }

        if (controls.brake && !this.isBoosting) {
            this.speed = THREE.MathUtils.lerp(this.speed, 0, delta * 4.0);
            if (this.isDrifting) {
                this.soundManager.playDrift();
            }
        }

        // 3. Update velocity along forward heading
        const forwardX = -Math.sin(this.yaw);
        const forwardZ = -Math.cos(this.yaw);

        this.body.velocity.x = forwardX * this.speed;
        this.body.velocity.z = forwardZ * this.speed;
        this.body.wakeUp();

        const quatY = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
        this.body.quaternion.set(quatY.x, quatY.y, quatY.z, quatY.w);
        this.body.angularVelocity.set(0, 0, 0);

        // Anti-NaN & Anti-void safety check: prevent bike from ever corrupting coordinates
        if (!Number.isFinite(this.body.position.x) || !Number.isFinite(this.body.position.y) || !Number.isFinite(this.body.position.z)) {
            this.body.position.set(0, 0.55, 0);
            this.body.velocity.set(0, 0, 0);
            this.body.angularVelocity.set(0, 0, 0);
        } else if (this.body.position.y < 0.2) {
            this.body.position.y = 0.55;
            this.body.velocity.y = Math.max(0, this.body.velocity.y);
        }

        // 4. Sync Mesh with Physics Body
        this.mesh.position.copy(this.body.position);
        this.mesh.quaternion.copy(quatY);

        // Drift smoke from rear tire
        if (this.isDrifting && Math.random() > 0.3) {
            const worldPos = new THREE.Vector3();
            this.mesh.getWorldPosition(worldPos);
            this.spawnDriftPuff(worldPos);
        }

        // 5. Update Particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.life -= delta * 2.2;
            p.mesh.position.y += p.velY * delta;
            p.mesh.scale.multiplyScalar(1.0 + delta * 1.5);
            p.mesh.material.opacity = p.life * 0.6;

            if (p.life <= 0) {
                this.scene.remove(p.mesh);
                p.mesh.geometry.dispose();
                p.mesh.material.dispose();
                this.particles.splice(i, 1);
            }
        }

        // 6. Update Engine Audio
        this.soundManager.updateEngine(this.speed, this.isAccelerating);
    }

    getPosition() {
        return this.mesh.position;
    }

    getRotationY() {
        return this.yaw;
    }

    getSpeedKmh() {
        return Math.round(Math.abs(this.speed) * 3.6);
    }
}
