import * as THREE from 'three';

/**
 * Nitro Speed Boost Pads on the floor
 */
export class BoostPads {
    constructor(scene) {
        this.scene = scene;
        this.pads = [];

        this.padPositions = [
            { x: -45, z: -25, rot: 0 },         // Heading into stunt jump ramp
            { x: 0, z: -35, rot: -Math.PI / 2 }, // West to East highway
            { x: 45, z: 0, rot: 0 },            // North to South highway
            { x: -45, z: 15, rot: 0 }           // Towards contact zone
        ];

        this.createPads();
    }

    createPads() {
        const padGeo = new THREE.PlaneGeometry(3.6, 6.0);
        padGeo.rotateX(-Math.PI / 2);

        this.padPositions.forEach((p, idx) => {
            // Generate glowing chevron arrow texture
            const canvas = document.createElement('canvas');
            canvas.width = 128;
            canvas.height = 256;
            const ctx = canvas.getContext('2d');

            ctx.fillStyle = '#0f172a';
            ctx.fillRect(0, 0, 128, 256);

            // Three glowing neon chevrons
            ctx.fillStyle = '#06b6d4';
            for (let i = 0; i < 3; i++) {
                const y = 50 + i * 70;
                ctx.beginPath();
                ctx.moveTo(64, y - 30);
                ctx.lineTo(110, y + 25);
                ctx.lineTo(64, y);
                ctx.lineTo(18, y + 25);
                ctx.closePath();
                ctx.fill();
            }

            const tex = new THREE.CanvasTexture(canvas);
            const mat = new THREE.MeshBasicMaterial({
                map: tex,
                transparent: true,
                opacity: 0.95
            });

            const mesh = new THREE.Mesh(padGeo, mat);
            mesh.position.set(p.x, 0.08, p.z);
            mesh.rotation.y = p.rot;
            this.scene.add(mesh);

            this.pads.push({
                x: p.x,
                z: p.z,
                mesh: mesh,
                lastTriggerTime: 0
            });
        });
    }

    checkBike(bike) {
        if (!bike) return;
        const bikePos = bike.getPosition();
        const now = Date.now();

        for (const pad of this.pads) {
            const dist = Math.hypot(bikePos.x - pad.x, bikePos.z - pad.z);
            if (dist < 2.5 && now - pad.lastTriggerTime > 1500) {
                pad.lastTriggerTime = now;
                bike.triggerBoost(2.5);
                // Pulse pad glow
                pad.mesh.scale.set(1.15, 1, 1.15);
                setTimeout(() => pad.mesh.scale.set(1, 1, 1), 300);
            }
        }
    }
}
