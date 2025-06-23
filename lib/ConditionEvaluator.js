// ConditionEvaluator.js - Evaluates complex conditions for narrative triggers

class ConditionEvaluator {
    constructor(consciousnessInstance) {
        this.consciousness = consciousnessInstance;
        this.variables = new Map();
        this.functions = new Map();
        this.operators = new Map();
        this.history = [];
        this.cachedEvaluations = new Map();
        this.evaluationContext = {};
        
        this.initializeBuiltInFunctions();
        this.initializeOperators();
    }

    // Initialize built-in evaluation functions
    initializeBuiltInFunctions() {
        // System state functions
        this.functions.set('getMemoryUsage', () => {
            const usage = this.consciousness.processManager.getSystemResourceUsage();
            return usage.totalMemoryUsage;
        });

        this.functions.set('getCpuUsage', () => {
            const usage = this.consciousness.processManager.getSystemResourceUsage();
            return usage.totalCpuUsage;
        });

        this.functions.set('getEmotionalIntensity', (emotion) => {
            const state = this.consciousness.emotionalProcessor.getCurrentState();
            return state.primary[emotion] || 0;
        });

        this.functions.set('getStressLevel', () => {
            return this.consciousness.emotionalProcessor.getStressLevel();
        });

        this.functions.set('getDominantEmotion', () => {
            const state = this.consciousness.emotionalProcessor.getCurrentState();
            return state.dominant;
        });

        this.functions.set('getProcessCount', (type) => {
            const processes = this.consciousness.processManager.getProcessDataForFrontend();
            if (type) {
                return processes.processes.filter(p => p.type === type).length;
            }
            return processes.processes.length;
        });

        this.functions.set('getMemoryCapacity', () => {
            const memoryStatus = this.consciousness.memoryManager.getMemoryStatus();
            return memoryStatus.capacity.available / memoryStatus.capacity.total;
        });

        this.functions.set('hasMemoryType', (memoryType) => {
            const memoryStatus = this.consciousness.memoryManager.getMemoryStatus();
            return memoryStatus.pools[memoryType] > 0;
        });

        this.functions.set('getDebugIssueCount', () => {
            const processIssues = this.consciousness.processManager.getDebuggableProcesses().length;
            const memoryIssues = this.consciousness.memoryManager.getDebuggableMemoryIssues();
            const emotionalIssues = this.consciousness.emotionalProcessor.getDebuggableEmotionalIssues().length;
            return processIssues + memoryIssues.corruptedMemories.length + emotionalIssues;
        });

        // Time-based functions
        this.functions.set('timeSince', (eventType) => {
            const event = this.getLastEvent(eventType);
            return event ? Date.now() - event.timestamp : Infinity;
        });

        this.functions.set('eventCount', (eventType, timeWindow = Infinity) => {
            const cutoffTime = Date.now() - timeWindow;
            return this.consciousness.systemLog.filter(log => 
                log.category === eventType && log.timestamp > cutoffTime
            ).length;
        });

        // Narrative state functions
        this.functions.set('getFragmentVariable', (variableName) => {
            return this.variables.get(variableName) || 0;
        });

        this.functions.set('hasTriggered', (fragmentId) => {
            return this.consciousness.narrativeEngine.hasFragmentTriggered(fragmentId);
        });

        this.functions.set('getPlayerProgress', () => {
            return this.consciousness.narrativeEngine.getPlayerProgress();
        });

        // Complex evaluation functions
        this.functions.set('emotionalStability', () => {
            const state = this.consciousness.emotionalProcessor.getCurrentState();
            return state.coherence * state.regulation;
        });

        this.functions.set('systemHealth', () => {
            const memoryHealth = this.consciousness.memoryManager.getMemoryStatus().capacity.available / 
                                 this.consciousness.memoryManager.getMemoryStatus().capacity.total;
            const processHealth = 1 - (this.getDebugIssueCount() / 10); // Normalize by max expected issues
            const emotionalHealth = this.consciousness.emotionalProcessor.getCurrentState().coherence;
            
            return (memoryHealth + processHealth + emotionalHealth) / 3;
        });

        this.functions.set('isProcessStuck', (processType) => {
            const processes = this.consciousness.processManager.getDebuggableProcesses();
            return processes.some(p => 
                p.type === processType && 
                p.issues.some(issue => issue.type === 'recursive_loop' || issue.type === 'processing_stall')
            );
        });

        this.functions.set('hasMemoryLeak', () => {
            const memoryIssues = this.consciousness.memoryManager.getDebuggableMemoryIssues();
            return memoryIssues.leakedMemories.length > 0;
        });

        // Player action tracking
        this.functions.set('playerActionCount', (actionType, timeWindow = 300000) => {
            const cutoffTime = Date.now() - timeWindow;
            return this.consciousness.systemLog.filter(log => 
                log.category === 'player_intervention' && 
                log.timestamp > cutoffTime &&
                (actionType ? log.message.includes(actionType) : true)
            ).length;
        });

        this.functions.set('playerSuccessRate', (timeWindow = 600000) => {
            const cutoffTime = Date.now() - timeWindow;
            const interventions = this.consciousness.systemLog.filter(log => 
                log.category === 'player_intervention' && 
                log.timestamp > cutoffTime
            );
            
            if (interventions.length === 0) return 0;
            
            const successful = interventions.filter(log => 
                log.message.includes('successful')
            ).length;
            
            return successful / interventions.length;
        });

        // Random and utility functions
        this.functions.set('random', () => Math.random());
        
        this.functions.set('randomInt', (min, max) => 
            Math.floor(Math.random() * (max - min + 1)) + min
        );

        this.functions.set('clamp', (value, min, max) => 
            Math.max(min, Math.min(max, value))
        );

        this.functions.set('lerp', (a, b, t) => a + (b - a) * t);
    }

    // Initialize logical and comparison operators
    initializeOperators() {
        this.operators.set('>', (a, b) => a > b);
        this.operators.set('<', (a, b) => a < b);
        this.operators.set('>=', (a, b) => a >= b);
        this.operators.set('<=', (a, b) => a <= b);
        this.operators.set('==', (a, b) => a == b);
        this.operators.set('===', (a, b) => a === b);
        this.operators.set('!=', (a, b) => a != b);
        this.operators.set('!==', (a, b) => a !== b);
        this.operators.set('&&', (a, b) => a && b);
        this.operators.set('||', (a, b) => a || b);
        this.operators.set('!', (a) => !a);
        this.operators.set('+', (a, b) => a + b);
        this.operators.set('-', (a, b) => a - b);
        this.operators.set('*', (a, b) => a * b);
        this.operators.set('/', (a, b) => a / b);
        this.operators.set('%', (a, b) => a % b);
        this.operators.set('**', (a, b) => a ** b);
    }

    // Main condition evaluation method
    evaluateCondition(condition, context = {}) {
        try {
            // Update evaluation context
            this.evaluationContext = { ...context, timestamp: Date.now() };
            
            // Check cache for recent evaluations
            const cacheKey = this.generateCacheKey(condition, context);
            const cached = this.cachedEvaluations.get(cacheKey);
            if (cached && Date.now() - cached.timestamp < 1000) {
                return cached.result;
            }

            // Parse and evaluate condition
            const result = this.parseAndEvaluate(condition);
            
            // Cache result
            this.cachedEvaluations.set(cacheKey, {
                result: result,
                timestamp: Date.now()
            });

            // Log evaluation for debugging
            this.history.push({
                condition: condition,
                context: context,
                result: result,
                timestamp: Date.now()
            });

            // Cleanup old cache entries
            this.cleanupCache();

            return result;
        } catch (error) {
            this.consciousness.systemLog.push({
                timestamp: Date.now(),
                level: 'error',
                message: `Condition evaluation error: ${error.message}`,
                category: 'condition_evaluation',
                condition: condition
            });
            return false;
        }
    }

    // Parse and evaluate condition string
    parseAndEvaluate(condition) {
        if (typeof condition === 'boolean') return condition;
        if (typeof condition === 'number') return condition !== 0;
        if (typeof condition !== 'string') return false;

        // Handle complex condition types
        if (condition.startsWith('{') && condition.endsWith('}')) {
            return this.evaluateObjectCondition(JSON.parse(condition));
        }

        // Handle array conditions (AND/OR logic)
        if (condition.startsWith('[') && condition.endsWith(']')) {
            return this.evaluateArrayCondition(JSON.parse(condition));
        }

        // Handle simple expression evaluation
        return this.evaluateExpression(condition);
    }

    // Evaluate object-based conditions
    evaluateObjectCondition(conditionObj) {
        const { type, conditions, operator = 'AND' } = conditionObj;

        switch (type) {
            case 'compound':
                return this.evaluateCompoundCondition(conditions, operator);
            
            case 'threshold':
                return this.evaluateThresholdCondition(conditionObj);
            
            case 'sequence':
                return this.evaluateSequenceCondition(conditionObj);
            
            case 'temporal':
                return this.evaluateTemporalCondition(conditionObj);
            
            case 'state_change':
                return this.evaluateStateChangeCondition(conditionObj);
            
            case 'pattern':
                return this.evaluatePatternCondition(conditionObj);
            
            default:
                return false;
        }
    }

    // Evaluate compound conditions with AND/OR logic
    evaluateCompoundCondition(conditions, operator) {
        if (!Array.isArray(conditions) || conditions.length === 0) return false;

        if (operator === 'AND') {
            return conditions.every(condition => this.parseAndEvaluate(condition));
        } else if (operator === 'OR') {
            return conditions.some(condition => this.parseAndEvaluate(condition));
        } else if (operator === 'XOR') {
            const trueCount = conditions.filter(condition => 
                this.parseAndEvaluate(condition)
            ).length;
            return trueCount === 1;
        }

        return false;
    }

    // Evaluate threshold-based conditions
    evaluateThresholdCondition(conditionObj) {
        const { variable, threshold, operator = '>', duration = 0 } = conditionObj;
        
        const currentValue = this.getVariableValue(variable);
        const comparison = this.operators.get(operator);
        
        if (!comparison) return false;
        
        const conditionMet = comparison(currentValue, threshold);
        
        // Handle duration requirements
        if (duration > 0 && conditionMet) {
            return this.checkConditionDuration(conditionObj, duration);
        }
        
        return conditionMet;
    }

    // Check if condition has been true for required duration
    checkConditionDuration(conditionObj, duration) {
        const conditionKey = JSON.stringify(conditionObj);
        const now = Date.now();
        
        // Check recent history for continuous satisfaction
        const recentEvaluations = this.history
            .filter(h => h.timestamp > now - duration)
            .filter(h => JSON.stringify(h.condition) === conditionKey);
        
        if (recentEvaluations.length === 0) return false;
        
        // Check if condition has been continuously true
        const firstTrueTime = recentEvaluations.find(h => h.result)?.timestamp;
        return firstTrueTime && (now - firstTrueTime) >= duration;
    }

    // Evaluate sequence conditions (ordered events)
    evaluateSequenceCondition(conditionObj) {
        const { sequence, timeWindow = 60000, allowGaps = true } = conditionObj;
        
        if (!Array.isArray(sequence) || sequence.length === 0) return false;
        
        const cutoffTime = Date.now() - timeWindow;
        const relevantHistory = this.history.filter(h => h.timestamp > cutoffTime);
        
        let sequenceIndex = 0;
        let lastMatchTime = cutoffTime;
        
        for (const historyItem of relevantHistory) {
            if (sequenceIndex >= sequence.length) break;
            
            const expectedCondition = sequence[sequenceIndex];
            if (this.conditionsMatch(historyItem.condition, expectedCondition) && 
                historyItem.result) {
                
                if (!allowGaps && historyItem.timestamp - lastMatchTime > 5000) {
                    return false; // Gap too large
                }
                
                sequenceIndex++;
                lastMatchTime = historyItem.timestamp;
            }
        }
        
        return sequenceIndex === sequence.length;
    }

    // Evaluate temporal conditions (time-based)
    evaluateTemporalCondition(conditionObj) {
        const { 
            eventType, 
            timeWindow = 60000, 
            minOccurrences = 1, 
            maxOccurrences = Infinity,
            pattern = 'any'
        } = conditionObj;
        
        const cutoffTime = Date.now() - timeWindow;
        const events = this.getEventsInWindow(eventType, cutoffTime);
        
        const occurrenceCount = events.length;
        
        // Check occurrence constraints
        if (occurrenceCount < minOccurrences || occurrenceCount > maxOccurrences) {
            return false;
        }
        
        // Check temporal patterns
        switch (pattern) {
            case 'increasing':
                return this.checkIncreasingPattern(events);
            case 'decreasing':
                return this.checkDecreasingPattern(events);
            case 'periodic':
                return this.checkPeriodicPattern(events, conditionObj.period || 10000);
            case 'burst':
                return this.checkBurstPattern(events, conditionObj.burstWindow || 5000);
            default:
                return true; // 'any' pattern
        }
    }

    // Evaluate state change conditions
    evaluateStateChangeCondition(conditionObj) {
        const { 
            variable, 
            changeType = 'any', 
            threshold = 0.1, 
            timeWindow = 30000 
        } = conditionObj;
        
        const cutoffTime = Date.now() - timeWindow;
        const currentValue = this.getVariableValue(variable);
        
        // Find the earliest value in the time window
        const historicalValue = this.getHistoricalVariableValue(variable, cutoffTime);
        
        if (historicalValue === null) return false;
        
        const change = currentValue - historicalValue;
        const relativeChange = Math.abs(change) / (Math.abs(historicalValue) + 0.001);
        
        switch (changeType) {
            case 'increase':
                return change > threshold;
            case 'decrease':
                return change < -threshold;
            case 'significant':
                return relativeChange > threshold;
            case 'stable':
                return relativeChange < threshold;
            default:
                return relativeChange > threshold;
        }
    }

    // Evaluate pattern conditions (complex behavioral patterns)
    evaluatePatternCondition(conditionObj) {
        const { 
            patternType, 
            variables = [], 
            timeWindow = 60000,
            parameters = {}
        } = conditionObj;
        
        switch (patternType) {
            case 'oscillation':
                return this.detectOscillationPattern(variables[0], timeWindow, parameters);
            case 'correlation':
                return this.detectCorrelationPattern(variables, timeWindow, parameters);
            case 'trend':
                return this.detectTrendPattern(variables[0], timeWindow, parameters);
            case 'anomaly':
                return this.detectAnomalyPattern(variables[0], timeWindow, parameters);
            default:
                return false;
        }
    }

    // Detect oscillation patterns in variable values
    detectOscillationPattern(variable, timeWindow, parameters) {
        const { minPeaks = 2, minAmplitude = 0.1 } = parameters;
        const values = this.getVariableHistory(variable, timeWindow);
        
        if (values.length < 10) return false;
        
        const peaks = this.findPeaks(values);
        const valleys = this.findValleys(values);
        
        const totalPeaks = peaks.length + valleys.length;
        const amplitude = this.calculateAmplitude(values);
        
        return totalPeaks >= minPeaks && amplitude >= minAmplitude;
    }

    // Detect correlation between variables
    detectCorrelationPattern(variables, timeWindow, parameters) {
        const { minCorrelation = 0.7 } = parameters;
        
        if (variables.length < 2) return false;
        
        const values1 = this.getVariableHistory(variables[0], timeWindow);
        const values2 = this.getVariableHistory(variables[1], timeWindow);
        
        const correlation = this.calculateCorrelation(values1, values2);
        return Math.abs(correlation) >= minCorrelation;
    }

    // Evaluate simple expression strings
    evaluateExpression(expression) {
        // Replace function calls with their values
        expression = this.replaceFunctionCalls(expression);
        
        // Replace variable references with their values
        expression = this.replaceVariableReferences(expression);
        
        // Safely evaluate the expression
        return this.safeEvaluate(expression);
    }

    // Replace function calls in expression
    replaceFunctionCalls(expression) {
        const functionRegex = /(\w+)\((.*?)\)/g;
        
        return expression.replace(functionRegex, (match, functionName, argsString) => {
            const func = this.functions.get(functionName);
            if (!func) return '0';
            
            try {
                const args = argsString.split(',').map(arg => {
                    arg = arg.trim();
                    if (arg.startsWith('"') && arg.endsWith('"')) {
                        return arg.slice(1, -1); // String literal
                    }
                    return parseFloat(arg) || arg;
                });
                
                const result = func(...args);
                return typeof result === 'number' ? result.toString() : (result ? '1' : '0');
            } catch (error) {
                return '0';
            }
        });
    }

    // Replace variable references in expression
    replaceVariableReferences(expression) {
        const variableRegex = /\$(\w+)/g;
        
        return expression.replace(variableRegex, (match, variableName) => {
            const value = this.getVariableValue(variableName);
            return typeof value === 'number' ? value.toString() : (value ? '1' : '0');
        });
    }

    // Safely evaluate mathematical expression
    safeEvaluate(expression) {
        try {
            // Remove any potentially dangerous characters
            const sanitized = expression.replace(/[^0-9+\-*/.()>\s<!=&|]/g, '');
            
            // Use Function constructor for safe evaluation
            const result = new Function('return ' + sanitized)();
            return Boolean(result);
        } catch (error) {
            return false;
        }
    }

    // Get variable value from various sources
    getVariableValue(variableName) {
        // Check local variables first
        if (this.variables.has(variableName)) {
            return this.variables.get(variableName);
        }
        
        // Check context variables
        if (this.evaluationContext[variableName] !== undefined) {
            return this.evaluationContext[variableName];
        }
        
        // Check built-in system variables
        switch (variableName) {
            case 'time':
                return Date.now();
            case 'memoryUsage':
                return this.functions.get('getMemoryUsage')();
            case 'cpuUsage':
                return this.functions.get('getCpuUsage')();
            case 'stressLevel':
                return this.functions.get('getStressLevel')();
            case 'systemHealth':
                return this.functions.get('systemHealth')();
            default:
                return 0;
        }
    }

    // Get historical variable value
    getHistoricalVariableValue(variableName, timestamp) {
        // Search through evaluation history for variable values
        const historicalEvaluation = this.history
            .filter(h => h.timestamp >= timestamp)
            .find(h => h.context[variableName] !== undefined);
        
        return historicalEvaluation ? historicalEvaluation.context[variableName] : null;
    }

    // Get variable value history over time window
    getVariableHistory(variableName, timeWindow) {
        const cutoffTime = Date.now() - timeWindow;
        return this.history
            .filter(h => h.timestamp > cutoffTime)
            .map(h => h.context[variableName] || this.getVariableValue(variableName))
            .filter(value => typeof value === 'number');
    }

    // Get events in time window
    getEventsInWindow(eventType, cutoffTime) {
        return this.consciousness.systemLog
            .filter(log => log.timestamp > cutoffTime)
            .filter(log => log.category === eventType || log.message.includes(eventType));
    }

    // Get last event of specific type
    getLastEvent(eventType) {
        return this.consciousness.systemLog
            .slice()
            .reverse()
            .find(log => log.category === eventType || log.message.includes(eventType));
    }

    // Utility methods for pattern detection
    findPeaks(values) {
        const peaks = [];
        for (let i = 1; i < values.length - 1; i++) {
            if (values[i] > values[i-1] && values[i] > values[i+1]) {
                peaks.push(i);
            }
        }
        return peaks;
    }

    findValleys(values) {
        const valleys = [];
        for (let i = 1; i < values.length - 1; i++) {
            if (values[i] < values[i-1] && values[i] < values[i+1]) {
                valleys.push(i);
            }
        }
        return valleys;
    }

    calculateAmplitude(values) {
        const max = Math.max(...values);
        const min = Math.min(...values);
        return max - min;
    }

    calculateCorrelation(values1, values2) {
        if (values1.length !== values2.length || values1.length === 0) return 0;
        
        const mean1 = values1.reduce((a, b) => a + b) / values1.length;
        const mean2 = values2.reduce((a, b) => a + b) / values2.length;
        
        let numerator = 0;
        let denominator1 = 0;
        let denominator2 = 0;
        
        for (let i = 0; i < values1.length; i++) {
            const diff1 = values1[i] - mean1;
            const diff2 = values2[i] - mean2;
            
            numerator += diff1 * diff2;
            denominator1 += diff1 * diff1;
            denominator2 += diff2 * diff2;
        }
        
        const denominator = Math.sqrt(denominator1 * denominator2);
        return denominator === 0 ? 0 : numerator / denominator;
    }

    // Pattern checking methods
    checkIncreasingPattern(events) {
        if (events.length < 2) return false;
        
        for (let i = 1; i < events.length; i++) {
            if (events[i].timestamp <= events[i-1].timestamp) {
                return false;
            }
        }
        return true;
    }

    checkDecreasingPattern(events) {
        if (events.length < 2) return false;
        
        const intervals = [];
        for (let i = 1; i < events.length; i++) {
            intervals.push(events[i].timestamp - events[i-1].timestamp);
        }
        
        for (let i = 1; i < intervals.length; i++) {
            if (intervals[i] <= intervals[i-1]) {
                return false;
            }
        }
        return true;
    }

    checkPeriodicPattern(events, expectedPeriod) {
        if (events.length < 3) return false;
        
        const intervals = [];
        for (let i = 1; i < events.length; i++) {
            intervals.push(events[i].timestamp - events[i-1].timestamp);
        }
        
        const avgInterval = intervals.reduce((a, b) => a + b) / intervals.length;
        const tolerance = expectedPeriod * 0.2; // 20% tolerance
        
        return Math.abs(avgInterval - expectedPeriod) <= tolerance;
    }

    checkBurstPattern(events, burstWindow) {
        if (events.length < 2) return false;
        
        let burstsFound = 0;
        let i = 0;
        
        while (i < events.length) {
            let burstCount = 1;
            let j = i + 1;
            
            while (j < events.length && 
                   events[j].timestamp - events[i].timestamp <= burstWindow) {
                burstCount++;
                j++;
            }
            
            if (burstCount >= 3) { // Minimum 3 events for a burst
                burstsFound++;
            }
            
            i = j;
        }
        
        return burstsFound > 0;
    }

    // Condition matching for sequences
    conditionsMatch(condition1, condition2) {
        if (typeof condition1 === 'string' && typeof condition2 === 'string') {
            return condition1 === condition2;
        }
        
        // For complex conditions, do deep comparison
        return JSON.stringify(condition1) === JSON.stringify(condition2);
    }

    // Cache management
    generateCacheKey(condition, context) {
        const contextKey = Object.keys(context).sort().map(k => `${k}:${context[k]}`).join('|');
        return `${JSON.stringify(condition)}_${contextKey}`;
    }

    cleanupCache() {
        const cutoffTime = Date.now() - 10000; // Keep cache for 10 seconds
        
        for (const [key, entry] of this.cachedEvaluations.entries()) {
            if (entry.timestamp < cutoffTime) {
                this.cachedEvaluations.delete(key);
            }
        }
        
        // Limit history size
        if (this.history.length > 1000) {
            this.history = this.history.slice(-500);
        }
    }

    // Public methods for external use
    setVariable(name, value) {
        this.variables.set(name, value);
    }

    getVariable(name) {
        return this.variables.get(name);
    }

    addCustomFunction(name, func) {
        this.functions.set(name, func);
    }

    getEvaluationHistory(timeWindow = 60000) {
        const cutoffTime = Date.now() - timeWindow;
        return this.history.filter(h => h.timestamp > cutoffTime);
    }

    // Debug methods
    getDebugInfo() {
        return {
            variableCount: this.variables.size,
            functionCount: this.functions.size,
            cacheSize: this.cachedEvaluations.size,
            historySize: this.history.length,
            recentEvaluations: this.history.slice(-10)
        };
    }

    testCondition(condition, mockContext = {}) {
        const originalContext = this.evaluationContext;
        this.evaluationContext = { ...originalContext, ...mockContext };
        
        try {
            const result = this.evaluateCondition(condition, mockContext);
            return {
                success: true,
                result: result,
                explanation: this.explainCondition(condition)
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                explanation: null
            };
        } finally {
            this.evaluationContext = originalContext;
        }
    }

    explainCondition(condition) {
        // Provide human-readable explanation of what the condition checks
        if (typeof condition === 'string') {
            return `Evaluating expression: ${condition}`;
        } else if (typeof condition === 'object') {
            const type = condition.type || 'unknown';
            return `Evaluating ${type} condition with ${JSON.stringify(condition)}`;        }
        return 'Simple boolean condition';
    }
}

export default ConditionEvaluator;