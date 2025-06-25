// monitor-patches.js - Enhancement patches for existing monitor
// Include this AFTER your monitor.js loads

(function() {
  'use strict';

  console.log('🔧 Loading monitor patches...');

  // Wait for monitor to be available
  function waitForMonitor() {
    if (window.monitor) {
      applyPatches();
    } else {
      setTimeout(waitForMonitor, 100);
    }
  }

  function applyPatches() {
    console.log('🎯 Applying monitor patches...');

    // Patch 1: Fix socket event handling to prevent loops
    if (window.monitor.setupSocketListeners) {
      const originalSetupSocketListeners = window.monitor.setupSocketListeners;
      
      window.monitor.setupSocketListeners = function() {
        console.log('🔌 Setting up enhanced socket listeners...');
        
        if (!window.socketClient) {
          console.error('SocketClient not available for monitor');
          return;
        }

        // Connection status updates
        window.socketClient.on('connected', () => {
          console.log('🔗 Monitor: Socket connected');
          if (this.showStatus) {
            this.showStatus('Connected to server', 'success');
          }
        });

        window.socketClient.on('disconnected', () => {
          console.log('❌ Monitor: Socket disconnected');
          if (this.showStatus) {
            this.showStatus('Disconnected from server', 'error');
          }
        });

        // FIXED: Consciousness updates without infinite logging
        window.socketClient.on('consciousness-update', (data) => {
          if (!this.isActive) return;
          
          console.log('🧠 Monitor: Processing consciousness update');
          
          if (this.currentCharacter && data?.characterId === this.currentCharacter.id) {
            this.updateDisplays(data);
            this.addUpdateFlash();
          }
        });

        // Enhanced monitoring events
        window.socketClient.on('monitoring-started', (data) => {
          console.log('🚀 Monitor: Monitoring started for:', data?.characterId);
          
          if (this.currentCharacter && data?.characterId === this.currentCharacter.id) {
            this.isActive = true;
            if (this.updateButtonStates) this.updateButtonStates();
            
            // Request initial data
            setTimeout(() => {
              console.log('📡 Requesting initial system data...');
              if (window.socketClient.emitToServer) {
                window.socketClient.emitToServer('get-system-resources');
                window.socketClient.emitToServer('get-error-logs');
                window.socketClient.emitToServer('get-memory-allocation');
              }
            }, 500);
          }
        });

        // System data events
        window.socketClient.on('system-resources', (data) => {
          if (data?.resources && this.isActive && this.updateResourceMeters) {
            this.updateResourceMeters(data.resources);
          }
        });

        window.socketClient.on('error-logs', (data) => {
          if (data?.errors && this.isActive && this.updateErrorLog) {
            this.updateErrorLog(data.errors);
          }
        });

        window.socketClient.on('memory-allocation', (data) => {
          if (data?.memoryData && this.isActive && this.updateMemoryVisualization) {
            this.updateMemoryVisualization(data.memoryData);
          }
        });

        console.log('✅ Enhanced socket listeners configured');
      };
    }

    // Patch 2: Enhanced character monitoring start
    if (window.monitor.loadCharacterData) {
      const originalLoadCharacterData = window.monitor.loadCharacterData;
      
      window.monitor.loadCharacterData = function(character) {
        console.log('👤 Loading character data for:', character?.name || character?.id);
        
        // Call original method
        originalLoadCharacterData.call(this, character);
        
        // Enhanced monitoring start
        if (character && window.socketClient?.isSocketConnected()) {
          console.log('🚀 Starting enhanced monitoring...');
          
          this.currentCharacter = character;
          this.isActive = true;
          
          // Start monitoring with better error handling
          const success = window.socketClient.startMonitoring(character.id);
          
          if (success) {
            console.log('✅ Monitoring request sent successfully');
            if (this.showStatus) {
              this.showStatus(`Starting monitoring for ${character.name}...`, 'info');
            }
          } else {
            console.error('❌ Failed to start monitoring');
            if (this.showStatus) {
              this.showStatus('Failed to start monitoring - check connection', 'error');
            }
          }
        }
      };
    }

    // Patch 3: Add visual update flash
    window.monitor.addUpdateFlash = function(type = 'update') {
      const container = document.querySelector('.monitor-container');
      if (!container) return;

      const flashClass = `flash-${type}`;
      container.classList.add(flashClass);
      
      setTimeout(() => {
        container.classList.remove(flashClass);
      }, 300);
    };

    // Patch 4: Enhanced debugging info
    window.monitor.getDebugInfo = function() {
      return {
        monitor: {
          isActive: this.isActive,
          currentCharacter: this.currentCharacter?.id || null,
          hasSocketListeners: true
        },
        socket: window.socketClient?.getConnectionInfo() || null,
        connection: window.connectionManager?.getState() || null,
        elements: {
          connectionStatus: !!document.querySelector('.connection-status'),
          processTable: !!this.processTable,
          resourceMeters: !!this.resourceMeters,
          memoryVisualization: !!this.memoryVisualization,
          errorLog: !!this.errorLog
        }
      };
    };

    // Patch 5: Force reconnection method
    window.monitor.forceReconnection = function() {
      console.log('🔄 Forcing socket reconnection...');
      
      if (window.socketClient) {
        window.socketClient.socket.disconnect();
        setTimeout(() => {
          window.socketClient.socket.connect();
        }, 1000);
      }
    };

    // Re-setup socket listeners with patches
    if (window.monitor.setupSocketListeners) {
      window.monitor.setupSocketListeners();
    }

    console.log('✅ Monitor patches applied successfully');
  }

  // Add CSS for update flash effects
  function addFlashCSS() {
    const style = document.createElement('style');
    style.textContent = `
      .monitor-container.flash-update {
        border-color: #2196f3 !important;
        box-shadow: 0 0 20px rgba(33, 150, 243, 0.3) !important;
        transition: all 0.3s ease !important;
      }
      
      .monitor-container.flash-intervention {
        border-color: #4caf50 !important;
        box-shadow: 0 0 20px rgba(76, 175, 80, 0.3) !important;
        transition: all 0.3s ease !important;
      }
    `;
    document.head.appendChild(style);
  }

  // Initialize
  addFlashCSS();
  waitForMonitor();

  console.log('📡 Monitor patches module loaded');
})();