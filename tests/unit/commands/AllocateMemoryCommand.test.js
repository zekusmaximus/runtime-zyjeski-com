// AllocateMemoryCommand.test.js - Unit tests for AllocateMemoryCommand
// Tests command pattern implementation, allocation strategies, validation, and undo functionality

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AllocateMemoryCommand } from '../../../lib/commands/AllocateMemoryCommand.js';
import { DebugCommand } from '../../../lib/commands/base/DebugCommand.js';
import { MemoryCalculator } from '../../../lib/memory/MemoryCalculator.js';
import { EventEmitter } from 'events';

// Mock dependencies
const createMockMemoryManager = () => ({
    memoryCapacity: {
        total: 4096,
        allocated: 1024,
        available: 3072,
        reserved: 256
    },
    memorySegments: new Map(),
    fragmentationLevel: 0.2,
    memoryPools: {
        shortTerm: new Map(),
        longTerm: new Map(),
        traumatic: new Map(),
        suppressed: new Map(),
        procedural: new Map()
    }
});

const createMockProcess = (id, overrides = {}) => ({
    id: id,
    name: 'test_process.exe',
    type: 'emotional_processing',
    status: 'running',
    memoryUsage: 256,
    cpuUsage: 35,
    effectivenessScore: 0.7,
    emotionalImpact: 0.6,
    emotionSource: { type: 'grief', intensity: 0.7 },
    ...overrides
});

const createMockProcessManager = () => {
    const processes = new Map();
    processes.set('proc_1001', createMockProcess('proc_1001'));
    processes.set('proc_1002', createMockProcess('proc_1002', {
        name: 'background_task.exe',
        type: 'maintenance',
        memoryUsage: 128,
        effectivenessScore: 0.4,
        emotionalImpact: 0.2
    }));
    
    return { processes };
};

const createMockConsciousnessEngine = () => {
    const instances = new Map();
    instances.set('alexander_kane', {
        processManager: createMockProcessManager()
    });
    
    return { instances };
};

const createMockEventEmitter = () => new EventEmitter();

describe('AllocateMemoryCommand', () => {
    let memoryManager;
    let consciousnessEngine;
    let eventEmitter;
    let mockMemoryCalculator;

    beforeEach(() => {
        memoryManager = createMockMemoryManager();
        consciousnessEngine = createMockConsciousnessEngine();
        eventEmitter = createMockEventEmitter();
        
        // Mock MemoryCalculator methods
        mockMemoryCalculator = {
            validateAllocation: vi.fn().mockReturnValue(true),
            calculateFragmentation: vi.fn().mockReturnValue(25),
            findOptimalBlockSize: vi.fn().mockImplementation((size) => Math.ceil(size / 64) * 64),
            predictFragmentation: vi.fn().mockReturnValue(30)
        };
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('constructor', () => {
        it('should create command with required parameters', () => {
            const params = {
                processId: 'proc_1001',
                characterId: 'alexander_kane',
                size: 512,
                strategy: 'focused',
                source: { type: 'free' }
            };
            const dependencies = { memoryManager, consciousnessEngine, eventEmitter, memoryCalculator: mockMemoryCalculator };

            const command = new AllocateMemoryCommand(params, dependencies);

            expect(command).toBeInstanceOf(DebugCommand);
            expect(command.processId).toBe('proc_1001');
            expect(command.characterId).toBe('alexander_kane');
            expect(command.size).toBe(512);
            expect(command.strategy).toBe('focused');
            expect(command.priority).toBe('normal');
            expect(command.duration).toBe(0);
            expect(command.force).toBe(false);
        });

        it('should throw error if processId is missing', () => {
            const params = {
                characterId: 'alexander_kane',
                size: 512,
                strategy: 'focused',
                source: { type: 'free' }
            };
            const dependencies = { memoryManager, consciousnessEngine, eventEmitter };

            expect(() => new AllocateMemoryCommand(params, dependencies))
                .toThrow('processId is required for AllocateMemoryCommand');
        });

        it('should throw error if characterId is missing', () => {
            const params = {
                processId: 'proc_1001',
                size: 512,
                strategy: 'focused',
                source: { type: 'free' }
            };
            const dependencies = { memoryManager, consciousnessEngine, eventEmitter };

            expect(() => new AllocateMemoryCommand(params, dependencies))
                .toThrow('characterId is required for AllocateMemoryCommand');
        });

        it('should throw error if size is invalid', () => {
            const params = {
                processId: 'proc_1001',
                characterId: 'alexander_kane',
                size: 0,
                strategy: 'focused',
                source: { type: 'free' }
            };
            const dependencies = { memoryManager, consciousnessEngine, eventEmitter };

            expect(() => new AllocateMemoryCommand(params, dependencies))
                .toThrow('size must be a positive number for AllocateMemoryCommand');
        });

        it('should throw error if strategy is missing', () => {
            const params = {
                processId: 'proc_1001',
                characterId: 'alexander_kane',
                size: 512,
                source: { type: 'free' }
            };
            const dependencies = { memoryManager, consciousnessEngine, eventEmitter };

            expect(() => new AllocateMemoryCommand(params, dependencies))
                .toThrow('strategy is required for AllocateMemoryCommand');
        });

        it('should throw error if source.type is missing', () => {
            const params = {
                processId: 'proc_1001',
                characterId: 'alexander_kane',
                size: 512,
                strategy: 'focused',
                source: {}
            };
            const dependencies = { memoryManager, consciousnessEngine, eventEmitter };

            expect(() => new AllocateMemoryCommand(params, dependencies))
                .toThrow('source.type is required for AllocateMemoryCommand');
        });

        it('should set optional parameters with defaults', () => {
            const params = {
                processId: 'proc_1001',
                characterId: 'alexander_kane',
                size: 512,
                strategy: 'focused',
                priority: 'high',
                duration: 5000,
                force: true,
                source: { type: 'free' }
            };
            const dependencies = { memoryManager, consciousnessEngine, eventEmitter };

            const command = new AllocateMemoryCommand(params, dependencies);

            expect(command.priority).toBe('high');
            expect(command.duration).toBe(5000);
            expect(command.force).toBe(true);
        });
    });

    describe('canExecute', () => {
        let command;

        beforeEach(() => {
            const params = {
                processId: 'proc_1001',
                characterId: 'alexander_kane',
                size: 512,
                strategy: 'focused',
                source: { type: 'free' }
            };
            const dependencies = { memoryManager, consciousnessEngine, eventEmitter, memoryCalculator: mockMemoryCalculator };
            command = new AllocateMemoryCommand(params, dependencies);
        });

        it('should return true for valid allocation', async () => {
            const result = await command.canExecute();
            expect(result).toBe(true);
        });

        it('should throw error for invalid strategy', async () => {
            command.strategy = 'invalid_strategy';
            
            await expect(command.canExecute())
                .rejects.toThrow('Invalid allocation strategy: invalid_strategy');
        });

        it('should throw error for non-existent character', async () => {
            command.characterId = 'non_existent';
            
            await expect(command.canExecute())
                .rejects.toThrow('Character not found: non_existent');
        });

        it('should throw error for non-existent process', async () => {
            command.processId = 'non_existent';
            
            await expect(command.canExecute())
                .rejects.toThrow('Process non_existent not found');
        });

        it('should throw error for terminated process', async () => {
            const process = consciousnessEngine.instances.get('alexander_kane').processManager.processes.get('proc_1001');
            process.status = 'terminated';
            
            await expect(command.canExecute())
                .rejects.toThrow('Cannot allocate memory to terminated process proc_1001');
        });

        it('should throw error for allocation below minimum size', async () => {
            command.size = 32;
            
            await expect(command.canExecute())
                .rejects.toThrow('Allocation size 32MB is below minimum (64MB)');
        });

        it('should throw error for allocation exceeding maximum percentage', async () => {
            command.size = 2048; // 50% of 4096MB total
            
            await expect(command.canExecute())
                .rejects.toThrow('Allocation size 2048MB exceeds maximum allowed');
        });

        it('should throw error when validation fails', async () => {
            mockMemoryCalculator.validateAllocation.mockReturnValue(false);
            
            await expect(command.canExecute())
                .rejects.toThrow('Memory allocation validation failed');
        });

        it('should throw error for critical fragmentation prediction', async () => {
            mockMemoryCalculator.predictFragmentation.mockReturnValue(70); // Above 60% threshold
            
            await expect(command.canExecute())
                .rejects.toThrow('Allocation would cause critical fragmentation (70%)');
        });

        it('should allow allocation when forced despite validation failures', async () => {
            command.force = true;
            mockMemoryCalculator.validateAllocation.mockReturnValue(false);
            mockMemoryCalculator.predictFragmentation.mockReturnValue(70);

            const result = await command.canExecute();
            expect(result).toBe(true);
        });
    });

    describe('execute', () => {
        let command;

        beforeEach(() => {
            const params = {
                processId: 'proc_1001',
                characterId: 'alexander_kane',
                size: 512,
                strategy: 'focused',
                source: { type: 'free' }
            };
            const dependencies = { memoryManager, consciousnessEngine, eventEmitter, memoryCalculator: mockMemoryCalculator };
            command = new AllocateMemoryCommand(params, dependencies);
        });

        it('should execute focused allocation successfully', async () => {
            const result = await command.execute();

            expect(result.success).toBe(true);
            expect(result.allocation).toBeDefined();
            expect(result.allocation.processId).toBe('proc_1001');
            expect(result.allocation.strategy).toBe('focused');
            expect(result.allocation.size).toBeGreaterThan(0);
            expect(result.impact).toBeDefined();
            expect(result.undoData).toBeDefined();
            expect(command.executed).toBe(true);
        });

        it('should update process memory usage', async () => {
            const process = consciousnessEngine.instances.get('alexander_kane').processManager.processes.get('proc_1001');
            const originalMemory = process.memoryUsage;

            await command.execute();

            expect(process.memoryUsage).toBeGreaterThan(originalMemory);
            expect(process.allocationEfficiency).toBeDefined();
            expect(process.lastMemoryAllocation).toBeDefined();
        });

        it('should update memory manager state', async () => {
            const originalAllocated = memoryManager.memoryCapacity.allocated;
            const originalAvailable = memoryManager.memoryCapacity.available;

            const result = await command.execute();

            expect(memoryManager.memoryCapacity.allocated).toBeGreaterThan(originalAllocated);
            expect(memoryManager.memoryCapacity.available).toBeLessThan(originalAvailable);
            expect(memoryManager.memorySegments.has(result.allocation.id)).toBe(true);
        });

        it('should emit memory allocation events', async () => {
            const memoryAllocatedSpy = vi.fn();
            eventEmitter.on('memory_allocated', memoryAllocatedSpy);

            await command.execute();

            expect(memoryAllocatedSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    processId: 'proc_1001',
                    characterId: 'alexander_kane',
                    strategy: 'focused'
                })
            );
        });

        it('should emit memory pressure events when memory is low', async () => {
            // Set low available memory - need to account for the allocation size
            // 512MB allocation from 800MB available leaves 288MB, which is about 7% of 4096 (critical)
            // So let's set higher available memory to get "high" level
            memoryManager.memoryCapacity.available = 1000; // About 24% of 4096, after 512MB allocation = ~12% (high)

            const memoryPressureSpy = vi.fn();
            eventEmitter.on('memory_pressure', memoryPressureSpy);

            await command.execute();

            expect(memoryPressureSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    characterId: 'alexander_kane',
                    level: 'high'
                })
            );
        });

        it('should emit attention shift events for significant allocations', async () => {
            command.size = 500; // Significant allocation (> 10% of total)

            const attentionShiftSpy = vi.fn();
            eventEmitter.on('attention_shifted', attentionShiftSpy);

            await command.execute();

            expect(attentionShiftSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    characterId: 'alexander_kane',
                    to: 'process_proc_1001'
                })
            );
        });

        it('should generate unique allocation ID and memory address', async () => {
            const result1 = await command.execute();

            // Create new command for second allocation
            const params2 = {
                processId: 'proc_1001',
                characterId: 'alexander_kane',
                size: 256,
                strategy: 'focused',
                source: { type: 'free' }
            };
            const command2 = new AllocateMemoryCommand(params2, { memoryManager, consciousnessEngine, eventEmitter, memoryCalculator: mockMemoryCalculator });
            const result2 = await command2.execute();

            expect(result1.allocation.id).not.toBe(result2.allocation.id);
            expect(result1.allocation.address).not.toBe(result2.allocation.address);
            expect(result1.allocation.address).toMatch(/^0x[0-9A-F]+$/);
        });
    });

    describe('allocation strategies', () => {
        describe('focused strategy', () => {
            it('should allocate with high efficiency', async () => {
                const params = {
                    processId: 'proc_1001',
                    characterId: 'alexander_kane',
                    size: 512,
                    strategy: 'focused',
                    source: { type: 'free' }
                };
                const command = new AllocateMemoryCommand(params, { memoryManager, consciousnessEngine, eventEmitter, memoryCalculator: mockMemoryCalculator });

                const result = await command.execute();

                expect(result.allocation.size).toBeGreaterThan(400); // High efficiency
                expect(result.narrativeEvents).toContain('focused_attention_increased');
            });
        });

        describe('dynamic strategy', () => {
            it('should adapt efficiency based on process state', async () => {
                const process = consciousnessEngine.instances.get('alexander_kane').processManager.processes.get('proc_1001');
                process.effectivenessScore = 0.9; // High effectiveness should boost efficiency

                const params = {
                    processId: 'proc_1001',
                    characterId: 'alexander_kane',
                    size: 512,
                    strategy: 'dynamic',
                    source: { type: 'free' }
                };
                const command = new AllocateMemoryCommand(params, { memoryManager, consciousnessEngine, eventEmitter, memoryCalculator: mockMemoryCalculator });

                const result = await command.execute();

                expect(result.allocation.size).toBeGreaterThan(450); // Boosted efficiency
                expect(result.narrativeEvents).toContain('adaptive_processing_enabled');
                expect(result.narrativeEvents).toContain('cognitive_balance_improved');
            });
        });
    });

    describe('undo', () => {
        let command;

        beforeEach(() => {
            const params = {
                processId: 'proc_1001',
                characterId: 'alexander_kane',
                size: 512,
                strategy: 'focused',
                source: { type: 'free' }
            };
            const dependencies = { memoryManager, consciousnessEngine, eventEmitter, memoryCalculator: mockMemoryCalculator };
            command = new AllocateMemoryCommand(params, dependencies);
        });

        it('should throw error when trying to undo non-executed command', async () => {
            await expect(command.undo())
                .rejects.toThrow('Nothing to undo: command was not executed or allocation state not stored');
        });

        it('should restore memory state after undo', async () => {
            const originalAllocated = memoryManager.memoryCapacity.allocated;
            const originalAvailable = memoryManager.memoryCapacity.available;
            const originalFragmentation = memoryManager.fragmentationLevel;

            const result = await command.execute();
            const allocationId = result.allocation.id;

            // Verify allocation was made
            expect(memoryManager.memoryCapacity.allocated).toBeGreaterThan(originalAllocated);
            expect(memoryManager.memorySegments.has(allocationId)).toBe(true);

            // Undo the allocation
            const undoResult = await command.undo();

            expect(undoResult.success).toBe(true);
            expect(memoryManager.memoryCapacity.allocated).toBe(originalAllocated);
            expect(memoryManager.memoryCapacity.available).toBe(originalAvailable);
            expect(memoryManager.fragmentationLevel).toBe(originalFragmentation);
            expect(memoryManager.memorySegments.has(allocationId)).toBe(false);
            expect(command.executed).toBe(false);
        });

        it('should restore process memory usage after undo', async () => {
            const process = consciousnessEngine.instances.get('alexander_kane').processManager.processes.get('proc_1001');
            const originalMemory = process.memoryUsage;

            await command.execute();
            expect(process.memoryUsage).toBeGreaterThan(originalMemory);

            await command.undo();
            expect(process.memoryUsage).toBe(originalMemory);
        });

        it('should emit undo events', async () => {
            const undoSpy = vi.fn();
            eventEmitter.on('memory_allocation_undone', undoSpy);

            await command.execute();
            await command.undo();

            expect(undoSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    processId: 'proc_1001',
                    characterId: 'alexander_kane'
                })
            );
        });
    });

    describe('getDescription', () => {
        it('should return descriptive text for permanent allocation', () => {
            const params = {
                processId: 'proc_1001',
                characterId: 'alexander_kane',
                size: 512,
                strategy: 'focused',
                source: { type: 'free' }
            };
            const command = new AllocateMemoryCommand(params, { memoryManager, consciousnessEngine, eventEmitter });

            const description = command.getDescription();
            expect(description).toBe('Allocate 512MB memory to process proc_1001 using focused strategy permanently');
        });

        it('should return descriptive text for forced allocation', () => {
            const params = {
                processId: 'proc_1001',
                characterId: 'alexander_kane',
                size: 1024,
                strategy: 'emergency',
                force: true,
                source: { type: 'reclaim' }
            };
            const command = new AllocateMemoryCommand(params, { memoryManager, consciousnessEngine, eventEmitter });

            const description = command.getDescription();
            expect(description).toBe('Allocate 1024MB memory to process proc_1001 using emergency strategy permanently (forced)');
        });
    });
});
