// public/js/manual-system.js
// Clean Manual System - loads manual from separate file

class ManualSystem {
    constructor() {
        this.manualWindow = null;
        this.isManualOpen = false;
        this.init();
    }

    init() {
        this.addManualButtonToTutorial();
        this.setupEventListeners();
    }

    addManualButtonToTutorial() {
        // Find the existing tutorial footer with buttons
        const tutorialFooter = document.querySelector('.tutorial-footer');
        if (tutorialFooter) {
            // Check if manual button already exists
            if (tutorialFooter.querySelector('.btn-manual')) {
                return;
            }

            // Create the "Read the Manual" button
            const manualButton = document.createElement('button');
            manualButton.className = 'btn-manual';
            manualButton.textContent = 'Read the Manual';
            manualButton.onclick = () => this.openManual();
            
            // Insert the manual button as the first button
            const firstButton = tutorialFooter.querySelector('button');
            if (firstButton) {
                tutorialFooter.insertBefore(manualButton, firstButton);
            } else {
                tutorialFooter.appendChild(manualButton);
            }
        }

        // Also add to help footer if it exists
        const helpFooter = document.querySelector('.help-footer');
        if (helpFooter && !helpFooter.querySelector('.btn-manual')) {
            const manualButton = document.createElement('button');
            manualButton.className = 'btn-manual';
            manualButton.textContent = 'Read the Manual';
            manualButton.onclick = () => this.openManual();
            
            const tutorialButton = helpFooter.querySelector('.btn-tutorial');
            if (tutorialButton) {
                helpFooter.insertBefore(manualButton, tutorialButton);
            } else {
                helpFooter.appendChild(manualButton);
            }
        }
    }

    openManual() {
        if (this.isManualOpen) {
            this.closeManual();
            return;
        }

        // Create overlay
        const overlay = document.createElement('div');
        overlay.className = 'manual-overlay';
        overlay.style.display = 'block';
        
        // Create manual iframe - load from separate HTML file
        const iframe = document.createElement('iframe');
        iframe.className = 'manual-iframe';
        iframe.src = '/manual.html'; // Load from separate file
        
        overlay.appendChild(iframe);
        document.body.appendChild(overlay);
        
        // Close on overlay click
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                this.closeManual();
            }
        });
        
        // Close on escape key
        this.escapeHandler = (e) => {
            if (e.key === 'Escape') {
                this.closeManual();
            }
        };
        document.addEventListener('keydown', this.escapeHandler);
        
        this.manualWindow = overlay;
        this.isManualOpen = true;
        
        // Track analytics if available
        if (window.analytics) {
            window.analytics.track('Manual Opened', {
                source: 'tutorial',
                timestamp: new Date().toISOString()
            });
        }
    }

    closeManual() {
        if (this.manualWindow) {
            this.manualWindow.remove();
            this.manualWindow = null;
        }
        
        if (this.escapeHandler) {
            document.removeEventListener('keydown', this.escapeHandler);
            this.escapeHandler = null;
        }
        
        this.isManualOpen = false;
    }

    setupEventListeners() {
        // Make closeManual available globally for the manual's close button
        window.closeManual = () => this.closeManual();
        
        // Handle window resize
        window.addEventListener('resize', () => {
            if (this.isManualOpen && this.manualWindow) {
                // Manual will auto-adjust due to CSS
            }
        });
    }
}

// Initialize the manual system when the page loads
document.addEventListener('DOMContentLoaded', function() {
    // Only initialize if we're in a context that might have tutorials
    if (document.querySelector('.tutorial-footer') || 
        document.querySelector('.help-footer') ||        document.querySelector('.help-content')) {
        window.manualSystem = new ManualSystem();
    }
});