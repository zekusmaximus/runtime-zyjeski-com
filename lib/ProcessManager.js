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
        this.isInitialized = false;
        this.baseProcesses = [];
        this.tickInterval = null;
    }

    // Initialize ProcessManager with base processes
    async initialize(baseProcesses = []) {
        try {
            this.baseProcesses = baseProcesses;
            
            // Start system tick for process updates
            this.startSystemTick();
            
            // Create initial base processes if provided
            if (baseProcesses && baseProcesses.length > 0) {
                for (const processConfig of baseProcesses) {
                    await this.createBaseProcess(processConfig);
                }
            }
            
            this.isInitialized = true;
            console.log(`ProcessManager initialized with ${this.processes.size} base processes`);
            
            return true;
        } catch (error) {
            console.error('ProcessManager initialization failed:', error);
            throw error;
        }
    }

    // Create a base process from configuration
    async createBaseProcess(processConfig) {
        const processId = `base_${this.processIdCounter++}`;
        
        const process = {
            id: processId,
            name: processConfig.name || 'unnamed_process',
            type: processConfig.type || 'background',
            status: 'running',
            priority: processConfig.priority || 'normal',
            
            // Resource usage
            memoryUsage: processConfig.memoryUsage || 50,
            cpuUsage: processConfig.cpuUsage || 10,
            threadCount: processConfig.threadCount || 1,
            
            // Lifecycle
            lifetime: 0,
            lastActivity: Date.now(),
            crashCount: 0,
            
            // Emotional context
            emotionSource: processConfig.emotionSource || null,
            emotionalImpact: processConfig.emotionalImpact || 0.0,
            
            // Debug information
            debuggable: processConfig.debuggable !== false,
            currentIssues: processConfig.issues || [],
            interventionPoints: processConfig.interventionPoints || [],
            
            // Performance
            effectivenessScore: processConfig.effectivenessScore || 1.0,
            optimizationLevel: 0,
            
            // Configuration
            config: processConfig
        };
        
        this.processes.set(processId, process);
        this.performanceMetrics.totalProcesses++;
        
        return processId;
    }

    // Start system tick for process lifecycle management
    startSystemTick() {
        if (this.tickInterval) return;
        
        const tickRate = this.consciousness.config?.tickRate || 1000;
        this.tickInterval = setInterval(() => {
            this.updateProcesses();
        }, tickRate);
    }

    // Stop system tick
    stopSystemTick() {
        if (this.tickInterval) {
            clearInterval(this.tickInterval);
            this.tickInterval = null;
        }
    }

    // Update all processes
    updateProcesses() {
        const now = Date.now();
        
        for (const [id, process] of this.processes) {
            if (process.status === 'running') {
                // Update lifetime
                process.lifetime += 1;
                
                // Simulate natural process evolution
                this.evolveProcess(process);
                
                // Check for issues
                this.checkProcessHealth(process);
                
                // Update last activity
                process.lastActivity = now;
            }
        }
        
        // Clean up dead processes
        this.cleanupDeadProcesses();
        
        // Update metrics
        this.updatePerformanceMetrics();
    }

    // Evolve process over time
    evolveProcess(process) {
        // Processes naturally accumulate minor inefficiencies
        if (Math.random() < 0.01) {
            process.memoryUsage += Math.random() * 5;
        }
        
        // Some processes become more efficient over time
        if (Math.random() < 0.005 && process.effectivenessScore < 1.5) {
            process.effectivenessScore += 0.01;
        }
        
        // Random issue generation for debugging scenarios
        if (Math.random() < 0.001 && process.debuggable && process.currentIssues.length < 3) {
            this.injectRandomIssue(process);
        }
    }

    // Check process health and generate issues
    checkProcessHealth(process) {
        // Memory leak detection
        if (process.memoryUsage > 200 && !process.currentIssues.some(i => i.type === 'memory_leak')) {
            process.currentIssues.push({
                type: 'memory_leak',
                severity: 'medium',
                description: `Process ${process.name} is consuming excessive memory`,
                timestamp: Date.now()
            });
        }
        
        // CPU overuse detection
        if (process.cpuUsage > 80 && !process.currentIssues.some(i => i.type === 'cpu_overuse')) {
            process.currentIssues.push({
                type: 'cpu_overuse',
                severity: 'high',
                description: `Process ${process.name} is using too much CPU`,
                timestamp: Date.now()
            });
        }
        
        // Thread explosion detection
        if (process.threadCount > 10 && !process.currentIssues.some(i => i.type === 'thread_explosion')) {
            process.currentIssues.push({
                type: 'thread_explosion',
                severity: 'critical',
                description: `Process ${process.name} has spawned too many threads`,
                timestamp: Date.now()
            });
        }
    }

    // Inject random issues for debugging scenarios
    injectRandomIssue(process) {
        const issueTypes = [
            {
                type: 'infinite_loop',
                severity: 'high',
                description: `Infinite loop detected in ${process.name}`
            },
            {
                type: 'stack_overflow',
                severity: 'critical',
                description: `Stack overflow in ${process.name} recursive calls`
            },
            {
                type: 'deadlock',
                severity: 'high',
                description: `Deadlock detected in ${process.name} thread synchronization`
            },
            {
                type: 'resource_leak',
                severity: 'medium',
                description: `Resource leak in ${process.name} cleanup routines`
            }
        ];
        
        const randomIssue = issueTypes[Math.floor(Math.random() * issueTypes.length)];
        randomIssue.timestamp = Date.now();
        
        process.currentIssues.push(randomIssue);
    }

    // Execute action on process
    async executeAction(action, parameters = {}) {
        const { processId, targetProcess } = parameters;
        
        if (processId && !this.processes.has(processId)) {
            throw new Error(`Process ${processId} not found`);
        }
        
        switch (action) {
            case 'kill_process':
                return this.killProcess(processId);
                
            case 'restart_process':
                return this.restartProcess(processId);
                
            case 'optimize_process':
                return this.optimizeProcess(processId);
                
            case 'debug_process':
                return this.debugProcess(processId);
                
            case 'start_process':
                return this.startProcess(parameters.processName, parameters.config);
                
            default:
                throw new Error(`Unknown process action: ${action}`);
        }
    }

    // Kill a process
    async killProcess(processId) {
        const process = this.processes.get(processId);
        if (!process) {
            throw new Error(`Process ${processId} not found`);
        }
        
        process.status = 'terminated';
        process.endTime = Date.now();
        
        // Remove from active processes after a delay
        setTimeout(() => {
            this.processes.delete(processId);
        }, 5000);
        
        return {
            success: true,
            message: `Process ${process.name} (${processId}) terminated`,
            processId,
            timestamp: Date.now()
        };
    }

    // Restart a process
    async restartProcess(processId) {
        const process = this.processes.get(processId);
        if (!process) {
            throw new Error(`Process ${processId} not found`);
        }
        
        // Reset process state
        process.status = 'running';
        process.lifetime = 0;
        process.lastActivity = Date.now();
        process.currentIssues = [];
        process.memoryUsage = process.config?.memoryUsage || 50;
        process.cpuUsage = process.config?.cpuUsage || 10;
        process.threadCount = process.config?.threadCount || 1;
        
        return {
            success: true,
            message: `Process ${process.name} (${processId}) restarted`,
            processId,
            timestamp: Date.now()
        };
    }

    // Optimize a process
    async optimizeProcess(processId) {
        const process = this.processes.get(processId);
        if (!process) {
            throw new Error(`Process ${processId} not found`);
        }
        
        // Improve process efficiency
        process.optimizationLevel++;
        process.memoryUsage = Math.max(10, process.memoryUsage * 0.8);
        process.cpuUsage = Math.max(5, process.cpuUsage * 0.9);
        process.effectivenessScore = Math.min(2.0, process.effectivenessScore * 1.2);
        
        // Remove some issues
        process.currentIssues = process.currentIssues.filter(issue => 
            issue.severity !== 'low' && Math.random() > 0.5
        );
        
        this.performanceMetrics.optimizationAttempts++;
        
        return {
            success: true,
            message: `Process ${process.name} (${processId}) optimized`,
            processId,
            optimizationLevel: process.optimizationLevel,
            timestamp: Date.now()
        };
    }

    // Start a new process
    async startProcess(processName, config = {}) {
        const processId = await this.createBaseProcess({
            name: processName,
            ...config
        });
        
        return {
            success: true,
            message: `Process ${processName} started`,
            processId,
            timestamp: Date.now()
        };
    }

    // Create new process from emotional state
    createProcess(emotionData, priority = 'normal') {
        const processId = `proc_${this.processIdCounter++}`;
        const process = this.generateProcessFromEmotion(emotionData, processId, priority);
        
        this.processes.set(processId, process);
        this.performanceMetrics.totalProcesses++;
        
        // Log creation for debugging interface
        if (this.consciousness.systemLog) {
            this.consciousness.systemLog.push({
                timestamp: Date.now(),
                level: 'info',
                message: `Process ${processId} spawned: ${process.name}`,
                category: 'process_management',
                processId: processId
            });
        }

        // Trigger narrative events if process creation is significant
        if (this.consciousness.narrativeEngine && process.emotionalImpact > 0.7) {
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
                threadCount: Math.ceil(emotion.intensity * 2),
                priority: 'medium',
                vulnerabilities: ['false_positive_cascade', 'cpu_spinning'],
                behaviors: ['hypervigilance', 'pattern_overmatching']
            },
            anger: {
                name: 'conflict_resolver',
                type: 'reactive_processing',
                baseMemoryUsage: 120 + (emotion.intensity * 80),
                baseCpuUsage: 50 + (emotion.intensity * 30),
                threadCount: Math.ceil(emotion.intensity * 2),
                priority: 'critical',
                vulnerabilities: ['explosive_termination', 'resource_starvation'],
                behaviors: ['aggressive_prioritization', 'interrupt_storming']
            },
            joy: {
                name: 'reward_amplifier',
                type: 'enhancement_processing',
                baseMemoryUsage: 60 + (emotion.intensity * 40),
                baseCpuUsage: 20 + (emotion.intensity * 15),
                threadCount: Math.ceil(emotion.intensity * 1.5),
                priority: 'normal',
                vulnerabilities: ['dopamine_overflow', 'attention_fragmentation'],
                behaviors: ['resource_sharing', 'positive_feedback']
            }
        };

        const template = processTemplates[emotion.type] || processTemplates.anxiety;
        
        const process = {
            id: processId,
            name: template.name,
            type: template.type,
            status: 'running',
            priority: priority === 'auto' ? template.priority : priority,
            
            // Resource usage with variation
            memoryUsage: template.baseMemoryUsage + (Math.random() * 20 - 10),
            cpuUsage: template.baseCpuUsage + (Math.random() * 10 - 5),
            threadCount: template.threadCount,
            
            // Lifecycle
            lifetime: 0,
            lastActivity: Date.now(),
            crashCount: 0,
            
            // Emotional context
            emotionSource: emotion,
            emotionalImpact: emotion.intensity,
            
            // Debug information
            debuggable: true,
            currentIssues: [],
            interventionPoints: this.generateInterventionPoints(template),
            
            // Performance
            effectivenessScore: 0.8 + (Math.random() * 0.4),
            optimizationLevel: 0,
            
            // Vulnerabilities
            vulnerabilities: template.vulnerabilities,
            behaviors: template.behaviors
        };

        // Generate initial issues based on emotion intensity and vulnerabilities
        if (emotion.intensity > 0.7) {
            const vulnerability = template.vulnerabilities[Math.floor(Math.random() * template.vulnerabilities.length)];
            process.currentIssues.push({
                type: vulnerability,
                severity: emotion.intensity > 0.9 ? 'critical' : 'high',
                description: `${vulnerability.replace('_', ' ')} detected in emotional processing`,
                timestamp: Date.now()
            });
        }

        return process;
    }

    // Generate intervention points for debugging
    generateInterventionPoints(template) {
        const interventionMap = {
            'emotional_processing': ['memory_cleanup', 'process_throttling', 'recursive_depth_limit'],
            'background_monitoring': ['alert_filtering', 'scan_optimization', 'false_positive_reduction'],
            'reactive_processing': ['anger_diffusion', 'priority_rebalancing', 'interrupt_management'],
            'enhancement_processing': ['reward_modulation', 'attention_focusing', 'feedback_stabilization']
        };

        return interventionMap[template.type] || ['generic_optimization', 'resource_management'];
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
        
        // Calculate crash rate
        const totalProcesses = this.performanceMetrics.totalProcesses;
        const crashedProcesses = this.processHistory.filter(p => p.crashCount > 0).length;
        this.performanceMetrics.crashRate = totalProcesses > 0 ? crashedProcesses / totalProcesses : 0;
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
            metrics: this.performanceMetrics,
            debuggableCount: processes.filter(p => p.debuggable && p.issues.length > 0).length
        };
    }

    // Get state for consciousness instance
    getState() {
        return {
            processes: this.getProcessDataForFrontend(),
            systemUsage: this.getSystemResourceUsage(),
            metrics: this.performanceMetrics,
            debuggableCount: this.getDebuggableProcesses().length,
            isInitialized: this.isInitialized
        };
    }

    getProcessList() {
        if (!this.processes || this.processes.size === 0) {
            console.log('No processes found, returning empty array');
        return [];
        }
    
        const processList = Array.from(this.processes.values()).map(process => ({
            pid: process.id,
            name: process.name || process.displayName,
            status: process.status || 'running',
            cpu_usage: process.cpuUsage || 0,
            memory_usage: process.memoryUsage || 0,
            memory_mb: process.memoryUsage || 0,
            threads: process.threadCount || 1,
            stability: process.stability || 1.0,
            type: process.type || 'unknown'
        }));
    
        console.log('Process list generated:', processList);
        return processList;
    }

    // Capture state for save/restore
    captureState() {
        return {
            processes: Array.from(this.processes.entries()),
            processHistory: this.processHistory,
            performanceMetrics: this.performanceMetrics,
            processIdCounter: this.processIdCounter,
            baseProcesses: this.baseProcesses,
            isInitialized: this.isInitialized
        };
    }

    // Restore state from capture
    restoreState(capturedState) {
        if (!capturedState) return false;
        
        this.processes = new Map(capturedState.processes || []);
        this.processHistory = capturedState.processHistory || [];
        this.performanceMetrics = capturedState.performanceMetrics || this.performanceMetrics;
        this.processIdCounter = capturedState.processIdCounter || 1000;
        this.baseProcesses = capturedState.baseProcesses || [];
        this.isInitialized = capturedState.isInitialized || false;
        
        return true;
    }

    // System tick for consciousness instance
    async tick() {
        const updates = [];
        
        // Update all processes
        this.updateProcesses();
        
        // Check for significant changes
        const activeProcesses = Array.from(this.processes.values()).filter(p => p.status === 'running');
        
        // Check for new process crashes
        const crashedProcesses = activeProcesses.filter(p => p.currentIssues.some(i => i.severity === 'critical'));
        crashedProcesses.forEach(process => {
            if (process.status !== 'crashed') {
                process.status = 'crashed';
                process.crashCount++;
                updates.push({
                    type: 'process_crash',
                    processId: process.id,
                    processName: process.name,
                    timestamp: Date.now()
                });
            }
        });
        
        // Check for resource pressure
        const resourceUsage = this.getSystemResourceUsage();
        if (resourceUsage.totalCpuUsage > 90) {
            updates.push({
                type: 'cpu_pressure',
                usage: resourceUsage.totalCpuUsage,
                timestamp: Date.now()
            });
        }
        
        if (resourceUsage.totalMemoryUsage > this.consciousness.resources?.memory?.total * 0.9) {
            updates.push({
                type: 'memory_pressure',
                usage: resourceUsage.totalMemoryUsage,
                timestamp: Date.now()
            });
        }
        
        return updates;
    }

    // Shutdown ProcessManager
    shutdown() {
        this.stopSystemTick();
        this.processes.clear();
        this.isInitialized = false;
        console.log('ProcessManager shutdown complete');
    }
}

export default ProcessManager;
