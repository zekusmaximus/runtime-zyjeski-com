import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { EventEmitter } from 'events';

/**
 * ScenarioEngine
 * Loads scenario definitions and manages progression.
 * Scenarios are defined as JSON files under data/scenarios.
 */
export default class ScenarioEngine extends EventEmitter {
  constructor(options = {}) {
    super();
    this.scenarioDir = options.scenarioDir || path.join(process.cwd(), 'data', 'scenarios');
    this.watchFiles = options.watch ?? false;
    this.scenarios = new Map(); // id -> scenario definition
    this.progress = new Map();  // characterId -> {scenarioId -> progress}
    this.watcher = null;
    this.engine = null; // attached ConsciousnessEngine
  }

  /** Initialize engine and optionally start file watcher */
  async initialize() {
    await this.loadAll();
    if (this.watchFiles) {
      this.startWatcher();
    }
    this.emit('initialized', { count: this.scenarios.size });
  }

  /** Attach to a ConsciousnessEngine instance */
  attach(consciousnessEngine) {
    this.engine = consciousnessEngine;
    this.engine.on('actionExecuted', (data) => this.handleAction(data));
    this.engine.on('stateUpdate', (data) => this.handleStateUpdate(data));
  }

  /** Load all scenario files from directory */
  async loadAll() {
    this.scenarios.clear();
    try {
      const files = await fs.readdir(this.scenarioDir);
      for (const file of files) {
        if (file.endsWith('.json')) {
          const full = path.join(this.scenarioDir, file);
          const scenario = await this.loadFile(full);
          this.scenarios.set(scenario.id, scenario);
        }
      }
    } catch (err) {
      this.emit('error', { type: 'load', error: err });
    }
  }

  /** Load a single scenario file */
  async loadFile(filePath) {
    const data = await fs.readFile(filePath, 'utf8');
    const scenario = JSON.parse(data);
    return scenario;
  }

  /** Reload a specific file when changed */
  async reloadFile(filename) {
    try {
      const filePath = path.join(this.scenarioDir, filename);
      const scenario = await this.loadFile(filePath);
      this.scenarios.set(scenario.id, scenario);
      this.emit('reloaded', { id: scenario.id });
    } catch (err) {
      this.emit('error', { type: 'reload', error: err });
    }
  }

  /** Start file watcher in development */
  startWatcher() {
    if (this.watcher) return;
    this.watcher = fsSync.watch(this.scenarioDir, (event, filename) => {
      if (filename && filename.endsWith('.json')) {
        this.reloadFile(filename);
      }
    });
  }

  /** Handle player actions */
  async handleAction({ characterId, action, result, state }) {
    const instance = this.engine?.instances.get(characterId);
    if (!instance) return;
    await this.evaluate(characterId, instance.getState(), action, result);
  }

  /** Handle state updates */
  async handleStateUpdate({ characterId, state }) {
    const instance = this.engine?.instances.get(characterId);
    if (!instance) return;
    await this.evaluate(characterId, state);
  }

  /** Evaluate scenarios for a character */
  async evaluate(characterId, state, action = null, result = null) {
    for (const scenario of this.scenarios.values()) {
      const progress = this.getScenarioProgress(characterId, scenario.id);
      if (progress.status === 'complete') continue;

      // Check prerequisites
      if (!this.checkConditions(scenario.conditions?.prerequisites || [], state, action, result)) {
        continue;
      }

      if (progress.status !== 'active') {
        // Check triggers to start scenario
        if (this.checkConditions(scenario.conditions?.triggers || [], state, action, result)) {
          await this.startScenario(characterId, scenario);
        }
      } else {
        // Scenario active - check objectives for completion
        if (this.checkObjectives(scenario.objectives || [], state)) {
          await this.completeScenario(characterId, scenario, 'success');
        }
      }
    }
  }

  /** Simple condition evaluation using Function constructor */
  checkConditions(conditions, state, action, result) {
    if (conditions.length === 0) return true;
    return conditions.every(cond => {
      try {
        const fn = new Function('state', 'action', 'result', `return (${cond});`);
        return !!fn(state, action, result);
      } catch {
        return false;
      }
    });
  }

  /** Basic objective check */
  checkObjectives(objectives, state) {
    if (objectives.length === 0) return false;
    return objectives.every(obj => this.checkConditions(obj.success_conditions ? Object.values(obj.success_conditions) : [], state));
  }

  /** Begin scenario and apply modifications */
  async startScenario(characterId, scenario) {
    const instance = this.engine?.instances.get(characterId);
    if (!instance) return;

    const mod = scenario.modifications || {};
    if (mod.processes) {
      for (const p of mod.processes) {
        try {
          await instance.modifyProcess(p.name, p.action, p.parameters || {});
        } catch {}
      }
    }
    // Other modifications (resources/errors) could be handled here

    const progress = this.getScenarioProgress(characterId, scenario.id);
    progress.status = 'active';
    progress.startTime = Date.now();
    this.saveProgress(characterId);
    this.emit('scenarioStarted', { characterId, scenario });
  }

  /** Mark scenario complete */
  async completeScenario(characterId, scenario, outcome = 'success') {
    const progress = this.getScenarioProgress(characterId, scenario.id);
    progress.status = 'complete';
    progress.outcome = outcome;
    progress.endTime = Date.now();
    this.saveProgress(characterId);
    this.emit('scenarioCompleted', { characterId, scenarioId: scenario.id, outcome });
  }

  /** Get or create progress for scenario */
  getScenarioProgress(characterId, scenarioId) {
    if (!this.progress.has(characterId)) {
      this.progress.set(characterId, {});
    }
    const charProg = this.progress.get(characterId);
    if (!charProg[scenarioId]) {
      charProg[scenarioId] = { status: 'pending', choices: [] };
    }
    return charProg[scenarioId];
  }

  /** Save progress to file */
  async saveProgress(characterId) {
    try {
      const dir = path.join(this.scenarioDir, 'progress');
      await fs.mkdir(dir, { recursive: true });
      const file = path.join(dir, `${characterId}.json`);
      await fs.writeFile(file, JSON.stringify(this.progress.get(characterId), null, 2));
    } catch (err) {
      this.emit('error', { type: 'save', error: err });
    }
  }

  /** Load progress for character */
  async loadProgress(characterId) {
    try {
      const file = path.join(this.scenarioDir, 'progress', `${characterId}.json`);
      const data = await fs.readFile(file, 'utf8');
      const parsed = JSON.parse(data);
      if (!this.progress.has(characterId)) this.progress.set(characterId, parsed);
      else Object.assign(this.progress.get(characterId), parsed);
    } catch {
      // Ignore if no progress file
    }
  }
}
