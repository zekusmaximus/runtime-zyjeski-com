// Test Ground State Compliance
// This test verifies that no socket connections occur without explicit user action

console.log('[Ground State Test] Starting compliance test...');

// Test 1: Check if socket client is available without auto-connecting
function testSocketClientAvailability() {
  console.log('[Test 1] Checking socket client availability...');
  
  if (typeof window !== 'undefined' && window.socketClient) {
    console.log('✓ Socket client is available globally');
    
    if (window.socketClient.isConnected && window.socketClient.isConnected()) {
      console.log('❌ VIOLATION: Socket client is auto-connected!');
      return false;
    } else {
      console.log('✓ Socket client is NOT auto-connected (Ground State compliant)');
      return true;
    }
  } else {
    console.log('❌ Socket client not available globally');
    return false;
  }
}

// Test 2: Check if any unexpected socket connections exist
function testNoUnexpectedConnections() {
  console.log('[Test 2] Checking for unexpected socket connections...');
  
  // Check for any direct io instances
  if (typeof window !== 'undefined' && window.io) {
    const socketInstances = [];
    
    // This is a basic check - in a real implementation, we might need to track all socket instances
    if (window.socketClient && window.socketClient.socket && window.socketClient.socket.connected) {
      socketInstances.push('Main socket client');
    }
    
    console.log(`Found ${socketInstances.length} connected socket instances`);
    
    if (socketInstances.length === 0) {
      console.log('✓ No auto-connected sockets found (Ground State compliant)');
      return true;
    } else {
      console.log('❌ VIOLATION: Found auto-connected sockets:', socketInstances);
      return false;
    }
  } else {
    console.log('❌ Socket.io not available');
    return false;
  }
}

// Test 3: Verify user action requirement
function testUserActionRequirement() {
  console.log('[Test 3] Testing user action requirement...');
  
  if (typeof window !== 'undefined' && window.socketClient) {
    try {
      // Try to connect manually (this should be the only way to connect)
      console.log('Testing manual connection capability...');
      
      // Check for both connect and startMonitoring methods
      const hasConnect = typeof window.socketClient.connect === 'function';
      const hasStartMonitoring = typeof window.socketClient.startMonitoring === 'function';
      
      if (hasConnect || hasStartMonitoring) {
        if (hasConnect) {
          console.log('✓ Manual connect method available');
        }
        if (hasStartMonitoring) {
          console.log('✓ StartMonitoring method available (user action required)');
        }
        return true;
      } else {
        console.log('❌ No manual connection methods available');
        return false;
      }
    } catch (error) {
      console.log('❌ Error testing manual connection:', error);
      return false;
    }
  } else {
    console.log('❌ Socket client not available for testing');
    return false;
  }
}

// Run all tests
function runGroundStateComplianceTests() {
  console.log('\n[Ground State Compliance Test Suite]');
  console.log('=====================================');
  
  const results = {
    test1: testSocketClientAvailability(),
    test2: testNoUnexpectedConnections(),
    test3: testUserActionRequirement()
  };
  
  const passedTests = Object.values(results).filter(result => result === true).length;
  const totalTests = Object.keys(results).length;
  
  console.log('\n[Test Results]');
  console.log(`Passed: ${passedTests}/${totalTests}`);
  
  if (passedTests === totalTests) {
    console.log('✅ ALL TESTS PASSED - Ground State COMPLIANT');
  } else {
    console.log('❌ SOME TESTS FAILED - Ground State VIOLATIONS DETECTED');
    
    // Log specific failures
    Object.entries(results).forEach(([test, passed]) => {
      if (!passed) {
        console.log(`❌ ${test} failed`);
      }
    });
  }
  
  return passedTests === totalTests;
}

// Export for use in browser
if (typeof window !== 'undefined') {
  window.runGroundStateComplianceTests = runGroundStateComplianceTests;
  
  // Auto-run after page load
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      runGroundStateComplianceTests();
    }, 1000); // Wait for modules to load
  });
}

// Export for Node.js testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { runGroundStateComplianceTests };
}
