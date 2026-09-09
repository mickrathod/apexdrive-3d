import * as THREE from 'three';

export const PROJECTS_DATA = [
    {
        id: 'outreach-bot',
        category: 'AI & AUTOMATION',
        title: 'AI Lead Outreach & Prospecting Engine',
        description: 'An automated B2B prospecting tool that scrapes target leads across Instagram, LinkedIn, and Google Maps, analyzes their online presence using local LLMs, and queues hyper-personalized outreach sequences.',
        highlights: [
            'Multi-platform scraping with stealth headless browser automation',
            'Context-aware message personalization based on profile bios & recent posts',
            'Automated delivery queue with human-like randomized jitter delays to protect accounts',
            'Comprehensive analytics dashboard tracking open, response, and conversion rates'
        ],
        tags: ['Playwright', 'Python', 'FastAPI', 'Automation', 'Local LLMs'],
        demoUrl: '#',
        githubUrl: 'https://github.com',
        color: '#f97316'
    },
    {
        id: 'doc-organizer',
        category: 'DESKTOP AUTOMATION',
        title: 'Smart Offline Document & PDF Organizer',
        description: 'A 100% offline privacy-first desktop application that reads internal PDF text, classifies invoices, receipts, and contracts, extracts dates and vendor names, and automatically standardizes messy file archives.',
        highlights: [
            'Zero API keys required — completely offline and privacy-compliant for legal & accounting',
            'Smart rule-based heuristic extraction for vendor names, dates, amounts, and invoice numbers',
            'Dry-run preview table and 1-click batch undo rollback engine',
            'Live background filesystem watchdog for real-time downloads sorting'
        ],
        tags: ['Python', 'pypdf', 'Tkinter', 'Watchdog', 'Desktop Automation'],
        demoUrl: '#',
        githubUrl: 'https://github.com',
        color: '#3b82f6'
    },
    {
        id: 'physics-portfolio',
        category: 'CREATIVE 3D WEB',
        title: 'Interactive 3D Physics Web Engine',
        description: 'A Bruno Simon-inspired 3D physics portfolio built from scratch with Three.js and Cannon-es, featuring arcade car physics, destructible bowling pins, procedural Web Audio sound synthesis, and real-time radar.',
        highlights: [
            'Custom arcade vehicle dynamics with steering, drifting, and suspension',
            'Procedural Web Audio API sound engine with dynamic engine RPM pitch and horn synthesis',
            'Destructible physics props (pins, domino runs, jump ramps, smashable skill cubes)',
            'Ultra-smooth isometric camera follow and glassmorphic HUD controls'
        ],
        tags: ['Three.js', 'Cannon-es', 'WebGL', 'Web Audio API', 'Vite'],
        demoUrl: '#',
        githubUrl: 'https://github.com',
        color: '#10b981'
    },
    {
        id: 'collab-canvas',
        category: 'FULL-STACK REALTIME',
        title: 'Realtime Multiplayer Infinite Canvas',
        description: 'A high-performance collaborative design board and vector graphics whiteboard that lets distributed teams sketch, annotate, and brainstorm in real-time with zero lag.',
        highlights: [
            'WebSocket binary CRDT synchronization for seamless conflict-free collaborative editing',
            'Infinite canvas viewport with smooth GPU-accelerated panning and zooming',
            'Multiplayer live cursor broadcasting with user presence indicators',
            'Export to SVG, high-res PNG, and JSON serialization'
        ],
        tags: ['TypeScript', 'WebSockets', 'Canvas API', 'Node.js', 'Tailwind'],
        demoUrl: '#',
        githubUrl: 'https://github.com',
        color: '#8b5cf6'
    }
];

export class ProjectsZone {
    constructor(scene, modalManager) {
        this.scene = scene;
        this.modalManager = modalManager;
        this.center = { x: 45, z: -45 };
        this.projectStands = [];

        this.createZonePlate();
        this.createProjectStands();
    }

    createZonePlate() {
        // Floor plate for project area
        const padGeo = new THREE.CylinderGeometry(24, 24, 0.1, 32);
        const padMat = new THREE.MeshStandardMaterial({
            color: 0x0f172a,
            roughness: 0.8
        });
        const pad = new THREE.Mesh(padGeo, padMat);
        pad.position.set(this.center.x, 0.05, this.center.z);
        pad.receiveShadow = true;
        this.scene.add(pad);

        // Zone 3D text banner
        this.createBillboard('💼 PROJECTS SHOWCASE', this.center.x, 4.0, this.center.z - 20, 0x3b82f6);
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
        ctx.strokeStyle = '#3b82f6';
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 40px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, 256, 64);

        const tex = new THREE.CanvasTexture(canvas);
        const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true });
        const geo = new THREE.PlaneGeometry(7, 1.75);
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        this.scene.add(mesh);

        const postMat = new THREE.MeshStandardMaterial({ color: 0x334155 });
        const postL = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, y), postMat);
        postL.position.set(x - 3, y / 2, z);
        const postR = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, y), postMat);
        postR.position.set(x + 3, y / 2, z);
        this.scene.add(postL);
        this.scene.add(postR);
    }

    createProjectStands() {
        const offsets = [
            { x: -10, z: -8 },
            { x: 10, z: -8 },
            { x: -10, z: 8 },
            { x: 10, z: 8 }
        ];

        PROJECTS_DATA.forEach((data, index) => {
            const posX = this.center.x + offsets[index].x;
            const posZ = this.center.z + offsets[index].z;

            const standGroup = new THREE.Group();
            standGroup.position.set(posX, 0, posZ);

            // 1. Billboard Screen
            const screenCanvas = document.createElement('canvas');
            screenCanvas.width = 512;
            screenCanvas.height = 320;
            const ctx = screenCanvas.getContext('2d');

            // Dark glass style screen
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(0, 0, 512, 320);

            // Accent header
            ctx.fillStyle = data.color;
            ctx.fillRect(0, 0, 512, 40);

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 20px sans-serif';
            ctx.fillText(data.category, 20, 28);

            // Title
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 28px sans-serif';
            ctx.fillText(data.title.slice(0, 26), 20, 95);
            if (data.title.length > 26) {
                ctx.fillText(data.title.slice(26), 20, 130);
            }

            // Tags pills
            ctx.font = 'bold 18px sans-serif';
            let tagX = 20;
            data.tags.slice(0, 3).forEach(t => {
                ctx.fillStyle = 'rgba(255,255,255,0.15)';
                const tw = ctx.measureText(t).width + 24;
                ctx.roundRect(tagX, 220, tw, 36, 12);
                ctx.fill();
                ctx.fillStyle = '#e2e8f0';
                ctx.fillText(t, tagX + 12, 244);
                tagX += tw + 12;
            });

            // Action prompt
            ctx.fillStyle = data.color;
            ctx.font = 'bold 22px sans-serif';
            ctx.fillText('⚡ DRIVE IN TO VIEW DETAILS', 20, 290);

            const screenTex = new THREE.CanvasTexture(screenCanvas);
            const screenGeo = new THREE.BoxGeometry(4.2, 2.6, 0.15);
            const screenMat = new THREE.MeshStandardMaterial({
                map: screenTex,
                roughness: 0.2,
                metalness: 0.1
            });
            const screenMesh = new THREE.Mesh(screenGeo, screenMat);
            screenMesh.position.set(0, 2.8, 0);
            screenMesh.castShadow = true;
            standGroup.add(screenMesh);

            // Stand pillars
            const postMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.5 });
            const post = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 2.8), postMat);
            post.position.set(0, 1.4, 0);
            standGroup.add(post);

            // 2. Glowing Interactive Floor Trigger Ring
            const ringGeo = new THREE.RingGeometry(2.4, 3.2, 32);
            ringGeo.rotateX(-Math.PI / 2);
            const ringMat = new THREE.MeshBasicMaterial({
                color: new THREE.Color(data.color),
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.45
            });
            const ringMesh = new THREE.Mesh(ringGeo, ringMat);
            ringMesh.position.y = 0.08;
            standGroup.add(ringMesh);

            this.scene.add(standGroup);

            this.projectStands.push({
                data: data,
                x: posX,
                z: posZ,
                radius: 3.5,
                ringMesh: ringMesh,
                baseColor: data.color
            });
        });
    }

    checkVehicleInteraction(carPos) {
        if (!carPos) return;

        let foundNear = false;
        for (const stand of this.projectStands) {
            const dist = Math.hypot(carPos.x - stand.x, carPos.z - stand.z);
            if (dist < stand.radius) {
                // Glow trigger ring brighter
                stand.ringMesh.material.opacity = 0.9;
                stand.ringMesh.scale.setScalar(1.0 + Math.sin(Date.now() * 0.008) * 0.08);

                // Open modal if not already opened
                if (this.currentNearby !== stand.data.id) {
                    this.currentNearby = stand.data.id;
                    this.modalManager.openProject(stand.data);
                }
                foundNear = true;
                break;
            } else {
                stand.ringMesh.material.opacity = 0.4;
                stand.ringMesh.scale.set(1, 1, 1);
            }
        }

        if (!foundNear) {
            this.currentNearby = null;
        }
    }
}
