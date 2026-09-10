import React from 'react';

export const ModalOverlay = ({ activeModal, onClose }) => {
  if (!activeModal) return null;

  const renderContent = () => {
    if (activeModal.type === 'hire') {
      return (
        <div className="modal-inner hire-modal">
          <div className="modal-badge fire-badge">🔥 COMMISSIONS & SPRINT CONTRACTS</div>
          <h2>Bring Your Next Launch to Life in 3D</h2>
          <p className="modal-desc">
            I build high-octane 3D interactive web experiences, gamified product reveals, and creative technology systems that command attention and convert visitors.
          </p>

          <div className="hire-services-grid">
            <div className="hire-service-card">
              <div className="service-icon">🚀</div>
              <h4>3D Interactive Hero / Launch</h4>
              <p>Turn standard landing pages into interactive, cursor-reactive 3D showpieces.</p>
              <span className="service-tag">From $2,000</span>
            </div>
            <div className="hire-service-card featured">
              <div className="service-icon">🎮</div>
              <h4>Gamified 3D Web Worlds</h4>
              <p>Full Awwwards-caliber physics worlds, vehicle simulators, and interactive storytelling.</p>
              <span className="service-tag featured-tag">From $5,000</span>
            </div>
            <div className="hire-service-card">
              <div className="service-icon">🔊</div>
              <h4>Playable Ads & Audio Sprints</h4>
              <p>Web Audio synthesizers, lightweight HTML5 playable ads, and custom shader visualizers.</p>
              <span className="service-tag">Contract / Retainer</span>
            </div>
          </div>

          <div className="hire-advantage-box">
            <h4>💡 The Creative Technologist Advantage</h4>
            <p>
              <strong>Coding + Visual Art:</strong> Most developers can't draw, and most artists can't code shaders. I design the visual aesthetics, illustrate the 2D/3D assets, and write the WebGL/Three.js code myself—eliminating designer-developer friction and delivering faster.
            </p>
          </div>

          <div className="modal-links">
            <a
              href="mailto:contact@manav.dev?subject=3D%20Project%20Inquiry%20—%20Let's%20Work%20Together&body=Hi%20Manav%2C%0A%0AI%20saw%20your%203D%20interactive%20portfolio%20and%20would%20like%20to%20discuss%20a%20project.%0A%0A-%20Project%20Type%3A%20(3D%20Hero%20%2F%20Interactive%20Site%20%2F%20Sprint)%0A-%20Estimated%20Timeline%3A%0A-%20Approximate%20Budget%3A%20%0A%0ABest%2C%0A"
              className="modal-action-btn primary-glow"
            >
              ✉️ Start a Project Conversation
            </a>
            <button
              onClick={() => {
                navigator.clipboard?.writeText('contact@manav.dev');
                alert('Email copied to clipboard: contact@manav.dev');
              }}
              className="modal-action-btn secondary"
            >
              📋 Copy Email
            </button>
          </div>
        </div>
      );
    }

    if (activeModal.type === 'about') {
      return (
        <div className="modal-inner">
          <div className="modal-badge">CREATIVE TECHNOLOGIST & ARTIST</div>
          <h2>Manav</h2>
          <p className="modal-desc">
            I am a <strong>Creative Technologist & Visual Artist</strong> working at the boundary of code, digital drawing, and real-time 3D physics.
          </p>
          <p className="modal-desc">
            With a rare blend of artistic illustration skills and deep technical engineering (Three.js, WebGL, Web Audio, React), I build web applications that feel tactile, responsive, and alive.
          </p>
          <div className="modal-tech-stack">
            <span>Three.js</span>
            <span>WebGL & GLSL</span>
            <span>Cannon.js Physics</span>
            <span>React.js</span>
            <span>Web Audio API</span>
            <span>Digital Illustration</span>
            <span>Technical Art</span>
            <span>Vite</span>
          </div>
          <div className="modal-links" style={{ marginTop: '24px' }}>
            <button
              onClick={onClose}
              className="modal-action-btn"
            >
              🏎️ Return to 3D Arena
            </button>
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
            Have an exciting 3D web experience, creative branding inquiry, or product launch in mind? Let's connect!
          </p>
          <div className="modal-links">
            <a
              href="mailto:contact@manav.dev?subject=Project%20Inquiry%20from%203D%20Portfolio"
              className="modal-action-btn"
            >
              ✉️ Send an Email
            </a>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="modal-action-btn secondary"
            >
              🐙 GitHub Profile
            </a>
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              className="modal-action-btn secondary"
            >
              💼 LinkedIn
            </a>
          </div>
        </div>
      );
    }

    if (activeModal.type === 'project' && activeModal.data) {
      const p = activeModal.data;
      return (
        <div className="modal-inner">
          <div className="modal-badge">{p.category || 'PROJECT SHOWCASE'}</div>
          <h2>{p.title || 'Interactive Project'}</h2>
          <p className="modal-desc">{p.description}</p>

          {p.highlights && p.highlights.length > 0 && (
            <div className="project-highlights">
              <h3>Key Features & Technical Architecture</h3>
              <ul>
                {p.highlights.map((h, idx) => (
                  <li key={idx}>{h}</li>
                ))}
              </ul>
            </div>
          )}

          {(p.tags || p.tech) && (
            <div className="modal-tech-stack">
              {(p.tags || p.tech).map((t) => (
                <span key={t}>{t}</span>
              ))}
            </div>
          )}

          <div className="modal-links">
            {p.demoUrl && p.demoUrl !== '#' && (
              <a href={p.demoUrl} target="_blank" rel="noopener noreferrer" className="modal-action-btn">
                🔗 View Live Project
              </a>
            )}
            {p.githubUrl && (
              <a href={p.githubUrl} target="_blank" rel="noopener noreferrer" className="modal-action-btn secondary">
                🐙 Source Code
              </a>
            )}
          </div>
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
