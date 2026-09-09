import * as THREE from 'three';
import * as CANNON from 'cannon-es';

/**
 * 3D Interactive Motorcycle with Dynamic Banking / Lean Physics
 * Inspired directly by Bruno Simon's toy-like miniature aesthetic.
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

        this.wheels = [];
        this.particles = [];

        this.createPhysicsBody();
        this.createVisualMesh();
        this.createHeadlight();
        this.createParticleSystem();
        this.createHornPopup();
    }

    createPhysicsBody() {
        // Narrow, agile collision body for a motorcycle
        const shape = new CANNON.Box(new CANNON.Vec3(0.5, 0.4, 1.25));
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

        // Materials
        this.bodyMat = new THREE.MeshStandardMaterial({
            color: 0xef4444, // Bruno Simon signature poppy red
            roughness: 0.25,
            metalness: 0.15
        });

        const frameMat = new THREE.MeshStandardMaterial({
            color: 0x1e293b,
            roughness: 0.4,
            metalness: 0.7
        });

        const chromeMat = new THREE.MeshStandardMaterial({
            color: 0xe2e8f0,
            roughness: 0.15,
            metalness: 0.85
        });

        const tireMat = new THREE.MeshStandardMaterial({
            color: 0x18181b,
            roughness: 0.85
        });

        const seatMat = new THREE.MeshStandardMaterial({
            color: 0x0f172a,
            roughness: 0.7
        });

        // 1. Central Bike Frame & Engine Core
        const frameGeo = new THREE.BoxGeometry(0.48, 0.55, 1.4);
        const frameMesh = new THREE.Mesh(frameGeo, frameMat);
        frameMesh.position.set(0, 0.45, 0.1);
        frameMesh.castShadow = true;
        this.leanGroup.add(frameMesh);

        // Engine cylinders detail (Chrome pipes)
        const engL = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.55, 12), chromeMat);
        engL.rotation.z = Math.PI / 2;
        engL.position.set(0, 0.35, 0.15);
        this.leanGroup.add(engL);

        // 2. Sculpted Fuel Tank (Red)
        const tankGeo = new THREE.BoxGeometry(0.55, 0.42, 0.85);
        const tankMesh = new THREE.Mesh(tankGeo, this.bodyMat);
        tankMesh.position.set(0, 0.78, -0.2);
        tankMesh.castShadow = true;
        this.leanGroup.add(tankMesh);

        // White racing stripe on tank
        const stripe = new THREE.Mesh(
            new THREE.BoxGeometry(0.14, 0.43, 0.86),
            new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 })
        );
        stripe.position.set(0, 0.78, -0.2);
        this.leanGroup.add(stripe);

        // 3. Ergonomic Bike Seat & Tail Cowl
        const seatGeo = new THREE.BoxGeometry(0.46, 0.14, 0.7);
        const seatMesh = new THREE.Mesh(seatGeo, seatMat);
        seatMesh.position.set(0, 0.72, 0.45);
        seatMesh.castShadow = true;
        this.leanGroup.add(seatMesh);

        // Tail Cowl (Red)
        const tailGeo = new THREE.BoxGeometry(0.44, 0.26, 0.55);
        const tailMesh = new THREE.Mesh(tailGeo, this.bodyMat);
        tailMesh.position.set(0, 0.78, 0.9);
        tailMesh.castShadow = true;
        this.leanGroup.add(tailMesh);

        // 4. Dual Chrome Exhaust Pipes
        const exhaustGeo = new THREE.CylinderGeometry(0.06, 0.08, 1.1, 12);
        exhaustGeo.rotateX(Math.PI / 2);
        this.exhaustR = new THREE.Mesh(exhaustGeo, chromeMat);
        this.exhaustR.position.set(0.32, 0.35, 0.55);
        this.exhaustR.castShadow = true;
        this.leanGroup.add(this.exhaustR);

        // 5. Front Fork, Handlebars & Windscreen (Steering Assembly)
        this.steeringAssembly = new THREE.Group();
        this.steeringAssembly.position.set(0, 0.4, -0.9); // Pivot point at head tube

        // Fork legs (Chrome)
        const forkGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.95, 12);
        const forkL = new THREE.Mesh(forkGeo, chromeMat);
        forkL.position.set(-0.2, 0, 0);
        forkL.rotation.x = 0.22; // Rake angle
        forkL.castShadow = true;
        this.steeringAssembly.add(forkL);

        const forkR = new THREE.Mesh(forkGeo, chromeMat);
        forkR.position.set(0.2, 0, 0);
        forkR.rotation.x = 0.22;
        forkR.castShadow = true;
        this.steeringAssembly.add(forkR);

        // Handlebars (Horizontal Bar + Grips)
        const barGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.95, 12);
        barGeo.rotateZ(Math.PI / 2);
        const barMesh = new THREE.Mesh(barGeo, chromeMat);
        barMesh.position.set(0, 0.52, -0.05);
        this.steeringAssembly.add(barMesh);

        // Grips
        const gripGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.2, 12);
        gripGeo.rotateZ(Math.PI / 2);
        const gripL = new THREE.Mesh(gripGeo, seatMat);
        gripL.position.set(-0.45, 0.52, -0.05);
        const gripR = new THREE.Mesh(gripGeo, seatMat);
        gripR.position.set(0.45, 0.52, -0.05);
        this.steeringAssembly.add(gripL);
        this.steeringAssembly.add(gripR);

        // Front Headlight Mask & Windscreen
        const maskGeo = new THREE.BoxGeometry(0.36, 0.35, 0.25);
        const mask = new THREE.Mesh(maskGeo, this.bodyMat);
        mask.position.set(0, 0.42, -0.15);
        this.steeringAssembly.add(mask);

        const screenGeo = new THREE.BoxGeometry(0.3, 0.28, 0.05);
        const screenMat = new THREE.MeshStandardMaterial({
            color: 0x38bdf8,
            transparent: true,
            opacity: 0.8,
            metalness: 0.5
        });
        const screen = new THREE.Mesh(screenGeo, screenMat);
        screen.position.set(0, 0.65, -0.18);
        screen.rotation.x = -0.3;
        this.steeringAssembly.add(screen);

        // 6. Wheels (Front Wheel attached to steering assembly, Rear Wheel attached to frame)
        const wheelGeo = new THREE.CylinderGeometry(0.45, 0.45, 0.22, 24);
        wheelGeo.rotateZ(Math.PI / 2);

        const rimGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.24, 16);
        rimGeo.rotateZ(Math.PI / 2);

        // Front Wheel (in steering assembly)
        this.frontWheel = new THREE.Group();
        this.frontWheel.position.set(0, -0.38, -0.1);
        const fTire = new THREE.Mesh(wheelGeo, tireMat);
        fTire.castShadow = true;
        const fRim = new THREE.Mesh(rimGeo, chromeMat);
        fTire.add(fRim);
        this.frontWheel.add(fTire);
        this.steeringAssembly.add(this.frontWheel);

        this.leanGroup.add(this.steeringAssembly);

        // Rear Wheel (attached to rear swingarm)
        this.rearWheel = new THREE.Group();
        this.rearWheel.position.set(0, 0.02, 0.95);
        const rTire = new THREE.Mesh(wheelGeo, tireMat);
        rTire.castShadow = true;
        const rRim = new THREE.Mesh(rimGeo, chromeMat);
        rTire.add(rRim);
        this.rearWheel.add(rTire);
        this.leanGroup.add(this.rearWheel);

        // 7. Rear Brake Light
        const tailLightGeo = new THREE.BoxGeometry(0.25, 0.09, 0.05);
        this.tailLightMat = new THREE.MeshStandardMaterial({
            color: 0x7f1d1d,
            emissive: 0xef4444,
            emissiveIntensity: 0.3
        });
        const tailLight = new THREE.Mesh(tailLightGeo, this.tailLightMat);
        tailLight.position.set(0, 0.72, 1.18);
        this.leanGroup.add(tailLight);

        this.scene.add(this.mesh);
    }

    createHeadlight() {
        // Glowing round lens
        const lensGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.06, 16);
        lensGeo.rotateX(Math.PI / 2);
        const lensMat = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            emissive: 0xfffbeb,
            emissiveIntensity: 2.0
        });
        const lens = new THREE.Mesh(lensGeo, lensMat);
        lens.position.set(0, 0.38, -0.28);
        this.steeringAssembly.add(lens);

        // SpotLight cone projecting forward
        this.spot = new THREE.SpotLight(0xfff7ed, 4.0, 35, Math.PI / 6, 0.4, 1.2);
        this.spot.position.set(0, 0.38, -0.3);
        this.spot.target.position.set(0, -0.5, -20);
        this.steeringAssembly.add(this.spot);
        this.steeringAssembly.add(this.spot.target);
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
        if (this.particles.length > 30) return;

        const p = new THREE.Mesh(this.particleGeo, this.particleMat.clone());
        p.position.copy(pos);
        p.position.y += (Math.random() - 0.5) * 0.1;
        p.scale.setScalar(Math.random() * 0.5 + 0.5);

        this.scene.add(p);
        this.particles.push({
            mesh: p,
            life: 1.0,
            velY: Math.random() * 0.8 + 0.3
        });
    }

    createHornPopup() {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 52px Impact, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('HONK! 🏍️', 128, 64);

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
            this.soundManager.playPaint();
        }
    }

    triggerBoost(duration = 2.5) {
        this.isBoosting = true;
        this.speed = Math.max(this.speed, 26);
        this.soundManager.playBoost();

        clearTimeout(this.boostTimer);
        this.boostTimer = setTimeout(() => {
            this.isBoosting = false;
        }, duration * 1000);
    }

    spawnNitroFlame(pos) {
        const flameGeo = new THREE.DodecahedronGeometry(0.14, 0);
        const flameMat = new THREE.MeshBasicMaterial({
            color: Math.random() > 0.4 ? 0x06b6d4 : 0xf97316,
            transparent: true,
            opacity: 0.9
        });
        const p = new THREE.Mesh(flameGeo, flameMat);
        p.position.copy(pos);
        this.scene.add(p);
        this.particles.push({
            mesh: p,
            life: 0.45,
            velY: Math.random() * 0.5 + 0.2
        });
    }

    reset() {
        this.body.position.set(0, 0.55, 0);
        this.body.quaternion.set(0, 0, 0, 1);
        this.body.velocity.set(0, 0, 0);
        this.body.angularVelocity.set(0, 0, 0);
        this.speed = 0;
        this.yaw = 0;
        this.steeringAngle = 0;
        this.leanAngle = 0;
        this.isBoosting = false;
    }

    update(controls, delta) {
        // 1. Steering & Dynamic Motorcycle Banking
        let targetSteer = 0;
        if (controls.left) targetSteer += this.maxSteeringAngle;
        if (controls.right) targetSteer -= this.maxSteeringAngle;

        this.steeringAngle = THREE.MathUtils.lerp(this.steeringAngle, targetSteer, delta * this.steerSpeed);

        // Heading: turn whether driving fast or stopped on grid
        let turnRate = 0;
        if (Math.abs(this.speed) > 0.1) {
            const dir = this.speed >= 0 ? 1 : -1;
            turnRate = this.steeringAngle * 3.4 * dir;
        } else if (controls.left || controls.right) {
            // Stationary pivot turn so bike never gets stuck
            turnRate = this.steeringAngle * 2.6;
        }
        this.yaw += turnRate * delta;

        // Bank into the turn when moving forward (authentic motorcycle lean)
        const speedRatio = Math.min(Math.abs(this.speed) / 15, 1.0);
        const targetLean = -this.steeringAngle * this.maxLean * speedRatio * (this.speed >= 0 ? 1 : -0.5);
        this.leanAngle = THREE.MathUtils.lerp(this.leanAngle, targetLean, delta * 8.0);
        this.leanGroup.rotation.z = this.leanAngle;

        // Visual handlebar & front fork steering
        this.steeringAssembly.rotation.y = this.steeringAngle;

        // 2. Acceleration / Braking
        this.isAccelerating = controls.forward || this.isBoosting;
        this.isBraking = controls.brake || controls.backward;
        this.isDrifting = controls.brake && Math.abs(this.speed) > 6;

        if (this.isBoosting) {
            const boostTopSpeed = 48;
            this.speed += 60 * delta;
            if (this.speed > boostTopSpeed) this.speed = boostTopSpeed;

            // Spawn nitro flames from exhaust
            if (this.exhaustR && Math.random() > 0.2) {
                const exhaustPos = new THREE.Vector3();
                this.exhaustR.getWorldPosition(exhaustPos);
                this.spawnNitroFlame(exhaustPos);
            }
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

        // 3. Brake light
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

        // Wake physics body so it never freezes
        this.body.wakeUp();

        // Strictly upright yaw quaternion (no accidental roll or pitch)
        const quatY = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
        this.body.quaternion.set(quatY.x, quatY.y, quatY.z, quatY.w);
        this.body.angularVelocity.set(0, 0, 0);

        // 5. Sync Mesh with Physics Body
        this.mesh.position.copy(this.body.position);
        this.mesh.quaternion.copy(quatY);

        // 6. Animate Wheels Rotation
        const wheelRotSpeed = (this.speed / 0.45) * delta;
        this.frontWheel.children[0].rotation.x -= wheelRotSpeed;
        this.rearWheel.children[0].rotation.x -= wheelRotSpeed;

        // Drift smoke from rear tire
        if (this.isDrifting && Math.random() > 0.3) {
            const worldPos = new THREE.Vector3();
            this.rearWheel.getWorldPosition(worldPos);
            this.spawnDriftPuff(worldPos);
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
