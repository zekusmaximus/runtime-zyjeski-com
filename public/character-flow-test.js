// Character Loading Flow Test
console.log('=== Testing Character Loading and Monitor Connection Flow ===');

// Test the complete flow that was failing
async function testCharacterLoadingFlow() {
  console.log('\n1. Testing socket client availability...');
  if (!window.socketClient) {
    console.log('❌ Socket client not available');
    return;
  }
  console.log('✅ Socket client available');
  
  console.log('\n2. Testing socket connection state...');
  if (window.socketClient.isSocketConnected()) {
    console.log('✅ Socket already connected');
  } else {
    console.log('🔄 Socket not connected - this is normal (Ground State compliant)');
  }
  
  console.log('\n3. Testing monitor availability...');
  if (!window.monitor) {
    console.log('❌ Monitor not available');
    return;
  }
  console.log('✅ Monitor available');
  
  console.log('\n4. Testing manual connection...');
  try {
    await window.socketClient.connect();
    console.log('✅ Manual connection successful');
    
    console.log('\n5. Testing monitor connection to character...');
    const testCharacter = { id: 'alexander-kane', name: 'Alexander Kane' };
    
    if (window.monitor.connectToCharacter) {
      const result = window.monitor.connectToCharacter(testCharacter);
      
      if (result && typeof result.then === 'function') {
        try {
          await result;
          console.log('✅ Monitor connected to character successfully');
        } catch (error) {
          console.log('❌ Monitor connection failed:', error.message);
        }
      } else {
        console.log('✅ Monitor connection completed (synchronous)');
      }
    } else {
      console.log('❌ Monitor connectToCharacter method not available');
    }
    
    console.log('\n6. Testing socket state after monitor connection...');
    if (window.socketClient.isSocketConnected()) {
      console.log('✅ Socket remains connected after monitor setup');
    } else {
      console.log('❌ Socket disconnected unexpectedly');
    }
    
    // Clean up
    setTimeout(() => {
      console.log('\n7. Cleaning up test connection...');
      if (window.socketClient.disconnect) {
        window.socketClient.disconnect();
        console.log('✅ Test connection cleaned up');
      }
    }, 2000);
    
  } catch (error) {
    console.log('❌ Manual connection failed:', error.message);
  }
}

// Run the test
testCharacterLoadingFlow();

console.log('\n=== Character Loading Flow Test Complete ===');
