/**
 * Input Controls Manager (Keyboard & Mobile Touch Controls)
 */
export class Controls {
    constructor() {
        this.forward = false;
        this.backward = false;
        this.left = false;
        this.right = false;
        this.brake = false;
        this.interact = false;

        this.onReset = null;
        this.onHorn = null;
        this.onToggleCamera = null;
        this.onSwitchVehicle = null;
        this.onInteract = null;

        this.initKeyboard();
        this.initTouch();
    }

    setKey(key, state) {
        if (key === 'forward') this.forward = state;
        else if (key === 'backward') this.backward = state;
        else if (key === 'left') this.left = state;
        else if (key === 'right') this.right = state;
        else if (key === 'brake' || key === 'drift') this.brake = state;
    }

    initKeyboard() {
        window.addEventListener('keydown', (e) => {
            // Ignore if typing in an input inside a modal
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            switch (e.code) {
                case 'KeyW':
                case 'ArrowUp':
                    this.forward = true;
                    break;
                case 'KeyS':
                case 'ArrowDown':
                    this.backward = true;
                    break;
                case 'KeyA':
                case 'ArrowLeft':
                    this.left = true;
                    break;
                case 'KeyD':
                case 'ArrowRight':
                    this.right = true;
                    break;
                case 'Space':
                    this.brake = true;
                    e.preventDefault();
                    break;
                case 'KeyE':
                    this.interact = true;
                    if (this.onInteract) this.onInteract();
                    break;
                case 'KeyR':
                    if (this.onReset) this.onReset();
                    break;
                case 'KeyH':
                    if (this.onHorn) this.onHorn();
                    break;
                case 'KeyC':
                    if (this.onToggleCamera) this.onToggleCamera();
                    break;
                case 'KeyV':
                    if (this.onSwitchVehicle) this.onSwitchVehicle();
                    break;
            }
        });

        window.addEventListener('keyup', (e) => {
            switch (e.code) {
                case 'KeyW':
                case 'ArrowUp':
                    this.forward = false;
                    break;
                case 'KeyS':
                case 'ArrowDown':
                    this.backward = false;
                    break;
                case 'KeyA':
                case 'ArrowLeft':
                    this.left = false;
                    break;
                case 'KeyD':
                case 'ArrowRight':
                    this.right = false;
                    break;
                case 'Space':
                    this.brake = false;
                    break;
                case 'KeyE':
                    this.interact = false;
                    break;
            }
        });
    }

    initTouch() {
        // Touch buttons binding (for mobile UI)
        const bindButton = (id, onDown, onUp) => {
            const btn = document.getElementById(id);
            if (!btn) return;

            const handleDown = (e) => {
                e.preventDefault();
                onDown();
            };
            const handleUp = (e) => {
                e.preventDefault();
                onUp();
            };

            btn.addEventListener('touchstart', handleDown, { passive: false });
            btn.addEventListener('touchend', handleUp, { passive: false });
            btn.addEventListener('mousedown', handleDown);
            btn.addEventListener('mouseup', handleUp);
            btn.addEventListener('mouseleave', handleUp);
        };

        bindButton('btn-up', () => { this.forward = true; }, () => { this.forward = false; });
        bindButton('btn-down', () => { this.backward = true; }, () => { this.backward = false; });
        bindButton('btn-left', () => { this.left = true; }, () => { this.left = false; });
        bindButton('btn-right', () => { this.right = true; }, () => { this.right = false; });
        bindButton('btn-handbrake', () => { this.brake = true; }, () => { this.brake = false; });
        bindButton('btn-horn', () => { if (this.onHorn) this.onHorn(); }, () => {});
        bindButton('btn-reset', () => { if (this.onReset) this.onReset(); }, () => {});
    }
}
