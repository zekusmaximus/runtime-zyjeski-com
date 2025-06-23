// ProcessManager.js - Handles dynamic process creation, lifecycle, and optimization

class ProcessManager {
    constructor(consciousnessInstance) {
        this.consciousness = consciousnessInstance;
        this.processes = new Map();
        this.processHistory = [];
        this.performanceMetrics = {
            totalProcesses: 0,
            averageLifetime: 0,
            crashRate: 0,
            optimizationAttempts: 0
        };
        this.debugHooks = new Map();
        this.processIdCounter = 1000;
    }

    // Create new process from emotional state
    createProcess(emotionData, priority = 'normal') {
        const processId = `proc_${this.processIdCounter++}`;
        const process = this.generateProcessFromEmotion(emotionData, processId, priority);
        
        this.processes.set(processId, process);
        this.performanceMetrics.totalProcesses++;
        
        // Log creation for debugging interface
        this.consciousness.systemLog.push({
            timestamp: Date.now(),
            level: 'info',
            message: `Process ${processId} spawned: ${process.name}`,
            category: 'process_management',
            processId: processId
        });

        // Trigger narrative events if process creation is significant
        if (process.emotionalImpact > 0.7) {
            this.consciousness.narrativeEngine.checkTriggers('process_created', {
                processType: process.type,
                emotionType: emotionData.type,
                intensity: emotionData.intensity
            });
        }

        return processId;
    }

    // Generate realistic process from emotion
    generateProcessFromEmotion(emotion, processId, priority) {
        const processTemplates = {
            grief: {
                name: 'grief_processor',
                type: 'emotional_processing',
                baseMemoryUsage: 150 + (emotion.intensity * 100),
                baseCpuUsage: 30 + (emotion.intensity * 40),
                threadCount: Math.ceil(emotion.intensity * 3),
                priority: 'high',
                vulnerabilities: ['memory_leak', 'infinite_loop', 'stack_overflow'],
                behaviors: ['memory_accumulation', 'recursive_thinking', 'resource_hoarding']
            },
            anxiety: {
                name: 'threat_scanner',
                type: 'background_monitoring',
                baseMemoryUsage: 80 + (emotion.intensity * 60),
                baseCpuUsage: 15 + (emotion.intensity * 25),
                threadCount: Math.ceil(emotion.intensity * 5),
                priority: 'high',
                vulnerabilities: ['runaway_cpu', 'thread_explosion', 'false_positive_cascade'],
                behaviors: ['continuous_scanning', 'resource_consumption', 'alert_generation']
            },
            love: {
                name: 'attachment_handler',
                type: 'relationship_processing',
                baseMemoryUsage: 100 + (emotion.intensity * 80),
                baseCpuUsage: 20 + (emotion.intensity * 30),
                threadCount: Math.ceil(emotion.intensity * 2),
                priority: 'normal',
                vulnerabilities: ['dependency_injection', 'circular_reference', 'resource_sharing_conflict'],
                behaviors: ['memory_sharing', 'priority_elevation', 'resource_dedication']
            },
            anger: {
                name: 'conflict_resolver',
                type: 'reactive_processing',
                baseMemoryUsage: 120 + (emotion.intensity * 90),
                baseCpuUsage: 50 + (emotion.intensity * 35),
                threadCount: Math.ceil(emotion.intensity * 4),
                priority: 'critical',
                vulnerabilities: ['resource_starvation', 'priority_inversion', 'system_overload'],
                behaviors: ['resource_competition', 'priority_escalation', 'system_disruption']
            },
            hope: {
                name: 'future_simulator',
                type: 'predictive_processing',
                baseMemoryUsage: 90 + (emotion.intensity * 70),
                baseCpuUsage: 25 + (emotion.intensity * 20),
                threadCount: Math.ceil(emotion.intensity * 2),
                priority: 'low',
                vulnerabilities: ['speculation_overflow', 'unrealistic_projection', 'resource_waste'],
                behaviors: ['forward_planning', 'resource_allocation', 'optimistic_caching']
            }
        };

        const template = processTemplates[emotion.type] || processTemplates.anxiety;
        
        return {
            id: processId,
            name: template.name,
            type: template.type,
            emotionSource: emotion.type,
            emotionalImpact: emotion.intensity,
            
            // Resource usage
            memoryUsage: template.baseMemoryUsage * (0.8 + Math.random() * 0.4),
            cpuUsage: template.baseCpuUsage * (0.8 + Math.random() * 0.4),
            threadCount: template.threadCount,
            priority: priority || template.priority,
            
            // Process state
            status: 'running',
            startTime: Date.now(),
            lastActivity: Date.now(),
            lifetime: 0,
            
            // Error handling
            vulnerabilities: [...template.vulnerabilities],
            currentIssues: [],
            crashCount: 0,
            
            // Behavioral patterns
            behaviors: [...template.behaviors],
            behaviorTriggers: this.generateBehaviorTriggers(template.behaviors),
            
            // Debugging info
            debuggable: true,
            interventionPoints: this.generateInterventionPoints(template.type),
            
            // Performance
            effectivenessScore: 0.5 + (Math.random() * 0.3),
            optimizationLevel: 0,
            
            // Relationships
            dependencies: [],
            conflicts: [],
            sharedResources: []
        };
    }

    // Generate behavior triggers for realistic process behavior
    generateBehaviorTriggers(behaviors) {
        const triggers = {};
        
        behaviors.forEach(behavior => {
            switch(behavior) {
                case 'memory_accumulation':
                    triggers[behavior] = {
                        condition: 'emotional_spike',
                        threshold: 0.6,
                        effect: 'increase_memory_usage',
                        multiplier: 1.3
                    };
                    break;
                case 'continuous_scanning':
                    triggers[behavior] = {
                        condition: 'stress_level',
                        threshold: 0.4,
                        effect: 'increase_cpu_usage',
                        multiplier: 1.5
                    };
                    break;
                case 'resource_competition':
                    triggers[behavior] = {
                        condition: 'conflict_detected',
                        threshold: 0.3,
                        effect: 'escalate_priority',
                        multiplier: 2.0
                    };
                    break;
                case 'forward_planning':
                    triggers[behavior] = {
                        condition: 'stability_increase',
                        threshold: 0.5,
                        effect: 'optimize_resource_usage',
                        multiplier: 0.8
                    };
                    break;
            }
        });
        
        return triggers;
    }

    // Generate intervention points for player debugging
    generateInterventionPoints(processType) {
        const interventionMaps = {
            emotional_processing: [
                {
                    name: 'Memory Optimization',
                    description: 'Reduce memory leaks by processing and releasing old grief data',
                    difficulty: 'medium',
                    effect: 'reduce_memory_usage',
                    requirements: ['identify_memory_leaks', 'implement_cleanup']
                },
                {
                    name: 'Recursive Loop Breaking',
                    description: 'Add exit conditions to prevent infinite grief cycles',
                    difficulty: 'hard',
                    effect: 'stabilize_cpu_usage',
                    requirements: ['trace_recursion', 'add_exit_conditions']
                }
            ],
            background_monitoring: [
                {
                    name: 'Threshold Tuning',
                    description: 'Adjust threat detection sensitivity to reduce false positives',
                    difficulty: 'easy',
                    effect: 'reduce_cpu_usage',
                    requirements: ['analyze_false_positives', 'adjust_thresholds']
                },
                {
                    name: 'Thread Pool Management',
                    description: 'Limit scanner threads to prevent resource exhaustion',
                    difficulty: 'medium',
                    effect: 'stabilize_system',
                    requirements: ['implement_thread_pool', 'set_limits']
                }
            ],
            relationship_processing: [
                {
                    name: 'Dependency Injection Fix',
                    description: 'Resolve circular dependencies in attachment patterns',
                    difficulty: 'hard',
                    effect: 'improve_stability',
                    requirements: ['map_dependencies', 'refactor_architecture']
                },
                {
                    name: 'Resource Sharing Optimization',
                    description: 'Implement fair resource allocation between relationships',
                    difficulty: 'medium',
                    effect: 'improve_performance',
                    requirements: ['analyze_resource_usage', 'implement_scheduler']
                }
            ]
        };
        
        return interventionMaps[processType] || [];
    }

    // Update all processes during system tick
    updateProcesses(deltaTime, systemState) {
        const activeProcesses = Array.from(this.processes.values()).filter(p => p.status === 'running');
        
        activeProcesses.forEach(process => {
            this.updateSingleProcess(process, deltaTime, systemState);
            this.checkProcessHealth(process);
            this.triggerBehaviors(process, systemState);
        });
        
        this.updatePerformanceMetrics();
        this.cleanupDeadProcesses();
    }

    // Update individual process
    updateSingleProcess(process, deltaTime, systemState) {
        process.lifetime += deltaTime;
        process.lastActivity = Date.now();
        
        // Apply behavioral modifiers
        Object.entries(process.behaviorTriggers).forEach(([behavior, trigger]) => {
            if (this.checkTriggerCondition(trigger, systemState)) {
                this.applyBehaviorEffect(process, trigger);
            }
        });
        
        // Natural resource fluctuation
        process.cpuUsage *= (0.95 + Math.random() * 0.1);
        process.memoryUsage *= (0.98 + Math.random() * 0.04);
        
        // Effectiveness decay over time without optimization
        if (process.optimizationLevel === 0) {
            process.effectivenessScore *= 0.999;
        }
    }

    // Check if behavior trigger conditions are met
    checkTriggerCondition(trigger, systemState) {
        switch(trigger.condition) {
            case 'emotional_spike':
                return systemState.currentEmotionalIntensity > trigger.threshold;
            case 'stress_level':
                return systemState.stressLevel > trigger.threshold;
            case 'conflict_detected':
                return systemState.activeConflicts > 0;
            case 'stability_increase':
                return systemState.stabilityTrend > trigger.threshold;
            default:
                return false;
        }
    }

    // Apply behavior effect to process
    applyBehaviorEffect(process, trigger) {
        switch(trigger.effect) {
            case 'increase_memory_usage':
                process.memoryUsage *= trigger.multiplier;
                break;
            case 'increase_cpu_usage':
                process.cpuUsage *= trigger.multiplier;
                break;
            case 'escalate_priority':
                if (process.priority === 'low') process.priority = 'normal';
                else if (process.priority === 'normal') process.priority = 'high';
                else if (process.priority === 'high') process.priority = 'critical';
                break;
            case 'optimize_resource_usage':
                process.memoryUsage *= trigger.multiplier;
                process.cpuUsage *= trigger.multiplier;
                break;
        }
    }

    // Check process health and generate issues
    checkProcessHealth(process) {
        const issues = [];
        
        // Memory leak detection
        if (process.memoryUsage > 500 && process.behaviors.includes('memory_accumulation')) {
            issues.push({
                type: 'memory_leak',
                severity: 'high',
                description: `${process.name} is accumulating excessive memory`,
                debuggable: true
            });
        }
        
        // CPU overuse detection
        if (process.cpuUsage > 80) {
            issues.push({
                type: 'high_cpu_usage',
                severity: 'medium',
                description: `${process.name} is consuming excessive CPU`,
                debuggable: true
            });
        }
        
        // Thread explosion detection
        if (process.threadCount > 10) {
            issues.push({
                type: 'thread_explosion',
                severity: 'critical',
                description: `${process.name} has spawned too many threads`,
                debuggable: true
            });
        }
        
        // Update process issues
        process.currentIssues = issues;
        
        // Check for process crash conditions
        if (issues.some(issue => issue.severity === 'critical')) {
            this.handleProcessCrash(process);
        }
    }

    // Handle process crash
    handleProcessCrash(process) {
        process.status = 'crashed';
        process.crashCount++;
        this.performanceMetrics.crashRate = 
            (this.performanceMetrics.crashRate * this.performanceMetrics.totalProcesses + 1) / 
            (this.performanceMetrics.totalProcesses + 1);
        
        this.consciousness.systemLog.push({
            timestamp: Date.now(),
            level: 'error',
            message: `Process ${process.id} (${process.name}) has crashed`,
            category: 'process_crash',
            processId: process.id,
            issues: process.currentIssues
        });
        
        // Trigger narrative response to crash
        this.consciousness.narrativeEngine.checkTriggers('process_crashed', {
            processType: process.type,
            emotionType: process.emotionSource,
            crashCount: process.crashCount
        });
    }

    // Player debugging interventions
    applyPlayerIntervention(processId, interventionType, playerSolution) {
        const process = this.processes.get(processId);
        if (!process || !process.debuggable) {
            return { success: false, message: 'Process not found or not debuggable' };
        }
        
        const intervention = process.interventionPoints.find(i => i.name === interventionType);
        if (!intervention) {
            return { success: false, message: 'Intervention type not available' };
        }
        
        // Validate player solution meets requirements
        const solutionScore = this.validatePlayerSolution(playerSolution, intervention.requirements);
        
        if (solutionScore > 0.6) {
            this.applySuccessfulIntervention(process, intervention, solutionScore);
            return { 
                success: true, 
                message: 'Intervention successful',
                effectivenessScore: solutionScore,
                improvements: this.getInterventionEffects(process, intervention)
            };
        } else {
            return { 
                success: false, 
                message: 'Solution does not meet requirements',
                hints: this.generateHints(intervention.requirements, playerSolution)
            };
        }
    }

    // Validate player debugging solution
    validatePlayerSolution(solution, requirements) {
        let score = 0;
        const totalRequirements = requirements.length;
        
        requirements.forEach(requirement => {
            switch(requirement) {
                case 'identify_memory_leaks':
                    if (solution.toLowerCase().includes('memory') && 
                        (solution.toLowerCase().includes('leak') || solution.toLowerCase().includes('cleanup'))) {
                        score += 1;
                    }
                    break;
                case 'implement_cleanup':
                    if (solution.toLowerCase().includes('cleanup') || 
                        solution.toLowerCase().includes('free') || 
                        solution.toLowerCase().includes('release')) {
                        score += 1;
                    }
                    break;
                case 'trace_recursion':
                    if (solution.toLowerCase().includes('recursion') || 
                        solution.toLowerCase().includes('loop') || 
                        solution.toLowerCase().includes('cycle')) {
                        score += 1;
                    }
                    break;
                case 'add_exit_conditions':
                    if (solution.toLowerCase().includes('exit') || 
                        solution.toLowerCase().includes('condition') || 
                        solution.toLowerCase().includes('break')) {
                        score += 1;
                    }
                    break;
                // Add more requirement validations as needed
            }
        });
        
        return score / totalRequirements;
    }

    // Apply successful player intervention
    applySuccessfulIntervention(process, intervention, effectivenessScore) {
        process.optimizationLevel++;
        this.performanceMetrics.optimizationAttempts++;
        
        switch(intervention.effect) {
            case 'reduce_memory_usage':
                process.memoryUsage *= (1 - effectivenessScore * 0.5);
                break;
            case 'stabilize_cpu_usage':
                process.cpuUsage *= (1 - effectivenessScore * 0.3);
                break;
            case 'reduce_cpu_usage':
                process.cpuUsage *= (1 - effectivenessScore * 0.4);
                break;
            case 'stabilize_system':
                process.threadCount = Math.max(1, Math.floor(process.threadCount * (1 - effectivenessScore * 0.6)));
                break;
            case 'improve_stability':
                process.effectivenessScore = Math.min(1.0, process.effectivenessScore + effectivenessScore * 0.3);
                break;
            case 'improve_performance':
                process.effectivenessScore = Math.min(1.0, process.effectivenessScore + effectivenessScore * 0.2);
                process.memoryUsage *= (1 - effectivenessScore * 0.2);
                break;
        }
        
        // Clear related issues
        process.currentIssues = process.currentIssues.filter(issue => 
            !this.isIssueResolvedByIntervention(issue, intervention)
        );
        
        // Log successful intervention
        this.consciousness.systemLog.push({
            timestamp: Date.now(),
            level: 'info',
            message: `Player successfully applied ${intervention.name} to ${process.name}`,
            category: 'player_intervention',
            processId: process.id,
            effectivenessScore: effectivenessScore
        });
    }

    // Check if issue is resolved by intervention
    isIssueResolvedByIntervention(issue, intervention) {
        const resolutionMap = {
            'Memory Optimization': ['memory_leak'],
            'Recursive Loop Breaking': ['high_cpu_usage', 'infinite_loop'],
            'Threshold Tuning': ['high_cpu_usage', 'false_positive_cascade'],
            'Thread Pool Management': ['thread_explosion'],
            'Dependency Injection Fix': ['circular_reference'],
            'Resource Sharing Optimization': ['resource_sharing_conflict']
        };
        
        const resolvedIssues = resolutionMap[intervention.name] || [];
        return resolvedIssues.includes(issue.type);
    }

    // Get current system resource usage
    getSystemResourceUsage() {
        const activeProcesses = Array.from(this.processes.values()).filter(p => p.status === 'running');
        
        return {
            totalMemoryUsage: activeProcesses.reduce((sum, p) => sum + p.memoryUsage, 0),
            totalCpuUsage: activeProcesses.reduce((sum, p) => sum + p.cpuUsage, 0),
            totalThreads: activeProcesses.reduce((sum, p) => sum + p.threadCount, 0),
            activeProcessCount: activeProcesses.length,
            criticalProcessCount: activeProcesses.filter(p => p.priority === 'critical').length,
            issueCount: activeProcesses.reduce((sum, p) => sum + p.currentIssues.length, 0)
        };
    }

    // Update performance metrics
    updatePerformanceMetrics() {
        const activeProcesses = Array.from(this.processes.values()).filter(p => p.status === 'running');
        
        if (activeProcesses.length > 0) {
            this.performanceMetrics.averageLifetime = 
                activeProcesses.reduce((sum, p) => sum + p.lifetime, 0) / activeProcesses.length;
        }
    }

    // Clean up dead processes
    cleanupDeadProcesses() {
        Array.from(this.processes.entries()).forEach(([id, process]) => {
            if (process.status === 'crashed' && Date.now() - process.lastActivity > 30000) {
                this.processes.delete(id);
                this.processHistory.push({
                    id: process.id,
                    name: process.name,
                    type: process.type,
                    lifetime: process.lifetime,
                    crashCount: process.crashCount,
                    optimizationLevel: process.optimizationLevel,
                    finalEffectiveness: process.effectivenessScore,
                    endTime: Date.now()
                });
            }
        });
    }

    // Get processes available for debugging
    getDebuggableProcesses() {
        return Array.from(this.processes.values())
            .filter(p => p.debuggable && p.currentIssues.length > 0)
            .map(p => ({
                id: p.id,
                name: p.name,
                type: p.type,
                emotionSource: p.emotionSource,
                issues: p.currentIssues,
                interventionPoints: p.interventionPoints,
                resourceUsage: {
                    memory: p.memoryUsage,
                    cpu: p.cpuUsage,
                    threads: p.threadCount
                },
                priority: p.priority,
                effectivenessScore: p.effectivenessScore
            }));
    }

    // Generate debugging hints
    generateHints(requirements, playerSolution) {
        const hints = [];
        
        requirements.forEach(requirement => {
            switch(requirement) {
                case 'identify_memory_leaks':
                    if (!playerSolution.toLowerCase().includes('memory')) {
                        hints.push('Consider what happens to data that accumulates over time');
                    }
                    break;
                case 'implement_cleanup':
                    if (!playerSolution.toLowerCase().includes('cleanup')) {
                        hints.push('Think about how to release resources that are no longer needed');
                    }
                    break;
                case 'trace_recursion':
                    if (!playerSolution.toLowerCase().includes('recursion')) {
                        hints.push('Look for patterns that repeat themselves indefinitely');
                    }
                    break;
            }
        });
        
        return hints;
    }

    // Get comprehensive process data for frontend
    getProcessDataForFrontend() {
        const processes = Array.from(this.processes.values()).map(p => ({
            id: p.id,
            name: p.name,
            type: p.type,
            status: p.status,
            emotionSource: p.emotionSource,
            resourceUsage: {
                memory: Math.round(p.memoryUsage),
                cpu: Math.round(p.cpuUsage),
                threads: p.threadCount
            },
            priority: p.priority,
            lifetime: p.lifetime,
            issues: p.currentIssues,
            debuggable: p.debuggable,
            effectivenessScore: p.effectivenessScore,
            optimizationLevel: p.optimizationLevel
        }));

        return {
            processes: processes,
            systemUsage: this.getSystemResourceUsage(),
            metrics: this.performanceMetrics,            debuggableCount: processes.filter(p => p.debuggable && p.issues.length > 0).length
        };
    }
}

export default ProcessManager;