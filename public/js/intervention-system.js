// public/js/intervention-system.js
class InterventionSystem {
  constructor() {
    this.activeInterventions = new Map();
    this.interventionHistory = [];
    this.storyImpact = new Map();
    
    this.interventionTypes = {
      'memory-release': {
        name: 'Memory Release Protocol',
        description: 'Gradually release emotional memory blocks',
        target: 'Grief_Manager.exe',
        impact: 'gentle',
        requirements: {
          memory_usage: { min: 500 }
        },
        effects: {
          memory_reduction: 0.3,
          stability_risk: 0.1,
          healing_rate: 0.7
        }
      },
      'force-terminate': {
        name: 'Force Terminate Process',
        description: 'Forcefully end a runaway process',
        target: 'any',
        impact: 'harsh',
        requirements: {
          cpu_usage: { min: 70 }
        },
        effects: {
          immediate_stop: true,
          data_loss_risk: 0.8,
          trauma_increase: 0.5
        }
      },
      'loop-breaker': {
        name: 'Loop Breaker Injection',
        description: 'Insert exit condition into infinite loops',
        target: 'Search_Protocol.exe',
        impact: 'moderate',
        requirements: {
          loop_detected: true
        },
        effects: {
          loop_resolution: 0.9,
          acceptance_increase: 0.6,
          reality_sync: 0.4
        }
      },
      'thread-rebalance': {
        name: 'Thread Rebalancing',
        description: 'Redistribute processing threads across processes',
        target: 'Relationship_Handler.exe',
        impact: 'therapeutic',
        requirements: {
          thread_starvation: true
        },
        effects: {
          attention_redistribution: 0.8,
          relationship_healing: 0.7,
          overall_balance: 0.6
        }
      },
      'temporal-sync': {
        name: 'Temporal Synchronization',
        description: 'Realign temporal perception with current timeline',
        target: 'Temporal_Sync.dll',
        impact: 'complex',
        requirements: {
          desync_level: { min: 50 }
        },
        effects: {
          timeline_coherence: 0.8,
          memory_consolidation: 0.5,
          disorientation_risk: 0.3
        }
      },
      'memory-optimization': {
        name: 'Memory Defragmentation',
        description: 'Optimize memory allocation without data loss',
        target: 'system',
        impact: 'gentle',
        requirements: {
          fragmentation: { min: 30 }
        },
        effects: {
          memory_efficiency: 0.6,
          process_speed: 0.3,
          stability_increase: 0.4
        }
      },
      'emotional-throttle': {
        name: 'Emotional Processing Throttle',
        description: 'Limit CPU usage for overwhelming emotions',
        target: 'any',
        impact: 'moderate',
        requirements: {
          cpu_usage: { min: 80 }
        },
        effects: {
          cpu_reduction: 0.5,
          emotional_numbing: 0.3,
          stability_increase: 0.6
        }
      },
      'acceptance-protocol': {
        name: 'Acceptance Protocol Installation',
        description: 'Install acceptance subroutines into grief processing',
        target: 'Grief_Manager.exe',
        impact: 'therapeutic',
        requirements: {
          grief_stage: { min: 2 }
        },
        effects: {
          acceptance_increase: 0.8,
          memory_preservation: 0.9,
          peace_level: 0.7
        }
      }
    };
    
    this.init();
  }

  init() {
    this.setupUI();
    this.setupEventListeners();
    this.subscribeToStateChanges();
  }

  setupUI() {
    // Add intervention panel to debugger
    const debuggerSection = document.getElementById('debugger');
    if (!debuggerSection) return;
    
    const interventionPanel = document.createElement('div');
    interventionPanel.className = 'intervention-panel';
    interventionPanel.innerHTML = `
      <div class="panel-header">
        <h3>Intervention Options</h3>
        <button class="btn-help" title="Learn about interventions">?</button>
      </div>
      <div class="intervention-list" id="intervention-list">
        <!-- Interventions will be populated here -->
      </div>
      <div class="intervention-details" id="intervention-details" style="display: none;">
        <h4 class="intervention-name"></h4>
        <p class="intervention-description"></p>
        <div class="intervention-requirements">
          <h5>Requirements:</h5>
          <ul class="requirements-list"></ul>
        </div>
        <div class="intervention-effects">
          <h5>Expected Effects:</h5>
          <ul class="effects-list"></ul>
        </div>
        <div class="intervention-actions">
          <button class="btn-apply" disabled>Apply Intervention</button>
          <button class="btn-cancel">Cancel</button>
        </div>
      </div>
      <div class="intervention-history-panel">
        <h4>Intervention History</h4>
        <div class="history-list" id="intervention-history">
          <!-- History will be populated here -->
        </div>
      </div>
    `;
    
    // Find or create debugger panels container
    let panelsContainer = debuggerSection.querySelector('.debugger-panels');
    if (!panelsContainer) {
      panelsContainer = document.createElement('div');
      panelsContainer.className = 'debugger-panels';
      debuggerSection.appendChild(panelsContainer);
    }
    
    panelsContainer.appendChild(interventionPanel);
  }

  setupEventListeners() {
    // Intervention selection
    document.addEventListener('click', (e) => {
      if (e.target.closest('.intervention-item')) {
        const item = e.target.closest('.intervention-item');
        const interventionId = item.dataset.interventionId;
        this.selectIntervention(interventionId);
      }
      
      if (e.target.classList.contains('btn-apply')) {
        this.applySelectedIntervention();
      }
      
      if (e.target.classList.contains('btn-cancel')) {
        this.clearSelection();
      }
      
      if (e.target.closest('.btn-help')) {
        this.showInterventionHelp();
      }
    });
  }

  subscribeToStateChanges() {
    if (window.stateManager) {
      window.stateManager.subscribe('consciousness-updated', (data) => {
        this.updateAvailableInterventions(data);
      });
    }
  }

  updateAvailableInterventions(consciousnessData) {
    if (!consciousnessData) return;
    
    const availableInterventions = this.getAvailableInterventions(consciousnessData);
    this.renderInterventionList(availableInterventions, consciousnessData);
  }

  getAvailableInterventions(consciousnessData) {
    const available = [];
    
    for (const [id, intervention] of Object.entries(this.interventionTypes)) {
      if (this.checkRequirements(intervention, consciousnessData)) {
        available.push({ id, ...intervention });
      }
    }
    
    return available;
  }

  checkRequirements(intervention, consciousnessData) {
    const { requirements, target } = intervention;
    
    // Check if target process exists
    if (target !== 'any' && target !== 'system') {
      const targetProcess = consciousnessData.processes.find(p => p.name === target);
      if (!targetProcess) return false;
      
      // Check process-specific requirements
      for (const [key, condition] of Object.entries(requirements)) {
        if (key === 'memory_usage' && condition.min) {
          if (!targetProcess.memory || targetProcess.memory < condition.min) return false;
        }
        if (key === 'cpu_usage' && condition.min) {
          if (!targetProcess.cpu_usage || targetProcess.cpu_usage < condition.min) return false;
        }
        if (key === 'loop_detected') {
          const hasLoop = consciousnessData.errors.some(e => 
            e.type === 'infinite_loop' && e.process === target
          );
          if (!hasLoop) return false;
        }
        if (key === 'thread_starvation') {
          const hasStarvation = consciousnessData.errors.some(e => 
            e.type === 'thread_starvation' && e.process === target
          );
          if (!hasStarvation) return false;
        }
      }
    }
    
    // Check system-wide requirements
    if (requirements.fragmentation && requirements.fragmentation.min) {
      // Calculate memory fragmentation
      const fragmentation = this.calculateFragmentation(consciousnessData);
      if (fragmentation < requirements.fragmentation.min) return false;
    }
    
    if (requirements.desync_level && requirements.desync_level.min) {
      const desyncError = consciousnessData.errors.find(e => e.type === 'temporal_desync');
      if (!desyncError || desyncError.severity < requirements.desync_level.min) return false;
    }
    
    return true;
  }

  calculateFragmentation(consciousnessData) {
    // Simplified fragmentation calculation
    const totalMemory = consciousnessData.resources.memory.max;
    const usedMemory = consciousnessData.resources.memory.current;
    const processMemory = consciousnessData.processes.reduce((sum, p) => sum + (p.memory || 0), 0);
    
    return ((usedMemory - processMemory) / totalMemory) * 100;
  }

  renderInterventionList(interventions, consciousnessData) {
    const listElement = document.getElementById('intervention-list');
    if (!listElement) return;
    
    if (interventions.length === 0) {
      listElement.innerHTML = `
        <div class="no-interventions">
          <p>No interventions available for current consciousness state.</p>
          <p class="hint">Run diagnostics to identify issues.</p>
        </div>
      `;
      return;
    }
    
    listElement.innerHTML = interventions.map(intervention => {
      const impact = this.calculateImpact(intervention, consciousnessData);
      const riskLevel = this.calculateRisk(intervention);
      
      return `
        <div class="intervention-item" data-intervention-id="${intervention.id}">
          <div class="intervention-header">
            <span class="intervention-title">${intervention.name}</span>
            <span class="intervention-impact impact-${intervention.impact}">${intervention.impact}</span>
          </div>
          <div class="intervention-target">Target: ${intervention.target}</div>
          <div class="intervention-metrics">
            <span class="impact-score">Impact: ${Math.round(impact * 100)}%</span>
            <span class="risk-level risk-${riskLevel}">Risk: ${riskLevel}</span>
          </div>
        </div>
      `;
    }).join('');
  }

  calculateImpact(intervention, consciousnessData) {
    // Calculate expected positive impact
    const effects = intervention.effects;
    let totalImpact = 0;
    let factorCount = 0;
    
    for (const [effect, value] of Object.entries(effects)) {
      if (effect.includes('increase') || effect.includes('healing') || 
          effect.includes('resolution') || effect.includes('optimization')) {
        totalImpact += value;
        factorCount++;
      }
    }
    
    return factorCount > 0 ? totalImpact / factorCount : 0;
  }

  calculateRisk(intervention) {
    const effects = intervention.effects;
    let riskScore = 0;
    
    if (effects.data_loss_risk) riskScore += effects.data_loss_risk;
    if (effects.trauma_increase) riskScore += effects.trauma_increase;
    if (effects.disorientation_risk) riskScore += effects.disorientation_risk;
    if (effects.emotional_numbing) riskScore += effects.emotional_numbing;
    if (effects.stability_risk) riskScore += effects.stability_risk;
    
    if (riskScore > 0.6) return 'high';
    if (riskScore > 0.3) return 'medium';
    return 'low';
  }

  selectIntervention(interventionId) {
    const intervention = this.interventionTypes[interventionId];
    if (!intervention) return;
    
    // Update UI
    document.querySelectorAll('.intervention-item').forEach(item => {
      item.classList.toggle('selected', item.dataset.interventionId === interventionId);
    });
    
    // Show details
    const detailsPanel = document.getElementById('intervention-details');
    if (detailsPanel) {
      detailsPanel.style.display = 'block';
      
      detailsPanel.querySelector('.intervention-name').textContent = intervention.name;
      detailsPanel.querySelector('.intervention-description').textContent = intervention.description;
      
      // Requirements
      const reqList = detailsPanel.querySelector('.requirements-list');
      reqList.innerHTML = this.formatRequirements(intervention.requirements);
      
      // Effects
      const effectsList = detailsPanel.querySelector('.effects-list');
      effectsList.innerHTML = this.formatEffects(intervention.effects);
      
      // Enable apply button
      const applyBtn = detailsPanel.querySelector('.btn-apply');
      applyBtn.disabled = false;
      applyBtn.dataset.interventionId = interventionId;
    }
  }

  formatRequirements(requirements) {
    const items = [];
    
    for (const [key, value] of Object.entries(requirements)) {
      let text = '';
      switch (key) {
        case 'memory_usage':
          text = `Memory usage above ${value.min}MB`;
          break;
        case 'cpu_usage':
          text = `CPU usage above ${value.min}%`;
          break;
        case 'loop_detected':
          text = 'Infinite loop detected';
          break;
        case 'thread_starvation':
          text = 'Thread starvation detected';
          break;
        case 'fragmentation':
          text = `Memory fragmentation above ${value.min}%`;
          break;
        case 'desync_level':
          text = `Temporal desync level above ${value.min}`;
          break;
        default:
          text = `${key}: ${JSON.stringify(value)}`;
      }
      items.push(`<li>${text}</li>`);
    }
    
    return items.join('');
  }

  formatEffects(effects) {
    const items = [];
    
    for (const [key, value] of Object.entries(effects)) {
      let text = '';
      let className = '';
      
      switch (key) {
        case 'memory_reduction':
          text = `Memory usage reduction: ${Math.round(value * 100)}%`;
          className = 'positive';
          break;
        case 'stability_risk':
          text = `Stability risk: ${Math.round(value * 100)}%`;
          className = 'negative';
          break;
        case 'healing_rate':
          text = `Healing rate: ${Math.round(value * 100)}%`;
          className = 'positive';
          break;
        case 'data_loss_risk':
          text = `Data loss risk: ${Math.round(value * 100)}%`;
          className = 'negative';
          break;
        case 'acceptance_increase':
          text = `Acceptance increase: ${Math.round(value * 100)}%`;
          className = 'positive';
          break;
        case 'emotional_numbing':
          text = `Emotional numbing: ${Math.round(value * 100)}%`;
          className = 'warning';
          break;
        default:
          text = `${key.replace(/_/g, ' ')}: ${typeof value === 'boolean' ? value : Math.round(value * 100) + '%'}`;
          className = key.includes('risk') || key.includes('loss') ? 'negative' : 'positive';
      }
      
      items.push(`<li class="${className}">${text}</li>`);
    }
    
    return items.join('');
  }

  clearSelection() {
    document.querySelectorAll('.intervention-item').forEach(item => {
      item.classList.remove('selected');
    });
    
    const detailsPanel = document.getElementById('intervention-details');
    if (detailsPanel) {
      detailsPanel.style.display = 'none';
    }
  }

  async applySelectedIntervention() {
    const applyBtn = document.querySelector('.btn-apply');
    const interventionId = applyBtn.dataset.interventionId;
    
    if (!interventionId) return;
    
    const intervention = this.interventionTypes[interventionId];
    if (!intervention) return;
    
    // Disable button during application
    applyBtn.disabled = true;
    applyBtn.textContent = 'Applying...';
    
    try {
      // Send intervention to server
      const result = await this.sendIntervention(interventionId, intervention);
      
      // Record in history
      this.recordIntervention(interventionId, intervention, result);
      
      // Update story impact
      this.updateStoryImpact(interventionId, result);
      
      // Show result
      this.showInterventionResult(result);
      
      // Clear selection
      this.clearSelection();
      
    } catch (error) {
      console.error('Failed to apply intervention:', error);
      this.showError('Failed to apply intervention. Please try again.');
    } finally {
      applyBtn.disabled = false;
      applyBtn.textContent = 'Apply Intervention';
    }
  }

  async sendIntervention(interventionId, intervention) {
    return new Promise((resolve, reject) => {
      if (!window.socketClient) {
        reject(new Error('Socket connection not available'));
        return;
      }
      
      const characterId = window.stateManager?.currentCharacter?.id || 'alexander-kane';
      
      window.socketClient.emitToServer('apply-intervention', {
        characterId,
        interventionId,
        intervention,
        timestamp: new Date().toISOString()
      });
      
      // Listen for response
      const responseHandler = (data) => {
        if (data.interventionId === interventionId) {
          window.socketClient.off('intervention-result', responseHandler);
          resolve(data);
        }
      };
      
      window.socketClient.on('intervention-result', responseHandler);
      
      // Timeout after 10 seconds
      setTimeout(() => {
        window.socketClient.off('intervention-result', responseHandler);
        reject(new Error('Intervention timeout'));
      }, 10000);
    });
  }

  recordIntervention(interventionId, intervention, result) {
    const record = {
      id: interventionId,
      name: intervention.name,
      timestamp: new Date().toISOString(),
      result: result.success ? 'success' : 'failed',
      impact: result.impact || {},
      storyChanges: result.storyChanges || []
    };
    
    this.interventionHistory.push(record);
    this.updateHistoryDisplay();
  }

  updateHistoryDisplay() {
    const historyElement = document.getElementById('intervention-history');
    if (!historyElement) return;
    
    if (this.interventionHistory.length === 0) {
      historyElement.innerHTML = '<p class="no-history">No interventions applied yet.</p>';
      return;
    }
    
    historyElement.innerHTML = this.interventionHistory
      .slice(-5) // Show last 5 interventions
      .reverse()
      .map(record => `
        <div class="history-item ${record.result}">
          <div class="history-header">
            <span class="history-name">${record.name}</span>
            <span class="history-time">${this.formatTime(record.timestamp)}</span>
          </div>
          <div class="history-result">Result: ${record.result}</div>
          ${record.storyChanges.length > 0 ? `
            <div class="history-impact">
              Story impact: ${record.storyChanges.join(', ')}
            </div>
          ` : ''}
        </div>
      `).join('');
  }

  formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  }

  updateStoryImpact(interventionId, result) {
    if (!result.storyChanges || result.storyChanges.length === 0) return;
    
    // Track cumulative story impact
    result.storyChanges.forEach(change => {
      const current = this.storyImpact.get(change) || 0;
      this.storyImpact.set(change, current + 1);
    });
    
    // Notify story system
    if (window.storyEngine) {
      window.storyEngine.processStoryImpact(this.storyImpact);
    }
  }

  showInterventionResult(result) {
    const message = result.success
      ? `Intervention successful! ${result.message || 'Consciousness state updated.'}`
      : `Intervention failed: ${result.error || 'Unknown error'}`;
    
    // Create notification
    const notification = document.createElement('div');
    notification.className = `intervention-notification ${result.success ? 'success' : 'error'}`;
    notification.innerHTML = `
      <div class="notification-content">
        <div class="notification-message">${message}</div>
        ${result.effects ? `
          <div class="notification-effects">
            ${Object.entries(result.effects).map(([key, value]) => 
              `<span class="effect-item">${key}: ${value}</span>`
            ).join(' ')}
          </div>
        ` : ''}
      </div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      notification.classList.add('fade-out');
      setTimeout(() => notification.remove(), 300);
    }, 5000);
  }

  showError(message) {
    this.showInterventionResult({
      success: false,
      error: message
    });
  }

  showInterventionHelp() {
    if (window.helpSystem) {
      window.helpSystem.showHelp();
      window.helpSystem.switchTab('debugging');
    }
  }

  // Public API for other systems
  getAppliedInterventions() {
    return this.interventionHistory;
  }

  getStoryImpact() {
    return this.storyImpact;
  }

  hasAppliedIntervention(interventionId) {
    return this.interventionHistory.some(record => record.id === interventionId);
  }

  getInterventionEffectiveness() {
    const successful = this.interventionHistory.filter(r => r.result === 'success').length;
    const total = this.interventionHistory.length;
    return total > 0 ? successful / total : 0;
  }
}

// Initialize intervention system
window.interventionSystem = new InterventionSystem();