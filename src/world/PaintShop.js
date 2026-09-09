import * as THREE from 'three';

const PAINT_COLORS = [
    { name: 'Poppy Red', hex: 0xef4444, x: -6, z: 0 },
    { name: 'Electric Cyan', hex: 0x06b6d4, x: -3, z: 0 },
    { name: 'Acid Lime', hex: 0x84cc16, x: 0, z: 0 },
    { name: 'Cyber Gold', hex: 0xf59e0b, x: 3, z: 0 },
    { name: 'Neon Violet', hex: 0xa855f7, x: 6, z: 0 }
];

/**
 * Interactive 3D Bike Paint Customization Station
 */
export class PaintShop {
    constructor(scene, center = { x: 0, z: 20 }) {
        this.scene = scene;
        this.center = center;
        this.pads = [];

        this.createPlatform();
        this.createColorPads();
    }

    createPlatform() {
        // Base plate
        const baseGeo = new THREE.BoxGeometry(18, 0.12, 6);
        const baseMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 });
        const base = new THREE.Mesh(baseGeo, baseMat);
        base.position.set(this.center.x, 0.06, this.center.z);
        base.receiveShadow = true;
        this.scene.add(base);

        // Sign Billboard
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#0f172a';
        ctx.roundRect(10, 10, 492, 108, 16);
        ctx.fill();
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#f59e0b';
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 36px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🎨 BIKE PAINT SHOP', 256, 64);

        const tex = new THREE.CanvasTexture(canvas);
        const signGeo = new THREE.PlaneGeometry(6, 1.5);
        const sign = new THREE.Mesh(signGeo, new THREE.MeshBasicMaterial({ map: tex, transparent: true }));
        sign.position.set(this.center.x, 3.2, this.center.z + 3.2);
        this.scene.add(sign);

        const postMat = new THREE.MeshStandardMaterial({ color: 0x334155 });
        const p1 = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 3.2), postMat);
        p1.position.set(this.center.x - 2.5, 1.6, this.center.z + 3.2);
        const p2 = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 3.2), postMat);
        p2.position.set(this.center.x + 2.5, 1.6, this.center.z + 3.2);
        this.scene.add(p1);
        this.scene.add(p2);
    }

    createColorPads() {
        const ringGeo = new THREE.CylinderGeometry(1.2, 1.2, 0.15, 24);

        PAINT_COLORS.forEach(c => {
            const posX = this.center.x + c.x;
            const posZ = this.center.z + c.z;

            const mat = new THREE.MeshStandardMaterial({
                color: c.hex,
                roughness: 0.3,
                emissive: c.hex,
                emissiveIntensity: 0.2
            });

            const padMesh = new THREE.Mesh(ringGeo, mat);
            padMesh.position.set(posX, 0.14, posZ);
            padMesh.castShadow = true;
            this.scene.add(padMesh);

            this.pads.push({
                name: c.name,
                hex: c.hex,
                x: posX,
                z: posZ,
                mesh: padMesh,
                lastApplied: 0
            });
        });
    }

    checkBike(bike) {
        if (!bike) return;
        const bikePos = bike.getPosition();
        const now = Date.now();

        for (const pad of this.pads) {
            const dist = Math.hypot(bikePos.x - pad.x, bikePos.z - pad.z);
            if (dist < 1.4 && now - pad.lastApplied > 1200) {
                pad.lastApplied = now;
                bike.setColor(pad.hex);
                // Visual bounce on pad
                pad.mesh.scale.set(1.2, 1.2, 1.2);
                setTimeout(() => pad.mesh.scale.set(1, 1, 1), 250);
            }
        }
    }
}
