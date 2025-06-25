import ConditionEvaluator from '../ConditionEvaluator.js';

export class TriggerChecker {
  constructor(evaluator = new ConditionEvaluator()) {
    this.evaluator = evaluator;
  }

  evaluate(fragment, context) {
    if (!fragment.triggers) return false;
    return this.evaluator.evaluate(fragment.triggers, context);
  }

  evaluateFragments(fragments, context) {
    const results = [];
    for (const fragment of fragments) {
      if (this.evaluate(fragment, context)) {
        results.push({ fragment, context });
      }
    }
    return results;
  }

  evaluateSystemTrigger(fragment, context) {
    if (fragment.triggers?.conditions?.some(c => c.type === 'time_elapsed')) {
      return this.evaluator.evaluate(fragment.triggers, context);
    }

    if (context.updates?.stateChanges?.length) {
      for (const change of context.updates.stateChanges) {
        if (fragment.triggers?.conditions?.some(c =>
          c.type === 'system_resource' && c.target === change.type)) {
          return this.evaluator.evaluate(fragment.triggers, context);
        }
      }
    }
    return false;
  }
}
