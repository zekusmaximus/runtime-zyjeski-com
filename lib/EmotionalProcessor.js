// EmotionalProcessor.js - Manages emotional states, transitions, and stability

class EmotionalProcessor {
    constructor(consciousnessInstance, emotionalStatesConfig = {}) {
        this.consciousness = consciousnessInstance;
        this.emotionalStatesConfig = emotionalStatesConfig;
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
        this.isInitialized = false;
        this.processingInterval = null;
        this.maxHistorySize = 50;
    }

    // Initialize EmotionalProcessor with configuration and starting state
    async initialize(startingEmotionalState = {}) {
        try {
            // Merge starting state with base state
            if (startingEmotionalState && Object.keys(startingEmotionalState).length > 0) {
                this.currentState = this.mergeEmotionalStates(this.currentState, startingEmotionalState);
            }
            
            // Apply configuration overrides
            if (this.emotionalStatesConfig.initialState) {
                this.currentState = this.mergeEmotionalStates(this.currentState, this.emotionalStatesConfig.initialState);
            }
            
            // Initialize regulation strategies
            this.initializeRegulationStrategies();
            
            // Initialize triggers and suppression mechanisms
            this.initializeTriggers();
            this.initializeSuppressionMechanisms();
            
            // Start emotional processing
            this.startEmotionalProcessing();
            
            // Initialize emotional buffers
            this.initializeEmotionalBuffers();
            
            this.isInitialized = true;
            console.log('EmotionalProcessor initialized with dominant emotion:', this.currentState.dominant);
            
            return true;
        } catch (error) {
            console.error('EmotionalProcessor initialization failed:', error);
            throw error;
        }
    }

    // Merge two emotional states
    mergeEmotionalStates(baseState, newState) {
        const merged = JSON.parse(JSON.stringify(baseState)); // Deep clone
        
        // Merge primary emotions
        if (newState.primary) {
            Object.assign(merged.primary, newState.primary);
        }
        
        // Merge secondary emotions
        if (newState.secondary) {
            Object.assign(merged.secondary, newState.secondary);
        }
        
        // Merge other state properties
        ['physiological', 'cognitive', 'behavioral'].forEach(category => {
            if (newState[category]) {
                Object.assign(merged[category], newState[category]);
            }
        });
        
        // Update metadata
        merged.timestamp = Date.now();
        
        // Recalculate dominant emotion
        this.updateDominantEmotionInState(merged);
        
        return merged;
    }

    // Update dominant emotion in a given state
    updateDominantEmotionInState(state) {
        let maxIntensity = 0;
        let dominantEmotion = 'neutral';
        
        Object.entries(state.primary).forEach(([emotion, intensity]) => {
            if (intensity > maxIntensity) {
                maxIntensity = intensity;
                dominantEmotion = emotion;
            }
        });
        
        state.dominant = dominantEmotion;
    }

    // Initialize regulation strategies
    initializeRegulationStrategies() {
        this.regulationStrategies.set('cognitive_reappraisal', {
            effectiveness: 0.7,
            cooldown: 5000,
            lastUsed: 0,
            description: 'Reframe emotional interpretation'
        });
        
        this.regulationStrategies.set('emotional_suppression', {
            effectiveness: 0.4,
            cooldown: 2000,
            lastUsed: 0,
            description: 'Suppress emotional expression'
        });
        
        this.regulationStrategies.set('distraction', {
            effectiveness: 0.5,
            cooldown: 3000,
            lastUsed: 0,
            description: 'Redirect attention away from emotion'
        });
        
        this.regulationStrategies.set('acceptance', {
            effectiveness: 0.8,
            cooldown: 10000,
            lastUsed: 0,
            description: 'Accept and process emotion naturally'
        });
        
        this.regulationStrategies.set('mindfulness', {
            effectiveness: 0.6,
            cooldown: 8000,
            lastUsed: 0,
            description: 'Observe emotions without judgment'
        });
    }

    // Initialize emotional triggers
    initializeTriggers() {
        const commonTriggers = this.emotionalStatesConfig.triggers || [
            {
                name: 'memory_recall',
                emotions: ['grief', 'sadness', 'love'],
                threshold: 0.3,
                description: 'Triggered by recalling memories'
            },
            {
                name: 'social_isolation',
                emotions: ['loneliness', 'sadness'],
                threshold: 0.4,
                description: 'Triggered by prolonged isolation'
            },
            {
                name: 'unexpected_reminder',
                emotions: ['grief', 'shock', 'sadness'],
                threshold: 0.2,
                description: 'Triggered by unexpected reminders'
            }
        ];
        
        commonTriggers.forEach(trigger => {
            this.triggers.set(trigger.name, {
                ...trigger,
                activationCount: 0,
                lastActivated: 0
            });
        });
    }

    // Initialize suppression mechanisms
    initializeSuppressionMechanisms() {
        this.suppressionMechanisms.set('avoidance', {
            targetEmotions: ['grief', 'guilt', 'anger'],
            strength: 0.6,
            energyCost: 0.3,
            description: 'Avoid situations that trigger emotions'
        });
        
        this.suppressionMechanisms.set('rationalization', {
            targetEmotions: ['grief', 'sadness'],
            strength: 0.4,
            energyCost: 0.2,
            description: 'Use logic to minimize emotional impact'
        });
        
        this.suppressionMechanisms.set('denial', {
            targetEmotions: ['grief', 'reality_acceptance'],
            strength: 0.8,
            energyCost: 0.4,
            description: 'Refuse to acknowledge emotional reality'
        });
    }

    // Start emotional processing cycle
    startEmotionalProcessing() {
        if (this.processingInterval) return;
        
        const processingRate = this.emotionalStatesConfig.processingRate || 2000;
        this.processingInterval = setInterval(() => {
            this.processEmotionalQueue();
            this.updateEmotionalThreads();
            this.applyEmotionalDecay();
            this.updateStabilityMetrics();
        }, processingRate);
    }

    // Stop emotional processing
    stopEmotionalProcessing() {
        if (this.processingInterval) {
            clearInterval(this.processingInterval);
            this.processingInterval = null;
        }
    }

    // Initialize emotional buffers
    initializeEmotionalBuffers() {
        const bufferTypes = ['input', 'processing', 'output', 'regulation'];
        
        bufferTypes.forEach(type => {
            this.emotionalBuffers.set(type, {
                capacity: 10,
                contents: [],
                overflow: false
            });
        });
    }

    // Execute action on emotional system
    async executeAction(action, parameters = {}) {
        if (!this.isInitialized) {
            throw new Error('EmotionalProcessor not initialized');
        }
        
        switch (action) {
            case 'apply_regulation':
                return this.applyRegulationStrategy(parameters.strategy, parameters.targetEmotion);
                
            case 'trigger_emotion':
                return this.triggerEmotion(parameters.emotion, parameters.intensity);
                
            case 'suppress_emotion':
                return this.suppressEmotion(parameters.emotion, parameters.mechanism);
                
            case 'reset_emotional_state':
                return this.resetEmotionalState();
                
            case 'process_trauma':
                return this.processTrauma(parameters.traumaData);
                
            case 'emotional_catharsis':
                return this.emotionalCatharsis(parameters.targetEmotions);
                
            default:
                throw new Error(`Unknown emotional action: ${action}`);
        }
    }

    // Initialize base emotional state
    initializeEmotionalState() {
        // Use configuration if provided, otherwise use default Alexander Kane state
        const baseState = this.emotionalStatesConfig.baseState || {
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
        
        this.updateDominantEmotionInState(baseState);
        return baseState;
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

    // Process emotional queue
    processEmotionalQueue() {
        const currentTime = Date.now();
        
        // Process queued emotions
        this.processingQueue = this.processingQueue.filter(input => {
            if (!input.processed) {
                this.processEmotionalInput_internal(input);
                input.processed = true;
            }
            
            // Remove expired inputs
            return currentTime - input.timestamp < input.duration;
        });
    }

    // Internal emotional processing
    processEmotionalInput_internal(emotionalInput) {
        // Apply regulation strategies if active
        const regulatedIntensity = this.applyActiveRegulation(emotionalInput);
        
        // Update emotional state
        this.updateEmotionalState(emotionalInput.type, regulatedIntensity);
        
        // Check for triggers
        this.checkEmotionalTriggers(emotionalInput);
        
        // Save to history
        this.saveStateToHistory();
    }

    // Apply active regulation strategies
    applyActiveRegulation(emotionalInput) {
        let regulatedIntensity = emotionalInput.intensity;
        
        this.regulationStrategies.forEach((strategy, name) => {
            if (this.isStrategyActive(strategy)) {
                regulatedIntensity *= (1 - strategy.effectiveness * 0.3);
            }
        });
        
        return Math.max(0.1, regulatedIntensity);
    }

    // Check if regulation strategy is active
    isStrategyActive(strategy) {
        const timeSinceUse = Date.now() - strategy.lastUsed;
        return timeSinceUse > strategy.cooldown;
    }

    // Update emotional state
    updateEmotionalState(emotion, intensity) {
        // Update primary emotion if it exists
        if (this.currentState.primary[emotion] !== undefined) {
            this.currentState.primary[emotion] = Math.max(0, Math.min(1,
                this.currentState.primary[emotion] + (intensity * 0.1)
            ));
        }
        
        // Update secondary emotion if it exists
        if (this.currentState.secondary[emotion] !== undefined) {
            this.currentState.secondary[emotion] = Math.max(0, Math.min(1,
                this.currentState.secondary[emotion] + (intensity * 0.05)
            ));
        }
        
        // Update dominant emotion
        this.updateDominantEmotion();
        
        // Update timestamp
        this.currentState.timestamp = Date.now();
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
        
        // Log thread creation if system log exists
        if (this.consciousness.systemLog) {
            this.consciousness.systemLog.push({
                timestamp: Date.now(),
                level: 'info',
                message: `Emotional processing thread created for ${emotionalInput.type}`,
                category: 'emotional_processing',
                threadId: threadId
            });
        }
        
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
            'joy': 'normal',
            'contentment': 'low'
        };
        
        return priorityMap[emotionType] || 'normal';
    }

    // Get emotional vulnerabilities
    getEmotionalVulnerabilities(emotionType) {
        const vulnerabilityMap = {
            'grief': ['rumination_loop', 'memory_flooding', 'emotional_numbness'],
            'anger': ['explosive_discharge', 'cognitive_narrowing', 'impulse_override'],
            'fear': ['paralysis_cascade', 'hypervigilance', 'avoidance_amplification'],
            'sadness': ['hopelessness_spiral', 'energy_depletion', 'isolation_feedback'],
            'guilt': ['self_punishment_loop', 'shame_cascade', 'perfectionism_trap']
        };
        
        return vulnerabilityMap[emotionType] || ['generic_instability'];
    }

    // Get emotional intervention points
    getEmotionalInterventions(emotionType) {
        const interventionMap = {
            'grief': ['grief_processing', 'memory_integration', 'acceptance_therapy'],
            'anger': ['anger_redirection', 'cognitive_reframing', 'impulse_control'],
            'fear': ['exposure_therapy', 'relaxation_techniques', 'cognitive_restructuring'],
            'sadness': ['behavioral_activation', 'mood_lifting', 'social_connection'],
            'guilt': ['self_forgiveness', 'reality_testing', 'value_clarification']
        };
        
        return interventionMap[emotionType] || ['emotional_regulation'];
    }

    // Update emotional threads
    updateEmotionalThreads() {
        this.emotionalThreads.forEach((thread, threadId) => {
            this.progressEmotionalThread(thread);
            this.checkThreadHealth(thread);
            
            // Remove completed threads
            if (thread.stage === 'completed' || thread.issues.includes('thread_crash')) {
                this.cleanupEmotionalThread(threadId);
            }
        });
    }

    // Progress emotional thread through stages
    progressEmotionalThread(thread) {
        thread.currentStageProgress += 0.1 * thread.processingEfficiency;
        
        if (thread.currentStageProgress >= 1.0) {
            const currentStageIndex = thread.stages.indexOf(thread.stage);
            if (currentStageIndex < thread.stages.length - 1) {
                thread.stage = thread.stages[currentStageIndex + 1];
                thread.currentStageProgress = 0;
            } else {
                thread.stage = 'completed';
            }
        }
        
        // Apply emotional impact based on current stage
        if (thread.stage !== 'completed') {
            const impact = this.calculateEmotionalImpact(thread);
            this.applyEmotionalImpact(impact);
        }
    }

    // Check thread health for issues
    checkThreadHealth(thread) {
        // Check for rumination loops
        if (thread.emotion === 'grief' && thread.stage === 'appraisal' && thread.currentStageProgress > 2.0) {
            if (!thread.issues.includes('rumination_loop')) {
                thread.issues.push('rumination_loop');
                thread.processingEfficiency *= 0.5;
            }
        }
        
        // Check for emotional overflow
        if (thread.intensity > 0.9 && thread.stability < 0.3) {
            if (!thread.issues.includes('emotional_overflow')) {
                thread.issues.push('emotional_overflow');
                thread.coherence *= 0.7;
            }
        }
        
        // Check for processing stagnation
        if (thread.currentStageProgress < 0.1 && Date.now() - thread.startTime > 30000) {
            if (!thread.issues.includes('processing_stagnation')) {
                thread.issues.push('processing_stagnation');
                thread.processingEfficiency *= 0.3;
            }
        }
    }

    // Calculate emotional impact from thread
    calculateEmotionalImpact(thread) {
        const baseImpact = thread.intensity * 0.05;
        const stabilityModifier = Math.max(0.1, thread.stability);
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
            
            // Log dominant emotion change if system log exists
            if (this.consciousness.systemLog) {
                this.consciousness.systemLog.push({
                    timestamp: Date.now(),
                    level: 'info',
                    message: `Dominant emotion changed from ${previousDominant} to ${dominantEmotion}`,
                    category: 'emotional_state_change'
                });
            }
            
            // Trigger narrative events for significant changes if narrative engine exists
            if (this.consciousness.narrativeEngine) {
                this.consciousness.narrativeEngine.checkTriggers('dominant_emotion_change', {
                    previous: previousDominant,
                    current: dominantEmotion,
                    intensity: maxIntensity
                });
            }
        }
    }

    // Apply emotional decay over time
    applyEmotionalDecay() {
        const decayRate = 0.02; // 2% decay per cycle
        
        // Decay primary emotions
        Object.keys(this.currentState.primary).forEach(emotion => {
            this.currentState.primary[emotion] = Math.max(0, 
                this.currentState.primary[emotion] * (1 - decayRate)
            );
        });
        
        // Decay secondary emotions
        Object.keys(this.currentState.secondary).forEach(emotion => {
            this.currentState.secondary[emotion] = Math.max(0, 
                this.currentState.secondary[emotion] * (1 - decayRate * 0.5)
            );
        });
    }

    // Update stability metrics
    updateStabilityMetrics() {
        // Calculate variance in emotional intensities
        const intensities = Object.values(this.currentState.primary);
        const mean = intensities.reduce((a, b) => a + b, 0) / intensities.length;
        this.stabilityMetrics.variance = intensities.reduce((acc, val) => 
            acc + Math.pow(val - mean, 2), 0) / intensities.length;
        
        // Calculate volatility based on recent changes
        if (this.stateHistory.length > 1) {
            const recent = this.stateHistory[this.stateHistory.length - 1];
            const previous = this.stateHistory[this.stateHistory.length - 2];
            
            let totalChange = 0;
            Object.keys(this.currentState.primary).forEach(emotion => {
                totalChange += Math.abs(recent.primary[emotion] - previous.primary[emotion]);
            });
            
            this.stabilityMetrics.volatility = totalChange / Object.keys(this.currentState.primary).length;
        }
        
        // Update coherence and regulation from current state
        this.stabilityMetrics.coherence = this.currentState.coherence;
        this.stabilityMetrics.regulation = this.currentState.regulation;
    }

    // Save current state to history
    saveStateToHistory() {
        this.stateHistory.push(JSON.parse(JSON.stringify(this.currentState)));
        
        // Limit history size
        if (this.stateHistory.length > this.maxHistorySize) {
            this.stateHistory.shift();
        }
    }

    // Check emotional triggers
    checkEmotionalTriggers(emotionalInput) {
        this.triggers.forEach((trigger, name) => {
            if (trigger.emotions.includes(emotionalInput.type) && 
                emotionalInput.intensity > trigger.threshold) {
                
                this.activateTrigger(name, emotionalInput);
            }
        });
    }

    // Activate emotional trigger
    activateTrigger(triggerName, emotionalInput) {
        const trigger = this.triggers.get(triggerName);
        trigger.activationCount++;
        trigger.lastActivated = Date.now();
        
        // Apply trigger effects
        trigger.emotions.forEach(emotion => {
            if (this.currentState.primary[emotion] !== undefined) {
                this.currentState.primary[emotion] = Math.min(1, 
                    this.currentState.primary[emotion] + 0.2
                );
            }
        });
        
        console.log(`Emotional trigger activated: ${triggerName}`);
    }

    // Apply emotional regulation strategies
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
        
        if (this.consciousness.systemLog) {
            this.consciousness.systemLog.push({
                timestamp: Date.now(),
                level: 'info',
                message: `Applied ${strategy} regulation to ${targetEmotion}`,
                category: 'emotional_regulation',
                regulationId: regulationId
            });
        }
        
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

    // Get target reduction amount
    getTargetReduction(strategy, intensity) {
        const reductionFactors = {
            'suppression': 0.8,
            'reappraisal': 0.6,
            'distraction': 0.4,
            'acceptance': 0.3,
            'expression': 0.7,
            'breathing': 0.5,
            'mindfulness': 0.4
        };
        
        return (reductionFactors[strategy] || 0.5) * intensity;
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
        
        if (this.consciousness.systemLog) {
            this.consciousness.systemLog.push({
                timestamp: Date.now(),
                level: 'info',
                message: `Regulation strategy ${regulation.strategy} completed for ${regulation.targetEmotion}`,
                category: 'regulation_complete',
                regulationId: regulation.id,
                effectiveness: regulation.effectiveness
            });
        }
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
                if (this.consciousness.systemLog) {
                    this.consciousness.systemLog.push({
                        timestamp: Date.now(),
                        level: 'warning',
                        message: 'Suppression may cause emotional rebound',
                        category: 'regulation_side_effect'
                    });
                }
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
        
        const intervention = this.getInterventionDetails(interventionType);
        if (!intervention) {
            return { success: false, message: 'Unknown intervention type' };
        }
        
        // Validate player solution
        const isValidSolution = this.validateEmotionalSolution(thread, intervention, playerSolution);
        if (!isValidSolution.valid) {
            return {
                success: false,
                message: 'Invalid solution',
                hints: this.generateEmotionalHints(intervention.requirements, playerSolution)
            };
        }
        
        // Apply intervention effects
        this.applyInterventionEffects(thread, intervention);
        
        // Resolve specific issues
        thread.issues = thread.issues.filter(issue => 
            !this.isIssueResolvedByEmotionalIntervention(issue, intervention)
        );
        
        // Improve thread health
        thread.stability = Math.min(1.0, thread.stability + intervention.stabilityBonus);
        thread.processingEfficiency = Math.min(1.0, thread.processingEfficiency + intervention.efficiencyBonus);
        
        if (this.consciousness.systemLog) {
            this.consciousness.systemLog.push({
                timestamp: Date.now(),
                level: 'info',
                message: `Emotional intervention ${interventionType} applied to ${thread.emotion} thread`,
                category: 'emotional_intervention',
                threadId: threadId,
                intervention: interventionType
            });
        }
        
        return {
            success: true,
            message: `${interventionType} applied successfully`,
            threadHealth: {
                stability: thread.stability,
                efficiency: thread.processingEfficiency,
                remainingIssues: thread.issues.length
            }
        };
    }

    // Get intervention details
    getInterventionDetails(interventionType) {
        const interventions = {
            'Grief Processing Optimization': {
                name: 'Grief Processing Optimization',
                description: 'Optimize grief processing pathways',
                requirements: ['identify_grief_stage', 'implement_processing_flow'],
                stabilityBonus: 0.3,
                efficiencyBonus: 0.2,
                targetIssues: ['recursive_loop', 'memory_overflow', 'processing_stall']
            },
            'Recursive Loop Breaking': {
                name: 'Recursive Loop Breaking',
                description: 'Break recursive emotional loops',
                requirements: ['trace_recursion_path', 'implement_exit_condition'],
                stabilityBonus: 0.4,
                efficiencyBonus: 0.3,
                targetIssues: ['recursive_loop']
            },
            'Anger Regulation Module': {
                name: 'Anger Regulation Module',
                description: 'Install anger regulation system',
                requirements: ['analyze_anger_triggers', 'implement_regulation_circuit'],
                stabilityBonus: 0.2,
                efficiencyBonus: 0.4,
                targetIssues: ['priority_escalation', 'resource_monopolization']
            },
            'Resource Conflict Resolution': {
                name: 'Resource Conflict Resolution',
                description: 'Resolve emotional resource conflicts',
                requirements: ['identify_resource_conflicts', 'implement_sharing_protocol'],
                stabilityBonus: 0.3,
                efficiencyBonus: 0.2,
                targetIssues: ['resource_monopolization', 'system_disruption']
            },
            'Threat Assessment Calibration': {
                name: 'Threat Assessment Calibration',
                description: 'Recalibrate threat detection systems',
                requirements: ['analyze_false_positives', 'adjust_sensitivity_threshold'],
                stabilityBonus: 0.2,
                efficiencyBonus: 0.3,
                targetIssues: ['false_positive_cascade', 'threat_detection_overflow']
            },
            'Panic Prevention System': {
                name: 'Panic Prevention System',
                description: 'Install panic prevention mechanisms',
                requirements: ['identify_panic_triggers', 'implement_prevention_protocol'],
                stabilityBonus: 0.4,
                efficiencyBonus: 0.1,
                targetIssues: ['system_freeze', 'threat_detection_overflow']
            }
        };
        
        return interventions[interventionType];
    }

    // Validate emotional solution
    validateEmotionalSolution(thread, intervention, playerSolution) {
        const requiredKeywords = {
            'identify_grief_stage': ['denial', 'anger', 'bargaining', 'depression', 'acceptance'],
            'implement_processing_flow': ['process', 'flow', 'stage', 'transition'],
            'trace_recursion_path': ['loop', 'recursive', 'repeat', 'cycle'],
            'implement_exit_condition': ['exit', 'break', 'condition', 'stop'],
            'analyze_anger_triggers': ['trigger', 'cause', 'source', 'provoke'],
            'implement_regulation_circuit': ['regulate', 'control', 'manage', 'circuit'],
            'identify_resource_conflicts': ['conflict', 'resource', 'compete', 'share'],
            'implement_sharing_protocol': ['share', 'allocate', 'distribute', 'protocol'],
            'analyze_false_positives': ['false', 'positive', 'incorrect', 'wrong'],
            'adjust_sensitivity_threshold': ['threshold', 'sensitivity', 'adjust', 'calibrate'],
            'identify_panic_triggers': ['panic', 'trigger', 'cause', 'fear'],
            'implement_prevention_protocol': ['prevent', 'protocol', 'stop', 'avoid']
        };
        
        const solution = playerSolution.toLowerCase();
        let foundRequirements = 0;
        
        intervention.requirements.forEach(requirement => {
            const keywords = requiredKeywords[requirement] || [];
            const hasKeyword = keywords.some(keyword => solution.includes(keyword));
            if (hasKeyword) foundRequirements++;
        });
        
        return {
            valid: foundRequirements >= intervention.requirements.length * 0.7, // 70% of requirements
            foundRequirements,
            totalRequirements: intervention.requirements.length
        };
    }

    // Apply intervention effects
    applyInterventionEffects(thread, intervention) {
        // Improve thread metrics
        thread.stability += intervention.stabilityBonus;
        thread.processingEfficiency += intervention.efficiencyBonus;
        
        // Add positive processing markers
        thread.interventionsApplied = thread.interventionsApplied || [];
        thread.interventionsApplied.push({
            name: intervention.name,
            timestamp: Date.now(),
            effectiveness: intervention.stabilityBonus + intervention.efficiencyBonus
        });
    }

    // Check if issue is resolved by intervention
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

    // Apply regulation strategy
    applyRegulationStrategy(strategyName, targetEmotion) {
        const strategy = this.regulationStrategies.get(strategyName);
        if (!strategy || !this.isStrategyActive(strategy)) {
            return { success: false, message: 'Strategy not available' };
        }
        
        strategy.lastUsed = Date.now();
        
        // Apply regulation effect
        if (this.currentState.primary[targetEmotion] !== undefined) {
            this.currentState.primary[targetEmotion] = Math.max(0,
                this.currentState.primary[targetEmotion] * (1 - strategy.effectiveness * 0.3)
            );
        }
        
        // Improve overall regulation
        this.currentState.regulation = Math.min(1,
            this.currentState.regulation + strategy.effectiveness * 0.1
        );
        
        return {
            success: true,
            message: `Applied ${strategyName} to ${targetEmotion}`,
            effectiveness: strategy.effectiveness
        };
    }

    // Trigger specific emotion
    triggerEmotion(emotion, intensity) {
        return this.processEmotionalInput({
            type: emotion,
            intensity: intensity,
            source: 'debug_trigger',
            duration: 5000
        });
    }

    // Suppress emotion using mechanism
    suppressEmotion(emotion, mechanism) {
        const suppressionMech = this.suppressionMechanisms.get(mechanism);
        if (!suppressionMech || !suppressionMech.targetEmotions.includes(emotion)) {
            return { success: false, message: 'Invalid suppression mechanism' };
        }
        
        // Apply suppression
        if (this.currentState.primary[emotion] !== undefined) {
            this.currentState.primary[emotion] = Math.max(0,
                this.currentState.primary[emotion] * (1 - suppressionMech.strength)
            );
        }
        
        // Apply energy cost
        this.currentState.regulation = Math.max(0,
            this.currentState.regulation - suppressionMech.energyCost
        );
        
        return {
            success: true,
            message: `Suppressed ${emotion} using ${mechanism}`,
            energyCost: suppressionMech.energyCost
        };
    }

    // Reset emotional state
    resetEmotionalState() {
        this.currentState = this.initializeEmotionalState();
        this.emotionalThreads.clear();
        this.processingQueue = [];
        
        return {
            success: true,
            message: 'Emotional state reset to baseline'
        };
    }

    // Process trauma
    processTrauma(traumaData) {
        const traumaInput = {
            type: 'trauma_processing',
            intensity: traumaData.intensity || 0.8,
            source: 'trauma_therapy',
            duration: 30000,
            triggers: traumaData.triggers || []
        };
        
        return this.processEmotionalInput(traumaInput);
    }

    // Emotional catharsis
    emotionalCatharsis(targetEmotions) {
        targetEmotions.forEach(emotion => {
            if (this.currentState.primary[emotion] !== undefined) {
                this.currentState.primary[emotion] = Math.max(0,
                    this.currentState.primary[emotion] * 0.3
                );
            }
        });
        
        // Improve regulation after catharsis
        this.currentState.regulation = Math.min(1,
            this.currentState.regulation + 0.2
        );
        
        return {
            success: true,
            message: 'Emotional catharsis completed',
            processedEmotions: targetEmotions
        };
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

    // Get state for consciousness instance
    getState() {
        return {
            currentState: this.getCurrentState(),
            stabilityMetrics: this.stabilityMetrics,
            activeThreads: this.emotionalThreads.size,
            processingQueueSize: this.processingQueue.length,
            availableStrategies: Array.from(this.regulationStrategies.keys()),
            isInitialized: this.isInitialized
        };
    }

    // Capture state for save/restore
    captureState() {
        return {
            currentState: this.currentState,
            stateHistory: this.stateHistory,
            emotionalThreads: Array.from(this.emotionalThreads.entries()),
            processingQueue: this.processingQueue,
            stabilityMetrics: this.stabilityMetrics,
            triggers: Array.from(this.triggers.entries()),
            suppressionMechanisms: Array.from(this.suppressionMechanisms.entries()),
            regulationStrategies: Array.from(this.regulationStrategies.entries()),
            isInitialized: this.isInitialized
        };
    }

    // Restore state from capture
    restoreState(capturedState) {
        if (!capturedState) return false;
        
        this.currentState = capturedState.currentState || this.currentState;
        this.stateHistory = capturedState.stateHistory || [];
        this.emotionalThreads = new Map(capturedState.emotionalThreads || []);
        this.processingQueue = capturedState.processingQueue || [];
        this.stabilityMetrics = capturedState.stabilityMetrics || this.stabilityMetrics;
        this.triggers = new Map(capturedState.triggers || []);
        this.suppressionMechanisms = new Map(capturedState.suppressionMechanisms || []);
        this.regulationStrategies = new Map(capturedState.regulationStrategies || []);
        this.isInitialized = capturedState.isInitialized || false;
        
        return true;
    }

    // System tick for consciousness instance
    async tick() {
        const updates = [];
        
        // Process emotional queue
        this.processEmotionalQueue();
        
        // Update threads
        this.updateEmotionalThreads();
        
        // Apply decay
        this.applyEmotionalDecay();
        
        // Update metrics
        this.updateStabilityMetrics();
        
        // Check for significant changes
        if (this.stateHistory.length > 1) {
            const current = this.currentState;
            const previous = this.stateHistory[this.stateHistory.length - 1];
            
            // Check for dominant emotion change
            if (current.dominant !== previous.dominant) {
                updates.push({
                    type: 'dominant_emotion_change',
                    from: previous.dominant,
                    to: current.dominant,
                    timestamp: Date.now()
                });
            }
            
            // Check for regulation breakdown
            if (current.regulation < 0.3 && previous.regulation >= 0.3) {
                updates.push({
                    type: 'emotional_regulation_breakdown',
                    regulationLevel: current.regulation,
                    timestamp: Date.now()
                });
            }
        }
        
        return updates;
    }

    // Cleanup emotional thread
    cleanupEmotionalThread(threadId) {
        this.emotionalThreads.delete(threadId);
    }

    // Shutdown EmotionalProcessor
    shutdown() {
        this.stopEmotionalProcessing();
        this.emotionalThreads.clear();
        this.processingQueue = [];
        this.stateHistory = [];
        this.isInitialized = false;
        console.log('EmotionalProcessor shutdown complete');
    }
}

export default EmotionalProcessor;