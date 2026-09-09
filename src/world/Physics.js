import * as CANNON from 'cannon-es';

/**
 * Cannon-es Physics World Controller
 */
export class Physics {
    constructor(soundManager) {
        this.soundManager = soundManager;
        this.world = new CANNON.World();
        this.world.gravity.set(0, -14.0, 0); // Slightly punchier gravity for satisfying arcade feel
        this.world.broadphase = new CANNON.SAPBroadphase(this.world);
        this.world.allowSleep = true;
        this.world.defaultContactMaterial.friction = 0.3;

        // Custom physics materials
        this.groundMaterial = new CANNON.Material('ground');
        this.carMaterial = new CANNON.Material('car');
        this.obstacleMaterial = new CANNON.Material('obstacle');
        this.pinMaterial = new CANNON.Material('pin');

        // Contact configurations - low friction on car body so it slides smoothly without tripping or flipping
        const carGroundContact = new CANNON.ContactMaterial(this.carMaterial, this.groundMaterial, {
            friction: 0.02,
            restitution: 0.0,
            contactEquationStiffness: 1e8,
            contactEquationRelaxation: 3
        });
        this.world.addContactMaterial(carGroundContact);

        const carObstacleContact = new CANNON.ContactMaterial(this.carMaterial, this.obstacleMaterial, {
            friction: 0.3,
            restitution: 0.4
        });
        this.world.addContactMaterial(carObstacleContact);

        const pinGroundContact = new CANNON.ContactMaterial(this.pinMaterial, this.groundMaterial, {
            friction: 0.4,
            restitution: 0.3
        });
        this.world.addContactMaterial(pinGroundContact);

        // Ground plane
        const groundShape = new CANNON.Plane();
        this.groundBody = new CANNON.Body({
            mass: 0,
            material: this.groundMaterial,
            shape: groundShape
        });
        this.groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
        this.world.addBody(this.groundBody);

        this.setupCollisionSounds();
    }

    setupCollisionSounds() {
        this.world.addEventListener('beginContact', (event) => {
            if (!this.soundManager) return;
            // Check relative velocity of impact
            const bA = event.bodyA;
            const bB = event.bodyB;
            const vA = bA.velocity;
            const vB = bB.velocity;
            const relVel = Math.hypot(vA.x - vB.x, vA.y - vB.y, vA.z - vB.z);

            if (relVel > 3.0) {
                this.soundManager.playCollision(Math.min(relVel / 15.0, 1.0));
            }
        });
    }

    step(deltaTime) {
        // Clamp deltaTime to avoid physics explosion on lag spikes
        const dt = Math.min(deltaTime, 0.05);
        this.world.step(1 / 60, dt, 3);
    }
}
