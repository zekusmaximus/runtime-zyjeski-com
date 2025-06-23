// EmotionalProcessor.js - Manages emotional states, transitions, and stability

class EmotionalProcessor {
    constructor(consciousnessInstance) {
        this.consciousness = consciousnessInstance;
        this.currentState = this.initializeEmotionalState();
        this.stateHistory = [];
        this.emotionalBuffers = new Map();
        this.stabilityMetrics = {
            variance: 0,
            volatility: 0,
            coherence: 1.0,
            regulation: 0.5
        };
        this.triggers = new Map();
        this.suppressionMechanisms = new Map();
        this.processingQueue = [];
        this.emotionalThreads = new Map();
        this.regulationStrategies = new Map();
    }

    // Initialize base emotional state
    initializeEmotionalState() {
        return {
            primary: {
                grief: 0.8,        // Alexander's dominant state
                anger: 0.3,
                sadness: 0.7,
                fear: 0.4,
                love: 0.2,         // Suppressed but present
                hope: 0.1,
                acceptance: 0.1
            },
            secondary: {
                guilt: 0.6,
                regret: 0.9,
                loneliness: 0.8,
                confusion: 0.5,
                numbness: 0.4
            },
            physiological: {
                arousal: 0.4,
                valence: -0.6,     // Negative emotional valence
                intensity: 0.7,
                stability: 0.3
            },
            cognitive: {
                clarity: 0.2,
                focus: 0.3,
                rumination: 0.9,
                intrusion: 0.7
            },
            behavioral: {
                withdrawal: 0.8,
                avoidance: 0.7,
                irritability: 0.5,
                apathy: 0.6
            },
            timestamp: Date.now(),
            dominant: 'grief',
            coherence: 0.3,        // Low coherence indicates emotional chaos
            regulation: 0.2        // Poor emotional regulation
        };
    }

    // Process emotional input and update state
    processEmotionalInput(emotionalData) {
        const inputId = `input_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
        
        // Add to processing queue
        const emotionalInput = {
            id: inputId,
            ...emotionalData,
            timestamp: Date.now(),
            processed: false,
            intensity: emotionalData.intensity || 0.5,
            duration: emotionalData.duration || 5000,
            triggers: emotionalData.triggers || [],
            source: emotionalData.source || 'external'
        };
        
        this.processingQueue.push(emotionalInput);
        
        // Create processing thread for significant emotions
        if (emotionalInput.intensity > 0.6) {
            this.createEmotionalThread(emotionalInput);
        }
        
        // Immediate state update for high-intensity emotions
        if (emotionalInput.intensity > 0.8) {
            this.immediateStateUpdate(emotionalInput);
        }
        
        return inputId;
    }

    // Create dedicated processing thread for complex emotions
    createEmotionalThread(emotionalInput) {
        const threadId = `thread_${emotionalInput.id}`;
        
        const emotionalThread = {
            id: threadId,
            emotion: emotionalInput.type,
            intensity: emotionalInput.intensity,
            startTime: Date.now(),
            
            // Thread behavior
            cpuUsage: 20 + (emotionalInput.intensity * 30),
            memoryUsage: 50 + (emotionalInput.intensity * 40),
            priority: this.getEmotionalPriority(emotionalInput.type),
            
            // Processing state
            stage: 'recognition',
            stages: ['recognition', 'appraisal', 'response_generation', 'regulation', 'integration'],
            currentStageProgress: 0,
            
            // Thread health
            stability: 1.0,
            coherence: 1.0,
            processingEfficiency: 0.8,
            
            // Issues that can develop
            issues: [],
            vulnerabilities: this.getEmotionalVulnerabilities(emotionalInput.type),
            
            // Debugging info
            debuggable: true,
            interventionPoints: this.getEmotionalInterventions(emotionalInput.type)
        };
        
        this.emotionalThreads.set(threadId, emotionalThread);
        
        // Log thread creation
        this.consciousness.systemLog.push({
            timestamp: Date.now(),
            level: 'info',
            message: `Emotional processing thread created for ${emotionalInput.type}`,
            category: 'emotional_processing',
            threadId: threadId
        });
        
        return threadId;
    }

    // Get emotional priority for thread scheduling
    getEmotionalPriority(emotionType) {
        const priorityMap = {
            'grief': 'critical',
            'fear': 'critical',
            'anger': 'high',
            'sadness': 'high',
            'guilt': 'medium',
            'love': 'medium',
            'hope': 'low',
            'acceptance': 'low'
        };
        
        return priorityMap[emotionType] || 'normal';
    }

    // Get emotional vulnerabilities for thread monitoring
    getEmotionalVulnerabilities(emotionType) {
        const vulnerabilityMap = {
            'grief': ['recursive_loop', 'memory_overflow', 'processing_stall'],
            'anger': ['priority_escalation', 'resource_monopolization', 'system_disruption'],
            'fear': ['threat_detection_overflow', 'false_positive_cascade', 'system_freeze'],
            'sadness': ['energy_drain', 'motivation_corruption', 'withdrawal_deadlock'],
            'guilt': ['self_punishment_loop', 'responsibility_overflow', 'decision_paralysis'],
            'love': ['dependency_injection', 'idealization_bias', 'abandonment_trigger'],
            'hope': ['unrealistic_projection', 'disappointment_vulnerability', 'reality_check_failure'],
            'acceptance': ['premature_closure', 'avoidance_masking', 'processing_bypass']
        };
        
        return vulnerabilityMap[emotionType] || ['general_instability'];
    }

    // Get intervention points for emotional debugging
    getEmotionalInterventions(emotionType) {
        const interventionMap = {
            'grief': [
                {
                    name: 'Grief Processing Optimization',
                    description: 'Implement healthy grief stages with proper memory processing',
                    difficulty: 'hard',
                    requirements: ['identify_grief_stage', 'implement_processing_flow', 'add_memory_integration']
                },
                {
                    name: 'Recursive Loop Breaking',
                    description: 'Add exit conditions to prevent infinite grief spirals',
                    difficulty: 'medium',
                    requirements: ['trace_recursion_path', 'implement_circuit_breaker']
                }
            ],
            'anger': [
                {
                    name: 'Anger Regulation Module',
                    description: 'Implement cooling-off periods and priority management',
                    difficulty: 'medium',
                    requirements: ['implement_cooldown_timer', 'add_priority_limits']
                },
                {
                    name: 'Resource Conflict Resolution',
                    description: 'Prevent anger from monopolizing system resources',
                    difficulty: 'hard',
                    requirements: ['implement_resource_scheduler', 'add_fairness_algorithms']
                }
            ],
            'fear': [
                {
                    name: 'Threat Assessment Calibration',
                    description: 'Tune threat detection to reduce false positives',
                    difficulty: 'easy',
                    requirements: ['analyze_threat_patterns', 'adjust_sensitivity_thresholds']
                },
                {
                    name: 'Panic Prevention System',
                    description: 'Implement safeguards against fear cascades',
                    difficulty: 'medium',
                    requirements: ['implement_panic_detection', 'add_emergency_regulation']
                }
            ]
        };
        
        return interventionMap[emotionType] || [];
    }

    // Update emotional threads during system tick
    updateEmotionalThreads(deltaTime) {
        Array.from(this.emotionalThreads.values()).forEach(thread => {
            this.updateEmotionalThread(thread, deltaTime);
            this.checkThreadHealth(thread);
        });
        
        this.cleanupCompletedThreads();
    }

    // Update individual emotional thread
    updateEmotionalThread(thread, deltaTime) {
        const stageTime = 1000; // Each stage takes 1 second
        thread.currentStageProgress += deltaTime;
        
        // Check for stage completion
        if (thread.currentStageProgress >= stageTime) {
            this.advanceThreadStage(thread);
            thread.currentStageProgress = 0;
        }
        
        // Apply vulnerabilities as issues
        this.checkThreadVulnerabilities(thread);
        
        // Update thread stability based on issues
        if (thread.issues.length > 0) {
            thread.stability *= 0.98;
            thread.processingEfficiency *= 0.99;
        } else {
            thread.stability = Math.min(1.0, thread.stability + 0.01);
        }
    }

    // Advance thread to next processing stage
    advanceThreadStage(thread) {
        const currentIndex = thread.stages.indexOf(thread.stage);
        
        if (currentIndex < thread.stages.length - 1) {
            thread.stage = thread.stages[currentIndex + 1];
            
            this.consciousness.systemLog.push({
                timestamp: Date.now(),
                level: 'debug',
                message: `Emotional thread ${thread.id} advanced to ${thread.stage}`,
                category: 'emotional_processing',
                threadId: thread.id
            });
        } else {
            // Thread completed - integrate results
            this.integrateEmotionalThread(thread);
        }
    }

    // Check thread vulnerabilities and generate issues
    checkThreadVulnerabilities(thread) {
        thread.vulnerabilities.forEach(vulnerability => {
            if (this.shouldTriggerVulnerability(thread, vulnerability)) {
                const issue = this.createThreadIssue(thread, vulnerability);
                if (!thread.issues.find(i => i.type === issue.type)) {
                    thread.issues.push(issue);
                }
            }
        });
    }

    // Determine if vulnerability should trigger
    shouldTriggerVulnerability(thread, vulnerability) {
        const triggerConditions = {
            'recursive_loop': thread.intensity > 0.8 && thread.stage === 'appraisal',
            'memory_overflow': thread.memoryUsage > 100 && thread.stage === 'integration',
            'processing_stall': thread.stability < 0.5,
            'priority_escalation': thread.intensity > 0.7 && thread.cpuUsage > 40,
            'resource_monopolization': thread.cpuUsage > 60,
            'system_disruption': thread.priority === 'critical' && thread.stability < 0.3,
            'threat_detection_overflow': thread.intensity > 0.9,
            'false_positive_cascade': thread.processingEfficiency < 0.6,
            'system_freeze': thread.intensity > 0.95 && thread.stage === 'response_generation'
        };
        
        return triggerConditions[vulnerability] || false;
    }

    // Create thread issue
    createThreadIssue(thread, vulnerability) {
        return {
            type: vulnerability,
            severity: this.getVulnerabilitySeverity(vulnerability),
            description: this.getVulnerabilityDescription(vulnerability, thread),
            timestamp: Date.now(),
            threadId: thread.id,
            debuggable: true
        };
    }

    // Get vulnerability severity
    getVulnerabilitySeverity(vulnerability) {
        const severityMap = {
            'recursive_loop': 'critical',
            'memory_overflow': 'high',
            'processing_stall': 'high',
            'priority_escalation': 'medium',
            'resource_monopolization': 'high',
            'system_disruption': 'critical',
            'threat_detection_overflow': 'high',
            'false_positive_cascade': 'medium',
            'system_freeze': 'critical'
        };
        
        return severityMap[vulnerability] || 'medium';
    }

    // Get vulnerability description
    getVulnerabilityDescription(vulnerability, thread) {
        const descriptions = {
            'recursive_loop': `${thread.emotion} processing stuck in infinite loop`,
            'memory_overflow': `${thread.emotion} thread consuming excessive memory`,
            'processing_stall': `${thread.emotion} processing has stalled`,
            'priority_escalation': `${thread.emotion} escalating priority uncontrollably`,
            'resource_monopolization': `${thread.emotion} monopolizing system resources`,
            'system_disruption': `${thread.emotion} disrupting other emotional processes`,
            'threat_detection_overflow': `Fear system generating too many threat alerts`,
            'false_positive_cascade': `Threat detection producing false positives`,
            'system_freeze': `Emotional processing frozen by overwhelming ${thread.emotion}`
        };
        
        return descriptions[vulnerability] || `Unknown issue with ${thread.emotion} processing`;
    }

    // Integrate completed emotional thread results
    integrateEmotionalThread(thread) {
        // Update current emotional state based on thread results
        const impact = this.calculateThreadImpact(thread);
        this.applyEmotionalImpact(impact);
        
        // Create memory of emotional experience
        const memoryData = {
            description: `Processed ${thread.emotion} with intensity ${thread.intensity}`,
            emotionalIntensity: thread.intensity,
            emotions: [thread.emotion],
            context: {
                threadId: thread.id,
                processingTime: Date.now() - thread.startTime,
                issues: thread.issues.length,
                efficiency: thread.processingEfficiency
            },
            timeStamp: Date.now()
        };
        
        this.consciousness.memoryManager.allocateMemory(memoryData, 'shortTerm');
        
        // Log integration
        this.consciousness.systemLog.push({
            timestamp: Date.now(),
            level: 'info',
            message: `Emotional thread ${thread.id} integrated - ${thread.emotion} processing complete`,
            category: 'emotional_integration',
            threadId: thread.id,
            impact: impact
        });
        
        // Mark thread for cleanup
        thread.completed = true;
    }

    // Calculate thread impact on overall emotional state
    calculateThreadImpact(thread) {
        const baseImpact = thread.intensity * thread.processingEfficiency;
        const stabilityModifier = thread.stability;
        const issueModifier = Math.max(0.1, 1 - (thread.issues.length * 0.2));
        
        return {
            emotion: thread.emotion,
            intensityChange: baseImpact * stabilityModifier * issueModifier,
            coherenceChange: (thread.stability - 0.5) * 0.1,
            regulationChange: thread.processingEfficiency * 0.05
        };
    }

    // Apply emotional impact to current state
    applyEmotionalImpact(impact) {
        // Update primary emotions
        if (this.currentState.primary[impact.emotion] !== undefined) {
            this.currentState.primary[impact.emotion] = Math.max(0, Math.min(1, 
                this.currentState.primary[impact.emotion] + impact.intensityChange * 0.1
            ));
        }
        
        // Update overall coherence and regulation
        this.currentState.coherence = Math.max(0, Math.min(1, 
            this.currentState.coherence + impact.coherenceChange
        ));
        
        this.currentState.regulation = Math.max(0, Math.min(1, 
            this.currentState.regulation + impact.regulationChange
        ));
        
        // Update dominant emotion
        this.updateDominantEmotion();
        
        // Update timestamp
        this.currentState.timestamp = Date.now();
    }

    // Update dominant emotion based on current intensities
    updateDominantEmotion() {
        let maxIntensity = 0;
        let dominantEmotion = 'neutral';
        
        Object.entries(this.currentState.primary).forEach(([emotion, intensity]) => {
            if (intensity > maxIntensity) {
                maxIntensity = intensity;
                dominantEmotion = emotion;
            }
        });
        
        if (this.currentState.dominant !== dominantEmotion) {
            const previousDominant = this.currentState.dominant;
            this.currentState.dominant = dominantEmotion;
            
            // Log dominant emotion change
            this.consciousness.systemLog.push({
                timestamp: Date.now(),
                level: 'info',
                message: `Dominant emotion changed from ${previousDominant} to ${dominantEmotion}`,
                category: 'emotional_state_change'
            });
            
            // Trigger narrative events for significant changes
            this.consciousness.narrativeEngine.checkTriggers('dominant_emotion_change', {
                previous: previousDominant,
                current: dominantEmotion,
                intensity: maxIntensity
            });
        }
    }

    // Process emotional regulation strategies
    applyEmotionalRegulation(strategy, targetEmotion, intensity = 0.5) {
        const regulationId = `reg_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
        
        const regulation = {
            id: regulationId,
            strategy: strategy,
            targetEmotion: targetEmotion,
            intensity: intensity,
            startTime: Date.now(),
            duration: this.getRegulationDuration(strategy),
            effectiveness: this.calculateRegulationEffectiveness(strategy, targetEmotion),
            
            // Regulation state
            active: true,
            progress: 0,
            
            // Effects
            targetReduction: this.getTargetReduction(strategy, intensity),
            sideEffects: this.getRegulationSideEffects(strategy),
            
            // Debugging
            debuggable: true,
            issues: []
        };
        
        this.regulationStrategies.set(regulationId, regulation);
        
        this.consciousness.systemLog.push({
            timestamp: Date.now(),
            level: 'info',
            message: `Applied ${strategy} regulation to ${targetEmotion}`,
            category: 'emotional_regulation',
            regulationId: regulationId
        });
        
        return regulationId;
    }

    // Get regulation strategy duration
    getRegulationDuration(strategy) {
        const durations = {
            'suppression': 5000,
            'reappraisal': 10000,
            'distraction': 3000,
            'acceptance': 15000,
            'expression': 2000,
            'breathing': 8000,
            'mindfulness': 12000
        };
        
        return durations[strategy] || 5000;
    }

    // Calculate regulation effectiveness
    calculateRegulationEffectiveness(strategy, targetEmotion) {
        const effectivenessMatrix = {
            'suppression': { 'anger': 0.3, 'fear': 0.4, 'sadness': 0.2, 'grief': 0.1 },
            'reappraisal': { 'anger': 0.7, 'fear': 0.8, 'sadness': 0.6, 'grief': 0.5 },
            'distraction': { 'anger': 0.5, 'fear': 0.6, 'sadness': 0.4, 'grief': 0.3 },
            'acceptance': { 'anger': 0.4, 'fear': 0.5, 'sadness': 0.8, 'grief': 0.9 },
            'expression': { 'anger': 0.8, 'fear': 0.3, 'sadness': 0.7, 'grief': 0.6 },
            'breathing': { 'anger': 0.6, 'fear': 0.7, 'sadness': 0.5, 'grief': 0.4 },
            'mindfulness': { 'anger': 0.5, 'fear': 0.6, 'sadness': 0.7, 'grief': 0.8 }
        };
        
        return effectivenessMatrix[strategy]?.[targetEmotion] || 0.5;
    }

    // Update regulation strategies
    updateRegulationStrategies(deltaTime) {
        Array.from(this.regulationStrategies.values()).forEach(regulation => {
            if (regulation.active) {
                this.updateRegulationStrategy(regulation, deltaTime);
            }
        });
        
        this.cleanupCompletedRegulations();
    }

    // Update individual regulation strategy
    updateRegulationStrategy(regulation, deltaTime) {
        regulation.progress += deltaTime / regulation.duration;
        
        if (regulation.progress >= 1.0) {
            this.completeRegulation(regulation);
        } else {
            // Apply gradual effects
            const currentEffect = regulation.targetReduction * regulation.effectiveness * regulation.progress;
            this.applyRegulationEffect(regulation.targetEmotion, currentEffect);
        }
    }

    // Apply regulation effect to emotion
    applyRegulationEffect(emotion, reductionAmount) {
        if (this.currentState.primary[emotion] !== undefined) {
            this.currentState.primary[emotion] = Math.max(0, 
                this.currentState.primary[emotion] - reductionAmount * 0.01
            );
        }
    }

    // Complete regulation strategy
    completeRegulation(regulation) {
        regulation.active = false;
        regulation.completed = true;
        
        // Apply final effects
        const finalEffect = regulation.targetReduction * regulation.effectiveness;
        this.applyRegulationEffect(regulation.targetEmotion, finalEffect);
        
        // Apply side effects
        regulation.sideEffects.forEach(sideEffect => {
            this.applySideEffect(sideEffect);
        });
        
        // Update overall regulation skill
        this.currentState.regulation = Math.min(1.0, 
            this.currentState.regulation + regulation.effectiveness * 0.02
        );
        
        this.consciousness.systemLog.push({
            timestamp: Date.now(),
            level: 'info',
            message: `Regulation strategy ${regulation.strategy} completed for ${regulation.targetEmotion}`,
            category: 'regulation_complete',
            regulationId: regulation.id,
            effectiveness: regulation.effectiveness
        });
    }

    // Get regulation side effects
    getRegulationSideEffects(strategy) {
        const sideEffectsMap = {
            'suppression': [
                { type: 'rebound_risk', intensity: 0.3 },
                { type: 'emotional_numbing', intensity: 0.2 }
            ],
            'reappraisal': [
                { type: 'cognitive_load', intensity: 0.1 }
            ],
            'distraction': [
                { type: 'avoidance_pattern', intensity: 0.2 }
            ],
            'acceptance': [],
            'expression': [
                { type: 'social_consequences', intensity: 0.1 }
            ],
            'breathing': [],
            'mindfulness': []
        };
        
        return sideEffectsMap[strategy] || [];
    }

    // Apply side effect
    applySideEffect(sideEffect) {
        switch(sideEffect.type) {
            case 'rebound_risk':
                // Mark for potential emotional rebound
                this.consciousness.systemLog.push({
                    timestamp: Date.now(),
                    level: 'warning',
                    message: 'Suppression may cause emotional rebound',
                    category: 'regulation_side_effect'
                });
                break;
            case 'emotional_numbing':
                // Slightly reduce all emotional intensities
                Object.keys(this.currentState.primary).forEach(emotion => {
                    this.currentState.primary[emotion] *= 0.95;
                });
                break;
            case 'cognitive_load':
                // Reduce cognitive clarity temporarily
                this.currentState.cognitive.clarity = Math.max(0, 
                    this.currentState.cognitive.clarity - 0.1
                );
                break;
        }
    }

    // Player intervention for emotional debugging
    applyEmotionalIntervention(threadId, interventionType, playerSolution) {
        const thread = this.emotionalThreads.get(threadId);
        if (!thread || !thread.debuggable) {
            return { success: false, message: 'Thread not found or not debuggable' };
        }
        
        const intervention = thread.interventionPoints.find(i => i.name === interventionType);
        if (!intervention) {
            return { success: false, message: 'Intervention not available' };
        }
        
        // Validate player solution
        const solutionScore = this.validateEmotionalSolution(playerSolution, intervention.requirements);
        
        if (solutionScore > 0.6) {
            this.applySuccessfulEmotionalIntervention(thread, intervention, solutionScore);
            return {
                success: true,
                message: 'Emotional intervention successful',
                effectivenessScore: solutionScore,
                threadStability: thread.stability
            };
        } else {
            return {
                success: false,
                message: 'Solution insufficient',
                hints: this.generateEmotionalHints(intervention.requirements, playerSolution)
            };
        }
    }

    // Validate emotional debugging solution
    validateEmotionalSolution(solution, requirements) {
        let score = 0;
        const totalRequirements = requirements.length;
        
        requirements.forEach(requirement => {
            switch(requirement) {
                case 'identify_grief_stage':
                    if (solution.toLowerCase().includes('denial') || 
                        solution.toLowerCase().includes('anger') ||
                        solution.toLowerCase().includes('bargaining') ||
                        solution.toLowerCase().includes('depression') ||
                        solution.toLowerCase().includes('acceptance')) {
                        score += 1;
                    }
                    break;
                case 'implement_processing_flow':
                    if (solution.toLowerCase().includes('process') || 
                        solution.toLowerCase().includes('flow') ||
                        solution.toLowerCase().includes('sequence')) {
                        score += 1;
                    }
                    break;
                case 'trace_recursion_path':
                    if (solution.toLowerCase().includes('loop') || 
                        solution.toLowerCase().includes('cycle') ||
                        solution.toLowerCase().includes('repeat')) {
                        score += 1;
                    }
                    break;
                case 'implement_circuit_breaker':
                    if (solution.toLowerCase().includes('break') || 
                        solution.toLowerCase().includes('stop') ||
                        solution.toLowerCase().includes('limit')) {
                        score += 1;
                    }
                    break;
                case 'implement_cooldown_timer':
                    if (solution.toLowerCase().includes('cooldown') || 
                        solution.toLowerCase().includes('timer') ||
                        solution.toLowerCase().includes('delay')) {
                        score += 1;
                    }
                    break;
            }
        });
        
        return score / totalRequirements;
    }

    // Apply successful emotional intervention
    applySuccessfulEmotionalIntervention(thread, intervention, effectivenessScore) {
        // Improve thread stability and efficiency
        thread.stability = Math.min(1.0, thread.stability + effectivenessScore * 0.3);
        thread.processingEfficiency = Math.min(1.0, thread.processingEfficiency + effectivenessScore * 0.2);
        
        // Clear related issues
        thread.issues = thread.issues.filter(issue => 
            !this.isIssueResolvedByEmotionalIntervention(issue, intervention)
        );
        
        // Reduce resource usage if applicable
        if (intervention.name.includes('Resource') || intervention.name.includes('Regulation')) {
            thread.cpuUsage *= (1 - effectivenessScore * 0.3);
            thread.memoryUsage *= (1 - effectivenessScore * 0.2);
        }
        
        this.consciousness.systemLog.push({
            timestamp: Date.now(),
            level: 'info',
            message: `Player successfully applied ${intervention.name} to ${thread.emotion} thread`,
            category: 'emotional_intervention',
            threadId: thread.id,
            effectivenessScore: effectivenessScore
        });
    }

    // Check if issue is resolved by emotional intervention
    isIssueResolvedByEmotionalIntervention(issue, intervention) {
        const resolutionMap = {
            'Grief Processing Optimization': ['recursive_loop', 'memory_overflow', 'processing_stall'],
            'Recursive Loop Breaking': ['recursive_loop'],
            'Anger Regulation Module': ['priority_escalation', 'resource_monopolization'],
            'Resource Conflict Resolution': ['resource_monopolization', 'system_disruption'],
            'Threat Assessment Calibration': ['false_positive_cascade', 'threat_detection_overflow'],
            'Panic Prevention System': ['system_freeze', 'threat_detection_overflow']
        };
        
        const resolvedIssues = resolutionMap[intervention.name] || [];
        return resolvedIssues.includes(issue.type);
    }

    // Generate emotional debugging hints
    generateEmotionalHints(requirements, playerSolution) {
        const hints = [];
        
        requirements.forEach(requirement => {
            switch(requirement) {
                case 'identify_grief_stage':
                    if (!playerSolution.toLowerCase().includes('denial') && 
                        !playerSolution.toLowerCase().includes('anger') &&
                        !playerSolution.toLowerCase().includes('acceptance')) {
                        hints.push('Consider the stages of grief processing');
                    }
                    break;
                case 'implement_processing_flow':
                    if (!playerSolution.toLowerCase().includes('process')) {
                        hints.push('Think about how emotions move through different processing stages');
                    }
                    break;
                case 'trace_recursion_path':
                    if (!playerSolution.toLowerCase().includes('loop')) {
                        hints.push('Look for patterns that repeat themselves without resolution');
                    }
                    break;
            }
        });
        
        return hints;
    }

    // Clean up completed threads and regulations
    cleanupCompletedThreads() {
        Array.from(this.emotionalThreads.entries()).forEach(([id, thread]) => {
            if (thread.completed && Date.now() - thread.startTime > 60000) {
                this.emotionalThreads.delete(id);
            }
        });
    }

    cleanupCompletedRegulations() {
        Array.from(this.regulationStrategies.entries()).forEach(([id, regulation]) => {
            if (regulation.completed && Date.now() - regulation.startTime > 30000) {
                this.regulationStrategies.delete(id);
            }
        });
    }

    // Get current emotional state
    getCurrentState() {
        return {
            ...this.currentState,
            activeThreads: this.emotionalThreads.size,
            activeRegulations: Array.from(this.regulationStrategies.values()).filter(r => r.active).length,
            processingQueue: this.processingQueue.length
        };
    }

    // Get stress level calculation
    getStressLevel() {
        const primaryStress = Object.values(this.currentState.primary)
            .reduce((sum, intensity) => sum + intensity, 0) / Object.keys(this.currentState.primary).length;
        
        const cognitiveStress = (this.currentState.cognitive.rumination + this.currentState.cognitive.intrusion) / 2;
        const physiologicalStress = (1 - this.currentState.physiological.stability);
        
        return (primaryStress + cognitiveStress + physiologicalStress) / 3;
    }

    // Get debuggable emotional issues
    getDebuggableEmotionalIssues() {
        const issues = [];
        
        // Collect thread issues
        Array.from(this.emotionalThreads.values()).forEach(thread => {
            if (thread.debuggable && thread.issues.length > 0) {
                issues.push({
                    type: 'emotional_thread_issue',
                    threadId: thread.id,
                    emotion: thread.emotion,
                    issues: thread.issues,
                    interventions: thread.interventionPoints,
                    stability: thread.stability,
                    intensity: thread.intensity
                });
            }
        });
        
        // Check for system-wide emotional issues
        if (this.currentState.coherence < 0.3) {
            issues.push({
                type: 'emotional_coherence_breakdown',
                description: 'Emotional state lacks coherence',
                severity: 'high',
                interventions: [
                    {
                        name: 'Emotional Integration',
                        description: 'Integrate conflicting emotional states',
                        requirements: ['identify_conflicts', 'implement_integration_strategy']
                    }
                ]
            });
        }
        
        if (this.currentState.regulation < 0.2) {
            issues.push({
                type: 'regulation_failure',
                description: 'Emotional regulation systems failing',
                severity: 'critical',
                interventions: [
                    {
                        name: 'Regulation System Repair',
                        description: 'Restore emotional regulation capabilities',
                        requirements: ['diagnose_regulation_failure', 'implement_coping_strategies']
                    }
                ]
            });
        }
        
        return issues;
    }

    // Get emotional data for frontend
    getEmotionalDataForFrontend() {
        return {
            currentState: this.getCurrentState(),
            stressLevel: this.getStressLevel(),
            activeThreads: Array.from(this.emotionalThreads.values()).map(thread => ({
                id: thread.id,
                emotion: thread.emotion,
                intensity: thread.intensity,
                stage: thread.stage,
                stability: thread.stability,
                issues: thread.issues,
                debuggable: thread.debuggable
            })),
            activeRegulations: Array.from(this.regulationStrategies.values())
                .filter(r => r.active)
                .map(reg => ({
                    id: reg.id,
                    strategy: reg.strategy,
                    targetEmotion: reg.targetEmotion,
                    progress: reg.progress,
                    effectiveness: reg.effectiveness
                })),
            stabilityMetrics: this.stabilityMetrics,
            debuggableIssues: this.getDebuggableEmotionalIssues().length
        };
    }
}

module.exports = EmotionalProcessor;