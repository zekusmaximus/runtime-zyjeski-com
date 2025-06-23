import fs from 'fs/promises';
import path from 'path';
import { EventEmitter } from 'events';
import { ConditionEvaluator } from './ConditionEvaluator.js';
import { ChoiceTracker } from './ChoiceTracker.js';

/**
 * Narrative Engine
 * Manages story fragments and narrative progression
 */
export class NarrativeEngine extends EventEmitter {
  constructor() {
    super();
    
    // Fragment storage
    this.fragments = new Map();              // storyId:type -> fragments[]
    this.fragmentIndex = new Map();          // fragmentId -> fragment
    
    // Narrative state tracking
    this.storyProgress = new Map();          // storyId -> progress
    this.triggeredFragments = new Map();     // storyId -> Set of fragmentIds
    this.fragmentCooldowns = new Map();      // fragmentId -> cooldown end time
    
    // Systems
    this.conditionEvaluator = new ConditionEvaluator();
    this.choiceTracker = new ChoiceTracker();
    
    // Configuration
    this.config = {
      maxFragmentsPerTrigger: 3,
      defaultCooldown: 5000,
      priorityWeights: {
        critical: 1000,
        high: 100,
        normal: 10,
        low: 1
      }
    };
  }

  /**
   * Initialize the narrative engine
   */
  async initialize() {
    // Load any global narrative configurations
    await this.loadGlobalConfig();
    
    this.emit('initialized');
  }

  /**
   * Load global narrative configuration
   */
  async loadGlobalConfig() {
    try {
      const configPath = path.join(process.cwd(), 'data', 'narrative-config.json');
      const configData = await fs.readFile(configPath, 'utf8');
      const config = JSON.parse(configData);
      
      Object.assign(this.config, config);
    } catch (error) {
      // Global config is optional
      console.log('No global narrative config found, using defaults');
    }
  }

  /**
   * Load story fragments
   */
  async loadStoryFragments(storyId) {
    const storyPath = path.join(process.cwd(), 'data', 'stories', storyId, 'narrative-fragments');
    
    const fragmentTypes = [
      'process-triggers',
      'memory-dumps',
      'debug-logs',
      'resolutions'
    ];
    
    // Initialize story tracking
    if (!this.storyProgress.has(storyId)) {
      this.storyProgress.set(storyId, {
        progress: 0,
        act: 1,
        choicesMade: [],
        fragmentsTriggered: new Set(),
        startTime: Date.now()
      });
    }
    
    if (!this.triggeredFragments.has(storyId)) {
      this.triggeredFragments.set(storyId, new Set());
    }
    
    // Load each fragment type
    for (const type of fragmentTypes) {
      const fragments = await this.loadFragmentType(storyPath, type);
      const key = `${storyId}:${type}`;
      this.fragments.set(key, fragments);
      
      // Index fragments for quick lookup
      fragments.forEach(fragment => {
        this.fragmentIndex.set(fragment.id, fragment);
      });
    }
    
    // Load choice tree
    await this.choiceTracker.loadChoiceTree(storyId);
    
    this.emit('storyLoaded', { storyId, fragmentCount: this.fragmentIndex.size });
  }

  /**
   * Load fragments of a specific type
   */
  async loadFragmentType(basePath, type) {
    const fragmentDir = path.join(basePath, type);
    const fragments = [];
    
    try {
      const files = await fs.readdir(fragmentDir);
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = path.join(fragmentDir, file);
          const data = await fs.readFile(filePath, 'utf8');
          const fragment = JSON.parse(data);
          
          // Validate and enhance fragment
          fragment.type = fragment.type || type.replace('-', '_').slice(0, -1);
          fragment.source = `${type}/${file}`;
          
          fragments.push(fragment);
        }
      }
    } catch (error) {
      console.warn(`Failed to load fragments from ${type}:`, error.message);
    }
    
    return fragments;
  }

  /**
   * Check for triggered narrative fragments
   */
  async checkTriggers(consciousnessState, userAction, actionResult, storyContext) {
    const triggeredFragments = [];
    const now = Date.now();
    const storyId = storyContext.storyId;
    
    // Get all potential fragments
    const fragmentTypes = ['process-triggers', 'debug-logs'];
    const potentialFragments = [];
    
    for (const type of fragmentTypes) {
      const key = `${storyId}:${type}`;
      const fragments = this.fragments.get(key) || [];
      potentialFragments.push(...fragments);
    }
    
    // Evaluate each fragment's triggers
    for (const fragment of potentialFragments) {
      // Skip if on cooldown
      if (this.isOnCooldown(fragment.id, now)) continue;
      
      // Skip if already triggered max times
      if (!this.canTriggerFragment(fragment, storyId)) continue;
      
      // Evaluate trigger conditions
      const context = {
        consciousness: consciousnessState,
        action: userAction,
        result: actionResult,
        story: storyContext,
        progress: this.storyProgress.get(storyId)
      };
      
      if (this.conditionEvaluator.evaluate(fragment.triggers, context)) {
        triggeredFragments.push({
          fragment,
          priority: this.calculatePriority(fragment, context),
          context
        });
      }
    }
    
    // Check for choice points
    const choicePoints = await this.choiceTracker.evaluateChoicePoints(
      consciousnessState,
      storyContext,
      this.storyProgress.get(storyId)
    );
    
    for (const choicePoint of choicePoints) {
      triggeredFragments.push({
        fragment: choicePoint,
        priority: this.config.priorityWeights.high,
        context: { type: 'choice_point' }
      });
    }
    
    // Sort by priority and limit
    triggeredFragments.sort((a, b) => b.priority - a.priority);
    const selected = triggeredFragments.slice(0, this.config.maxFragmentsPerTrigger);
    
    // Record triggered fragments
    for (const item of selected) {
      this.recordFragmentTrigger(item.fragment, storyId, now);
    }
    
    return selected;
  }

  /**
   * Check system triggers (for tick-based events)
   */
  async checkSystemTriggers(consciousnessState, systemUpdates, storyContext) {
    const triggeredFragments = [];
    const now = Date.now();
    const storyId = storyContext.storyId;
    
    // System triggers are typically time-based or state-based
    const key = `${storyId}:process-triggers`;
    const fragments = this.fragments.get(key) || [];
    
    for (const fragment of fragments) {
      if (this.isOnCooldown(fragment.id, now)) continue;
      if (!this.canTriggerFragment(fragment, storyId)) continue;
      
      const context = {
        consciousness: consciousnessState,
        updates: systemUpdates,
        story: storyContext,
        progress: this.storyProgress.get(storyId),
        elapsed: now - this.storyProgress.get(storyId).startTime
      };
      
      // Check for system-specific triggers
      if (this.evaluateSystemTrigger(fragment, context)) {
        triggeredFragments.push({
          fragment,
          priority: this.calculatePriority(fragment, context),
          context
        });
      }
    }
    
    return triggeredFragments;
  }

  /**
   * Generate a memory dump fragment
   */
  async generateMemoryDump(memoryAddress, consciousnessState, storyContext) {
    const storyId = storyContext.storyId;
    const key = `${storyId}:memory-dumps`;
    const memoryFragments = this.fragments.get(key) || [];
    
    // Find fragments for this memory region
    const candidates = memoryFragments.filter(fragment => {
      if (fragment.memoryAddress === memoryAddress) return true;
      if (fragment.memoryRange && this.isAddressInRange(memoryAddress, fragment.memoryRange)) {
        return true;
      }
      return false;
    });
    
    if (candidates.length === 0) {
      // Generate generic memory dump
      return this.generateGenericMemoryDump(memoryAddress, consciousnessState);
    }
    
    // Select based on context
    const selected = this.selectContextualFragment(candidates, consciousnessState, storyContext);
    
    // Apply dynamic elements
    return this.enrichFragment(selected, consciousnessState, storyContext);
  }

  /**
   * Get resolution fragments for current state
   */
  async getResolutionFragments(consciousnessState, storyContext) {
    const storyId = storyContext.storyId;
    const key = `${storyId}:resolutions`;
    const resolutions = this.fragments.get(key) || [];
    
    const applicable = [];
    
    for (const resolution of resolutions) {
      const context = {
        consciousness: consciousnessState,
        story: storyContext,
        progress: this.storyProgress.get(storyId)
      };
      
      if (this.conditionEvaluator.evaluate(resolution.triggers, context)) {
        applicable.push({
          fragment: resolution,
          priority: this.calculatePriority(resolution, context)
        });
      }
    }
    
    return applicable.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Update story progress
   */
  updateProgress(storyId, delta) {
    const progress = this.storyProgress.get(storyId);
    if (!progress) return;
    
    progress.progress = Math.min(1, progress.progress + delta);
    
    // Update act based on progress
    const acts = 4; // Default, should come from story config
    progress.act = Math.ceil(progress.progress * acts);
    
    this.emit('progressUpdate', { storyId, progress: progress.progress, act: progress.act });
  }

  /**
   * Record a choice made by the player
   */
  recordChoice(storyId, choiceId, selectedOption) {
    const progress = this.storyProgress.get(storyId);
    if (!progress) return;
    
    progress.choicesMade.push({
      choiceId,
      selectedOption,
      timestamp: Date.now()
    });
    
    // Update choice tracker
    this.choiceTracker.recordChoice(storyId, choiceId, selectedOption);
    
    this.emit('choiceMade', { storyId, choiceId, selectedOption });
  }

  /**
   * Get current narrative progress
   */
  getProgress(storyId) {
    const progress = this.storyProgress.get(storyId);
    if (!progress) return null;
    
    return {
      ...progress,
      triggeredCount: this.triggeredFragments.get(storyId)?.size || 0,
      timeElapsed: Date.now() - progress.startTime
    };
  }

  /**
   * Calculate fragment priority
   */
  calculatePriority(fragment, context) {
    let priority = this.config.priorityWeights[fragment.priority || 'normal'];
    
    // Adjust based on context
    if (context.consciousness?.stability < 0.3) {
      priority *= 1.5; // Prioritize during critical states
    }
    
    // Boost if matches current emotional state
    if (fragment.context?.emotionalContext?.includes(context.consciousness?.emotional?.primary)) {
      priority *= 1.2;
    }
    
    // Reduce if recently triggered similar fragment
    const recentSimilar = this.getRecentSimilarFragments(fragment, context.story.storyId);
    priority /= (1 + recentSimilar * 0.2);
    
    return priority;
  }

  /**
   * Check if fragment is on cooldown
   */
  isOnCooldown(fragmentId, now) {
    const cooldownEnd = this.fragmentCooldowns.get(fragmentId);
    return cooldownEnd && now < cooldownEnd;
  }

  /**
   * Check if fragment can still trigger
   */
  canTriggerFragment(fragment, storyId) {
    if (fragment.triggers?.maxTriggers === -1) return true;
    
    const triggered = this.triggeredFragments.get(storyId);
    if (!triggered) return true;
    
    const count = Array.from(triggered).filter(id => id === fragment.id).length;
    return count < (fragment.triggers?.maxTriggers || 1);
  }

  /**
   * Record that a fragment was triggered
   */
  recordFragmentTrigger(fragment, storyId, now) {
    // Add to triggered set
    const triggered = this.triggeredFragments.get(storyId);
    triggered.add(fragment.id);
    
    // Set cooldown
    const cooldown = fragment.triggers?.cooldown || this.config.defaultCooldown;
    this.fragmentCooldowns.set(fragment.id, now + cooldown);
    
    // Update progress for fragment triggers
    this.storyProgress.get(storyId).fragmentsTriggered.add(fragment.id);
  }

  /**
   * Evaluate system-specific triggers
   */
  evaluateSystemTrigger(fragment, context) {
    // Time-based triggers
    if (fragment.triggers?.conditions?.some(c => c.type === 'time_elapsed')) {
      return this.conditionEvaluator.evaluate(fragment.triggers, context);
    }
    
    // State change triggers
    if (context.updates.stateChanges.length > 0) {
      for (const change of context.updates.stateChanges) {
        if (fragment.triggers?.conditions?.some(c => 
          c.type === 'system_resource' && c.target === change.type
        )) {
          return this.conditionEvaluator.evaluate(fragment.triggers, context);
        }
      }
    }
    
    return false;
  }

  /**
   * Check if address is in range
   */
  isAddressInRange(address, range) {
    const addr = parseInt(address, 16);
    const start = parseInt(range.start, 16);
    const end = parseInt(range.end, 16);
    
    return addr >= start && addr <= end;
  }

  /**
   * Select contextual fragment from candidates
   */
  selectContextualFragment(candidates, consciousnessState, storyContext) {
    // Score each candidate
    const scored = candidates.map(fragment => {
      let score = 0;
      
      // Match emotional context
      if (fragment.context?.emotionalContext?.includes(consciousnessState.emotional?.primary)) {
        score += 10;
      }
      
      // Match story act
      if (fragment.context?.storyAct === this.storyProgress.get(storyContext.storyId)?.act) {
        score += 5;
      }
      
      // Match complexity level
      if (fragment.context?.complexity === storyContext.config?.technical?.difficulty?.initial) {
        score += 3;
      }
      
      // Add randomness for variety
      score += Math.random() * 5;
      
      return { fragment, score };
    });
    
    // Select highest scoring
    scored.sort((a, b) => b.score - a.score);
    return scored[0].fragment;
  }

  /**
   * Enrich fragment with dynamic content
   */
  enrichFragment(fragment, consciousnessState, storyContext) {
    const enriched = JSON.parse(JSON.stringify(fragment)); // Deep copy
    
    // Replace placeholders
    if (enriched.content?.text) {
      enriched.content.text = this.replacePlaceholders(
        enriched.content.text,
        consciousnessState,
        storyContext
      );
    }
    
    // Apply variations if any
    if (enriched.variations && enriched.variations.length > 0) {
      const applicable = enriched.variations.filter(v => 
        this.conditionEvaluator.evaluate({ conditions: [v.condition] }, { consciousness: consciousnessState })
      );
      
      if (applicable.length > 0) {
        // Select based on weights
        const selected = this.weightedSelect(applicable);
        Object.assign(enriched.content, selected.content);
      }
    }
    
    return enriched;
  }

  /**
   * Replace placeholders in text
   */
  replacePlaceholders(text, consciousness, story) {
    return text
      .replace(/\${name}/g, consciousness.name)
      .replace(/\${emotion}/g, consciousness.emotional?.primary || 'neutral')
      .replace(/\${stability}/g, Math.round(consciousness.stability * 100))
      .replace(/\${corruption}/g, Math.round(consciousness.corruption * 100))
      .replace(/\${act}/g, this.storyProgress.get(story.storyId)?.act || 1);
  }

  /**
   * Generate generic memory dump
   */
  generateGenericMemoryDump(address, consciousness) {
    return {
      id: `generic-memory-${address}`,
      type: 'memory_dump',
      content: {
        text: `Memory at ${address}:\n[Corrupted data - emotional resonance detected]\n` +
              `Stability factor: ${consciousness.stability.toFixed(2)}\n` +
              `Unable to fully decode memory contents.`,
        formatting: 'memory',
        voice: 'system'
      }
    };
  }

  /**
   * Get count of recent similar fragments
   */
  getRecentSimilarFragments(fragment, storyId) {
    const triggered = Array.from(this.triggeredFragments.get(storyId) || []);
    const recent = triggered.slice(-10); // Last 10 triggers
    
    return recent.filter(id => {
      const triggeredFragment = this.fragmentIndex.get(id);
      return triggeredFragment?.type === fragment.type;
    }).length;
  }

  /**
   * Weighted random selection
   */
  weightedSelect(items) {
    const totalWeight = items.reduce((sum, item) => sum + (item.weight || 1), 0);
    let random = Math.random() * totalWeight;
    
    for (const item of items) {
      random -= (item.weight || 1);
      if (random <= 0) return item;
    }
    
    return items[0]; // Fallback
  }

  /**
   * Get all available story IDs
   */
  async getAvailableStories() {
    const storiesPath = path.join(process.cwd(), 'data', 'stories');
    const stories = [];
    
    try {
      const dirs = await fs.readdir(storiesPath);
      
      for (const dir of dirs) {
        const storyConfigPath = path.join(storiesPath, dir, 'story-config.json');
        try {
          await fs.access(storyConfigPath);
          stories.push(dir);
        } catch {
          // Not a valid story directory
        }
      }
    } catch (error) {
      console.error('Failed to list stories:', error);
    }
    
    return stories;
  }

  /**
   * Reset story progress
   */
  resetStoryProgress(storyId) {
    this.storyProgress.delete(storyId);
    this.triggeredFragments.delete(storyId);
    
    // Clear cooldowns for this story
    const storyFragments = [];
    for (const [key, fragments] of this.fragments) {
      if (key.startsWith(storyId)) {
        storyFragments.push(...fragments.map(f => f.id));
      }
    }
    
    storyFragments.forEach(id => this.fragmentCooldowns.delete(id));
    
    this.emit('storyReset', { storyId });
  }

  /**
   * Export story progress for saving
   */
  exportProgress(storyId) {
    return {
      progress: this.storyProgress.get(storyId),
      triggeredFragments: Array.from(this.triggeredFragments.get(storyId) || []),
      choiceState: this.choiceTracker.exportState(storyId)
    };
  }

  /**
   * Import saved story progress
   */
  importProgress(storyId, savedProgress) {
    if (savedProgress.progress) {
      this.storyProgress.set(storyId, savedProgress.progress);
    }
    
    if (savedProgress.triggeredFragments) {
      this.triggeredFragments.set(storyId, new Set(savedProgress.triggeredFragments));
    }
    
    if (savedProgress.choiceState) {
      this.choiceTracker.importState(storyId, savedProgress.choiceState);
    }
  }

  /**
   * Get fragment by ID
   */
  getFragment(fragmentId) {
    return this.fragmentIndex.get(fragmentId);
  }

  /**
   * Get narrative statistics
   */
  getStatistics(storyId) {
    const progress = this.storyProgress.get(storyId);
    if (!progress) return null;
    
    const triggered = this.triggeredFragments.get(storyId) || new Set();
    let totalFragments = 0;
    
    for (const [key, fragments] of this.fragments) {
      if (key.startsWith(storyId)) {
        totalFragments += fragments.length;
      }
    }
    
    return {
      progress: Math.round(progress.progress * 100),
      act: progress.act,
      fragmentsTriggered: triggered.size,
      totalFragments,
      choicesMade: progress.choicesMade.length,
      timeElapsed: Date.now() - progress.startTime,
      completionEstimate: this.estimateCompletion(progress)
    };
  }

  /**
   * Estimate time to completion
   */
  estimateCompletion(progress) {
    if (progress.progress === 0) return null;
    
    const elapsed = Date.now() - progress.startTime;
    const rate = progress.progress / elapsed;
    const remaining = (1 - progress.progress) / rate;
    
    return {
      minutes: Math.ceil(remaining / 60000),
      confidence: Math.min(progress.progress * 2, 1) // More confident as progress increases
    };
  }
}