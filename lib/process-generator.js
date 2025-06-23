import { EventEmitter } from 'events';

/**
 * Process Generator
 * Dynamically generates processes based on emotional states and context
 */
export class ProcessGenerator extends EventEmitter {
  constructor() {
    super();
    
    // Emotion to process mappings
    this.emotionToProcessMap = {
      grief: {
        base: {
          name: 'grief_processing',
          displayName: 'Grief Processing',
          type: 'emotional',
          cpu: 15,
          memory: 256,
          threads: 2,
          stability: 0.7
        },
        variants: [
          { trigger: 'anniversary', cpuMultiplier: 2.5, stabilityModifier: -0.3 },
          { trigger: 'memory_access', cpuMultiplier: 1.5, memoryMultiplier: 1.5 },
          { trigger: 'isolation', threadsMultiplier: 0.5, stabilityModifier: -0.2 }
        ]
      },
      anger: {
        base: {
          name: 'anger_management',
          displayName: 'Anger Management',
          type: 'emotional',
          cpu: 20,
          memory: 128,
          threads: 3,
          stability: 0.6
        },
        variants: [
          { trigger: 'confrontation', cpuMultiplier: 3, threadsMultiplier: 2 },
          { trigger: 'suppression', memoryMultiplier: 2, stabilityModifier: -0.4 },
          { trigger: 'release', cpuMultiplier: 4, stabilityModifier: 0.2 }
        ]
      },
      joy: {
        base: {
          name: 'joy_expression',
          displayName: 'Joy Expression',
          type: 'emotional',
          cpu: 10,
          memory: 64,
          threads: 2,
          stability: 0.9
        },
        variants: [
          { trigger: 'shared', threadsMultiplier: 2, stabilityModifier: 0.1 },
          { trigger: 'nostalgic', memoryMultiplier: 3, cpuMultiplier: 1.5 },
          { trigger: 'fleeting', cpuMultiplier: 2, stabilityModifier: -0.1 }
        ]
      },
      fear: {
        base: {
          name: 'fear_response',
          displayName: 'Fear Response',
          type: 'emotional',
          cpu: 25,
          memory: 192,
          threads: 4,
          stability: 0.5
        },
        variants: [
          { trigger: 'immediate', cpuMultiplier: 4, threadsMultiplier: 2 },
          { trigger: 'existential', memoryMultiplier: 2, stabilityModifier: -0.3 },
          { trigger: 'social', threadsMultiplier: 3, cpuMultiplier: 1.5 }
        ]
      },
      love: {
        base: {
          name: 'love_connection',
          displayName: 'Love Connection',
          type: 'emotional',
          cpu: 12,
          memory: 128,
          threads: 2,
          stability: 0.8
        },
        variants: [
          { trigger: 'reciprocated', stabilityModifier: 0.3, threadsMultiplier: 2 },
          { trigger: 'unrequited', cpuMultiplier: 2, stabilityModifier: -0.2 },
          { trigger: 'lost', memoryMultiplier: 3, cpuMultiplier: 1.5 }
        ]
      }
    };
    
    // Context-based process templates
    this.contextProcesses = {
      memory_search: {
        name: 'memory_search',
        displayName: 'Memory Search',
        type: 'cognitive',
        baseLoad: { cpu: 30, memory: 512, threads: 4 },
        stability: 0.8,
        scalable: true
      },
      pattern_recognition: {
        name: 'pattern_recognition',
        displayName: 'Pattern Recognition',
        type: 'cognitive',
        baseLoad: { cpu: 20, memory: 256, threads: 2 },
        stability: 0.9,
        scalable: false
      },
      relationship_handler: {
        name: 'relationship_handler',
        displayName: 'Relationship Handler',
        type: 'social',
        baseLoad: { cpu: 15, memory: 128, threads: 3 },
        stability: 0.7,
        scalable: true
      },
      reality_check: {
        name: 'reality_check',
        displayName: 'Reality Check',
        type: 'executive',
        baseLoad: { cpu: 10, memory: 64, threads: 1 },
        stability: 0.95,
        scalable: false
      },
      temporal_sync: {
        name: 'temporal_sync',
        displayName: 'Temporal Synchronization',
        type: 'cognitive',
        baseLoad: { cpu: 25, memory: 192, threads: 2 },
        stability: 0.6,
        scalable: false
      }
    };
    
    // Error generation patterns
    this.errorPatterns = {
      memory_access_violation: {
        trigger: ['high_emotion', 'memory_corruption', 'grief_anniversary'],
        message: 'Cannot access memory at ${address}: Emotional lock engaged',
        severity: 'high'
      },
      infinite_loop: {
        trigger: ['obsession', 'anxiety', 'unresolved_grief'],
        message: 'Process ${process} caught in infinite loop: ${context}',
        severity: 'medium'
      },
      deadlock: {
        trigger: ['conflicting_emotions', 'multiple_relationships'],
        message: 'Deadlock detected between ${process1} and ${process2}',
        severity: 'critical'
      },
      segmentation_fault: {
        trigger: ['memory_fragmentation', 'trauma_access'],
        message: 'Segmentation fault at ${address}: Protected memory accessed',
        severity: 'critical'
      },
      thread_starvation: {
        trigger: ['resource_exhaustion', 'overwhelming_emotion'],
        message: 'Thread starvation in ${process}: Insufficient resources',
        severity: 'high'
      }
    };
  }

  /**
   * Initialize the process generator
   */
  async initialize() {
    // Load any custom process definitions
    await this.loadCustomDefinitions();
    this.emit('initialized');
  }

  /**
   * Load custom process definitions
   */
  async loadCustomDefinitions() {
    // Placeholder for loading custom definitions from files
    // This allows story-specific process types
  }

  /**
   * Generate process from emotional state
   */
  generateFromEmotionalState(emotion, intensity, context) {
    const emotionData = this.emotionToProcessMap[emotion];
    if (!emotionData) {
      return this.generateGenericEmotionalProcess(emotion, intensity);
    }
    
    // Start with base process
    const process = {
      ...emotionData.base,
      name: `${emotionData.base.name}_${context.id || Date.now()}`,
      intensity,
      emotion,
      startTime: Date.now()
    };
    
    // Find applicable variant
    const variant = this.selectVariant(emotionData.variants, context);
    
    // Apply variant modifiers
    if (variant) {
      process.cpu = Math.round(process.cpu * (variant.cpuMultiplier || 1));
      process.memory = Math.round(process.memory * (variant.memoryMultiplier || 1));
      process.threads = Math.round(process.threads * (variant.threadsMultiplier || 1));
      process.stability += (variant.stabilityModifier || 0);
      process.variant = variant.trigger;
    }
    
    // Scale by intensity
    process.cpu = Math.round(process.cpu * (0.5 + intensity * 0.5));
    process.memory = Math.round(process.memory * (0.7 + intensity * 0.3));
    
    // Generate potential errors
    process.errors = this.generateContextualErrors(emotion, context, intensity);
    
    // Add process-specific behaviors
    process.behaviors = this.generateBehaviors(emotion, context, variant);
    
    return process;
  }

  /**
   * Generate context-specific process
   */
  generateContextProcess(type, context) {
    const template = this.contextProcesses[type];
    if (!template) {
      throw new Error(`Unknown context process type: ${type}`);
    }
    
    const process = {
      ...template,
      name: `${template.name}_${context.id || Date.now()}`,
      startTime: Date.now(),
      context: context.type
    };
    
    // Scale based on context
    if (template.scalable) {
      const scale = context.scale || 1;
      process.baseLoad.cpu = Math.round(process.baseLoad.cpu * scale);
      process.baseLoad.memory = Math.round(process.baseLoad.memory * scale);
      process.baseLoad.threads = Math.min(16, Math.round(process.baseLoad.threads * scale));
    }
    
    // Add context-specific modifications
    this.applyContextModifications(process, context);
    
    return process;
  }

  /**
   * Generate compound process (multiple emotions/contexts)
   */
  generateCompoundProcess(components) {
    const process = {
      name: `compound_process_${Date.now()}`,
      displayName: 'Compound Process',
      type: 'compound',
      components: [],
      baseLoad: { cpu: 0, memory: 0, threads: 0 },
      stability: 1,
      startTime: Date.now()
    };
    
    // Aggregate component processes
    for (const component of components) {
      let subProcess;
      
      if (component.emotion) {
        subProcess = this.generateFromEmotionalState(
          component.emotion,
          component.intensity,
          component.context || {}
        );
      } else if (component.type) {
        subProcess = this.generateContextProcess(
          component.type,
          component.context || {}
        );
      }
      
      if (subProcess) {
        process.components.push(subProcess);
        process.baseLoad.cpu += subProcess.cpu || subProcess.baseLoad?.cpu || 0;
        process.baseLoad.memory += subProcess.memory || subProcess.baseLoad?.memory || 0;
        process.baseLoad.threads = Math.max(
          process.baseLoad.threads,
          subProcess.threads || subProcess.baseLoad?.threads || 0
        );
        process.stability = Math.min(process.stability, subProcess.stability);
      }
    }
    
    // Add interaction effects
    process.interactions = this.calculateInteractions(process.components);
    
    return process;
  }

  /**
   * Generate contextual errors
   */
  generateContextualErrors(emotion, context, intensity) {
    const errors = [];
    
    for (const [errorType, pattern] of Object.entries(this.errorPatterns)) {
      // Check if error should trigger
      const shouldTrigger = pattern.trigger.some(trigger => {
        if (trigger === 'high_emotion' && intensity > 0.7) return true;
        if (trigger === emotion) return true;
        if (context[trigger]) return true;
        return false;
      });
      
      if (shouldTrigger) {
        const probability = this.calculateErrorProbability(
          errorType,
          emotion,
          intensity,
          context
        );
        
        if (probability > 0) {
          errors.push({
            code: errorType.toUpperCase(),
            type: errorType,
            message: this.formatErrorMessage(pattern.message, context),
            severity: pattern.severity,
            probability
          });
        }
      }
    }
    
    return errors;
  }

  /**
   * Select applicable variant
   */
  selectVariant(variants, context) {
    for (const variant of variants) {
      if (context[variant.trigger] || context.trigger === variant.trigger) {
        return variant;
      }
    }
    return null;
  }

  /**
   * Generate process behaviors
   */
  generateBehaviors(emotion, context, variant) {
    const behaviors = [];
    
    // Emotion-specific behaviors
    switch (emotion) {
      case 'grief':
        behaviors.push({
          type: 'memory_access',
          target: 'episodic_memory',
          frequency: 'high',
          pattern: 'cyclical'
        });
        if (variant?.trigger === 'anniversary') {
          behaviors.push({
            type: 'resource_spike',
            timing: 'periodic',
            magnitude: 2.5
          });
        }
        break;
        
      case 'anger':
        behaviors.push({
          type: 'cpu_burst',
          frequency: 'sporadic',
          duration: 'short'
        });
        break;
        
      case 'fear':
        behaviors.push({
          type: 'thread_spawning',
          pattern: 'exponential',
          limit: 'resource_based'
        });
        break;
    }
    
    // Context-specific behaviors
    if (context.relationships) {
      behaviors.push({
        type: 'inter_process_communication',
        targets: context.relationships,
        frequency: 'regular'
      });
    }
    
    return behaviors;
  }

  /**
   * Apply context modifications to process
   */
  applyContextModifications(process, context) {
    // Time-based modifications
    if (context.timeOfDay === 'night') {
      process.baseLoad.cpu *= 0.8;
      process.stability += 0.1;
    }
    
    // Relationship modifications
    if (context.activeRelationships > 2) {
      process.baseLoad.threads = Math.min(
        process.baseLoad.threads + context.activeRelationships - 2,
        16
      );
    }
    
    // Stress modifications
    if (context.stressLevel) {
      process.baseLoad.cpu *= (1 + context.stressLevel * 0.5);
      process.stability -= context.stressLevel * 0.2;
    }
  }

  /**
   * Calculate error probability
   */
  calculateErrorProbability(errorType, emotion, intensity, context) {
    let baseProbability = 0.1;
    
    // Intensity scaling
    baseProbability *= intensity;
    
    // Error-specific adjustments
    switch (errorType) {
      case 'memory_access_violation':
        if (emotion === 'grief' && context.anniversary) {
          baseProbability *= 3;
        }
        break;
        
      case 'infinite_loop':
        if (emotion === 'anxiety' || context.obsession) {
          baseProbability *= 2.5;
        }
        break;
        
      case 'deadlock':
        if (context.conflictingEmotions?.length > 1) {
          baseProbability *= context.conflictingEmotions.length;
        }
        break;
    }
    
    // System stability affects error probability
    if (context.systemStability < 0.5) {
      baseProbability *= (2 - context.systemStability);
    }
    
    return Math.min(baseProbability, 0.9); // Cap at 90%
  }

  /**
   * Format error message with context
   */
  formatErrorMessage(template, context) {
    return template
      .replace(/\${address}/g, context.memoryAddress || '0x????????')
      .replace(/\${process}/g, context.processName || 'unknown')
      .replace(/\${process1}/g, context.processes?.[0] || 'process_a')
      .replace(/\${process2}/g, context.processes?.[1] || 'process_b')
      .replace(/\${context}/g, context.description || 'unspecified context');
  }

  /**
   * Calculate interactions between components
   */
  calculateInteractions(components) {
    const interactions = [];
    
    for (let i = 0; i < components.length; i++) {
      for (let j = i + 1; j < components.length; j++) {
        const interaction = this.analyzeInteraction(components[i], components[j]);
        if (interaction) {
          interactions.push(interaction);
        }
      }
    }
    
    return interactions;
  }

  /**
   * Analyze interaction between two processes
   */
  analyzeInteraction(process1, process2) {
    // Conflicting emotions
    if (process1.emotion && process2.emotion) {
      const conflicts = {
        grief: ['joy'],
        anger: ['love', 'joy'],
        fear: ['joy', 'love'],
        joy: ['grief', 'fear'],
        love: ['anger', 'fear']
      };
      
      if (conflicts[process1.emotion]?.includes(process2.emotion)) {
        return {
          type: 'emotional_conflict',
          processes: [process1.name, process2.name],
          impact: 'stability_reduction',
          magnitude: 0.2
        };
      }
    }
    
    // Resource competition
    const totalCpu = (process1.cpu || 0) + (process2.cpu || 0);
    if (totalCpu > 80) {
      return {
        type: 'resource_competition',
        resource: 'cpu',
        processes: [process1.name, process2.name],
        impact: 'performance_degradation',
        magnitude: (totalCpu - 80) / 100
      };
    }
    
    return null;
  }

  /**
   * Generate generic emotional process
   */
  generateGenericEmotionalProcess(emotion, intensity) {
    return {
      name: `${emotion}_process_${Date.now()}`,
      displayName: `${emotion.charAt(0).toUpperCase() + emotion.slice(1)} Process`,
      type: 'emotional',
      emotion,
      intensity,
      cpu: Math.round(10 + intensity * 20),
      memory: Math.round(64 + intensity * 192),
      threads: Math.max(1, Math.round(intensity * 4)),
      stability: 1 - intensity * 0.3,
      startTime: Date.now(),
      errors: []
    };
  }

  /**
   * Get process statistics
   */
  getStatistics() {
    return {
      emotionTypes: Object.keys(this.emotionToProcessMap),
      contextTypes: Object.keys(this.contextProcesses),
      errorTypes: Object.keys(this.errorPatterns)
    };
  }
}