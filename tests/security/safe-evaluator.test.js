/**
 * Safe Expression Evaluator Security Tests
 * 
 * Comprehensive test suite to verify that the SafeEvaluator properly blocks
 * all dangerous operations while allowing safe expression evaluation.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { SafeEvaluator, safeEvaluator, evaluateCondition, evaluateExpression, validateExpression } from '../../lib/safe-evaluator.js';

describe('SafeEvaluator Security Tests', () => {
    let evaluator;

    beforeEach(() => {
        evaluator = new SafeEvaluator();
    });

    describe('Input Validation', () => {
        it('should reject non-string expressions', () => {
            expect(() => evaluator.validateExpression(123)).toThrow('Expression must be a string');
            expect(() => evaluator.validateExpression(null)).toThrow('Expression must be a string');
            expect(() => evaluator.validateExpression(undefined)).toThrow('Expression must be a string');
            expect(() => evaluator.validateExpression({})).toThrow('Expression must be a string');
        });

        it('should reject empty expressions', () => {
            expect(() => evaluator.validateExpression('')).toThrow('Expression cannot be empty');
        });

        it('should reject expressions exceeding maximum length', () => {
            const longExpression = 'x + '.repeat(200) + '1'; // Over 500 characters
            expect(() => evaluator.validateExpression(longExpression)).toThrow('Expression exceeds maximum length');
        });
    });

    describe('Security Blocking - Code Injection Prevention', () => {
        it('should block eval() calls', () => {
            const dangerousExpressions = [
                'eval("alert(1)")',
                'eval(maliciousCode)',
                'window.eval("code")',
                'global.eval("code")'
            ];

            dangerousExpressions.forEach(expr => {
                expect(() => evaluator.validateExpression(expr)).toThrow(/Security violation/);
            });
        });

        it('should block Function constructor calls', () => {
            const dangerousExpressions = [
                'new Function("return 1")()',
                'Function("alert(1)")()',
                'window.Function("code")',
                'global.Function("code")'
            ];

            dangerousExpressions.forEach(expr => {
                expect(() => evaluator.validateExpression(expr)).toThrow(/Security violation/);
            });
        });

        it('should block global object access', () => {
            const dangerousExpressions = [
                'window.location = "http://evil.com"',
                'document.cookie',
                'process.exit(1)',
                'global.require("fs")',
                'window.alert("xss")',
                'navigator.userAgent',
                'location.href'
            ];

            dangerousExpressions.forEach(expr => {
                expect(() => evaluator.validateExpression(expr)).toThrow(/Security violation/);
            });
        });

        it('should block prototype manipulation', () => {
            const dangerousExpressions = [
                'constructor.constructor("alert(1)")()',
                'Object.prototype.toString',
                '__proto__.constructor',
                'prototype.valueOf'
            ];

            dangerousExpressions.forEach(expr => {
                expect(() => evaluator.validateExpression(expr)).toThrow(/Security violation/);
            });
        });

        it('should block assignment operations', () => {
            const dangerousExpressions = [
                'x = 1',
                'window.location = "evil.com"',
                'document.cookie = "stolen"',
                'a += 5'
            ];

            dangerousExpressions.forEach(expr => {
                expect(() => evaluator.validateExpression(expr)).toThrow(/Security violation/);
            });
        });

        it('should block increment/decrement operators', () => {
            const dangerousExpressions = [
                'x++',
                '++x',
                'x--',
                '--x',
                'counter++'
            ];

            dangerousExpressions.forEach(expr => {
                expect(() => evaluator.validateExpression(expr)).toThrow(/Security violation/);
            });
        });

        it('should block dangerous characters and syntax', () => {
            const dangerousExpressions = [
                'alert("xss"); console.log("hack")',
                'x = 1; y = 2',
                '{ malicious: "code" }',
                '<script>alert("xss")</script>',
                '</script><script>alert("xss")</script>'
            ];

            dangerousExpressions.forEach(expr => {
                expect(() => evaluator.validateExpression(expr)).toThrow(/Security violation/);
            });
        });

        it('should block unauthorized function calls', () => {
            const dangerousExpressions = [
                'setTimeout("alert(1)", 1000)',
                'setInterval("code", 100)',
                'require("fs")',
                'import("module")',
                'fetch("http://evil.com")',
                'XMLHttpRequest()',
                'customFunction()'
            ];

            dangerousExpressions.forEach(expr => {
                expect(() => evaluator.validateExpression(expr)).toThrow(/Security violation/);
            });
        });
    });

    describe('Safe Operations - Whitelist Validation', () => {
        it('should allow basic arithmetic operations', () => {
            const safeExpressions = [
                '1 + 2',
                '10 - 5',
                '3 * 4',
                '15 / 3',
                '10 % 3',
                '2 ^ 3'
            ];

            safeExpressions.forEach(expr => {
                expect(() => evaluator.validateExpression(expr)).not.toThrow();
            });
        });

        it('should allow comparison operations', () => {
            const safeExpressions = [
                '5 > 3',
                '2 < 10',
                '5 >= 5',
                '3 <= 7',
                '5 == 5',
                '3 != 4'
            ];

            safeExpressions.forEach(expr => {
                expect(() => evaluator.validateExpression(expr)).not.toThrow();
            });
        });

        it('should allow boolean logic operations', () => {
            const safeExpressions = [
                'true && false',
                'true || false',
                '!true',
                '(5 > 3) && (2 < 10)',
                '(1 == 1) || (2 == 3)'
            ];

            safeExpressions.forEach(expr => {
                expect(() => evaluator.validateExpression(expr)).not.toThrow();
            });
        });

        it('should allow grouping with parentheses', () => {
            const safeExpressions = [
                '(1 + 2) * 3',
                '((5 - 2) * 2) + 1',
                '(true && false) || true'
            ];

            safeExpressions.forEach(expr => {
                expect(() => evaluator.validateExpression(expr)).not.toThrow();
            });
        });

        it('should allow whitelisted Math functions', () => {
            const safeExpressions = [
                'min(5, 10)',
                'max(3, 7)',
                'floor(3.7)',
                'ceil(2.1)',
                'round(4.6)',
                'abs(-5)'
            ];

            safeExpressions.forEach(expr => {
                expect(() => evaluator.validateExpression(expr)).not.toThrow();
            });
        });
    });

    describe('Expression Evaluation', () => {
        it('should correctly evaluate arithmetic expressions', () => {
            expect(evaluator.evaluateExpression('1 + 2')).toBe(3);
            expect(evaluator.evaluateExpression('10 - 5')).toBe(5);
            expect(evaluator.evaluateExpression('3 * 4')).toBe(12);
            expect(evaluator.evaluateExpression('15 / 3')).toBe(5);
            expect(evaluator.evaluateExpression('10 % 3')).toBe(1);
        });

        it('should correctly evaluate boolean conditions', () => {
            expect(evaluator.evaluateCondition('5 > 3')).toBe(true);
            expect(evaluator.evaluateCondition('2 > 10')).toBe(false);
            expect(evaluator.evaluateCondition('5 == 5')).toBe(true);
            expect(evaluator.evaluateCondition('3 != 4')).toBe(true);
        });

        it('should correctly evaluate Math functions', () => {
            expect(evaluator.evaluateExpression('min(5, 10)')).toBe(5);
            expect(evaluator.evaluateExpression('max(3, 7)')).toBe(7);
            expect(evaluator.evaluateExpression('floor(3.7)')).toBe(3);
            expect(evaluator.evaluateExpression('ceil(2.1)')).toBe(3);
            expect(evaluator.evaluateExpression('round(4.6)')).toBe(5);
            expect(evaluator.evaluateExpression('abs(-5)')).toBe(5);
        });

        it('should handle context variables safely', () => {
            const context = { x: 10, y: 5, flag: true };
            
            expect(evaluator.evaluateExpression('x + y', context)).toBe(15);
            expect(evaluator.evaluateCondition('x > y', context)).toBe(true);
            expect(evaluator.evaluateCondition('flag', context)).toBe(true);
        });

        it('should sanitize dangerous context values', () => {
            const dangerousContext = {
                x: 5,
                constructor: () => 'dangerous',
                prototype: { evil: true },
                __proto__: { hack: true },
                eval: () => 'evil',
                process: { exit: () => {} }
            };
            
            // Should only use safe values (x: 5) and ignore dangerous ones
            expect(evaluator.evaluateExpression('x + 10', dangerousContext)).toBe(15);
        });
    });

    describe('Error Handling', () => {
        it('should return false for invalid boolean conditions', () => {
            expect(evaluator.evaluateCondition('invalid_variable')).toBe(false);
            expect(evaluator.evaluateCondition('undefined_function()')).toBe(false);
        });

        it('should throw errors for invalid numeric expressions', () => {
            expect(() => evaluator.evaluateExpression('invalid_variable')).toThrow();
            expect(() => evaluator.evaluateExpression('undefined_function()')).toThrow();
        });
    });

    describe('Security Monitoring', () => {
        it('should track security violations', () => {
            try {
                evaluator.validateExpression('eval("malicious")');
            } catch (e) {
                // Expected to throw
            }
            
            const stats = evaluator.getSecurityStats();
            expect(stats.securityViolations).toBeGreaterThan(0);
            expect(stats.recentViolations).toHaveLength(1);
        });

        it('should track evaluation count', () => {
            const initialStats = evaluator.getSecurityStats();
            const initialCount = initialStats.totalEvaluations;
            
            evaluator.evaluateExpression('1 + 1');
            evaluator.evaluateCondition('true');
            
            const finalStats = evaluator.getSecurityStats();
            expect(finalStats.totalEvaluations).toBe(initialCount + 2);
        });
    });

    describe('Singleton and Convenience Functions', () => {
        it('should provide working singleton instance', () => {
            expect(safeEvaluator).toBeInstanceOf(SafeEvaluator);
            expect(safeEvaluator.evaluateExpression('2 + 3')).toBe(5);
        });

        it('should provide working convenience functions', () => {
            expect(evaluateExpression('3 * 4')).toBe(12);
            expect(evaluateCondition('5 > 2')).toBe(true);
            expect(() => validateExpression('1 + 1')).not.toThrow();
            expect(() => validateExpression('eval("bad")')).toThrow();
        });
    });
});
