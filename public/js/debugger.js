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
        if (e.target.classList.contains('breakpoint-checkbox')) {
          const breakpointId = e.target.closest('.breakpoint-item').dataset.breakpointId;
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

  // UI Update Methods
  updateDebuggerForCharacter(character) {
    if (!character) return;
    
    this.generateConsciousnessCode(character);
    this.updateVariablesFromCharacter(character);
    this.updateCallStackFromCharacter(character);
    this.updateBreakpointsDisplay();
  }

  generateConsciousnessCode(character = this.currentCharacter) {
    if (!character) return;
    
    // Generate C++-like code representation of consciousness
    const code = this.generateCodeFromConsciousness(character.consciousness);
    this.codeLines = code.split('\n');
    this.renderCodeEditor();
  }

  generateCodeFromConsciousness(consciousness) {
    if (!consciousness) return '// No consciousness data available';
    
    let code = `// Consciousness Runtime - ${this.currentCharacter?.name || 'Unknown'}\n`;
    code += `#include <consciousness.h>\n`;
    code += `#include <memory_manager.h>\n`;
    code += `#include <process_manager.h>\n\n`;
    
    code += `class ConsciousnessCore {\nprivate:\n`;
    
    // Memory section
    if (consciousness.memory) {
      code += `    // Memory Management\n`;
      Object.entries(consciousness.memory).forEach(([key, value]) => {
        const type = typeof value === 'number' ? 'float' : 'std::string';
        code += `    ${type} ${key} = ${JSON.stringify(value)};\n`;
      });
      code += `\n`;
    }
    
    // Processes section
    if (consciousness.processes) {
      code += `    // Active Processes\n`;
      consciousness.processes.forEach((process, index) => {
        code += `    Process ${process.name.replace(/[^a-zA-Z0-9]/g, '_')};\n`;
      });
      code += `\n`;
    }
    
    code += `public:\n`;
    code += `    void update() {\n`;
    
    // Process execution simulation
    if (consciousness.processes) {
      consciousness.processes.forEach((process) => {
        const status = process.status === 'running' ? 'execute' : 'suspend';
        code += `        ${process.name.replace(/[^a-zA-Z0-9]/g, '_')}.${status}();\n`;
      });
    }
    
    code += `        \n        // Resource management\n`;
    code += `        this->manageResources();\n`;
    code += `        this->processEmotions();\n`;
    code += `        this->updateMemory();\n`;
    code += `    }\n\n`;
    
    // Error handling
    if (consciousness.system_errors && consciousness.system_errors.length > 0) {
      code += `    void handleErrors() {\n`;
      consciousness.system_errors.forEach((error) => {
        code += `        // ERROR: ${error.type} - ${error.message}\n`;
        code += `        this->logError("${error.type}", "${error.message}");\n`;
      });
      code += `    }\n\n`;
    }
    
    code += `};`;
    
    return code;
  }

  renderCodeEditor() {
    if (!this.codeEditor) return;
    
    let html = '<div class="code-content">';
    
    this.codeLines.forEach((line, index) => {
      const lineNumber = index + 1;
      const hasBreakpoint = Array.from(this.breakpoints.values()).some(bp => bp.line === lineNumber);
      const isCurrentLine = this.currentLine === lineNumber;
      
      html += `<div class="code-line ${isCurrentLine ? 'current-line' : ''}">`;
      html += `<span class="line-number ${hasBreakpoint ? 'has-breakpoint' : ''}" data-line="${lineNumber}">${lineNumber}</span>`;
      html += `<span class="line-content">${this.highlightSyntax(line)}</span>`;
      html += `</div>`;
    });
    
    html += '</div>';
    this.codeEditor.innerHTML = html;
  }

  highlightSyntax(line) {
    // Basic C++ syntax highlighting
    return line
      .replace(/\b(class|public|private|void|int|float|std::string|#include)\b/g, '<span class="keyword">$1</span>')
      .replace(/\b(this|new|delete|return)\b/g, '<span class="keyword">$1</span>')
      .replace(/"([^"]*)"/g, '<span class="string">"$1"</span>')
      .replace(/\/\/(.*)$/g, '<span class="comment">//$1</span>')
      .replace(/\b([A-Z][a-zA-Z0-9_]*)\b/g, '<span class="type">$1</span>');
  }

  updateBreakpointsDisplay() {
    if (!this.breakpointsList) return;
    
    let html = '';
    this.breakpoints.forEach((breakpoint, id) => {
      html += `
        <div class="breakpoint-item ${breakpoint.enabled ? 'active' : ''}" data-breakpoint-id="${id}">
          <div class="breakpoint-checkbox ${breakpoint.enabled ? 'checked' : ''}"></div>
          <div class="breakpoint-location">${breakpoint.location}</div>
          <div class="breakpoint-line">:${breakpoint.line}</div>
        </div>
      `;
    });
    
    if (html === '') {
      html = '<div class="no-breakpoints">No breakpoints set</div>';
    }
    
    this.breakpointsList.innerHTML = html;
  }

  updateCallStack() {
    if (!this.callStackElement) return;
    
    let html = '';
    
    if (this.callStack.length > 0) {
      this.callStack.forEach((frame, index) => {
        html += `
          <div class="stack-frame ${index === 0 ? 'current' : ''}">
            <div class="frame-function">${frame.function}</div>
            <div class="frame-location">${frame.location}</div>
          </div>
        `;
      });
    } else {
      // Generate call stack from current character state
      if (this.currentCharacter?.consciousness?.processes) {
        const runningProcesses = this.currentCharacter.consciousness.processes
          .filter(p => p.status === 'running')
          .slice(0, 5);
        
        runningProcesses.forEach((process, index) => {
          html += `
            <div class="stack-frame ${index === 0 ? 'current' : ''}">
              <div class="frame-function">${process.name}::execute()</div>
              <div class="frame-location">consciousness.cpp:${45 + index * 10}</div>
            </div>
          `;
        });
      }
    }
    
    if (html === '') {
      html = '<div class="no-stack">No active stack frames</div>';
    }
    
    this.callStackElement.innerHTML = html;
  }

  updateVariablesView() {
    if (!this.variablesView || !this.currentCharacter) return;
    
    const consciousness = this.currentCharacter.consciousness;
    let html = '';
    
    // Memory variables
    if (consciousness.memory) {
      html += `
        <div class="variable-group">
          <div class="variable-group-header expanded">Memory</div>
          <div class="variable-list">
      `;
      
      Object.entries(consciousness.memory).forEach(([key, value]) => {
        const type = typeof value;
        html += `
          <div class="variable-item">
            <span class="variable-name">${key}</span>
            <span class="variable-value">${JSON.stringify(value)}</span>
            <span class="variable-type">${type}</span>
          </div>
        `;
      });
      
      html += `</div></div>`;
    }
    
    // Resources variables
    if (consciousness.resources) {
      html += `
        <div class="variable-group">
          <div class="variable-group-header expanded">Resources</div>
          <div class="variable-list">
      `;
      
      Object.entries(consciousness.resources).forEach(([key, value]) => {
        const displayValue = typeof value === 'object' ? `${value.current}/${value.max}` : value;
        html += `
          <div class="variable-item">
            <span class="variable-name">${key}</span>
            <span class="variable-value">${displayValue}</span>
            <span class="variable-type">resource</span>
          </div>
        `;
      });
      
      html += `</div></div>`;
    }
    
    // Process variables
    if (consciousness.processes) {
      html += `
        <div class="variable-group">
          <div class="variable-group-header">Processes</div>
          <div class="variable-list" style="display: none;">
      `;
      
      consciousness.processes.forEach((process) => {
        html += `
          <div class="variable-item">
            <span class="variable-name">${process.name}</span>
            <span class="variable-value">${process.status}</span>
            <span class="variable-type">process</span>
          </div>
        `;
      });
      
      html += `</div></div>`;
    }
    
    this.variablesView.innerHTML = html || '<div class="no-variables">No variables available</div>';
  }

  updateExecutionState(newState = null) {
    if (newState) {
      this.executionState = newState;
    }
    
    // Update button states
    const isRunning = this.executionState === 'running';
    const isPaused = this.executionState === 'paused';
    const isStopped = this.executionState === 'stopped';
    
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
      this.updateDebuggerForCharacter({ consciousness: data.state.consciousness });
      
      if (window.app) {
        window.app.showNotification(`Intervention applied: ${data.intervention.type}`, 'success');
      }
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