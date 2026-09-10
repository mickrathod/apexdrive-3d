import * as THREE from 'three';
import * as CANNON from 'cannon-es';

/**
 * Destructible Explosive Barrels, Giant Bowling Pins, Giant Stunt Ball & Mega Ramps
 */
export class StuntProps {
    constructor(scene, physics, soundManager, onStuntTrigger) {
        this.scene = scene;
        this.physics = physics;
        this.soundManager = soundManager;
        this.onStuntTrigger = onStuntTrigger;

        this.barrels = [];
        this.crates = [];
        this.bowlingPins = [];
        this.particles = [];

        this.createBarrelPyramid({ x: -28, z: -35 });
        this.createBarrelPyramid({ x: 25, z: -35 });
        this.createWoodenCratesStack({ x: -40, z: -15 });
        this.createMegaLaunchRamp({ x: -20, z: -25, rotY: Math.PI / 4 });
        this.createGiantBowlingAlley({ x: -48, z: 20 });
        this.createGiantStuntBall({ x: -30, z: -15 });
    }

    createBarrelPyramid(origin) {
        const barrelGeo = new THREE.CylinderGeometry(0.45, 0.45, 1.2, 16);
        const barrelMat = new THREE.MeshStandardMaterial({
            color: 0xef4444, // Bright Hazard Red
            roughness: 0.35,
            metalness: 0.4
        });
        const stripeMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.5 });
        const stripeGeo = new THREE.CylinderGeometry(0.46, 0.46, 0.25, 16);

        const shape = new CANNON.Cylinder(0.45, 0.45, 1.2, 12);
        const rows = 3;
        const yLevel = 0.65;

        for (let r = 0; r < rows; r++) {
            const count = rows - r;
            const startX = origin.x - (count * 1.05) / 2 + 0.52;

            for (let c = 0; c < count; c++) {
                const posX = startX + c * 1.08;
                const posY = yLevel + r * 1.25;
                const posZ = origin.z;

                const group = new THREE.Group();
                const mesh = new THREE.Mesh(barrelGeo, barrelMat);
                mesh.castShadow = true;
                mesh.receiveShadow = true;
                group.add(mesh);

                const stripe = new THREE.Mesh(stripeGeo, stripeMat);
                group.add(stripe);

                group.position.set(posX, posY, posZ);
                this.scene.add(group);

                const body = new CANNON.Body({
                    mass: 20,
                    material: this.physics.defaultMaterial,
                    shape: shape,
                    position: new CANNON.Vec3(posX, posY, posZ),
                    linearDamping: 0.15,
                    angularDamping: 0.25,
                    allowSleep: true,
                    sleepSpeedLimit: 0.15,
                    sleepTimeLimit: 0.4
                });
                this.physics.world.addBody(body);

                let exploded = false;
                body.addEventListener('collide', (e) => {
                    const relVel = e.contact.getImpactVelocityAlongNormal();
                    if (relVel > 6.0 && !exploded) {
                        exploded = true;
                        if (this.soundManager) this.soundManager.playExplosion();
                        this.spawnExplosionEffect(body.position);
                        if (this.onStuntTrigger) {
                            this.onStuntTrigger('💥 BARREL SMASH! +300 PTS');
                        }

                        // Blast impulse to nearby barrels
                        this.barrels.forEach(b => {
                            const d = body.position.distanceTo(b.body.position);
                            if (d > 0.1 && d < 6.0) {
                                const blastDir = b.body.position.vsub(body.position);
                                blastDir.normalize();
                                b.body.applyImpulse(
                                    new CANNON.Vec3(blastDir.x * 250, 180, blastDir.z * 250),
                                    b.body.position
                                );
                            }
                        });
                    }
                });

                this.barrels.push({ group, body });
            }
        }
    }

    createWoodenCratesStack(origin) {
        const crateGeo = new THREE.BoxGeometry(1.15, 1.15, 1.15);
        const crateMat = new THREE.MeshStandardMaterial({
            color: 0xd97706,
            roughness: 0.8
        });

        const shape = new CANNON.Box(new CANNON.Vec3(0.57, 0.57, 0.57));

        const positions = [
            { x: origin.x, y: 0.6, z: origin.z },
            { x: origin.x + 1.25, y: 0.6, z: origin.z },
            { x: origin.x - 1.25, y: 0.6, z: origin.z },
            { x: origin.x + 0.62, y: 1.78, z: origin.z },
            { x: origin.x - 0.62, y: 1.78, z: origin.z },
            { x: origin.x, y: 2.95, z: origin.z }
        ];

        positions.forEach(p => {
            const mesh = new THREE.Mesh(crateGeo, crateMat);
            mesh.position.set(p.x, p.y, p.z);
            mesh.castShadow = true;
            this.scene.add(mesh);

            const body = new CANNON.Body({
                mass: 18,
                material: this.physics.defaultMaterial,
                shape: shape,
                position: new CANNON.Vec3(p.x, p.y, p.z),
                linearDamping: 0.1,
                allowSleep: true,
                sleepSpeedLimit: 0.15,
                sleepTimeLimit: 0.4
            });
            this.physics.world.addBody(body);

            this.crates.push({ mesh, body });
        });
    }

    createGiantBowlingAlley(origin) {
        const pinGeo = new THREE.CylinderGeometry(0.3, 0.5, 2.2, 16);
        const pinMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });
        const ringMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.3 });
        const shape = new CANNON.Cylinder(0.35, 0.5, 2.2, 10);

        // Standard 10-pin triangle layout
        const spacing = 1.4;
        let pinIndex = 0;

        for (let row = 0; row < 4; row++) {
            const count = row + 1;
            const startX = origin.x - (count - 1) * (spacing / 2);
            const posZ = origin.z + row * spacing;

            for (let c = 0; c < count; c++) {
                const posX = startX + c * spacing;
                const posY = 1.1;

                const group = new THREE.Group();
                const pin = new THREE.Mesh(pinGeo, pinMat);
                pin.castShadow = true;
                group.add(pin);

                // Red neck rings
                const ring1 = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.14, 16), ringMat);
                ring1.position.y = 0.5;
                group.add(ring1);
                const ring2 = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.14, 16), ringMat);
                ring2.position.y = 0.25;
                group.add(ring2);

                group.position.set(posX, posY, posZ);
                this.scene.add(group);

                const body = new CANNON.Body({
                    mass: 14,
                    material: this.physics.defaultMaterial,
                    shape: shape,
                    position: new CANNON.Vec3(posX, posY, posZ),
                    linearDamping: 0.15,
                    angularDamping: 0.2,
                    allowSleep: true,
                    sleepSpeedLimit: 0.15,
                    sleepTimeLimit: 0.4
                });
                this.physics.world.addBody(body);

                this.bowlingPins.push({ group, body, knocked: false });
                pinIndex++;
            }
        }
    }

    createGiantStuntBall(origin) {
        const radius = 2.2;
        const ballGeo = new THREE.SphereGeometry(radius, 24, 24);
        const ballMat = new THREE.MeshStandardMaterial({
            color: 0x06b6d4, // Vibrant Cyan Stunt Ball
            roughness: 0.3,
            metalness: 0.2
        });

        this.ballMesh = new THREE.Mesh(ballGeo, ballMat);
        this.ballMesh.position.set(origin.x, radius, origin.z);
        this.ballMesh.castShadow = true;
        this.scene.add(this.ballMesh);

        this.ballBody = new CANNON.Body({
            mass: 25, // Light enough to be kicked around by car or bike
            material: this.physics.defaultMaterial,
            shape: new CANNON.Sphere(radius),
            position: new CANNON.Vec3(origin.x, radius, origin.z),
            linearDamping: 0.05,
            angularDamping: 0.05
        });
        this.physics.world.addBody(this.ballBody);
    }

    createMegaLaunchRamp(origin) {
        const rampGroup = new THREE.Group();
        rampGroup.position.set(origin.x, 0, origin.z);
        rampGroup.rotation.y = origin.rotY || 0;

        const width = 6.4;
        const length = 10.5;
        const height = 3.6;

        const shape = new THREE.Shape();
        shape.moveTo(-length / 2, 0);
        shape.lineTo(length / 2, 0);
        shape.lineTo(length / 2, height);
        shape.closePath();

        const geo = new THREE.ExtrudeGeometry(shape, { depth: width, bevelEnabled: false });
        const mat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.35 });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.rotation.y = Math.PI / 2;
        mesh.position.set(-width / 2, 0, 0);
        mesh.castShadow = true;
        rampGroup.add(mesh);

        // Neon chevron arrows on ramp face
        const arrowGeo = new THREE.PlaneGeometry(1.4, 1.4);
        const arrowMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });
        for (let i = 0; i < 3; i++) {
            const arrow = new THREE.Mesh(arrowGeo, arrowMat);
            arrow.position.set(0, 0.7 + i * 0.95, -length / 2 + 2.0 + i * 2.6);
            arrow.rotation.x = -0.38;
            arrow.rotation.y = Math.PI;
            rampGroup.add(arrow);
        }

        this.scene.add(rampGroup);

        const slopeGeo = new CANNON.Box(new CANNON.Vec3(width / 2, 0.2, length / 2));
        const slopeBody = new CANNON.Body({
            mass: 0,
            material: this.physics.groundMaterial,
            shape: slopeGeo,
            position: new CANNON.Vec3(origin.x, height / 2, origin.z)
        });
        slopeBody.quaternion.setFromEuler(-0.35, origin.rotY || 0, 0);
        this.physics.world.addBody(slopeBody);
    }

    spawnExplosionEffect(pos) {
        const count = 16;
        const geo = new THREE.DodecahedronGeometry(0.24, 0);

        for (let i = 0; i < count; i++) {
            const mat = new THREE.MeshBasicMaterial({
                color: Math.random() > 0.5 ? 0xef4444 : 0xf59e0b,
                transparent: true,
                opacity: 1.0
            });
            const p = new THREE.Mesh(geo, mat);
            p.position.set(pos.x, pos.y + 0.5, pos.z);
            this.scene.add(p);

            const vel = new THREE.Vector3(
                (Math.random() - 0.5) * 12,
                Math.random() * 8 + 4,
                (Math.random() - 0.5) * 12
            );

            this.particles.push({ mesh: p, vel, life: 1.0 });
        }
    }

    update(delta = 0.016) {
        // Barrels sync (skip sleeping bodies)
        for (const b of this.barrels) {
            if (b.body.sleepState !== CANNON.Body.SLEEPING) {
                b.group.position.copy(b.body.position);
                b.group.quaternion.copy(b.body.quaternion);
            }
        }

        // Crates sync (skip sleeping bodies)
        for (const c of this.crates) {
            if (c.body.sleepState !== CANNON.Body.SLEEPING) {
                c.mesh.position.copy(c.body.position);
                c.mesh.quaternion.copy(c.body.quaternion);
            }
        }

        // Bowling pins sync & strike check
        let knockedCount = 0;
        for (const p of this.bowlingPins) {
            if (p.body.sleepState !== CANNON.Body.SLEEPING) {
                p.group.position.copy(p.body.position);
                p.group.quaternion.copy(p.body.quaternion);
            }

            if (p.body.position.y < 0.6 || Math.abs(p.body.quaternion.x) > 0.4 || Math.abs(p.body.quaternion.z) > 0.4) {
                if (!p.knocked) {
                    p.knocked = true;
                    if (this.soundManager) this.soundManager.playCollision(0.8);
                }
                knockedCount++;
            }
        }

        if (knockedCount >= 6 && !this.strikeTriggered) {
            this.strikeTriggered = true;
            if (this.onStuntTrigger) {
                this.onStuntTrigger('🎳 STRIKE! BOWLING PINS CLEARED! +750 PTS');
            }
        }

        // Stunt ball sync
        if (this.ballMesh && this.ballBody) {
            this.ballMesh.position.copy(this.ballBody.position);
            this.ballMesh.quaternion.copy(this.ballBody.quaternion);
        }

        // Particles update
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.life -= delta * 2.0;
            p.mesh.position.addScaledVector(p.vel, delta);
            p.vel.y -= 9.8 * delta;
            p.mesh.material.opacity = p.life;

            if (p.life <= 0) {
                this.scene.remove(p.mesh);
                p.mesh.geometry.dispose();
                p.mesh.material.dispose();
                this.particles.splice(i, 1);
            }
        }
    }
}
