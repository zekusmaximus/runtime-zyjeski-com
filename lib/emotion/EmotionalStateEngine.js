export default class EmotionalStateEngine {
  constructor(initial = {}) {
    this.state = { grief: 0, anger: 0, joy: 0, ...initial };
    this.history = [];
    this.record();
  }

  update(emotion, delta) {
    const value = (this.state[emotion] ?? 0) + delta;
    this.state[emotion] = Math.min(1, Math.max(0, value));
    this.record();
  }

  decay(rate = 0.01) {
    Object.keys(this.state).forEach(e => {
      this.state[e] = Math.max(0, this.state[e] - rate);
    });
    this.record();
  }

  getDominant() {
    let dominant = 'neutral';
    let max = 0;
    for (const [e, v] of Object.entries(this.state)) {
      if (v > max) {
        dominant = e;
        max = v;
      }
    }
    return dominant;
  }

  record() {
    this.history.push({ ts: Date.now(), ...this.state });
    if (this.history.length > 10) this.history.shift();
  }
}
