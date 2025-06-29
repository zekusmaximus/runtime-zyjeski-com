// Dependency Injection Validation Script
// Run this in the browser console to validate the new architecture

console.log('🧪 Starting Dependency Injection Validation...');

// Test 1: Check if bootstrap is working
setTimeout(() => {
  console.log('\n=== DEPENDENCY INJECTION VALIDATION ===');
  
  // Check if all modules exist
  const requiredModules = ['stateManager', 'socketClient', 'consciousness', 'terminal', 'debugger', 'monitor', 'app'];
  const results = {};
  
  requiredModules.forEach(module => {
    const exists = window[module] !== undefined;
    const type = typeof window[module];
    results[module] = { exists, type };
    
    console.log(`${exists ? '✅' : '❌'} ${module}: ${exists ? type : 'missing'}`);
  });
  
  // Test 2: Check if RuntimeApp has injected dependencies
  if (window.app) {
    console.log('\n=== RUNTIME APP DEPENDENCIES ===');
    const appDeps = ['stateManager', 'socketClient', 'consciousness', 'monitor', 'terminal', 'debuggerInterface'];
    
    appDeps.forEach(dep => {
      const exists = window.app[dep] !== undefined;
      console.log(`${exists ? '✅' : '❌'} app.${dep}: ${exists ? 'injected' : 'missing'}`);
    });
  }
  
  // Test 3: Check if modules have their dependencies
  if (window.consciousness) {
    console.log('\n=== CONSCIOUSNESS DEPENDENCIES ===');
    const consciousnessDeps = ['stateManager', 'socketClient', 'logger'];
    
    consciousnessDeps.forEach(dep => {
      const exists = window.consciousness[dep] !== undefined;
      console.log(`${exists ? '✅' : '❌'} consciousness.${dep}: ${exists ? 'injected' : 'missing'}`);
    });
  }
  
  // Test 4: Check if socketClient has dependencies
  if (window.socketClient) {
    console.log('\n=== SOCKET CLIENT DEPENDENCIES ===');
    const socketDeps = ['stateManager', 'logger'];
    
    socketDeps.forEach(dep => {
      const exists = window.socketClient[dep] !== undefined;
      console.log(`${exists ? '✅' : '❌'} socketClient.${dep}: ${exists ? 'injected' : 'missing'}`);
    });
  }
  
  // Test 5: Check if monitor has dependencies
  if (window.monitor) {
    console.log('\n=== MONITOR DEPENDENCIES ===');
    const monitorDeps = ['stateManager', 'socketClient', 'consciousness', 'logger'];
    
    monitorDeps.forEach(dep => {
      const exists = window.monitor[dep] !== undefined;
      console.log(`${exists ? '✅' : '❌'} monitor.${dep}: ${exists ? 'injected' : 'missing'}`);
    });
  }
  
  // Test 6: Check if terminal has dependencies
  if (window.terminal) {
    console.log('\n=== TERMINAL DEPENDENCIES ===');
    const terminalDeps = ['stateManager', 'socketClient', 'logger'];
    
    terminalDeps.forEach(dep => {
      const exists = window.terminal[dep] !== undefined;
      console.log(`${exists ? '✅' : '❌'} terminal.${dep}: ${exists ? 'injected' : 'missing'}`);
    });
  }
  
  // Test 7: Check if debugger has dependencies
  if (window.debugger) {
    console.log('\n=== DEBUGGER DEPENDENCIES ===');
    const debuggerDeps = ['stateManager', 'consciousness', 'logger'];
    
    debuggerDeps.forEach(dep => {
      const exists = window.debugger[dep] !== undefined;
      console.log(`${exists ? '✅' : '❌'} debugger.${dep}: ${exists ? 'injected' : 'missing'}`);
    });
  }
  
  // Summary
  const totalModules = requiredModules.length;
  const existingModules = requiredModules.filter(module => results[module].exists).length;
  
  console.log('\n=== SUMMARY ===');
  console.log(`Modules loaded: ${existingModules}/${totalModules}`);
  
  if (existingModules === totalModules) {
    console.log('🎉 All modules loaded successfully!');
    console.log('✅ Dependency injection system is working!');
  } else {
    console.log('❌ Some modules failed to load');
    console.log('🔧 Check browser console for errors');
  }
  
  // Test app ready event
  if (window.appReadyFired) {
    console.log('✅ App ready event was fired');
  } else {
    console.log('❌ App ready event was not detected');
  }
  
}, 2000);

// Listen for app ready event
document.addEventListener('app:ready', (event) => {
  window.appReadyFired = true;
  console.log('🎉 App ready event received!', event.detail);
});

console.log('⏳ Waiting 2 seconds for modules to initialize...');
