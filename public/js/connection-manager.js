// connection-manager.js - Standalone Connection Manager Module
// Just include this file and it automatically handles connection status

(function() {
  'use strict';

  class ConnectionManager {
    constructor() {
      this.connectionStatus = null;
      this.lastKnownConnectionState = false;
      this.monitoringCharacterId = null;
      this.checkInterval = null;
      
      // Wait for DOM and socketClient to be ready
      this.waitForDependencies();
    }

    waitForDependencies() {
      const checkReady = () => {
        if (document.readyState === 'complete' && window.socketClient && window.socketClient.isSocketConnected) {
          this.initialize();
        } else {
          setTimeout(checkReady, 100);
        }
      };
      checkReady();
    }

    initialize() {
      this.connectionStatus = document.querySelector('.connection-status');
      
      if (!this.connectionStatus) {
        console.warn('Connection status element not found - retrying in 2 seconds');
        setTimeout(() => this.initialize(), 2000);
        return;
      }

      console.log('🔗 Connection Manager initialized');
      this.setupListeners();
      this.startStatusCheck();
      this.updateDisplay();
    }

    setupListeners() {
      if (!window.socketClient) return;

      // Connection events
      window.socketClient.on('connected', () => {
        console.log('🔗 Connection Manager: Connected');
        this.lastKnownConnectionState = true;
        this.updateDisplay();
      });

      window.socketClient.on('disconnected', (data) => {
        console.log('❌ Connection Manager: Disconnected:', data?.reason);
        this.lastKnownConnectionState = false;
        this.monitoringCharacterId = null;
        this.updateDisplay();
      });

      // Monitoring events
      window.socketClient.on('monitoring-started', (data) => {
        console.log('🚀 Connection Manager: Monitoring started for:', data?.characterId);
        this.monitoringCharacterId = data?.characterId;
        this.updateDisplay();
      });

      window.socketClient.on('monitoring-stopped', (data) => {
        console.log('⏹️ Connection Manager: Monitoring stopped for:', data?.characterId);
        if (this.monitoringCharacterId === data?.characterId) {
          this.monitoringCharacterId = null;
        }
        this.updateDisplay();
      });
    }

    startStatusCheck() {
      // Check connection status every 2 seconds
      this.checkInterval = setInterval(() => {
        this.checkConnectionStatus();
      }, 2000);
    }

    checkConnectionStatus() {
      if (!window.socketClient) return;

      const actualState = window.socketClient.isSocketConnected();
      
      if (actualState !== this.lastKnownConnectionState) {
        console.log('🔄 Connection state changed:', this.lastKnownConnectionState, '->', actualState);
        this.lastKnownConnectionState = actualState;
        this.updateDisplay();
      }
    }

    updateDisplay() {
      if (!this.connectionStatus) return;

      /* Ensure element is visible once manager has control */
      if (this.connectionStatus.classList.contains('hidden')) {
        this.connectionStatus.classList.remove('hidden');
      }

      const isConnected = this.lastKnownConnectionState;
      const isMonitoring = !!this.monitoringCharacterId;

      // Clear existing classes
      this.connectionStatus.classList.remove('connected', 'disconnected', 'monitoring');

      if (isConnected) {
        if (isMonitoring) {
          this.connectionStatus.classList.add('connected', 'monitoring');
          this.connectionStatus.textContent = `Monitoring ${this.monitoringCharacterId}`;
          this.setStyles('#4caf50', 'rgba(76, 175, 80, 0.2)');
        } else {
          this.connectionStatus.classList.add('connected');
          this.connectionStatus.textContent = 'Connected';
          this.setStyles('#2196f3', 'rgba(33, 150, 243, 0.2)');
        }
      } else {
        this.connectionStatus.classList.add('disconnected');
        this.connectionStatus.textContent = 'Disconnected';
        this.setStyles('#f44336', 'rgba(244, 67, 54, 0.2)');
      }
    }

    setStyles(color, background) {
      if (!this.connectionStatus) return;

      // Use CSS custom properties instead of inline styles
      this.connectionStatus.style.setProperty('--connection-color', color);
      this.connectionStatus.style.setProperty('--connection-background', background);
    }

    // Public methods for debugging
    getState() {
      return {
        connected: this.lastKnownConnectionState,
        monitoring: this.monitoringCharacterId,
        socketConnected: window.socketClient?.isSocketConnected(),
        elementFound: !!this.connectionStatus
      };
    }

    destroy() {
      if (this.checkInterval) {
        clearInterval(this.checkInterval);
      }
    }
  }

  // Auto-initialize when script loads
  const connectionManager = new ConnectionManager();

  // Make available globally for debugging
  window.connectionManager = connectionManager;

  console.log('📡 Connection Manager module loaded');
})();