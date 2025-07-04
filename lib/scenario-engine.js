import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { EventEmitter } from 'events';
import { Parser } from 'expr-eval';

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

    // Initialize expression parser for safe condition evaluation
    this.conditionParser = new Parser();
    this.setupConditionFunctions();
  }

  /** Setup custom functions for condition evaluation */
  setupConditionFunctions() {
    // Add helper functions for scenario conditions
    this.conditionParser.functions.contains = (array, item) => {
      return Array.isArray(array) && array.includes(item);
    };

    this.conditionParser.functions.hasProperty = (obj, prop) => {
      return obj && obj.hasOwnProperty(prop);
    };

    this.conditionParser.functions.length = (array) => {
      return Array.isArray(array) ? array.length : 0;
    };

    // Add property access functions
    this.conditionParser.functions.getProperty = (obj, prop) => {
      return obj && obj[prop];
    };

    this.conditionParser.functions.getNestedProperty = (obj, prop1, prop2) => {
      return obj && obj[prop1] && obj[prop1][prop2];
    };

    // Add logical operators as functions
    this.conditionParser.functions.and = (a, b) => {
      return Boolean(a) && Boolean(b);
    };

    this.conditionParser.functions.or = (a, b) => {
      return Boolean(a) || Boolean(b);
    };
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

  /** Safe condition evaluation using custom parser */
  checkConditions(conditions, state, action, result) {
    if (conditions.length === 0) return true;
    return conditions.every(cond => {
      try {
        return this.evaluateCondition(cond, { state, action, result });
      } catch (error) {
        console.warn('Scenario condition evaluation error:', error.message, 'Condition:', cond);
        return false;
      }
    });
  }

  /** Evaluate a single condition safely */
  evaluateCondition(condition, context) {
    // Handle simple mathematical expressions first
    if (this.isSimpleMathExpression(condition)) {
      try {
        const expr = this.conditionParser.parse(condition);
        return Boolean(expr.evaluate(context));
      } catch (error) {
        // Fall back to custom evaluation
      }
    }

    // Handle complex conditions with custom logic
    return this.evaluateComplexCondition(condition, context);
  }

  /** Check if condition is a simple mathematical expression */
  isSimpleMathExpression(condition) {
    // Simple expressions only contain numbers, operators, and parentheses
    return /^[0-9+\-*/.()>\s<!=]+$/.test(condition);
  }

  /** Evaluate complex conditions with object access and logical operators */
  evaluateComplexCondition(condition, context) {
    const { state, action, result } = context;

    // Handle object property access patterns
    if (condition.includes('.')) {
      // Replace state.prop.subprop with actual values
      let evaluated = condition;

      // Handle nested property access
      evaluated = evaluated.replace(/state\.(\w+)\.(\w+)/g, (match, prop1, prop2) => {
        const value = state && state[prop1] && state[prop1][prop2];
        return typeof value === 'number' ? value : (value ? 1 : 0);
      });

      // Handle simple property access
      evaluated = evaluated.replace(/state\.(\w+)/g, (match, prop) => {
        const value = state && state[prop];
        if (Array.isArray(value)) return value.length;
        return typeof value === 'number' ? value : (value ? 1 : 0);
      });

      // Now try to evaluate as simple math
      if (this.isSimpleMathExpression(evaluated)) {
        try {
          const expr = this.conditionParser.parse(evaluated);
          return Boolean(expr.evaluate({}));
        } catch (error) {
          return false;
        }
      }
    }

    // Handle function calls
    if (condition.includes('contains(')) {
      return this.evaluateContainsFunction(condition, context);
    }

    if (condition.includes('length(')) {
      return this.evaluateLengthFunction(condition, context);
    }

    return false;
  }

  /** Evaluate contains() function calls */
  evaluateContainsFunction(condition, context) {
    const { state } = context;
    const match = condition.match(/contains\(state\.(\w+),\s*"([^"]+)"\)\s*==\s*(\w+)/);
    if (match) {
      const [, prop, item, expected] = match;
      const array = state && state[prop];
      const contains = Array.isArray(array) && array.includes(item);
      const expectedValue = expected === 'true' || expected === '1';
      return contains === expectedValue;
    }
    return false;
  }

  /** Evaluate length() function calls */
  evaluateLengthFunction(condition, context) {
    const { state } = context;
    const match = condition.match(/length\(state\.(\w+)\)\s*([><=!]+)\s*(\d+)/);
    if (match) {
      const [, prop, operator, value] = match;
      const array = state && state[prop];
      const length = Array.isArray(array) ? array.length : 0;
      const targetValue = parseInt(value);

      switch (operator) {
        case '>': return length > targetValue;
        case '<': return length < targetValue;
        case '>=': return length >= targetValue;
        case '<=': return length <= targetValue;
        case '==': return length === targetValue;
        case '!=': return length !== targetValue;
        default: return false;
      }
    }
    return false;
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
