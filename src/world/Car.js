import * as THREE from 'three';
import * as CANNON from 'cannon-es';

/**
 * 3D Toy Vehicle with Arcade Physics & Dynamic Lighting
 */
export class Car {
    constructor(scene, physics, soundManager) {
        this.scene = scene;
        this.physics = physics;
        this.soundManager = soundManager;

        this.speed = 0;
        this.maxSpeed = 26;
        this.maxReverseSpeed = -10;
        this.acceleration = 38;
        this.deceleration = 16;
        this.brakingForce = 45;
        this.steeringAngle = 0;
        this.maxSteeringAngle = 0.55; // radians (~32 degrees)
        this.steerSpeed = 4.0;
        this.yaw = 0;
        this.driftFriction = 0.82; // Slippery when drifting

        this.isBraking = false;
        this.isDrifting = false;
        this.isAccelerating = false;

        this.wheels = [];
        this.particles = [];

        this.createPhysicsBody();
        this.createVisualMesh();
        this.createHeadlights();
        this.createParticleSystem();
        this.createHornPopup();
    }

    createPhysicsBody() {
        // Main vehicle chassis box with rounded/elevated collision bounds
        const chassisShape = new CANNON.Box(new CANNON.Vec3(0.85, 0.3, 1.45));
        this.body = new CANNON.Body({
            mass: 140,
            material: this.physics.carMaterial,
            shape: chassisShape,
            position: new CANNON.Vec3(0, 0.5, 0), // Starts flat and stable on the ground
            linearDamping: 0.05,
            angularDamping: 0.9
        });

        // STRICTLY LOCK pitch (X) and roll (Z) so car NEVER wheelies or flips upright!
        this.body.angularFactor.set(0, 1, 0);

        this.physics.world.addBody(this.body);
    }

    createVisualMesh() {
        this.mesh = new THREE.Group();

        // 1. Main Chassis (Lower Body)
        const bodyGeo = new THREE.BoxGeometry(1.7, 0.6, 3.1);
        this.bodyMat = new THREE.MeshStandardMaterial({
            color: 0xf97316, // Vibrant Toy Orange
            roughness: 0.35,
            metalness: 0.1
        });
        const bodyMesh = new THREE.Mesh(bodyGeo, this.bodyMat);
        bodyMesh.position.y = 0.2;
        bodyMesh.castShadow = true;
        bodyMesh.receiveShadow = true;
        this.mesh.add(bodyMesh);

        // White racing stripe
        const stripeGeo = new THREE.BoxGeometry(0.4, 0.62, 3.12);
        const stripeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
        const stripe = new THREE.Mesh(stripeGeo, stripeMat);
        stripe.position.y = 0.2;
        this.mesh.add(stripe);

        // 2. Cabin & Windshield
        const cabinGeo = new THREE.BoxGeometry(1.35, 0.65, 1.5);
        const cabinMat = new THREE.MeshStandardMaterial({
            color: 0x1e293b,
            roughness: 0.1,
            metalness: 0.2
        });
        const cabinMesh = new THREE.Mesh(cabinGeo, cabinMat);
        cabinMesh.position.set(0, 0.75, -0.15);
        cabinMesh.castShadow = true;
        this.mesh.add(cabinMesh);

        // Front Windshield Glass
        const glassGeo = new THREE.PlaneGeometry(1.2, 0.5);
        const glassMat = new THREE.MeshStandardMaterial({
            color: 0x38bdf8,
            roughness: 0.1,
            metalness: 0.8,
            transparent: true,
            opacity: 0.85
        });
        const glassFront = new THREE.Mesh(glassGeo, glassMat);
        glassFront.position.set(0, 0.76, -0.91);
        this.mesh.add(glassFront);

        // 3. Rear Spoiler
        const spoilerWingGeo = new THREE.BoxGeometry(1.6, 0.08, 0.35);
        const spoilerMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.4 });
        const spoilerWing = new THREE.Mesh(spoilerWingGeo, spoilerMat);
        spoilerWing.position.set(0, 0.95, 1.35);
        spoilerWing.castShadow = true;
        this.mesh.add(spoilerWing);

        const postGeo = new THREE.BoxGeometry(0.08, 0.4, 0.1);
        const postL = new THREE.Mesh(postGeo, spoilerMat);
        postL.position.set(-0.55, 0.75, 1.35);
        const postR = new THREE.Mesh(postGeo, spoilerMat);
        postR.position.set(0.55, 0.75, 1.35);
        this.mesh.add(postL);
        this.mesh.add(postR);

        // 4. Wheels Setup (4 wheels)
        const wheelGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.36, 24);
        wheelGeo.rotateZ(Math.PI / 2); // Rotate cylinder to face sideways

        const tireMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.85 });
        const rimMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.6, roughness: 0.3 });

        const wheelPositions = [
            { x: -0.95, y: -0.15, z: -1.0, isFront: true },  // Front Left
            { x: 0.95, y: -0.15, z: -1.0, isFront: true },   // Front Right
            { x: -0.95, y: -0.15, z: 1.0, isFront: false },  // Rear Left
            { x: 0.95, y: -0.15, z: 1.0, isFront: false }    // Rear Right
        ];

        this.wheels = wheelPositions.map((pos) => {
            const pivotGroup = new THREE.Group();
            pivotGroup.position.set(pos.x, pos.y, pos.z);

            const wheelMesh = new THREE.Mesh(wheelGeo, tireMat);
            wheelMesh.castShadow = true;

            // Hubcap
            const rimGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.38, 16);
            rimGeo.rotateZ(Math.PI / 2);
            const rimMesh = new THREE.Mesh(rimGeo, rimMat);
            wheelMesh.add(rimMesh);

            pivotGroup.add(wheelMesh);
            this.mesh.add(pivotGroup);

            return {
                pivot: pivotGroup,
                mesh: wheelMesh,
                isFront: pos.isFront,
                rotationAngle: 0
            };
        });

        // 5. Tail / Brake Lights
        const tailLightGeo = new THREE.BoxGeometry(0.3, 0.12, 0.05);
        this.tailLightMat = new THREE.MeshStandardMaterial({
            color: 0x7f1d1d,
            emissive: 0xef4444,
            emissiveIntensity: 0.2
        });

        const tailL = new THREE.Mesh(tailLightGeo, this.tailLightMat);
        tailL.position.set(-0.6, 0.25, 1.56);
        const tailR = new THREE.Mesh(tailLightGeo, this.tailLightMat);
        tailR.position.set(0.6, 0.25, 1.56);
        this.mesh.add(tailL);
        this.mesh.add(tailR);

        this.scene.add(this.mesh);
    }

    createHeadlights() {
        // Headlight lenses
        const lensGeo = new THREE.BoxGeometry(0.32, 0.15, 0.05);
        const lensMat = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            emissive: 0xfffbeb,
            emissiveIntensity: 1.5
        });

        const lensL = new THREE.Mesh(lensGeo, lensMat);
        lensL.position.set(-0.6, 0.25, -1.56);
        const lensR = new THREE.Mesh(lensGeo, lensMat);
        lensR.position.set(0.6, 0.25, -1.56);
        this.mesh.add(lensL);
        this.mesh.add(lensR);

        // Real-time SpotLight Cones casting light on the ground
        this.spotL = new THREE.SpotLight(0xfff7ed, 3.5, 30, Math.PI / 7, 0.4, 1.2);
        this.spotL.position.set(-0.6, 0.35, -1.6);
        this.spotL.target.position.set(-0.6, 0, -15);
        this.mesh.add(this.spotL);
        this.mesh.add(this.spotL.target);

        this.spotR = new THREE.SpotLight(0xfff7ed, 3.5, 30, Math.PI / 7, 0.4, 1.2);
        this.spotR.position.set(0.6, 0.35, -1.6);
        this.spotR.target.position.set(0.6, 0, -15);
        this.mesh.add(this.spotR);
        this.mesh.add(this.spotR.target);
    }

    createParticleSystem() {
        // Particle puff geometry
        this.particleGeo = new THREE.DodecahedronGeometry(0.18, 0);
        this.particleMat = new THREE.MeshBasicMaterial({
            color: 0xe2e8f0,
            transparent: true,
            opacity: 0.65
        });
    }

    spawnDriftPuff(pos) {
        if (this.particles.length > 35) return;

        const p = new THREE.Mesh(this.particleGeo, this.particleMat.clone());
        p.position.copy(pos);
        p.position.y += (Math.random() - 0.5) * 0.1;
        p.scale.setScalar(Math.random() * 0.5 + 0.6);

        this.scene.add(p);
        this.particles.push({
            mesh: p,
            life: 1.0,
            velY: Math.random() * 0.8 + 0.3
        });
    }

    createHornPopup() {
        // 3D Cartoon Horn Badge
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#f59e0b';
        ctx.font = 'bold 54px Impact, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('BEEP! 📯', 128, 64);

        const tex = new THREE.CanvasTexture(canvas);
        const spriteMat = new THREE.SpriteMaterial({ map: tex, transparent: true });
        this.hornSprite = new THREE.Sprite(spriteMat);
        this.hornSprite.scale.set(3, 1.5, 1);
        this.hornSprite.visible = false;
        this.mesh.add(this.hornSprite);
    }

    honk() {
        this.soundManager.playHorn();
        this.hornSprite.position.set(0, 2.2, 0);
        this.hornSprite.visible = true;

        clearTimeout(this.hornTimer);
        this.hornTimer = setTimeout(() => {
            this.hornSprite.visible = false;
        }, 800);
    }

    setColor(hex) {
        if (this.bodyMat) {
            this.bodyMat.color.set(hex);
            if (this.soundManager) this.soundManager.playPaint();
        }
    }

    triggerBoost(duration = 2.5) {
        this.isBoosting = true;
        this.speed = Math.max(this.speed, 28);
        if (this.soundManager) this.soundManager.playBoost();

        clearTimeout(this.boostTimer);
        this.boostTimer = setTimeout(() => {
            this.isBoosting = false;
        }, duration * 1000);
    }

    boost(mult = 1.4, duration = 2.5) {
        this.triggerBoost(duration);
    }

    reset() {
        // Reset car completely flat onto the ground facing forward
        this.body.position.set(0, 0.5, 0);
        this.body.quaternion.set(0, 0, 0, 1);
        this.body.velocity.set(0, 0, 0);
        this.body.angularVelocity.set(0, 0, 0);
        this.speed = 0;
        this.yaw = 0;
        this.steeringAngle = 0;
        this.isBoosting = false;
    }

    update(controls, delta) {
        // 1. Steering Calculation
        let targetSteer = 0;
        if (controls.left) targetSteer += this.maxSteeringAngle;
        if (controls.right) targetSteer -= this.maxSteeringAngle;

        this.steeringAngle = THREE.MathUtils.lerp(this.steeringAngle, targetSteer, delta * this.steerSpeed);

        // Turn heading: responsive turning whether driving fast or stopped on grid
        let turnRate = 0;
        if (Math.abs(this.speed) > 0.1) {
            const dir = this.speed >= 0 ? 1 : -1;
            turnRate = this.steeringAngle * 3.4 * dir;
        } else if (controls.left || controls.right) {
            turnRate = this.steeringAngle * 2.4;
        }
        this.yaw += turnRate * delta;

        // 2. Acceleration / Braking
        this.isAccelerating = controls.forward || this.isBoosting;
        this.isBraking = controls.brake || controls.backward;
        this.isDrifting = controls.brake && Math.abs(this.speed) > 6;

        if (this.isBoosting) {
            const boostTopSpeed = 44;
            this.speed += 55 * delta;
            if (this.speed > boostTopSpeed) this.speed = boostTopSpeed;
        } else if (controls.forward) {
            this.speed += this.acceleration * delta;
            if (this.speed > this.maxSpeed) this.speed = this.maxSpeed;
        } else if (controls.backward) {
            if (this.speed > 0.5) {
                // Braking while moving forward
                this.speed -= this.brakingForce * delta;
            } else {
                // Reversing
                this.speed -= this.acceleration * 0.7 * delta;
                if (this.speed < this.maxReverseSpeed) this.speed = this.maxReverseSpeed;
            }
        } else {
            // Natural friction coasting
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

        // 3. Tail Light Intensity based on braking
        if (this.tailLightMat) {
            const isStopping = controls.brake || (controls.backward && this.speed > 0);
            this.tailLightMat.emissiveIntensity = isStopping ? 2.5 : 0.25;
            this.tailLightMat.emissive.setHex(isStopping ? 0xff0000 : 0x7f1d1d);
        }

        // 4. Update velocity along forward heading
        const forwardX = -Math.sin(this.yaw);
        const forwardZ = -Math.cos(this.yaw);

        this.body.velocity.x = forwardX * this.speed;
        this.body.velocity.z = forwardZ * this.speed;
        this.body.wakeUp();

        const quatY = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
        this.body.quaternion.set(quatY.x, quatY.y, quatY.z, quatY.w);
        this.body.angularVelocity.set(0, 0, 0);

        // 5. Synchronize Three.js Mesh with Cannon Physics Body
        this.mesh.position.copy(this.body.position);
        this.mesh.quaternion.copy(quatY);

        // 6. Animate Wheels
        const wheelTurnSpeed = (this.speed / 0.42) * delta;
        for (const w of this.wheels) {
            w.rotationAngle -= wheelTurnSpeed;
            w.mesh.rotation.x = w.rotationAngle;

            if (w.isFront) {
                w.pivot.rotation.y = this.steeringAngle;
            }

            // Spawn drift puffs from rear wheels
            if (this.isDrifting && !w.isFront && Math.random() > 0.4) {
                const worldPos = new THREE.Vector3();
                w.mesh.getWorldPosition(worldPos);
                this.spawnDriftPuff(worldPos);
            }
        }

        // 7. Update Particles
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

        // 8. Update Engine Audio
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
