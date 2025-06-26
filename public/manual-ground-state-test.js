// Manual Ground State Compliance Verification
console.log('=== Manual Ground State Compliance Verification ===');

// Check 1: Socket client exists and is not auto-connected
if (window.socketClient) {
  console.log('✅ Socket client exists globally');
  
  if (window.socketClient.isConnected && window.socketClient.isConnected()) {
    console.log('❌ VIOLATION: Socket is auto-connected!');
  } else {
    console.log('✅ Socket is NOT auto-connected (compliant)');
  }
  
  // Check methods
  const methods = ['connect', 'startMonitoring', 'stopMonitoring', 'emitToServer', 'disconnect'];
  methods.forEach(method => {
    if (typeof window.socketClient[method] === 'function') {
      console.log(`✅ Method ${method} available`);
    } else {
      console.log(`❌ Method ${method} missing`);
    }
  });
  
} else {
  console.log('❌ Socket client not found globally');
}

// Check 2: Connection test
console.log('\n--- Testing Manual Connection ---');
if (window.socketClient && typeof window.socketClient.connect === 'function') {
  window.socketClient.connect().then(() => {
    console.log('✅ Manual connection successful!');
    
    // Test disconnect
    setTimeout(() => {
      if (window.socketClient.disconnect()) {
        console.log('✅ Manual disconnect successful!');
      } else {
        console.log('❌ Manual disconnect failed');
      }
    }, 1000);
    
  }).catch(error => {
    console.log('❌ Manual connection failed:', error.message);
  });
} else {
  console.log('❌ Connect method not available');
}

console.log('\n=== Ground State Verification Complete ===');
