import * as THREE from 'three';

const SOCIAL_STATIONS = [
    { id: 'github', name: 'GitHub', icon: '🐙', url: 'https://github.com', color: '#6e5494', x: -6, z: -5 },
    { id: 'linkedin', name: 'LinkedIn', icon: '💼', url: 'https://linkedin.com', color: '#0077b5', x: 6, z: -5 },
    { id: 'twitter', name: 'Twitter / X', icon: '🐦', url: 'https://twitter.com', color: '#1da1f2', x: -6, z: 5 },
    { id: 'email', name: 'Email Me', icon: '✉️', url: 'mailto:hello@example.com', color: '#ef4444', x: 6, z: 5 }
];

export class ContactZone {
    constructor(scene, modalManager) {
        this.scene = scene;
        this.modalManager = modalManager;
        this.center = { x: -45, z: 45 };
        this.stations = [];

        this.createZonePlate();
        this.createCentralMailbox();
        this.createSocialPillars();
    }

    createZonePlate() {
        const padGeo = new THREE.CylinderGeometry(20, 20, 0.1, 32);
        const padMat = new THREE.MeshStandardMaterial({
            color: 0x2e1065,
            roughness: 0.8
        });
        const pad = new THREE.Mesh(padGeo, padMat);
        pad.position.set(this.center.x, 0.05, this.center.z);
        pad.receiveShadow = true;
        this.scene.add(pad);

        this.createBillboard('📬 CONTACT & SOCIALS', this.center.x, 3.8, this.center.z - 17, 0x8b5cf6);
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
        ctx.strokeStyle = '#8b5cf6';
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 38px sans-serif';
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

    createCentralMailbox() {
        // Cute 3D Mailbox in the center of the zone
        const mailboxGroup = new THREE.Group();
        mailboxGroup.position.set(this.center.x, 0, this.center.z);

        // Wooden post
        const postGeo = new THREE.CylinderGeometry(0.15, 0.15, 1.6);
        const postMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 });
        const post = new THREE.Mesh(postGeo, postMat);
        post.position.y = 0.8;
        post.castShadow = true;
        mailboxGroup.add(post);

        // Red mailbox body
        const boxGeo = new THREE.BoxGeometry(0.8, 0.7, 1.3);
        const boxMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.3 });
        const box = new THREE.Mesh(boxGeo, boxMat);
        box.position.y = 1.7;
        box.castShadow = true;
        mailboxGroup.add(box);

        // Mailbox roof curve
        const curveGeo = new THREE.CylinderGeometry(0.4, 0.4, 1.3, 16, 1, false, 0, Math.PI);
        curveGeo.rotateZ(Math.PI / 2);
        curveGeo.rotateY(Math.PI / 2);
        const curve = new THREE.Mesh(curveGeo, boxMat);
        curve.position.y = 2.05;
        mailboxGroup.add(curve);

        // Mailbox trigger pad
        const ringGeo = new THREE.RingGeometry(2.0, 2.6, 32);
        ringGeo.rotateX(-Math.PI / 2);
        const ringMat = new THREE.MeshBasicMaterial({
            color: 0xef4444,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.5
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.position.y = 0.08;
        mailboxGroup.add(ring);

        this.scene.add(mailboxGroup);

        this.stations.push({
            id: 'central-mail',
            name: 'Contact Form',
            x: this.center.x,
            z: this.center.z,
            radius: 3.0,
            ringMesh: ring,
            isMailbox: true
        });
    }

    createSocialPillars() {
        SOCIAL_STATIONS.forEach(social => {
            const posX = this.center.x + social.x;
            const posZ = this.center.z + social.z;

            const pillarGroup = new THREE.Group();
            pillarGroup.position.set(posX, 0, posZ);

            // Pillar base
            const baseGeo = new THREE.CylinderGeometry(0.9, 1.1, 1.4, 24);
            const baseMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4 });
            const base = new THREE.Mesh(baseGeo, baseMat);
            base.position.y = 0.7;
            base.castShadow = true;
            pillarGroup.add(base);

            // Floating 3D Icon Sprite
            const canvas = document.createElement('canvas');
            canvas.width = 256;
            canvas.height = 256;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = social.color;
            ctx.beginPath();
            ctx.arc(128, 128, 110, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 100px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(social.icon, 128, 134);

            const tex = new THREE.CanvasTexture(canvas);
            const spriteMat = new THREE.SpriteMaterial({ map: tex });
            const sprite = new THREE.Sprite(spriteMat);
            sprite.position.y = 2.4;
            sprite.scale.set(1.8, 1.8, 1);
            pillarGroup.add(sprite);

            // Interactive ring
            const ringGeo = new THREE.RingGeometry(1.8, 2.3, 32);
            ringGeo.rotateX(-Math.PI / 2);
            const ringMat = new THREE.MeshBasicMaterial({
                color: new THREE.Color(social.color),
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.45
            });
            const ring = new THREE.Mesh(ringGeo, ringMat);
            ring.position.y = 0.08;
            pillarGroup.add(ring);

            this.scene.add(pillarGroup);

            this.stations.push({
                ...social,
                x: posX,
                z: posZ,
                radius: 2.8,
                ringMesh: ring,
                sprite: sprite
            });
        });
    }

    checkVehicleInteraction(carPos) {
        if (!carPos) return;

        let found = false;
        for (const station of this.stations) {
            const dist = Math.hypot(carPos.x - station.x, carPos.z - station.z);
            if (dist < station.radius) {
                station.ringMesh.material.opacity = 0.9;
                if (this.currentActive !== station.id) {
                    this.currentActive = station.id;
                    this.modalManager.openContact();
                }
                found = true;
                break;
            } else {
                station.ringMesh.material.opacity = 0.4;
            }
        }

        if (!found) {
            this.currentActive = null;
        }
    }
}
