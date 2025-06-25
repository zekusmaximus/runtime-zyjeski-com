export default class InstanceEvents {
  constructor(emitter) {
    this.emitter = emitter;
  }

  initialized(state) {
    this.emitter.emit('initialized', state);
  }

  stateRestored(snapshot) {
    this.emitter.emit('stateRestored', snapshot);
  }

  criticalState(state) {
    this.emitter.emit('criticalState', state);
  }

  totalCorruption(state) {
    this.emitter.emit('totalCorruption', state);
  }

  resourceExhaustion(detail) {
    this.emitter.emit('resourceExhaustion', detail);
  }

  shutdown(data) {
    this.emitter.emit('shutdown', data);
  }
}
