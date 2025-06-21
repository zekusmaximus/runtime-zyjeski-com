// Main Application Controller
class App {
  constructor() {
    this.currentSection = 'home';
    this.isConnected = false;
    this.currentCharacter = null;
    
    this.init();
  }

  init() {
    this.setupNavigation();
    this.setupSocketConnection();
    this.setupEventListeners();
    this.loadCharacters();
    this.hideLoading();
  }

  setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('.section');

    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetSection = link.dataset.section;
        this.navigateToSection(targetSection);
      });
    });
  }

  navigateToSection(sectionId) {
    // Update navigation
    document.querySelectorAll('.nav-link').forEach(link => {
      link.classList.remove('active');
    });
    document.querySelector(`[data-section="${sectionId}"]`).classList.add('active');

    // Update sections
    document.querySelectorAll('.section').forEach(section => {
      section.classList.remove('active');
    });
    document.getElementById(sectionId).classList.add('active');

    this.currentSection = sectionId;

    // Initialize section-specific functionality
    this.initializeSection(sectionId);
  }

  initializeSection(sectionId) {
    switch (sectionId) {
      case 'terminal':
        if (window.terminal) {
          window.terminal.focus();
        }
        break;
      case 'monitor':
        if (window.monitor) {
          window.monitor.startMonitoring();
        }
        break;
      case 'debugger':
        if (window.debugger) {
          window.debugger.initialize();
        }
        break;
    }
  }

  setupSocketConnection() {
    if (window.socketClient) {
      window.socketClient.connect();
    }
  }

  setupEventListeners() {
    // Start debugging button
    const startDebuggingBtn = document.getElementById('startDebugging');
    if (startDebuggingBtn) {
      startDebuggingBtn.addEventListener('click', () => {
        this.startDebugging();
      });
    }

    // View demo button
    const viewDemoBtn = document.getElementById('viewDemo');
    if (viewDemoBtn) {
      viewDemoBtn.addEventListener('click', () => {
        this.viewDemo();
      });
    }

    // Character selection
    document.addEventListener('click', (e) => {
      if (e.target.closest('.character-card')) {
        const characterCard = e.target.closest('.character-card');
        const characterId = characterCard.dataset.characterId;
        this.selectCharacter(characterId);
      }
    });
  }

  async loadCharacters() {
    try {
      const response = await fetch('/api/characters');
      const characters = await response.json();
      this.renderCharacters(characters);
    } catch (error) {
      console.error('Failed to load characters:', error);
      this.showError('Failed to load character profiles');
    }
  }

  renderCharacters(characters) {
    const characterGrid = document.getElementById('characterGrid');
    if (!characterGrid) return;

    characterGrid.innerHTML = characters.map(character => `
      <div class="character-card" data-character-id="${character.id}">
        <div class="character-name">${character.name}</div>
        <div class="character-status">${character.status}</div>
        <div class="character-description">${character.description}</div>
      </div>
    `).join('');
  }

  async selectCharacter(characterId) {
    try {
      this.showLoading('Loading character consciousness...');
      
      const response = await fetch(`/api/character/${characterId}`);
      const character = await response.json();
      
      this.currentCharacter = character;
      this.updateCharacterSelection(characterId);
      
      // Initialize consciousness monitoring
      if (window.consciousness) {
        window.consciousness.loadCharacter(character);
      }
      
      this.hideLoading();
      this.showSuccess(`Loaded ${character.name}'s consciousness profile`);
    } catch (error) {
      console.error('Failed to load character:', error);
      this.hideLoading();
      this.showError('Failed to load character consciousness');
    }
  }

  updateCharacterSelection(characterId) {
    document.querySelectorAll('.character-card').forEach(card => {
      card.classList.remove('selected');
    });
    
    const selectedCard = document.querySelector(`[data-character-id="${characterId}"]`);
    if (selectedCard) {
      selectedCard.classList.add('selected');
    }
  }

  startDebugging() {
    if (!this.currentCharacter) {
      this.showError('Please select a character first');
      return;
    }

    this.navigateToSection('terminal');
    
    // Start debugging session
    if (window.terminal) {
      window.terminal.startDebuggingSession(this.currentCharacter.id);
    }
  }

  viewDemo() {
    // Load Alexander Kane as demo character
    this.selectCharacter('alexander-kane');
    
    setTimeout(() => {
      this.navigateToSection('monitor');
    }, 1000);
  }

  updateConnectionStatus(connected) {
    this.isConnected = connected;
    const statusElement = document.getElementById('connectionStatus');
    const statusDot = statusElement.querySelector('.status-dot');
    const statusText = statusElement.querySelector('.status-text');
    
    if (connected) {
      statusDot.classList.add('connected');
      statusText.textContent = 'Connected';
    } else {
      statusDot.classList.remove('connected');
      statusText.textContent = 'Disconnected';
    }
  }

  showLoading(message = 'Loading...') {
    const overlay = document.getElementById('loadingOverlay');
    const text = overlay.querySelector('.loading-text');
    text.textContent = message;
    overlay.classList.add('active');
  }

  hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    overlay.classList.remove('active');
  }

  showError(message) {
    this.showNotification(message, 'error');
  }

  showSuccess(message) {
    this.showNotification(message, 'success');
  }

  showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
      <div class="notification-content">
        <span class="notification-message">${message}</span>
        <button class="notification-close">&times;</button>
      </div>
    `;

    // Add to page
    document.body.appendChild(notification);

    // Add styles if not already present
    if (!document.querySelector('#notification-styles')) {
      const styles = document.createElement('style');
      styles.id = 'notification-styles';
      styles.textContent = `
        .notification {
          position: fixed;
          top: 80px;
          right: 20px;
          background-color: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          padding: 1rem;
          max-width: 400px;
          z-index: 10000;
          animation: slideInRight 0.3s ease;
          box-shadow: 0 4px 12px var(--shadow);
        }
        
        .notification-error {
          border-left: 4px solid var(--accent-red);
        }
        
        .notification-success {
          border-left: 4px solid var(--accent-green);
        }
        
        .notification-info {
          border-left: 4px solid var(--accent-blue);
        }
        
        .notification-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
        }
        
        .notification-message {
          color: var(--text-primary);
          font-size: 0.9rem;
        }
        
        .notification-close {
          background: none;
          border: none;
          color: var(--text-muted);
          font-size: 1.2rem;
          cursor: pointer;
          padding: 0;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .notification-close:hover {
          color: var(--text-primary);
        }
        
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `;
      document.head.appendChild(styles);
    }

    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 5000);

    // Close button functionality
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
      notification.remove();
    });
  }

  // API helper methods
  async apiCall(endpoint, options = {}) {
    try {
      const response = await fetch(endpoint, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      });

      if (!response.ok) {
        throw new Error(`API call failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API call error:', error);
      throw error;
    }
  }

  // Utility methods
  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  formatCpuUsage(usage) {
    return `${usage.toFixed(1)}%`;
  }

  formatTimestamp(timestamp) {
    return new Date(timestamp).toLocaleTimeString();
  }
}

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
});

// Global error handler
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  if (window.app) {
    window.app.showError('An unexpected error occurred');
  }
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  if (window.app) {
    window.app.showError('An unexpected error occurred');
  }
});

