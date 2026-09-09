import React, { useRef, useEffect } from 'react';

export const MinimapHUD = ({ minimapRef }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (canvasRef.current && minimapRef) {
      minimapRef.current = canvasRef.current;
    }
  }, [minimapRef]);

  return (
    <div className="radar-hud">
      <div className="radar-header">
        <span className="radar-dot" />
        <span>GPS RADAR</span>
      </div>
      <canvas ref={canvasRef} id="minimap-canvas" width="150" height="150" />
    </div>
  );
};
