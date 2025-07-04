// Security tests for eval/Function elimination
import { describe, it, expect, beforeEach } from 'vitest';
import { Parser } from 'expr-eval';
import ScenarioEngine from '../../lib/scenario-engine.js';
import ConditionEvaluator from '../../lib/ConditionEvaluator.js';
import { ChoiceTracker } from '../../lib/ChoiceTracker.js';

describe('Security: eval/Function Elimination', () => {
  describe('ScenarioEngine', () => {
    let engine;

    beforeEach(() => {
      engine = new ScenarioEngine({ scenarioDir: './test-data/scenarios' });
    });

    it('should evaluate conditions safely without new Function()', () => {
      const conditions = [
        'state.consciousness.coherence > 0.4',
        'state.system_errors == 0'
      ];

      const state = {
        consciousness: { coherence: 0.5 },
        system_errors: []
      };

      const result = engine.checkConditions(conditions, state, null, null);
      expect(result).toBe(true);
    });

    it('should handle complex conditions with custom functions', () => {
      const conditions = [
        'contains(state.errors, "PARADOX_CASCADE") == false',
        'length(state.processes) > 0'
      ];

      const state = {
        errors: ['MEMORY_LEAK'],
        processes: ['process1', 'process2']
      };

      const result = engine.checkConditions(conditions, state, null, null);
      expect(result).toBe(true);
    });

    it('should return false for invalid expressions', () => {
      const conditions = ['invalid.expression.that.should.fail'];
      const state = {};

      const result = engine.checkConditions(conditions, state, null, null);
      expect(result).toBe(false);
    });

    it('should handle empty conditions array', () => {
      const result = engine.checkConditions([], {}, null, null);
      expect(result).toBe(true);
    });
  });

  describe('ConditionEvaluator', () => {
    let evaluator;
    let mockConsciousness;

    beforeEach(() => {
      mockConsciousness = {
        processManager: {
          getSystemResourceUsage: () => ({ totalMemoryUsage: 50, totalCpuUsage: 30 })
        },
        emotionalProcessor: {
          getCurrentState: () => ({ primary: { anxiety: 0.3 } }),
          getStressLevel: () => 0.4
        }
      };
      evaluator = new ConditionEvaluator(mockConsciousness);
    });

    it('should evaluate mathematical expressions safely', () => {
      expect(evaluator.safeEvaluate('5 > 3')).toBe(true);
      expect(evaluator.safeEvaluate('10 + 20 == 30')).toBe(true);
      expect(evaluator.safeEvaluate('1 && 0')).toBe(false);
      expect(evaluator.safeEvaluate('(5 + 3) * 2 == 16')).toBe(true);
    });

    it('should handle invalid mathematical expressions', () => {
      expect(evaluator.safeEvaluate('invalid expression')).toBe(false);
      expect(evaluator.safeEvaluate('5 +')).toBe(false);
      expect(evaluator.safeEvaluate('')).toBe(false);
    });

    it('should evaluate complex mathematical expressions', () => {
      expect(evaluator.safeEvaluate('(10 > 5) && (3 < 7)')).toBe(true);
      expect(evaluator.safeEvaluate('(2 * 3) + (4 / 2) == 8')).toBe(true);
      expect(evaluator.safeEvaluate('!(5 < 3)')).toBe(true);
    });
  });

  describe('ChoiceTracker', () => {
    let tracker;

    beforeEach(() => {
      tracker = new ChoiceTracker();
    });

    it('should evaluate choice conditions safely', () => {
      const context = {
        consciousness: { debugIssueCount: 5 },
        playerChoices: new Map([['choice1', 'option1']])
      };

      const result = tracker.evaluateSimpleCondition('getDebugIssueCount() > 0', context);
      expect(result).toBe(true);
    });

    it('should handle playerActionCount function', () => {
      const context = {
        consciousness: { debugIssueCount: 0 },
        playerChoices: new Map([['choice1', 'option1'], ['choice2', 'option2']])
      };

      const result = tracker.evaluateSimpleCondition('playerActionCount("intervention") == 2', context);
      expect(result).toBe(true);
    });

    it('should handle complex choice conditions', () => {
      const context = {
        consciousness: { debugIssueCount: 3 },
        playerChoices: new Map()
      };

      const result = tracker.evaluateSimpleCondition('getDebugIssueCount() > 0 && playerActionCount("test") == 0', context);
      expect(result).toBe(true);
    });

    it('should return false for invalid choice conditions', () => {
      const context = {
        consciousness: { debugIssueCount: 0 },
        playerChoices: new Map()
      };

      const result = tracker.evaluateSimpleCondition('invalid.function.call()', context);
      expect(result).toBe(false);
    });
  });

  describe('Expression Parser Security', () => {
    let parser;

    beforeEach(() => {
      parser = new Parser();
    });

    it('should not allow dangerous code execution', () => {
      // These should all fail safely
      const dangerousExpressions = [
        'eval("alert(1)")',
        'new Function("return 1")()',
        'window.location = "http://evil.com"',
        'document.cookie',
        'process.exit(1)'
      ];

      dangerousExpressions.forEach(expr => {
        expect(() => {
          const parsed = parser.parse(expr);
          parsed.evaluate({});
        }).toThrow();
      });
    });

    it('should only allow safe mathematical operations', () => {
      const safeExpressions = [
        '1 + 1',
        '5 * 3',
        '10 / 2',
        '7 - 3',
        '2 ^ 3',
        'sqrt(16)',
        'abs(-5)',
        'max(1, 2, 3)',
        'min(1, 2, 3)'
      ];

      safeExpressions.forEach(expr => {
        expect(() => {
          const parsed = parser.parse(expr);
          const result = parsed.evaluate({});
          expect(typeof result).toBe('number');
        }).not.toThrow();
      });
    });
  });
});
