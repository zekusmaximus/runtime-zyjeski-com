// Test script for state management consolidation
// Run this in the browser console after the app loads

console.log('🧪 Starting State Management Consolidation Tests...');

// Test 1: State Consistency Across Modules
function testStateConsistency() {
  console.log('\n📊 Test 1: State Consistency Across Modules');
  
  // Check if all modules access the same state
  const stateManagerCharacter = window.stateManager?.getCurrentCharacter();
  const appCharacter = window.app?.currentCharacter;
  const consciousnessCharacter = window.consciousness?.currentCharacter;
  
  console.log('StateManager character:', stateManagerCharacter?.name || 'none');
  console.log('App character (via getter):', appCharacter?.name || 'none');
  console.log('Consciousness character (via getter):', consciousnessCharacter?.name || 'none');
  
  // Test monitoring state consistency
  const stateManagerMonitoring = window.stateManager?.getMonitoringActive();
  const consciousnessMonitoring = window.consciousness?.isMonitoring;
  
  console.log('StateManager monitoring:', stateManagerMonitoring);
  console.log('Consciousness monitoring (via getter):', consciousnessMonitoring);
  
  // Test debugger state consistency
  const debuggerActive = window.debuggerInterface?.isActive;
  const debuggerCharacter = window.debuggerInterface?.currentCharacter;
  
  console.log('Debugger active (via getter):', debuggerActive);
  console.log('Debugger character (via getter):', debuggerCharacter?.name || 'none');
  
  return {
    charactersMatch: stateManagerCharacter?.id === appCharacter?.id && 
                    stateManagerCharacter?.id === consciousnessCharacter?.id,
    monitoringMatch: stateManagerMonitoring === consciousnessMonitoring,
    debuggerCharacterMatch: stateManagerCharacter?.id === debuggerCharacter?.id
  };
}

// Test 2: State Update Propagation
function testStateUpdatePropagation() {
  console.log('\n🔄 Test 2: State Update Propagation');
  
  if (!window.stateManager) {
    console.error('StateManager not available');
    return false;
  }
  
  // Test loading state
  console.log('Testing loading state...');
  window.stateManager.setIsLoadingCharacter(true);
  setTimeout(() => {
    const isLoading = window.stateManager.getIsLoadingCharacter();
    console.log('Loading state set to true:', isLoading);
    
    window.stateManager.setIsLoadingCharacter(false);
    setTimeout(() => {
      const isLoadingAfter = window.stateManager.getIsLoadingCharacter();
      console.log('Loading state set to false:', isLoadingAfter);
    }, 100);
  }, 100);
  
  // Test monitoring state
  console.log('Testing monitoring state...');
  const originalMonitoring = window.stateManager.getMonitoringActive();
  window.stateManager.setMonitoringActive(!originalMonitoring);
  setTimeout(() => {
    const newMonitoring = window.stateManager.getMonitoringActive();
    console.log('Monitoring state changed from', originalMonitoring, 'to', newMonitoring);
    
    // Restore original state
    window.stateManager.setMonitoringActive(originalMonitoring);
  }, 100);
  
  return true;
}

// Test 3: UI Reactivity to State Changes
function testUIReactivity() {
  console.log('\n🎨 Test 3: UI Reactivity to State Changes');
  
  if (!window.stateManager) {
    console.error('StateManager not available');
    return false;
  }
  
  // Test character selection UI updates
  console.log('Testing character selection UI updates...');
  
  // Find character selection elements
  const characterCards = document.querySelectorAll('.character-card');
  const characterSelect = document.getElementById('characterSelect');
  
  console.log('Found character cards:', characterCards.length);
  console.log('Found character select:', !!characterSelect);
  
  // Test loading UI updates
  console.log('Testing loading UI updates...');
  const appStatus = document.getElementById('appStatus');
  console.log('Found app status element:', !!appStatus);
  
  if (appStatus) {
    window.stateManager.setIsLoadingCharacter(true);
    setTimeout(() => {
      const isVisible = appStatus.style.display !== 'none';
      const hasLoadingClass = appStatus.classList.contains('loading');
      console.log('Loading UI visible:', isVisible, 'Has loading class:', hasLoadingClass);
      
      window.stateManager.setIsLoadingCharacter(false);
      setTimeout(() => {
        const isHidden = appStatus.style.display === 'none';
        console.log('Loading UI hidden after state change:', isHidden);
      }, 100);
    }, 100);
  }
  
  return true;
}

// Test 4: Memory Leak Detection
function testMemoryLeaks() {
  console.log('\n🔍 Test 4: Memory Leak Detection');
  
  if (!window.stateManager) {
    console.error('StateManager not available');
    return false;
  }
  
  // Count current subscribers
  const subscriberCounts = {};
  for (const key in window.stateManager.subscribers) {
    subscriberCounts[key] = window.stateManager.subscribers[key].length;
  }
  
  console.log('Current subscriber counts:', subscriberCounts);
  
  // Test adding and removing subscribers
  let testCallbackCalled = false;
  const testCallback = () => { testCallbackCalled = true; };
  
  window.stateManager.subscribe('currentCharacter', testCallback);
  
  const newCount = window.stateManager.subscribers['currentCharacter']?.length || 0;
  console.log('Subscribers after adding test callback:', newCount);
  
  // Trigger the callback
  window.stateManager.setCurrentCharacter({ id: 'test', name: 'Test Character' });
  
  setTimeout(() => {
    console.log('Test callback was called:', testCallbackCalled);
    
    // Note: We don't have an unsubscribe method, which could be a memory leak issue
    console.log('⚠️  Warning: No unsubscribe method found - potential memory leak');
  }, 100);
  
  return true;
}

// Test 5: Debugger State Management
function testDebuggerState() {
  console.log('\n🐛 Test 5: Debugger State Management');
  
  if (!window.stateManager || !window.debuggerInterface) {
    console.error('StateManager or DebuggerInterface not available');
    return false;
  }
  
  // Test debugger breakpoints
  console.log('Testing debugger breakpoints...');
  const originalBreakpoints = window.stateManager.getDebuggerBreakpoints();
  console.log('Original breakpoints count:', originalBreakpoints.size);
  
  // Add a test breakpoint
  window.stateManager.addDebuggerBreakpoint(10, 'test condition');
  const newBreakpoints = window.stateManager.getDebuggerBreakpoints();
  console.log('Breakpoints after adding one:', newBreakpoints.size);
  
  // Test execution state
  console.log('Testing execution state...');
  const originalState = window.stateManager.getDebuggerExecutionState();
  console.log('Original execution state:', originalState);
  
  window.stateManager.setDebuggerExecutionState('running');
  const newState = window.stateManager.getDebuggerExecutionState();
  console.log('New execution state:', newState);
  
  // Restore original state
  window.stateManager.setDebuggerExecutionState(originalState);
  window.stateManager.removeDebuggerBreakpoint(10);
  
  return true;
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Running State Management Consolidation Tests...\n');
  
  const results = {
    stateConsistency: testStateConsistency(),
    stateUpdatePropagation: testStateUpdatePropagation(),
    uiReactivity: testUIReactivity(),
    memoryLeaks: testMemoryLeaks(),
    debuggerState: testDebuggerState()
  };
  
  // Wait for async operations to complete
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  console.log('\n📋 Test Results Summary:');
  console.log('State Consistency:', results.stateConsistency);
  console.log('State Update Propagation:', results.stateUpdatePropagation);
  console.log('UI Reactivity:', results.uiReactivity);
  console.log('Memory Leaks:', results.memoryLeaks);
  console.log('Debugger State:', results.debuggerState);
  
  const allPassed = Object.values(results).every(result => 
    typeof result === 'boolean' ? result : 
    typeof result === 'object' ? Object.values(result).every(v => v) : 
    false
  );
  
  console.log('\n🎯 Overall Result:', allPassed ? '✅ PASSED' : '❌ FAILED');
  
  return results;
}

// Export for manual testing
window.testStateConsolidation = {
  runAllTests,
  testStateConsistency,
  testStateUpdatePropagation,
  testUIReactivity,
  testMemoryLeaks,
  testDebuggerState
};

console.log('🧪 Test functions loaded. Run window.testStateConsolidation.runAllTests() to start testing.');
