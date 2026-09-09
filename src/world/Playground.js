import * as THREE from 'three';
import * as CANNON from 'cannon-es';

/**
 * Interactive Stunt Playground (Bowling Pins, Dominoes, Ramps & Bouncing Balls)
 */
export class Playground {
    constructor(scene, physics) {
        this.scene = scene;
        this.physics = physics;
        this.updatables = [];

        this.center = { x: -45, z: -45 };

        this.createZonePlate();
        this.createBowlingPins();
        this.createDominoRun();
        this.createJumpingRamps();
        this.createBouncingBalls();
    }

    createZonePlate() {
        // Decorative floor pad with zone title
        const padGeo = new THREE.CylinderGeometry(20, 20, 0.1, 32);
        const padMat = new THREE.MeshStandardMaterial({
            color: 0x1e1b4b,
            roughness: 0.8
        });
        const pad = new THREE.Mesh(padGeo, padMat);
        pad.position.set(this.center.x, 0.05, this.center.z);
        pad.receiveShadow = true;
        this.scene.add(pad);

        // Zone 3D text / label billboard
        this.createBillboard('⚡ STUNT ARENA', this.center.x, 3.5, this.center.z - 17, 0xf59e0b);
    }

    createBillboard(text, x, y, z, color = 0xffffff) {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#0f172a';
        ctx.roundRect(10, 10, 492, 108, 20);
        ctx.fill();
        ctx.lineWidth = 6;
        ctx.strokeStyle = '#f59e0b';
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 44px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, 256, 64);

        const tex = new THREE.CanvasTexture(canvas);
        const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true });
        const geo = new THREE.PlaneGeometry(6, 1.5);
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        this.scene.add(mesh);

        // Stand posts
        const postMat = new THREE.MeshStandardMaterial({ color: 0x334155 });
        const postL = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, y), postMat);
        postL.position.set(x - 2.5, y / 2, z);
        const postR = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, y), postMat);
        postR.position.set(x + 2.5, y / 2, z);
        this.scene.add(postL);
        this.scene.add(postR);
    }

    createBowlingPins() {
        const pinBaseX = this.center.x - 4;
        const pinBaseZ = this.center.z - 6;

        // Pin geometries
        const pinGeo = new THREE.CylinderGeometry(0.18, 0.32, 1.4, 16);
        const pinMat = new THREE.MeshStandardMaterial({
            color: 0xf8fafc,
            roughness: 0.25,
            metalness: 0.1
        });

        const redStripeMat = new THREE.MeshStandardMaterial({
            color: 0xef4444,
            roughness: 0.3
        });
        const stripeGeo = new THREE.CylinderGeometry(0.23, 0.24, 0.22, 16);

        // Classic 10-pin triangle rows: 1, 2, 3, 4
        const rows = 4;
        let count = 0;
        const spacingX = 0.85;
        const spacingZ = 1.0;

        for (let r = 0; r < rows; r++) {
            const startX = pinBaseX - (r * spacingX) / 2;
            const currentZ = pinBaseZ - r * spacingZ;

            for (let c = 0; c <= r; c++) {
                const currentX = startX + c * spacingX;

                // Three.js visual pin
                const pinGroup = new THREE.Group();
                const pinBodyMesh = new THREE.Mesh(pinGeo, pinMat);
                pinBodyMesh.castShadow = true;
                pinGroup.add(pinBodyMesh);

                const stripeMesh = new THREE.Mesh(stripeGeo, redStripeMat);
                stripeMesh.position.y = 0.35;
                pinGroup.add(stripeMesh);

                pinGroup.position.set(currentX, 0.7, currentZ);
                this.scene.add(pinGroup);

                // Cannon physics body
                const pinShape = new CANNON.Cylinder(0.2, 0.32, 1.4, 12);
                const pinPhys = new CANNON.Body({
                    mass: 3.5,
                    material: this.physics.pinMaterial,
                    position: new CANNON.Vec3(currentX, 0.7, currentZ),
                    linearDamping: 0.1,
                    angularDamping: 0.1
                });
                pinPhys.addShape(pinShape);
                this.physics.world.addBody(pinPhys);

                this.updatables.push({ mesh: pinGroup, body: pinPhys });
                count++;
            }
        }
    }

    createDominoRun() {
        const dominoGeo = new THREE.BoxGeometry(0.2, 1.3, 0.6);
        const dominoMat = new THREE.MeshStandardMaterial({
            color: 0x3b82f6,
            roughness: 0.35,
            metalness: 0.15
        });

        const startX = this.center.x + 6;
        const startZ = this.center.z - 8;
        const count = 12;

        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 0.5;
            const x = startX + Math.sin(angle) * 7.5;
            const z = startZ + (1 - Math.cos(angle)) * 7.5;

            const mesh = new THREE.Mesh(dominoGeo, dominoMat);
            mesh.position.set(x, 0.65, z);
            mesh.rotation.y = angle;
            mesh.castShadow = true;
            this.scene.add(mesh);

            const shape = new CANNON.Box(new CANNON.Vec3(0.1, 0.65, 0.3));
            const body = new CANNON.Body({
                mass: 2.0,
                material: this.physics.obstacleMaterial,
                position: new CANNON.Vec3(x, 0.65, z),
                linearDamping: 0.1,
                angularDamping: 0.2
            });
            body.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), angle);
            body.addShape(shape);
            this.physics.world.addBody(body);

            this.updatables.push({ mesh, body });
        }
    }

    createJumpingRamps() {
        // Big launch ramp
        const rampWidth = 6;
        const rampLength = 8;
        const rampHeight = 2.4;

        // Visual ramp
        const rampGeo = new THREE.BufferGeometry();
        // Vertices for triangular wedge
        const vertices = new Float32Array([
            // Bottom face
            -rampWidth/2, 0, 0,
             rampWidth/2, 0, 0,
             rampWidth/2, 0, rampLength,
            -rampWidth/2, 0, rampLength,
            // Top slanted face
            -rampWidth/2, rampHeight, 0,
             rampWidth/2, rampHeight, 0
        ]);
        // Simple slanted box mesh
        const slopeGeo = new THREE.BoxGeometry(rampWidth, 0.3, rampLength);
        const slopeMat = new THREE.MeshStandardMaterial({
            color: 0xef4444,
            roughness: 0.4
        });
        const rampMesh = new THREE.Mesh(slopeGeo, slopeMat);
        const rampAngle = Math.atan2(rampHeight, rampLength);
        rampMesh.rotation.x = rampAngle;
        rampMesh.position.set(this.center.x, rampHeight / 2, this.center.z + 8);
        rampMesh.castShadow = true;
        rampMesh.receiveShadow = true;
        this.scene.add(rampMesh);

        // Yellow chevron warning stripes
        const stripeGeo = new THREE.PlaneGeometry(rampWidth - 0.4, 0.5);
        const stripeMat = new THREE.MeshStandardMaterial({ color: 0xfacc15 });
        for (let s = -2; s <= 2; s++) {
            const stripe = new THREE.Mesh(stripeGeo, stripeMat);
            stripe.rotation.x = -Math.PI / 2 + rampAngle;
            stripe.position.set(this.center.x, rampHeight / 2 + 0.18 + s * 0.35, this.center.z + 8 + s * 1.4);
            this.scene.add(stripe);
        }

        // Cannon Physics Ramp (rotated static box)
        const rampShape = new CANNON.Box(new CANNON.Vec3(rampWidth / 2, 0.15, rampLength / 2));
        const rampBody = new CANNON.Body({
            mass: 0, // static
            material: this.physics.groundMaterial,
            position: new CANNON.Vec3(this.center.x, rampHeight / 2, this.center.z + 8)
        });
        rampBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), rampAngle);
        rampBody.addShape(rampShape);
        this.physics.world.addBody(rampBody);
    }

    createBouncingBalls() {
        // Giant Beach Ball
        const ballRadius = 2.2;
        const ballGeo = new THREE.SphereGeometry(ballRadius, 32, 24);
        const ballMat = new THREE.MeshStandardMaterial({
            color: 0x10b981,
            roughness: 0.15,
            metalness: 0.1
        });
        const ballMesh = new THREE.Mesh(ballGeo, ballMat);
        ballMesh.castShadow = true;
        this.scene.add(ballMesh);

        const ballShape = new CANNON.Sphere(ballRadius);
        const ballBody = new CANNON.Body({
            mass: 12,
            material: this.physics.obstacleMaterial,
            position: new CANNON.Vec3(this.center.x - 10, 3, this.center.z),
            linearDamping: 0.2,
            angularDamping: 0.2
        });
        ballBody.addShape(ballShape);
        this.physics.world.addBody(ballBody);

        this.updatables.push({ mesh: ballMesh, body: ballBody });
    }

    update() {
        // Synchronize all physics bodies with Three.js meshes
        for (const item of this.updatables) {
            item.mesh.position.copy(item.body.position);
            item.mesh.quaternion.copy(item.body.quaternion);
        }
    }
}
