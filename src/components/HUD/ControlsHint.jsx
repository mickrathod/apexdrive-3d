import React from 'react';

export const ControlsHint = () => {
  return (
    <div className="controls-hint">
      <div className="hint-item"><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> Ride / Drive</div>
      <div className="hint-item"><kbd>SPACE</kbd> Drift</div>
      <div className="hint-item"><kbd>🖱️ Drag</kbd> 360° Orbit</div>
      <div className="hint-item"><kbd>📜 Scroll</kbd> Zoom</div>
      <div className="hint-item"><kbd>V</kbd> Vehicle</div>
      <div className="hint-item"><kbd>C</kbd> Cam Mode</div>
      <div className="hint-item"><kbd>R</kbd> Reset</div>
    </div>
  );
};
