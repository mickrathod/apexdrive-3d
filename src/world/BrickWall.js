import * as THREE from 'three';
import * as CANNON from 'cannon-es';

/**
 * Destructible Physical Brick Wall
 */
export class BrickWall {
    constructor(scene, physics, position = { x: -35, z: -55 }) {
        this.scene = scene;
        this.physics = physics;
        this.bricks = [];

        this.createWall(position);
    }

    createWall(pos) {
        const brickW = 1.6;
        const brickH = 0.7;
        const brickD = 0.8;

        const rows = 4;
        const cols = 6;

        const brickGeo = new THREE.BoxGeometry(brickW - 0.05, brickH - 0.05, brickD - 0.05);
        const brickMat = new THREE.MeshStandardMaterial({
            color: 0xc2410c, // Terracotta / clay brick red
            roughness: 0.85
        });

        const halfW = (cols * brickW) / 2;

        for (let r = 0; r < rows; r++) {
            const rowOffset = (r % 2 === 1) ? brickW / 4 : 0;
            const y = pos.y || (brickH / 2 + r * brickH);

            for (let c = 0; c < cols; c++) {
                const x = pos.x - halfW + c * brickW + rowOffset;
                const z = pos.z;

                const mesh = new THREE.Mesh(brickGeo, brickMat);
                mesh.position.set(x, y, z);
                mesh.castShadow = true;
                mesh.receiveShadow = true;
                this.scene.add(mesh);

                const shape = new CANNON.Box(new CANNON.Vec3(brickW / 2, brickH / 2, brickD / 2));
                const body = new CANNON.Body({
                    mass: 1.8,
                    material: this.physics.obstacleMaterial,
                    position: new CANNON.Vec3(x, y, z),
                    linearDamping: 0.1,
                    angularDamping: 0.2
                });
                body.addShape(shape);
                this.physics.world.addBody(body);

                this.bricks.push({ mesh, body });
            }
        }
    }

    update() {
        for (const b of this.bricks) {
            b.mesh.position.copy(b.body.position);
            b.mesh.quaternion.copy(b.body.quaternion);
        }
    }
}
