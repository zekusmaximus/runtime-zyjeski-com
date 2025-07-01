// CommandExecutor.js - Advanced command management with history, undo/redo, and batch operations
// Implements the Command pattern with enhanced features for consciousness debugging

import { EventEmitter } from 'events';
import { info, error, debug } from '../logger.js';

/**
 * CommandExecutor manages the execution of debug commands with advanced features:
 * - Command history tracking (rolling 50 command limit)
 * - Undo/redo functionality with separate stacks
 * - Command validation before execution
 * - Batch operations with atomic rollback
 * - Event emission for UI updates
 * - Performance metrics and timing
 */
export class CommandExecutor extends EventEmitter {
    /**
     * Create a new CommandExecutor
     * @param {Object} dependencies - Injected dependencies
     * @param {Object} dependencies.logger - Logger instance (optional)
     * @param {number} dependencies.maxHistorySize - Maximum history size (default: 50)
     */
    constructor(dependencies = {}) {
        super();
        
        // Dependency injection
        this.logger = dependencies.logger || { info, error, debug, warn: error };
        this.maxHistorySize = dependencies.maxHistorySize || 50;
        
        // Command history - rolling buffer of executed commands
        this.history = [];
        
        // Undo/Redo stacks
        this.undoStack = [];
        this.redoStack = [];
        
        // Performance metrics
        this.metrics = {
            totalExecutions: 0,
            totalExecutionTime: 0,
            averageExecutionTime: 0,
            failedExecutions: 0,
            undoOperations: 0,
            redoOperations: 0,
            batchOperations: 0
        };
        
        // Current batch operation state
        this.currentBatch = null;
        
        this.logger.info('CommandExecutor initialized', {
            maxHistorySize: this.maxHistorySize
        });
    }

    /**
     * Execute a single command and add it to history
     * @param {DebugCommand} command - Command instance to execute
     * @param {Object} context - Execution context (optional)
     * @returns {Promise<Object>} Execution result
     */
    async execute(command, context = {}) {
        const startTime = Date.now();
        let result = null;
        let success = false;
        
        try {
            // Validate command before execution
            this.validateCommand(command);
            
            this.logger.debug('Executing command', {
                type: command.constructor.name,
                description: command.getDescription()
            });
            
            // Check if command can be executed
            await command.canExecute();
            
            // Execute the command
            result = await command.execute(context);
            success = true;
            
            // Add to history if not part of a batch
            if (!this.currentBatch) {
                this.addToHistory(command, result, startTime);
                
                // Add to undo stack if command supports undo
                if (command.executed && typeof command.undo === 'function') {
                    this.undoStack.push(command);
                    // Clear redo stack when new command is executed
                    this.redoStack = [];
                }
            }
            
            // Update metrics
            this.updateMetrics(startTime, success);
            
            // Emit execution event
            this.emit('command-executed', {
                command,
                result,
                success,
                timestamp: Date.now(),
                executionTime: Date.now() - startTime
            });
            
            this.logger.info('Command executed successfully', {
                type: command.constructor.name,
                executionTime: Date.now() - startTime
            });
            
            return result;
            
        } catch (err) {
            success = false;
            this.updateMetrics(startTime, success);
            
            this.logger.error('Command execution failed', {
                type: command.constructor.name,
                error: err.message,
                executionTime: Date.now() - startTime
            });
            
            // Emit error event
            this.emit('command-error', {
                command,
                error: err,
                timestamp: Date.now(),
                executionTime: Date.now() - startTime
            });
            
            throw err;
        }
    }

    /**
     * Validate a command object before execution
     * @param {DebugCommand} command - Command to validate
     * @throws {Error} If command is invalid
     */
    validateCommand(command) {
        if (!command) {
            throw new Error('Command is required');
        }
        
        if (typeof command.execute !== 'function') {
            throw new Error('Command must implement execute() method');
        }
        
        if (typeof command.canExecute !== 'function') {
            throw new Error('Command must implement canExecute() method');
        }
        
        if (typeof command.getDescription !== 'function') {
            throw new Error('Command must implement getDescription() method');
        }
        
        // Validate undo capability if present
        if (typeof command.undo === 'function' && typeof command.canUndo !== 'function') {
            this.logger.warn('Command implements undo() but not canUndo() - this may cause issues');
        }
        
        this.logger.debug('Command validation passed', {
            type: command.constructor.name
        });
    }

    /**
     * Add command to history with rolling buffer behavior
     * @param {DebugCommand} command - Executed command
     * @param {Object} result - Execution result
     * @param {number} startTime - Execution start timestamp
     */
    addToHistory(command, result, startTime) {
        const historyEntry = {
            command,
            result,
            timestamp: Date.now(),
            executionTime: Date.now() - startTime,
            success: true
        };
        
        this.history.push(historyEntry);
        
        // Maintain rolling buffer - remove oldest entries if over limit
        if (this.history.length > this.maxHistorySize) {
            const removed = this.history.shift();
            this.logger.debug('Removed oldest history entry', {
                type: removed.command.constructor.name,
                timestamp: removed.timestamp
            });
        }
        
        this.logger.debug('Added command to history', {
            type: command.constructor.name,
            historySize: this.history.length
        });
    }

    /**
     * Update performance metrics
     * @param {number} startTime - Execution start time
     * @param {boolean} success - Whether execution was successful
     */
    updateMetrics(startTime, success) {
        const executionTime = Date.now() - startTime;
        
        this.metrics.totalExecutions++;
        this.metrics.totalExecutionTime += executionTime;
        this.metrics.averageExecutionTime = this.metrics.totalExecutionTime / this.metrics.totalExecutions;
        
        if (!success) {
            this.metrics.failedExecutions++;
        }
    }

    /**
     * Get command history
     * @param {number} limit - Maximum number of entries to return (optional)
     * @returns {Array} Array of history entries
     */
    getHistory(limit = null) {
        const history = [...this.history];
        return limit ? history.slice(-limit) : history;
    }

    /**
     * Get performance metrics
     * @returns {Object} Current metrics
     */
    getMetrics() {
        return { ...this.metrics };
    }

    /**
     * Clear command history
     */
    clearHistory() {
        this.history = [];
        this.logger.info('Command history cleared');
    }

    /**
     * Search command history
     * @param {Object} criteria - Search criteria
     * @param {string} criteria.type - Command type to search for
     * @param {number} criteria.since - Timestamp to search from
     * @param {boolean} criteria.successOnly - Only return successful commands
     * @returns {Array} Matching history entries
     */
    searchHistory(criteria = {}) {
        return this.history.filter(entry => {
            if (criteria.type && entry.command.constructor.name !== criteria.type) {
                return false;
            }

            if (criteria.since && entry.timestamp < criteria.since) {
                return false;
            }

            if (criteria.successOnly && !entry.success) {
                return false;
            }

            return true;
        });
    }

    /**
     * Check if undo operation is possible
     * @returns {boolean} True if undo is possible
     */
    canUndo() {
        return this.undoStack.length > 0;
    }

    /**
     * Check if redo operation is possible
     * @returns {boolean} True if redo is possible
     */
    canRedo() {
        return this.redoStack.length > 0;
    }

    /**
     * Undo the last executed command
     * @param {Object} context - Undo context (optional)
     * @returns {Promise<Object>} Undo result
     */
    async undo(context = {}) {
        if (!this.canUndo()) {
            throw new Error('No commands available to undo');
        }

        const command = this.undoStack.pop();
        const startTime = Date.now();

        try {
            this.logger.debug('Undoing command', {
                type: command.constructor.name,
                description: command.getDescription()
            });

            // Check if command supports undo
            if (typeof command.undo !== 'function') {
                throw new Error(`Command ${command.constructor.name} does not support undo`);
            }

            // Check if command can be undone
            if (typeof command.canUndo === 'function' && !command.canUndo()) {
                throw new Error(`Command ${command.constructor.name} cannot be undone in current state`);
            }

            // Perform undo operation
            const result = await command.undo(context);

            // Move command to redo stack
            this.redoStack.push(command);

            // Update metrics
            this.metrics.undoOperations++;

            // Emit undo event
            this.emit('command-undone', {
                command,
                result,
                timestamp: Date.now(),
                executionTime: Date.now() - startTime
            });

            this.logger.info('Command undone successfully', {
                type: command.constructor.name,
                executionTime: Date.now() - startTime
            });

            return result;

        } catch (err) {
            // Put command back on undo stack if undo failed
            this.undoStack.push(command);

            this.logger.error('Undo operation failed', {
                type: command.constructor.name,
                error: err.message,
                executionTime: Date.now() - startTime
            });

            // Emit undo error event
            this.emit('undo-error', {
                command,
                error: err,
                timestamp: Date.now(),
                executionTime: Date.now() - startTime
            });

            throw err;
        }
    }

    /**
     * Redo the last undone command
     * @param {Object} context - Redo context (optional)
     * @returns {Promise<Object>} Redo result
     */
    async redo(context = {}) {
        if (!this.canRedo()) {
            throw new Error('No commands available to redo');
        }

        const command = this.redoStack.pop();
        const startTime = Date.now();

        try {
            this.logger.debug('Redoing command', {
                type: command.constructor.name,
                description: command.getDescription()
            });

            // Check if command can be executed again
            await command.canExecute();

            // Re-execute the command
            const result = await command.execute(context);

            // Move command back to undo stack
            this.undoStack.push(command);

            // Update metrics
            this.metrics.redoOperations++;

            // Emit redo event
            this.emit('command-redone', {
                command,
                result,
                timestamp: Date.now(),
                executionTime: Date.now() - startTime
            });

            this.logger.info('Command redone successfully', {
                type: command.constructor.name,
                executionTime: Date.now() - startTime
            });

            return result;

        } catch (err) {
            // Put command back on redo stack if redo failed
            this.redoStack.push(command);

            this.logger.error('Redo operation failed', {
                type: command.constructor.name,
                error: err.message,
                executionTime: Date.now() - startTime
            });

            // Emit redo error event
            this.emit('redo-error', {
                command,
                error: err,
                timestamp: Date.now(),
                executionTime: Date.now() - startTime
            });

            throw err;
        }
    }

    /**
     * Get undo stack information
     * @returns {Array} Array of undoable commands with basic info
     */
    getUndoStack() {
        return this.undoStack.map(command => ({
            type: command.constructor.name,
            description: command.getDescription(),
            timestamp: command.getTimestamp(),
            canUndo: typeof command.canUndo === 'function' ? command.canUndo() : true
        }));
    }

    /**
     * Get redo stack information
     * @returns {Array} Array of redoable commands with basic info
     */
    getRedoStack() {
        return this.redoStack.map(command => ({
            type: command.constructor.name,
            description: command.getDescription(),
            timestamp: command.getTimestamp()
        }));
    }

    /**
     * Clear undo and redo stacks
     */
    clearUndoRedoStacks() {
        this.undoStack = [];
        this.redoStack = [];
        this.logger.info('Undo/redo stacks cleared');
    }

    /**
     * Execute multiple commands as an atomic batch operation
     * If any command fails, all previously executed commands in the batch are rolled back
     * @param {Array<DebugCommand>} commands - Array of commands to execute
     * @param {Object} context - Execution context (optional)
     * @returns {Promise<Object>} Batch execution result
     */
    async executeBatch(commands, context = {}) {
        if (!Array.isArray(commands) || commands.length === 0) {
            throw new Error('Commands array is required and must not be empty');
        }

        const batchId = `batch_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
        const startTime = Date.now();
        const executedCommands = [];
        let batchResult = null;

        // Set batch state
        this.currentBatch = {
            id: batchId,
            commands: commands.length,
            executed: 0,
            startTime
        };

        try {
            this.logger.info('Starting batch execution', {
                batchId,
                commandCount: commands.length
            });

            // Validate all commands first
            for (const command of commands) {
                this.validateCommand(command);
            }

            // Execute commands sequentially
            const results = [];
            for (let i = 0; i < commands.length; i++) {
                const command = commands[i];

                this.logger.debug('Executing batch command', {
                    batchId,
                    commandIndex: i,
                    type: command.constructor.name
                });

                try {
                    const result = await this.execute(command, context);
                    results.push(result);
                    executedCommands.push(command);
                    this.currentBatch.executed++;
                } catch (err) {
                    // Batch execution failed - rollback all executed commands
                    this.logger.error('Batch command failed, rolling back', {
                        batchId,
                        failedCommandIndex: i,
                        type: command.constructor.name,
                        error: err.message
                    });

                    await this.rollbackBatch(executedCommands, batchId);
                    throw new Error(`Batch execution failed at command ${i} (${command.constructor.name}): ${err.message}`);
                }
            }

            // All commands executed successfully
            batchResult = {
                success: true,
                batchId,
                commandCount: commands.length,
                results,
                executionTime: Date.now() - startTime,
                timestamp: Date.now()
            };

            // Add batch to history as single entry
            this.addBatchToHistory(commands, batchResult, startTime);

            // Add all commands to undo stack as a batch
            if (executedCommands.length > 0) {
                this.undoStack.push({
                    type: 'batch',
                    batchId,
                    commands: executedCommands,
                    timestamp: Date.now()
                });
                // Clear redo stack when new batch is executed
                this.redoStack = [];
            }

            // Update metrics
            this.metrics.batchOperations++;

            // Emit batch completion event
            this.emit('batch-executed', batchResult);

            this.logger.info('Batch execution completed successfully', {
                batchId,
                commandCount: commands.length,
                executionTime: Date.now() - startTime
            });

            return batchResult;

        } catch (err) {
            batchResult = {
                success: false,
                batchId,
                commandCount: commands.length,
                executedCount: executedCommands.length,
                error: err.message,
                executionTime: Date.now() - startTime,
                timestamp: Date.now()
            };

            // Emit batch error event
            this.emit('batch-error', batchResult);

            throw err;

        } finally {
            // Clear batch state
            this.currentBatch = null;
        }
    }

    /**
     * Rollback all commands executed in a failed batch
     * @param {Array<DebugCommand>} executedCommands - Commands to rollback
     * @param {string} batchId - Batch identifier for logging
     */
    async rollbackBatch(executedCommands, batchId) {
        this.logger.info('Rolling back batch execution', {
            batchId,
            commandCount: executedCommands.length
        });

        // Rollback commands in reverse order
        for (let i = executedCommands.length - 1; i >= 0; i--) {
            const command = executedCommands[i];

            try {
                if (typeof command.undo === 'function' && command.executed) {
                    await command.undo();
                    this.logger.debug('Rolled back batch command', {
                        batchId,
                        commandIndex: i,
                        type: command.constructor.name
                    });
                }
            } catch (undoErr) {
                this.logger.error('Failed to rollback batch command', {
                    batchId,
                    commandIndex: i,
                    type: command.constructor.name,
                    error: undoErr.message
                });
                // Continue with rollback even if individual undo fails
            }
        }

        this.logger.info('Batch rollback completed', { batchId });
    }

    /**
     * Add batch operation to history
     * @param {Array<DebugCommand>} commands - Executed commands
     * @param {Object} result - Batch result
     * @param {number} startTime - Batch start time
     */
    addBatchToHistory(commands, result, startTime) {
        const historyEntry = {
            type: 'batch',
            batchId: result.batchId,
            commands: commands.map(cmd => ({
                type: cmd.constructor.name,
                description: cmd.getDescription()
            })),
            result,
            timestamp: Date.now(),
            executionTime: Date.now() - startTime,
            success: result.success
        };

        this.history.push(historyEntry);

        // Maintain rolling buffer
        if (this.history.length > this.maxHistorySize) {
            const removed = this.history.shift();
            this.logger.debug('Removed oldest history entry (batch)', {
                batchId: removed.batchId,
                timestamp: removed.timestamp
            });
        }

        this.logger.debug('Added batch to history', {
            batchId: result.batchId,
            commandCount: commands.length,
            historySize: this.history.length
        });
    }
}

export default CommandExecutor;
