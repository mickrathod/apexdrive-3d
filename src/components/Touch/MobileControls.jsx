import React from 'react';

export const MobileControls = ({ controls }) => {
  const handleTouch = (key, state) => {
    if (controls) {
      controls.setKey(key, state);
    }
  };

  return (
    <div className="mobile-controls">
      <div className="touch-group touch-left">
        <button
          className="touch-btn"
          onTouchStart={() => handleTouch('left', true)}
          onTouchEnd={() => handleTouch('left', false)}
          aria-label="Steer Left"
        >
          ◀
        </button>
        <button
          className="touch-btn"
          onTouchStart={() => handleTouch('right', true)}
          onTouchEnd={() => handleTouch('right', false)}
          aria-label="Steer Right"
        >
          ▶
        </button>
      </div>

      <div className="touch-group touch-right">
        <button
          className="touch-btn touch-special"
          onTouchStart={() => handleTouch('drift', true)}
          onTouchEnd={() => handleTouch('drift', false)}
          aria-label="Drift"
        >
          💨 DRIFT
        </button>
        <button
          className="touch-btn touch-special"
          onClick={() => controls?.onHorn && controls.onHorn()}
          aria-label="Horn"
        >
          📯 HORN
        </button>
        <button
          className="touch-btn touch-pedal touch-gas"
          onTouchStart={() => handleTouch('forward', true)}
          onTouchEnd={() => handleTouch('forward', false)}
          aria-label="Accelerate"
        >
          ▲ GAS
        </button>
        <button
          className="touch-btn touch-pedal touch-brake"
          onTouchStart={() => handleTouch('backward', true)}
          onTouchEnd={() => handleTouch('backward', false)}
          aria-label="Brake or Reverse"
        >
          ▼ BRAKE
        </button>
      </div>
    </div>
  );
};
