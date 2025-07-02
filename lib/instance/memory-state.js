import MemoryManager from '../MemoryManager.js';

export default class MemoryState {
  constructor(instance, config, dependencies = {}) {
    this.instance = instance;
    this.manager = new MemoryManager(instance, config, dependencies);
  }

  async initialize() {
    return this.manager.initialize();
  }

  async tick() {
    return this.manager.tick();
  }

  async modifyMemory(action, address, data) {
    return this.manager.modifyMemory(action, address, data);
  }

  executeAction(action, parameters = {}) {
    return this.manager.executeAction(action, parameters);
  }

  getState() {
    return this.manager.getState();
  }

  getMemoryStatus() {
    return this.manager.getMemoryStatus();
  }

  captureState() {
    return this.manager.captureState();
  }

  async restoreState(saved) {
    return this.manager.restoreState(saved);
  }

  getResourceUsage() {
    return this.manager.getResourceUsage();
  }

  defragment(aggressive) {
    return this.manager.defragment(aggressive);
  }

  generateMemoryMap() {
    return this.manager.generateMemoryMap();
  }

  getFragmentation() {
    return this.manager.getFragmentation();
  }

  getCorruptedRegions() {
    return this.manager.getCorruptedRegions();
  }

  corruptRegion(address, severity = 0.1) {
    if (typeof this.manager.corruptRegion === 'function') {
      return this.manager.corruptRegion(address, severity);
    }
    return null;
  }

  clearVolatile() {
    return this.manager.clearVolatile();
  }
}
