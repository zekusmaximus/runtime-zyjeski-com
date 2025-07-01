import { describe, it, expect, beforeEach, vi } from 'vitest';
import CommandExecutor from '../../../lib/commands/CommandExecutor.js';
import DebugCommand from '../../../lib/commands/base/DebugCommand.js';

// Mock logger
const mockLogger = {
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn()
};

// Mock command class for testing
class MockCommand extends DebugCommand {
    constructor(options = {}) {
        super({ mockData: 'test' });
        this.shouldFail = options.shouldFail || false;
        this.shouldFailUndo = options.shouldFailUndo || false;
        this.supportsUndo = options.supportsUndo !== false;
        this.executionResult = options.executionResult || { success: true, message: 'Mock executed' };
        this.undoResult = options.undoResult || { success: true, message: 'Mock undone' };
        this.description = options.description || 'Mock command';
        this.canExecuteResult = options.canExecuteResult !== false;
    }

    async canExecute() {
        if (!this.canExecuteResult) {
            throw new Error('Mock command cannot execute');
        }
        return true;
    }

    async execute() {
        if (this.shouldFail) {
            throw new Error('Mock command execution failed');
        }
        
        this.executed = true;
        this.timestamp = Date.now();
        this.result = this.executionResult;
        return this.executionResult;
    }

    async undo() {
        if (!this.supportsUndo) {
            throw new Error('Mock command does not support undo');
        }
        
        if (this.shouldFailUndo) {
            throw new Error('Mock command undo failed');
        }
        
        this.executed = false;
        return this.undoResult;
    }

    canUndo() {
        return this.executed && this.supportsUndo;
    }

    getDescription() {
        return this.description;
    }
}

describe('CommandExecutor', () => {
    let executor;
    let mockCommand;

    beforeEach(() => {
        executor = new CommandExecutor({ 
            logger: mockLogger,
            maxHistorySize: 5 // Small size for testing
        });
        mockCommand = new MockCommand();
        
        // Clear mock calls
        vi.clearAllMocks();
    });

    describe('constructor', () => {
        it('initializes with default values', () => {
            const defaultExecutor = new CommandExecutor();
            expect(defaultExecutor.maxHistorySize).toBe(50);
            expect(defaultExecutor.history).toEqual([]);
            expect(defaultExecutor.undoStack).toEqual([]);
            expect(defaultExecutor.redoStack).toEqual([]);
            expect(defaultExecutor.currentBatch).toBeNull();
        });

        it('accepts custom configuration', () => {
            const customExecutor = new CommandExecutor({
                logger: mockLogger,
                maxHistorySize: 10
            });
            expect(customExecutor.maxHistorySize).toBe(10);
            expect(customExecutor.logger).toBe(mockLogger);
        });

        it('initializes metrics correctly', () => {
            const metrics = executor.getMetrics();
            expect(metrics.totalExecutions).toBe(0);
            expect(metrics.totalExecutionTime).toBe(0);
            expect(metrics.averageExecutionTime).toBe(0);
            expect(metrics.failedExecutions).toBe(0);
            expect(metrics.undoOperations).toBe(0);
            expect(metrics.redoOperations).toBe(0);
            expect(metrics.batchOperations).toBe(0);
        });
    });

    describe('validateCommand', () => {
        it('validates a proper command', () => {
            expect(() => executor.validateCommand(mockCommand)).not.toThrow();
        });

        it('throws error for null command', () => {
            expect(() => executor.validateCommand(null)).toThrow('Command is required');
        });

        it('throws error for command without execute method', () => {
            const invalidCommand = {};
            expect(() => executor.validateCommand(invalidCommand)).toThrow('Command must implement execute() method');
        });

        it('throws error for command without canExecute method', () => {
            const invalidCommand = { execute: () => {} };
            expect(() => executor.validateCommand(invalidCommand)).toThrow('Command must implement canExecute() method');
        });

        it('throws error for command without getDescription method', () => {
            const invalidCommand = { 
                execute: () => {}, 
                canExecute: () => {} 
            };
            expect(() => executor.validateCommand(invalidCommand)).toThrow('Command must implement getDescription() method');
        });

        it('warns for command with undo but no canUndo method', () => {
            const warningCommand = new MockCommand();
            warningCommand.canUndo = undefined;
            
            executor.validateCommand(warningCommand);
            expect(mockLogger.warn).toHaveBeenCalledWith(
                'Command implements undo() but not canUndo() - this may cause issues'
            );
        });
    });

    describe('execute', () => {
        it('executes a command successfully', async () => {
            const result = await executor.execute(mockCommand);
            
            expect(result).toEqual(mockCommand.executionResult);
            expect(mockCommand.executed).toBe(true);
            expect(executor.history).toHaveLength(1);
            expect(executor.undoStack).toHaveLength(1);
            expect(executor.redoStack).toHaveLength(0);
        });

        it('updates metrics on successful execution', async () => {
            await executor.execute(mockCommand);

            const metrics = executor.getMetrics();
            expect(metrics.totalExecutions).toBe(1);
            expect(metrics.failedExecutions).toBe(0);
            expect(metrics.totalExecutionTime).toBeGreaterThanOrEqual(0);
            expect(metrics.averageExecutionTime).toBeGreaterThanOrEqual(0);
        });

        it('emits command-executed event on success', async () => {
            const eventSpy = vi.fn();
            executor.on('command-executed', eventSpy);
            
            await executor.execute(mockCommand);
            
            expect(eventSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    command: mockCommand,
                    result: mockCommand.executionResult,
                    success: true,
                    timestamp: expect.any(Number),
                    executionTime: expect.any(Number)
                })
            );
        });

        it('handles command execution failure', async () => {
            const failingCommand = new MockCommand({ shouldFail: true });
            
            await expect(executor.execute(failingCommand)).rejects.toThrow('Mock command execution failed');
            
            expect(executor.history).toHaveLength(0);
            expect(executor.undoStack).toHaveLength(0);
            
            const metrics = executor.getMetrics();
            expect(metrics.totalExecutions).toBe(1);
            expect(metrics.failedExecutions).toBe(1);
        });

        it('emits command-error event on failure', async () => {
            const errorSpy = vi.fn();
            executor.on('command-error', errorSpy);
            
            const failingCommand = new MockCommand({ shouldFail: true });
            
            await expect(executor.execute(failingCommand)).rejects.toThrow();
            
            expect(errorSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    command: failingCommand,
                    error: expect.any(Error),
                    timestamp: expect.any(Number),
                    executionTime: expect.any(Number)
                })
            );
        });

        it('handles canExecute failure', async () => {
            const cannotExecuteCommand = new MockCommand({ canExecuteResult: false });
            
            await expect(executor.execute(cannotExecuteCommand)).rejects.toThrow('Mock command cannot execute');
            
            expect(executor.history).toHaveLength(0);
            expect(executor.undoStack).toHaveLength(0);
        });

        it('does not add to history during batch execution', async () => {
            // Simulate batch execution by setting currentBatch
            executor.currentBatch = { id: 'test-batch' };
            
            await executor.execute(mockCommand);
            
            expect(executor.history).toHaveLength(0);
            expect(executor.undoStack).toHaveLength(0);
            
            // Clean up
            executor.currentBatch = null;
        });

        it('clears redo stack when new command is executed', async () => {
            // Execute and undo a command to populate redo stack
            await executor.execute(mockCommand);
            await executor.undo();
            expect(executor.redoStack).toHaveLength(1);
            
            // Execute new command
            const newCommand = new MockCommand();
            await executor.execute(newCommand);
            
            expect(executor.redoStack).toHaveLength(0);
        });
    });

    describe('history management', () => {
        it('maintains rolling history buffer', async () => {
            // Execute more commands than maxHistorySize
            for (let i = 0; i < 7; i++) {
                const command = new MockCommand({ description: `Command ${i}` });
                await executor.execute(command);
            }
            
            expect(executor.history).toHaveLength(5); // maxHistorySize
            expect(executor.history[0].command.description).toBe('Command 2'); // First two removed
        });

        it('provides history access', async () => {
            await executor.execute(mockCommand);
            
            const history = executor.getHistory();
            expect(history).toHaveLength(1);
            expect(history[0].command).toBe(mockCommand);
            expect(history[0].success).toBe(true);
        });

        it('provides limited history access', async () => {
            for (let i = 0; i < 3; i++) {
                const command = new MockCommand({ description: `Command ${i}` });
                await executor.execute(command);
            }
            
            const limitedHistory = executor.getHistory(2);
            expect(limitedHistory).toHaveLength(2);
            expect(limitedHistory[0].command.description).toBe('Command 1');
            expect(limitedHistory[1].command.description).toBe('Command 2');
        });

        it('clears history', async () => {
            await executor.execute(mockCommand);
            expect(executor.history).toHaveLength(1);
            
            executor.clearHistory();
            expect(executor.history).toHaveLength(0);
        });

        it('searches history by criteria', async () => {
            const command1 = new MockCommand({ description: 'First command' });
            const command2 = new MockCommand({ description: 'Second command' });
            
            await executor.execute(command1);
            await executor.execute(command2);
            
            const results = executor.searchHistory({ type: 'MockCommand' });
            expect(results).toHaveLength(2);
            
            const sinceResults = executor.searchHistory({ 
                since: Date.now() + 1000 // Future timestamp
            });
            expect(sinceResults).toHaveLength(0);
        });
    });

    describe('undo functionality', () => {
        it('checks if undo is possible', async () => {
            expect(executor.canUndo()).toBe(false);

            await executor.execute(mockCommand);
            expect(executor.canUndo()).toBe(true);
        });

        it('undoes a command successfully', async () => {
            await executor.execute(mockCommand);

            const undoResult = await executor.undo();

            expect(undoResult).toEqual(mockCommand.undoResult);
            expect(executor.undoStack).toHaveLength(0);
            expect(executor.redoStack).toHaveLength(1);

            const metrics = executor.getMetrics();
            expect(metrics.undoOperations).toBe(1);
        });

        it('emits command-undone event', async () => {
            const undoSpy = vi.fn();
            executor.on('command-undone', undoSpy);

            await executor.execute(mockCommand);
            await executor.undo();

            expect(undoSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    command: mockCommand,
                    result: mockCommand.undoResult,
                    timestamp: expect.any(Number),
                    executionTime: expect.any(Number)
                })
            );
        });

        it('throws error when no commands to undo', async () => {
            await expect(executor.undo()).rejects.toThrow('No commands available to undo');
        });

        it('handles undo failure', async () => {
            const failingUndoCommand = new MockCommand({ shouldFailUndo: true });
            await executor.execute(failingUndoCommand);

            await expect(executor.undo()).rejects.toThrow('Mock command undo failed');

            // Command should be back on undo stack
            expect(executor.undoStack).toHaveLength(1);
            expect(executor.redoStack).toHaveLength(0);
        });

        it('emits undo-error event on failure', async () => {
            const errorSpy = vi.fn();
            executor.on('undo-error', errorSpy);

            const failingUndoCommand = new MockCommand({ shouldFailUndo: true });
            await executor.execute(failingUndoCommand);

            await expect(executor.undo()).rejects.toThrow();

            expect(errorSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    command: failingUndoCommand,
                    error: expect.any(Error),
                    timestamp: expect.any(Number),
                    executionTime: expect.any(Number)
                })
            );
        });

        it('handles command without undo support', async () => {
            const noUndoCommand = new MockCommand({ supportsUndo: false });
            await executor.execute(noUndoCommand);

            await expect(executor.undo()).rejects.toThrow('cannot be undone');
        });

        it('provides undo stack information', async () => {
            await executor.execute(mockCommand);

            const undoStack = executor.getUndoStack();
            expect(undoStack).toHaveLength(1);
            expect(undoStack[0]).toEqual({
                type: 'MockCommand',
                description: 'Mock command',
                timestamp: expect.any(Number),
                canUndo: true
            });
        });
    });

    describe('redo functionality', () => {
        it('checks if redo is possible', async () => {
            expect(executor.canRedo()).toBe(false);

            await executor.execute(mockCommand);
            await executor.undo();
            expect(executor.canRedo()).toBe(true);
        });

        it('redoes a command successfully', async () => {
            await executor.execute(mockCommand);
            await executor.undo();

            const redoResult = await executor.redo();

            expect(redoResult).toEqual(mockCommand.executionResult);
            expect(executor.undoStack).toHaveLength(1);
            expect(executor.redoStack).toHaveLength(0);

            const metrics = executor.getMetrics();
            expect(metrics.redoOperations).toBe(1);
        });

        it('emits command-redone event', async () => {
            const redoSpy = vi.fn();
            executor.on('command-redone', redoSpy);

            await executor.execute(mockCommand);
            await executor.undo();
            await executor.redo();

            expect(redoSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    command: mockCommand,
                    result: mockCommand.executionResult,
                    timestamp: expect.any(Number),
                    executionTime: expect.any(Number)
                })
            );
        });

        it('throws error when no commands to redo', async () => {
            await expect(executor.redo()).rejects.toThrow('No commands available to redo');
        });

        it('handles redo failure', async () => {
            const failingCommand = new MockCommand();
            await executor.execute(failingCommand);
            await executor.undo();

            // Make the command fail on redo
            failingCommand.shouldFail = true;

            await expect(executor.redo()).rejects.toThrow('Mock command execution failed');

            // Command should be back on redo stack
            expect(executor.redoStack).toHaveLength(1);
            expect(executor.undoStack).toHaveLength(0);
        });

        it('provides redo stack information', async () => {
            await executor.execute(mockCommand);
            await executor.undo();

            const redoStack = executor.getRedoStack();
            expect(redoStack).toHaveLength(1);
            expect(redoStack[0]).toEqual({
                type: 'MockCommand',
                description: 'Mock command',
                timestamp: expect.any(Number)
            });
        });

        it('clears undo/redo stacks', async () => {
            await executor.execute(mockCommand);
            await executor.undo();

            expect(executor.undoStack).toHaveLength(0);
            expect(executor.redoStack).toHaveLength(1);

            executor.clearUndoRedoStacks();

            expect(executor.undoStack).toHaveLength(0);
            expect(executor.redoStack).toHaveLength(0);
        });
    });

    describe('batch operations', () => {
        it('executes batch of commands successfully', async () => {
            const command1 = new MockCommand({ description: 'Batch command 1' });
            const command2 = new MockCommand({ description: 'Batch command 2' });
            const commands = [command1, command2];

            const batchResult = await executor.executeBatch(commands);

            expect(batchResult.success).toBe(true);
            expect(batchResult.commandCount).toBe(2);
            expect(batchResult.results).toHaveLength(2);
            expect(command1.executed).toBe(true);
            expect(command2.executed).toBe(true);

            // Should add batch to history as single entry
            expect(executor.history).toHaveLength(1);
            expect(executor.history[0].type).toBe('batch');

            const metrics = executor.getMetrics();
            expect(metrics.batchOperations).toBe(1);
        });

        it('emits batch-executed event', async () => {
            const batchSpy = vi.fn();
            executor.on('batch-executed', batchSpy);

            const commands = [new MockCommand(), new MockCommand()];
            await executor.executeBatch(commands);

            expect(batchSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    batchId: expect.any(String),
                    commandCount: 2,
                    results: expect.any(Array),
                    executionTime: expect.any(Number),
                    timestamp: expect.any(Number)
                })
            );
        });

        it('rolls back on batch failure', async () => {
            const command1 = new MockCommand({ description: 'Good command' });
            const command2 = new MockCommand({ shouldFail: true, description: 'Failing command' });
            const commands = [command1, command2];

            await expect(executor.executeBatch(commands)).rejects.toThrow('Batch execution failed');

            // First command should be rolled back
            expect(command1.executed).toBe(false);
            expect(command2.executed).toBe(false);

            // No history entry should be added
            expect(executor.history).toHaveLength(0);
            expect(executor.undoStack).toHaveLength(0);
        });

        it('emits batch-error event on failure', async () => {
            const errorSpy = vi.fn();
            executor.on('batch-error', errorSpy);

            const commands = [new MockCommand(), new MockCommand({ shouldFail: true })];

            await expect(executor.executeBatch(commands)).rejects.toThrow();

            expect(errorSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    batchId: expect.any(String),
                    commandCount: 2,
                    executedCount: 1,
                    error: expect.any(String),
                    executionTime: expect.any(Number),
                    timestamp: expect.any(Number)
                })
            );
        });

        it('validates all commands before execution', async () => {
            const validCommand = new MockCommand();
            const invalidCommand = { execute: () => {} }; // Missing canExecute

            await expect(executor.executeBatch([validCommand, invalidCommand]))
                .rejects.toThrow('Command must implement canExecute() method');

            // No commands should be executed
            expect(validCommand.executed).toBe(false);
        });

        it('throws error for empty command array', async () => {
            await expect(executor.executeBatch([])).rejects.toThrow('Commands array is required and must not be empty');
        });

        it('throws error for non-array input', async () => {
            await expect(executor.executeBatch(null)).rejects.toThrow('Commands array is required and must not be empty');
        });

        it('handles rollback failure gracefully', async () => {
            const command1 = new MockCommand({
                description: 'Command with failing undo',
                shouldFailUndo: true
            });
            const command2 = new MockCommand({ shouldFail: true });

            await expect(executor.executeBatch([command1, command2])).rejects.toThrow();

            // Should continue rollback even if individual undo fails
            expect(mockLogger.error).toHaveBeenCalledWith(
                'Failed to rollback batch command',
                expect.objectContaining({
                    type: 'MockCommand',
                    error: 'Mock command undo failed'
                })
            );
        });

        it('adds batch to undo stack', async () => {
            const commands = [new MockCommand(), new MockCommand()];
            await executor.executeBatch(commands);

            expect(executor.undoStack).toHaveLength(1);
            expect(executor.undoStack[0].type).toBe('batch');
            expect(executor.undoStack[0].commands).toHaveLength(2);
        });

        it('clears redo stack when batch is executed', async () => {
            // Setup redo stack
            await executor.execute(new MockCommand());
            await executor.undo();
            expect(executor.redoStack).toHaveLength(1);

            // Execute batch
            await executor.executeBatch([new MockCommand()]);

            expect(executor.redoStack).toHaveLength(0);
        });
    });

    describe('performance and metrics', () => {
        it('tracks execution metrics accurately', async () => {
            const command1 = new MockCommand();
            const command2 = new MockCommand({ shouldFail: true });

            await executor.execute(command1);
            await expect(executor.execute(command2)).rejects.toThrow();

            const metrics = executor.getMetrics();
            expect(metrics.totalExecutions).toBe(2);
            expect(metrics.failedExecutions).toBe(1);
            expect(metrics.totalExecutionTime).toBeGreaterThanOrEqual(0);
            expect(metrics.averageExecutionTime).toBeGreaterThanOrEqual(0);
        });

        it('measures execution time', async () => {
            const startTime = Date.now();
            await executor.execute(mockCommand);
            const endTime = Date.now();

            const history = executor.getHistory();
            expect(history[0].executionTime).toBeGreaterThanOrEqual(0);
            expect(history[0].executionTime).toBeLessThanOrEqual(endTime - startTime);
        });
    });

    describe('event emission', () => {
        it('extends EventEmitter correctly', () => {
            expect(executor.on).toBeDefined();
            expect(executor.emit).toBeDefined();
            expect(executor.removeListener).toBeDefined();
        });

        it('emits all expected events', async () => {
            const events = [];
            const eventTypes = ['command-executed', 'command-error', 'command-undone', 'undo-error', 'command-redone', 'redo-error', 'batch-executed', 'batch-error'];

            eventTypes.forEach(eventType => {
                executor.on(eventType, (data) => events.push({ type: eventType, data }));
            });

            // Test successful execution
            await executor.execute(mockCommand);
            expect(events.some(e => e.type === 'command-executed')).toBe(true);

            // Test undo
            await executor.undo();
            expect(events.some(e => e.type === 'command-undone')).toBe(true);

            // Test redo
            await executor.redo();
            expect(events.some(e => e.type === 'command-redone')).toBe(true);
        });
    });
});
