import { ChoiceTracker as BaseChoiceTracker } from '../ChoiceTracker.js';

export class NarrativeChoiceTracker {
  constructor() {
    this.tracker = new BaseChoiceTracker();
  }

  async loadChoiceTree(storyId) {
    return this.tracker.loadChoiceTree(storyId);
  }

  evaluateChoicePoints(consciousness, storyContext, progress) {
    return this.tracker.evaluateChoicePoints(
      consciousness,
      storyContext,
      progress
    );
  }

  recordChoice(storyId, choiceId, option) {
    this.tracker.recordChoice(storyId, choiceId, option);
  }

  exportState(storyId) {
    return this.tracker.exportState(storyId);
  }

  importState(storyId, state) {
    this.tracker.importState(storyId, state);
  }
}
