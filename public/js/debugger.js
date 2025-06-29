// Complete Debugger Interface Module for Runtime.zyjeski.com
import { createLogger } from '/js/logger.js';

class DebuggerInterface {
  constructor(dependencies = {}) {
    // Dependency injection - accept dependencies instead of global access
    const { stateManager, consciousness, logger } = dependencies;

    this.stateManager = stateManager;
    this.consciousness = consciousness;
    this.logger = logger || createLogger('Debugger');

    this.consciousnessState = null;  // Store real consciousness state
    this.debugSession = null;
    this.codeLines = [];

    this.init();
  }

  // Convenience getters for accessing state
  get isActive() {
    return this.stateManager ? this.stateManager.getDebuggerActive() : false;
  }

  get currentCharacter() {
    return this.stateManager ? this.stateManager.getCurrentCharacter() : null;
  }

  get breakpoints() {
    return this.stateManager ? this.stateManager.getDebuggerBreakpoints() : new Map();
  }

  get callStack() {
    return this.stateManager ? this.stateManager.getDebuggerCallStack() : [];
  }

  get variables() {
    return this.stateManager ? this.stateManager.getDebuggerVariables() : {};
  }

  get currentLine() {
    return this.stateManager ? this.stateManager.getDebuggerCurrentLine() : null;
  }

  get executionState() {
    return this.stateManager ? this.stateManager.getDebuggerExecutionState() : 'stopped';
  }

  init() {
    this.setupElements();
    this.setupEventListeners();
    this.subscribeToStateChanges();
    this.setupSocketListeners();
    this.generateConsciousnessCode();
  }

  // PUBLIC INITIALIZE METHOD - Called by app.js when navigating to debugger section
  initialize() {
    console.log('Debugger interface initializing...');

    // Refresh UI elements in case they were dynamically loaded
    this.setupElements();

    // Update debugger with current character if available
    if (this.currentCharacter) {
      this.updateDebuggerForCharacter(this.currentCharacter);
    }

    // Refresh code editor display
    this.renderCodeEditor();

    // Update execution state display
    this.updateExecutionState();

    console.log('Debugger interface initialized');
  }

  setupElements() {
    // Debug control buttons
    this.stepIntoBtn = document.getElementById('stepInto');
    this.stepOverBtn = document.getElementById('stepOver');
    this.continueBtn = document.getElementById('continue');
    this.breakAllBtn = document.getElementById('breakAll');
    
    // Debug panels
    this.breakpointsList = document.getElementById('breakpointsList');
    this.callStackElement = document.getElementById('callStack');
    this.variablesView = document.getElementById('variablesView');
    this.codeEditor = document.getElementById('codeEditor');
    
    this.setupDebugControls();
  }

  setupDebugControls() {
    if (this.stepIntoBtn) {
      this.stepIntoBtn.addEventListener('click', () => this.stepInto());
    }
    if (this.stepOverBtn) {
      this.stepOverBtn.addEventListener('click', () => this.stepOver());
    }
    if (this.continueBtn) {
      this.continueBtn.addEventListener('click', () => this.continue());
    }
    if (this.breakAllBtn) {
      this.breakAllBtn.addEventListener('click', () => this.breakAll());
    }
  }

   setupEventListeners() {
    // Breakpoint list interactions
    if (this.breakpointsList) {
      this.breakpointsList.addEventListener('click', (e) => {
        if (e.target.classList.contains('breakpoint-checkbox') || e.target.classList.contains('breakpoint-location')) {
          const breakpointItem = e.target.closest('.breakpoint-item');
          const breakpointId = breakpointItem.dataset.breakpointId;
          const checkbox = breakpointItem.querySelector('.breakpoint-checkbox');
          
          // Toggle checkbox if label was clicked
          if (e.target.classList.contains('breakpoint-location')) {
            checkbox.checked = !checkbox.checked;
            checkbox.classList.toggle('checked');
          }
          
          this.toggleBreakpoint(breakpointId);
        }
      });
    }

    // Code editor line clicks for breakpoints
    if (this.codeEditor) {
      this.codeEditor.addEventListener('click', (e) => {
        if (e.target.classList.contains('line-number')) {
          const line = parseInt(e.target.dataset.line);
          this.toggleBreakpointAtLine(line);
        }
      });
    }

    // Variable group expansion
    if (this.variablesView) {
      this.variablesView.addEventListener('click', (e) => {
        if (e.target.classList.contains('variable-group-header')) {
          e.target.classList.toggle('expanded');
          const list = e.target.nextElementSibling;
          if (list) {
            list.style.display = list.style.display === 'none' ? 'block' : 'none';
          }
        }
      });
    }
  }

  setupSocketListeners() {
    // Note: DebuggerInterface doesn't directly use socketClient
    // It relies on consciousness manager for socket communication
    this.logger.debug('Socket listeners setup - using consciousness manager for communication');
  }

  subscribeToStateChanges() {
    if (!this.stateManager) return;

    // Subscribe to character changes for debugger updates
    this.stateManager.subscribe('currentCharacter', (character) => {
      if (character) {
        this.updateDebuggerForCharacter(character);
      }
    });

    // Subscribe to debugger state changes for UI updates
    this.stateManager.subscribe('debuggerActive', (active) => {
      this.logger.info('Debugger active state changed:', active);
      if (active) {
        this.startDebugging();
      } else {
        this.stopDebugging();
      }
    });

    this.stateManager.subscribe('debuggerBreakpoints', (breakpoints) => {
      this.updateBreakpointsList();
      this.renderCodeEditor();
    });

    this.stateManager.subscribe('debuggerExecutionState', (state) => {
      this.updateExecutionState();
    });

    this.stateManager.subscribe('debuggerCurrentLine', (line) => {
      this.renderCodeEditor();
    });

    this.stateManager.subscribe('debuggerVariables', (variables) => {
      this.updateVariablesView();
    });

    this.stateManager.subscribe('debuggerCallStack', (callStack) => {
      this.updateCallStack();
    });
  }

  // Update debugger interface for character
  updateDebuggerForCharacter(character) {
    if (!character) return;
    
    this.currentCharacter = character;
    
    // Request current consciousness state if character is attached
    if (character.id && this.consciousness) {
      // Request fresh consciousness state for the debugger through consciousness manager
      this.consciousness.requestConsciousnessUpdate();
    }
    
    // Update call stack and variables
    this.updateCallStackFromCharacter(character);
    this.updateVariablesFromCharacter(character);
    
    // Refresh displays
    this.updateCallStack();
    this.updateVariablesView();
    
    // Regenerate code (will use static code until consciousness state arrives)
    this.generateConsciousnessCode();
    this.renderCodeEditor();
    
    console.log('Debugger updated for character:', character.name);
  }

  // Generate consciousness code representation
  generateConsciousnessCode() {
    // Generate code based on actual consciousness state if available
    if (this.currentCharacter && this.consciousnessState) {
      this.generateDynamicCode();
    } else {
      this.generateStaticCode();
    }
  }

  generateDynamicCode() {
    const state = this.consciousnessState;
    const processes = state.consciousness?.processes || [];
    const resources = state.consciousness?.resources || {};
    const errors = state.consciousness?.system_errors || [];
    
    this.codeLines = [
      `// Consciousness Runtime - ${this.currentCharacter.name}`,
      `// Generated at ${new Date().toISOString()}`,
      '#include <consciousness.h>',
      '#include <memory_manager.h>',
      '#include <process_scheduler.h>',
      '',
      'int main() {',
      '    ConsciousnessRuntime runtime;',
      '    runtime.initialize();',
      '    ',
      '    // System Resources',
      `    // CPU: ${resources.cpu?.percentage?.toFixed(1) || 0}% | Memory: ${resources.memory?.percentage?.toFixed(1) || 0}% | Threads: ${resources.threads?.used || 0}/${resources.threads?.total || 0}`,
      '    MemoryAllocator* memory = runtime.getMemoryAllocator();',
      '    ProcessManager* processes = runtime.getProcessManager();',
      '    ',
      '    // Active Processes'
    ];

    // Add process spawning based on actual running processes
    processes.forEach(proc => {
      const memoryMB = Math.round((proc.memoryUsage || 0) / 1024 / 1024);
      this.codeLines.push(`    Process* ${proc.name.toLowerCase().replace(/[^a-z0-9]/g, '_')} = processes->spawn("${proc.name}"); // ${proc.status}, ${memoryMB}MB, ${(proc.cpuUsage || 0).toFixed(1)}% CPU`);
    });

    this.codeLines.push(
      '    ',
      '    // Main execution loop',
      '    while (runtime.isRunning()) {',
      '        try {'
    );

    // Add process execution calls
    processes.forEach(proc => {
      if (proc.status === 'running') {
        const procVar = proc.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
        this.codeLines.push(`            ${procVar}->execute(); // PID: ${proc.pid}, Priority: ${proc.priority || 'normal'}`);
      }
    });

    this.codeLines.push(
      '            ',
      '            runtime.processEvents();',
      '            runtime.garbageCollect();',
      '            '
    );

    // Add error handling based on actual system errors
    if (errors.length > 0) {
      errors.forEach(error => {
        this.codeLines.push(`        } catch (${error.type || 'RuntimeException'}& e) {`);
        this.codeLines.push(`            // ${error.message || error.toString()}`);
        this.codeLines.push('            runtime.handleError(e);');
      });
    } else {
      this.codeLines.push(
        '        } catch (MemoryLeakException& e) {',
        '            runtime.handleError(e);',
        '        } catch (ProcessException& e) {',
        '            runtime.handleError(e);'
      );
    }

    this.codeLines.push(
      '        }',
      '    }',
      '    ',
      '    return runtime.shutdown();',
      '}'
    );
  }

  generateStaticCode() {
    // Fallback to static code when no consciousness state available
    this.codeLines = [
      '// Consciousness Runtime - No Character Attached',
      '// Use terminal command: attach alexander-kane',
      '#include <consciousness.h>',
      '#include <memory_manager.h>',
      '#include <process_scheduler.h>',
      '',
      'int main() {',
      '    ConsciousnessRuntime runtime;',
      '    runtime.initialize();',
      '    ',
      '    // No consciousness instance loaded',
      '    runtime.log("Waiting for character attachment...");',
      '    ',
      '    while (!runtime.hasActiveConsciousness()) {',
      '        runtime.idle();',
      '    }',
      '    ',
      '    return runtime.shutdown();',
      '}'
    ];
  }

  // Render code editor with syntax highlighting
  renderCodeEditor() {
    if (!this.codeEditor || !this.codeLines) return;
    
    const codeContent = this.codeLines.map((line, index) => {
      const lineNumber = index + 1;
      const hasBreakpoint = this.breakpoints.has(`line_${lineNumber}`);
      const isCurrentLine = lineNumber === this.currentLine;
      
      const lineClass = [
        'code-line',
        hasBreakpoint ? 'has-breakpoint' : '',
        isCurrentLine ? 'current-line' : ''
      ].filter(Boolean).join(' ');
      
      const highlightedLine = this.syntaxHighlight(line);
      
      return `
        <div class="${lineClass}">
          <span class="line-number" data-line="${lineNumber}">${lineNumber}</span>
          <span class="line-content">${highlightedLine}</span>
        </div>
      `;
    }).join('');
    
    this.codeEditor.innerHTML = codeContent;
  }

  // Basic syntax highlighting
  syntaxHighlight(code) {
    return code
      .replace(/\b(include|int|try|catch|while|return|Process|MemoryAllocator|ProcessManager)\b/g, '<span class="keyword">$1</span>')
      .replace(/\b(main|initialize|spawn|execute|processEvents|garbageCollect|shutdown)\b/g, '<span class="function">$1</span>')
      .replace(/\b(grief_mgr|search_proto|temporal_sync|rel_handler|memory|processes|runtime)\b/g, '<span class="variable">$1</span>')
      .replace(/(\+\+|==|!=|<=|>=|&&|\|\||->)/g, '<span class="operator">$1</span>')
      .replace(/(\/\/.*$)/g, '<span class="comment">$1</span>')
      .replace(/(".*?")/g, '<span class="string">$1</span>');
  }

  // Debug Control Methods
  stepInto() {
    if (!this.currentCharacter) return;
    
    this.sendDebugCommand('step_into');
    this.updateExecutionState('running');
    
    console.log('Step Into executed');
  }

  stepOver() {
    if (!this.currentCharacter) return;
    
    this.sendDebugCommand('step_over');
    this.updateExecutionState('running');
    
    console.log('Step Over executed');
  }

  continue() {
    if (!this.currentCharacter) return;
    
    this.sendDebugCommand('continue');
    this.updateExecutionState('running');
    
    console.log('Continue executed');
  }

  breakAll() {
    if (!this.currentCharacter) return;
    
    this.sendDebugCommand('break_all');
    this.updateExecutionState('paused');
    
    console.log('Break All executed');
  }

  sendDebugCommand(command, args = {}) {
    if (this.consciousness && this.currentCharacter) {
      // Use consciousness manager to send debug commands
      this.logger.debug(`Sending debug command: ${command}`, args);
      // Note: This would need to be implemented in consciousness manager
      // For now, just log the command
      this.logger.info(`Debug command would be sent: ${command} for ${this.currentCharacter.id}`);
    }
  }

  // Breakpoint Management
  toggleBreakpointAtLine(lineNumber) {
    const breakpointId = `line_${lineNumber}`;
    
    if (this.breakpoints.has(breakpointId)) {
      this.removeBreakpoint(breakpointId);
    } else {
      this.addBreakpoint(breakpointId, {
        line: lineNumber,
        enabled: true,
        condition: null,
        location: `consciousness.cpp:${lineNumber}`
      });
    }
    
    this.updateBreakpointsDisplay();
    this.updateCodeEditorBreakpoints();
  }

  addBreakpoint(id, breakpoint) {
    if (this.stateManager) {
      this.stateManager.addDebuggerBreakpoint(breakpoint.line, breakpoint.condition);
    }

    // Send to server if debugging
    if (this.debugSession) {
      this.sendDebugCommand('add_breakpoint', {
        breakpointId: id,
        line: breakpoint.line,
        condition: breakpoint.condition
      });
    }
  }

  removeBreakpoint(id) {
    // Find the breakpoint to get the line number
    const breakpoint = this.breakpoints.get(id);
    if (breakpoint && this.stateManager) {
      this.stateManager.removeDebuggerBreakpoint(breakpoint.line);
    }

    // Send to server if debugging
    if (this.debugSession) {
      this.sendDebugCommand('remove_breakpoint', {
        breakpointId: id
      });
    }
  }

  toggleBreakpoint(id) {
    const breakpoint = this.breakpoints.get(id);
    if (breakpoint) {
      breakpoint.enabled = !breakpoint.enabled;
      this.updateBreakpointsDisplay();
    }
  }

  updateBreakpointsDisplay() {
    if (!this.breakpointsList) return;
    
    let html = '';
    this.breakpoints.forEach((breakpoint, id) => {
      const checkboxId = `breakpoint-checkbox-${id}`;
      html += `
        <div class="breakpoint-item ${breakpoint.enabled ? 'active' : ''}" data-breakpoint-id="${id}">
          <input type="checkbox" id="${checkboxId}" class="breakpoint-checkbox" ${breakpoint.enabled ? 'checked' : ''}>
          <label for="${checkboxId}" class="breakpoint-location">${breakpoint.location}:${breakpoint.line}</label>
        </div>
      `;
    });
    
    if (html === '') {
      html = '<div class="no-breakpoints">No breakpoints set</div>';
    }
    
    this.breakpointsList.innerHTML = html;
  }

  updateCodeEditorBreakpoints() {
    this.renderCodeEditor();
  }

  // Call Stack Management
  updateCallStack() {
    if (!this.callStackElement) return;
    
    if (this.callStack.length === 0) {
      this.callStackElement.innerHTML = '<div class="empty-state">No call stack available</div>';
      return;
    }
    
    this.callStackElement.innerHTML = this.callStack.map(frame => `
      <div class="call-stack-frame">
        <div class="frame-function">${frame.function}</div>
        <div class="frame-location">${frame.location}</div>
      </div>
    `).join('');
  }

  // Variables View Management
  updateVariablesView() {
    if (!this.variablesView) return;
    
    const variableGroups = [
      { name: 'Memory', data: this.variables.memory, icon: '🧠' },
      { name: 'Resources', data: this.variables.resources, icon: '⚡' },
      { name: 'Processes', data: this.variables.processes, icon: '⚙️' }
    ];
    
    this.variablesView.innerHTML = variableGroups.map(group => {
      if (!group.data || (Array.isArray(group.data) && group.data.length === 0) ||
          (typeof group.data === 'object' && Object.keys(group.data).length === 0)) {
        return `
          <div class="variable-group">
            <div class="variable-group-header">${group.icon} ${group.name}</div>
            <div class="variable-group-content">
              <div class="empty-state">No ${group.name.toLowerCase()} data</div>
            </div>
          </div>
        `;
      }
      
      return `
        <div class="variable-group">
          <div class="variable-group-header expanded">${group.icon} ${group.name}</div>
          <div class="variable-group-content">
            ${this.renderVariableData(group.data)}
          </div>
        </div>
      `;
    }).join('');
  }

  renderVariableData(data) {
    if (Array.isArray(data)) {
      return data.map((item, index) => `
        <div class="variable-item">
          <span class="variable-name">[${index}]</span>
          <span class="variable-value">${this.formatVariableValue(item)}</span>
        </div>
      `).join('');
    } else if (typeof data === 'object') {
      return Object.entries(data).map(([key, value]) => `
        <div class="variable-item">
          <span class="variable-name">${key}</span>
          <span class="variable-value">${this.formatVariableValue(value)}</span>
        </div>
      `).join('');
    } else {
      return `<div class="variable-item">
        <span class="variable-value">${this.formatVariableValue(data)}</span>
      </div>`;
    }
  }

  formatVariableValue(value) {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'string') return `"${value}"`;
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  }

  // Execution State Management
  updateExecutionState(newState) {
    if (newState && this.stateManager) {
      this.stateManager.setDebuggerExecutionState(newState);
    }
    
    const isRunning = this.executionState === 'running';
    const isPaused = this.executionState === 'paused';
    const isStopped = this.executionState === 'stopped';
    
    // Update button states
    if (this.stepIntoBtn) this.stepIntoBtn.disabled = isRunning;
    if (this.stepOverBtn) this.stepOverBtn.disabled = isRunning;
    if (this.continueBtn) this.continueBtn.disabled = !isPaused;
    if (this.breakAllBtn) this.breakAllBtn.disabled = !isRunning;
    
    // Update execution state indicator
    const indicator = document.querySelector('.execution-state .state-indicator');
    if (indicator) {
      indicator.className = `state-indicator ${this.executionState}`;
    }
    
    const stateText = document.querySelector('.execution-state .state-text');
    if (stateText) {
      stateText.textContent = this.executionState.charAt(0).toUpperCase() + this.executionState.slice(1);
    }
  }

  highlightCurrentLine(lineNumber) {
    if (this.stateManager) {
      this.stateManager.setDebuggerCurrentLine(lineNumber);
    }
    // renderCodeEditor will be called by state subscription
  }

  // Debug session management
  startDebugging() {
    if (!this.currentCharacter) return;

    if (this.stateManager) {
      this.stateManager.setDebuggerActive(true);
    }

    this.debugSession = {
      id: `debug_${this.currentCharacter.id}_${Date.now()}`,
      characterId: this.currentCharacter.id,
      status: 'active'
    };

    this.updateExecutionState('paused');
    this.updateDebuggerForCharacter(this.currentCharacter);

    console.log('Debugging started for', this.currentCharacter.name);
  }

  stopDebugging() {
    if (this.stateManager) {
      this.stateManager.setDebuggerActive(false);
      this.stateManager.setDebuggerExecutionState('stopped');
      this.stateManager.setDebuggerCurrentLine(null);
      this.stateManager.setDebuggerCallStack([]);
    }

    this.debugSession = null;

    // UI updates will be handled by state subscriptions
    console.log('Debugging stopped');
  }

  // Socket event handlers
  handleDebugResult(data) {
    console.log('Debug result received:', data);
    
    if (data.result.error) {
      this.logger.error(`Debug Error: ${data.result.error}`);
      // Note: Notification would be handled by app when it's available
      return;
    }
    
    // Handle specific command results
    switch (data.command) {
      case 'step_into':
      case 'step_over':
        this.updateExecutionState('paused');
        break;
      case 'continue':
        this.updateExecutionState('running');
        break;
      case 'break_all':
        this.updateExecutionState('paused');
        break;
    }
  }

  handleConsciousnessUpdate(data) {
    console.log('🔄 Debugger received consciousness update:', data);
    
    /* ------------------------------------------------------------------
     * Accept updates that either explicitly reference the current
     * characterId OR contain no characterId (legacy notifyComponents
     * call).  This ensures the debugger still refreshes when the top-level
     * consciousness manager broadcasts an object without metadata.
     * ------------------------------------------------------------------ */
    if (data.characterId && data.characterId !== this.currentCharacter?.id) {
      // Ignore updates for other characters
      return;
    }
      // Store the consciousness state
      this.consciousnessState = data;
      
      // Update debugger displays with real data
      this.updateFromCharacter(data);
      
      // Regenerate code with new state
      this.generateConsciousnessCode();
      this.renderCodeEditor();
      
      // Update variables view with real consciousness data
      this.updateVariablesFromCharacter({ consciousness: data.state?.consciousness || data.consciousness });
      this.updateVariablesView();
      this.updateCallStack();
      
      console.log('✅ Debugger interface updated with real consciousness state');
    }

  // New method to update debugger from consciousness data
  updateFromCharacter(consciousnessData) {
    if (!consciousnessData) return;
    
    const state = consciousnessData.state?.consciousness || consciousnessData.consciousness;
    if (!state) return;
    
    // Update execution state based on consciousness status
    if (state.processes && state.processes.length > 0) {
      const hasRunningProcesses = state.processes.some(p => p.status === 'running');
      this.updateExecutionState(hasRunningProcesses ? 'running' : 'paused');
    } else {
      this.updateExecutionState('stopped');
    }

    // Update current line based on any active debugging info
    if (state.debug_hooks && state.debug_hooks.length > 0) {
      const activeHook = state.debug_hooks.find(h => h.active);
      if (activeHook && activeHook.line && this.stateManager) {
        this.stateManager.setDebuggerCurrentLine(activeHook.line);
      }
    }
  }

  handleInterventionApplied(data) {
  if (this.isActive && data.characterId === this.currentCharacter?.id) {
    console.log('Intervention applied during debugging:', data);
    
    // Check if intervention was successful
    if (data.error) {
      this.logger.error('Intervention error:', data.error);
      // Note: Notification would be handled by app when it's available
      return;
    }

    // Show success message
    if (data.result && data.result.success) {
      this.logger.info(`Intervention applied: ${data.intervention.type}`);
      // Note: Notification would be handled by app when it's available
    }
    
    // Don't try to access data.state.consciousness - it doesn't exist in intervention responses
    // Consciousness updates will come through the normal consciousness-update channel
  }
}

  handleDebugSessionStarted(data) {
    console.log('Debug session started:', data);
    this.debugSession = {
      id: data.sessionId,
      characterId: data.characterId,
      status: 'active'
    };
    this.startDebugging();
  }

  handleBreakpointTriggered(data) {
    console.log('Breakpoint triggered:', data);
    this.updateExecutionState('paused');

    // Highlight the line where breakpoint was hit
    const line = this.getLineFromTarget(data.hook.target);
    this.highlightCurrentLine(line);

    this.logger.warn(`Breakpoint hit: ${data.hook.name}`);
    // Note: Notification would be handled by app when it's available
  }

  // Helper methods
  updateCallStackFromCharacter(character) {
    if (!character?.consciousness) return;

    // Generate call stack from running processes
    const callStack = character.consciousness.processes
      .filter(p => p.status === 'running')
      .slice(0, 5)
      .map((process, index) => ({
        function: `${process.name}::execute`,
        location: `consciousness.cpp:${45 + index * 10}`,
        process: process
      }));

    if (this.stateManager) {
      this.stateManager.setDebuggerCallStack(callStack);
    }
  }

  updateVariablesFromCharacter(character) {
    if (!character?.consciousness) return;

    const variables = {
      memory: character.consciousness.memory || {},
      resources: character.consciousness.resources || {},
      processes: character.consciousness.processes || []
    };

    if (this.stateManager) {
      this.stateManager.setDebuggerVariables(variables);
    }
  }

  getLineFromTarget(target) {
    // Map process targets to code lines
    const targetLineMap = {
      'Grief_Manager.exe': 15,
      'Search_Protocol.exe': 25,
      'Temporal_Sync.dll': 35,
      'Relationship_Handler.exe': 45,
      'Memory_Allocator': 10,
      'Process_Manager': 20
    };
    
    return targetLineMap[target] || 1;
  }
}

// Export DebuggerInterface class for dependency injection
export default DebuggerInterface;