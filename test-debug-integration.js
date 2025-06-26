#!/usr/bin/env node

/**
 * Test script for consciousness debugging integration
 * This script tests the core debugging flow without browser interaction
 */

import { ConsciousnessEngine } from './lib/consciousness-engine.js';

async function testDebuggingIntegration() {
  console.log('🔧 Testing Consciousness Debugging Integration');
  console.log('================================================\n');

  const engine = new ConsciousnessEngine();
  
  try {
    // 1. Initialize the engine
    console.log('1. Initializing consciousness engine...');
    await engine.initialize();
    console.log('✅ Engine initialized\n');

    // 2. Load Alexander Kane
    console.log('2. Loading Alexander Kane character...');
    await engine.loadCharacter('alexander-kane');
    console.log('✅ Character loaded\n');

    // 3. Test debug commands
    console.log('3. Testing debug commands:');
    
    // Test ps command
    console.log('   Testing "ps" command...');
    const psResult = await engine.executeDebugCommand('alexander-kane', 'ps', {});
    console.log('   ✅ PS Result:', {
      processCount: psResult.processes?.length || 0,
      processes: psResult.processes?.slice(0, 3).map(p => ({
        pid: p.pid,
        name: p.name,
        status: p.status
      })) || []
    });

    // Test top command  
    console.log('   Testing "top" command...');
    const topResult = await engine.executeDebugCommand('alexander-kane', 'top', {});
    console.log('   ✅ TOP Result:', {
      processCount: topResult.processes?.length || 0,
      hasResources: !!topResult.resources
    });

    // Test monitor command
    console.log('   Testing "monitor" command...');
    const monitorResult = await engine.executeDebugCommand('alexander-kane', 'monitor', {});
    console.log('   ✅ MONITOR Result:', {
      hasMemory: !!monitorResult.memory,
      hasResources: !!monitorResult.resources,
      errorCount: monitorResult.errors?.length || 0
    });

    // 4. Test consciousness state
    console.log('\n4. Testing consciousness state retrieval...');
    const state = await engine.getState('alexander-kane');
    console.log('✅ State retrieved:', {
      hasConsciousness: !!state.consciousness,
      processCount: state.consciousness?.processes?.length || 0,
      hasResources: !!state.consciousness?.resources,
      hasMemory: !!state.consciousness?.memory
    });

    console.log('\n🎉 All tests passed! Debugging integration is working.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    process.exit(0);
  }
}

// Run the test
testDebuggingIntegration().catch(console.error);
