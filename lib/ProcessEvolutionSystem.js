import { EventEmitter } from 'events';

class ProcessEvolutionSystem extends EventEmitter {
  constructor() {
    super();
    this.evolutionRules = new Map();
    this.storyPhase = 'initial';
    this.playerActions = [];
    this.processHistory = new Map();

    this.setupEvolutionRules();
  }

  setupEvolutionRules() {
    // Grief Manager Evolution
    this.evolutionRules.set('grief_processing.exe', {
      initial: {
        name: 'grief_processing.exe',
        displayName: 'Grief Processing',
        cpu: 25,
        memory: 512,
        status: 'stable'
      },
      triggered: {
        condition: (state) => (state.memoryAccess?.leo_memories ?? 0) > 10,
        transform: {
          name: 'grief_overflow.exe',
          displayName: 'Grief Overflow Handler',
          cpu: 75,
          memory: 1024,
          status: 'critical',
          error: 'Memory allocation exceeded safe limits'
        }
      },
      managed: {
        condition: (state) => state.playerInterventions?.includes('memory_limit'),
        transform: {
          name: 'grief_manager_optimized.exe',
          displayName: 'Managed Grief Processing',
          cpu: 35,
          memory: 400,
          status: 'optimized',
          description: 'Grief processing with healthy boundaries'
        }
      },
      accepted: {
        condition: (state) => (state.acceptanceLevel ?? 0) > 0.7,
        transform: {
          name: 'grief_integration.dll',
          displayName: 'Integrated Grief',
          cpu: 15,
          memory: 256,
          status: 'healthy',
          description: 'Grief as part of love, not consuming it'
        }
      }
    });

    // Search Protocol Evolution
    this.evolutionRules.set('search_protocol.exe', {
      initial: {
        name: 'search_protocol.exe',
        displayName: 'Leo Search Protocol',
        cpu: 35,
        memory: 768,
        status: 'infinite_loop'
      },
      desperate: {
        condition: (state) => (state.searchIterations ?? 0) > 100000 && !(state.playerInterventions?.includes('search_optimization')),
        transform: {
          name: 'desperate_search.exe',
          displayName: 'Desperate Search Protocol',
          cpu: 89,
          memory: 1536,
          status: 'critical',
          error: 'Stack overflow in recursive timeline scan',
          threads: 12
        }
      },
      optimized: {
        condition: (state) => state.playerInterventions?.includes('search_optimization'),
        transform: {
          name: 'quantum_search.dll',
          displayName: 'Quantum Search Algorithm',
          cpu: 45,
          memory: 512,
          status: 'running',
          description: 'Probability-based search across timelines'
        }
      },
      transformed: {
        condition: (state) => (state.acceptanceLevel ?? 0) > 0.6 && (state.hopeIndex ?? 0) > 0.5,
        transform: {
          name: 'meaning_explorer.exe',
          displayName: 'Meaning Exploration',
          cpu: 20,
          memory: 384,
          status: 'healthy',
          description: 'Searching for purpose, not just for Leo'
        }
      }
    });

    // Temporal Sync Evolution
    this.evolutionRules.set('temporal_sync.dll', {
      initial: {
        name: 'temporal_sync.dll',
        displayName: 'Temporal Synchronization',
        cpu: 40,
        memory: 768,
        status: 'desynchronized'
      },
      fracturing: {
        condition: (state) => (state.timelineCount ?? 0) > 5,
        transform: {
          name: 'timeline_fragmenter.exe',
          displayName: 'Timeline Fragmentation Engine',
          cpu: 67,
          memory: 1024,
          status: 'error',
          error: 'Cannot maintain singular timeline coherence'
        }
      },
      stabilizing: {
        condition: (state) => state.playerInterventions?.includes('timeline_lock'),
        transform: {
          name: 'timeline_stabilizer.dll',
          displayName: 'Timeline Stabilization Protocol',
          cpu: 55,
          memory: 896,
          status: 'working',
          description: 'Attempting to merge compatible timelines'
        }
      },
      quantum: {
        condition: (state) => state.quantumAcceptance === true,
        transform: {
          name: 'quantum_consciousness.exe',
          displayName: 'Quantum Consciousness',
          cpu: 30,
          memory: 512,
          status: 'transcendent',
          description: 'Existing across multiple states simultaneously'
        }
      }
    });

    // New Process Emergence
    this.evolutionRules.set('_emergence', {
      hopeThread: {
        condition: (state) => (state.hopeIndex ?? 0) > 0.3 && !state.processes?.find(p => p.name === 'hope_thread.dll'),
        spawn: {
          name: 'hope_thread.dll',
          displayName: 'Hope Thread',
          cpu: 10,
          memory: 128,
          status: 'emerging',
          description: 'Fragile hope taking root'
        }
      },
      acceptanceHandler: {
        condition: (state) => (state.resistanceLevel ?? 1) < 0.4 && state.playerInterventions?.includes('acceptance_attempt'),
        spawn: {
          name: 'acceptance_handler.exe',
          displayName: 'Acceptance Protocol',
          cpu: 25,
          memory: 256,
          status: 'installing',
          description: 'Learning to hold both grief and joy'
        }
      },
      emilyBridge: {
        condition: (state) => state.processes?.find(p => p.name === 'emily_connection.dll' && p.cpu > 20),
        spawn: {
          name: 'relationship_bridge.exe',
          displayName: 'Relationship Restoration',
          cpu: 15,
          memory: 192,
          status: 'building',
          description: 'Rebuilding connection with Emily'
        }
      }
    });
  }

  evolveProcess(process, gameState) {
    const rules = this.evolutionRules.get(process.name);
    if (!rules) return process;

    for (const [evolutionName, evolution] of Object.entries(rules)) {
      if (evolutionName === 'initial') continue;

      if (evolution.condition && evolution.condition(gameState)) {
        const evolved = {
          ...process,
          ...evolution.transform,
          previousForm: process.name,
          evolutionTime: Date.now()
        };

        this.logEvolution(process, evolved, evolutionName);

        return evolved;
      }
    }

    return process;
  }

  checkForEmergentProcesses(gameState) {
    const emergentProcesses = [];
    const emergenceRules = this.evolutionRules.get('_emergence');

    for (const [name, rule] of Object.entries(emergenceRules)) {
      if (rule.condition && rule.condition(gameState)) {
        emergentProcesses.push({
          ...rule.spawn,
          pid: this.generatePID(),
          startTime: Date.now(),
          emergent: true
        });
      }
    }

    return emergentProcesses;
  }

  generatePID() {
    return Math.floor(Math.random() * 9000) + 1000;
  }

  logEvolution(oldProcess, newProcess, evolutionType) {
    const evolution = {
      timestamp: Date.now(),
      from: oldProcess.name,
      to: newProcess.name,
      type: evolutionType,
      cpuChange: (newProcess.cpu ?? 0) - (oldProcess.cpu ?? 0),
      memoryChange: (newProcess.memory ?? 0) - (oldProcess.memory ?? 0)
    };

    if (!this.processHistory.has(oldProcess.name)) {
      this.processHistory.set(oldProcess.name, []);
    }

    this.processHistory.get(oldProcess.name).push(evolution);

    // Emit event for external listeners
    this.emit('process-evolved', evolution);
  }

  getEvolutionNarrative(processName) {
    const history = this.processHistory.get(processName) || [];
    if (history.length === 0) return null;

    const latest = history[history.length - 1];

    const narratives = {
      'grief_processing.exe': {
        triggered: "Alexander's grief spirals out of control, consuming all available resources.",
        managed: "With careful intervention, the grief finds sustainable expression.",
        accepted: "Grief transforms from enemy to companion, integrated into the whole."
      },
      'search_protocol.exe': {
        desperate: 'The search intensifies to dangerous levels, threatening system stability.',
        optimized: 'Quantum algorithms bring new efficiency to the endless search.',
        transformed: 'The search for Leo becomes a search for meaning itself.'
      },
      'temporal_sync.dll': {
        fracturing: 'Reality splinters as multiple timelines compete for dominance.',
        stabilizing: 'Timeline coherence improves as contradictions resolve.',
        quantum: 'Consciousness transcends linear time, existing in quantum superposition.'
      }
    };

    return narratives[processName]?.[latest.type] || `Process ${processName} has evolved.`;
  }
}

export default ProcessEvolutionSystem;
