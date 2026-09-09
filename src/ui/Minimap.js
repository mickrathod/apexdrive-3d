/**
 * 2D Canvas Radar / Minimap
 */
export class Minimap {
    constructor(canvasId, worldSize = 180) {
        this.canvasId = canvasId;
        this.canvas = document.getElementById(canvasId);
        if (this.canvas) {
            this.ctx = this.canvas.getContext('2d');
            this.size = this.canvas.width;
        }
        this.worldSize = worldSize; // e.g. -90 to +90 in world units
        this.size = this.canvas ? this.canvas.width : 150;

        // Color coded zone markers on map
        this.zones = [
            { name: 'STUNTS', x: -45, z: -35, color: '#f59e0b', r: 16 },
            { name: '🎢 COASTER', x: -45, z: -65, color: '#06b6d4', r: 20 },
            { name: 'PROJECTS', x: 45, z: -45, color: '#3b82f6', r: 20 },
            { name: 'SKILLS', x: 45, z: 45, color: '#10b981', r: 18 },
            { name: 'CONTACT', x: -45, z: 45, color: '#8b5cf6', r: 16 },
        ];
    }

    worldToMap(x, z) {
        const halfWorld = this.worldSize / 2;
        const mapX = ((x + halfWorld) / this.worldSize) * this.size;
        const mapY = ((z + halfWorld) / this.worldSize) * this.size;
        return { x: mapX, y: mapY };
    }

    draw(carPosition, carRotationY) {
        if (!this.ctx) {
            this.canvas = document.getElementById(this.canvasId);
            if (this.canvas) {
                this.ctx = this.canvas.getContext('2d');
                this.size = this.canvas.width;
            } else {
                return;
            }
        }
        const ctx = this.ctx;
        const w = this.size;

        ctx.clearRect(0, 0, w, w);

        // Radar background circle
        ctx.save();
        ctx.beginPath();
        ctx.arc(w / 2, w / 2, w / 2 - 4, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.stroke();

        // Concentric radar rings
        ctx.beginPath();
        ctx.arc(w / 2, w / 2, w / 3.5, 0, Math.PI * 2);
        ctx.arc(w / 2, w / 2, w / 6, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
        ctx.stroke();

        // Draw crosshairs
        ctx.beginPath();
        ctx.moveTo(w / 2, 8);
        ctx.lineTo(w / 2, w - 8);
        ctx.moveTo(8, w / 2);
        ctx.lineTo(w - 8, w / 2);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.stroke();

        // Draw zones
        for (const zone of this.zones) {
            const p = this.worldToMap(zone.x, zone.z);
            const r = (zone.r / this.worldSize) * w;

            ctx.beginPath();
            ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
            ctx.fillStyle = zone.color + '22';
            ctx.fill();
            ctx.strokeStyle = zone.color + 'aa';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // Label
            ctx.fillStyle = zone.color;
            ctx.font = 'bold 8px system-ui, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(zone.name, p.x, p.y + 3);
        }

        // Draw vehicle blip
        if (carPosition) {
            const carMap = this.worldToMap(carPosition.x, carPosition.z);

            ctx.save();
            ctx.translate(carMap.x, carMap.y);
            // Three.js Y rotation to 2D canvas rotation
            ctx.rotate(-carRotationY);

            // Directional triangle pointer
            ctx.beginPath();
            ctx.moveTo(0, -6);
            ctx.lineTo(4, 5);
            ctx.lineTo(0, 3);
            ctx.lineTo(-4, 5);
            ctx.closePath();
            ctx.fillStyle = '#ff3366';
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1;
            ctx.stroke();

            ctx.restore();
        }

        ctx.restore();
    }
}
