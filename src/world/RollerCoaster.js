import * as THREE from 'three';
import * as CANNON from 'cannon-es';

/**
 * 3D Driveable Sky Roller Coaster & Mega Drop Circuit
 * Built with mathematically continuous spline segments, physical guardrails,
 * trestle support towers, lift-chain boost assist, and mid-air stunt rings.
 */
export class RollerCoaster {
    constructor(scene, physics, soundManager, onScoreUpdate) {
        this.scene = scene;
        this.physics = physics;
        this.soundManager = soundManager;
        this.onScoreUpdate = onScoreUpdate;

        this.rings = [];
        this.trackMeshes = [];
        this.collisionBodies = [];
        this.lastLaunchTime = 0;
        this.lastLiftSoundTime = 0;

        // Waypoints defining continuous 3D rollercoaster path
        this.waypoints = [
            new THREE.Vector3(0, -0.05, -45),    // 0: Flush with main road asphalt
            new THREE.Vector3(-8, 0.7, -46),     // 1: Smooth lead-in ramp
            new THREE.Vector3(-18, 3.8, -49),    // 2: Ascending lift hill
            new THREE.Vector3(-28, 8.5, -54),    // 3: Lift chain climb
            new THREE.Vector3(-38, 14.2, -59),   // 4: High sky ascent
            new THREE.Vector3(-48, 19.8, -62),   // 5: Approaching the summit
            new THREE.Vector3(-58, 22.5, -62),   // 6: THE SKY SUMMIT APEX (y = 22.5m!)
            new THREE.Vector3(-66, 21.0, -60),   // 7: Summit crest plateau
            new THREE.Vector3(-76, 11.5, -53),   // 8: THE MEGA HYPER DROP (55° steep drop!)
            new THREE.Vector3(-83, 3.2, -42),    // 9: Drop valley swoop compression
            new THREE.Vector3(-85, 4.8, -26),    // 10: Banked supersonic perimeter turn
            new THREE.Vector3(-78, 7.8, -10),    // 11: Sweeping turn toward east
            new THREE.Vector3(-66, 11.2, 0),     // 12: Sky straightaway bridge
            new THREE.Vector3(-50, 13.8, 6),     // 13: Elevated sky corridor
            new THREE.Vector3(-34, 15.2, 2),     // 14: Mid-air bridge over arena
            new THREE.Vector3(-18, 16.8, -8),    // 15: Launch kicker approach
            new THREE.Vector3(-4, 18.2, -18)     // 16: Launch kicker lip (25° angle into sky!)
        ];

        this.createCoasterTrack();
        this.createTrestleTowers();
        this.createSkyRings();
        this.createEntranceArch();
        this.createApexArch();
    }

    createCoasterTrack() {
        const roadMat = new THREE.MeshStandardMaterial({
            color: 0x1e293b,
            roughness: 0.85,
            metalness: 0.1
        });
        const railMat = new THREE.MeshStandardMaterial({
            color: 0x06b6d4, // Glowing Cyan
            emissive: 0x0891b2,
            emissiveIntensity: 0.6,
            roughness: 0.2,
            metalness: 0.8
        });
        const tieMat = new THREE.MeshStandardMaterial({
            color: 0xf59e0b, // Amber cross-ties
            roughness: 0.5
        });
        const guardrailMat = new THREE.MeshStandardMaterial({
            color: 0xef4444, // Hazard Red
            roughness: 0.4
        });
        const dashMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });

        const trackWidth = 4.6;
        const trackThickness = 0.35;
        const barrierHeight = 0.85;

        for (let i = 0; i < this.waypoints.length - 1; i++) {
            const pA = this.waypoints[i];
            const pB = this.waypoints[i + 1];

            const dir = new THREE.Vector3().subVectors(pB, pA);
            const length = dir.length();
            const mid = new THREE.Vector3().addVectors(pA, pB).multiplyScalar(0.5);

            // Compute rotation quaternion pointing from (0, 0, 1) to dir
            const dirNorm = dir.clone().normalize();
            const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), dirNorm);

            const segmentGroup = new THREE.Group();
            segmentGroup.position.copy(mid);
            segmentGroup.quaternion.copy(quat);

            // 1. Roadbed Surface Box
            const bedGeo = new THREE.BoxGeometry(trackWidth, trackThickness, length);
            const bedMesh = new THREE.Mesh(bedGeo, roadMat);
            bedMesh.castShadow = true;
            bedMesh.receiveShadow = true;
            segmentGroup.add(bedMesh);

            // 2. Glowing Neon Tubular Rails (Left & Right)
            const railGeo = new THREE.CylinderGeometry(0.14, 0.14, length, 12);
            railGeo.rotateX(Math.PI / 2);

            const railL = new THREE.Mesh(railGeo, railMat);
            railL.position.set(-trackWidth / 2 + 0.12, trackThickness / 2 + 0.4, 0);
            segmentGroup.add(railL);

            const railR = new THREE.Mesh(railGeo, railMat);
            railR.position.set(trackWidth / 2 - 0.12, trackThickness / 2 + 0.4, 0);
            segmentGroup.add(railR);

            // 3. Safety Guardrails (Left & Right Barriers)
            const barGeo = new THREE.BoxGeometry(0.18, barrierHeight, length);
            const barL = new THREE.Mesh(barGeo, guardrailMat);
            barL.position.set(-trackWidth / 2 + 0.08, barrierHeight / 2, 0);
            segmentGroup.add(barL);

            const barR = new THREE.Mesh(barGeo, guardrailMat);
            barR.position.set(trackWidth / 2 - 0.08, barrierHeight / 2, 0);
            segmentGroup.add(barR);

            // 4. Cross Ties (Glowing orange railway ties every 1.5m)
            const tieCount = Math.max(1, Math.floor(length / 1.5));
            for (let t = 0; t < tieCount; t++) {
                const tieZ = (t - tieCount / 2 + 0.5) * 1.5;
                const tieGeo = new THREE.BoxGeometry(trackWidth - 0.5, 0.06, 0.35);
                const tie = new THREE.Mesh(tieGeo, tieMat);
                tie.position.set(0, trackThickness / 2 + 0.03, tieZ);
                segmentGroup.add(tie);
            }

            // 5. Dashed centerline
            const dashCount = Math.max(1, Math.floor(length / 3.0));
            for (let d = 0; d < dashCount; d++) {
                const dashZ = (d - dashCount / 2 + 0.5) * 3.0;
                const dashGeo = new THREE.PlaneGeometry(0.3, 1.4);
                const dash = new THREE.Mesh(dashGeo, dashMat);
                dash.rotation.x = -Math.PI / 2;
                dash.position.set(0, trackThickness / 2 + 0.04, dashZ);
                segmentGroup.add(dash);
            }

            this.scene.add(segmentGroup);
            this.trackMeshes.push(segmentGroup);

            // 6. Physics: Road Surface Cannon Box
            const roadShape = new CANNON.Box(new CANNON.Vec3(trackWidth / 2, trackThickness / 2, length / 2));
            const roadBody = new CANNON.Body({
                mass: 0,
                material: this.physics.groundMaterial,
                shape: roadShape
            });
            roadBody.position.set(mid.x, mid.y, mid.z);
            roadBody.quaternion.set(quat.x, quat.y, quat.z, quat.w);
            this.physics.world.addBody(roadBody);
            this.collisionBodies.push(roadBody);

            // 7. Physics: Guardrail Colliders (Keep vehicle securely inside the track)
            const wallShape = new CANNON.Box(new CANNON.Vec3(0.15, barrierHeight / 2, length / 2));

            // Left Wall
            const leftWallPos = mid.clone().add(
                new THREE.Vector3(-trackWidth / 2 + 0.1, barrierHeight / 2, 0).applyQuaternion(quat)
            );
            const leftBody = new CANNON.Body({ mass: 0, material: this.physics.defaultMaterial, shape: wallShape });
            leftBody.position.set(leftWallPos.x, leftWallPos.y, leftWallPos.z);
            leftBody.quaternion.set(quat.x, quat.y, quat.z, quat.w);
            this.physics.world.addBody(leftBody);
            this.collisionBodies.push(leftBody);

            // Right Wall
            const rightWallPos = mid.clone().add(
                new THREE.Vector3(trackWidth / 2 - 0.1, barrierHeight / 2, 0).applyQuaternion(quat)
            );
            const rightBody = new CANNON.Body({ mass: 0, material: this.physics.defaultMaterial, shape: wallShape });
            rightBody.position.set(rightWallPos.x, rightWallPos.y, rightWallPos.z);
            rightBody.quaternion.set(quat.x, quat.y, quat.z, quat.w);
            this.physics.world.addBody(rightBody);
            this.collisionBodies.push(rightBody);
        }
    }

    createTrestleTowers() {
        const pillarMat = new THREE.MeshStandardMaterial({
            color: 0x334155,
            metalness: 0.7,
            roughness: 0.4
        });
        const footingMat = new THREE.MeshStandardMaterial({
            color: 0x64748b,
            roughness: 0.9
        });

        // Place steel lattice support pillars wherever track is elevated (y > 2.5m)
        this.waypoints.forEach((wp, idx) => {
            if (wp.y > 2.2 && idx > 0 && idx < this.waypoints.length - 1) {
                const height = wp.y;

                // Left Pillar
                const pilL = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.42, height, 8), pillarMat);
                pilL.position.set(wp.x - 1.8, height / 2, wp.z);
                pilL.castShadow = true;
                this.scene.add(pilL);

                // Right Pillar
                const pilR = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.42, height, 8), pillarMat);
                pilR.position.set(wp.x + 1.8, height / 2, wp.z);
                pilR.castShadow = true;
                this.scene.add(pilR);

                // Cross-brace beams for lattice look
                if (height > 6.0) {
                    const braceGeo = new THREE.BoxGeometry(3.6, 0.16, 0.16);
                    const braceCount = Math.floor(height / 4.0);
                    for (let b = 1; b <= braceCount; b++) {
                        const brace = new THREE.Mesh(braceGeo, pillarMat);
                        brace.position.set(wp.x, b * 4.0, wp.z);
                        this.scene.add(brace);
                    }
                }

                // Concrete footing pads on ground
                const footGeo = new THREE.CylinderGeometry(0.85, 1.1, 0.5, 8);
                const footL = new THREE.Mesh(footGeo, footingMat);
                footL.position.set(wp.x - 1.8, 0.25, wp.z);
                footL.receiveShadow = true;
                this.scene.add(footL);

                const footR = new THREE.Mesh(footGeo, footingMat);
                footR.position.set(wp.x + 1.8, 0.25, wp.z);
                footR.receiveShadow = true;
                this.scene.add(footR);
            }
        });
    }

    createSkyRings() {
        // 6 High-Voltage Neon Stunt Rings along the roller coaster circuit
        const ringDefs = [
            { pos: new THREE.Vector3(-28, 9.8, -54), color: 0x06b6d4, pts: 250, label: '⚡ LIFT CHAIN BOOST' },
            { pos: new THREE.Vector3(-58, 23.8, -62), color: 0xf59e0b, pts: 500, label: '👑 SKY SUMMIT CONQUERED' },
            { pos: new THREE.Vector3(-76, 12.8, -53), color: 0xef4444, pts: 1000, label: '🔥 THE MEGA HYPER DROP' },
            { pos: new THREE.Vector3(-85, 6.0, -26), color: 0xa855f7, pts: 350, label: '🌀 SUPERSONIC BANKED TURN' },
            { pos: new THREE.Vector3(-50, 15.0, 6), color: 0x10b981, pts: 500, label: '🚀 SKY HIGHWAY CORRIDOR' },
            // Giant mid-air golden target ring beyond the launch kicker!
            { pos: new THREE.Vector3(6, 19.5, -26), color: 0xfacc15, pts: 2500, label: '🌟 INSANE SKY FLIGHT +2500!' }
        ];

        ringDefs.forEach((r, idx) => {
            const group = new THREE.Group();
            group.position.copy(r.pos);

            const radius = idx === 5 ? 4.2 : 3.2;

            // Glowing Torus
            const torusGeo = new THREE.TorusGeometry(radius, 0.35, 12, 32);
            const torusMat = new THREE.MeshStandardMaterial({
                color: r.color,
                emissive: r.color,
                emissiveIntensity: 0.9,
                roughness: 0.2
            });
            const torus = new THREE.Mesh(torusGeo, torusMat);
            group.add(torus);

            // Translucent glowing energy membrane
            const portalGeo = new THREE.CircleGeometry(radius - 0.2, 24);
            const portalMat = new THREE.MeshBasicMaterial({
                color: r.color,
                transparent: true,
                opacity: 0.28,
                side: THREE.DoubleSide
            });
            const portal = new THREE.Mesh(portalGeo, portalMat);
            group.add(portal);

            // Ambient point light
            const light = new THREE.PointLight(r.color, 2.2, 20);
            group.add(light);

            this.scene.add(group);

            this.rings.push({
                group,
                torus,
                portal,
                pos: r.pos.clone(),
                pts: r.pts,
                label: r.label,
                color: r.color,
                collected: false,
                initialY: r.pos.y,
                radius
            });
        });
    }

    createEntranceArch() {
        const archGroup = new THREE.Group();
        archGroup.position.set(0, 0, -44.5);

        const pillarMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.8 });
        const postL = new THREE.Mesh(new THREE.BoxGeometry(0.7, 6.5, 0.7), pillarMat);
        postL.position.set(-3.2, 3.2, 0);
        const postR = new THREE.Mesh(new THREE.BoxGeometry(0.7, 6.5, 0.7), pillarMat);
        postR.position.set(3.2, 3.2, 0);
        archGroup.add(postL);
        archGroup.add(postR);

        // Signboard
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 160;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#0f172a';
        ctx.roundRect(10, 10, 492, 140, 20);
        ctx.fill();
        ctx.lineWidth = 6;
        ctx.strokeStyle = '#06b6d4';
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 40px Impact, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🎢 SKY HYPER COASTER', 256, 68);

        ctx.fillStyle = '#f59e0b';
        ctx.font = 'bold 22px system-ui, sans-serif';
        ctx.fillText('⚡ DRIVE TO 22M & MEGA DROP! ⚡', 256, 115);

        const tex = new THREE.CanvasTexture(canvas);
        const banner = new THREE.Mesh(
            new THREE.PlaneGeometry(6.8, 2.1),
            new THREE.MeshBasicMaterial({ map: tex, transparent: true })
        );
        banner.position.set(0, 5.8, 0);
        archGroup.add(banner);

        this.scene.add(archGroup);
    }

    createApexArch() {
        // Glowing landmark arch at the highest point (Summit 22.5m)
        const apexGroup = new THREE.Group();
        apexGroup.position.set(-58, 22.5, -62);

        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ef4444';
        ctx.roundRect(10, 10, 492, 108, 16);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 44px Impact, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('⚠️ APEX SUMMIT: 22M DROP! ⚠️', 256, 75);

        const tex = new THREE.CanvasTexture(canvas);
        const banner = new THREE.Mesh(
            new THREE.PlaneGeometry(6.5, 1.7),
            new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide })
        );
        banner.position.set(0, 3.8, 0);
        apexGroup.add(banner);

        this.scene.add(apexGroup);
    }

    update(vehicle, delta, onStuntTrigger) {
        if (!vehicle) return;
        const pos = vehicle.getPosition();
        if (!pos) return;

        const time = performance.now() * 0.002;
        const now = performance.now();

        // 1. Check if vehicle is on the Roller Coaster Lift Hill (P0 -> P6)
        // Automatic lift-chain assist pulls vehicle smoothly up to 22.5m summit!
        if (pos.x < 1.0 && pos.x > -59.0 && pos.z < -43.0 && pos.z > -65.0 && pos.y < 23.0) {
            // Check if within 3.5m of lift-hill track line
            if (vehicle.speed > 0.5) {
                // Ensure strong climbing speed
                if (vehicle.speed < 24) vehicle.speed = 24;

                // Lift chain vertical assist so vehicle glides effortlessly up
                if (vehicle.body && pos.y < 22.0) {
                    vehicle.body.velocity.y = Math.max(vehicle.body.velocity.y, 6.5);
                }

                // Periodic coaster chain sound
                if (now - this.lastLiftSoundTime > 800 && this.soundManager) {
                    this.lastLiftSoundTime = now;
                    this.soundManager.playCoasterWhoosh();
                }
            }
        }

        // 2. The Mega Drop Gravity Accelerator (P6 -> P9)
        if (pos.x < -58.0 && pos.x > -84.0 && pos.z < -40.0 && pos.z > -64.0 && pos.y > 3.0) {
            // Supercharge speed on the plunge!
            if (vehicle.speed > 0) {
                vehicle.speed = Math.min(vehicle.speed + 35 * delta, 52); // ~185 km/h!
            }
        }

        // 3. The Mega Sky Launch Kicker (P15 -> P16)
        // Flings vehicle high into the sky towards the central arena!
        const launchLip = this.waypoints[16];
        const distToLip = pos.distanceTo(launchLip);
        if (distToLip < 5.5 && now - this.lastLaunchTime > 4000) {
            this.lastLaunchTime = now;

            if (vehicle.body) {
                vehicle.body.velocity.y = 17.5; // Big upward catapult boost
                vehicle.body.velocity.x += 16.0;
                vehicle.body.velocity.z += -12.0;
                vehicle.speed = 38;
            }

            if (this.soundManager) {
                this.soundManager.playBoost();
                this.soundManager.playCoasterWhoosh();
            }

            if (onStuntTrigger) {
                onStuntTrigger('🚀 MEGA SKY FLIGHT! SOARING ACROSS THE SKY!');
            }
        }

        // 4. Animate and Check Stunt Rings
        this.rings.forEach((ring) => {
            ring.group.position.y = ring.initialY + Math.sin(time * 2 + ring.pos.x) * 0.4;
            ring.torus.rotation.z += delta * 1.0;

            if (!ring.collected) {
                const dist = ring.pos.distanceTo(pos);
                if (dist < ring.radius + 1.2) {
                    ring.collected = true;
                    ring.portal.material.opacity = 0.9;

                    if (this.soundManager) {
                        this.soundManager.playBoost();
                        this.soundManager.playCoin();
                    }

                    if (vehicle.triggerBoost) {
                        vehicle.triggerBoost(2.5);
                    } else if (vehicle.boost) {
                        vehicle.boost(1.5, 2.5);
                    }

                    if (this.onScoreUpdate) {
                        this.onScoreUpdate(1, 10);
                    }

                    if (onStuntTrigger) {
                        onStuntTrigger(`${ring.label} (+${ring.pts} PTS!)`);
                    }

                    setTimeout(() => {
                        ring.collected = false;
                        ring.portal.material.opacity = 0.28;
                    }, 5000);
                }
            }
        });
    }
}
