import EmotionalProcessor from '../EmotionalProcessor.js';

export default class EmotionalState {
  constructor(instance, config) {
    this.instance = instance;
    this.processor = new EmotionalProcessor(instance, config);
  }

  async initialize(state = {}) {
    return this.processor.initialize(state);
  }

  async tick() {
    return this.processor.tick();
  }

  async modifyEmotion(emotion, modifier, duration) {
    return this.processor.modifyEmotion(emotion, modifier, duration);
  }

  captureState() {
    return this.processor.captureState();
  }

  async restoreState(saved) {
    return this.processor.restoreState(saved);
  }

  getResourceUsage() {
    return this.processor.getResourceUsage();
  }

  getPrimaryEmotion() {
    return this.processor.getPrimaryEmotion();
  }

  getTotalIntensity() {
    return this.processor.getTotalIntensity();
  }

  getVolatility() {
    return this.processor.getVolatility();
  }

  generateProfile() {
    return this.processor.generateProfile();
  }

  intensifyAll(value) {
    return this.processor.intensifyAll(value);
  }

  executeAction(action, parameters = {}) {
    return this.processor.executeAction(action, parameters);
  }
}
