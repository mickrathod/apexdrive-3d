import * as THREE from 'three';
import * as CANNON from 'cannon-es';

/**
 * 3D Physical Floor Letters (Directly inspired by Bruno Simon's giant 3D name letters)
 */
export class FloorLetters {
    constructor(scene, physics, text = 'MANAV', position = { x: 0, z: -10 }) {
        this.scene = scene;
        this.physics = physics;
        this.blocks = [];

        this.createLetters(text, position);
    }

    createLetters(text, position) {
        const letterWidth = 2.4;
        const letterHeight = 3.0;
        const letterDepth = 0.8;
        const spacing = 3.0;

        const totalWidth = text.length * spacing;
        const startX = position.x - totalWidth / 2 + spacing / 2;

        const letterMat = new THREE.MeshStandardMaterial({
            color: 0xef4444, // Bruno Simon signature red
            roughness: 0.3,
            metalness: 0.1
        });

        const fontCanvas = document.createElement('canvas');
        fontCanvas.width = 256;
        fontCanvas.height = 256;

        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            const posX = startX + i * spacing;
            const posY = letterHeight / 2;
            const posZ = position.z;

            // Texture for front & back with letter embossed
            const canvas = document.createElement('canvas');
            canvas.width = 256;
            canvas.height = 256;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#ef4444';
            ctx.fillRect(0, 0, 256, 256);

            // White letter
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 180px Impact, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(char, 128, 134);

            const tex = new THREE.CanvasTexture(canvas);
            const frontMat = new THREE.MeshStandardMaterial({
                map: tex,
                roughness: 0.3
            });

            const materials = [
                letterMat, letterMat, // right, left
                letterMat, letterMat, // top, bottom
                frontMat, frontMat    // front, back
            ];

            const geo = new THREE.BoxGeometry(letterWidth, letterHeight, letterDepth);
            const mesh = new THREE.Mesh(geo, materials);
            mesh.position.set(posX, posY, posZ);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            this.scene.add(mesh);

            // Cannon physics body (pushable 3D letters you can bump into!)
            const shape = new CANNON.Box(new CANNON.Vec3(letterWidth / 2, letterHeight / 2, letterDepth / 2));
            const body = new CANNON.Body({
                mass: 8.0, // Heavy enough to stand, light enough to bump
                material: this.physics.obstacleMaterial,
                position: new CANNON.Vec3(posX, posY, posZ),
                linearDamping: 0.2,
                angularDamping: 0.3,
                allowSleep: true,
                sleepSpeedLimit: 0.15,
                sleepTimeLimit: 0.4
            });
            body.addShape(shape);
            this.physics.world.addBody(body);

            this.blocks.push({ mesh, body });
        }
    }

    update() {
        for (const item of this.blocks) {
            if (item.body.sleepState !== CANNON.Body.SLEEPING) {
                item.mesh.position.copy(item.body.position);
                item.mesh.quaternion.copy(item.body.quaternion);
            }
        }
    }
}
