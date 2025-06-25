import fs from 'fs/promises';
import path from 'path';
import { EventEmitter } from 'events';
import { FragmentLoader } from './narrative/fragment-loader.js';
import { TriggerChecker } from './narrative/trigger-checker.js';
import { NarrativeChoiceTracker } from './narrative/choice-tracker.js';
import { NarrativeResponder } from './narrative/narrative-responder.js';
import * as Utils from './narrative/narrative-utils.js';

export class NarrativeEngine extends EventEmitter {
  constructor() {
    super();
    this.fragmentLoader = new FragmentLoader();
    this.triggerChecker = new TriggerChecker();
    this.choiceTracker = new NarrativeChoiceTracker();
    this.responder = new NarrativeResponder();

    this.storyProgress = new Map();
    this.triggeredFragments = new Map();
    this.fragmentCooldowns = new Map();

    this.config = {
      maxFragmentsPerTrigger: 3,
      defaultCooldown: 5000,
      priorityWeights: { critical: 1000, high: 100, normal: 10, low: 1 }
    };
  }

  async initialize() {
    await this.loadGlobalConfig();
    this.emit('initialized');
  }

  async loadGlobalConfig() {
    try {
      const configPath = path.join(process.cwd(), 'data', 'narrative-config.json');
      const configData = await fs.readFile(configPath, 'utf8');
      const config = JSON.parse(configData);
      Object.assign(this.config, config);
    } catch {
      console.log('No global narrative config found, using defaults');
    }
  }

  async loadStoryFragments(storyId) {
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
    const info = await this.fragmentLoader.loadStoryFragments(storyId);
    await this.choiceTracker.loadChoiceTree(storyId);
    this.emit('storyLoaded', info);
  }

  async checkTriggers(consciousnessState, userAction, actionResult, storyContext) {
    const now = Date.now();
    const storyId = storyContext.storyId;
    const fragmentTypes = ['process-triggers', 'debug-logs'];
    const potential = [];
    for (const type of fragmentTypes) {
      potential.push(...this.fragmentLoader.getFragments(`${storyId}:${type}`));
    }

    const triggered = [];
    for (const fragment of potential) {
      if (this.isOnCooldown(fragment.id, now)) continue;
      if (!this.canTriggerFragment(fragment, storyId)) continue;
      const context = {
        consciousness: consciousnessState,
        action: userAction,
        result: actionResult,
        story: storyContext,
        progress: this.storyProgress.get(storyId)
      };
      if (this.triggerChecker.evaluate(fragment, context)) {
        const recent = Utils.getRecentSimilarFragments(
          fragment,
          this.triggeredFragments.get(storyId),
          this.fragmentLoader.fragmentIndex
        );
        const priority = Utils.calculatePriority(
          fragment,
          context,
          this.config.priorityWeights,
          recent
        );
        triggered.push({ fragment, priority, context });
      }
    }

    const choicePoints = await this.choiceTracker.evaluateChoicePoints(
      consciousnessState,
      storyContext,
      this.storyProgress.get(storyId)
    );
    for (const choice of choicePoints) {
      triggered.push({
        fragment: choice,
        priority: this.config.priorityWeights.high,
        context: { type: 'choice_point' }
      });
    }

    triggered.sort((a, b) => b.priority - a.priority);
    const selected = triggered.slice(0, this.config.maxFragmentsPerTrigger);
    for (const item of selected) {
      this.recordFragmentTrigger(item.fragment, storyId, now);
    }
    return selected;
  }

  async checkSystemTriggers(consciousnessState, systemUpdates, storyContext) {
    const now = Date.now();
    const storyId = storyContext.storyId;
    const fragments = this.fragmentLoader.getFragments(`${storyId}:process-triggers`);
    const triggered = [];
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
      if (this.triggerChecker.evaluateSystemTrigger(fragment, context)) {
        const recent = Utils.getRecentSimilarFragments(
          fragment,
          this.triggeredFragments.get(storyId),
          this.fragmentLoader.fragmentIndex
        );
        const priority = Utils.calculatePriority(
          fragment,
          context,
          this.config.priorityWeights,
          recent
        );
        triggered.push({ fragment, priority, context });
      }
    }
    return triggered;
  }

  async generateMemoryDump(address, consciousnessState, storyContext) {
    const storyId = storyContext.storyId;
    const fragments = this.fragmentLoader.getFragments(`${storyId}:memory-dumps`);
    const candidates = fragments.filter(f =>
      f.memoryAddress === address ||
      (f.memoryRange && Utils.isAddressInRange(address, f.memoryRange))
    );
    if (candidates.length === 0) {
      return Utils.generateGenericMemoryDump(address, consciousnessState);
    }
    const selected = Utils.selectContextualFragment(
      candidates,
      consciousnessState,
      storyContext,
      this.storyProgress.get(storyId)
    );
    return Utils.enrichFragment(selected, consciousnessState, {
      ...storyContext,
      progress: this.storyProgress.get(storyId)
    });
  }

  async getResolutionFragments(consciousnessState, storyContext) {
    const storyId = storyContext.storyId;
    const resolutions = this.fragmentLoader.getFragments(`${storyId}:resolutions`);
    const applicable = [];
    for (const res of resolutions) {
      const context = {
        consciousness: consciousnessState,
        story: storyContext,
        progress: this.storyProgress.get(storyId)
      };
      if (this.triggerChecker.evaluate(res, context)) {
        const recent = Utils.getRecentSimilarFragments(
          res,
          this.triggeredFragments.get(storyId),
          this.fragmentLoader.fragmentIndex
        );
        const priority = Utils.calculatePriority(
          res,
          context,
          this.config.priorityWeights,
          recent
        );
        applicable.push({ fragment: res, priority });
      }
    }
    return applicable.sort((a, b) => b.priority - a.priority);
  }

  updateProgress(storyId, delta) {
    const progress = this.storyProgress.get(storyId);
    if (!progress) return;
    progress.progress = Math.min(1, progress.progress + delta);
    const acts = 4; // default
    progress.act = Math.ceil(progress.progress * acts);
    this.emit('progressUpdate', { storyId, progress: progress.progress, act: progress.act });
  }

  recordChoice(storyId, choiceId, selectedOption) {
    const progress = this.storyProgress.get(storyId);
    if (!progress) return;
    progress.choicesMade.push({ choiceId, selectedOption, timestamp: Date.now() });
    this.choiceTracker.recordChoice(storyId, choiceId, selectedOption);
    this.emit('choiceMade', { storyId, choiceId, selectedOption });
  }

  getProgress(storyId) {
    const progress = this.storyProgress.get(storyId);
    if (!progress) return null;
    return {
      ...progress,
      triggeredCount: this.triggeredFragments.get(storyId)?.size || 0,
      timeElapsed: Date.now() - progress.startTime
    };
  }

  isOnCooldown(id, now) {
    const end = this.fragmentCooldowns.get(id);
    return end && now < end;
  }

  canTriggerFragment(fragment, storyId) {
    if (fragment.triggers?.maxTriggers === -1) return true;
    const triggered = this.triggeredFragments.get(storyId);
    if (!triggered) return true;
    const count = Array.from(triggered).filter(id => id === fragment.id).length;
    return count < (fragment.triggers?.maxTriggers || 1);
  }

  recordFragmentTrigger(fragment, storyId, now) {
    const triggered = this.triggeredFragments.get(storyId);
    triggered.add(fragment.id);
    const cooldown = fragment.triggers?.cooldown || this.config.defaultCooldown;
    this.fragmentCooldowns.set(fragment.id, now + cooldown);
    this.storyProgress.get(storyId).fragmentsTriggered.add(fragment.id);
  }

  resetStoryProgress(storyId) {
    this.storyProgress.delete(storyId);
    this.triggeredFragments.delete(storyId);
    const ids = [];
    for (const [key, fragments] of this.fragmentLoader.fragments) {
      if (key.startsWith(storyId)) ids.push(...fragments.map(f => f.id));
    }
    ids.forEach(id => this.fragmentCooldowns.delete(id));
    this.emit('storyReset', { storyId });
  }

  exportProgress(storyId) {
    return {
      progress: this.storyProgress.get(storyId),
      triggeredFragments: Array.from(this.triggeredFragments.get(storyId) || []),
      choiceState: this.choiceTracker.exportState(storyId)
    };
  }

  importProgress(storyId, saved) {
    if (saved.progress) this.storyProgress.set(storyId, saved.progress);
    if (saved.triggeredFragments) {
      this.triggeredFragments.set(storyId, new Set(saved.triggeredFragments));
    }
    if (saved.choiceState) {
      this.choiceTracker.importState(storyId, saved.choiceState);
    }
  }

  getFragment(id) {
    return this.fragmentLoader.getFragmentById(id);
  }

  async getAvailableStories() {
    return this.fragmentLoader.getAvailableStories();
  }

  getStatistics(storyId) {
    const progress = this.storyProgress.get(storyId);
    if (!progress) return null;
    const triggered = this.triggeredFragments.get(storyId) || new Set();
    let totalFragments = 0;
    for (const [key, fragments] of this.fragmentLoader.fragments) {
      if (key.startsWith(storyId)) totalFragments += fragments.length;
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

  estimateCompletion(progress) {
    if (progress.progress === 0) return null;
    const elapsed = Date.now() - progress.startTime;
    const rate = progress.progress / elapsed;
    const remaining = (1 - progress.progress) / rate;
    return { minutes: Math.ceil(remaining / 60000), confidence: Math.min(progress.progress * 2, 1) };
  }
}
