// public/js/app.js
import logger from '/js/logger.js';
import '/js/init-fix.js';
// import '/js/modules/init-state-manager.js'; // Remove this - we'll integrate it directly
import stateManager from '/js/modules/state-manager.js';

// Make state manager available globally for debugging
window.stateManager = stateManager;

class RuntimeApp {
  constructor() {
    this.currentCharacter = null;
    this.isLoadingCharacter = false;
    this.initializeApp();
  }

  async initializeApp() {
    logger.info('Initializing Runtime.zyjeski.com');
    
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.onDOMReady());
    } else {
      this.onDOMReady();
    }
  }

  onDOMReady() {
    this.init();
  }

  init() {
    this.setupNavigation();
    this.setupEventListeners();
    this.loadCharacters();
    logger.info('App initialization complete');
  }

  /**
   * Configure UI navigation links.
   * - If no .nav-link elements exist, exit gracefully so the rest of the app
   *   continues to initialise.
   * - When links are present, toggle their "active" state and show the
   *   corresponding section whose id matches the data-section attribute.
   */
  setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    if (!navLinks.length) {
      logger.debug('No navigation links found – skipping navigation setup');
      return;
    }

    navLinks.forEach((link) => {
      link.addEventListener('click', (e) => {
        e.preventDefault(); // Prevent default anchor behavior
        
        // Toggle active styling
        navLinks.forEach((l) => l.classList.remove('active'));
        link.classList.add('active');

        // Get target section from data-section attribute
        const targetSection = link.dataset.section;
        if (!targetSection) return;

        // Hide all sections, then reveal the target
        document
          .querySelectorAll('.section')
          .forEach((sec) => { sec.classList.remove('active'); });

        const targetSectionElement = document.getElementById(targetSection);
        if (targetSectionElement) {
          targetSectionElement.classList.add('active');
        }
      });
    });
  }

  setupEventListeners() {
    // Character selection
    const characterGrid = document.getElementById('characterGrid');
    if (characterGrid) {
      characterGrid.addEventListener('click', async (e) => {
        const characterCard = e.target.closest('.character-card');
        if (!characterCard) return;
        
        const characterId = characterCard.dataset.characterId;
        
        if (this.isLoadingCharacter) {
          logger.debug('Character loading in progress, ignoring duplicate request');
          return;
        }
        
        // Ensure consciousness manager is initialized on first user action
        if (!window.consciousness) {
          window.initConsciousnessManager();
        }
        
        this.selectCharacter(characterId);
      });
    }
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
      
      // Use state manager to load character
      await stateManager.loadCharacter(characterId);
      
      // Get the loaded character from state manager
      const state = stateManager.getState();
      if (state) {
        this.currentCharacter = {
          id: state.id,
          name: state.name,
          consciousness: state.consciousness
        };
        
        this.updateCharacterSelection(characterId);
        
        // Initialize the consciousness with complete data
        if (window.consciousness) {
          console.log('[APP] Loading character into consciousness manager');
          window.consciousness.loadCharacter(this.currentCharacter);
        }
        
        // Connect monitor to the loaded character data
        if (window.monitor) {
          window.monitor.connectToCharacter(this.currentCharacter);
        }
        
        this.hideLoading();
        this.showSuccess(`${state.name} consciousness loaded`);
      }
    } catch (error) {
      logger.error('Failed to select character', { characterId, error });
      this.showError('Failed to load character consciousness');
    } finally {
      this.isLoadingCharacter = false;
    }
  }

  updateCharacterSelection(characterId) {
    // Update UI to show selected character
    document.querySelectorAll('.character-card').forEach(card => {
      card.classList.toggle('selected', card.dataset.characterId === characterId);
    });
    
    // Update any character selector dropdowns
    const selector = document.getElementById('characterSelector');
    if (selector) {
      selector.value = characterId;
    }
  }

  showLoading(message = 'Loading...') {
    const status = document.getElementById('appStatus');
    if (status) {
      status.className = 'app-status loading';
      status.textContent = message;
      status.style.display = 'block';
    }
  }

  hideLoading() {
    const status = document.getElementById('appStatus');
    if (status) {
      status.style.display = 'none';
    }
  }

  showError(message) {
    const status = document.getElementById('appStatus');
    if (status) {
      status.className = 'app-status error';
      status.textContent = message;
      status.style.display = 'block';
      setTimeout(() => this.hideLoading(), 5000);
    }
  }

  showSuccess(message) {
    const status = document.getElementById('appStatus');
    if (status) {
      status.className = 'app-status success';
      status.textContent = message;
      status.style.display = 'block';
      setTimeout(() => this.hideLoading(), 3000);
    }
  }
}

// Initialize app
const app = new RuntimeApp();
window.app = app;

// Export for debugging
export default app;