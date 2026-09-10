import * as THREE from 'three';

/**
 * 3D Collectible Coins scattered across the world
 */
export class Collectibles {
    constructor(scene, soundManager, onScoreUpdate) {
        this.scene = scene;
        this.soundManager = soundManager;
        this.onScoreUpdate = onScoreUpdate;

        this.coins = [];
        this.collectedCount = 0;
        this.particles = [];

        this.coinPositions = [
            { x: 0, y: 1.2, z: 10 },      // Near start
            { x: -45, y: 1.2, z: -30 },   // Stunt arena entrance
            { x: -45, y: 3.2, z: -37 },   // On top of the jump ramp!
            { x: -55, y: 1.2, z: -50 },   // Near bowling pins
            { x: 45, y: 1.2, z: -30 },    // Project showcase zone
            { x: 45, y: 1.2, z: -60 },    // Far projects highway
            { x: 45, y: 1.2, z: 30 },     // Skills zone entrance
            { x: 45, y: 2.5, z: 50 },     // Behind skill blocks
            { x: -45, y: 1.2, z: 30 },    // Contact zone entrance
            { x: -45, y: 1.8, z: 50 }     // Near 3D mailbox
        ];

        this.createCoins();
    }

    createCoins() {
        const coinGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.12, 16);
        coinGeo.rotateX(Math.PI / 2);

        const coinMat = new THREE.MeshStandardMaterial({
            color: 0xf59e0b,
            metalness: 0.85,
            roughness: 0.2,
            emissive: 0xd97706,
            emissiveIntensity: 0.25
        });

        this.coinPositions.forEach((pos, index) => {
            const mesh = new THREE.Mesh(coinGeo, coinMat);
            mesh.position.set(pos.x, pos.y, pos.z);
            mesh.castShadow = true;
            this.scene.add(mesh);

            this.coins.push({
                id: index,
                mesh: mesh,
                baseY: pos.y,
                collected: false
            });
        });
    }

    spawnSparkles(pos) {
        const sparkleGeo = new THREE.DodecahedronGeometry(0.1, 0);
        const sparkleMat = new THREE.MeshBasicMaterial({ color: 0xfacc15, transparent: true, opacity: 1 });

        for (let i = 0; i < 8; i++) {
            const p = new THREE.Mesh(sparkleGeo, sparkleMat.clone());
            p.position.copy(pos);
            this.scene.add(p);
            this.particles.push({
                mesh: p,
                life: 0.6,
                vel: new THREE.Vector3(
                    (Math.random() - 0.5) * 4,
                    Math.random() * 4 + 2,
                    (Math.random() - 0.5) * 4
                )
            });
        }
    }

    update(bikePos, delta) {
        const time = performance.now() * 0.003;

        // Animate floating & spinning coins
        for (const coin of this.coins) {
            if (coin.collected) continue;

            coin.mesh.rotation.y += delta * 3.5;
            coin.mesh.position.y = coin.baseY + Math.sin(time + coin.id) * 0.2;

            // Check pickup distance
            if (bikePos) {
                const dist = Math.hypot(bikePos.x - coin.mesh.position.x, bikePos.z - coin.mesh.position.z);
                if (dist < 1.8) {
                    coin.collected = true;
                    this.scene.remove(coin.mesh);
                    this.soundManager.playCoin();
                    this.spawnSparkles(coin.mesh.position);
                    this.collectedCount++;

                    if (this.onScoreUpdate) {
                        this.onScoreUpdate(this.collectedCount, this.coins.length);
                    }
                }
            }
        }

        // Animate sparkle particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.life -= delta * 1.8;
            p.mesh.position.addScaledVector(p.vel, delta);
            p.mesh.material.opacity = p.life;

            if (p.life <= 0) {
                this.scene.remove(p.mesh);
                this.particles.splice(i, 1);
            }
        }
    }
}
