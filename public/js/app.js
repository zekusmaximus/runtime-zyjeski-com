// public/js/app.js
import logger from '/js/logger.js';
import '/js/init-fix.js';
// import '/js/modules/init-state-manager.js'; // Remove this - we'll integrate it directly
import stateManager from '/js/modules/state-manager.js';
import GroundStateValidator from '/js/ground-state-validator.js';

// Make state manager available globally for debugging
window.stateManager = stateManager;

class RuntimeApp {
  constructor() {
    this.currentCharacter = null;
    this.isLoadingCharacter = false;
    this.userInteracted = false; // GROUND STATE: Track user interaction
    this.components = new Map(); // GROUND STATE: Track component initialization
    this.initializeApp();
  }

  async initializeApp() {
    logger.info('Initializing Runtime.zyjeski.com in Ground State');
    
    // GROUND STATE: Validate we start in compliant state
    GroundStateValidator.validateCompliance();
    
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
    // GROUND STATE: Only setup character selection and basic navigation
    this.setupNavigation();
    this.setupEventListeners();
    this.loadCharacters();
    
    logger.info('App initialization complete - Ground State maintained');
    
    // GROUND STATE: Validate compliance after initialization
    setTimeout(() => GroundStateValidator.validateCompliance(), 100);
  }

  /**
   * GROUND STATE: Configure UI navigation links but disable them initially.
   * Navigation only becomes active after character selection.
   */
  setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    if (!navLinks.length) {
      logger.debug('No navigation links found – skipping navigation setup');
      return;
    }

    // GROUND STATE: Disable all navigation initially
    navLinks.forEach((link) => {
      link.classList.add('disabled');
      
      // Add disabled styling
      if (!link.hasAttribute('data-ground-state-disabled')) {
        link.style.opacity = '0.5';
        link.style.pointerEvents = 'none';
        link.setAttribute('data-ground-state-disabled', 'true');
        link.setAttribute('title', 'Select a character first');
      }
    });
    
    logger.debug('Navigation disabled - character selection required');
  }

  setupEventListeners() {
    // GROUND STATE: Character selection (THE ONLY ALLOWED AUTO-TRIGGER)
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
        
        // GROUND STATE: Mark this as user interaction
        GroundStateValidator.validateUserAction('character-selection', { characterId });
        
        // GROUND STATE: Initialize consciousness manager only on user action
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
    console.log(`[APP] USER ACTION: Character selection - ${characterId}`);
    
    // GROUND STATE: This is THE ground state transition event
    GroundStateValidator.logGroundStateTransition('character-selection', { characterId });
    
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
      this.userInteracted = true; // GROUND STATE: Mark user interaction
      
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

        // Start socket monitoring for the selected character
if (window.socketClient && typeof window.socketClient.startMonitoring === 'function') {
  window.socketClient.startMonitoring(this.currentCharacter.id)
    .then(() => {
      console.log('[APP] Socket monitoring started for', this.currentCharacter.id);
    })
    .catch((err) => {
      console.error('[APP] Failed to start socket monitoring:', err);
    });
}
        
        // GROUND STATE: Initialize consciousness with complete data
        if (window.consciousness) {
          console.log('[APP] GROUND STATE: Loading character into consciousness manager');
          window.consciousness.loadCharacter(this.currentCharacter);
        }
        
        // GROUND STATE: Enable navigation after character loads
        this.enableNavigation();
        
        // GROUND STATE: Connect monitor only after user loads character
        if (window.monitor && typeof window.monitor.connectToCharacter === 'function') {
          console.log('[APP] GROUND STATE: Connecting monitor to character');
          try {
            const result = window.monitor.connectToCharacter(this.currentCharacter);
            
            // Handle if connectToCharacter returns a promise
            if (result && typeof result.then === 'function') {
              result.then(() => {
                console.log('[APP] GROUND STATE: Monitor connected successfully');
              }).catch(error => {
                console.error('[APP] GROUND STATE: Monitor connection failed:', error);
              });
            }
          } catch (error) {
            console.error('[APP] GROUND STATE: Error connecting monitor:', error);
          }
        }
        
        this.hideLoading();
        this.showSuccess(`${state.name} consciousness loaded`);
        
        // GROUND STATE: Validate compliance after character load
        setTimeout(() => GroundStateValidator.validateCompliance(), 100);
      }
    } catch (error) {
      logger.error('Failed to select character', { characterId, error });
      this.showError('Failed to load character consciousness');
    } finally {
      this.isLoadingCharacter = false;
    }
  }

  // GROUND STATE: Enable navigation only after character loads
  enableNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
      link.classList.remove('disabled');
      
      // Remove disabled styling
      link.style.opacity = '1';
      link.style.pointerEvents = 'auto';
      link.removeAttribute('title');
      
      // Add click handler if not already present
      if (!link.hasAttribute('data-navigation-enabled')) {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          
          // Update navigation active state
          navLinks.forEach(l => l.classList.remove('active'));
          link.classList.add('active');
          
          const section = link.dataset.section;
          if (section) {
            GroundStateValidator.validateUserAction('navigation', { section });
            this.navigateToSection(section);
          }
        });
        link.setAttribute('data-navigation-enabled', 'true');
      }
    });
    
    console.log('GROUND STATE: Navigation enabled after character load');
  }

  // GROUND STATE: Navigate to section and initialize component if needed
  navigateToSection(sectionName) {
    // Initialize component on first access
    if (!this.components.has(sectionName)) {
      this.initializeComponent(sectionName);
    }
    
    // Show the section
    document.querySelectorAll('.section').forEach(sec => sec.classList.remove('active'));
    const targetSection = document.getElementById(sectionName);
    if (targetSection) {
      targetSection.classList.add('active');
    }
    
    // Update navigation active state
    document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
    const activeLink = document.querySelector(`[data-section="${sectionName}"]`);
    if (activeLink) {
      activeLink.classList.add('active');
    }
  }

  // GROUND STATE: Initialize components only when user navigates to them
  initializeComponent(componentName) {
    console.log(`GROUND STATE: Initializing ${componentName} component`);
    
    switch (componentName) {
      case 'monitor':
        if (window.monitor && typeof window.monitor.initialize === 'function') {
          window.monitor.initialize();
          
          // GROUND STATE: Connect to character if one is loaded
          if (this.currentCharacter && typeof window.monitor.connectToCharacter === 'function') {
            console.log('GROUND STATE: Connecting monitor to current character:', this.currentCharacter.name);
            const result = window.monitor.connectToCharacter(this.currentCharacter);
            
            // Handle promise if returned
            if (result && typeof result.then === 'function') {
              result.then(() => {
                console.log('GROUND STATE: Monitor connected to character successfully');
              }).catch(error => {
                console.error('GROUND STATE: Failed to connect monitor to character:', error);
              });
            }
          }
        }
        break;
      case 'terminal':
        // Terminal automatically subscribes to currentCharacter via state manager
        // No manual initialization needed - it's already initialized on load
        console.log('GROUND STATE: Terminal ready (auto-subscribes to character state)');
        break;
      case 'debugger':
        if (window.debugger && typeof window.debugger.initialize === 'function') {
          window.debugger.initialize();
          // Debugger automatically handles current character in its initialize method
        }
        break;
    }
    
    this.components.set(componentName, true);
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