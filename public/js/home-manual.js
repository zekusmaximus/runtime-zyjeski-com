// Add this to your existing app.js or create a separate home-manual.js file

// Home Page Manual Button System
class HomePageManual {
    constructor() {
        this.init();
    }

    init() {
        this.addManualButtonToHome();
        this.setupManualSystem();
    }

    addManualButtonToHome() {
        // Find the hero actions container
        const heroActions = document.querySelector('.hero-actions');
        if (!heroActions) {
            console.log('Hero actions container not found');
            return;
        }

        // Check if manual button already exists
        if (heroActions.querySelector('.btn-manual-home')) {
            return;
        }

        // Create the User Manual button
        const manualButton = document.createElement('button');
        manualButton.className = 'btn btn-manual-home';
        manualButton.innerHTML = '📖 User Manual';
        manualButton.onclick = () => this.openManual();

        // Add the button to the hero actions
        heroActions.appendChild(manualButton);
    }

    openManual() {
        // Create manual overlay
        const overlay = document.createElement('div');
        overlay.className = 'manual-overlay';
        overlay.style.display = 'block';
        overlay.style.zIndex = '10000';
        
        // Create manual iframe
        const iframe = document.createElement('iframe');
        iframe.className = 'manual-iframe';
        iframe.src = '/manual.html';
        
        // Handle iframe load errors
        iframe.onerror = () => {
            console.error('Failed to load manual.html');
            alert('Could not load the manual. Please make sure manual.html is in the public folder.');
        };
        
        overlay.appendChild(iframe);
        document.body.appendChild(overlay);
        
        // Close on overlay click
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                this.closeManual(overlay);
            }
        });
        
        // Close on escape key
        const escapeHandler = (e) => {
            if (e.key === 'Escape') {
                this.closeManual(overlay);
                document.removeEventListener('keydown', escapeHandler);
            }
        };
        document.addEventListener('keydown', escapeHandler);
        
        // Make close function available globally
        window.closeManual = () => {
            this.closeManual(overlay);
            document.removeEventListener('keydown', escapeHandler);
        };
    }

    closeManual(overlay) {
        if (overlay && overlay.parentNode) {
            overlay.remove();
        }
    }

    setupManualSystem() {
        // Make the manual system available globally
        window.homePageManual = this;
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    window.homePageManual = new HomePageManual();
});

// Also initialize if DOM is already loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (!window.homePageManual) {
            window.homePageManual = new HomePageManual();
        }
    });
} else {
    if (!window.homePageManual) {
        window.homePageManual = new HomePageManual();
    }
}