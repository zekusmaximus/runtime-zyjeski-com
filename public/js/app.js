import logger from './logger.js';

// Fixed Main Application Controller - Prevent duplicate character loading
class App {
  constructor() {
    this.currentSection = 'home';
    this.isConnected = false;
    this.currentCharacter = null;
    this.isLoadingCharacter = false; // ADDED: Prevent concurrent loads
    this.isInitializingSocketClient = false; // ADDED: Prevent concurrent socket client inits
    
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
    
    const targetLink = document.querySelector(`[data-section="${sectionId}"]`);
    if (targetLink) {
      targetLink.classList.add('active');
    }

    // Update sections
    document.querySelectorAll('.section').forEach(section => {
      section.classList.remove('active');
    });
    
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
      targetSection.classList.add('active');
    }

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
        if (window.monitor && this.currentCharacter) {
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
      // Subscribe to connection events
      window.socketClient.on('connected', (data) => {
        console.log('[APP] Socket connected event received');
        this.updateConnectionStatus(true);
      });

      window.socketClient.on('disconnected', (data) => {
        console.log('[APP] Socket disconnected event received');
        this.updateConnectionStatus(false);
      });
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


    // FIXED: Character selection with duplicate prevention
    document.addEventListener('click', (e) => {
      if (e.target.closest('.character-card')) {
        // Prevent concurrent socket client initialization
        if (!window.socketClient) {
          if (this.isInitializingSocketClient) {
            logger.debug('Socket client initialization in progress, ignoring click');
            return;
          }
          this.isInitializingSocketClient = true;
          import('./socket-client.js').then(module => {
            window.socketClient = new module.default();
            this.setupSocketConnection();
            // Initialize monitor after socket client is available
            import('./monitor.js').then(monitorModule => {
              window.monitor = new monitorModule.default();
              // Now continue with character selection
              const characterCard = e.target.closest('.character-card');
              const characterId = characterCard.dataset.characterId;
              // Prevent double-clicks and concurrent loads
              if (this.isLoadingCharacter) {
                logger.debug('Character loading in progress, ignoring duplicate request');
                this.isInitializingSocketClient = false;
                return;
              }
              // Ensure consciousness manager is initialized on first user action
              if (!window.consciousness) {
                window.initConsciousnessManager();
              }
              this.selectCharacter(characterId);
              this.isInitializingSocketClient = false;
            }).catch(err => {
              logger.error('Failed to load monitor module', err);
              this.isInitializingSocketClient = false;
            });
          }).catch(err => {
            logger.error('Failed to load socket-client module', err);
            this.isInitializingSocketClient = false;
          });
        } else {
          const characterCard = e.target.closest('.character-card');
          const characterId = characterCard.dataset.characterId;
          // Prevent double-clicks and concurrent loads
          if (this.isLoadingCharacter) {
            logger.debug('Character loading in progress, ignoring duplicate request');
            return;
          }
          // Ensure consciousness manager is initialized on first user action
          if (!window.consciousness) {
            window.initConsciousnessManager();
          }
          this.selectCharacter(characterId);
        }
      }
    });
  }

  async loadCharacters() {
    try {
      const response = await fetch('/api/characters');
      const characters = await response.json();
      this.renderCharacters(characters);
    } catch (error) {
      logger.error('Failed to load characters', { error });
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

  // FIXED: Prevent duplicate character loading
  async selectCharacter(characterId) {
    console.log(`[APP] selectCharacter called for id: ${characterId}`);
    // Prevent concurrent character loads
    if (this.isLoadingCharacter) {
      logger.debug('Character loading already in progress', { characterId });
      return;
    }

    // If the same character is already loaded, don't reload
    if (this.currentCharacter && this.currentCharacter.id === characterId) {
      logger.debug('Character already loaded', { characterId });
      this.updateCharacterSelection(characterId);
      return;
    }

    try {
      this.isLoadingCharacter = true;
      this.showLoading('Loading character consciousness...');
      console.log(`[APP] Fetching character profile for id: ${characterId}`);
      const response = await fetch(`/api/character/${characterId}`);
      if (!response.ok) {
        throw new Error(`Failed to load character: ${response.statusText}`);
      }
      const character = await response.json();
      console.log('[APP] Character profile loaded:', character);

      // Fetch initial consciousness state so required process data is available
      console.log(`[APP] Fetching consciousness state for id: ${characterId}`);
      const stateRes = await fetch(`/api/consciousness/${characterId}/state`);
      if (stateRes.ok) {
        const state = await stateRes.json();
        character.consciousness = state.consciousness;
        console.log('[APP] Consciousness state loaded:', state);
      }

      this.currentCharacter = character;
      this.updateCharacterSelection(characterId);

      // Initialize the consciousness with complete data
      if (window.consciousness) {
        console.log('[APP] Loading character into consciousness manager');
        window.consciousness.loadCharacter(character);
        // Start monitoring only after character is loaded, as a user-driven action
        window.consciousness.userStartMonitoring();
      }
      
      this.hideLoading();
      this.showSuccess(`Loaded ${character.name}'s consciousness profile`);
      
    } catch (error) {
      logger.error('Failed to load character', { error, characterId });
      this.hideLoading();
      this.showError('Failed to load character consciousness');
    } finally {
      this.isLoadingCharacter = false;
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

  showLoading(message) {
    const loader = document.getElementById('loader');
    if (loader) {
      loader.classList.add('active');
      loader.querySelector('.loader-message').textContent = message || 'Loading...';
    }
  }

  hideLoading() {
    const loader = document.getElementById('loader');
    if (loader) {
      loader.classList.remove('active');
    }
  }

  showError(message) {
    const errorBox = document.getElementById('errorBox');
    if (errorBox) {
      errorBox.textContent = message;
      errorBox.classList.add('active');
    }
  }

  showSuccess(message) {
    const successBox = document.getElementById('successBox');
    if (successBox) {
      successBox.textContent = message;
      successBox.classList.add('active');
      setTimeout(() => {
        successBox.classList.remove('active');
      }, 3000);
    }
  }

  startDebugging() {
    if (this.currentCharacter) {
      // Directly start debugging the current character's process
      window.debugger.startDebugging(this.currentCharacter.id);
    } else {
      this.showError('No character selected for debugging');
    }
  }

  updateConnectionStatus(isConnected) {
    this.isConnected = isConnected;
    const statusIndicator = document.getElementById('connectionStatus');
    if (statusIndicator) {
      statusIndicator.textContent = isConnected ? 'Connected' : 'Disconnected';
      statusIndicator.classList.toggle('connected', isConnected);
      statusIndicator.classList.toggle('disconnected', !isConnected);
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
});
