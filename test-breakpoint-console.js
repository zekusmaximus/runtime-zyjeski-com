// Console test script for breakpoint display fix
// Copy and paste this into the browser console to test the fix

console.log('🔧 Testing Breakpoint Display Fix...');

function testBreakpointFix() {
    console.log('\n=== Breakpoint Display Fix Test ===');
    
    // Check if required objects exist
    if (!window.stateManager) {
        console.error('❌ StateManager not found');
        return false;
    }
    console.log('✅ StateManager found');
    
    if (!window.debuggerInterface) {
        console.error('❌ DebuggerInterface not found');
        return false;
    }
    console.log('✅ DebuggerInterface found');
    
    // Clear existing breakpoints
    window.stateManager.setDebuggerBreakpoints(new Map());
    console.log('✅ Cleared existing breakpoints');
    
    // Add test breakpoints
    window.stateManager.addDebuggerBreakpoint(5, null);
    window.stateManager.addDebuggerBreakpoint(10, 'test condition');
    window.stateManager.addDebuggerBreakpoint(15, null);
    
    const breakpoints = window.stateManager.getDebuggerBreakpoints();
    console.log(`✅ Added ${breakpoints.size} test breakpoints`);
    
    // Log breakpoint structure
    console.log('Breakpoint structure:');
    breakpoints.forEach((breakpoint, line) => {
        console.log(`  Line ${line}:`, breakpoint);
    });
    
    // Test updateBreakpointsDisplay method
    console.log('\n--- Testing updateBreakpointsDisplay ---');
    
    // Create a test element
    const testElement = document.createElement('div');
    testElement.id = 'test-breakpoints-list';
    document.body.appendChild(testElement);
    
    // Temporarily replace the breakpointsList element
    const originalElement = window.debuggerInterface.breakpointsList;
    window.debuggerInterface.breakpointsList = testElement;
    
    try {
        // Call the method
        window.debuggerInterface.updateBreakpointsDisplay();
        console.log('✅ updateBreakpointsDisplay() called successfully');
        
        // Check the generated HTML
        const html = testElement.innerHTML;
        console.log('Generated HTML:', html);
        
        // Validate the HTML structure
        if (html.includes('breakpoint-item') && html.includes('consciousness.cpp:')) {
            console.log('✅ HTML structure is correct');
            
            // Count breakpoint items
            const breakpointItems = testElement.querySelectorAll('.breakpoint-item');
            console.log(`✅ Found ${breakpointItems.length} breakpoint items in HTML`);
            
            if (breakpointItems.length === breakpoints.size) {
                console.log('✅ Number of HTML items matches number of breakpoints');
            } else {
                console.log(`❌ Mismatch: ${breakpointItems.length} HTML items vs ${breakpoints.size} breakpoints`);
            }
            
            // Check individual breakpoint items
            breakpointItems.forEach((item, index) => {
                const line = item.dataset.breakpointId;
                const checkbox = item.querySelector('.breakpoint-checkbox');
                const label = item.querySelector('.breakpoint-location');
                
                console.log(`  Item ${index + 1}: line=${line}, checked=${checkbox?.checked}, label="${label?.textContent}"`);
            });
            
        } else if (html.includes('no-breakpoints')) {
            console.log('✅ Shows "no breakpoints" message correctly');
        } else {
            console.log('❌ HTML structure is unexpected:', html);
        }
        
    } catch (error) {
        console.error('❌ Error calling updateBreakpointsDisplay():', error);
    } finally {
        // Restore original element
        window.debuggerInterface.breakpointsList = originalElement;
        // Remove test element
        testElement.remove();
    }
    
    // Test toggleBreakpoint method
    console.log('\n--- Testing toggleBreakpoint ---');
    try {
        const testLine = 10;
        const originalBreakpoint = breakpoints.get(testLine);
        const originalEnabled = originalBreakpoint.enabled;
        
        console.log(`Before toggle: line ${testLine} enabled = ${originalEnabled}`);
        
        window.debuggerInterface.toggleBreakpoint(testLine);
        
        const updatedBreakpoints = window.stateManager.getDebuggerBreakpoints();
        const updatedBreakpoint = updatedBreakpoints.get(testLine);
        const newEnabled = updatedBreakpoint.enabled;
        
        console.log(`After toggle: line ${testLine} enabled = ${newEnabled}`);
        
        if (originalEnabled !== newEnabled) {
            console.log('✅ toggleBreakpoint() works correctly');
        } else {
            console.log('❌ toggleBreakpoint() did not change state');
        }
        
    } catch (error) {
        console.error('❌ Error testing toggleBreakpoint():', error);
    }
    
    // Test toggleBreakpointAtLine method
    console.log('\n--- Testing toggleBreakpointAtLine ---');
    try {
        const testLine = 25;
        const initialBreakpoints = window.stateManager.getDebuggerBreakpoints();
        const initialHasBreakpoint = initialBreakpoints.has(testLine);
        
        console.log(`Before toggle: line ${testLine} exists = ${initialHasBreakpoint}`);
        
        window.debuggerInterface.toggleBreakpointAtLine(testLine);
        
        const finalBreakpoints = window.stateManager.getDebuggerBreakpoints();
        const finalHasBreakpoint = finalBreakpoints.has(testLine);
        
        console.log(`After toggle: line ${testLine} exists = ${finalHasBreakpoint}`);
        
        if (initialHasBreakpoint !== finalHasBreakpoint) {
            console.log('✅ toggleBreakpointAtLine() works correctly');
        } else {
            console.log('❌ toggleBreakpointAtLine() did not change state');
        }
        
    } catch (error) {
        console.error('❌ Error testing toggleBreakpointAtLine():', error);
    }
    
    console.log('\n=== Test Complete ===');
    return true;
}

// Run the test
testBreakpointFix();
