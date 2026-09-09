import React from 'react';

export const ModalOverlay = ({ activeModal, onClose }) => {
  if (!activeModal) return null;

  const renderContent = () => {
    if (activeModal.type === 'about') {
      return (
        <div className="modal-inner">
          <div className="modal-badge">CREATIVE DEVELOPER</div>
          <h2>About Manav</h2>
          <p className="modal-desc">
            Passionate creative developer crafting immersive 3D web experiences, interactive physics worlds, and high-performance WebGL applications.
          </p>
          <div className="modal-tech-stack">
            <span>Three.js</span>
            <span>Cannon.js</span>
            <span>React.js</span>
            <span>Vite</span>
            <span>Web Audio API</span>
            <span>GLSL Shaders</span>
          </div>
        </div>
      );
    }

    if (activeModal.type === 'contact') {
      return (
        <div className="modal-inner">
          <div className="modal-badge">GET IN TOUCH</div>
          <h2>Let's Collaborate</h2>
          <p className="modal-desc">
            Have an exciting project, creative web inquiry, or high-octane 3D experience in mind? Let's connect!
          </p>
          <div className="modal-links">
            <a href="mailto:contact@manav.dev" className="modal-action-btn">
              ✉️ Send an Email
            </a>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="modal-action-btn secondary">
              🐙 GitHub Profile
            </a>
          </div>
        </div>
      );
    }

    if (activeModal.type === 'project' && activeModal.data) {
      const p = activeModal.data;
      return (
        <div className="modal-inner">
          <div className="modal-badge">PROJECT SHOWCASE</div>
          <h2>{p.title || 'Interactive Project'}</h2>
          <p className="modal-desc">{p.description}</p>
          {p.tech && (
            <div className="modal-tech-stack">
              {p.tech.map((t) => (
                <span key={t}>{t}</span>
              ))}
            </div>
          )}
          {p.url && (
            <div className="modal-links">
              <a href={p.url} target="_blank" rel="noopener noreferrer" className="modal-action-btn">
                🔗 View Live Project
              </a>
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <div className="modal-overlay active" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
          ✕
        </button>
        <div className="modal-body">{renderContent()}</div>
      </div>
    </div>
  );
};
