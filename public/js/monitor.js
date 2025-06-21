// Monitor Interface Module
class Monitor {
  constructor() {
    this.isActive = false;
    this.updateInterval = null;
    this.currentCharacter = null;
    this.charts = {};
    
    this.init();
  }

  init() {
    this.setupElements();
    this.setupEventListeners();
    this.subscribeToStateChanges();
  }

  setupElements() {
    this.refreshBtn = document.getElementById('refreshMonitor');
    this.pauseBtn = document.getElementById('pauseMonitor');
    this.resourceMeters = document.getElementById('resourceMeters');
    this.processTable = document.getElementById('processTable');
    this.memoryVisualization = document.getElementById('memoryVisualization');
    this.errorLog = document.getElementById('errorLog');
    
    if (this.refreshBtn) {
      this.refreshBtn.addEventListener('click', () => this.refreshData());
    }
    
    if (this.pauseBtn) {
      this.pauseBtn.addEventListener('click', () => this.togglePause());
    }
  }

  setupEventListeners() {
    // Subscribe to socket events
    if (window.socketClient) {
      window.socketClient.on('consciousness-update', (data) => {
        if (this.isActive) {
          this.updateDisplays(data);
        }
      });
    }
  }

  subscribeToStateChanges() {
    window.stateManager.subscribe('currentCharacter', (character) => {
      this.currentCharacter = character;
      if (character && this.isActive) {
        this.loadCharacterData(character);
      }
    });

    window.stateManager.subscribe('processes', (processes) => {
      if (this.isActive) {
        this.updateProcessTable(processes);
      }
    });

    window.stateManager.subscribe('resources', (resources) => {
      if (this.isActive) {
        this.updateResourceMeters(resources);
      }
    });

    window.stateManager.subscribe('errors', (errors) => {
      if (this.isActive) {
        this.updateErrorLog(errors);
      }
    });
  }

  startMonitoring() {
    this.isActive = true;
    
    if (this.currentCharacter) {
      this.loadCharacterData(this.currentCharacter);
    }
    
    // Start real-time updates
    if (!this.updateInterval) {
      this.updateInterval = setInterval(() => {
        this.refreshData();
      }, 2000);
    }
    
    // Start socket monitoring
    if (window.socketClient && this.currentCharacter) {
      window.socketClient.startMonitoring(this.currentCharacter.id);
    }
  }

  stopMonitoring() {
    this.isActive = false;
    
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    
    // Stop socket monitoring
    if (window.socketClient && this.currentCharacter) {
      window.socketClient.stopMonitoring(this.currentCharacter.id);
    }
  }

  togglePause() {
    if (this.updateInterval) {
      this.stopMonitoring();
      if (this.pauseBtn) {
        this.pauseBtn.textContent = 'Resume';
      }
    } else {
      this.startMonitoring();
      if (this.pauseBtn) {
        this.pauseBtn.textContent = 'Pause';
      }
    }
  }

  loadCharacterData(character) {
    if (!character.consciousness) return;
    
    this.updateResourceMeters(character.consciousness.resources);
    this.updateProcessTable(character.consciousness.processes);
    this.updateMemoryVisualization(character.consciousness.memory);
    this.updateErrorLog(character.consciousness.system_errors);
  }

  async refreshData() {
    if (!this.currentCharacter) return;
    
    try {
      const response = await fetch(`/api/consciousness/${this.currentCharacter.id}/state`);
      const state = await response.json();
      
      window.stateManager.updateConsciousnessData(state);
    } catch (error) {
      console.error('Failed to refresh monitor data:', error);
    }
  }

  updateDisplays(data) {
    if (data.state && data.state.consciousness) {
      const consciousness = data.state.consciousness;
      
      if (consciousness.resources) {
        this.updateResourceMeters(consciousness.resources);
      }
      if (consciousness.processes) {
        this.updateProcessTable(consciousness.processes);
      }
      if (consciousness.memory) {
        this.updateMemoryVisualization(consciousness.memory);
      }
      if (consciousness.system_errors) {
        this.updateErrorLog(consciousness.system_errors);
      }
    }
  }

  updateResourceMeters(resources) {
    if (!this.resourceMeters || !resources) return;
    
    this.resourceMeters.innerHTML = '';
    
    Object.entries(resources).forEach(([resourceName, resource]) => {
      if (resource.current !== undefined && resource.max !== undefined) {
        const percentage = (resource.current / resource.max) * 100;
        const statusClass = this.getResourceStatusClass(percentage);
        
        const meterHtml = `
          <div class="resource-meter">
            <div class="meter-label">
              <span class="meter-name">${this.formatResourceName(resourceName)}</span>
              <span class="meter-value">${resource.current.toFixed(1)}/${resource.max.toFixed(1)}</span>
            </div>
            <div class="meter-bar">
              <div class="meter-fill ${statusClass}" style="width: ${percentage}%"></div>
            </div>
          </div>
        `;
        
        this.resourceMeters.insertAdjacentHTML('beforeend', meterHtml);
      }
    });
  }

  updateProcessTable(processes) {
    if (!this.processTable || !processes) return;
    
    const tableHtml = `
      <table>
        <thead>
          <tr>
            <th>PID</th>
            <th>Name</th>
            <th>Status</th>
            <th>CPU%</th>
            <th>Memory</th>
            <th>Last Activity</th>
          </tr>
        </thead>
        <tbody>
          ${processes.map(process => `
            <tr>
              <td class="pid">${process.pid}</td>
              <td class="process-name">${process.name}</td>
              <td><span class="status ${process.status}">${process.status}</span></td>
              <td class="cpu-usage ${this.getCpuStatusClass(process.cpu_usage)}">${process.cpu_usage?.toFixed(1) || 0}%</td>
              <td class="memory-usage">${Math.round(process.memory_mb || 0)}MB</td>
              <td>${process.last_activity ? new Date(process.last_activity).toLocaleTimeString() : 'N/A'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
    
    this.processTable.innerHTML = tableHtml;
  }

  updateMemoryVisualization(memory) {
    if (!this.memoryVisualization || !memory) return;
    
    // Clear existing visualization
    this.memoryVisualization.innerHTML = '';
    
    // Create memory blocks
    const memoryEntries = Object.entries(memory);
    const totalSize = memoryEntries.reduce((sum, [_, block]) => sum + block.size, 0);
    
    let currentOffset = 0;
    memoryEntries.forEach(([address, block]) => {
      const percentage = (block.size / totalSize) * 100;
      const height = Math.max(20, (block.size / totalSize) * 280);
      
      const blockElement = document.createElement('div');
      blockElement.className = `memory-block ${block.type}`;
      blockElement.style.cssText = `
        left: ${(currentOffset % 4) * 25}%;
        top: ${Math.floor(currentOffset / 4) * 35}px;
        width: 23%;
        height: ${Math.min(height, 30)}px;
      `;
      blockElement.textContent = block.description.substring(0, 20) + (block.description.length > 20 ? '...' : '');
      blockElement.title = `${address}: ${block.description} (${this.formatBytes(block.size)})`;
      
      this.memoryVisualization.appendChild(blockElement);
      currentOffset++;
    });
    
    // Add legend if not exists
    if (!this.memoryVisualization.querySelector('.memory-legend')) {
      const legend = document.createElement('div');
      legend.className = 'memory-legend';
      legend.innerHTML = `
        <div class="legend-item">
          <div class="legend-color emotion"></div>
          <span>Emotion</span>
        </div>
        <div class="legend-item">
          <div class="legend-color relationship"></div>
          <span>Relationship</span>
        </div>
        <div class="legend-item">
          <div class="legend-color trauma"></div>
          <span>Trauma</span>
        </div>
        <div class="legend-item">
          <div class="legend-color system"></div>
          <span>System</span>
        </div>
      `;
      this.memoryVisualization.appendChild(legend);
    }
  }

  updateErrorLog(errors) {
    if (!this.errorLog || !errors) return;
    
    this.errorLog.innerHTML = errors.slice(0, 10).map(error => `
      <div class="error-item ${error.severity}">
        <div class="error-header">
          <span class="error-type">${error.type}</span>
          <span class="error-timestamp">${new Date(error.timestamp).toLocaleTimeString()}</span>
        </div>
        <div class="error-message">${error.message}</div>
      </div>
    `).join('');
  }

  // Utility methods
  formatResourceName(name) {
    return name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  getResourceStatusClass(percentage) {
    if (percentage > 80) return 'high';
    if (percentage > 50) return 'medium';
    return 'low';
  }

  getCpuStatusClass(usage) {
    if (usage > 70) return 'cpu-high';
    if (usage > 40) return 'cpu-medium';
    return 'cpu-low';
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  onConsciousnessUpdate(event, data) {
    if (event === 'consciousness-updated' && this.isActive) {
      // Real-time updates are handled through state subscriptions
    }
  }
}

// Debugger Interface Module
class Debugger {
  constructor() {
    this.isActive = false;
    this.currentCharacter = null;
    this.breakpoints = [];
    this.callStack = [];
    this.variables = {};
    this.currentLine = null;
    
    this.init();
  }

  init() {
    this.setupElements();
    this.setupEventListeners();
    this.subscribeToStateChanges();
  }

  setupElements() {
    this.stepIntoBtn = document.getElementById('stepInto');
    this.stepOverBtn = document.getElementById('stepOver');
    this.continueBtn = document.getElementById('continue');
    this.breakAllBtn = document.getElementById('breakAll');
    
    this.breakpointsList = document.getElementById('breakpointsList');
    this.callStack = document.getElementById('callStack');
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
    // Subscribe to socket events for debugging
    if (window.socketClient) {
      window.socketClient.on('debug-result', (data) => {
        this.handleDebugResult(data);
      });
    }
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
  }

  loadCharacterDebugInfo(character) {
    if (!character.consciousness) return;
    
    // Load debug hooks as breakpoints
    if (character.consciousness.debug_hooks) {
      character.consciousness.debug_hooks.forEach(hook => {
        if (hook.enabled) {
          this.addBreakpoint({
            id: hook.id,
            name: hook.name,
            type: hook.type,
            target: hook.target,
            condition: hook.condition,
            enabled: hook.enabled
          });
        }
      });
    }
    
    // Simulate call stack from processes
    this.updateCallStackFromProcesses(character.consciousness.processes);
    
    // Load variables from memory and resources
    this.updateVariablesFromConsciousness(character.consciousness);
  }

  renderCodeEditor() {
    if (!this.codeEditor) return;
    
    // Simulate consciousness code representation
    const consciousnessCode = this.generateConsciousnessCode();
    
    this.codeEditor.innerHTML = `
      <div class="code-editor-header">
        <span class="code-file-name">consciousness_core.cpp</span>
        <div class="code-editor-actions">
          <button class="btn btn-small">Save</button>
          <button class="btn btn-small">Reload</button>
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
    
    // Add click handlers for line numbers (breakpoints)
    this.codeEditor.querySelectorAll('.line-number').forEach(lineNum => {
      lineNum.addEventListener('click', (e) => {
        const line = parseInt(e.target.dataset.line);
        this.toggleBreakpointAtLine(line);
      });
    });
  }

  generateConsciousnessCode() {
    return `// Consciousness Core System
#include "consciousness.h"
#include "memory_manager.h"
#include "process_scheduler.h"

class ConsciousnessCore {
private:
    MemoryManager memory;
    ProcessScheduler scheduler;
    ResourceAllocator resources;
    
public:
    void initialize() {
        // Initialize core consciousness systems
        memory.initialize();
        scheduler.start();
        resources.allocate_base_resources();
    }
    
    void process_grief(EmotionalEvent event) {
        // Line 15: Grief processing - BREAKPOINT ACTIVE
        Process* grief_manager = scheduler.get_process("Grief_Manager.exe");
        if (grief_manager) {
            grief_manager->process_event(event);
            // Memory leak detected here
            memory.allocate_emotional_memory(event.intensity * 1024);
        }
    }
    
    void search_for_leo() {
        // Line 23: Search protocol - INFINITE LOOP WARNING
        while (true) {
            for (Timeline timeline : all_timelines) {
                if (timeline.contains("Leo")) {
                    // This condition is never satisfied
                    return timeline.extract("Leo");
                }
            }
            // Loop continues indefinitely
        }
    }
    
    void maintain_relationships() {
        // Line 33: Relationship maintenance - THREAD STARVATION
        Thread* emily_thread = scheduler.get_thread("Emily_Relationship");
        if (emily_thread && resources.attention.available > 10) {
            emily_thread->allocate_time(resources.attention.available * 0.1);
        } else {
            // Insufficient resources - relationship degrading
            emily_thread->set_status(STARVED);
        }
    }
    
    void parse_reality(SensoryInput input) {
        // Line 43: Reality parsing - TEMPORAL DESYNC ERROR
        if (temporal_sync.is_synchronized()) {
            return reality_parser.process(input);
        } else {
            // Temporal desynchronization causes parsing errors
            throw TemporalDesyncException("Cannot parse reality");
        }
    }
};`;
  }

  highlightSyntax(code) {
    return code
      .replace(/\b(class|void|if|else|while|for|return|throw|private|public)\b/g, '<span class="keyword">$1</span>')
      .replace(/"([^"]*)"/g, '<span class="string">"$1"</span>')
      .replace(/\b(\d+)\b/g, '<span class="number">$1</span>')
      .replace(/\/\/.*$/gm, '<span class="comment">$&</span>')
      .replace(/\b([A-Z][a-zA-Z_]*)\s*\(/g, '<span class="function">$1</span>(')
      .split('\n')
      .map((line, i) => `<span class="code-line" data-line="${i + 1}">${line}</span>`)
      .join('\n');
  }

  updateBreakpointsList() {
    if (!this.breakpointsList) return;
    
    this.breakpointsList.innerHTML = this.breakpoints.map(bp => `
      <div class="breakpoint-item ${bp.enabled ? 'active' : ''}">
        <div class="breakpoint-checkbox ${bp.enabled ? 'checked' : ''}" 
             onclick="window.debugger.toggleBreakpoint('${bp.id}')"></div>
        <div class="breakpoint-location">
          <div class="breakpoint-name">${bp.name}</div>
          <div class="breakpoint-line">${bp.target}</div>
        </div>
      </div>
    `).join('');
  }

  updateCallStack() {
    if (!this.callStack) return;
    
    const stackFrames = [
      { function: 'process_grief()', location: 'consciousness_core.cpp:15', current: true },
      { function: 'handle_emotional_event()', location: 'emotion_processor.cpp:89', current: false },
      { function: 'main_consciousness_loop()', location: 'consciousness_core.cpp:5', current: false }
    ];
    
    this.callStack.innerHTML = stackFrames.map(frame => `
      <div class="stack-frame ${frame.current ? 'current' : ''}">
        <div class="frame-function">${frame.function}</div>
        <div class="frame-location">${frame.location}</div>
      </div>
    `).join('');
  }

  updateVariablesView() {
    if (!this.variablesView) return;
    
    const variables = {
      'Local Variables': {
        'grief_intensity': { value: '89.7', type: 'float' },
        'leo_search_active': { value: 'true', type: 'bool' },
        'memory_usage': { value: '847MB', type: 'size_t' }
      },
      'Emotional State': {
        'guilt_level': { value: '94.2', type: 'float' },
        'hope_remaining': { value: '23.4', type: 'float' },
        'attachment_strength': { value: '100.0', type: 'float' }
      },
      'System Resources': {
        'attention_available': { value: '23.4', type: 'float' },
        'emotional_energy': { value: '15.7', type: 'float' },
        'processing_capacity': { value: '94.8', type: 'float' }
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
  }

  // Debug control methods
  stepInto() {
    console.log('Step Into - Entering function call');
    this.sendDebugCommand('step_into');
  }

  stepOver() {
    console.log('Step Over - Executing current line');
    this.sendDebugCommand('step_over');
  }

  continue() {
    console.log('Continue - Resuming execution');
    this.sendDebugCommand('continue');
  }

  breakAll() {
    console.log('Break All - Pausing all processes');
    this.sendDebugCommand('break_all');
  }

  sendDebugCommand(command) {
    if (window.socketClient && this.currentCharacter) {
      window.socketClient.sendDebugCommand(this.currentCharacter.id, command);
    }
  }

  addBreakpoint(breakpoint) {
    window.stateManager.addBreakpoint(breakpoint);
  }

  toggleBreakpoint(id) {
    window.stateManager.toggleBreakpoint(id);
  }

  toggleBreakpointAtLine(line) {
    const existingBp = this.breakpoints.find(bp => bp.line === line);
    if (existingBp) {
      this.toggleBreakpoint(existingBp.id);
    } else {
      this.addBreakpoint({
        id: `line_${line}_${Date.now()}`,
        name: `Line ${line}`,
        type: 'breakpoint',
        target: `consciousness_core.cpp:${line}`,
        line: line,
        enabled: true
      });
    }
  }

  handleDebugResult(data) {
    console.log('Debug result received:', data);
    // Update UI based on debug result
  }

  onConsciousnessUpdate(event, data) {
    if (event === 'consciousness-updated' && this.isActive) {
      this.updateVariablesFromConsciousness(data);
    }
  }

  updateCallStackFromProcesses(processes) {
    // Simulate call stack from running processes
  }

  updateVariablesFromConsciousness(consciousness) {
    // Update variables view with current consciousness state
  }
}

// Create global instances
window.monitor = new Monitor();
window.debugger = new Debugger();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Monitor, Debugger };
}

