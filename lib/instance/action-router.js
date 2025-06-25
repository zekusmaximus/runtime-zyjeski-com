import * as InstanceUtils from './instance-utils.js';

export default class ActionRouter {
  constructor(instance) {
    this.instance = instance;
  }

  isValidAction(action) {
    const validActions = [
      'ps', 'kill', 'nice', 'renice', 'suspend', 'resume',
      'free', 'dump', 'peek', 'poke', 'protect', 'unprotect',
      'calm', 'intensify', 'balance', 'suppress',
      'reboot', 'stabilize', 'defragment', 'analyze'
    ];
    return validActions.includes(action);
  }

  getActionCategory(action) {
    const categories = {
      process: ['ps', 'kill', 'nice', 'renice', 'suspend', 'resume'],
      memory: ['free', 'dump', 'peek', 'poke', 'protect', 'unprotect'],
      emotional: ['calm', 'intensify', 'balance', 'suppress'],
      system: ['reboot', 'stabilize', 'defragment', 'analyze']
    };
    for (const [category, actions] of Object.entries(categories)) {
      if (actions.includes(action)) return category;
    }
    return 'unknown';
  }

  async execute(action, parameters = {}) {
    if (!this.isValidAction(action)) {
      throw new Error(`Invalid action: ${action}`);
    }
    if (this.instance.state.stability < 0.1 && !parameters.force) {
      throw new Error('System too unstable for action execution');
    }

    this.instance.snapshotManager.save();

    try {
      let result = {};
      switch (this.getActionCategory(action)) {
        case 'process':
          result = await this.instance.processManager.executeAction(action, parameters);
          break;
        case 'memory':
          result = await this.instance.memoryState.executeAction(action, parameters);
          break;
        case 'emotional':
          result = await this.instance.emotionalState.executeAction(action, parameters);
          break;
        case 'system':
          result = await this.instance.executeSystemAction(action, parameters);
          break;
        default:
          throw new Error(`Unknown action category for: ${action}`);
      }

      await InstanceUtils.updateResourceUsage(this.instance);
      InstanceUtils.checkSystemHealth(this.instance);

      return {
        success: true,
        action,
        result,
        state: this.instance.snapshotManager.getState(),
        timestamp: Date.now(),
      };
    } catch (error) {
      this.instance.state.errors.push({
        timestamp: Date.now(),
        action,
        type: 'action_execution',
        message: error.message,
      });

      if (InstanceUtils.shouldCascadeError(this.instance, error)) {
        await InstanceUtils.triggerErrorCascade(this.instance, error);
      }

      throw error;
    }
  }
}
