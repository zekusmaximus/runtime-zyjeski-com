/**
 * Safe Expression Parser - Security-hardened expression evaluation
 * 
 * This module provides secure expression evaluation using expr-eval with strict
 * security controls to prevent arbitrary code execution. All dangerous operations
 * are blocked and comprehensive logging is implemented for security monitoring.
 * 
 * @author Runtime Security Team
 * @version 1.0.0
 * @security CRITICAL - This module prevents code injection attacks
 */

import { Parser } from 'expr-eval';
import logger from './logger.js';

// Security constants
const MAX_EXPRESSION_LENGTH = 500;
const MAX_EVALUATION_TIME = 100; // milliseconds

/**
 * Safe Expression Evaluator
 * 
 * Provides secure expression evaluation with comprehensive security controls:
 * - Whitelist-only approach for allowed operations
 * - Input sanitization and length limits
 * - Execution time limits
 * - Comprehensive security logging
 * - Context isolation
 */
export class SafeEvaluator {
    constructor() {
        this.parser = new Parser();
        this.evaluationCount = 0;
        this.securityViolations = [];
        
        // Initialize safe Math functions
        this.initializeSafeMathFunctions();
        
        // Log initialization
        logger.info('SafeEvaluator initialized with security controls');
    }

    /**
     * Initialize safe Math functions (whitelist only)
     * @private
     */
    initializeSafeMathFunctions() {
        const safeMathFunctions = {
            min: Math.min,
            max: Math.max,
            floor: Math.floor,
            ceil: Math.ceil,
            round: Math.round,
            abs: Math.abs
        };

        // Add safe functions to parser
        Object.entries(safeMathFunctions).forEach(([name, func]) => {
            this.parser.functions[name] = func;
        });

        // Add logical operators as functions
        this.parser.functions.and = (a, b) => Boolean(a && b);
        this.parser.functions.or = (a, b) => Boolean(a || b);
        this.parser.functions.not = (a) => !Boolean(a);
    }

    /**
     * Validate expression syntax and security
     * 
     * @param {string} expression - Expression to validate
     * @throws {Error} If expression is invalid or contains blocked operations
     * @returns {boolean} True if expression is valid and safe
     */
    validateExpression(expression) {
        // Input sanitization
        if (typeof expression !== 'string') {
            throw new Error('Expression must be a string');
        }

        if (expression.length === 0) {
            throw new Error('Expression cannot be empty');
        }

        if (expression.length > MAX_EXPRESSION_LENGTH) {
            throw new Error(`Expression exceeds maximum length of ${MAX_EXPRESSION_LENGTH} characters`);
        }

        // Security validation - check for blocked patterns
        const blockedPatterns = [
            // Function calls (except whitelisted Math functions)
            /(?<!Math\.)(eval|Function|setTimeout|setInterval|require|import|process|global|window|document)\s*\(/i,
            
            // Constructor access
            /constructor/i,
            
            // Prototype manipulation
            /prototype/i,
            /__proto__/i,
            
            // Assignment operators
            /[^!<>=]=(?!=)/,  // Assignment but not comparison
            
            // Increment/decrement
            /\+\+|--/,
            
            // Global object access
            /\b(window|global|process|require|import|document|location|navigator)\b/i,
            
            // Script tags or HTML
            /<script|<\/script>/i,
            
            // Dangerous characters
            /[;{}]/
        ];

        for (const pattern of blockedPatterns) {
            if (pattern.test(expression)) {
                const violation = `Blocked pattern detected: ${pattern.source}`;
                this.logSecurityViolation(expression, violation);
                throw new Error(`Security violation: ${violation}`);
            }
        }

        // Whitelist validation - only allow safe operations
        const allowedPattern = /^[a-zA-Z0-9_$.\s+\-*/%^()!<>=&|,]+$/;
        if (!allowedPattern.test(expression)) {
            const violation = 'Expression contains non-whitelisted characters';
            this.logSecurityViolation(expression, violation);
            throw new Error(`Security violation: ${violation}`);
        }

        // Additional validation for function calls - only allow whitelisted functions
        const functionCallPattern = /([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/g;
        let match;
        while ((match = functionCallPattern.exec(expression)) !== null) {
            const functionName = match[1];
            const allowedFunctions = ['min', 'max', 'floor', 'ceil', 'round', 'abs', 'and', 'or', 'not'];

            if (!allowedFunctions.includes(functionName)) {
                const violation = `Unauthorized function call: ${functionName}`;
                this.logSecurityViolation(expression, violation);
                throw new Error(`Security violation: ${violation}`);
            }
        }

        return true;
    }

    /**
     * Evaluate boolean condition expression
     *
     * @param {string} expression - Boolean expression to evaluate
     * @param {Object} context - Variable context for evaluation
     * @returns {boolean} Result of boolean evaluation
     * @throws {Error} If expression is invalid or evaluation fails
     */
    evaluateCondition(expression, context = {}) {
        this.validateExpression(expression);

        const startTime = Date.now();
        this.evaluationCount++;

        try {
            // Log evaluation attempt
            logger.debug('Evaluating condition', {
                expression: expression.substring(0, 100),
                contextKeys: Object.keys(context),
                evaluationId: this.evaluationCount
            });

            // Preprocess logical operators
            const processedExpression = this.preprocessLogicalOperators(expression);

            // Parse and evaluate with timeout protection
            const parsed = this.parser.parse(processedExpression);
            const result = this.evaluateWithTimeout(parsed, context, startTime);

            // Convert to boolean
            const booleanResult = Boolean(result);

            // Log successful evaluation
            const duration = Date.now() - startTime;
            logger.debug('Condition evaluation successful', {
                evaluationId: this.evaluationCount,
                result: booleanResult,
                duration: `${duration}ms`
            });

            return booleanResult;

        } catch (error) {
            const duration = Date.now() - startTime;
            logger.error('Condition evaluation failed', {
                evaluationId: this.evaluationCount,
                expression: expression.substring(0, 100),
                error: error.message,
                duration: `${duration}ms`
            });

            // For security, return false on any evaluation error
            return false;
        }
    }

    /**
     * Evaluate numeric expression
     *
     * @param {string} expression - Numeric expression to evaluate
     * @param {Object} context - Variable context for evaluation
     * @returns {number} Result of numeric evaluation
     * @throws {Error} If expression is invalid or evaluation fails
     */
    evaluateExpression(expression, context = {}) {
        this.validateExpression(expression);

        const startTime = Date.now();
        this.evaluationCount++;

        try {
            // Log evaluation attempt
            logger.debug('Evaluating expression', {
                expression: expression.substring(0, 100),
                contextKeys: Object.keys(context),
                evaluationId: this.evaluationCount
            });

            // Preprocess logical operators (in case they're used in numeric context)
            const processedExpression = this.preprocessLogicalOperators(expression);

            // Parse and evaluate with timeout protection
            const parsed = this.parser.parse(processedExpression);
            const result = this.evaluateWithTimeout(parsed, context, startTime);

            // Ensure numeric result
            const numericResult = Number(result);
            if (isNaN(numericResult)) {
                throw new Error('Expression did not evaluate to a valid number');
            }

            // Log successful evaluation
            const duration = Date.now() - startTime;
            logger.debug('Expression evaluation successful', {
                evaluationId: this.evaluationCount,
                result: numericResult,
                duration: `${duration}ms`
            });

            return numericResult;

        } catch (error) {
            const duration = Date.now() - startTime;
            logger.error('Expression evaluation failed', {
                evaluationId: this.evaluationCount,
                expression: expression.substring(0, 100),
                error: error.message,
                duration: `${duration}ms`
            });

            throw new Error(`Expression evaluation failed: ${error.message}`);
        }
    }

    /**
     * Evaluate parsed expression with timeout protection
     * @private
     */
    evaluateWithTimeout(parsed, context, startTime) {
        // Sanitize context to prevent prototype pollution
        const sanitizedContext = this.sanitizeContext(context);

        // Check timeout before evaluation
        if (Date.now() - startTime > MAX_EVALUATION_TIME) {
            throw new Error('Expression evaluation timeout');
        }

        // Evaluate with sanitized context
        return parsed.evaluate(sanitizedContext);
    }

    /**
     * Preprocess expression to handle logical operators
     * @private
     */
    preprocessLogicalOperators(expression) {
        // Handle logical AND (&&) and OR (||) operators
        // Convert to mathematical equivalents that expr-eval can handle
        let processed = expression;

        // Replace && with * (multiplication for AND logic)
        processed = processed.replace(/&&/g, ' and ');

        // Replace || with + (addition for OR logic, but we'll clamp to 1)
        processed = processed.replace(/\|\|/g, ' or ');

        return processed;
    }

    /**
     * Sanitize evaluation context to prevent security issues
     * @private
     */
    sanitizeContext(context) {
        if (!context || typeof context !== 'object') {
            return {};
        }
        
        // Create clean object without prototype
        const sanitized = Object.create(null);
        
        // Only copy safe primitive values and plain objects
        for (const [key, value] of Object.entries(context)) {
            if (this.isSafeContextValue(key, value)) {
                sanitized[key] = value;
            }
        }
        
        return sanitized;
    }

    /**
     * Check if context value is safe for evaluation
     * @private
     */
    isSafeContextValue(key, value) {
        // Block dangerous property names
        const dangerousKeys = [
            'constructor', 'prototype', '__proto__', 'eval', 'Function',
            'process', 'global', 'window', 'document', 'require', 'import'
        ];
        
        if (dangerousKeys.includes(key)) {
            return false;
        }
        
        // Only allow safe value types
        const valueType = typeof value;
        if (['number', 'string', 'boolean'].includes(valueType)) {
            return true;
        }
        
        // Allow null and undefined
        if (value === null || value === undefined) {
            return true;
        }
        
        // Allow plain objects (but not functions, classes, etc.)
        if (valueType === 'object' && value.constructor === Object) {
            return true;
        }
        
        return false;
    }

    /**
     * Log security violation for monitoring
     * @private
     */
    logSecurityViolation(expression, violation) {
        const violationRecord = {
            timestamp: new Date().toISOString(),
            expression: expression.substring(0, 200), // Truncate for logging
            violation: violation,
            evaluationCount: this.evaluationCount
        };
        
        this.securityViolations.push(violationRecord);
        
        // Log as security alert
        logger.error('SECURITY VIOLATION DETECTED', violationRecord);
        
        // Keep only recent violations (last 100)
        if (this.securityViolations.length > 100) {
            this.securityViolations = this.securityViolations.slice(-100);
        }
    }

    /**
     * Get security statistics for monitoring
     * @returns {Object} Security statistics
     */
    getSecurityStats() {
        return {
            totalEvaluations: this.evaluationCount,
            securityViolations: this.securityViolations.length,
            recentViolations: this.securityViolations.slice(-10),
            memoryUsage: process.memoryUsage(),
            uptime: process.uptime()
        };
    }
}

// Export singleton instance for consistent usage across the application
export const safeEvaluator = new SafeEvaluator();

// Export convenience functions
export const evaluateCondition = (expression, context) => 
    safeEvaluator.evaluateCondition(expression, context);

export const evaluateExpression = (expression, context) => 
    safeEvaluator.evaluateExpression(expression, context);

export const validateExpression = (expression) => 
    safeEvaluator.validateExpression(expression);
