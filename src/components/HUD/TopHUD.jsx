import React from 'react';

const THEME_LABELS = {
  clay: '☀️ Studio',
  sunset: '🌅 Sunset',
  night: '🌙 Night'
};

export const TopHUD = ({
  theme,
  isMuted,
  onThemeToggle,
  onAboutClick,
  onHireClick,
  onContactClick,
  onCameraToggle,
  onSwitchVehicle,
  onResetCar,
  onMuteToggle
}) => {
  return (
    <header className="top-hud">
      <div className="brand">
        <span className="brand-badge">CREATIVE TECHNOLOGIST</span>
        <h1>MANAV<span className="accent">.STUDIO</span></h1>
      </div>

      <nav className="hud-nav">
        <button
          className="hud-btn hud-btn-hire"
          onClick={onHireClick}
          title="Hire for 3D & Creative Web Projects"
        >
          <span className="hud-hire-pulse"></span>
          🔥 Hire / Inquire
        </button>
        <button
          className="hud-btn"
          onClick={onThemeToggle}
          title="Toggle Lighting Theme"
        >
          {THEME_LABELS[theme] || '☀️ Studio'}
        </button>
        <button
          className="hud-btn"
          onClick={onAboutClick}
          title="About Developer"
        >
          👤 About
        </button>
        <button
          className="hud-btn"
          onClick={onContactClick}
          title="Get in Touch"
        >
          📬 Contact
        </button>
        <button
          className="hud-btn"
          onClick={onCameraToggle}
          title="Switch Camera View [C]"
        >
          🎥 Cam <kbd>[C]</kbd>
        </button>
        <button
          className="hud-btn"
          onClick={onSwitchVehicle}
          title="Switch Bike / Car [V]"
        >
          🏎️/🏍️ Vehicle <kbd>[V]</kbd>
        </button>
        <button
          className="hud-btn"
          onClick={onResetCar}
          title="Reset Vehicle Upright [R]"
        >
          🔄 Reset <kbd>[R]</kbd>
        </button>
        <button
          className={`hud-btn hud-btn-sound ${!isMuted ? 'active' : ''}`}
          onClick={onMuteToggle}
          title="Toggle Sound"
        >
          {isMuted ? '🔇 Muted' : '🔊 Sound'}
        </button>
      </nav>
    </header>
  );
};
