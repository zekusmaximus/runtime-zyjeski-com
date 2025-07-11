import EmotionalStateEngine from './emotion/EmotionalStateEngine.js';
import { debug } from './logger.js';

const emotionTransitions = {
  anger: { calm: -0.2, escalate: 0.2 },
  grief: { comfort: -0.1, dwell: 0.1 },
  joy: { upset: -0.1, reinforce: 0.1 }
};

export default class EmotionalProcessor {
  constructor(instance, config = {}) {
    this.instance = instance;
    this.engine = new EmotionalStateEngine(config.initialState);
  }

  async initialize(state = {}) {
    this.engine = new EmotionalStateEngine({ ...this.engine.state, ...state });
    debug('EmotionalProcessor initialized', { state: this.engine.state });
    return true;
  }

  tick() {
    this.engine.decay(0.01);
    return [];
  }

  modifyEmotion(emotion, delta) {
    this.engine.update(emotion, delta);
    debug('Emotion modified', { emotion, delta });
  }

  intensifyAll(value) {
    Object.keys(this.engine.state).forEach(e => this.engine.update(e, value));
  }

  executeAction(action, params = {}) {
    if (action === 'trigger_emotion') {
      this.modifyEmotion(params.emotion, params.delta ?? 0.1);
    } else if (action === 'reset') {
      this.engine = new EmotionalStateEngine();
    }
  }

  captureState() {
    return { state: { ...this.engine.state } };
  }

  restoreState(saved) {
    if (saved?.state) this.engine = new EmotionalStateEngine(saved.state);
  }

  getPrimaryEmotion() {
    return this.engine.getDominant();
  }

  getTotalIntensity() {
    return Object.values(this.engine.state).reduce((a, b) => a + b, 0);
  }

  getVolatility() {
    if (this.engine.history.length < 2) return 0;
    const prev = this.engine.history[this.engine.history.length - 2];
    const curr = this.engine.history[this.engine.history.length - 1];
    let diff = 0;
    for (const e of Object.keys(curr)) {
      if (e === 'ts') continue;
      diff += Math.abs(curr[e] - prev[e]);
    }
    return diff;
  }

  generateProfile() {
    return { dominant: this.getPrimaryEmotion(), levels: { ...this.engine.state } };
  }

  getResourceUsage() {
    return { memory: 0, threads: 0 };
  }

  /**
   * Get debuggable emotional issues for the consciousness engine
   * Returns array of emotional issues that can be debugged
   */
  getDebuggableEmotionalIssues() {
    const issues = [];
    const state = this.engine.state;

    // Check for high emotion levels that could be considered "issues"
    Object.entries(state).forEach(([emotion, level]) => {
      if (level > 0.7) {
        issues.push({
          type: 'high_emotional_intensity',
          emotion: emotion,
          level: level,
          severity: level > 0.9 ? 'critical' : 'warning',
          description: `${emotion} level is critically high (${(level * 100).toFixed(1)}%)`
        });
      }
    });

    // Check for emotional volatility
    const volatility = this.getVolatility();
    if (volatility > 0.5) {
      issues.push({
        type: 'emotional_volatility',
        volatility: volatility,
        severity: volatility > 0.8 ? 'critical' : 'warning',
        description: `High emotional volatility detected (${(volatility * 100).toFixed(1)}%)`
      });
    }

    // Check for emotional flatness (all emotions near zero)
    const totalIntensity = this.getTotalIntensity();
    if (totalIntensity < 0.1) {
      issues.push({
        type: 'emotional_suppression',
        totalIntensity: totalIntensity,
        severity: 'warning',
        description: 'Very low emotional responsiveness detected'
      });
    }

    return issues;
  }

  /**
   * Shutdown the emotional processor
   * Clean up any resources and prepare for termination
   */
  async shutdown() {
    debug('EmotionalProcessor shutting down');

    // Clear any timers or intervals if they exist
    // (Currently none, but this is where they would be cleaned up)

    // Reset state to neutral if needed
    // this.engine = new EmotionalStateEngine();

    // Log final state for debugging
    debug('EmotionalProcessor shutdown complete', {
      finalState: this.engine.state,
      totalIntensity: this.getTotalIntensity()
    });

    return true;
  }
}
