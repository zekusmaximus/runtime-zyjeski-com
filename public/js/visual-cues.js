// Visual Cue System - Frontend Component
// public/js/visual-cues.js

class VisualCueSystem {
  constructor() {
    this.activeCues = new Map();
    this.cueQueue = [];
    this.isProcessing = false;
    this.styles = this.initializeStyles();
    
    // Initialize cue containers
    this.initializeContainers();
    
    // Listen for narrative events
    if (window.socketClient) {
      window.socketClient.on('narrativeTriggered', (data) => this.handleNarrativeEvent(data));
      window.socketClient.on('visualCueQueued', (data) => this.queueVisualCue(data.cue));
    }
  }

  /**
   * Initialize visual cue containers in the DOM
   */
  initializeContainers() {
    // Create narrative overlay container
    this.narrativeOverlay = document.createElement('div');
    this.narrativeOverlay.id = 'narrative-overlay';
    this.narrativeOverlay.className = 'narrative-overlay';
    document.body.appendChild(this.narrativeOverlay);

    // Create memory fragment container
    this.memoryContainer = document.createElement('div');
    this.memoryContainer.id = 'memory-fragments';
    this.memoryContainer.className = 'memory-fragment-container';
    document.body.appendChild(this.memoryContainer);

    // Create terminal highlight container
    this.terminalHighlights = document.createElement('div');
    this.terminalHighlights.id = 'terminal-highlights';
    this.terminalHighlights.className = 'terminal-highlight-container';
    document.querySelector('#terminal-panel')?.appendChild(this.terminalHighlights);

    // Create monitor visual effects container
    this.monitorEffects = document.createElement('div');
    this.monitorEffects.id = 'monitor-effects';
    this.monitorEffects.className = 'monitor-effects-container';
    document.querySelector('#monitor-panel')?.appendChild(this.monitorEffects);
  }

  /**
   * Initialize CSS styles for visual cues
   */
  initializeStyles() {
    // Styles are now loaded from external CSS file: /css/visual-cues.css
    // This method is kept for compatibility but does nothing
    console.log('Visual cues styles loaded from external CSS file');
    return null;
  }

  /**
   * Handle narrative events from the backend
   */
  async handleNarrativeEvent(data) {
    const { narrative, characterId, triggerId } = data;
    
    switch (narrative.type) {
      case 'character_moment':
        await this.showCharacterMoment(narrative.content, narrative.duration);
        break;
        
      case 'system_message':
        await this.showSystemMessage(narrative.content, narrative.duration);
        break;
        
      case 'memory_injection':
        this.showMemoryFragment(narrative.content, narrative.duration);
        break;
        
      case 'technical_revelation':
        await this.showTechnicalRevelation(narrative.content, narrative.duration);
        break;
        
      case 'chapter_transition':
        await this.showChapterTransition(narrative.content, narrative.duration);
        break;
        
      case 'critical_moment':
        await this.showCriticalMoment(narrative.content, narrative.duration);
        break;
    }
    
    // Handle visual cue if present
    if (narrative.visualCue) {
      this.processVisualCue(narrative.visualCue);
    }
  }

  /**
   * Show character moment narrative
   */
  async showCharacterMoment(content, duration = 8000) {
    return this.showNarrativeOverlay(content, duration, 'character-moment');
  }

  /**
   * Show system message narrative
   */
  async showSystemMessage(content, duration = 6000) {
    return this.showNarrativeOverlay(content, duration, 'system-message');
  }

  /**
   * Show technical revelation narrative
   */
  async showTechnicalRevelation(content, duration = 12000) {
    return this.showNarrativeOverlay(content, duration, 'technical-revelation');
  }

  /**
   * Show narrative overlay with content
   */
  async showNarrativeOverlay(content, duration, type) {
    return new Promise((resolve) => {
      // Clear any existing overlay
      this.narrativeOverlay.innerHTML = '';
      
      // Create content container
      const contentDiv = document.createElement('div');
      contentDiv.className = `narrative-content ${type}`;
      
      // Add title if present
      if (content.title) {
        const title = document.createElement('div');
        title.className = 'narrative-title';
        title.textContent = content.title;
        contentDiv.appendChild(title);
      }
      
      // Add main text
      const text = document.createElement('div');
      text.className = 'narrative-text';
      text.textContent = content.text;
      contentDiv.appendChild(text);
      
      // Add continue button
      const continueBtn = document.createElement('button');
      continueBtn.className = 'narrative-continue';
      continueBtn.textContent = 'Continue';
      continueBtn.onclick = () => {
        this.hideNarrativeOverlay();
        resolve();
      };
      contentDiv.appendChild(continueBtn);
      
      // Show overlay
      this.narrativeOverlay.appendChild(contentDiv);
      this.narrativeOverlay.style.display = 'flex';
      
      // Auto-hide after duration if not clicked
      setTimeout(() => {
        if (this.narrativeOverlay.style.display === 'flex') {
          this.hideNarrativeOverlay();
          resolve();
        }
      }, duration);
    });
  }

  /**
   * Hide narrative overlay
   */
  hideNarrativeOverlay() {
    this.narrativeOverlay.style.display = 'none';
    this.narrativeOverlay.innerHTML = '';
  }

  /**
   * Show memory fragment as side panel
   */
  showMemoryFragment(content, duration = 8000) {
    const fragment = document.createElement('div');
    fragment.className = 'memory-fragment';
    
    if (content.memoryAddress) {
      const address = document.createElement('div');
      address.className = 'memory-address';
      address.textContent = `Memory: ${content.memoryAddress}`;
      fragment.appendChild(address);
    }
    
    const text = document.createElement('div');
    text.textContent = content.text;
    fragment.appendChild(text);
    
    this.memoryContainer.appendChild(fragment);
    
    // Auto-remove after duration
    setTimeout(() => {
      if (fragment.parentNode) {
        fragment.style.animation = 'fadeOut 1s forwards';
        setTimeout(() => fragment.remove(), 1000);
      }
    }, duration);
  }

  /**
   * Show chapter transition
   */
  async showChapterTransition(content, duration = 4000) {
    return new Promise((resolve) => {
      const transition = document.createElement('div');
      transition.className = 'chapter-transition';
      
      const title = document.createElement('div');
      title.textContent = content.title;
      title.style.fontSize = '2.5rem';
      title.style.marginBottom = '1rem';
      
      const text = document.createElement('div');
      text.textContent = content.text;
      text.style.fontSize = '1.2rem';
      text.style.opacity = '0.8';
      
      transition.appendChild(title);
      transition.appendChild(text);
      document.body.appendChild(transition);
      
      setTimeout(() => {
        transition.remove();
        resolve();
      }, duration);
    });
  }

  /**
   * Show critical system moment
   */
  async showCriticalMoment(content, duration = 6000) {
    // Add critical alert background
    const alert = document.createElement('div');
    alert.className = 'critical-alert';
    document.body.appendChild(alert);
    
    // Show main content
    await this.showNarrativeOverlay(content, duration, 'critical-moment');
    
    // Remove alert background
    alert.remove();
  }

  /**
   * Process visual cues for UI elements
   */
  processVisualCue(cue) {
    switch (cue.type) {
      case 'memory_fragment':
        this.highlightMemoryRegion(cue);
        break;
        
      case 'terminal_highlight':
        this.highlightTerminalElement(cue);
        break;
        
      case 'process_pulse':
        this.pulseProcessElement(cue);
        break;
        
      case 'timeline_visualization':
        this.showTimelineEffect(cue);
        break;
        
      case 'system_alert':
        this.showSystemAlert(cue);
        break;
    }
  }

  /**
   * Highlight memory region in monitor
   */
  highlightMemoryRegion(cue) {
    const memorySection = document.querySelector('#memory-usage');
    if (!memorySection) return;

    const highlight = document.createElement('div');
    highlight.className = 'memory-highlight-overlay';

    memorySection.classList.add('memory-highlight-container');
    memorySection.appendChild(highlight);

    setTimeout(() => {
      highlight.remove();
      memorySection.classList.remove('memory-highlight-container');
    }, 4000);
  }

  /**
   * Highlight terminal element
   */
  highlightTerminalElement(cue) {
    const terminal = document.querySelector('#terminal-output');
    if (!terminal) return;

    const highlight = document.createElement('div');
    highlight.className = 'terminal-highlight-overlay';

    this.terminalHighlights.appendChild(highlight);

    setTimeout(() => highlight.remove(), 2000);
  }

  /**
   * Pulse process element in monitor
   */
  pulseProcessElement(cue) {
    const processElements = document.querySelectorAll('.process-item');
    processElements.forEach(element => {
      if (element.textContent.includes('Grief_Manager') ||
          element.textContent.includes('Search_Protocol')) {

        const pulse = document.createElement('div');
        pulse.className = 'process-pulse-overlay';

        element.classList.add('process-pulse-container');
        element.appendChild(pulse);

        setTimeout(() => {
          pulse.remove();
          element.classList.remove('process-pulse-container');
        }, 6000);
      }
    });
  }

  /**
   * Show timeline effect
   */
  showTimelineEffect(cue) {
    const effect = document.createElement('div');
    effect.className = 'timeline-visualization';
    this.monitorEffects.appendChild(effect);
    
    setTimeout(() => effect.remove(), 8000);
  }

  /**
   * Show system-wide alert
   */
  showSystemAlert(cue) {
    if (cue.location === 'all_panels') {
      // Add pulsing effect to all panels
      const panels = document.querySelectorAll('.panel');
      panels.forEach(panel => {
        panel.style.boxShadow = '0 0 20px rgba(255, 0, 0, 0.5)';
        panel.style.animation = 'criticalPulse 1s infinite alternate';
      });
      
      setTimeout(() => {
        panels.forEach(panel => {
          panel.style.boxShadow = '';
          panel.style.animation = '';
        });
      }, 5000);
    }
  }

  /**
   * Queue visual cue for processing
   */
  queueVisualCue(cue) {
    this.cueQueue.push(cue);
    if (!this.isProcessing) {
      this.processNextCue();
    }
  }

  /**
   * Process next cue in queue
   */
  async processNextCue() {
    if (this.cueQueue.length === 0) {
      this.isProcessing = false;
      return;
    }
    
    this.isProcessing = true;
    const cue = this.cueQueue.shift();
    
    this.processVisualCue(cue);
    
    // Wait before processing next cue
    setTimeout(() => this.processNextCue(), 1000);
  }

  /**
   * Enhanced terminal commands integration
   */
  enhanceTerminalCommands() {
    if (!window.terminal) return;
    
    // Add narrative-specific commands
    const narrativeCommands = {
      'memories': {
        description: 'Access character memory fragments',
        category: 'narrative',
        execute: async (args) => {
          const result = await this.handleMemoryCommand(args);
          if (result.memories) {
            this.showMemoryList(result.memories);
          }
          return result;
        }
      },
      
      'story': {
        description: 'View current story progression',
        category: 'narrative',
        execute: async (args) => {
          const progress = await this.getStoryProgress();
          this.showStoryProgress(progress);
          return progress;
        }
      },
      
      'timeline': {
        description: 'Analyze temporal convergence points',
        category: 'narrative',
        execute: async (args) => {
          // Trigger timeline visualization
          this.showTimelineEffect({ type: 'timeline_visualization' });
          
          const result = await this.handleTimelineCommand(args);
          if (result.convergencePoints) {
            this.showTimelineAnalysis(result.convergencePoints);
          }
          return result;
        }
      }
    };
    
    // Register commands with terminal
    Object.entries(narrativeCommands).forEach(([cmd, config]) => {
      window.terminal.addCommand(cmd, config);
    });
  }

  /**
   * Show memory list in terminal
   */
  showMemoryList(memories) {
    if (!window.terminal) return;
    
    window.terminal.addOutput('Available Memory Fragments:', 'info');
    memories.forEach(memory => {
      window.terminal.addOutput(
        `  ${memory.address}: ${memory.description}`,
        memory.accessible ? 'success' : 'warning'
      );
    });
  }

  /**
   * Show story progress visualization
   */
  showStoryProgress(progress) {
    if (!window.terminal) return;
    
    window.terminal.addOutput('Story Progression Analysis:', 'info');
    window.terminal.addOutput(`Current Chapter: ${progress.chapter}`, 'info');
    window.terminal.addOutput(`Progress: ${(progress.completion * 100).toFixed(1)}%`, 'info');
    window.terminal.addOutput(`Debugging Success Rate: ${progress.successRate}%`, 
      progress.successRate > 70 ? 'success' : 'warning');
  }

  /**
   * Show timeline analysis
   */
  showTimelineAnalysis(convergencePoints) {
    if (!window.terminal) return;
    
    window.terminal.addOutput('Temporal Convergence Analysis:', 'info');
    convergencePoints.forEach(point => {
      window.terminal.addOutput(
        `  Timeline ${point.id}: ${point.description} (Probability: ${point.probability})`,
        point.probability > 0.7 ? 'warning' : 'info'
      );
    });
  }

  /**
   * Integration with consciousness manager
   */
  integrateWithConsciousness() {
    if (!window.consciousness) return;
    
    // Listen for consciousness updates to trigger visual cues
    const originalNotify = window.consciousness.notifyComponents;
    window.consciousness.notifyComponents = (event, data) => {
      // Call original method
      originalNotify.call(window.consciousness, event, data);
      
      // Check for visual cue triggers
      this.checkConsciousnessForCues(event, data);
    };
  }

  /**
   * Check consciousness updates for visual cue triggers
   */
  checkConsciousnessForCues(event, data) {
    if (event === 'consciousness-updated' && data) {
      // Memory leak visual cue
      const griefProcess = data.processes?.find(p => p.name.includes('Grief_Manager'));
      if (griefProcess?.memoryUsage > 800) {
        this.queueVisualCue({
          type: 'memory_fragment',
          location: 'monitor',
          style: 'pulsing_red'
        });
      }
      
      // Search loop visual cue
      const searchProcess = data.processes?.find(p => p.name.includes('Search_Protocol'));
      if (searchProcess?.status === 'infinite_loop') {
        this.queueVisualCue({
          type: 'process_pulse',
          location: 'monitor',
          style: 'warning_pulse'
        });
      }
      
      // Relationship starvation visual cue
      const relationshipProcess = data.processes?.find(p => p.name.includes('Relationship_Handler'));
      if (relationshipProcess?.threads?.available < 2) {
        this.queueVisualCue({
          type: 'terminal_highlight',
          location: 'terminal',
          style: 'relationship_warning'
        });
      }
    }
  }

  /**
   * Initialize the visual cue system
   */
  initialize() {
    // Enhance terminal with narrative commands
    this.enhanceTerminalCommands();
    
    // Integrate with consciousness manager
    this.integrateWithConsciousness();
    
    // Add fadeOut animation to styles
    const fadeOutStyle = `
      @keyframes fadeOut {
        from { opacity: 1; transform: translateY(0); }
        to { opacity: 0; transform: translateY(-20px); }
      }
    `;
    this.styles.textContent += fadeOutStyle;
    
    console.log('Visual Cue System initialized');
  }

  /**
   * Cleanup resources
   */
  destroy() {
    this.narrativeOverlay?.remove();
    this.memoryContainer?.remove();
    this.terminalHighlights?.remove();
    this.monitorEffects?.remove();
    this.styles?.remove();
    
    this.activeCues.clear();
    this.cueQueue = [];
  }
}

// Initialize visual cue system
document.addEventListener('DOMContentLoaded', () => {
  window.visualCues = new VisualCueSystem();
  window.visualCues.initialize();
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = VisualCueSystem;
}