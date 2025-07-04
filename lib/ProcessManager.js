// ProcessManager.js - Handles dynamic process creation, lifecycle, and optimization

import ProcessFactory from './process/ProcessFactory.js';
import KillProcessCommand from './commands/KillProcessCommand.js';
import RestartProcessCommand from './commands/RestartProcessCommand.js';
import CommandExecutor from './commands/CommandExecutor.js';

class ProcessManager {
    constructor(consciousnessInstance, dependencies = {}) {
        this.consciousness = consciousnessInstance;
        this.processes = new Map();
        this.processHistory = [];
        this.performanceMetrics = {
            totalProcesses: 0,
            averageLifetime: 0,
            crashRate: 0,
            optimizationAttempts: 0,
            killedProcesses: 0,
            processRestarts: 0
        };
        this.debugHooks = new Map();
        this.processIdCounter = 1000;
        this.isInitialized = false;
        this.baseProcesses = [];
        this.tickInterval = null;
        this.processFactory = new ProcessFactory();

        // Dependency injection
        this.eventBus = dependencies.eventBus;
        this.logger = dependencies.logger;

        // Initialize CommandExecutor for advanced command management
        this.commandExecutor = dependencies.commandExecutor || new CommandExecutor({
            logger: dependencies.logger,
            maxHistorySize: dependencies.maxHistorySize || 50,
            eventBus: dependencies.eventBus
        });

        // Enable command history and undo/redo for debugging
        this.enableAdvancedCommands = dependencies.enableAdvancedCommands !== false;
    }

    // Initialize ProcessManager with base processes
    async initialize(baseProcesses = []) {
        try {
            this.baseProcesses = baseProcesses;
            
            // Don't start system tick automatically - wait for user interaction
            // this.startSystemTick();
            
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
        // Use the PID from the character data if available, otherwise generate one
        const numericPid = processConfig.pid || this.processIdCounter++;
        const processId = `base_${numericPid}`;

        const process = {
            id: processId,
            pid: numericPid, // Store the numeric PID
            name: processConfig.name || 'unnamed_process',
            type: processConfig.type || 'background',
            status: processConfig.status || 'running',
            priority: processConfig.priority || 'normal',

            // Resource usage from character data
            memoryUsage: processConfig.memory_mb || processConfig.memoryUsage || 50,
            cpuUsage: processConfig.cpu_usage || processConfig.cpuUsage || 10,
            threadCount: processConfig.threads || processConfig.threadCount || 1,

            // Lifecycle
            lifetime: 0,
            lastActivity: Date.now(),
            crashCount: 0,
            startTime: processConfig.start_time ? new Date(processConfig.start_time).getTime() : Date.now(),

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

        // Emit ProcessCreated event
        if (this.eventBus) {
            this.eventBus.emit('ProcessCreated', {
                processId: process.id,
                processName: process.name,
                processType: process.type,
                initialMemory: process.memoryUsage,
                priority: process.priority
            });
        }

        return processId;
    }

    // Start system tick for process lifecycle management
    startSystemTick() {
    // GROUND STATE: No automatic ticks
    console.log('System tick disabled - updates occur only through user actions');
    return;
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
    // GROUND STATE: Disabled automatic updates
    // Processes only change through explicit user actions
    return;
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

        // Find process by ID (could be string ID or numeric PID)
        let targetProcessObj = null;
        if (processId) {
            // First try direct string ID lookup
            if (this.processes.has(processId)) {
                targetProcessObj = this.processes.get(processId);
            } else {
                // Try to find by numeric PID
                const numericPid = parseInt(processId, 10);
                if (!isNaN(numericPid)) {
                    for (const [id, process] of this.processes) {
                        if (process.pid === numericPid) {
                            targetProcessObj = process;
                            break;
                        }
                    }
                }
            }

            if (!targetProcessObj) {
                throw new Error(`Process ${processId} not found`);
            }
        }
        
        switch (action) {
            case 'ps':
                return { processes: this.getProcessList() };

            case 'kill':
                // Use the actual process ID (string key) for the kill command
                const processToKill = targetProcessObj;
                if (!processToKill) {
                    throw new Error(`Process ${processId} not found`);
                }
                return this.killProcess(processToKill.id);

            case 'kill_process':
                // Use the actual process ID (string key) for the kill command
                const processToKill2 = targetProcessObj;
                if (!processToKill2) {
                    throw new Error(`Process ${processId} not found`);
                }
                return this.killProcess(processToKill2.id);

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
        const killCommand = new KillProcessCommand(this, processId);

        if (this.enableAdvancedCommands) {
            // Use CommandExecutor for advanced features (history, undo/redo)
            return await this.commandExecutor.execute(killCommand);
        } else {
            // Direct execution for backward compatibility
            if (!await killCommand.canExecute()) {
                throw new Error(`Process ${processId} not found`);
            }
            return await killCommand.execute();
        }
    }

    // Restart a process
    async restartProcess(processId) {
        const restartCommand = new RestartProcessCommand(this, processId);

        if (this.enableAdvancedCommands) {
            // Use CommandExecutor for advanced features (history, undo/redo)
            return await this.commandExecutor.execute(restartCommand);
        } else {
            // Direct execution for backward compatibility
            await restartCommand.canExecute();
            return await restartCommand.execute();
        }
    }

    // Optimize a process
    async optimizeProcess(processId) {
        const process = this.processes.get(processId);
        if (!process) {
            throw new Error(`Process ${processId} not found`);
        }

        // Store metrics before optimization
        const beforeMetrics = {
            cpu: process.cpuUsage,
            memory: process.memoryUsage
        };

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

        // Calculate improvement percentage
        const afterMetrics = {
            cpu: process.cpuUsage,
            memory: process.memoryUsage
        };
        const improvementPercentage = Math.round(
            ((beforeMetrics.memory - afterMetrics.memory) / beforeMetrics.memory) * 100
        );

        // Emit ProcessOptimized event
        if (this.eventBus) {
            this.eventBus.emit('ProcessOptimized', {
                processId,
                strategy: 'efficiency_boost',
                beforeMetrics,
                afterMetrics,
                improvement: improvementPercentage
            });
        }

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

    // CommandExecutor integration methods

    /**
     * Execute multiple process commands as a batch
     * @param {Array<DebugCommand>} commands - Array of commands to execute
     * @returns {Promise<Object>} Batch execution result
     */
    async executeBatch(commands) {
        if (!this.enableAdvancedCommands) {
            throw new Error('Advanced commands are disabled. Enable them to use batch operations.');
        }
        return await this.commandExecutor.executeBatch(commands);
    }

    /**
     * Undo the last executed command
     * @returns {Promise<Object>} Undo result
     */
    async undoLastCommand() {
        if (!this.enableAdvancedCommands) {
            throw new Error('Advanced commands are disabled. Enable them to use undo functionality.');
        }
        return await this.commandExecutor.undo();
    }

    /**
     * Redo the last undone command
     * @returns {Promise<Object>} Redo result
     */
    async redoLastCommand() {
        if (!this.enableAdvancedCommands) {
            throw new Error('Advanced commands are disabled. Enable them to use redo functionality.');
        }
        return await this.commandExecutor.redo();
    }

    /**
     * Check if undo is possible
     * @returns {boolean} True if undo is possible
     */
    canUndo() {
        return this.enableAdvancedCommands && this.commandExecutor.canUndo();
    }

    /**
     * Check if redo is possible
     * @returns {boolean} True if redo is possible
     */
    canRedo() {
        return this.enableAdvancedCommands && this.commandExecutor.canRedo();
    }

    /**
     * Get command execution history
     * @param {number} limit - Maximum number of entries to return
     * @returns {Array} Command history
     */
    getCommandHistory(limit = null) {
        if (!this.enableAdvancedCommands) {
            return [];
        }
        return this.commandExecutor.getHistory(limit);
    }

    /**
     * Get command execution metrics
     * @returns {Object} Execution metrics
     */
    getCommandMetrics() {
        if (!this.enableAdvancedCommands) {
            return null;
        }
        return this.commandExecutor.getMetrics();
    }

    /**
     * Search command history
     * @param {Object} criteria - Search criteria
     * @returns {Array} Matching history entries
     */
    searchCommandHistory(criteria = {}) {
        if (!this.enableAdvancedCommands) {
            return [];
        }
        return this.commandExecutor.searchHistory(criteria);
    }

    /**
     * Clear command history
     */
    clearCommandHistory() {
        if (this.enableAdvancedCommands) {
            this.commandExecutor.clearHistory();
        }
    }

    /**
     * Get undo stack information
     * @returns {Array} Undo stack
     */
    getUndoStack() {
        if (!this.enableAdvancedCommands) {
            return [];
        }
        return this.commandExecutor.getUndoStack();
    }

    /**
     * Get redo stack information
     * @returns {Array} Redo stack
     */
    getRedoStack() {
        if (!this.enableAdvancedCommands) {
            return [];
        }
        return this.commandExecutor.getRedoStack();
    }

    // Create new process from emotional state
    createProcess(emotionData, priority = 'normal') {
        // 1. Generate process ID (stays in ProcessManager)
        const processId = `proc_${this.processIdCounter++}`;

        // 2. Factory creates the process object (pure function)
        const process = this.processFactory.createProcess(processId, emotionData, priority);

        // 3. ProcessManager handles all state management and side effects
        this.processes.set(processId, process);
        this.performanceMetrics.totalProcesses++;

        // 4. Keep system logging here
        if (this.consciousness.systemLog) {
            this.consciousness.systemLog.push({
                timestamp: Date.now(),
                level: 'info',
                message: `Process ${processId} spawned: ${process.name}`,
                category: 'process_management',
                processId: processId
            });
        }

        // 5. Keep narrative triggers here
        if (this.consciousness.narrativeEngine && process.emotionalImpact > 0.7) {
            this.consciousness.narrativeEngine.checkTriggers('process_created', {
                processType: process.type,
                emotionType: emotionData.type,
                intensity: emotionData.intensity
            });
        }

        // 6. Emit ProcessCreated event
        if (this.eventBus) {
            this.eventBus.emit('ProcessCreated', {
                processId: process.id,
                processName: process.name,
                processType: process.type,
                initialMemory: process.memoryUsage || process.memory,
                priority: process.priority
            });
        }

        return processId;
    }



    // Get current system resource usage
    getSystemResourceUsage() {
    const activeProcesses = Array.from(this.processes.values()).filter(p => p.status === 'running');
    
    // Get total memory capacity from consciousness instance
    const totalMemoryCapacity = this.consciousness.resources?.memory?.total || 10000;
    const processMemoryUsage = activeProcesses.reduce((sum, p) => sum + p.memoryUsage, 0);
    
    return {
        // FIXED: Use actual memory capacity instead of hardcoded 100
        totalMemoryUsage: processMemoryUsage,
        memoryPercentage: (processMemoryUsage / totalMemoryCapacity) * 100,
        totalCpuUsage: activeProcesses.reduce((sum, p) => sum + p.cpuUsage, 0),
        totalThreads: activeProcesses.reduce((sum, p) => sum + p.threadCount, 0),
        activeProcessCount: activeProcesses.length,
        criticalProcessCount: activeProcesses.filter(p => p.priority === 'critical').length,
        issueCount: activeProcesses.reduce((sum, p) => sum + p.currentIssues.length, 0),
        
        // ADDED: Include memory capacity for proper display
        memoryCapacity: {
            total: totalMemoryCapacity,
            used: processMemoryUsage,
            available: totalMemoryCapacity - processMemoryUsage,
            percentage: (processMemoryUsage / totalMemoryCapacity) * 100
        }
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
        console.log('🔍 ProcessManager.getProcessList called:', {
            processesSize: this.processes ? this.processes.size : 'null',
            isInitialized: this.isInitialized,
            baseProcessesLength: this.baseProcesses.length
        });

        if (!this.processes || this.processes.size === 0) {
            console.log('⚠️ No processes found, returning empty array');
            return [];
        }

        const processList = Array.from(this.processes.values()).map(process => {
            // Use the stored PID if available, otherwise extract from string ID
            let numericPid = process.pid;
            if (!numericPid && typeof process.id === 'string') {
                // Extract number from string IDs like "proc_1001" or "base_1000"
                const match = process.id.match(/(\d+)$/);
                numericPid = match ? parseInt(match[1], 10) : this.processIdCounter++;
            }
            if (!numericPid) {
                numericPid = process.id;
            }

            return {
                pid: numericPid,
                name: process.name || process.displayName,
                status: process.status || 'running',
                cpu_usage: process.cpuUsage || 0,
                memory_usage: process.memoryUsage || 0,
                memory_mb: process.memoryUsage || 0,
                threads: process.threadCount || 1,
                stability: process.stability || 1.0,
                type: process.type || 'unknown'
            };
        });
    
        console.log('✅ Process list generated:', {
            count: processList.length,
            processes: processList.map(p => ({ pid: p.pid, name: p.name, status: p.status }))
        });
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

    // Detect process anomalies for analysis
    detectAnomalies() {
        const anomalies = [];

        for (const [processId, process] of this.processes) {
            // Check for high CPU usage
            if (process.cpuUsage > 80) {
                anomalies.push({
                    type: 'high_cpu',
                    processId: processId,
                    processName: process.name,
                    severity: 'high',
                    value: process.cpuUsage,
                    description: `Process ${process.name} using ${process.cpuUsage}% CPU`
                });
            }

            // Check for high memory usage
            if (process.memoryUsage > 500) {
                anomalies.push({
                    type: 'high_memory',
                    processId: processId,
                    processName: process.name,
                    severity: 'medium',
                    value: process.memoryUsage,
                    description: `Process ${process.name} using ${process.memoryUsage}MB memory`
                });
            }

            // Check for memory leaks
            if (process.memoryLeak) {
                anomalies.push({
                    type: 'memory_leak',
                    processId: processId,
                    processName: process.name,
                    severity: 'critical',
                    value: process.leakRate || 0,
                    description: `Memory leak detected in ${process.name}`
                });
            }
        }

        return anomalies;
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
