// ChoiceTracker.js - Manages player choices and decision trees throughout stories

import fs from 'fs/promises';
import path from 'path';
import { EventEmitter } from 'events';

export class ChoiceTracker extends EventEmitter {
    constructor() {
        super();
        
        // Choice trees for each story
        this.choiceTrees = new Map();           // storyId -> choice tree structure
        this.playerChoices = new Map();         // storyId -> Map of choiceId -> selectedOption
        this.activeChoicePoints = new Map();    // storyId -> Set of currently available choices
        this.choiceHistory = new Map();         // storyId -> chronological choice history
        this.choiceConsequences = new Map();    // storyId -> Map of choiceId -> applied consequences
        
        // Choice evaluation cache
        this.evaluationCache = new Map();       // Cache for choice point evaluations
        this.lastCacheCleanup = Date.now();
        
        // Configuration
        this.config = {
            maxActiveChoices: 5,
            choiceTimeoutMs: 300000,            // 5 minutes before choice expires
            cacheTimeoutMs: 10000,              // 10 seconds cache timeout
            enableChoiceHints: true,
            trackChoiceMetrics: true
        };
        
        // Metrics tracking
        this.choiceMetrics = new Map();         // storyId -> choice analytics
    }

    /**
     * Load choice tree for a story
     */
    async loadChoiceTree(storyId) {
        try {
            const choiceTreePath = path.join(
                process.cwd(), 
                'data', 
                'stories', 
                storyId, 
                'choice-tree.json'
            );
            
            const treeData = await fs.readFile(choiceTreePath, 'utf8');
            const choiceTree = JSON.parse(treeData);
            
            // Validate choice tree structure
            this.validateChoiceTree(choiceTree);
            
            // Store the tree
            this.choiceTrees.set(storyId, choiceTree);
            
            // Initialize tracking for this story
            this.initializeStoryTracking(storyId);
            
            this.emit('choiceTreeLoaded', { storyId, choiceCount: this.countChoices(choiceTree) });
            
            return true;
        } catch (error) {
            // If no choice tree exists, create a minimal one
            if (error.code === 'ENOENT') {
                const defaultTree = this.createDefaultChoiceTree(storyId);
                this.choiceTrees.set(storyId, defaultTree);
                this.initializeStoryTracking(storyId);
                return true;
            }
            
            throw new Error(`Failed to load choice tree for ${storyId}: ${error.message}`);
        }
    }

    /**
     * Validate choice tree structure
     */
    validateChoiceTree(choiceTree) {
        if (!choiceTree.metadata) {
            throw new Error('Choice tree missing metadata');
        }
        
        if (!choiceTree.choices || !Array.isArray(choiceTree.choices)) {
            throw new Error('Choice tree missing choices array');
        }
        
        // Validate each choice
        choiceTree.choices.forEach((choice, index) => {
            if (!choice.id) {
                throw new Error(`Choice at index ${index} missing id`);
            }
            
            if (!choice.trigger) {
                throw new Error(`Choice ${choice.id} missing trigger conditions`);
            }
            
            if (!choice.options || !Array.isArray(choice.options)) {
                throw new Error(`Choice ${choice.id} missing options array`);
            }
            
            choice.options.forEach((option, optIndex) => {
                if (!option.id) {
                    throw new Error(`Choice ${choice.id} option ${optIndex} missing id`);
                }
                if (!option.text) {
                    throw new Error(`Choice ${choice.id} option ${option.id} missing text`);
                }
            });
        });
    }

    /**
     * Create default choice tree if none exists
     */
    createDefaultChoiceTree(storyId) {
        return {
            metadata: {
                storyId: storyId,
                version: "1.0.0",
                generatedAt: new Date().toISOString(),
                description: "Auto-generated default choice tree"
            },
            choices: [
                {
                    id: "debug_approach",
                    type: "debugging_strategy",
                    trigger: {
                        type: "compound",
                        conditions: [
                            "getDebugIssueCount() > 0",
                            "playerActionCount('intervention') == 0"
                        ],
                        operator: "AND"
                    },
                    context: {
                        title: "Debugging Approach",
                        description: "How would you like to approach debugging this consciousness?"
                    },
                    options: [
                        {
                            id: "systematic",
                            text: "Take a systematic approach, analyzing each component methodically",
                            consequences: {
                                variables: { "debug_style": "systematic", "patience_bonus": 0.2 },
                                narrative: "systematic_debugging_path"
                            }
                        },
                        {
                            id: "intuitive",
                            text: "Trust your instincts and look for the most obvious problems first",
                            consequences: {
                                variables: { "debug_style": "intuitive", "speed_bonus": 0.3 },
                                narrative: "intuitive_debugging_path"
                            }
                        },
                        {
                            id: "collaborative",
                            text: "Try to understand the consciousness's perspective before making changes",
                            consequences: {
                                variables: { "debug_style": "collaborative", "empathy_bonus": 0.4 },
                                narrative: "collaborative_debugging_path"
                            }
                        }
                    ],
                    timeout: 300000,
                    priority: "high"
                }
            ]
        };
    }

    /**
     * Initialize tracking for a story
     */
    initializeStoryTracking(storyId) {
        if (!this.playerChoices.has(storyId)) {
            this.playerChoices.set(storyId, new Map());
        }
        
        if (!this.activeChoicePoints.has(storyId)) {
            this.activeChoicePoints.set(storyId, new Set());
        }
        
        if (!this.choiceHistory.has(storyId)) {
            this.choiceHistory.set(storyId, []);
        }
        
        if (!this.choiceConsequences.has(storyId)) {
            this.choiceConsequences.set(storyId, new Map());
        }
        
        if (!this.choiceMetrics.has(storyId)) {
            this.choiceMetrics.set(storyId, {
                totalChoices: 0,
                averageDecisionTime: 0,
                choiceDistribution: new Map(),
                timeouts: 0,
                hintsUsed: 0
            });
        }
    }

    /**
     * Evaluate choice points based on current state
     */
    async evaluateChoicePoints(consciousnessState, storyContext, progressState) {
        const storyId = storyContext.storyId;
        const choiceTree = this.choiceTrees.get(storyId);
        
        if (!choiceTree) {
            return [];
        }
        
        // Check cache first
        const cacheKey = this.generateEvaluationCacheKey(consciousnessState, storyContext, progressState);
        const cached = this.evaluationCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < this.config.cacheTimeoutMs) {
            return cached.choicePoints;
        }
        
        const availableChoices = [];
        const activeChoices = this.activeChoicePoints.get(storyId);
        
        // Evaluate each choice in the tree
        for (const choice of choiceTree.choices) {
            // Skip if already active (avoid duplicates)
            if (activeChoices.has(choice.id)) {
                continue;
            }
            
            // Skip if already made and not repeatable
            if (this.playerChoices.get(storyId).has(choice.id) && !choice.repeatable) {
                continue;
            }
            
            // Evaluate trigger conditions
            if (await this.evaluateChoiceTrigger(choice, consciousnessState, storyContext, progressState)) {
                const choicePoint = this.createChoicePoint(choice, consciousnessState, storyContext);
                availableChoices.push(choicePoint);
                
                // Add to active choices
                activeChoices.add(choice.id);
                
                // Set timeout if specified
                if (choice.timeout) {
                    setTimeout(() => {
                        this.handleChoiceTimeout(storyId, choice.id);
                    }, choice.timeout);
                }
            }
        }
        
        // Cache the results
        this.evaluationCache.set(cacheKey, {
            choicePoints: availableChoices,
            timestamp: Date.now()
        });
        
        // Cleanup old cache entries
        this.cleanupEvaluationCache();
        
        return availableChoices;
    }

    /**
     * Evaluate if a choice's trigger conditions are met
     */
    async evaluateChoiceTrigger(choice, consciousnessState, storyContext, progressState) {
        const context = {
            consciousness: consciousnessState,
            story: storyContext,
            progress: progressState,
            playerChoices: this.playerChoices.get(storyContext.storyId),
            choiceHistory: this.choiceHistory.get(storyContext.storyId)
        };
        
        // Use the condition evaluator from narrative engine
        // This is a simplified version - in real implementation, 
        // we'd inject the ConditionEvaluator
        return this.evaluateConditions(choice.trigger, context);
    }

    /**
     * Simple condition evaluation (to be replaced with ConditionEvaluator integration)
     */
    evaluateConditions(trigger, context) {
        if (!trigger) return true;
        
        switch (trigger.type) {
            case 'simple':
                return this.evaluateSimpleCondition(trigger.condition, context);
            
            case 'compound':
                return this.evaluateCompoundConditions(trigger.conditions, trigger.operator, context);
            
            case 'script':
                return this.evaluateScriptCondition(trigger.script, context);
            
            default:
                return true;
        }
    }

    /**
     * Evaluate simple condition
     */
    evaluateSimpleCondition(condition, context) {
        // This is a simplified parser - in practice, use ConditionEvaluator
        try {
            // Replace context variables
            let evaluatedCondition = condition;
            
            // Replace common patterns
            evaluatedCondition = evaluatedCondition.replace(/getDebugIssueCount\(\)/g, 
                (context.consciousness.debugIssueCount || 0).toString());
            evaluatedCondition = evaluatedCondition.replace(/playerActionCount\('(\w+)'\)/g, 
                (match, actionType) => (context.playerChoices?.size || 0).toString());
            
            // Simple evaluation
            return eval(evaluatedCondition);
        } catch (error) {
            console.warn('Choice condition evaluation error:', error);
            return false;
        }
    }

    /**
     * Evaluate compound conditions
     */
    evaluateCompoundConditions(conditions, operator, context) {
        const results = conditions.map(condition => 
            this.evaluateSimpleCondition(condition, context)
        );
        
        switch (operator) {
            case 'AND':
                return results.every(result => result);
            case 'OR':
                return results.some(result => result);
            case 'XOR':
                return results.filter(result => result).length === 1;
            default:
                return results.every(result => result);
        }
    }

    /**
     * Create choice point object for frontend
     */
    createChoicePoint(choice, consciousnessState, storyContext) {
        return {
            id: choice.id,
            type: 'choice_point',
            title: choice.context?.title || 'Decision Point',
            description: choice.context?.description || 'Choose your approach',
            options: choice.options.map(option => ({
                id: option.id,
                text: option.text,
                hint: this.config.enableChoiceHints ? option.hint : undefined,
                consequences: option.consequences ? this.summarizeConsequences(option.consequences) : undefined,
                disabled: this.isOptionDisabled(option, consciousnessState, storyContext)
            })),
            timeout: choice.timeout,
            priority: choice.priority || 'normal',
            context: {
                storyId: storyContext.storyId,
                timestamp: Date.now(),
                consciousnessState: {
                    dominant_emotion: consciousnessState.dominant,
                    stability: consciousnessState.coherence,
                    debug_issues: consciousnessState.debugIssueCount || 0
                }
            }
        };
    }

    /**
     * Check if a choice option should be disabled
     */
    isOptionDisabled(option, consciousnessState, storyContext) {
        if (!option.requirements) return false;
        
        // Check various requirements
        for (const requirement of option.requirements) {
            switch (requirement.type) {
                case 'min_debug_skills':
                    if ((consciousnessState.playerSkills?.debugging || 0) < requirement.value) {
                        return true;
                    }
                    break;
                case 'emotional_state':
                    if (consciousnessState.dominant !== requirement.value) {
                        return true;
                    }
                    break;
                case 'previous_choice':
                    const previousChoice = this.playerChoices.get(storyContext.storyId).get(requirement.choiceId);
                    if (previousChoice !== requirement.selectedOption) {
                        return true;
                    }
                    break;
            }
        }
        
        return false;
    }

    /**
     * Summarize consequences for player preview
     */
    summarizeConsequences(consequences) {
        const summary = [];
        
        if (consequences.variables) {
            Object.entries(consequences.variables).forEach(([key, value]) => {
                if (typeof value === 'number' && value > 0) {
                    summary.push(`Increases ${key.replace('_', ' ')}`);
                } else if (typeof value === 'number' && value < 0) {
                    summary.push(`Decreases ${key.replace('_', ' ')}`);
                }
            });
        }
        
        if (consequences.narrative) {
            summary.push(`Unlocks ${consequences.narrative.replace('_', ' ')} storyline`);
        }
        
        return summary.length > 0 ? summary : undefined;
    }

    /**
     * Record a player's choice
     */
    recordChoice(storyId, choiceId, selectedOptionId) {
        const choiceTree = this.choiceTrees.get(storyId);
        const choice = choiceTree?.choices.find(c => c.id === choiceId);
        
        if (!choice) {
            throw new Error(`Choice ${choiceId} not found in story ${storyId}`);
        }
        
        const selectedOption = choice.options.find(o => o.id === selectedOptionId);
        if (!selectedOption) {
            throw new Error(`Option ${selectedOptionId} not found in choice ${choiceId}`);
        }
        
        // Record the choice
        const playerChoices = this.playerChoices.get(storyId);
        playerChoices.set(choiceId, selectedOptionId);
        
        // Add to history
        const choiceHistory = this.choiceHistory.get(storyId);
        const choiceRecord = {
            choiceId,
            selectedOptionId,
            timestamp: Date.now(),
            context: {
                title: choice.context?.title,
                selectedText: selectedOption.text
            }
        };
        choiceHistory.push(choiceRecord);
        
        // Remove from active choices
        this.activeChoicePoints.get(storyId).delete(choiceId);
        
        // Apply consequences
        if (selectedOption.consequences) {
            this.applyChoiceConsequences(storyId, choiceId, selectedOption.consequences);
        }
        
        // Update metrics
        this.updateChoiceMetrics(storyId, choiceRecord);
        
        // Emit event
        this.emit('choiceRecorded', {
            storyId,
            choiceId,
            selectedOptionId,
            consequences: selectedOption.consequences
        });
        
        return choiceRecord;
    }

    /**
     * Apply choice consequences
     */
    applyChoiceConsequences(storyId, choiceId, consequences) {
        const appliedConsequences = {
            choiceId,
            timestamp: Date.now(),
            variables: {},
            narrative: null,
            processChanges: {},
            memoryChanges: {}
        };
        
        // Apply variable changes
        if (consequences.variables) {
            Object.entries(consequences.variables).forEach(([key, value]) => {
                appliedConsequences.variables[key] = value;
                // In practice, this would integrate with the consciousness engine
                // to actually modify the system state
            });
        }
        
        // Set narrative path
        if (consequences.narrative) {
            appliedConsequences.narrative = consequences.narrative;
        }
        
        // Apply process modifications
        if (consequences.processChanges) {
            appliedConsequences.processChanges = consequences.processChanges;
        }
        
        // Apply memory modifications
        if (consequences.memoryChanges) {
            appliedConsequences.memoryChanges = consequences.memoryChanges;
        }
        
        // Store applied consequences
        this.choiceConsequences.get(storyId).set(choiceId, appliedConsequences);
        
        return appliedConsequences;
    }

    /**
     * Handle choice timeout
     */
    handleChoiceTimeout(storyId, choiceId) {
        const activeChoices = this.activeChoicePoints.get(storyId);
        
        if (activeChoices.has(choiceId)) {
            activeChoices.delete(choiceId);
            
            // Apply default choice or timeout consequences
            const choiceTree = this.choiceTrees.get(storyId);
            const choice = choiceTree?.choices.find(c => c.id === choiceId);
            
            if (choice?.defaultOption) {
                this.recordChoice(storyId, choiceId, choice.defaultOption);
            }
            
            // Update metrics
            const metrics = this.choiceMetrics.get(storyId);
            metrics.timeouts++;
            
            this.emit('choiceTimeout', { storyId, choiceId });
        }
    }

    /**
     * Update choice metrics
     */
    updateChoiceMetrics(storyId, choiceRecord) {
        const metrics = this.choiceMetrics.get(storyId);
        
        metrics.totalChoices++;
        
        // Update choice distribution
        const optionId = choiceRecord.selectedOptionId;
        metrics.choiceDistribution.set(optionId, 
            (metrics.choiceDistribution.get(optionId) || 0) + 1);
        
        // Calculate decision time (simplified - would need start time tracking)
        const decisionTime = 30000; // Placeholder
        metrics.averageDecisionTime = 
            (metrics.averageDecisionTime * (metrics.totalChoices - 1) + decisionTime) / 
            metrics.totalChoices;
    }

    /**
     * Get choice history for a story
     */
    getChoiceHistory(storyId) {
        return this.choiceHistory.get(storyId) || [];
    }

    /**
     * Get applied consequences for a story
     */
    getAppliedConsequences(storyId) {
        const consequences = this.choiceConsequences.get(storyId);
        return consequences ? Array.from(consequences.values()) : [];
    }

    /**
     * Get active choice points for a story
     */
    getActiveChoicePoints(storyId) {
        return Array.from(this.activeChoicePoints.get(storyId) || []);
    }

    /**
     * Check if a specific choice has been made
     */
    hasChoiceBeenMade(storyId, choiceId) {
        return this.playerChoices.get(storyId)?.has(choiceId) || false;
    }

    /**
     * Get the selected option for a choice
     */
    getSelectedOption(storyId, choiceId) {
        return this.playerChoices.get(storyId)?.get(choiceId);
    }

    /**
     * Export choice state for saving
     */
    exportState(storyId) {
        return {
            playerChoices: Array.from(this.playerChoices.get(storyId) || []),
            choiceHistory: this.choiceHistory.get(storyId) || [],
            appliedConsequences: Array.from(this.choiceConsequences.get(storyId) || []),
            activeChoicePoints: Array.from(this.activeChoicePoints.get(storyId) || []),
            metrics: this.choiceMetrics.get(storyId) || {}
        };
    }

    /**
     * Import saved choice state
     */
    importState(storyId, savedState) {
        if (savedState.playerChoices) {
            this.playerChoices.set(storyId, new Map(savedState.playerChoices));
        }
        
        if (savedState.choiceHistory) {
            this.choiceHistory.set(storyId, savedState.choiceHistory);
        }
        
        if (savedState.appliedConsequences) {
            this.choiceConsequences.set(storyId, new Map(savedState.appliedConsequences));
        }
        
        if (savedState.activeChoicePoints) {
            this.activeChoicePoints.set(storyId, new Set(savedState.activeChoicePoints));
        }
        
        if (savedState.metrics) {
            this.choiceMetrics.set(storyId, savedState.metrics);
        }
    }

    /**
     * Utility methods
     */
    generateEvaluationCacheKey(consciousnessState, storyContext, progressState) {
        const keyData = {
            storyId: storyContext.storyId,
            progress: progressState?.progress || 0,
            dominant: consciousnessState.dominant,
            debugIssues: consciousnessState.debugIssueCount || 0
        };
        return JSON.stringify(keyData);
    }

    cleanupEvaluationCache() {
        const now = Date.now();
        if (now - this.lastCacheCleanup < this.config.cacheTimeoutMs) {
            return;
        }
        
        for (const [key, entry] of this.evaluationCache.entries()) {
            if (now - entry.timestamp > this.config.cacheTimeoutMs) {
                this.evaluationCache.delete(key);
            }
        }
        
        this.lastCacheCleanup = now;
    }

    countChoices(choiceTree) {
        return choiceTree.choices ? choiceTree.choices.length : 0;
    }

    /**
     * Debug and utility methods
     */
    getDebugInfo(storyId) {
        return {
            choiceTreeLoaded: this.choiceTrees.has(storyId),
            totalChoices: this.countChoices(this.choiceTrees.get(storyId) || {}),
            choicesMade: this.playerChoices.get(storyId)?.size || 0,
            activeChoices: this.activeChoicePoints.get(storyId)?.size || 0,
            cacheSize: this.evaluationCache.size,
            metrics: this.choiceMetrics.get(storyId)
        };
    }

    resetStoryChoices(storyId) {
        this.playerChoices.delete(storyId);
        this.activeChoicePoints.delete(storyId);
        this.choiceHistory.delete(storyId);
        this.choiceConsequences.delete(storyId);
        this.choiceMetrics.delete(storyId);
        
        this.initializeStoryTracking(storyId);
        
        this.emit('storyChoicesReset', { storyId });
    }
}