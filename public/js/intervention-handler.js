// lib/intervention-handler.js
class InterventionHandler {
  constructor(consciousnessEngine) {
    this.engine = consciousnessEngine;
    this.interventionEffects = new Map();
    this.storyImpacts = new Map();
  }

  async applyIntervention(characterId, interventionId, intervention) {
    try {
      // Get current consciousness state
      const currentState = await this.engine.getState(characterId);
      if (!currentState) {
        throw new Error('Character not found');
      }

      // Validate intervention can be applied
      if (!this.validateIntervention(currentState, intervention)) {
        return {
          success: false,
          error: 'Intervention requirements not met',
          interventionId
        };
      }

      // Calculate intervention effects
      const effects = this.calculateEffects(currentState, intervention);
      
      // Apply effects to consciousness
      const updatedState = this.applyEffects(currentState, effects, intervention);
      
      // Update consciousness engine
      await this.engine.updateState(characterId, updatedState);
      
      // Calculate story impact
      const storyChanges = this.calculateStoryImpact(interventionId, effects, currentState);
      
      // Record intervention
      this.recordIntervention(characterId, interventionId, effects, storyChanges);
      
      return {
        success: true,
        interventionId,
        message: this.getSuccessMessage(interventionId, effects),
        effects: this.summarizeEffects(effects),
        storyChanges,
        impact: {
          immediate: effects,
          longTerm: this.calculateLongTermImpact(interventionId, currentState)
        }
      };
      
    } catch (error) {
      console.error('Intervention error:', error);
      return {
        success: false,
        error: error.message,
        interventionId
      };
    }
  }

  validateIntervention(state, intervention) {
    const { requirements, target } = intervention;
    
    if (target !== 'any' && target !== 'system') {
      const targetProcess = state.consciousness.processes.find(p => p.name === target);
      if (!targetProcess) return false;
      
      // Validate process-specific requirements
      for (const [key, condition] of Object.entries(requirements)) {
        if (!this.checkRequirement(key, condition, targetProcess, state)) {
          return false;
        }
      }
    }
    
    return true;
  }

  checkRequirement(key, condition, process, state) {
    switch (key) {
      case 'memory_usage':
        return process.memory >= condition.min;
      case 'cpu_usage':
        return process.cpu_usage >= condition.min;
      case 'loop_detected':
        return state.consciousness.errors.some(e => 
          e.type === 'infinite_loop' && e.process === process.name
        );
      case 'thread_starvation':
        return state.consciousness.errors.some(e => 
          e.type === 'thread_starvation' && e.process === process.name
        );
      default:
        return true;
    }
  }

  calculateEffects(state, intervention) {
    const effects = {
      processes: [],
      resources: {},
      errors: [],
      newStates: []
    };

    const interventionEffects = intervention.effects;
    
    // Memory effects
    if (interventionEffects.memory_reduction) {
      const targetProcess = state.consciousness.processes.find(p => 
        p.name === intervention.target
      );
      if (targetProcess) {
        effects.processes.push({
          pid: targetProcess.pid,
          changes: {
            memory: Math.round(targetProcess.memory * (1 - interventionEffects.memory_reduction))
          }
        });
      }
    }

    // CPU effects
    if (interventionEffects.cpu_reduction) {
      const targetProcess = state.consciousness.processes.find(p => 
        p.name === intervention.target || intervention.target === 'any'
      );
      if (targetProcess) {
        effects.processes.push({
          pid: targetProcess.pid,
          changes: {
            cpu_usage: Math.round(targetProcess.cpu_usage * (1 - interventionEffects.cpu_reduction))
          }
        });
      }
    }

    // Process termination
    if (interventionEffects.immediate_stop) {
      const targetProcess = state.consciousness.processes.find(p => 
        p.name === intervention.target
      );
      if (targetProcess) {
        effects.processes.push({
          pid: targetProcess.pid,
          changes: {
            status: 'terminated',
            cpu_usage: 0,
            memory: 0
          }
        });
      }
    }

    // Loop resolution
    if (interventionEffects.loop_resolution) {
      effects.errors.push({
        action: 'resolve',
        type: 'infinite_loop',
        process: intervention.target
      });
    }

    // Thread rebalancing
    if (interventionEffects.attention_redistribution) {
      effects.resources.attention = {
        action: 'redistribute',
        value: interventionEffects.attention_redistribution
      };
    }

    // Healing effects
    if (interventionEffects.healing_rate) {
      effects.newStates.push({
        type: 'healing',
        rate: interventionEffects.healing_rate,
        target: intervention.target
      });
    }

    // Acceptance effects
    if (interventionEffects.acceptance_increase) {
      effects.newStates.push({
        type: 'acceptance',
        level: interventionEffects.acceptance_increase,
        preserveMemory: interventionEffects.memory_preservation || 0.5
      });
    }

    return effects;
  }

  applyEffects(state, effects, intervention) {
    const updatedState = JSON.parse(JSON.stringify(state));
    
    // Apply process changes
    effects.processes.forEach(processEffect => {
      const process = updatedState.consciousness.processes.find(p => 
        p.pid === processEffect.pid
      );
      if (process) {
        Object.assign(process, processEffect.changes);
      }
    });

    // Apply resource changes
    if (effects.resources.attention) {
      const attention = updatedState.consciousness.resources.attention;
      if (effects.resources.attention.action === 'redistribute') {
        // Redistribute attention from overloaded processes
        const totalCPU = updatedState.consciousness.processes.reduce((sum, p) => 
          sum + p.cpu_usage, 0
        );
        updatedState.consciousness.processes.forEach(p => {
          p.priority = Math.round((p.cpu_usage / totalCPU) * 100);
        });
      }
    }

    // Resolve errors
    if (effects.errors.length > 0) {
      effects.errors.forEach(errorEffect => {
        if (errorEffect.action === 'resolve') {
          updatedState.consciousness.errors = updatedState.consciousness.errors.filter(e => 
            !(e.type === errorEffect.type && e.process === errorEffect.process)
          );
        }
      });
    }

    // Apply new states
    effects.newStates.forEach(newState => {
      if (newState.type === 'healing') {
        // Add healing process if not exists
        const healingProcess = updatedState.consciousness.processes.find(p => 
          p.name === 'Healing_Protocol.exe'
        );
        if (!healingProcess) {
          updatedState.consciousness.processes.push({
            pid: Math.max(...updatedState.consciousness.processes.map(p => p.pid)) + 1,
            name: 'Healing_Protocol.exe',
            status: 'running',
            cpu_usage: 15,
            memory: 64,
            priority: 80,
            description: 'Active healing process initiated by intervention'
          });
        }
      }
      
      if (newState.type === 'acceptance') {
        // Modify grief process
        const griefProcess = updatedState.consciousness.processes.find(p => 
          p.name === 'Grief_Manager.exe'
        );
        if (griefProcess) {
          griefProcess.status = 'optimizing';
          griefProcess.description = 'Processing grief with acceptance protocols';
        }
      }
    });

    // Update overall resources based on changes
    this.recalculateResources(updatedState);
    
    return updatedState;
  }

  recalculateResources(state) {
    // Recalculate total CPU usage
    const totalCPU = state.consciousness.processes
      .filter(p => p.status !== 'terminated')
      .reduce((sum, p) => sum + p.cpu_usage, 0);
    
    state.consciousness.resources.cpu.current = Math.min(totalCPU, 100);
    
    // Recalculate memory usage
    const totalMemory = state.consciousness.processes
      .filter(p => p.status !== 'terminated')
      .reduce((sum, p) => sum + p.memory, 0);
    
    state.consciousness.resources.memory.current = totalMemory;
    
    // Adjust attention based on process balance
    const balanceScore = this.calculateBalance(state.consciousness.processes);
    state.consciousness.resources.attention.current = Math.round(balanceScore * 100);
  }

  calculateBalance(processes) {
    if (processes.length === 0) return 0.5;
    
    const activeProceses = processes.filter(p => p.status !== 'terminated');
    if (activeProceses.length === 0) return 0.1;
    
    // Calculate standard deviation of CPU usage
    const avgCPU = activeProceses.reduce((sum, p) => sum + p.cpu_usage, 0) / activeProceses.length;
    const variance = activeProceses.reduce((sum, p) => 
      sum + Math.pow(p.cpu_usage - avgCPU, 2), 0
    ) / activeProceses.length;
    const stdDev = Math.sqrt(variance);
    
    // Lower standard deviation = better balance
    return Math.max(0, 1 - (stdDev / avgCPU));
  }

  calculateStoryImpact(interventionId, effects, currentState) {
    const impacts = [];
    
    switch (interventionId) {
      case 'memory-release':
        if (effects.processes.some(p => p.changes.memory < 100)) {
          impacts.push('grief_processing_improved');
          impacts.push('emotional_capacity_restored');
        }
        break;
        
      case 'force-terminate':
        impacts.push('harsh_intervention_recorded');
        if (currentState.consciousness.processes.find(p => p.name === 'Grief_Manager.exe')) {
          impacts.push('grief_suppressed_not_resolved');
        }
        break;
        
      case 'loop-breaker':
        impacts.push('search_ended');
        impacts.push('acceptance_beginning');
        break;
        
      case 'thread-rebalance':
        impacts.push('family_reconnection_initiated');
        impacts.push('relationship_healing_started');
        break;
        
      case 'acceptance-protocol':
        impacts.push('acceptance_achieved');
        impacts.push('memories_preserved');
        impacts.push('peace_found');
        break;
    }
    
    return impacts;
  }

  calculateLongTermImpact(interventionId, currentState) {
    const impact = {
      stability: 0,
      healing: 0,
      relationships: 0,
      acceptance: 0
    };
    
    switch (interventionId) {
      case 'memory-release':
        impact.stability = 0.7;
        impact.healing = 0.8;
        impact.acceptance = 0.5;
        break;
        
      case 'force-terminate':
        impact.stability = 0.3;
        impact.healing = -0.2;
        impact.relationships = -0.1;
        break;
        
      case 'acceptance-protocol':
        impact.stability = 0.9;
        impact.healing = 0.9;
        impact.acceptance = 1.0;
        impact.relationships = 0.7;
        break;
    }
    
    return impact;
  }

  recordIntervention(characterId, interventionId, effects, storyChanges) {
    if (!this.interventionEffects.has(characterId)) {
      this.interventionEffects.set(characterId, []);
    }
    
    this.interventionEffects.get(characterId).push({
      interventionId,
      timestamp: new Date().toISOString(),
      effects,
      storyChanges
    });
  }

  getSuccessMessage(interventionId, effects) {
    const messages = {
      'memory-release': 'Memory blocks are being gradually released. Emotional capacity improving.',
      'force-terminate': 'Process forcefully terminated. System stability may be affected.',
      'loop-breaker': 'Exit condition successfully injected. Infinite loop broken.',
      'thread-rebalance': 'Processing threads redistributed. Attention balance improving.',
      'acceptance-protocol': 'Acceptance protocols installed. Healing process initiated.',
      'memory-optimization': 'Memory defragmentation complete. System efficiency improved.',
      'emotional-throttle': 'Emotional processing limited. CPU usage stabilizing.',
      'temporal-sync': 'Temporal alignment in progress. Reality perception stabilizing.'
    };
    
    return messages[interventionId] || 'Intervention applied successfully.';
  }

  summarizeEffects(effects) {
    const summary = {};
    
    if (effects.processes.length > 0) {
      summary.processes_affected = effects.processes.length;
    }
    
    if (effects.errors.length > 0) {
      summary.errors_resolved = effects.errors.filter(e => e.action === 'resolve').length;
    }
    
    if (effects.newStates.length > 0) {
      summary.new_states = effects.newStates.map(s => s.type);
    }    
    return summary;
  }
}