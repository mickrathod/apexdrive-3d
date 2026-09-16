import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { loadGLTF } from '../loaders/modelLoader.js';

/**
 * 3D Sports Car with Real Official Three.js Ferrari 458 GLTF Model & Arcade Physics
 */
export class Car {
    constructor(scene, physics, soundManager) {
        this.scene = scene;
        this.physics = physics;
        this.soundManager = soundManager;

        this.speed = 0;
        this.maxSpeed = 28;
        this.maxReverseSpeed = -10;
        this.acceleration = 40;
        this.deceleration = 16;
        this.brakingForce = 45;
        this.steeringAngle = 0;
        this.maxSteeringAngle = 0.55; // radians (~32 degrees)
        this.steerSpeed = 4.0;
        this.yaw = 0;
        this.driftFriction = 0.82;
        this.wheelAngle = 0;

        this.isBraking = false;
        this.isDrifting = false;
        this.isAccelerating = false;

        this.particles = [];

        this.createPhysicsBody();
        this.createVisualMesh();
        this.loadRealFerrari();
        this.createParticleSystem();
        this.createHornPopup();
    }

    createPhysicsBody() {
        // Physical chassis bounding box
        const chassisShape = new CANNON.Box(new CANNON.Vec3(0.9, 0.35, 1.6));
        this.body = new CANNON.Body({
            mass: 140,
            material: this.physics.carMaterial,
            shape: chassisShape,
            position: new CANNON.Vec3(0, 0.45, 0),
            linearDamping: 0.05,
            angularDamping: 0.9
        });

        // Strictly lock pitch (X) and roll (Z) so vehicle drives smoothly on ground
        this.body.angularFactor.set(0, 1, 0);
        this.physics.world.addBody(this.body);
    }

    createVisualMesh() {
        this.mesh = new THREE.Group();
        this.createStandbyCarMesh();
        this.scene.add(this.mesh);
    }

    createStandbyCarMesh() {
        this.standbyMesh = new THREE.Group();

        // Main aerodynamic sports chassis
        const chassisGeo = new THREE.BoxGeometry(1.5, 0.42, 3.0);
        const redMat = new THREE.MeshStandardMaterial({
            color: 0xef4444, // Rosso Corsa
            metalness: 0.85,
            roughness: 0.22
        });
        const chassis = new THREE.Mesh(chassisGeo, redMat);
        chassis.position.y = 0.06;
        chassis.castShadow = true;
        this.standbyMesh.add(chassis);

        // Cockpit & tinted glass
        const cabinGeo = new THREE.BoxGeometry(1.15, 0.38, 1.5);
        const glassMat = new THREE.MeshStandardMaterial({
            color: 0x0f172a,
            metalness: 0.9,
            roughness: 0.1
        });
        const cabin = new THREE.Mesh(cabinGeo, glassMat);
        cabin.position.set(0, 0.42, -0.15);
        cabin.castShadow = true;
        this.standbyMesh.add(cabin);

        // 4 Styled Wheels
        const wheelGeo = new THREE.CylinderGeometry(0.34, 0.34, 0.26, 20);
        const wheelMat = new THREE.MeshStandardMaterial({
            color: 0x111827,
            roughness: 0.7
        });
        const rimMat = new THREE.MeshStandardMaterial({
            color: 0xf8fafc,
            metalness: 0.95,
            roughness: 0.15
        });

        const wheelPositions = [
            [-0.82, -0.12, -0.95],
            [0.82, -0.12, -0.95],
            [-0.82, -0.12, 0.95],
            [0.82, -0.12, 0.95]
        ];

        this.standbyWheels = [];
        wheelPositions.forEach(([x, y, z]) => {
            const wGroup = new THREE.Group();
            const tire = new THREE.Mesh(wheelGeo, wheelMat);
            tire.rotation.z = Math.PI / 2;
            tire.castShadow = true;
            wGroup.add(tire);

            const rimGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.27, 12);
            const rim = new THREE.Mesh(rimGeo, rimMat);
            rim.rotation.z = Math.PI / 2;
            wGroup.add(rim);

            wGroup.position.set(x, y, z);
            this.standbyMesh.add(wGroup);
            this.standbyWheels.push(wGroup);
        });

        this.mesh.add(this.standbyMesh);
    }

    loadRealFerrari() {
        loadGLTF('models/ferrari.glb').then((gltf) => {
            const carModel = gltf.scene.children[0];

            // Scale and center Ferrari cleanly over physics collision body
            carModel.scale.setScalar(0.85);

            // Measure dimensions to ensure wheels sit flush with the road
            const bbox = new THREE.Box3().setFromObject(carModel);
            const center = new THREE.Vector3();
            bbox.getCenter(center);

            // Center X and Z cleanly over chassis
            carModel.position.x = -center.x;
            carModel.position.z = -center.z;

            // Chassis half-height is 0.35, so chassis rests on ground (y=0) at y=0.35.
            // Road surface is at y=0.02. Align bottom of tires exactly flush with road.
            const targetRoadY = 0.025;
            carModel.position.y = targetRoadY - 0.35 - bbox.min.y;

            // Official Three.js car materials from webgl_materials_car
            const bodyMaterial = new THREE.MeshPhysicalMaterial({
                color: 0xef4444, // Rosso Corsa
                metalness: 0.9,
                roughness: 0.22,
                clearcoat: 1.0,
                clearcoatRoughness: 0.03
            });

            const detailsMaterial = new THREE.MeshStandardMaterial({
                color: 0xffffff,
                metalness: 0.95,
                roughness: 0.15
            });

            const trimMaterial = new THREE.MeshStandardMaterial({
                color: 0x111827,
                metalness: 0.8,
                roughness: 0.35
            });

            const glassMaterial = new THREE.MeshPhysicalMaterial({
                color: 0xffffff,
                metalness: 0.1,
                roughness: 0,
                transmission: 0.92,
                transparent: true,
                opacity: 0.85
            });

            const bodyObj = carModel.getObjectByName('body');
            if (bodyObj) bodyObj.material = bodyMaterial;

            ['rim_fl', 'rim_fr', 'rim_rl', 'rim_rr'].forEach((name) => {
                const rim = carModel.getObjectByName(name);
                if (rim) rim.material = detailsMaterial;
            });

            const trimObj = carModel.getObjectByName('trim');
            if (trimObj) trimObj.material = trimMaterial;

            const glassObj = carModel.getObjectByName('glass');
            if (glassObj) glassObj.material = glassMaterial;

            carModel.traverse((c) => {
                if (c.isMesh) {
                    c.castShadow = true;
                    c.receiveShadow = true;
                }
            });

            // Store animated wheel nodes
            this.wheelFL = carModel.getObjectByName('wheel_fl');
            this.wheelFR = carModel.getObjectByName('wheel_fr');
            this.wheelRL = carModel.getObjectByName('wheel_rl');
            this.wheelRR = carModel.getObjectByName('wheel_rr');
            this.steeringWheelNode = carModel.getObjectByName('steering_wheel');

            // Wrap front wheels in dedicated steering pivot groups to cleanly separate
            // vertical kingpin steering (Y-axis) from rolling drive rotation (X-axis).
            // This completely eliminates Euler angle gimbal lock and wheel shaking/wobble.
            if (this.wheelFL && this.wheelFL.parent) {
                const parent = this.wheelFL.parent;
                this.steerPivotFL = new THREE.Group();
                this.steerPivotFL.name = 'steer_pivot_fl';
                this.steerPivotFL.position.copy(this.wheelFL.position);
                parent.add(this.steerPivotFL);

                this.wheelFL.position.set(0, 0, 0);
                this.steerPivotFL.add(this.wheelFL);
            }

            if (this.wheelFR && this.wheelFR.parent) {
                const parent = this.wheelFR.parent;
                this.steerPivotFR = new THREE.Group();
                this.steerPivotFR.name = 'steer_pivot_fr';
                this.steerPivotFR.position.copy(this.wheelFR.position);
                parent.add(this.steerPivotFR);

                this.wheelFR.position.set(0, 0, 0);
                this.steerPivotFR.add(this.wheelFR);
            }

            if (this.standbyMesh) {
                this.mesh.remove(this.standbyMesh);
                this.standbyMesh = null;
            }

            this.mesh.add(carModel);
            this.carModel = carModel;
        }).catch((err) => {
            console.warn('Ferrari GLTF model fallback to standby chassis:', err);
        });
    }

    createParticleSystem() {
        this.particleGeo = new THREE.DodecahedronGeometry(0.18, 0);
        this.particleMat = new THREE.MeshBasicMaterial({
            color: 0xe2e8f0,
            transparent: true,
            opacity: 0.65
        });
    }

    spawnDriftPuff(pos) {
        if (this.particles.length > 25) return;

        const p = new THREE.Mesh(this.particleGeo, this.particleMat.clone());
        p.position.copy(pos);
        p.position.y += (Math.random() - 0.5) * 0.1;
        p.scale.setScalar(Math.random() * 0.6 + 0.4);

        this.scene.add(p);
        this.particles.push({
            mesh: p,
            life: 1.0,
            velY: Math.random() * 0.6 + 0.3
        });
    }

    spawnNitroFlame(pos) {
        const flameGeo = new THREE.SphereGeometry(0.16, 8, 8);
        const flameMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.9 });
        const flame = new THREE.Mesh(flameGeo, flameMat);
        flame.position.copy(pos);
        flame.position.x += (Math.random() - 0.5) * 0.2;
        flame.position.z += (Math.random() - 0.5) * 0.2;
        this.scene.add(flame);

        this.particles.push({
            mesh: flame,
            life: 0.35,
            velY: Math.random() * 0.5
        });
    }

    createHornPopup() {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.roundRect(10, 10, 236, 108, 20);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 44px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('📢 BEEP!', 128, 64);

        const tex = new THREE.CanvasTexture(canvas);
        const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: 0 });
        this.hornSprite = new THREE.Sprite(mat);
        this.hornSprite.scale.set(2.4, 1.2, 1);
        this.hornSprite.position.set(0, 2.2, 0);
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

        this.body.position.set(posX, 0.45, posZ);
        this.body.velocity.set(0, 0, 0);
        this.body.angularVelocity.set(0, 0, 0);
        this.yaw = Number.isFinite(yaw) ? yaw : 0;
        this.speed = Number.isFinite(speed) ? speed : 0;
        this.steeringAngle = 0;
        this.wheelAngle = 0;
        if (this.steerPivotFL) this.steerPivotFL.rotation.y = 0;
        if (this.steerPivotFR) this.steerPivotFR.rotation.y = 0;

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
        if (this.carModel) {
            const bodyObj = this.carModel.getObjectByName('body');
            if (bodyObj && bodyObj.material && bodyObj.material.color) {
                bodyObj.material.color.set(hex);
            }
        }
    }

    reset() {
        this.body.position.set(0, 0.45, 0);
        this.body.velocity.set(0, 0, 0);
        this.body.angularVelocity.set(0, 0, 0);
        this.yaw = 0;
        this.speed = 0;
        this.steeringAngle = 0;
        this.wheelAngle = 0;
        if (this.steerPivotFL) this.steerPivotFL.rotation.y = 0;
        if (this.steerPivotFR) this.steerPivotFR.rotation.y = 0;
        if (this.wheelFL) this.wheelFL.rotation.x = 0;
        if (this.wheelFR) this.wheelFR.rotation.x = 0;
        if (this.wheelRL) this.wheelRL.rotation.x = 0;
        if (this.wheelRR) this.wheelRR.rotation.x = 0;
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
            turnRate = this.steeringAngle * 2.5;
        }
        this.yaw += turnRate * delta;

        // 2. Acceleration / Braking
        this.isAccelerating = controls.forward || this.isBoosting;
        this.isBraking = controls.brake || controls.backward;
        this.isDrifting = controls.brake && Math.abs(this.speed) > 6;

        if (this.isBoosting) {
            const boostTopSpeed = 46;
            this.speed += 55 * delta;
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
            this.speed = THREE.MathUtils.lerp(this.speed, 0, delta * 3.5);
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

        // Anti-NaN & Anti-void safety check: prevent car from ever corrupting coordinates
        if (!Number.isFinite(this.body.position.x) || !Number.isFinite(this.body.position.y) || !Number.isFinite(this.body.position.z)) {
            this.body.position.set(0, 0.45, 0);
            this.body.velocity.set(0, 0, 0);
            this.body.angularVelocity.set(0, 0, 0);
        } else if (this.body.position.y < 0.2) {
            this.body.position.y = 0.45;
            this.body.velocity.y = Math.max(0, this.body.velocity.y);
        }

        // 4. Synchronize Mesh position with Cannon Physics Body
        this.mesh.position.copy(this.body.position);
        this.mesh.quaternion.copy(quatY);

        // 5. Animate Real Three.js Ferrari Wheels & Steering Wheel
        if (this.carModel) {
            const wheelRotSpeed = (this.speed / 0.35) * delta;
            this.wheelAngle = ((this.wheelAngle || 0) - wheelRotSpeed) % (Math.PI * 2);

            // Steer front wheel assemblies cleanly around vertical Y axis (no camber/tilt/shaking)
            if (this.steerPivotFL) {
                this.steerPivotFL.rotation.y = this.steeringAngle;
            }
            if (this.steerPivotFR) {
                this.steerPivotFR.rotation.y = this.steeringAngle;
            }

            // Spin wheels smoothly along their rolling X-axis
            if (this.wheelFL) this.wheelFL.rotation.x = this.wheelAngle;
            if (this.wheelFR) this.wheelFR.rotation.x = this.wheelAngle;
            if (this.wheelRL) this.wheelRL.rotation.x = this.wheelAngle;
            if (this.wheelRR) this.wheelRR.rotation.x = this.wheelAngle;

            if (this.steeringWheelNode) {
                this.steeringWheelNode.rotation.z = -this.steeringAngle * 2.2;
            }

            // Drift tire smoke from rear wheels
            if (this.isDrifting && this.wheelRL && Math.random() > 0.4) {
                const worldPos = new THREE.Vector3();
                this.wheelRL.getWorldPosition(worldPos);
                this.spawnDriftPuff(worldPos);
            }
        }

        // 6. Update Particles
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

        // 7. Update Engine Audio
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
