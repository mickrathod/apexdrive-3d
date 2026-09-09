/**
 * Modal and Notification UI Manager
 */
export class ModalManager {
    constructor() {
        this.container = document.getElementById('modal-container');
        this.modalContent = document.getElementById('modal-body');
        this.closeBtn = document.getElementById('modal-close');
        this.banner = document.getElementById('zone-banner');
        this.bannerText = document.getElementById('zone-name');
        this.activeZone = '';

        if (this.closeBtn) {
            this.closeBtn.addEventListener('click', () => this.close());
        }

        if (this.container) {
            this.container.addEventListener('click', (e) => {
                if (e.target === this.container) this.close();
            });
        }

        window.addEventListener('keydown', (e) => {
            if (e.code === 'Escape') this.close();
        });
    }

    openProject(project) {
        if (!this.container || !this.modalContent) return;

        const tagsHtml = project.tags.map(t => `<span class="tag">${t}</span>`).join('');

        this.modalContent.innerHTML = `
            <div class="project-modal">
                <div class="modal-badge">${project.category || 'FEATURED PROJECT'}</div>
                <h2>${project.title}</h2>
                <p class="modal-description">${project.description}</p>
                
                <div class="project-highlights">
                    <h3>Key Architecture & Highlights:</h3>
                    <ul>
                        ${project.highlights.map(h => `<li>${h}</li>`).join('')}
                    </ul>
                </div>

                <div class="modal-tags">
                    ${tagsHtml}
                </div>

                <div class="modal-actions">
                    <a href="${project.demoUrl || '#'}" target="_blank" class="btn btn-primary">
                        🚀 Live Demo
                    </a>
                    <a href="${project.githubUrl || '#'}" target="_blank" class="btn btn-secondary">
                        📦 View Source
                    </a>
                </div>
            </div>
        `;

        this.container.classList.add('active');
    }

    openContact() {
        if (!this.container || !this.modalContent) return;

        this.modalContent.innerHTML = `
            <div class="contact-modal">
                <div class="modal-badge">GET IN TOUCH</div>
                <h2>Let's Build Something Awesome</h2>
                <p class="modal-description">Looking for interactive 3D experiences, full-stack applications, or custom automation systems? Reach out directly!</p>
                
                <div class="social-links-grid">
                    <a href="https://github.com" target="_blank" class="social-card">
                        <span class="social-icon">🐙</span>
                        <div class="social-info">
                            <strong>GitHub</strong>
                            <small>Explore open-source repositories</small>
                        </div>
                    </a>
                    <a href="https://linkedin.com" target="_blank" class="social-card">
                        <span class="social-icon">💼</span>
                        <div class="social-info">
                            <strong>LinkedIn</strong>
                            <small>Connect professionally</small>
                        </div>
                    </a>
                    <a href="https://twitter.com" target="_blank" class="social-card">
                        <span class="social-icon">🐦</span>
                        <div class="social-info">
                            <strong>Twitter / X</strong>
                            <small>Follow development updates</small>
                        </div>
                    </a>
                    <a href="mailto:hello@example.com" class="social-card">
                        <span class="social-icon">✉️</span>
                        <div class="social-info">
                            <strong>Direct Email</strong>
                            <small>hello@example.com</small>
                        </div>
                    </a>
                </div>
            </div>
        `;

        this.container.classList.add('active');
    }

    openAbout() {
        if (!this.container || !this.modalContent) return;

        this.modalContent.innerHTML = `
            <div class="about-modal">
                <div class="modal-badge">CREATIVE DEVELOPER</div>
                <h2>Manav — Full-Stack & 3D Web Engineer</h2>
                <p class="modal-description">Specializing in high-performance WebGL graphics, interactive physics simulations, and commercial-grade automation systems that wow users.</p>
                
                <div class="stats-grid">
                    <div class="stat-card">
                        <span class="stat-number">5+</span>
                        <span class="stat-label">Years Coding</span>
                    </div>
                    <div class="stat-card">
                        <span class="stat-number">30+</span>
                        <span class="stat-label">Shipped Projects</span>
                    </div>
                    <div class="stat-card">
                        <span class="stat-number">100%</span>
                        <span class="stat-label">Offline & Private Stack</span>
                    </div>
                </div>

                <div class="about-bio">
                    <p>I merge cutting-edge real-time 3D web technologies with pragmatic software architecture. From physics playgrounds to high-converting lead automation tools, I build products that deliver tangible impact.</p>
                </div>
            </div>
        `;

        this.container.classList.add('active');
    }

    close() {
        if (this.container) {
            this.container.classList.remove('active');
        }
    }

    showZoneBanner(zoneName) {
        if (this.activeZone === zoneName) return;
        this.activeZone = zoneName;

        if (this.banner && this.bannerText) {
            this.bannerText.textContent = zoneName;
            this.banner.classList.add('visible');
            clearTimeout(this.bannerTimeout);
            this.bannerTimeout = setTimeout(() => {
                this.banner.classList.remove('visible');
            }, 3000);
        }
    }
}
