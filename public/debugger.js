// Complete Debugger Interface Module
class DebuggerInterface {
  constructor() {
    this.isActive = false;
    this.currentCharacter = null;
    this.breakpoints = [];
    this.callStack = [];
    this.variables = {};
    this.currentLine = null;
    this.executionState = 'stopped'; // stopped, running, paused
    this.debugSession = null;
    
    this.init();
  }

  init() {
    this.setupElements();
    this.setupEventListeners();
    this.subscribeToStateChanges();
    this.setupSocketListeners();
  }

  setupElements() {
    this.stepIntoBtn = document.getElementById('stepInto');
    this.stepOverBtn = document.getElementById('stepOver');
    this.continueBtn = document.getElementById('continue');
    this.breakAllBtn = document.getElementById('breakAll');
    
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
    // Add event delegation for dynamic breakpoint controls
    if (this.breakpointsList) {
      this.breakpointsList.addEventListener('click', (e) => {
        if (e.target.classList.contains('breakpoint-checkbox')) {
          const breakpointId = e.target.closest('.breakpoint-item').dataset.breakpointId;
          this.toggleBreakpoint(breakpointId);
        }
      });
    }

    // Add event delegation for line number clicks
    if (this.codeEditor) {
      this.codeEditor.addEventListener('click', (e) => {
        if (e.target.classList.contains('line-number')) {
          const line = parseInt(e.target.dataset.line);
          this.toggleBreakpointAtLine(line);
        }
      });
    }
  }

  setupSocketListeners() {
    if (!window.socketClient) return;

    // Listen for debug results
    window.socketClient.on('debug-result', (data) => {
      this.handleDebugResult(data);
    });
    
    // Listen for intervention results
    window.socketClient.on('intervention-applied', (data) => {
      this.handleInterventionApplied(data);
    });

    // Listen for debug session events
    window.socketClient.on('debug-session-started', (data) => {
      this.handleDebugSessionStarted(data);
    });

    // Listen for breakpoint triggers
    window.socketClient.on('debug-hook-triggered', (data) => {
      this.handleBreakpointTriggered(data);
    });
  }

  subscribeToStateChanges() {
    window.stateManager.subscribe('currentCharacter', (character) => {
      this.currentCharacter = character;
      if (character && this.isActive) {
        this.loadCharacterDebugInfo(character);
      }
    });

    window.stateManager.subscribe('breakpoints', (breakpoints) => {
      this.breakpoints = breakpoints;
      this.updateBreakpointsList();
    });

    window.stateManager.subscribe('debuggingSession', (session) => {
      this.debugSession = session;
      if (session && session.status === 'active') {
        this.startDebugging();
      }
    });
  }

  initialize() {
    this.isActive = true;
    
    if (this.currentCharacter) {
      this.loadCharacterDebugInfo(this.currentCharacter);
    }
    
    this.renderCodeEditor();
    this.updateBreakpointsList();
    this.updateCallStack();
    this.updateVariablesView();
    this.updateExecutionState();
  }

  startDebugging() {
    this.executionState = 'paused';
    this.updateExecutionState();
    this.highlightCurrentLine(15); // Start at grief processing line
    
    if (window.app) {
      window.app.showNotification('Debug session started', 'success');
    }
  }

  loadCharacterDebugInfo(character) {
    if (!character.consciousness) return;
    
    // Load debug hooks as breakpoints
    if (character.consciousness.debug_hooks) {
      const existingBreakpoints = window.stateManager.getBreakpoints();
      
      character.consciousness.debug_hooks.forEach(hook => {
        const exists = existingBreakpoints.find(bp => bp.id === hook.id);
        if (!exists && hook.enabled) {
          window.stateManager.addBreakpoint({
            id: hook.id,
            name: hook.name,
            type: hook.type,
            target: hook.target,
            condition: hook.condition,
            enabled: hook.enabled,
            line: this.getLineFromTarget(hook.target)
          });
        }
      });
    }
    
    // Update call stack from processes
    this.updateCallStackFromProcesses(character.consciousness.processes);
    
    // Load variables from memory and resources
    this.updateVariablesFromConsciousness(character.consciousness);
  }

  getLineFromTarget(target) {
    // Map debug hook targets to line numbers
    const lineMap = {
      'Grief_Manager.exe': 15,
      'Search_Protocol.exe': 25,
      'Relationship_Handler.exe': 35,
      'Reality_Parser.exe': 45,
      'Temporal_Sync.dll': 20,
      'Physics_Engine.dll': 30,
      'Memory_Defrag.sys': 40
    };
    
    return lineMap[target] || 1;
  }

  renderCodeEditor() {
    if (!this.codeEditor) return;
    
    const consciousnessCode = this.generateConsciousnessCode();
    
    this.codeEditor.innerHTML = `
      <div class="code-editor-header">
        <span class="code-file-name">consciousness_core.cpp</span>
        <div class="code-editor-actions">
          <div class="execution-state">
            <div class="state-indicator ${this.executionState}"></div>
            <span>${this.executionState.toUpperCase()}</span>
          </div>
        </div>
      </div>
      <div class="code-content">
        <div class="line-numbers">
          ${consciousnessCode.split('\n').map((_, i) => 
            `<span class="line-number" data-line="${i + 1}">${i + 1}</span>`
          ).join('')}
        </div>
        <div class="code-lines">
          ${this.highlightSyntax(consciousnessCode)}
        </div>
      </div>
    `;
    
    // Update breakpoint indicators
    this.updateBreakpointIndicators();
  }

  generateConsciousnessCode() {
    return `// Consciousness Core System - Alexander Kane
#include "consciousness.h"
#include "memory_manager.h"
#include "process_scheduler.h"
#include "temporal_sync.h"

class AlexanderKaneConsciousness : public ConsciousnessCore {
private:
    MemoryManager memory;
    ProcessScheduler scheduler;
    ResourceAllocator resources;
    TemporalSync temporal_sync;
    
public:
    void process_grief(EmotionalEvent leo_memory) {
        // CRITICAL: Memory leak detected in grief processing
        Process* grief_manager = scheduler.get_process(1001);
        if (grief_manager && leo_memory.intensity > 0) {
            // Allocating memory for Leo attachment
            void* leo_attachment = memory.allocate(leo_memory.intensity * 1024);
            grief_manager->attach_memory(leo_attachment);
            // WARNING: Memory never deallocated - growing infinitely
        }
    }
    
    void sync_temporal_field() {
        // Temporal synchronization with reality
        if (!temporal_sync.is_synchronized()) {
            temporal_sync.recalibrate();
            // May cause reality parsing errors
        }
    }
    
    SearchResult search_for_leo() {
        // INFINITE LOOP: Search never terminates
        while (true) {
            for (Timeline timeline : all_possible_timelines) {
                if (timeline.contains_person("Leo Kane", age=8)) {
                    // This condition is never satisfied
                    return timeline.extract_person("Leo Kane");
                }
                // Continue searching indefinitely
            }
            // CPU usage: 67.2% and climbing
        }
    }
    
    void run_physics_calculations() {
        // Theoretical physics processing
        quantum_field_solver.compute_temporal_equations();
        dimensional_analyzer.process_quantum_states();
        // Stable process, minimal resource usage
    }
    
    void maintain_relationship(Person person) {
        // THREAD STARVATION: Insufficient resources allocated
        Thread* relationship_thread = scheduler.get_thread(person.thread_id);
        if (resources.attention.available < 10) {
            // Not enough attention for relationship maintenance
            relationship_thread->set_priority(LOWEST);
            relationship_thread->set_status(STARVED);
            return; // Relationship degrading
        }
        relationship_thread->allocate_time(resources.attention.available * 0.05);
    }
    
    void defragment_memory() {
        // Memory optimization system
        memory.consolidate_fragments();
        memory.optimize_allocation();
        // Helps reduce memory pressure
    }
    
    RealityFrame parse_current_reality(SensoryInput input) {
        // TEMPORAL DESYNC: Cannot distinguish between timelines
        if (!temporal_sync.is_synchronized()) {
            throw TemporalDesyncException("Reality parsing failed");
        }
        
        RealityFrame frame = reality_parser.process(input);
        if (frame.contains_leo_signature()) {
            // False positive - Leo not actually present
            trigger_hope_spike();
            return frame; // Incorrect reality interpretation
        }
        return frame;
    }
    
    void allocate_attention() {
        // Resource allocation heavily skewed toward Leo search
        resources.attention.allocate("Leo_Search", 67.2);
        resources.attention.allocate("Grief_Processing", 22.5);
        resources.attention.allocate("Reality_Parsing", 8.1);
        resources.attention.allocate("Relationships", 2.2);
        // Total: 100% - no spare capacity
    }
    
    void handle_memory_access(MemoryAddress addr) {
        if (addr == LEO_MEMORY_REGION) {
            // Protected memory - access causes segmentation fault
            if (!memory.has_permission(addr, READ_PROTECTED)) {
                throw SegmentationFault("Unauthorized Leo memory access");
            }
        }
        return memory.read(addr);
    }
};

// Main consciousness loop
int main() {
    AlexanderKaneConsciousness consciousness;
    consciousness.initialize();
    
    while (consciousness.is_active()) {
        consciousness.process_grief(current_leo_memory);
        consciousness.sync_temporal_field();
        consciousness.search_for_leo();
        consciousness.run_physics_calculations();
        consciousness.maintain_relationship(emily);
        consciousness.defragment_memory();
        consciousness.parse_current_reality(sensory_input);
        consciousness.allocate_attention();
        
        // System becoming increasingly unstable
        if (consciousness.memory_usage() > 800MB) {
            log_error("CRITICAL: Memory leak detected");
        }
    }
    
    return 0;
}`;
  }

  highlightSyntax(code) {
    return code
      .replace(/\b(class|void|int|if|else|while|for|return|throw|private|public|include)\b/g, '<span class="keyword">$1</span>')
      .replace(/"([^"]*)"/g, '<span class="string">"$1"</span>')
      .replace(/\b(\d+(?:\.\d+)?)\b/g, '<span class="number">$1</span>')
      .replace(/\/\/.*$/gm, '<span class="comment">$&</span>')
      .replace(/\b([A-Z][a-zA-Z_]*)\s*\(/g, '<span class="function">$1</span>(')
      .replace(/\b([a-z_][a-zA-Z0-9_]*)\s*\(/g, '<span class="function">$1</span>(')
      .split('\n')
      .map((line, i) => `<span class="code-line" data-line="${i + 1}">${line}</span>`)
      .join('\n');
  }

  updateBreakpointsList() {
    if (!this.breakpointsList) return;
    
    const breakpoints = window.stateManager.getBreakpoints();
    
    this.breakpointsList.innerHTML = breakpoints.map(bp => `
      <div class="breakpoint-item ${bp.enabled ? 'active' : ''}" data-breakpoint-id="${bp.id}">
        <div class="breakpoint-checkbox ${bp.enabled ? 'checked' : ''}"></div>
        <div class="breakpoint-location">
          <div class="breakpoint-name">${bp.name}</div>
          <div class="breakpoint-line">${bp.target} ${bp.line ? `(Line ${bp.line})` : ''}</div>
        </div>
      </div>
    `).join('');
    
    this.updateBreakpointIndicators();
  }

  updateBreakpointIndicators() {
    if (!this.codeEditor) return;
    
    // Clear existing breakpoint indicators
    this.codeEditor.querySelectorAll('.line-number').forEach(lineNum => {
      lineNum.classList.remove('breakpoint');
    });
    
    // Add breakpoint indicators
    const breakpoints = window.stateManager.getBreakpoints();
    breakpoints.forEach(bp => {
      if (bp.enabled && bp.line) {
        const lineElement = this.codeEditor.querySelector(`[data-line="${bp.line}"]`);
        if (lineElement) {
          lineElement.classList.add('breakpoint');
        }
      }
    });
  }

  updateCallStack() {
    if (!this.callStackElement) return;
    
    const stackFrames = [
      { 
        function: 'process_grief(leo_memory)', 
        location: 'consciousness_core.cpp:15', 
        current: this.currentLine === 15,
        variables: { leo_memory: 'EmotionalEvent{intensity: 89.7}' }
      },
      { 
        function: 'handle_emotional_event()', 
        location: 'emotion_processor.cpp:89', 
        current: false,
        variables: { event_type: 'GRIEF', severity: 'CRITICAL' }
      },
      { 
        function: 'main_consciousness_loop()', 
        location: 'consciousness_core.cpp:75', 
        current: false,
        variables: { loop_count: '15847', uptime: '98 days' }
      }
    ];
    
    this.callStackElement.innerHTML = stackFrames.map(frame => `
      <div class="stack-frame ${frame.current ? 'current' : ''}">
        <div class="frame-function">${frame.function}</div>
        <div class="frame-location">${frame.location}</div>
      </div>
    `).join('');
  }

  updateVariablesView() {
    if (!this.variablesView) return;
    
    const consciousness = window.stateManager.getConsciousnessState();
    const resources = window.stateManager.getResources();
    const processes = window.stateManager.getProcesses();
    
    const variables = {
      'Local Variables': {
        'leo_memory.intensity': { value: '89.7', type: 'float' },
        'grief_manager': { value: 'Process*{pid:1001}', type: 'Process*' },
        'leo_attachment': { value: '0x7FF8A1B2C000', type: 'void*' },
        'memory_allocated': { value: '847MB', type: 'size_t' }
      },
      'Emotional State': {
        'guilt_level': { value: '94.2', type: 'float' },
        'hope_remaining': { value: '23.4', type: 'float' },
        'attachment_strength': { value: '100.0', type: 'float' },
        'grief_intensity': { value: '89.7', type: 'float' }
      },
      'System Resources': {
        'attention.current': { value: resources?.attention?.current?.toFixed(1) || '23.4', type: 'float' },
        'emotional_energy.current': { value: resources?.emotional_energy?.current?.toFixed(1) || '15.7', type: 'float' },
        'processing_capacity.current': { value: resources?.processing_capacity?.current?.toFixed(1) || '94.8', type: 'float' }
      },
      'Process Information': {
        'active_processes': { value: processes?.length?.toString() || '7', type: 'int' },
        'grief_manager.cpu_usage': { value: '89.7%', type: 'float' },
        'search_protocol.status': { value: 'INFINITE_LOOP', type: 'string' },
        'temporal_sync.synchronized': { value: 'false', type: 'bool' }
      }
    };
    
    this.variablesView.innerHTML = Object.entries(variables).map(([groupName, vars]) => `
      <div class="variable-group">
        <div class="variable-group-header expanded">${groupName}</div>
        <div class="variable-list">
          ${Object.entries(vars).map(([name, data]) => `
            <div class="variable-item">
              <span class="variable-name">${name}</span>
              <span class="variable-value">${data.value}</span>
              <span class="variable-type">${data.type}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `).join('');
    
    // Add click handlers for variable group headers
    this.variablesView.querySelectorAll('.variable-group-header').forEach(header => {
      header.addEventListener('click', () => {
        header.classList.toggle('expanded');
        const list = header.nextElementSibling;
        if (list) {
          list.style.display = header.classList.contains('expanded') ? 'block' : 'none';
        }
      });
    });
  }

  updateExecutionState() {
    const indicator = this.codeEditor?.querySelector('.state-indicator');
    const text = this.codeEditor?.querySelector('.execution-state span');
    
    if (indicator) {
      indicator.className = `state-indicator ${this.executionState}`;
    }
    if (text) {
      text.textContent = this.executionState.toUpperCase();
    }
    
    // Update button states
    const isRunning = this.executionState === 'running';
    const isPaused = this.executionState === 'paused';
    
    if (this.stepIntoBtn) this.stepIntoBtn.disabled = isRunning;
    if (this.stepOverBtn) this.stepOverBtn.disabled = isRunning;
    if (this.continueBtn) this.continueBtn.disabled = isRunning;
    if (this.breakAllBtn) this.breakAllBtn.disabled = !isRunning;
  }

  highlightCurrentLine(line) {
    if (!this.codeEditor) return;
    
    // Clear previous current line
    this.codeEditor.querySelectorAll('.line-number.current-line, .code-line.current-line').forEach(el => {
      el.classList.remove('current-line');
    });
    
    // Highlight new current line
    const lineNumber = this.codeEditor.querySelector(`[data-line="${line}"]`);
    const codeLine = this.codeEditor.querySelector(`.code-line[data-line="${line}"]`);
    
    if (lineNumber) lineNumber.classList.add('current-line');
    if (codeLine) codeLine.classList.add('current-line');
    
    this.currentLine = line;
  }

  // Debug control methods
  stepInto() {
    console.log('Step Into - Entering function call');
    this.executionState = 'paused';
    
    // Simulate stepping into grief processing
    if (this.currentLine === 15) {
      this.highlightCurrentLine(18); // Move to memory allocation line
    } else {
      this.highlightCurrentLine((this.currentLine || 15) + 1);
    }
    
    this.updateExecutionState();
    this.sendDebugCommand('step_into');
  }

  stepOver() {
    console.log('Step Over - Executing current line');
    this.executionState = 'paused';
    
    // Simulate stepping over current line
    if (this.currentLine) {
      this.highlightCurrentLine(this.currentLine + 1);
    } else {
      this.highlightCurrentLine(15);
    }
    
    this.updateExecutionState();
    this.sendDebugCommand('step_over');
  }

  continue() {
    console.log('Continue - Resuming execution');
    this.executionState = 'running';
    this.updateExecutionState();
    
    // Simulate hitting breakpoint
    setTimeout(() => {
      this.executionState = 'paused';
      this.highlightCurrentLine(25); // Hit search protocol breakpoint
      this.updateExecutionState();
      
      if (window.app) {
        window.app.showNotification('Breakpoint hit: Search_Protocol.exe infinite loop detected', 'warning');
      }
    }, 2000);
    
    this.sendDebugCommand('continue');
  }

  breakAll() {
    console.log('Break All - Pausing all processes');
    this.executionState = 'paused';
    this.updateExecutionState();
    this.sendDebugCommand('break_all');
  }

  sendDebugCommand(command) {
    if (window.socketClient && this.currentCharacter) {
      window.socketClient.sendDebugCommand(this.currentCharacter.id, command);
    }
  }

  toggleBreakpoint(id) {
    window.stateManager.toggleBreakpoint(id);
    this.updateBreakpointIndicators();
  }

  toggleBreakpointAtLine(line) {
    const breakpoints = window.stateManager.getBreakpoints();
    const existingBp = breakpoints.find(bp => bp.line === line);
    
    if (existingBp) {
      this.toggleBreakpoint(existingBp.id);
    } else {
      // Add new breakpoint
      const newBreakpoint = {
        id: `line_${line}_${Date.now()}`,
        name: `Line ${line} Breakpoint`,
        type: 'breakpoint',
        target: `consciousness_core.cpp:${line}`,
        line: line,
        enabled: true,
        condition: 'always'
      };
      
      window.stateManager.addBreakpoint(newBreakpoint);
    }
  }

  // WebSocket event handlers
  handleDebugResult(data) {
    console.log('Debug result received:', data);
    
    if (data.command === 'debug' && data.success) {
      this.startDebugging();
    }
    
    // Update variables view with debug result
    if (data.result && data.result.variables) {
      this.updateVariablesView();
    }
    
    // Show debug output in terminal if available
    if (window.terminal) {
      window.terminal.addDebugResult(data);
    }
  }

  handleInterventionApplied(data) {
    console.log('Intervention applied:', data);
    
    // Update UI to reflect intervention
    this.updateVariablesView();
    this.updateCallStack();
    
    if (window.app) {
      window.app.showNotification(`Intervention applied: ${data.intervention.type}`, 'success');
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

  // Update methods for consciousness changes
  updateCallStackFromProcesses(processes) {
    if (!processes) return;
    
    // Update call stack based on running processes
    this.updateCallStack();
  }

  updateVariablesFromConsciousness(consciousness) {
    if (!consciousness) return;
    
    // Update variables view with current consciousness state
    this.updateVariablesView();
  }

  onConsciousnessUpdate(event, data) {
    if (event === 'consciousness-updated' && this.isActive) {
      this.updateVariablesFromConsciousness(data);
      this.updateVariablesView();
    }
  }
}

// Create global debugger instance
window.debugger = new DebuggerInterface();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DebuggerInterface;
}