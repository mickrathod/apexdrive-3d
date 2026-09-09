/**
 * Procedural Web Audio API Sound Synthesizer
 * 100% self-contained, zero external audio assets required.
 */
export class SoundManager {
    constructor() {
        this.ctx = null;
        this.isMuted = false;
        this.engineOsc = null;
        this.engineGain = null;
        this.engineFilter = null;
        this.isEngineRunning = false;

        // Auto-initialize on first user click or keydown
        const unlock = () => {
            this.init();
            window.removeEventListener('click', unlock);
            window.removeEventListener('keydown', unlock);
            window.removeEventListener('touchstart', unlock);
        };
        window.addEventListener('click', unlock);
        window.addEventListener('keydown', unlock);
        window.addEventListener('touchstart', unlock);
    }

    init() {
        if (this.ctx) return;
        try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioCtx();
            this.setupEngine();
        } catch (e) {
            console.warn('Web Audio API not supported:', e);
        }
    }

    setupEngine() {
        if (!this.ctx) return;

        // Engine oscillator (sawtooth for rich motor harmonics)
        this.engineOsc = this.ctx.createOscillator();
        this.engineOsc.type = 'sawtooth';
        this.engineOsc.frequency.setValueAtTime(45, this.ctx.currentTime);

        // Lowpass filter to muffle harsh harmonics like an engine block
        this.engineFilter = this.ctx.createBiquadFilter();
        this.engineFilter.type = 'lowpass';
        this.engineFilter.frequency.setValueAtTime(180, this.ctx.currentTime);

        // Engine volume gain
        this.engineGain = this.ctx.createGain();
        this.engineGain.gain.setValueAtTime(0.04, this.ctx.currentTime);

        // Connect chain
        this.engineOsc.connect(this.engineFilter);
        this.engineFilter.connect(this.engineGain);
        this.engineGain.connect(this.ctx.destination);

        this.engineOsc.start();
        this.isEngineRunning = true;
    }

    updateEngine(speed, isAccelerating) {
        if (!this.ctx || this.isMuted || !this.isEngineRunning) return;

        const now = this.ctx.currentTime;
        const absSpeed = Math.abs(speed);

        // Calculate pitch based on speed + throttle
        let targetFreq = 42 + absSpeed * 4.5;
        if (isAccelerating) {
            targetFreq += 18; // Throttle rev boost
        }
        targetFreq = Math.min(targetFreq, 220);

        this.engineOsc.frequency.setTargetAtTime(targetFreq, now, 0.08);

        // Filter opening with speed
        const targetFilter = 150 + absSpeed * 18 + (isAccelerating ? 120 : 0);
        this.engineFilter.frequency.setTargetAtTime(Math.min(targetFilter, 800), now, 0.08);

        // Volume
        const targetGain = this.isMuted ? 0 : 0.035 + (isAccelerating ? 0.025 : 0);
        this.engineGain.gain.setTargetAtTime(targetGain, now, 0.08);
    }

    playHorn() {
        if (!this.ctx || this.isMuted) return;
        if (this.ctx.state === 'suspended') this.ctx.resume();

        const now = this.ctx.currentTime;
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        // Dual tone standard car horn (F and A notes ~ 349Hz and 440Hz)
        osc1.type = 'sawtooth';
        osc1.frequency.setValueAtTime(370, now);
        osc2.type = 'sawtooth';
        osc2.frequency.setValueAtTime(466, now);

        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(800, now);
        filter.Q.setValueAtTime(3, now);

        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.38);
        osc2.stop(now + 0.38);
    }

    playDrift() {
        if (!this.ctx || this.isMuted) return;
        const now = this.ctx.currentTime;

        // White noise burst for tire skid
        const bufferSize = this.ctx.sampleRate * 0.15;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1200, now);
        filter.Q.setValueAtTime(2.5, now);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.03, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        noise.start(now);
    }

    playCollision(intensity = 1.0) {
        if (!this.ctx || this.isMuted) return;
        const now = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(120, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + 0.2);

        const vol = Math.min(Math.max(intensity * 0.1, 0.02), 0.18);
        gain.gain.setValueAtTime(vol, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.25);
    }

    playCoin() {
        if (!this.ctx || this.isMuted) return;
        if (this.ctx.state === 'suspended') this.ctx.resume();
        const now = this.ctx.currentTime;

        // Two-note bright arcade chime (B5 -> E6)
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(987.77, now);
        osc1.frequency.setValueAtTime(1318.51, now + 0.08);

        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        osc1.connect(gain);
        gain.connect(this.ctx.destination);

        osc1.start(now);
        osc1.stop(now + 0.38);
    }

    playBoost() {
        if (!this.ctx || this.isMuted) return;
        if (this.ctx.state === 'suspended') this.ctx.resume();
        const now = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(80, now);
        osc.frequency.exponentialRampToValueAtTime(360, now + 0.4);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(300, now);
        filter.frequency.exponentialRampToValueAtTime(1800, now + 0.4);

        gain.gain.setValueAtTime(0.07, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.58);
    }

    playPaint() {
        if (!this.ctx || this.isMuted) return;
        if (this.ctx.state === 'suspended') this.ctx.resume();
        const now = this.ctx.currentTime;

        // Spray-can hiss
        const bufferSize = this.ctx.sampleRate * 0.2;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(2500, now);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        noise.start(now);
    }

    startPoliceSiren() {
        if (!this.ctx || this.isMuted || this.sirenOsc) return;
        if (this.ctx.state === 'suspended') this.ctx.resume();
        const now = this.ctx.currentTime;

        // Siren Oscillator (Dual-tone wail)
        this.sirenOsc = this.ctx.createOscillator();
        this.sirenOsc.type = 'sawtooth';
        this.sirenOsc.frequency.setValueAtTime(650, now);

        // LFO for wailing pitch modulation
        this.sirenLfo = this.ctx.createOscillator();
        this.sirenLfo.frequency.setValueAtTime(1.8, now); // ~1.8 Hz wail cycle
        const lfoGain = this.ctx.createGain();
        lfoGain.gain.setValueAtTime(280, now); // swing between 650-930 Hz

        this.sirenLfo.connect(this.sirenOsc.frequency);

        // Bandpass filter for authentic megaphone siren character
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(900, now);
        filter.Q.setValueAtTime(2.5, now);

        this.sirenGain = this.ctx.createGain();
        this.sirenGain.gain.setValueAtTime(0.001, now);
        this.sirenGain.gain.linearRampToValueAtTime(0.045, now + 0.3);

        this.sirenOsc.connect(filter);
        filter.connect(this.sirenGain);
        this.sirenGain.connect(this.ctx.destination);

        this.sirenLfo.start(now);
        this.sirenOsc.start(now);
    }

    setSirenVolume(vol) {
        if (this.sirenGain && this.ctx && !this.isMuted) {
            const clamped = Math.max(0, Math.min(0.06, vol * 0.05));
            this.sirenGain.gain.setTargetAtTime(clamped, this.ctx.currentTime, 0.1);
        }
    }

    stopPoliceSiren() {
        if (!this.sirenOsc || !this.ctx) return;
        const now = this.ctx.currentTime;
        if (this.sirenGain) {
            this.sirenGain.gain.setTargetAtTime(0.0001, now, 0.2);
        }
        setTimeout(() => {
            if (this.sirenOsc) {
                try {
                    this.sirenOsc.stop();
                    this.sirenLfo?.stop();
                    this.sirenOsc.disconnect();
                } catch {
                    // ignore
                }
                this.sirenOsc = null;
                this.sirenLfo = null;
                this.sirenGain = null;
            }
        }, 250);
    }

    playPoliceRadioChirp() {
        if (!this.ctx || this.isMuted) return;
        if (this.ctx.state === 'suspended') this.ctx.resume();
        const now = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(1450, now);
        osc.frequency.setValueAtTime(1150, now + 0.05);

        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.13);
    }

    playExplosion() {
        if (!this.ctx || this.isMuted) return;
        if (this.ctx.state === 'suspended') this.ctx.resume();
        const now = this.ctx.currentTime;

        // Sub thud
        const osc = this.ctx.createOscillator();
        const oscGain = this.ctx.createGain();
        osc.frequency.setValueAtTime(120, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + 0.4);
        oscGain.gain.setValueAtTime(0.08, now);
        oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

        osc.connect(oscGain);
        oscGain.connect(this.ctx.destination);

        // Noise crackle
        const bufferSize = this.ctx.sampleRate * 0.4;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, now);
        filter.frequency.exponentialRampToValueAtTime(100, now + 0.35);

        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(0.07, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

        noise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(this.ctx.destination);

        osc.start(now);
        noise.start(now);
        osc.stop(now + 0.5);
    }

    playCoasterWhoosh() {
        if (!this.ctx || this.isMuted) return;
        if (this.ctx.state === 'suspended') this.ctx.resume();
        const now = this.ctx.currentTime;

        const bufferSize = this.ctx.sampleRate * 0.6;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(300, now);
        filter.frequency.exponentialRampToValueAtTime(1400, now + 0.3);
        filter.frequency.exponentialRampToValueAtTime(250, now + 0.6);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.05, now + 0.25);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        noise.start(now);
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.engineGain) {
            this.engineGain.gain.setValueAtTime(this.isMuted ? 0 : 0.04, this.ctx?.currentTime || 0);
        }
        if (this.sirenGain) {
            this.sirenGain.gain.setValueAtTime(this.isMuted ? 0 : 0.045, this.ctx?.currentTime || 0);
        }
        return this.isMuted;
    }
}
