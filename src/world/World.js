import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { Playground } from './Playground.js';
import { ProjectsZone } from './ProjectsZone.js';
import { SkillsZone } from './SkillsZone.js';
import { ContactZone } from './ContactZone.js';
import { FloorLetters } from './FloorLetters.js';
import { Collectibles } from './Collectibles.js';
import { BoostPads } from './BoostPads.js';
import { BrickWall } from './BrickWall.js';
import { PaintShop } from './PaintShop.js';
import { RollerCoaster } from './RollerCoaster.js';
import { StuntProps } from './StuntProps.js';

export class World {
    constructor(scene, physics, modalManager, soundManager, onScoreUpdate) {
        this.scene = scene;
        this.physics = physics;
        this.modalManager = modalManager;
        this.soundManager = soundManager;
        this.onScoreUpdate = onScoreUpdate;
        this.currentZone = '🏁 CENTRAL SPAWN PLAZA';

        this.setupLighting();
        this.createFloor();
        this.createRoadGrid();
        this.createCentralPodium();
        this.createBorders();
        this.createEnvironmentProps();

        // 1. Giant 3D Physical Floor Letters (Directly from Bruno Simon's site)
        this.letters = new FloorLetters(this.scene, this.physics, 'MANAV', { x: 0, z: -8 });

        // 2. Destructible Brick Wall
        this.brickWall = new BrickWall(this.scene, this.physics, { x: -35, z: -55 });

        // 3. Interactive Paint Shop Station
        this.paintShop = new PaintShop(this.scene, { x: 0, z: 20 });

        // 4. Nitro Boost Speed Pads
        this.boostPads = new BoostPads(this.scene);

        // 5. Collectible Coins & Stars
        this.collectibles = new Collectibles(this.scene, this.soundManager, this.onScoreUpdate);

        // 6. Interactive Zones
        this.playground = new Playground(this.scene, this.physics);
        this.projectsZone = new ProjectsZone(this.scene, this.modalManager);
        this.skillsZone = new SkillsZone(this.scene, this.physics);
        this.contactZone = new ContactZone(this.scene, this.modalManager);

        // 7. Sky Roller Coaster & Stunt Loop
        this.rollerCoaster = new RollerCoaster(this.scene, this.physics, this.soundManager, this.onScoreUpdate);

        // 8. Destructible Hazard Barrels & Mega Launch Ramps
        this.stuntProps = new StuntProps(this.scene, this.physics, this.soundManager, (msg) => {
            if (this.modalManager?.showZoneBanner) {
                this.modalManager.showZoneBanner(msg);
            }
        });
    }

    setupLighting() {
        // Bruno Simon warm studio bounce light
        const hemiLight = new THREE.HemisphereLight(0xfff8ee, 0xd4c5b3, 1.5);
        this.scene.add(hemiLight);

        // Warm directional sunlight casting clean soft shadows
        this.sun = new THREE.DirectionalLight(0xffffff, 2.3);
        this.sun.position.set(65, 95, 55);
        this.sun.castShadow = true;

        // Optimized shadow configuration
        this.sun.shadow.mapSize.width = 1024;
        this.sun.shadow.mapSize.height = 1024;
        this.sun.shadow.camera.near = 10;
        this.sun.shadow.camera.far = 250;

        const d = 95;
        this.sun.shadow.camera.left = -d;
        this.sun.shadow.camera.right = d;
        this.sun.shadow.camera.top = d;
        this.sun.shadow.camera.bottom = -d;
        this.sun.shadow.bias = -0.0001;
        this.sun.shadow.normalBias = 0.04;

        this.scene.add(this.sun);

        // Cool blue rim light from opposite angle for cinematic contrast
        const rimLight = new THREE.DirectionalLight(0x93c5fd, 0.75);
        rimLight.position.set(-65, 45, -55);
        this.scene.add(rimLight);
    }

    createFloor() {
        // High-end stylized tactical grid texture on warm studio clay
        const floorCanvas = document.createElement('canvas');
        floorCanvas.width = 512;
        floorCanvas.height = 512;
        const fctx = floorCanvas.getContext('2d');

        // Warm clay background
        fctx.fillStyle = '#ded4c5';
        fctx.fillRect(0, 0, 512, 512);

        // Subtle architectural grid
        fctx.strokeStyle = 'rgba(195, 182, 165, 0.4)';
        fctx.lineWidth = 2;
        for (let i = 0; i <= 512; i += 64) {
            fctx.beginPath();
            fctx.moveTo(i, 0); fctx.lineTo(i, 512);
            fctx.stroke();
            fctx.beginPath();
            fctx.moveTo(0, i); fctx.lineTo(512, i);
            fctx.stroke();
        }

        // Tactile grid dot intersections
        fctx.fillStyle = 'rgba(150, 136, 118, 0.5)';
        for (let x = 0; x <= 512; x += 64) {
            for (let y = 0; y <= 512; y += 64) {
                fctx.beginPath();
                fctx.arc(x, y, 3, 0, Math.PI * 2);
                fctx.fill();
            }
        }

        const floorTex = new THREE.CanvasTexture(floorCanvas);
        floorTex.wrapS = THREE.RepeatWrapping;
        floorTex.wrapT = THREE.RepeatWrapping;
        floorTex.repeat.set(24, 24);

        const groundGeo = new THREE.PlaneGeometry(240, 240);
        const groundMat = new THREE.MeshStandardMaterial({
            map: floorTex,
            roughness: 0.88,
            metalness: 0.04
        });
        this.ground = new THREE.Mesh(groundGeo, groundMat);
        this.ground.rotation.x = -Math.PI / 2;
        this.ground.receiveShadow = true;
        this.scene.add(this.ground);
    }

    createRoadGrid() {
        // Connecting roads between zones
        const roadMat = new THREE.MeshStandardMaterial({ color: 0x222636, roughness: 0.8 });

        // Horizontal Highway
        const roadH = new THREE.Mesh(new THREE.PlaneGeometry(160, 10), roadMat);
        roadH.rotation.x = -Math.PI / 2;
        roadH.position.set(0, 0.02, -45);
        roadH.receiveShadow = true;
        this.scene.add(roadH);

        const roadH2 = new THREE.Mesh(new THREE.PlaneGeometry(160, 10), roadMat);
        roadH2.rotation.x = -Math.PI / 2;
        roadH2.position.set(0, 0.02, 45);
        roadH2.receiveShadow = true;
        this.scene.add(roadH2);

        // Vertical Highway
        const roadV = new THREE.Mesh(new THREE.PlaneGeometry(10, 160), roadMat);
        roadV.rotation.x = -Math.PI / 2;
        roadV.position.set(-45, 0.02, 0);
        roadV.receiveShadow = true;
        this.scene.add(roadV);

        const roadV2 = new THREE.Mesh(new THREE.PlaneGeometry(10, 160), roadMat);
        roadV2.rotation.x = -Math.PI / 2;
        roadV2.position.set(45, 0.02, 0);
        roadV2.receiveShadow = true;
        this.scene.add(roadV2);

        // Dashed centerlines
        const lineMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
        for (let i = -70; i <= 70; i += 7) {
            const dashH = new THREE.Mesh(new THREE.PlaneGeometry(3.5, 0.4), lineMat);
            dashH.rotation.x = -Math.PI / 2;
            dashH.position.set(i, 0.04, -45);
            this.scene.add(dashH);

            const dashH2 = new THREE.Mesh(new THREE.PlaneGeometry(3.5, 0.4), lineMat);
            dashH2.rotation.x = -Math.PI / 2;
            dashH2.position.set(i, 0.04, 45);
            this.scene.add(dashH2);
        }
    }

    createCentralPodium() {
        // Central spawn circle
        const spawnGeo = new THREE.CylinderGeometry(12, 12, 0.12, 32);
        const spawnMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6 });
        const spawn = new THREE.Mesh(spawnGeo, spawnMat);
        spawn.position.set(0, 0.06, 0);
        spawn.receiveShadow = true;
        this.scene.add(spawn);

        // Checkered starting grid
        const startLineGeo = new THREE.PlaneGeometry(6, 2.5);
        const startCanvas = document.createElement('canvas');
        startCanvas.width = 128;
        startCanvas.height = 64;
        const ctx = startCanvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 128, 64);
        ctx.fillStyle = '#000000';
        for (let r = 0; r < 2; r++) {
            for (let c = 0; c < 4; c++) {
                if ((r + c) % 2 === 0) {
                    ctx.fillRect(c * 32, r * 32, 32, 32);
                }
            }
        }
        const tex = new THREE.CanvasTexture(startCanvas);
        const startLine = new THREE.Mesh(startLineGeo, new THREE.MeshBasicMaterial({ map: tex }));
        startLine.rotation.x = -Math.PI / 2;
        startLine.position.set(0, 0.14, 4);
        this.scene.add(startLine);

        // Developer Info Podium in Center (placed cleanly at the north perimeter of spawn plaza)
        const podiumGeo = new THREE.BoxGeometry(7, 1.2, 3.5);
        const podiumMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.3 });
        const podium = new THREE.Mesh(podiumGeo, podiumMat);
        podium.position.set(0, 0.6, -18);
        podium.castShadow = true;
        this.scene.add(podium);

        // Physics body for podium
        const podiumShape = new CANNON.Box(new CANNON.Vec3(3.5, 0.6, 1.75));
        const podiumBody = new CANNON.Body({
            mass: 0,
            material: this.physics.obstacleMaterial,
            position: new CANNON.Vec3(0, 0.6, -18)
        });
        podiumBody.addShape(podiumShape);
        this.physics.world.addBody(podiumBody);

        // Text Billboard on Podium
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 256;
        const pCtx = canvas.getContext('2d');
        pCtx.fillStyle = '#0f172a';
        pCtx.fillRect(0, 0, 512, 256);
        pCtx.fillStyle = '#f59e0b';
        pCtx.font = 'bold 36px sans-serif';
        pCtx.fillText('WELCOME TO MY PORTFOLIO', 24, 60);
        pCtx.fillStyle = '#ffffff';
        pCtx.font = '24px sans-serif';
        pCtx.fillText('Drive around with WASD or Arrow Keys', 24, 115);
        pCtx.fillText('Knock over pins, smash skills, explore projects!', 24, 155);
        pCtx.fillStyle = '#10b981';
        pCtx.font = 'bold 24px sans-serif';
        pCtx.fillText('⚡ Press [C] to switch camera | [R] to reset', 24, 210);

        const infoTex = new THREE.CanvasTexture(canvas);
        const infoGeo = new THREE.PlaneGeometry(6.6, 3.3);
        const infoMesh = new THREE.Mesh(infoGeo, new THREE.MeshBasicMaterial({ map: infoTex }));
        infoMesh.position.set(0, 2.8, -18);
        this.scene.add(infoMesh);
    }

    createBorders() {
        const wallMat = new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.5 });
        const borderHalf = 95;
        const wallThickness = 2.0;
        const wallHeight = 2.5;

        const wallConfigs = [
            { x: 0, z: -borderHalf, w: borderHalf * 2, d: wallThickness },
            { x: 0, z: borderHalf, w: borderHalf * 2, d: wallThickness },
            { x: -borderHalf, z: 0, w: wallThickness, d: borderHalf * 2 },
            { x: borderHalf, z: 0, w: wallThickness, d: borderHalf * 2 }
        ];

        wallConfigs.forEach(cfg => {
            const mesh = new THREE.Mesh(new THREE.BoxGeometry(cfg.w, wallHeight, cfg.d), wallMat);
            mesh.position.set(cfg.x, wallHeight / 2, cfg.z);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            this.scene.add(mesh);

            // Cannon Static Physics Wall
            const shape = new CANNON.Box(new CANNON.Vec3(cfg.w / 2, wallHeight / 2, cfg.d / 2));
            const body = new CANNON.Body({
                mass: 0,
                material: this.physics.groundMaterial,
                position: new CANNON.Vec3(cfg.x, wallHeight / 2, cfg.z)
            });
            body.addShape(shape);
            this.physics.world.addBody(body);
        });
    }

    createEnvironmentProps() {
        // Low-poly Pine Trees
        const treePositions = [
            { x: -25, z: -25 }, { x: -20, z: -30 }, { x: 25, z: -25 }, { x: 30, z: -20 },
            { x: -25, z: 25 }, { x: -30, z: 20 }, { x: 25, z: 25 }, { x: 20, z: 30 },
            { x: 0, z: -70 }, { x: 0, z: 70 }, { x: -70, z: 0 }, { x: 70, z: 0 }
        ];

        const trunkGeo = new THREE.CylinderGeometry(0.3, 0.4, 1.8, 8);
        const trunkMat = new THREE.MeshStandardMaterial({ color: 0x543d2b });

        const foliageMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.7 });

        treePositions.forEach(p => {
            const tree = new THREE.Group();
            tree.position.set(p.x, 0, p.z);

            const trunk = new THREE.Mesh(trunkGeo, trunkMat);
            trunk.position.y = 0.9;
            trunk.castShadow = true;
            tree.add(trunk);

            // 3 stacked foliage cones
            for (let i = 0; i < 3; i++) {
                const cone = new THREE.Mesh(
                    new THREE.ConeGeometry(2.2 - i * 0.45, 2.0, 8),
                    foliageMat
                );
                cone.position.y = 2.0 + i * 1.3;
                cone.castShadow = true;
                tree.add(cone);
            }

            this.scene.add(tree);

            // Physics cylinder trunk for collisions
            const shape = new CANNON.Cylinder(0.4, 0.4, 5.0, 8);
            const body = new CANNON.Body({
                mass: 0,
                material: this.physics.groundMaterial,
                position: new CANNON.Vec3(p.x, 2.5, p.z)
            });
            body.addShape(shape);
            this.physics.world.addBody(body);
        });

        // Traffic Cones positioned at the sides of the starting gate
        const conePositions = [
            { x: -5.5, z: 4 }, { x: 5.5, z: 4 },
            { x: -35, z: -45 }, { x: -55, z: -45 }
        ];
        const coneGeo = new THREE.ConeGeometry(0.3, 0.9, 12);
        const coneMat = new THREE.MeshStandardMaterial({ color: 0xf97316 });
        conePositions.forEach(p => {
            const cMesh = new THREE.Mesh(coneGeo, coneMat);
            cMesh.position.set(p.x, 0.45, p.z);
            cMesh.castShadow = true;
            this.scene.add(cMesh);
        });
    }

    update(bike, delta) {
        if (!bike) return;
        const bikePos = bike.getPosition();

        this.playground.update();
        this.skillsZone.update();
        this.letters.update();
        this.brickWall.update();

        this.collectibles.update(bikePos, delta);
        this.boostPads.checkBike(bike);
        this.paintShop.checkBike(bike);

        this.projectsZone.checkVehicleInteraction(bikePos);
        this.contactZone.checkVehicleInteraction(bikePos);

        if (this.rollerCoaster) {
            this.rollerCoaster.update(bike, delta, (msg) => {
                if (this.modalManager?.showZoneBanner) {
                    this.modalManager.showZoneBanner(`🚀 ${msg}`);
                }
            });
        }
        if (this.stuntProps) {
            this.stuntProps.update(delta);
        }

        // Check which zone player is in and trigger banner ONLY when entering a new zone
        if (bikePos && this.modalManager?.showZoneBanner) {
            const x = bikePos.x;
            const y = bikePos.y;
            const z = bikePos.z;

            let zoneName = '🏁 CENTRAL SPAWN PLAZA';
            if (y > 6.0 || (x < -15 && z < -50)) {
                zoneName = '🎢 SKY ROLLER COASTER & DROP';
            } else if (x < -20 && z < -20) {
                zoneName = '⚡ STUNT & PHYSICS ARENA';
            } else if (x > 20 && z < -20) {
                zoneName = '💼 FEATURED PROJECTS ZONE';
            } else if (x > 20 && z > 20) {
                zoneName = '⚡ SKILLS DESTRUCTION ARENA';
            } else if (x < -20 && z > 20) {
                zoneName = '📬 CONTACT & SOCIAL ZONE';
            }

            if (zoneName !== this.currentZone) {
                this.currentZone = zoneName;
                this.modalManager.showZoneBanner(zoneName);
            }
        }
    }

    setTheme(themeName) {
        if (!this.ground) return;

        let bgColor = 0xcbc0b0;
        let fogColor = 0xcbc0b0;
        let sunColor = 0xffffff;
        let sunIntensity = 2.2;
        let groundColor = 0xded4c5;

        if (themeName === 'sunset') {
            bgColor = 0xca8a04;
            fogColor = 0xca8a04;
            sunColor = 0xfed7aa;
            sunIntensity = 2.8;
            groundColor = 0xd97706;
        } else if (themeName === 'night') {
            bgColor = 0x090d16;
            fogColor = 0x090d16;
            sunColor = 0x38bdf8;
            sunIntensity = 0.6;
            groundColor = 0x111827;
        }

        if (this.scene.background && this.scene.background.isColor) {
            this.scene.background.set(bgColor);
        } else {
            this.scene.background = new THREE.Color(bgColor);
        }

        if (this.scene.fog && this.scene.fog.color) {
            this.scene.fog.color.set(fogColor);
        }

        if (this.sun) {
            this.sun.color.set(sunColor);
            this.sun.intensity = sunIntensity;
        }

        if (this.ground && this.ground.material) {
            this.ground.material.color.set(groundColor);
        }
    }
}
