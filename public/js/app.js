// public/js/app.js
import { createLogger } from '/js/logger.js';
const logger = createLogger('App');

import GroundStateValidator from '/js/ground-state-validator.js';

// Note: All dependencies will be injected by bootstrap - no direct imports needed

// Note: Socket → State Manager sync will be handled by bootstrap with dependency injection

class RuntimeApp {
  constructor(dependencies = {}) {
    // Dependency injection - accept dependencies instead of global access
    const { stateManager, socketClient, consciousness, monitor, terminal, debugger: debuggerInterface, logger } = dependencies;

    this.stateManager = stateManager;
    this.socketClient = socketClient;
    this.consciousness = consciousness;
    this.monitor = monitor;
    this.terminal = terminal;
    this.debuggerInterface = debuggerInterface;
    this.logger = logger || createLogger('App');

    // Set up state subscriptions for UI updates
    this.setupStateSubscriptions();
    this.initializeApp();
  }

  setupStateSubscriptions() {
    if (!this.stateManager) return;

    // Subscribe to character changes for UI updates
    this.stateManager.subscribe('currentCharacter', (character) => {
      if (character) {
        this.updateCharacterSelection(character.id);
        this.enableNavigation();

        // Connect monitor to character
        if (this.monitor && typeof this.monitor.connectToCharacter === 'function') {
          this.logger.info('GROUND STATE: Connecting monitor to character via subscription');
          const result = this.monitor.connectToCharacter(character);
          if (result && typeof result.then === 'function') {
            result.then(() => {
              this.logger.info('GROUND STATE: Monitor connected successfully via subscription');
            }).catch(err => {
              this.logger.error('Failed to connect monitor via subscription:', err);
            });
          }
        }
      }
    });

    // Subscribe to loading state changes for UI updates
    this.stateManager.subscribe('isLoadingCharacter', (isLoading) => {
      if (isLoading) {
        this.showLoading('Loading character consciousness...');
      } else {
        this.hideLoading();
      }
    });

    // Subscribe to user interaction state
    this.stateManager.subscribe('userInteracted', (interacted) => {
      if (interacted) {
        this.logger.info('User interaction detected via state subscription');
      }
    });
  }

  // Convenience getters for accessing state
  get currentCharacter() {
    return this.stateManager ? this.stateManager.getCurrentCharacter() : null;
  }

  get isLoadingCharacter() {
    return this.stateManager ? this.stateManager.getIsLoadingCharacter() : false;
  }

  get userInteracted() {
    return this.stateManager ? this.stateManager.getUserInteracted() : false;
  }

  get components() {
    return this.stateManager ? this.stateManager.getInitializedComponents() : new Set();
  }

  async initializeApp() {
    this.logger.info('Initializing Runtime.zyjeski.com in Ground State');
    
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
    
    this.logger.info('App initialization complete - Ground State maintained');
    
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
      this.logger.debug('No navigation links found – skipping navigation setup');
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
        
        // GROUND STATE: Consciousness manager is already initialized via dependency injection
        // No need to initialize here - it's handled by bootstrap
        
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
    logger.info(`USER ACTION: Character selection - ${characterId}`);

    // GROUND STATE: This is THE ground state transition event
    GroundStateValidator.logGroundStateTransition('character-selection', { characterId });

    // Prevent concurrent character loads
    if (this.isLoadingCharacter) {
      logger.debug('Character loading already in progress', { characterId });
      return;
    }

    // If the same character is already loaded, don't reload
    if (this.currentCharacter && this.currentCharacter.id === characterId) {
      this.logger.debug('Character already loaded', { characterId });
      this.updateCharacterSelection(characterId);
      return;
    }

    try {
      // Update state through StateManager - subscriptions will handle UI updates
      if (this.stateManager) {
        this.stateManager.setIsLoadingCharacter(true);
        this.stateManager.setUserInteracted(true); // GROUND STATE: Mark user interaction

        // Load character through StateManager
        await this.stateManager.loadCharacter(characterId);
      }
      
      // NEW: Also load consciousness state into state manager
      this.logger.info('Loading consciousness state for character...');
      try {
        const stateResponse = await fetch(`/api/consciousness/${characterId}/state`);
        if (stateResponse.ok) {
          const consciousnessData = await stateResponse.json();
          this.logger.info('Consciousness data loaded successfully');

          // Update state manager with consciousness data
          if (this.stateManager) {
            this.stateManager.updateConsciousnessData(consciousnessData);
            this.logger.info('State manager updated with initial consciousness data');
          } else {
            this.logger.error('State manager not available');
          }
        } else {
          this.logger.error('Failed to load consciousness state:', stateResponse.status);
        }
      } catch (error) {
        this.logger.error('Error loading consciousness state:', error);
        // Don't fail the entire character load if consciousness fails
      }
      
      // Get the loaded character from state manager
      const character = this.stateManager.getCurrentCharacter();
      if (character) {
        // Start socket monitoring for the selected character
        if (this.socketClient && typeof this.socketClient.startMonitoring === 'function') {
          this.socketClient.startMonitoring(character.id)
            .then(() => {
              this.logger.info('Socket monitoring started for', character.id);
            })
            .catch((err) => {
              this.logger.error('Failed to start socket monitoring:', err);
            });
        }

        // GROUND STATE: Initialize consciousness with complete data
        if (this.consciousness) {
          this.logger.info('GROUND STATE: Loading character into consciousness manager');
          this.consciousness.loadCharacter(character);
        }

        // Note: UI updates (updateCharacterSelection, enableNavigation, monitor connection)
        // are now handled by state subscriptions in setupStateSubscriptions()

        this.showSuccess(`${character.name} consciousness loaded`);

        // GROUND STATE: Validate compliance after character load
        setTimeout(() => GroundStateValidator.validateCompliance(), 100);
      }
    } catch (error) {
      this.logger.error('Failed to select character', { characterId, error });
      this.showError('Failed to load character consciousness');
    } finally {
      if (this.stateManager) {
        this.stateManager.setIsLoadingCharacter(false);
      }
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

    logger.info('GROUND STATE: Navigation enabled after character load');
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
    this.logger.info(`GROUND STATE: Initializing ${componentName} component`);

    switch (componentName) {
      case 'monitor':
        if (this.monitor && typeof this.monitor.initialize === 'function') {
          this.monitor.initialize();

          // GROUND STATE: Connect to character if one is loaded
          if (this.currentCharacter && typeof this.monitor.connectToCharacter === 'function') {
            this.logger.info('GROUND STATE: Connecting monitor to current character:', this.currentCharacter.name);
            const result = this.monitor.connectToCharacter(this.currentCharacter);

            // Handle promise if returned
            if (result && typeof result.then === 'function') {
              result.then(() => {
                this.logger.info('GROUND STATE: Monitor connected to character successfully');
              }).catch(error => {
                this.logger.error('GROUND STATE: Failed to connect monitor to character:', error);
              });
            }
          }
        }
        break;
      case 'terminal':
        // Terminal automatically subscribes to currentCharacter via state manager
        // No manual initialization needed - it's already initialized on load
        this.logger.info('GROUND STATE: Terminal ready (auto-subscribes to character state)');
        break;
      case 'debugger':
        if (this.debuggerInterface && typeof this.debuggerInterface.initialize === 'function') {
          this.debuggerInterface.initialize();
          // Debugger automatically handles current character in its initialize method
        }
        break;
    }
    
    if (this.stateManager) {
      this.stateManager.addInitializedComponent(componentName);
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

// Export RuntimeApp class for dependency injection
export default RuntimeApp;