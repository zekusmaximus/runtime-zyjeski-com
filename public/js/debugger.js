// Complete Debugger Interface Module for Runtime.zyjeski.com
class DebuggerInterface {
  constructor() {
    this.isActive = false;
    this.currentCharacter = null;
    this.breakpoints = new Map();
    this.callStack = [];
    this.variables = {};
    this.currentLine = null;
    this.executionState = 'stopped'; // stopped, running, paused
    this.debugSession = null;
    this.codeLines = [];
    
    this.init();
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
    if (window.app && window.app.currentCharacter) {
      this.currentCharacter = window.app.currentCharacter;
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
    if (window.socketClient) {
      window.socketClient.on('debug-result', (data) => this.handleDebugResult(data));
      window.socketClient.on('consciousness-update', (data) => this.handleConsciousnessUpdate(data));
      window.socketClient.on('intervention-applied', (data) => this.handleInterventionApplied(data));
      window.socketClient.on('debug-session-started', (data) => this.handleDebugSessionStarted(data));
      window.socketClient.on('breakpoint-triggered', (data) => this.handleBreakpointTriggered(data));
    }
  }

  subscribeToStateChanges() {
    if (window.stateManager) {
      window.stateManager.subscribe('character-changed', (character) => {
        this.currentCharacter = character;
        this.updateDebuggerForCharacter(character);
      });

      window.stateManager.subscribe('debug-mode-changed', (isDebugMode) => {
        if (isDebugMode) {
          this.startDebugging();
        } else {
          this.stopDebugging();
        }
      });
    }
  }

  // Update debugger interface for character
  updateDebuggerForCharacter(character) {
    if (!character) return;
    
    this.currentCharacter = character;
    
    // Update call stack and variables
    this.updateCallStackFromCharacter(character);
    this.updateVariablesFromCharacter(character);
    
    // Refresh displays
    this.updateCallStack();
    this.updateVariablesView();
    this.renderCodeEditor();
    
    console.log('Debugger updated for character:', character.name);
  }

  // Generate consciousness code representation
  generateConsciousnessCode() {
    this.codeLines = [
      '// Consciousness Runtime - Alexander Kane',
      '#include <consciousness.h>',
      '#include <memory_manager.h>',
      '#include <process_scheduler.h>',
      '',
      'int main() {',
      '    ConsciousnessRuntime runtime;',
      '    runtime.initialize();',
      '    ',
      '    // Memory allocation',
      '    MemoryAllocator* memory = runtime.getMemoryAllocator();',
      '    ProcessManager* processes = runtime.getProcessManager();',
      '    ',
      '    // Core processes',
      '    Process* grief_mgr = processes->spawn("Grief_Manager.exe");',
      '    Process* search_proto = processes->spawn("Search_Protocol.exe");',
      '    Process* temporal_sync = processes->spawn("Temporal_Sync.dll");',
      '    Process* rel_handler = processes->spawn("Relationship_Handler.exe");',
      '    ',
      '    // Main execution loop',
      '    while (runtime.isRunning()) {',
      '        try {',
      '            grief_mgr->execute();',
      '            search_proto->execute();',
      '            temporal_sync->execute();',
      '            rel_handler->execute();',
      '            ',
      '            runtime.processEvents();',
      '            runtime.garbageCollect();',
      '            ',
      '        } catch (MemoryLeakException& e) {',
      '            runtime.handleError(e);',
      '        } catch (InfiniteLoopException& e) {',
      '            runtime.handleError(e);',
      '        } catch (ThreadStarvationException& e) {',
      '            runtime.handleError(e);',
      '        }',
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
    if (window.socketClient && this.currentCharacter) {
      window.socketClient.emit('debug-command', {
        characterId: this.currentCharacter.id,
        command: command,
        args: args
      });
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
    this.breakpoints.set(id, breakpoint);
    
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
    this.breakpoints.delete(id);
    
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
    if (newState) {
      this.executionState = newState;
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
    this.currentLine = lineNumber;
    this.renderCodeEditor();
  }

  // Debug session management
  startDebugging() {
    if (!this.currentCharacter) return;
    
    this.isActive = true;
    this.debugSession = {
      id: `debug_${this.currentCharacter.id}_${Date.now()}`,
      characterId: this.currentCharacter.id,
      status: 'active'
    };
    
    this.executionState = 'paused';
    this.updateExecutionState();
    this.updateDebuggerForCharacter(this.currentCharacter);
    
    console.log('Debugging started for', this.currentCharacter.name);
  }

  stopDebugging() {
    this.isActive = false;
    this.debugSession = null;
    this.executionState = 'stopped';
    this.currentLine = null;
    this.callStack = [];
    
    this.updateExecutionState();
    this.renderCodeEditor();
    
    console.log('Debugging stopped');
  }

  // Socket event handlers
  handleDebugResult(data) {
    console.log('Debug result received:', data);
    
    if (data.result.error) {
      if (window.app) {
        window.app.showNotification(`Debug Error: ${data.result.error}`, 'error');
      }
      return;
    }
    
    // Handle specific command results
    switch (data.command) {
      case 'step_into':
      case 'step_over':
        this.executionState = 'paused';
        this.updateExecutionState();
        break;
      case 'continue':
        this.executionState = 'running';
        this.updateExecutionState();
        break;
      case 'break_all':
        this.executionState = 'paused';
        this.updateExecutionState();
        break;
    }
  }

  handleConsciousnessUpdate(data) {
    if (this.isActive && data.characterId === this.currentCharacter?.id) {
      this.updateVariablesFromCharacter({ consciousness: data.state.consciousness });
      this.updateVariablesView();
      this.updateCallStack();
    }
  }

  handleInterventionApplied(data) {
  if (this.isActive && data.characterId === this.currentCharacter?.id) {
    console.log('Intervention applied during debugging:', data);
    
    // Check if intervention was successful
    if (data.error) {
      console.error('Intervention error:', data.error);
      if (window.app) {
        window.app.showNotification(`Intervention failed: ${data.error}`, 'error');
      }
      return;
    }
    
    // Show success message
    if (data.result && data.result.success) {
      if (window.app) {
        window.app.showNotification(`Intervention applied: ${data.intervention.type}`, 'success');
      }
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
    this.executionState = 'paused';
    
    // Highlight the line where breakpoint was hit
    const line = this.getLineFromTarget(data.hook.target);
    this.highlightCurrentLine(line);
    
    this.updateExecutionState();
    
    if (window.app) {
      window.app.showNotification(`Breakpoint hit: ${data.hook.name}`, 'warning');
    }
  }

  // Helper methods
  updateCallStackFromCharacter(character) {
    if (!character?.consciousness) return;
    
    // Generate call stack from running processes
    this.callStack = character.consciousness.processes
      .filter(p => p.status === 'running')
      .slice(0, 5)
      .map((process, index) => ({
        function: `${process.name}::execute`,
        location: `consciousness.cpp:${45 + index * 10}`,
        process: process
      }));
    
    this.updateCallStack();
  }

  updateVariablesFromCharacter(character) {
    if (!character?.consciousness) return;
    
    this.variables = {
      memory: character.consciousness.memory || {},
      resources: character.consciousness.resources || {},
      processes: character.consciousness.processes || []
    };
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

// Initialize global debugger instance
window.debugger = new DebuggerInterface();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DebuggerInterface;
}