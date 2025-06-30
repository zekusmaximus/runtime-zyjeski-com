// RestartProcessCommand.js - Command to restart a process with undo capability

import DebugCommand from './base/DebugCommand.js';

/**
 * Command to restart a process in the consciousness system.
 * Implements the Command pattern with undo capability to restore pre-restart state.
 */
export class RestartProcessCommand extends DebugCommand {
    /**
     * Create a new restart process command
     * @param {ProcessManager} processManager - The process manager instance
     * @param {string} processId - The ID of the process to restart
     */
    constructor(processManager, processId) {
        super({ processManager, processId });
        this.processManager = processManager;
        this.processId = processId;
        this.previousState = null; // Store process state for undo
        this.originalMetrics = null; // Store original metrics for undo
    }

    /**
     * Check if the process can be restarted
     * @returns {Promise<boolean>} True if process exists and can be restarted
     */
    async canExecute() {
        const process = this.processManager.processes.get(this.processId);
        if (!process) {
            throw new Error(`Process ${this.processId} not found`);
        }
        
        // Cannot restart terminated processes
        if (process.status === 'terminated') {
            throw new Error(`Process ${this.processId} is terminated and cannot be restarted`);
        }
        
        return true;
    }

    /**
     * Execute the restart process command
     * @returns {Promise<Object>} Result of the restart operation
     */
    async execute() {
        // canExecute will throw if there are issues
        await this.canExecute();

        const process = this.processManager.processes.get(this.processId);
        
        // Store complete process state for undo (deep clone)
        this.previousState = {
            id: process.id,
            name: process.name,
            type: process.type,
            status: process.status,
            priority: process.priority,
            memoryUsage: process.memoryUsage,
            cpuUsage: process.cpuUsage,
            threadCount: process.threadCount,
            lifetime: process.lifetime,
            lastActivity: process.lastActivity,
            crashCount: process.crashCount,
            emotionSource: process.emotionSource,
            emotionalImpact: process.emotionalImpact,
            debuggable: process.debuggable,
            currentIssues: [...(process.currentIssues || [])], // Clone array
            interventionPoints: [...(process.interventionPoints || [])], // Clone array
            effectivenessScore: process.effectivenessScore,
            optimizationLevel: process.optimizationLevel,
            config: process.config,
            restartCount: process.restartCount || 0,
            lastRestart: process.lastRestart,
            // Store any additional fields that might exist
            ...Object.fromEntries(
                Object.entries(process).filter(([key]) => 
                    !['id', 'name', 'type', 'status', 'priority', 'memoryUsage', 'cpuUsage', 
                      'threadCount', 'lifetime', 'lastActivity', 'crashCount', 'emotionSource', 
                      'emotionalImpact', 'debuggable', 'currentIssues', 'interventionPoints', 
                      'effectivenessScore', 'optimizationLevel', 'config', 'restartCount', 'lastRestart'].includes(key)
                )
            )
        };

        // Store original metrics for undo
        this.originalMetrics = {
            processRestarts: this.processManager.performanceMetrics.processRestarts || 0
        };

        // Perform the restart operation (based on ProcessManager.restartProcess logic)
        process.status = 'running';
        process.lifetime = 0;
        process.lastActivity = Date.now();
        process.currentIssues = [];
        process.memoryUsage = process.config?.memoryUsage || 50;
        process.cpuUsage = process.config?.cpuUsage || 10;
        process.threadCount = process.config?.threadCount || 1;
        
        // Add restart tracking
        process.restartCount = (process.restartCount || 0) + 1;
        process.lastRestart = Date.now();

        // Update metrics (add processRestarts if it doesn't exist)
        if (!this.processManager.performanceMetrics.processRestarts) {
            this.processManager.performanceMetrics.processRestarts = 0;
        }
        this.processManager.performanceMetrics.processRestarts++;

        this.executed = true;
        this.timestamp = Date.now();
        this.result = {
            success: true,
            processId: this.processId,
            processName: process.name,
            message: `Process ${process.name} (${this.processId}) restarted`,
            timestamp: this.timestamp,
            restartCount: process.restartCount,
            resetFields: {
                lifetime: 0,
                currentIssues: 'cleared',
                memoryUsage: process.memoryUsage,
                cpuUsage: process.cpuUsage,
                threadCount: process.threadCount
            }
        };

        return this.result;
    }

    /**
     * Undo the restart process command (restore the process to pre-restart state)
     * @returns {Promise<Object>} Result of the undo operation
     */
    async undo() {
        if (!this.executed || !this.previousState) {
            throw new Error('Nothing to undo: command was not executed or process state not stored');
        }

        // Restore the process to its complete previous state
        const restoredProcess = { ...this.previousState };
        this.processManager.processes.set(this.processId, restoredProcess);

        // Restore metrics
        if (this.originalMetrics && typeof this.originalMetrics.processRestarts === 'number') {
            this.processManager.performanceMetrics.processRestarts = this.originalMetrics.processRestarts;
        }

        // Clear execution state
        this.executed = false;
        this.timestamp = null;
        
        const undoResult = {
            success: true,
            processId: this.processId,
            processName: this.previousState.name,
            message: `Process restart undone for ${this.previousState.name} (${this.processId})`,
            timestamp: Date.now(),
            restoredState: {
                status: this.previousState.status,
                lifetime: this.previousState.lifetime,
                memoryUsage: this.previousState.memoryUsage,
                cpuUsage: this.previousState.cpuUsage,
                currentIssues: this.previousState.currentIssues.length,
                restartCount: this.previousState.restartCount || 0
            }
        };

        this.result = undoResult;
        return undoResult;
    }

    /**
     * Get a human-readable description of this command
     * @returns {string} Command description
     */
    getDescription() {
        return `Restart process ${this.processId}`;
    }

    /**
     * Get detailed information about the command
     * @returns {Object} Command information
     */
    getCommandInfo() {
        return {
            type: 'restart_process',
            processId: this.processId,
            processName: this.previousState?.name || 'unknown',
            executed: this.executed,
            timestamp: this.timestamp,
            canUndo: this.executed && this.previousState !== null,
            restartCount: this.previousState?.restartCount || 0
        };
    }
}

export default RestartProcessCommand;
