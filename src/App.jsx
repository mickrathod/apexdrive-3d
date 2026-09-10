import React, { useState, useRef, useCallback } from 'react';
import { ThreeCanvas } from './components/ThreeCanvas';
import { TopHUD } from './components/HUD/TopHUD';
import { SpeedometerHUD } from './components/HUD/SpeedometerHUD';
import { ZoneBanner } from './components/HUD/ZoneBanner';
import { MinimapHUD } from './components/HUD/MinimapHUD';
import { ControlsHint } from './components/HUD/ControlsHint';
import { MobileControls } from './components/Touch/MobileControls';
import { ModalOverlay } from './components/Modals/ModalOverlay';

const THEMES = ['clay', 'sunset', 'night'];

export function App() {
  const engineRef = useRef(null);

  // React State
  const [telemetry, setTelemetry] = useState({ speed: 0, gear: 'N' });
  const [score, setScore] = useState({ count: 0, total: 10 });
  const [zone, setZone] = useState({ name: 'CENTRAL SPAWN PLAZA', visible: false });
  const [themeIdx, setThemeIdx] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [activeModal, setActiveModal] = useState(null);

  const zoneTimerRef = useRef(null);

  const handleTelemetryUpdate = useCallback((data) => {
    setTelemetry(data);
  }, []);

  const handleZoneChange = useCallback((zoneName) => {
    setZone({ name: zoneName, visible: true });
    if (zoneTimerRef.current) clearTimeout(zoneTimerRef.current);
    zoneTimerRef.current = setTimeout(() => {
      setZone((prev) => ({ ...prev, visible: false }));
    }, 3200);
  }, []);

  const handleScoreUpdate = useCallback((count, total) => {
    setScore({ count, total });
  }, []);

  const handleThemeToggle = () => {
    const nextIdx = (themeIdx + 1) % THEMES.length;
    setThemeIdx(nextIdx);
  };

  const handleMuteToggle = () => {
    if (engineRef.current?.soundManager) {
      const muted = engineRef.current.soundManager.toggleMute();
      setIsMuted(muted);
    }
  };

  const handleCameraToggle = () => {
    if (engineRef.current?.toggleCamera) {
      engineRef.current.toggleCamera();
    }
  };

  const handleResetCar = () => {
    if (engineRef.current?.resetCar) {
      engineRef.current.resetCar();
    }
  };

  const handleSwitchVehicle = () => {
    if (engineRef.current?.switchVehicle) {
      engineRef.current.switchVehicle();
    }
  };

  const handleAboutClick = () => {
    setActiveModal({ type: 'about' });
  };

  const handleContactClick = () => {
    setActiveModal({ type: 'contact' });
  };

  const handleHireClick = () => {
    setActiveModal({ type: 'hire' });
  };

  return (
    <div className="game-container">
      {/* 3D WebGL Canvas Viewport */}
      <ThreeCanvas
        engineRef={engineRef}
        theme={THEMES[themeIdx]}
        onTelemetryUpdate={handleTelemetryUpdate}
        onZoneChange={handleZoneChange}
        onScoreUpdate={handleScoreUpdate}
        onModalTrigger={setActiveModal}
      />

      {/* Top Navigation HUD */}
      <TopHUD
        theme={THEMES[themeIdx]}
        isMuted={isMuted}
        onThemeToggle={handleThemeToggle}
        onAboutClick={handleAboutClick}
        onHireClick={handleHireClick}
        onContactClick={handleContactClick}
        onCameraToggle={handleCameraToggle}
        onSwitchVehicle={handleSwitchVehicle}
        onResetCar={handleResetCar}
        onMuteToggle={handleMuteToggle}
      />

      {/* Discovered Zone Announcement Banner */}
      <ZoneBanner zoneName={zone.name} visible={zone.visible} />

      {/* Speedometer, Gear & Score */}
      <SpeedometerHUD
        speed={telemetry.speed}
        gear={telemetry.gear}
        score={score.count}
        totalStars={score.total}
      />

      {/* GPS Radar Minimap */}
      <MinimapHUD />

      {/* Keyboard Controls Hint */}
      <ControlsHint />

      {/* Mobile Touch Controls */}
      <MobileControls controls={engineRef.current?.controls} />

      {/* Interactive Glassmorphic Modal */}
      <ModalOverlay
        activeModal={activeModal}
        onClose={() => setActiveModal(null)}
      />
    </div>
  );
}

export default App;
