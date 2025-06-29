// Ground State Validation Tool for Runtime.zyjeski.com
// Ensures compliance with "no data loads, no processes run, no updates without user action"

class GroundStateValidator {
  static validateCompliance() {
    const violations = [];
    const timestamp = Date.now();
    
    console.log('🔍 GROUND STATE: Running compliance validation...');
    
    // Check if character loaded without user interaction
    if (window.app?.currentCharacter && !window.app?.userInteracted) {
      violations.push('CRITICAL: Character loaded without user interaction');
    }
    
    // Check WebSocket auto-connection violations
    if (window.socketClient) {
      try {
        const connInfo = window.socketClient.getConnectionInfo();
        
        if (connInfo.connected && !connInfo.isUserConnected) {
          violations.push('CRITICAL: WebSocket connected without user action');
        }
        
        if (connInfo.isConnected && !window.app?.currentCharacter) {
          violations.push('WARNING: WebSocket connected before character selection');
        }
      } catch (error) {
        console.warn('Could not get socket connection info (socket client may still be initializing):', error);
      }
    }
    
    // Check component initialization violations
    const components = ['monitor', 'terminal', 'debugger'];
    const currentCharacter = window.app?.stateManager?.getCurrentCharacter();
    components.forEach(name => {
      const component = window[name];
      if (component?.isInitialized && !currentCharacter) {
        violations.push(`CRITICAL: ${name} component initialized before character load`);
      }
    });

    // Check consciousness manager violations
    if (window.consciousness) {
      if (window.consciousness.isMonitoring && !window.consciousness.currentCharacter) {
        violations.push('CRITICAL: Consciousness monitoring active without character');
      }

      if (window.consciousness.currentCharacter && !window.app?.stateManager?.getUserInteracted()) {
        violations.push('WARNING: Consciousness manager has character without user interaction');
      }
    }
    
    // Check for auto-update intervals
    const hasActiveIntervals = this.checkForActiveIntervals();
    if (hasActiveIntervals.length > 0) {
      violations.push(`WARNING: Active auto-update intervals detected: ${hasActiveIntervals.join(', ')}`);
    }
    
    const result = {
      compliant: violations.length === 0,
      violations: violations,
      timestamp: timestamp,
      details: {
        socketStatus: window.socketClient?.getConnectionInfo() || 'not available',
        characterLoaded: !!window.app?.currentCharacter,
        userInteracted: !!window.app?.userInteracted,
        monitoringActive: !!window.consciousness?.isMonitoring
      }
    };
    
    if (result.compliant) {
      console.log('✅ GROUND STATE: Application is compliant');
    } else {
      console.warn('⚠️ GROUND STATE: Violations detected:', violations);
    }
    
    return result;
  }
  
  static checkForActiveIntervals() {
    // This is a simplified check - in a real implementation you'd track intervals
    const activeIntervals = [];
    
    // Check if any components have update intervals
    if (window.consciousness?.updateInterval) {
      activeIntervals.push('consciousness-updates');
    }
    
    if (window.monitor?.autoRefreshInterval) {
      activeIntervals.push('monitor-auto-refresh');
    }
    
    return activeIntervals;
  }
  
  static enforceGroundState() {
    const validation = this.validateCompliance();
    
    if (!validation.compliant) {
      console.error('🚨 GROUND STATE: Compliance violations detected!');
      console.error('Violations:', validation.violations);
      
      // Optionally throw error to halt execution
      if (validation.violations.some(v => v.includes('CRITICAL'))) {
        throw new Error('Critical Ground State violations detected - application must be compliant');
      }
    }
    
    return validation;
  }
  
  static logGroundStateTransition(action, details = {}) {
    console.log(`🔄 GROUND STATE TRANSITION: ${action}`, {
      timestamp: Date.now(),
      userAction: true,
      details: details
    });
  }
  
  static validateUserAction(actionType, context = {}) {
    console.log(`👤 USER ACTION: ${actionType}`, context);

    // Log this as a valid user interaction through StateManager
    if (window.stateManager) {
      window.stateManager.setUserInteracted(true);
    } else if (window.app && window.app.stateManager) {
      window.app.stateManager.setUserInteracted(true);
    }

    return true;
  }
}

// Browser console debugging tools
window.validateGroundState = () => GroundStateValidator.validateCompliance();
window.enforceGroundState = () => GroundStateValidator.enforceGroundState();
window.logGroundStateTransition = (action, details) => GroundStateValidator.logGroundStateTransition(action, details);

// Export for module usage
export default GroundStateValidator;
