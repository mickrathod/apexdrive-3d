import * as THREE from 'three';
import * as CANNON from 'cannon-es';

const SKILLS_DATA = [
    { name: 'JavaScript', color: '#f7df1e', textColor: '#000000', icon: 'JS' },
    { name: 'TypeScript', color: '#3178c6', textColor: '#ffffff', icon: 'TS' },
    { name: 'Three.js', color: '#049ef4', textColor: '#ffffff', icon: '3D' },
    { name: 'React', color: '#61dafb', textColor: '#000000', icon: '⚛️' },
    { name: 'Python', color: '#3776ab', textColor: '#ffffff', icon: '🐍' },
    { name: 'Node.js', color: '#68a063', textColor: '#ffffff', icon: '🟢' },
    { name: 'Blender', color: '#e87d0d', textColor: '#ffffff', icon: '🎨' },
    { name: 'GLSL Shaders', color: '#ff4081', textColor: '#ffffff', icon: '✨' }
];

export class SkillsZone {
    constructor(scene, physics) {
        this.scene = scene;
        this.physics = physics;
        this.center = { x: 45, z: 45 };
        this.skillBlocks = [];

        this.createZonePlate();
        this.createSkillCubes();
    }

    createZonePlate() {
        const padGeo = new THREE.CylinderGeometry(20, 20, 0.1, 32);
        const padMat = new THREE.MeshStandardMaterial({
            color: 0x064e3b,
            roughness: 0.8
        });
        const pad = new THREE.Mesh(padGeo, padMat);
        pad.position.set(this.center.x, 0.05, this.center.z);
        pad.receiveShadow = true;
        this.scene.add(pad);

        this.createBillboard('⚡ SKILLS DESTRUCTION ARENA', this.center.x, 3.8, this.center.z - 17, 0x10b981);
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
        ctx.strokeStyle = '#10b981';
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 36px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, 256, 64);

        const tex = new THREE.CanvasTexture(canvas);
        const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true });
        const geo = new THREE.PlaneGeometry(6.5, 1.6);
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        this.scene.add(mesh);

        const postMat = new THREE.MeshStandardMaterial({ color: 0x334155 });
        const postL = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, y), postMat);
        postL.position.set(x - 2.8, y / 2, z);
        const postR = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, y), postMat);
        postR.position.set(x + 2.8, y / 2, z);
        this.scene.add(postL);
        this.scene.add(postR);
    }

    createSkillTexture(skill) {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');

        // Background
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, 0, 256, 256);

        // Colored rim border
        ctx.lineWidth = 14;
        ctx.strokeStyle = skill.color;
        ctx.strokeRect(7, 7, 242, 242);

        // Icon
        ctx.fillStyle = skill.color;
        ctx.font = 'bold 64px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(skill.icon, 128, 95);

        // Skill Name
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 26px sans-serif';
        ctx.fillText(skill.name, 128, 175);

        return new THREE.CanvasTexture(canvas);
    }

    createSkillCubes() {
        const cubeSize = 1.8;
        const halfSize = cubeSize / 2;
        const boxGeo = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);

        // Arrange in a pyramid / wall formation
        // Row 1 (Bottom): 4 cubes
        // Row 2 (Middle): 3 cubes
        // Row 3 (Top): 1 cube
        const positions = [
            // Bottom row
            { x: -3.3, y: halfSize, z: -1 },
            { x: -1.1, y: halfSize, z: -1 },
            { x: 1.1, y: halfSize, z: -1 },
            { x: 3.3, y: halfSize, z: -1 },
            // Middle row
            { x: -2.2, y: halfSize + cubeSize + 0.05, z: -1 },
            { x: 0, y: halfSize + cubeSize + 0.05, z: -1 },
            { x: 2.2, y: halfSize + cubeSize + 0.05, z: -1 },
            // Top crown
            { x: 0, y: halfSize + cubeSize * 2 + 0.1, z: -1 }
        ];

        SKILLS_DATA.forEach((skill, idx) => {
            const pos = positions[idx];
            const worldX = this.center.x + pos.x;
            const worldY = pos.y;
            const worldZ = this.center.z + pos.z;

            // Visual mesh
            const tex = this.createSkillTexture(skill);
            const mat = new THREE.MeshStandardMaterial({
                map: tex,
                roughness: 0.35,
                metalness: 0.1
            });
            const mesh = new THREE.Mesh(boxGeo, mat);
            mesh.position.set(worldX, worldY, worldZ);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            this.scene.add(mesh);

            // Cannon physics body
            const shape = new CANNON.Box(new CANNON.Vec3(halfSize, halfSize, halfSize));
            const body = new CANNON.Body({
                mass: 4.5, // Satisfying pushable weight
                material: this.physics.obstacleMaterial,
                position: new CANNON.Vec3(worldX, worldY, worldZ),
                linearDamping: 0.15,
                angularDamping: 0.2
            });
            body.addShape(shape);
            this.physics.world.addBody(body);

            this.skillBlocks.push({ mesh, body });
        });
    }

    update() {
        for (const item of this.skillBlocks) {
            item.mesh.position.copy(item.body.position);
            item.mesh.quaternion.copy(item.body.quaternion);
        }
    }
}
