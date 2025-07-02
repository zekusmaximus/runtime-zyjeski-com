// KillProcessCommand.js - Command to kill a process with undo capability

import DebugCommand from './base/DebugCommand.js';

/**
 * Command to kill a process in the consciousness system.
 * Implements the Command pattern with undo capability to restore killed processes.
 */
export class KillProcessCommand extends DebugCommand {
    /**
     * Create a new kill process command
     * @param {ProcessManager} processManager - The process manager instance
     * @param {string} processId - The ID of the process to kill
     */
    constructor(processManager, processId) {
        super({ processManager, processId });
        this.processManager = processManager;
        this.processId = processId;
        this.killedProcess = null; // Store process state for undo
        this.originalMetrics = null; // Store original metrics for undo
        this.eventBus = processManager.eventBus; // Get EventBus from ProcessManager
    }

    /**
     * Check if the process can be killed
     * @returns {Promise<boolean>} True if process exists and can be killed
     */
    async canExecute() {
        const process = this.processManager.processes.get(this.processId);
        if (!process) {
            return false;
        }
        if (process.status === 'terminated') {
            return false;
        }
        return true;
    }

    /**
     * Execute the kill process command
     * @returns {Promise<Object>} Result of the kill operation
     */
    async execute() {
        if (!await this.canExecute()) {
            throw new Error(`Cannot kill process ${this.processId}: process not found or already terminated`);
        }

        // Store process state for undo (deep clone)
        const process = this.processManager.processes.get(this.processId);
        this.killedProcess = {
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
            currentIssues: [...process.currentIssues], // Clone array
            interventionPoints: [...process.interventionPoints], // Clone array
            effectivenessScore: process.effectivenessScore,
            optimizationLevel: process.optimizationLevel,
            config: process.config,
            // Store any additional fields that might exist
            ...Object.fromEntries(
                Object.entries(process).filter(([key]) => 
                    !['id', 'name', 'type', 'status', 'priority', 'memoryUsage', 'cpuUsage', 
                      'threadCount', 'lifetime', 'lastActivity', 'crashCount', 'emotionSource', 
                      'emotionalImpact', 'debuggable', 'currentIssues', 'interventionPoints', 
                      'effectivenessScore', 'optimizationLevel', 'config'].includes(key)
                )
            )
        };

        // Store original metrics for undo
        this.originalMetrics = {
            killedProcesses: this.processManager.performanceMetrics.killedProcesses || 0
        };

        // Perform the kill operation
        process.status = 'terminated';
        process.endTime = Date.now();
        process.exitCode = -9; // Standard SIGKILL exit code

        // Update metrics (add killedProcesses if it doesn't exist)
        if (!this.processManager.performanceMetrics.killedProcesses) {
            this.processManager.performanceMetrics.killedProcesses = 0;
        }
        this.processManager.performanceMetrics.killedProcesses++;

        // NOTE: We intentionally do NOT implement the setTimeout deletion behavior
        // from the original killProcess method. This allows for clean undo functionality.
        // Terminated processes remain in the map with status 'terminated'.

        // Emit ProcessTerminated event
        if (this.eventBus) {
            this.eventBus.emit('ProcessTerminated', {
                processId: this.processId,
                processName: process.name,
                reason: 'user_initiated',
                finalState: process.status,
                runtime: process.endTime - (process.startTime || process.lastActivity),
                memoryReleased: process.memoryUsage
            });
        }

        this.executed = true;
        this.timestamp = Date.now();
        this.result = {
            success: true,
            processId: this.processId,
            processName: process.name,
            message: `Process ${process.name} (${this.processId}) terminated`,
            timestamp: this.timestamp,
            exitCode: process.exitCode
        };

        return this.result;
    }

    /**
     * Undo the kill process command (restore the process)
     * @returns {Promise<Object>} Result of the undo operation
     */
    async undo() {
        if (!this.executed || !this.killedProcess) {
            throw new Error('Nothing to undo: command was not executed or process state not stored');
        }

        // Restore the process to its original state
        const restoredProcess = { ...this.killedProcess };
        delete restoredProcess.endTime; // Remove termination timestamp
        delete restoredProcess.exitCode; // Remove exit code
        
        this.processManager.processes.set(this.processId, restoredProcess);

        // Restore metrics
        if (this.originalMetrics && typeof this.originalMetrics.killedProcesses === 'number') {
            this.processManager.performanceMetrics.killedProcesses = this.originalMetrics.killedProcesses;
        }

        // Clear execution state
        this.executed = false;
        this.timestamp = null;
        
        const undoResult = {
            success: true,
            processId: this.processId,
            processName: this.killedProcess.name,
            message: `Process ${this.killedProcess.name} (${this.processId}) restored`,
            timestamp: Date.now()
        };

        this.result = undoResult;
        return undoResult;
    }

    /**
     * Get a human-readable description of this command
     * @returns {string} Command description
     */
    getDescription() {
        return `Kill process ${this.processId}`;
    }

    /**
     * Get detailed information about the command
     * @returns {Object} Command information
     */
    getCommandInfo() {
        return {
            type: 'kill_process',
            processId: this.processId,
            processName: this.killedProcess?.name || 'unknown',
            executed: this.executed,
            timestamp: this.timestamp,
            canUndo: this.executed && this.killedProcess !== null
        };
    }
}

export default KillProcessCommand;
