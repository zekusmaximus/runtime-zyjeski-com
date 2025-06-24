// Create this file: public/js/init-fix.js
// Simple fix that works with your existing module structure

console.log('🔧 Initialization Fix Loading...');

// Wait for all modules to load, then ensure proper initialization order
async function waitForModules() {
  console.log('⏳ Waiting for modules to load...');
  
  // Wait for required globals to exist
  const checkModules = () => {
    return window.stateManager && window.socketClient;
  };
  
  // Wait up to 10 seconds for modules to load
  let attempts = 0;
  while (!checkModules() && attempts < 100) {
    await new Promise(resolve => setTimeout(resolve, 100));
    attempts++;
  }
  
  if (!checkModules()) {
    console.error('❌ Required modules failed to load');
    return false;
  }
  
  console.log('✅ Core modules loaded');
  return true;
}

async function initializeApplication() {
  console.log('🚀 Starting application initialization...');
  
  // Wait for modules
  const modulesReady = await waitForModules();
  if (!modulesReady) return;
  
  // Check if consciousness manager needs initialization
  if (!window.consciousness) {
    console.log('🧠 Creating consciousness manager...');
    // Import and create consciousness manager if it doesn't exist
    try {
      const ConsciousnessModule = await import('./consciousness.js');
      const ConsciousnessManager = ConsciousnessModule.default || ConsciousnessModule.ConsciousnessManager;
      if (ConsciousnessManager) {
        window.consciousness = new ConsciousnessManager();
      }
    } catch (error) {
      console.error('Failed to create consciousness manager:', error);
    }
  }
  
  // Check if monitor needs initialization (this often fails)
  if (!window.monitor) {
    console.log('📊 Creating monitor...');
    try {
      const MonitorModule = await import('./monitor.js');
      const Monitor = MonitorModule.default || MonitorModule.Monitor;
      if (Monitor) {
        window.monitor = new Monitor();
        console.log('✅ Monitor created successfully');
      }
    } catch (error) {
      console.error('❌ Monitor creation failed, creating fallback:', error);
      createFallbackMonitor();
    }
  }
  
  // Check if app controller needs initialization
  if (!window.app) {
    console.log('🎮 Creating app controller...');
    try {
      const AppModule = await import('./app.js');
      const App = AppModule.default || AppModule.App;
      if (App) {
        window.app = new App();
      }
    } catch (error) {
      console.error('Failed to create app controller:', error);
    }
  }
  
  console.log('🎉 Application initialization complete');
  
  // Auto-load character if available
  if (window.app && window.app.loadCharacters) {
    window.app.loadCharacters();
  }
}

function createFallbackMonitor() {
  console.log('🔧 Creating fallback monitor...');
  window.monitor = {
    isActive: false,
    currentCharacter: null,
    
    startMonitoring() {
      this.isActive = true;
      console.log('📊 Fallback monitor: starting monitoring');
      if (window.socketClient && this.currentCharacter) {
        window.socketClient.startMonitoring(this.currentCharacter.id);
      }
    },
    
    stopMonitoring() {
      this.isActive = false;
      console.log('📊 Fallback monitor: stopping monitoring');
      if (window.socketClient && this.currentCharacter) {
        window.socketClient.stopMonitoring(this.currentCharacter.id);
      }
    },
    
    setCurrentCharacter(character) {
      this.currentCharacter = character;
      console.log('📊 Fallback monitor: character set to', character?.id);
    },

    refreshData() {
      console.log('📊 Fallback monitor: refresh data');
      if (window.socketClient?.isConnected) {
        window.socketClient.emit('get-system-resources');
        window.socketClient.emit('get-error-logs');
        window.socketClient.emit('get-memory-allocation');
      }
    },
    
    // Stub methods to prevent errors
    updateDisplays() {},
    loadCharacterData() {},
    setupSocketListeners() {},
    updateButtonStates() {}
  };
}

// Global debug function
window.debugInit = () => {
  console.log('🔍 Application State:', {
    stateManager: !!window.stateManager,
    socketClient: !!window.socketClient,
    consciousness: !!window.consciousness,
    monitor: !!window.monitor,
    app: !!window.app,
    socketConnected: window.socketClient?.isConnected
  });
  
  if (window.stateManager) {
    console.log('📊 State Manager Current Character:', window.stateManager.getCurrentCharacter());
  }
};

// Auto-initialize when DOM is ready or immediately if already loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApplication);
} else {
  // DOM already loaded, initialize after a short delay to let modules finish
  setTimeout(initializeApplication, 500);
}