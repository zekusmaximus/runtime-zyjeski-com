// OptimizeProcessCommand.example.js - Usage examples for OptimizeProcessCommand
// Demonstrates different optimization scenarios and strategies

import { OptimizeProcessCommand } from '../lib/commands/OptimizeProcessCommand.js';
import { CommandExecutor } from '../lib/commands/CommandExecutor.js';
import ProcessManager from '../lib/ProcessManager.js';
import { EventEmitter } from 'events';

// Mock consciousness instance for examples
const createExampleConsciousnessInstance = () => ({
    id: 'alexander_kane',
    name: 'Alexander Kane',
    resources: {
        cpu: { total: 100, used: 45 },
        memory: { total: 10000, used: 3500 },
        threads: { total: 16, used: 8 }
    },
    systemLog: [],
    narrativeEngine: {
        checkTriggers: (event, data) => {
            console.log(`📖 Narrative trigger: ${event}`, data);
        }
    }
});

// Example process configurations
const exampleProcesses = {
    grief_processor: {
        id: 'proc_1001',
        name: 'grief_processor.exe',
        type: 'emotional_processing',
        status: 'running',
        priority: 'high',
        memoryUsage: 280,
        cpuUsage: 65,
        threadCount: 5,
        lifetime: 15000,
        lastActivity: Date.now(),
        crashCount: 1,
        emotionSource: { type: 'grief', intensity: 0.9 },
        emotionalImpact: 0.9,
        debuggable: true,
        currentIssues: ['memory_leak', 'infinite_loop'],
        interventionPoints: ['memory_limit', 'loop_detection'],
        effectivenessScore: 0.3,
        optimizationLevel: 0,
        config: { maxMemory: 500, priority: 'high' }
    },
    
    search_protocol: {
        id: 'proc_1002',
        name: 'search_protocol.exe',
        type: 'memory_search',
        status: 'running',
        priority: 'normal',
        memoryUsage: 450,
        cpuUsage: 85,
        threadCount: 8,
        lifetime: 25000,
        lastActivity: Date.now(),
        crashCount: 0,
        emotionSource: { type: 'desperation', intensity: 0.8 },
        emotionalImpact: 0.8,
        debuggable: true,
        currentIssues: ['stack_overflow', 'thread_contention'],
        interventionPoints: ['search_optimization', 'thread_limit'],
        effectivenessScore: 0.2,
        optimizationLevel: 0,
        config: { searchDepth: 'infinite', parallelism: 'high' }
    },
    
    reality_checker: {
        id: 'proc_1003',
        name: 'reality_checker.dll',
        type: 'background',
        status: 'running',
        priority: 'low',
        memoryUsage: 120,
        cpuUsage: 35,
        threadCount: 2,
        lifetime: 8000,
        lastActivity: Date.now(),
        crashCount: 0,
        emotionSource: { type: 'confusion', intensity: 0.4 },
        emotionalImpact: 0.4,
        debuggable: true,
        currentIssues: [],
        interventionPoints: ['timeline_lock'],
        effectivenessScore: 0.7,
        optimizationLevel: 0,
        config: { checkInterval: 1000 }
    }
};

// Setup function
function setupExample() {
    const consciousnessInstance = createExampleConsciousnessInstance();
    const processManager = new ProcessManager(consciousnessInstance);
    const commandExecutor = new CommandExecutor();
    const consciousnessEngine = {
        instances: new Map([['alexander_kane', { processManager }]]),
        getState: () => ({ consciousness: consciousnessInstance })
    };
    const eventEmitter = new EventEmitter();

    // Add example processes
    for (const [key, process] of Object.entries(exampleProcesses)) {
        processManager.processes.set(process.id, process);
    }

    // Setup event listeners for narrative events
    eventEmitter.on('process_optimized', (data) => {
        console.log(`✅ Process optimized: ${data.processId} using ${data.strategy}`);
        console.log(`   Improvement: CPU -${data.improvement?.cpuReduction || 0}%, Memory -${data.improvement?.memoryReduction || 0}MB`);
    });

    eventEmitter.on('memory_merged', (data) => {
        console.log(`🧠 Memory merged for ${data.characterId}: ${data.emotionalImpact}`);
        console.log(`   Original memories: ${data.originalMemories?.join(', ') || 'none'}`);
    });

    eventEmitter.on('emotion_suppressed', (data) => {
        console.log(`😶 Emotion suppressed: ${data.emotion} (level: ${data.suppressionLevel})`);
        console.log(`   Consequence: ${data.consequence}`);
    });

    return { processManager, commandExecutor, consciousnessEngine, eventEmitter };
}

// Example 1: Basic optimization with auto-strategy selection
async function example1_BasicOptimization() {
    console.log('\n🔧 Example 1: Basic Optimization with Auto-Strategy Selection');
    console.log('=' .repeat(60));

    const { processManager, consciousnessEngine, eventEmitter } = setupExample();
    
    // Get the grief processor (high CPU, memory issues)
    const process = processManager.processes.get('proc_1001');
    console.log(`📊 Before optimization:`);
    console.log(`   CPU: ${process.cpuUsage}%, Memory: ${process.memoryUsage}MB, Threads: ${process.threadCount}`);
    console.log(`   Effectiveness: ${process.effectivenessScore}, Issues: ${process.currentIssues.join(', ')}`);

    // Create and execute optimization command
    const command = new OptimizeProcessCommand(
        {
            processId: 'proc_1001',
            characterId: 'alexander_kane'
        },
        { processManager, consciousnessEngine, eventEmitter }
    );

    try {
        const result = await command.execute();
        
        console.log(`\n✅ Optimization completed using: ${result.strategyUsed}`);
        console.log(`📊 After optimization:`);
        console.log(`   CPU: ${process.cpuUsage}%, Memory: ${process.memoryUsage}MB, Threads: ${process.threadCount}`);
        console.log(`   Effectiveness: ${process.effectivenessScore}`);
        console.log(`   Side effects: ${result.sideEffects?.map(e => e.type).join(', ') || 'none'}`);
        
    } catch (error) {
        console.error(`❌ Optimization failed: ${error.message}`);
    }
}

// Example 2: Specific strategy selection
async function example2_SpecificStrategy() {
    console.log('\n🎯 Example 2: Specific Strategy Selection');
    console.log('=' .repeat(60));

    const { processManager, consciousnessEngine, eventEmitter } = setupExample();
    
    // Optimize search protocol with CPU throttling
    const process = processManager.processes.get('proc_1002');
    console.log(`📊 Search Protocol before CPU throttling:`);
    console.log(`   CPU: ${process.cpuUsage}%, Memory: ${process.memoryUsage}MB`);

    const command = new OptimizeProcessCommand(
        {
            processId: 'proc_1002',
            characterId: 'alexander_kane',
            strategy: 'cpu_throttling',
            targetMetrics: {
                cpuReduction: 0.4 // Target 40% CPU reduction
            }
        },
        { processManager, consciousnessEngine, eventEmitter }
    );

    try {
        const result = await command.execute();
        
        console.log(`\n✅ CPU throttling completed`);
        console.log(`📊 After optimization:`);
        console.log(`   CPU: ${process.cpuUsage}% (reduced by ${result.metrics?.improvement?.cpuReduction || 0}%)`);
        console.log(`   Memory: ${process.memoryUsage}MB`);
        
    } catch (error) {
        console.error(`❌ CPU throttling failed: ${error.message}`);
    }
}

// Example 3: Safe mode optimization
async function example3_SafeMode() {
    console.log('\n🛡️ Example 3: Safe Mode Optimization');
    console.log('=' .repeat(60));

    const { processManager, consciousnessEngine, eventEmitter } = setupExample();
    
    // Optimize high emotional impact process in safe mode
    const process = processManager.processes.get('proc_1001');
    console.log(`📊 Grief processor (high emotional impact):`);
    console.log(`   Emotional impact: ${process.emotionalImpact}`);
    console.log(`   Current issues: ${process.currentIssues.join(', ')}`);

    const command = new OptimizeProcessCommand(
        {
            processId: 'proc_1001',
            characterId: 'alexander_kane',
            safeMode: true
        },
        { processManager, consciousnessEngine, eventEmitter }
    );

    try {
        const result = await command.execute();
        
        console.log(`\n✅ Safe mode optimization completed`);
        console.log(`🛡️ Safe mode prevented risky operations`);
        console.log(`   Side effects: ${result.sideEffects?.map(e => `${e.type} (${e.severity})`).join(', ') || 'none'}`);
        
    } catch (error) {
        console.error(`❌ Safe mode optimization failed: ${error.message}`);
    }
}

// Example 4: Hybrid optimization
async function example4_HybridOptimization() {
    console.log('\n🔄 Example 4: Hybrid Optimization');
    console.log('=' .repeat(60));

    const { processManager, consciousnessEngine, eventEmitter } = setupExample();
    
    // Apply comprehensive optimization to search protocol
    const process = processManager.processes.get('proc_1002');
    console.log(`📊 Search Protocol before hybrid optimization:`);
    console.log(`   CPU: ${process.cpuUsage}%, Memory: ${process.memoryUsage}MB, Threads: ${process.threadCount}`);
    console.log(`   Effectiveness: ${process.effectivenessScore}`);

    const command = new OptimizeProcessCommand(
        {
            processId: 'proc_1002',
            characterId: 'alexander_kane',
            strategy: 'hybrid_optimization'
        },
        { processManager, consciousnessEngine, eventEmitter }
    );

    try {
        const result = await command.execute();
        
        console.log(`\n✅ Hybrid optimization completed`);
        console.log(`📊 After optimization:`);
        console.log(`   CPU: ${process.cpuUsage}%, Memory: ${process.memoryUsage}MB, Threads: ${process.threadCount}`);
        console.log(`   Effectiveness: ${process.effectivenessScore}`);
        console.log(`   Strategies applied: ${result.strategiesApplied?.join(', ') || 'none'}`);
        console.log(`   Overall improvement: ${result.combinedImprovement?.overallImprovement || 0}%`);
        
    } catch (error) {
        console.error(`❌ Hybrid optimization failed: ${error.message}`);
    }
}

// Example 5: Command executor integration with undo
async function example5_CommandExecutorIntegration() {
    console.log('\n↩️ Example 5: Command Executor Integration with Undo');
    console.log('=' .repeat(60));

    const { processManager, commandExecutor, consciousnessEngine, eventEmitter } = setupExample();
    
    const process = processManager.processes.get('proc_1003');
    const originalState = {
        cpu: process.cpuUsage,
        memory: process.memoryUsage,
        effectiveness: process.effectivenessScore
    };
    
    console.log(`📊 Reality Checker before optimization:`);
    console.log(`   CPU: ${originalState.cpu}%, Memory: ${originalState.memory}MB`);
    console.log(`   Effectiveness: ${originalState.effectiveness}`);

    const command = new OptimizeProcessCommand(
        {
            processId: 'proc_1003',
            characterId: 'alexander_kane',
            strategy: 'memory_consolidation'
        },
        { processManager, consciousnessEngine, eventEmitter }
    );

    try {
        // Execute through CommandExecutor
        console.log(`\n🔧 Executing optimization through CommandExecutor...`);
        const result = await commandExecutor.execute(command);
        
        console.log(`✅ Optimization executed successfully`);
        console.log(`📊 After optimization:`);
        console.log(`   CPU: ${process.cpuUsage}%, Memory: ${process.memoryUsage}MB`);
        console.log(`   Effectiveness: ${process.effectivenessScore}`);
        
        // Demonstrate undo capability
        console.log(`\n↩️ Undoing optimization...`);
        const undoResult = await commandExecutor.undo();
        
        console.log(`✅ Undo completed successfully`);
        console.log(`📊 After undo:`);
        console.log(`   CPU: ${process.cpuUsage}%, Memory: ${process.memoryUsage}MB`);
        console.log(`   Effectiveness: ${process.effectivenessScore}`);
        
        // Verify restoration
        const restored = {
            cpu: process.cpuUsage === originalState.cpu,
            memory: process.memoryUsage === originalState.memory,
            effectiveness: Math.abs(process.effectivenessScore - originalState.effectiveness) < 0.01
        };
        
        console.log(`🔍 State restoration: ${Object.values(restored).every(Boolean) ? 'COMPLETE' : 'PARTIAL'}`);
        
    } catch (error) {
        console.error(`❌ Command executor operation failed: ${error.message}`);
    }
}

// Example 6: Error handling and safety constraints
async function example6_ErrorHandling() {
    console.log('\n⚠️ Example 6: Error Handling and Safety Constraints');
    console.log('=' .repeat(60));

    const { processManager, consciousnessEngine, eventEmitter } = setupExample();
    
    // Add a system process that should not be optimized
    const systemProcess = {
        id: 'sys_001',
        name: 'System_Core.exe',
        type: 'system',
        status: 'running',
        priority: 'critical',
        memoryUsage: 50,
        cpuUsage: 15,
        threadCount: 1,
        lifetime: 100000,
        lastActivity: Date.now(),
        crashCount: 0,
        emotionSource: null,
        emotionalImpact: 0,
        debuggable: false,
        currentIssues: [],
        interventionPoints: [],
        effectivenessScore: 1.0,
        optimizationLevel: 0,
        config: { protected: true }
    };
    
    processManager.processes.set('sys_001', systemProcess);

    // Try to optimize system process (should fail)
    console.log(`🚫 Attempting to optimize system process: ${systemProcess.name}`);
    
    const systemCommand = new OptimizeProcessCommand(
        {
            processId: 'sys_001',
            characterId: 'alexander_kane'
        },
        { processManager, consciousnessEngine, eventEmitter }
    );

    try {
        await systemCommand.execute();
        console.log(`❌ ERROR: System process optimization should have failed!`);
    } catch (error) {
        console.log(`✅ Correctly prevented system process optimization: ${error.message}`);
    }

    // Try to optimize non-existent process
    console.log(`\n🚫 Attempting to optimize non-existent process...`);
    
    const nonExistentCommand = new OptimizeProcessCommand(
        {
            processId: 'nonexistent',
            characterId: 'alexander_kane'
        },
        { processManager, consciousnessEngine, eventEmitter }
    );

    try {
        await nonExistentCommand.execute();
        console.log(`❌ ERROR: Non-existent process optimization should have failed!`);
    } catch (error) {
        console.log(`✅ Correctly handled non-existent process: ${error.message}`);
    }
}

// Run all examples
async function runAllExamples() {
    console.log('🚀 OptimizeProcessCommand Usage Examples');
    console.log('=' .repeat(60));
    
    try {
        await example1_BasicOptimization();
        await example2_SpecificStrategy();
        await example3_SafeMode();
        await example4_HybridOptimization();
        await example5_CommandExecutorIntegration();
        await example6_ErrorHandling();
        
        console.log('\n🎉 All examples completed successfully!');
        
    } catch (error) {
        console.error(`💥 Example execution failed: ${error.message}`);
        console.error(error.stack);
    }
}

// Export for use in other files
export {
    example1_BasicOptimization,
    example2_SpecificStrategy,
    example3_SafeMode,
    example4_HybridOptimization,
    example5_CommandExecutorIntegration,
    example6_ErrorHandling,
    runAllExamples
};

// Run examples if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    runAllExamples();
}
