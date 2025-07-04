/**
 * Safe Expression Evaluator Migration Example
 * 
 * This example demonstrates how to migrate from dangerous eval() and new Function()
 * calls to the secure SafeEvaluator implementation.
 */

import { evaluateCondition, evaluateExpression, validateExpression } from '../lib/safe-evaluator.js';

console.log('=== Safe Expression Evaluator Migration Example ===\n');

// ❌ BEFORE: Dangerous eval() usage
function dangerousEvaluation(expression, context) {
    // NEVER DO THIS - Security vulnerability!
    // return eval(`with(context) { ${expression} }`);
    console.log('❌ DANGEROUS: eval() usage has been eliminated');
}

// ❌ BEFORE: Dangerous new Function() usage  
function dangerousFunctionCreation(expression, context) {
    // NEVER DO THIS - Security vulnerability!
    // const func = new Function('context', `with(context) { return ${expression} }`);
    // return func(context);
    console.log('❌ DANGEROUS: new Function() usage has been eliminated');
}

// ✅ AFTER: Safe evaluation using SafeEvaluator
function safeEvaluation(expression, context) {
    try {
        // First validate the expression
        validateExpression(expression);
        
        // Then evaluate safely
        return evaluateExpression(expression, context);
    } catch (error) {
        console.error('Safe evaluation failed:', error.message);
        return null;
    }
}

// ✅ AFTER: Safe condition evaluation
function safeConditionEvaluation(condition, context) {
    try {
        // Validate and evaluate condition
        validateExpression(condition);
        return evaluateCondition(condition, context);
    } catch (error) {
        console.error('Safe condition evaluation failed:', error.message);
        return false;
    }
}

// Example usage demonstrations
console.log('1. Basic Arithmetic Operations:');
console.log('   2 + 3 =', safeEvaluation('2 + 3'));
console.log('   10 * 5 =', safeEvaluation('10 * 5'));
console.log('   15 / 3 =', safeEvaluation('15 / 3'));

console.log('\n2. Boolean Conditions:');
console.log('   5 > 3 =', safeConditionEvaluation('5 > 3'));
console.log('   10 <= 5 =', safeConditionEvaluation('10 <= 5'));
console.log('   (2 + 3) == 5 =', safeConditionEvaluation('(2 + 3) == 5'));
console.log('   Logical AND =', safeConditionEvaluation('5 > 3 and 10 > 7'));
console.log('   Logical OR =', safeConditionEvaluation('5 < 3 or 10 > 7'));

console.log('\n3. Math Functions:');
console.log('   min(10, 5) =', safeEvaluation('min(10, 5)'));
console.log('   max(3, 7) =', safeEvaluation('max(3, 7)'));
console.log('   abs(-15) =', safeEvaluation('abs(-15)'));
console.log('   floor(3.7) =', safeEvaluation('floor(3.7)'));

console.log('\n4. Context Variables:');
const gameContext = {
    playerLevel: 5,
    enemyLevel: 3,
    playerHealth: 80,
    maxHealth: 100
};

console.log('   playerLevel > enemyLevel =', 
    safeConditionEvaluation('playerLevel > enemyLevel', gameContext));
console.log('   playerHealth / maxHealth =', 
    safeEvaluation('playerHealth / maxHealth', gameContext));
console.log('   playerLevel * 10 + 50 =', 
    safeEvaluation('playerLevel * 10 + 50', gameContext));

console.log('\n5. Security Blocking Examples:');

// These will all be blocked and logged as security violations
const dangerousExpressions = [
    'eval("alert(1)")',
    'new Function("return 1")()',
    'window.location = "evil.com"',
    'document.cookie',
    'process.exit(1)',
    'constructor.constructor("alert(1)")()',
    'x = maliciousValue',
    'setTimeout("code", 1000)'
];

dangerousExpressions.forEach((expr, index) => {
    try {
        validateExpression(expr);
        console.log(`   ${index + 1}. SECURITY FAILURE: ${expr} was allowed!`);
    } catch (error) {
        console.log(`   ${index + 1}. ✅ BLOCKED: ${expr.substring(0, 30)}...`);
    }
});

console.log('\n6. Migration Patterns for Common Use Cases:');

// Pattern 1: Story condition evaluation
function evaluateStoryCondition(condition, gameState) {
    // OLD: eval(`with(gameState) { return ${condition} }`)
    // NEW: Safe evaluation with context
    return safeConditionEvaluation(condition, gameState);
}

// Pattern 2: Dynamic calculation
function calculateDynamicValue(formula, variables) {
    // OLD: new Function('vars', `with(vars) { return ${formula} }`)(variables)
    // NEW: Safe evaluation with validation
    return safeEvaluation(formula, variables);
}

// Pattern 3: User input validation
function validateUserExpression(userInput) {
    try {
        // Always validate user input first
        validateExpression(userInput);
        return { valid: true, message: 'Expression is safe' };
    } catch (error) {
        return { valid: false, message: error.message };
    }
}

// Example story condition
const storyState = {
    questsCompleted: 3,
    playerGold: 150,
    hasSpecialItem: true
};

console.log('\nStory Condition Examples:');
console.log('   Quest completion check:', 
    evaluateStoryCondition('questsCompleted >= 3', storyState));
console.log('   Wealth check:', 
    evaluateStoryCondition('playerGold > 100', storyState));
console.log('   Complex condition:',
    evaluateStoryCondition('questsCompleted >= 2 and playerGold > 50', storyState));

// Example dynamic calculation
const characterStats = {
    baseAttack: 10,
    level: 5,
    weaponBonus: 15
};

console.log('\nDynamic Calculation Examples:');
console.log('   Total attack power:', 
    calculateDynamicValue('baseAttack + (level * 2) + weaponBonus', characterStats));
console.log('   Level-based health:', 
    calculateDynamicValue('100 + (level * 20)', characterStats));

// Example user input validation
console.log('\nUser Input Validation Examples:');
console.log('   Valid input "2 + 3":', validateUserExpression('2 + 3'));
console.log('   Invalid input "eval(code)":', validateUserExpression('eval("malicious")'));

console.log('\n=== Migration Complete - All expressions are now secure! ===');

/**
 * Key Migration Benefits:
 *
 * 1. SECURITY: Eliminated all code injection vulnerabilities
 * 2. PERFORMANCE: Pre-compiled expressions with caching
 * 3. MONITORING: Comprehensive security violation logging
 * 4. RELIABILITY: Consistent error handling and validation
 * 5. MAINTAINABILITY: Centralized expression evaluation logic
 *
 * Migration Checklist:
 * ✅ Replace all eval() calls with evaluateExpression() or evaluateCondition()
 * ✅ Replace all new Function() calls with safe alternatives
 * ✅ Add input validation using validateExpression()
 * ✅ Update logical operators: && → and, || → or, ! → not()
 * ✅ Update error handling to use try/catch blocks
 * ✅ Test all expression evaluation paths
 * ✅ Monitor security violation logs
 * ✅ Update Content Security Policy to remove 'unsafe-eval'
 */
