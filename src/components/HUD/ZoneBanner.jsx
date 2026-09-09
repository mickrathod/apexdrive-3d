import React from 'react';

export const ZoneBanner = ({ zoneName, visible }) => {
  return (
    <div className={`zone-banner ${visible ? 'active' : ''}`}>
      <span className="zone-tag">DISCOVERED ZONE</span>
      <h2>{zoneName}</h2>
    </div>
  );
};
