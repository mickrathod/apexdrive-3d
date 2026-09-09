import React from 'react';

export const SpeedometerHUD = ({ speed = 0, gear = 'N', score = 0, totalStars = 10 }) => {
  const formattedSpeed = Math.round(speed).toString().padStart(2, '0');

  return (
    <div className="speedometer-hud">
      <div className="speed-cluster">
        <span className="speed-number">{formattedSpeed}</span>
        <span className="speed-unit">KM/H</span>
      </div>
      <div className="gear-cluster">
        <span className="gear-label">GEAR</span>
        <span className="gear-number">{gear}</span>
      </div>
      <div className="coin-cluster">
        <span className="coin-label">STARS</span>
        <div className="coin-val-wrap">
          <span className="coin-icon">🪙</span>
          <span className="coin-number">{score}/{totalStars}</span>
        </div>
      </div>
    </div>
  );
};
