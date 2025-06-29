// Debug script for StateManager issues
// Run this in the browser console to diagnose problems

console.log('🔍 StateManager Debug Script Starting...');

function debugStateManager() {
    console.log('\n=== StateManager Debug Information ===');
    
    // Check if StateManager exists
    console.log('1. StateManager availability:');
    console.log('   window.stateManager exists:', !!window.stateManager);
    console.log('   window.stateManager type:', typeof window.stateManager);
    
    if (window.stateManager) {
        console.log('   StateManager constructor:', window.stateManager.constructor.name);
        
        // Check for required methods
        const requiredMethods = [
            'getCurrentCharacter', 'setCurrentCharacter',
            'getMonitoringActive', 'setMonitoringActive',
            'getIsLoadingCharacter', 'setIsLoadingCharacter',
            'subscribe', 'updateState'
        ];
        
        console.log('\n2. Required methods check:');
        requiredMethods.forEach(method => {
            const exists = typeof window.stateManager[method] === 'function';
            console.log(`   ${method}: ${exists ? '✅' : '❌'}`);
        });
        
        // Check state structure
        console.log('\n3. State structure:');
        if (window.stateManager.state) {
            console.log('   State keys:', Object.keys(window.stateManager.state));
            console.log('   Current character:', window.stateManager.state.currentCharacter);
            console.log('   Monitoring active:', window.stateManager.state.monitoringActive);
        } else {
            console.log('   ❌ No state property found');
        }
        
        // Check subscribers
        console.log('\n4. Subscription system:');
        if (window.stateManager.subscribers) {
            console.log('   Subscribers object exists:', true);
            console.log('   Subscriber keys:', Object.keys(window.stateManager.subscribers));
        } else {
            console.log('   ❌ No subscribers property found');
        }
    }
    
    // Check modules
    console.log('\n5. Module availability:');
    console.log('   window.app:', !!window.app);
    console.log('   window.consciousness:', !!window.consciousness);
    console.log('   window.debuggerInterface:', !!window.debuggerInterface);
    console.log('   window.monitor:', !!window.monitor);
    
    // Check module StateManager references
    if (window.consciousness) {
        console.log('\n6. Consciousness StateManager reference:');
        console.log('   consciousness.stateManager exists:', !!window.consciousness.stateManager);
        console.log('   consciousness.stateManager === window.stateManager:', 
                   window.consciousness.stateManager === window.stateManager);
        
        if (window.consciousness.stateManager) {
            console.log('   consciousness.stateManager.getMonitoringActive exists:', 
                       typeof window.consciousness.stateManager.getMonitoringActive === 'function');
        }
    }
    
    if (window.app) {
        console.log('\n7. App StateManager reference:');
        console.log('   app.stateManager exists:', !!window.app.stateManager);
        console.log('   app.stateManager === window.stateManager:', 
                   window.app.stateManager === window.stateManager);
    }
    
    // Test basic functionality
    console.log('\n8. Basic functionality test:');
    try {
        if (window.stateManager && typeof window.stateManager.setCurrentCharacter === 'function') {
            const testCharacter = { id: 'debug-test', name: 'Debug Test' };
            window.stateManager.setCurrentCharacter(testCharacter);
            const retrieved = window.stateManager.getCurrentCharacter();
            console.log('   Character set/get test:', retrieved?.id === 'debug-test' ? '✅' : '❌');
        }
        
        if (window.stateManager && typeof window.stateManager.setMonitoringActive === 'function') {
            window.stateManager.setMonitoringActive(true);
            const monitoring = window.stateManager.getMonitoringActive();
            console.log('   Monitoring set/get test:', monitoring === true ? '✅' : '❌');
        }
    } catch (error) {
        console.log('   ❌ Basic functionality test failed:', error.message);
    }
    
    console.log('\n=== Debug Complete ===\n');
}

// Test module getters
function testModuleGetters() {
    console.log('\n=== Module Getter Test ===');
    
    if (!window.stateManager) {
        console.log('❌ StateManager not available');
        return;
    }
    
    // Set up test state
    const testCharacter = { id: 'getter-test', name: 'Getter Test' };
    window.stateManager.setCurrentCharacter(testCharacter);
    window.stateManager.setMonitoringActive(true);
    
    // Test consciousness getters
    if (window.consciousness) {
        try {
            const character = window.consciousness.currentCharacter;
            const monitoring = window.consciousness.isMonitoring;
            console.log('Consciousness character getter:', character?.name || 'null');
            console.log('Consciousness monitoring getter:', monitoring);
        } catch (error) {
            console.log('❌ Consciousness getter error:', error.message);
        }
    }
    
    // Test app getters
    if (window.app) {
        try {
            const character = window.app.currentCharacter;
            const loading = window.app.isLoadingCharacter;
            console.log('App character getter:', character?.name || 'null');
            console.log('App loading getter:', loading);
        } catch (error) {
            console.log('❌ App getter error:', error.message);
        }
    }
    
    // Test debugger getters
    if (window.debuggerInterface) {
        try {
            const character = window.debuggerInterface.currentCharacter;
            const active = window.debuggerInterface.isActive;
            console.log('Debugger character getter:', character?.name || 'null');
            console.log('Debugger active getter:', active);
        } catch (error) {
            console.log('❌ Debugger getter error:', error.message);
        }
    }
    
    console.log('=== Module Getter Test Complete ===\n');
}

// Export functions for manual use
window.debugStateManager = debugStateManager;
window.testModuleGetters = testModuleGetters;

// Auto-run debug on load
setTimeout(() => {
    debugStateManager();
    if (window.consciousness || window.app || window.debuggerInterface) {
        testModuleGetters();
    }
}, 1000);

console.log('🔍 Debug functions loaded. Use debugStateManager() or testModuleGetters() to run manually.');
