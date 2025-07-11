// Complete Debugger Interface Module for Runtime.zyjeski.com
import { createLogger } from './logger.js';
import ErrorLog from './components/ErrorLog.js';

// HTML Escaping Utility for XSS Prevention
class HTMLEscaper {
  /**
   * Escape HTML entities to prevent XSS attacks
   * @param {string} unsafe - The unsafe string to escape
   * @returns {string} The escaped string
   */
  static escape(unsafe) {
    if (typeof unsafe !== 'string') {
      return String(unsafe || '');
    }

    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;")
      .replace(/\//g, "&#x2F;"); // Extra safety for attributes
  }
}

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
    this.errorLog = null; // ErrorLog component instance

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
    } else {
      // Even without a character, update memory visualization with available state data
      this.updateMemoryVisualizationFromState();
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

    // Initialize ErrorLog component
    this.setupErrorLog();

    // Initialize MemoryMap component
    this.setupMemoryMap();

    this.setupDebugControls();
  }

  setupErrorLog() {
    const errorLogContainer = document.getElementById('errorLog');
    if (errorLogContainer && !this.errorLog) {
      this.errorLog = new ErrorLog(errorLogContainer, {
        maxErrors: 50,
        autoDismiss: true,
        dismissDelay: 60000, // 1 minute for debugging context
        groupSimilar: true,
        customFormatters: {
          'memory_leak': (error) => {
            return `Memory leak of <strong>${error.details?.size || 'unknown size'}</strong> detected in <em>${error.details?.processId || 'unknown process'}</em>`;
          },
          'stack_overflow': (error) => {
            return `Recursive thought pattern at depth <strong>${error.details?.depth || 'unknown'}</strong>`;
          },
          'null_reference': (error) => {
            return `Lost connection to <em>${error.details?.target || 'unknown memory'}</em>`;
          },
          'timeout_error': (error) => {
            return `Processing timeout after <strong>${error.details?.duration || 'unknown time'}</strong>`;
          },
          'permission_denied': (error) => {
            return `Access denied to <em>${error.details?.resource || 'protected memory'}</em>`;
          },
          'resource_exhaustion': (error) => {
            return `Resource exhaustion: <strong>${error.details?.resource || 'unknown'}</strong> at <em>${error.details?.percentage || 'unknown'}%</em>`;
          },
          'segmentation_fault': (error) => {
            return `Memory fragmentation in <em>${error.details?.segment || 'unknown segment'}</em>`;
          },
          'deadlock': (error) => {
            return `Deadlock between <strong>${error.details?.process1 || 'Process A'}</strong> and <strong>${error.details?.process2 || 'Process B'}</strong>`;
          }
        },
        onErrorClick: (error) => {
          // Navigate to relevant process or memory location if available
          if (error.details?.processId) {
            this.highlightProcess(error.details.processId);
          }
          if (error.details?.lineNumber) {
            this.navigateToLine(error.details.lineNumber);
          }
        },
        onErrorAdd: (error) => {
          // Log error addition for debugging
          this.logger?.info('Error added to log:', error.type, error.message);
        }
      });
    }
  }

  /**
   * Set up MemoryMap component for memory visualization
   * @private
   */
  async setupMemoryMap() {
    try {
      // Import MemoryMap component
      const { default: MemoryMap } = await import('./components/MemoryMap.js');

      // Find memory map container
      const memoryMapContainer = document.getElementById('memoryMapContainer');
      if (!memoryMapContainer) {
        console.warn('MemoryMap container not found - memory visualization disabled');
        return;
      }

      // Initialize MemoryMap with consciousness-specific options
      this.memoryMap = new MemoryMap(memoryMapContainer, {
        gridSize: { width: 64, height: 32 },
        blockSize: 8, // Smaller blocks for debugger view
        viewMode: 'type',
        enableZoom: true,
        enablePan: true,
        enableTooltip: true,
        enableMinimap: true,
        animateAllocations: true,
        colorScheme: {
          emotion: '#FF6B6B',      // Red for emotional memories
          trauma: '#845EC2',       // Purple for traumatic memories
          relationship: '#4E8397', // Blue for relationship memories
          system: '#B39CD0',       // Light purple for system memories
          free: '#2C2C2C',        // Dark gray for free space
          fragmented: '#FFB800'    // Yellow for fragmented blocks
        },
        onBlockClick: (block) => {
          this.handleMemoryBlockClick(block);
        },
        onBlockHover: (block) => {
          this.handleMemoryBlockHover(block);
        }
      });

      console.log('MemoryMap component initialized for debugger');

    } catch (error) {
      console.error('Failed to initialize MemoryMap component:', error);
    }
  }

/**
 * Update memory visualization with consciousness data
 * @private
 */
updateMemoryVisualization(consciousnessData) {
  if (!this.memoryMap || !consciousnessData) return;

  try {
    // Convert consciousness data to memory map format
    const memoryData = this.convertConsciousnessToMemoryData(consciousnessData);

    // Update memory map
    this.memoryMap.update(memoryData);

    console.log('Memory visualization updated with consciousness data');

  } catch (error) {
    console.error('Failed to update memory visualization:', error);
  }
}

/**
 * Update memory visualization with current StateManager data
 * @private
 */
updateMemoryVisualizationFromState() {
  if (!this.memoryMap) {
    console.warn('MemoryMap: No memory map component available');
    return;
  }

  if (!this.stateManager) {
    console.warn('MemoryMap: No state manager available');
    return;
  }

  try {
    // Check if we have a current character
    const currentCharacter = this.stateManager.getCurrentCharacter();
    if (!currentCharacter) {
      console.log('MemoryMap: No character selected, showing placeholder data');
      this.showMemoryMapPlaceholder();
      return;
    }

    // Get current state data
    const stateData = {
      processes: this.stateManager.getProcesses() || [],
      memory: this.stateManager.getMemory() || {},
      resources: this.stateManager.getResources() || {}
    };

    console.log('MemoryMap: State data retrieved:', {
      processCount: stateData.processes.length,
      memoryKeys: Object.keys(stateData.memory),
      resourceKeys: Object.keys(stateData.resources)
    });

    // If no data available, show placeholder
    if (stateData.processes.length === 0 && Object.keys(stateData.memory).length === 0) {
      console.log('MemoryMap: No consciousness data available, showing placeholder');
      this.showMemoryMapPlaceholder();
      return;
    }

    // Convert state data to memory map format
    const memoryData = this.convertConsciousnessToMemoryData(stateData);

    console.log('MemoryMap: Converted memory data:', {
      totalSize: memoryData.totalSize,
      usedSize: memoryData.usedSize,
      blockCount: memoryData.blocks.length,
      blocks: memoryData.blocks.slice(0, 3) // Show first 3 blocks for debugging
    });

    // Update memory map
    this.memoryMap.update(memoryData);

    console.log('Memory visualization updated with current state data');

  } catch (error) {
    console.error('Failed to update memory visualization from state:', error);
  }
}

/**
 * Show placeholder data in memory map when no consciousness data is available
 * @private
 */
showMemoryMapPlaceholder() {
  if (!this.memoryMap) return;

  // Create placeholder memory data to show the component is working
  const placeholderData = {
    totalSize: 2048,
    usedSize: 0,
    blocks: [],
    fragmentation: 0,
    layout: 'segmented'
  };

  console.log('MemoryMap: Showing placeholder data');
  this.memoryMap.update(placeholderData);
}

/**
 * Convert consciousness data to MemoryMap format
 * @private
 */
convertConsciousnessToMemoryData(consciousnessData) {
  const blocks = [];
  let addressCounter = 0;

  // Convert processes to memory blocks
  if (consciousnessData.processes) {
    consciousnessData.processes.forEach(process => {
      const address = `0x${addressCounter.toString(16).padStart(4, '0')}`;
      const size = Math.max(1, Math.floor((process.memoryUsage || 1024) / 1024)); // Convert to blocks

      let type = 'system';
      if (process.name.toLowerCase().includes('grief')) type = 'emotion';
      else if (process.name.toLowerCase().includes('trauma')) type = 'trauma';
      else if (process.name.toLowerCase().includes('relationship')) type = 'relationship';

      blocks.push({
        address: address,
        size: size,
        type: type,
        processId: process.name,
        content: {
          description: process.description || `Process: ${process.name}`,
          intensity: (process.cpuUsage || 0) / 100,
          age: Date.now() - (process.startTime || Date.now()),
          accessCount: process.accessCount || Math.floor(Math.random() * 100),
          lastAccess: process.lastAccess || Date.now(),
          fragmented: process.status === 'error' || process.status === 'crashed',
          linked: []
        },
        metadata: {
          created: process.startTime || Date.now(),
          modified: process.lastAccess || Date.now(),
          protected: process.name.includes('System') || process.name.includes('Reality'),
          compressed: false
        }
      });

      addressCounter += size;
    });
  }

  // Add memory-specific blocks if available
  if (consciousnessData.memory) {
    Object.entries(consciousnessData.memory).forEach(([key, value]) => {
      if (typeof value === 'object' && value !== null) {
        const address = `0x${addressCounter.toString(16).padStart(4, '0')}`;
        const size = Math.max(1, Math.floor(JSON.stringify(value).length / 100));

        blocks.push({
          address: address,
          size: size,
          type: 'emotion', // Default to emotion for memory entries
          processId: 'Memory_Manager.dll',
          content: {
            description: `Memory: ${key}`,
            intensity: value.intensity || 0.5,
            age: value.age || 0,
            accessCount: value.accessCount || 1,
            lastAccess: value.lastAccess || Date.now(),
            fragmented: value.fragmented || false,
            linked: []
          },
          metadata: {
            created: value.created || Date.now(),
            modified: value.modified || Date.now(),
            protected: false,
            compressed: false
          }
        });

        addressCounter += size;
      }
    });
  }

  const totalSize = Math.max(2048, addressCounter * 2); // Ensure minimum size
  const usedSize = addressCounter;

  return {
    totalSize: totalSize,
    usedSize: usedSize,
    blocks: blocks,
    fragmentation: blocks.filter(b => b.content.fragmented).length / blocks.length,
    layout: 'segmented'
  };
}

  /**
   * Handle memory block click in debugger
   * @private
   */
  handleMemoryBlockClick(block) {
    console.log('Memory block clicked in debugger:', block);

    // Add system error for memory inspection
    this.addSystemError({
      severity: 'info',
      type: 'memory_inspection',
      message: `Inspecting memory at ${block.address}: ${block.content?.description || 'Unknown memory block'}`,
      details: {
        address: block.address,
        type: block.type,
        size: block.size,
        processId: block.processId,
        intensity: block.content?.intensity,
        accessCount: block.content?.accessCount,
        fragmented: block.content?.fragmented,
        protected: block.metadata?.protected
      }
    });

    // Highlight related processes if available
    if (block.processId && this.stateManager) {
      const processes = this.stateManager.getProcesses() || [];
      const relatedProcess = processes.find(p => p.name === block.processId);
      if (relatedProcess) {
        this.highlightProcess(relatedProcess.pid);
      }
    }

    // Navigate to relevant code line if available
    const lineMap = {
      'Grief_Manager.exe': 15,
      'Memory_Leak_Handler.dll': 25,
      'Relationship_Handler.exe': 35,
      'Reality_Anchor.dll': 45,
      'Guilt_Processor.exe': 55
    };

    const targetLine = lineMap[block.processId];
    if (targetLine) {
      this.navigateToLine(targetLine);
    }
  }

  /**
   * Handle memory block hover in debugger
   * @private
   */
  handleMemoryBlockHover(block) {
    // Update status or show additional info
    if (this.logger) {
      this.logger.info(`Memory: ${block.address} - ${block.content?.description || 'Unknown'}`);
    }
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
      this.updateBreakpointsDisplay();  // ✅ This method does exist
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

    // Subscribe to processes and memory changes to update memory visualization
    this.stateManager.subscribe('processes', (processes) => {
      this.updateMemoryVisualizationFromState();
    });

    this.stateManager.subscribe('memory', (memory) => {
      this.updateMemoryVisualizationFromState();
    });

    this.stateManager.subscribe('resources', (resources) => {
      this.updateMemoryVisualizationFromState();
    });
  }

  // Update debugger interface for character
  updateDebuggerForCharacter(character) {
    if (!character) return;

    // Character is now managed by StateManager, no need to set locally
    // this.currentCharacter = character; // ❌ Removed - now a getter

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

    // Update memory visualization with current state data
    this.updateMemoryVisualizationFromState();

    // Regenerate code (will use static code until consciousness state arrives)
    this.generateConsciousnessCode();
    this.renderCodeEditor();

    console.log('Debugger updated for character:', character.name);
  }

  // Generate consciousness code representation
  generateConsciousnessCode() {
    // Generate code based on actual consciousness state if available
    if (this.currentCharacter && this.stateManager) {
      // Check if we have consciousness data in StateManager
      const processes = this.stateManager.getProcesses() || [];
      const resources = this.stateManager.getResources() || {};

      if (processes.length > 0 || Object.keys(resources).length > 0) {
        this.generateDynamicCode();
      } else {
        this.generateStaticCode();
      }
    } else {
      this.generateStaticCode();
    }
  }

  generateDynamicCode() {
    // Get consciousness data directly from StateManager
    const processes = this.stateManager?.getProcesses() || [];
    const resources = this.stateManager?.getResources() || {};
    const errors = this.stateManager?.getErrors() || [];
    
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
  
  // Use requestAnimationFrame to batch multiple calls
  if (this._renderPending) return;
  this._renderPending = true;
  
  requestAnimationFrame(() => {
    const codeContent = this.codeLines.map((line, index) => {
      const lineNumber = index + 1;
      const hasBreakpoint = this.breakpoints.has(`line_${lineNumber}`);
      const isCurrentLine = lineNumber === this.currentLine;

      const lineClass = [
        'code-line',
        hasBreakpoint ? 'has-breakpoint' : '',
        isCurrentLine ? 'current-line' : ''
      ].filter(Boolean).join(' ');

      // XSS Prevention: Escape the line content before syntax highlighting
      const escapedLine = HTMLEscaper.escape(line);
      const highlightedLine = this.syntaxHighlight(escapedLine);

      return `
        <div class="${lineClass}">
          <span class="line-number" data-line="${lineNumber}">${lineNumber}</span>
          <span class="line-content">${highlightedLine}</span>
        </div>
      `;
    }).join('');

    this.codeEditor.innerHTML = codeContent;
    this._renderPending = false;
  });
}

  // Basic syntax highlighting
  // XSS Prevention: This function processes code content for display
  // The input 'code' should already be escaped before calling this function
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
    if (!lineNumber || !this.stateManager) return;

    const line = parseInt(lineNumber);
    const breakpoints = this.stateManager.getDebuggerBreakpoints();

    if (breakpoints.has(line)) {
      this.stateManager.removeDebuggerBreakpoint(line);
      console.log(`Removed breakpoint at line ${line}`);
    } else {
      this.stateManager.addDebuggerBreakpoint(line);
      console.log(`Added breakpoint at line ${line}`);
    }

    // The subscription will automatically call updateBreakpointsDisplay() and renderCodeEditor()
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

  toggleBreakpoint(lineNumber) {
    if (!this.stateManager) return;

    const breakpoints = this.stateManager.getDebuggerBreakpoints();
    const line = parseInt(lineNumber);

    if (breakpoints.has(line)) {
      // Toggle the enabled state
      const breakpoint = breakpoints.get(line);
      breakpoint.enabled = !breakpoint.enabled;
      this.stateManager.setDebuggerBreakpoints(breakpoints);
    }

    this.updateBreakpointsDisplay();
  }

  updateBreakpointsDisplay() {
    if (!this.breakpointsList) return;

    let html = '';
    const breakpoints = this.stateManager ? this.stateManager.getDebuggerBreakpoints() : new Map();

    if (breakpoints.size === 0) {
      html = '<div class="no-breakpoints">No breakpoints set</div>';
    } else {
      breakpoints.forEach((breakpoint, line) => {
        const checkboxId = `breakpoint-checkbox-${line}`;
        html += `
          <div class="breakpoint-item ${breakpoint.enabled ? 'active' : ''}" data-breakpoint-id="${line}">
            <input type="checkbox" id="${checkboxId}" class="breakpoint-checkbox" ${breakpoint.enabled ? 'checked' : ''}>
            <label for="${checkboxId}" class="breakpoint-location">consciousness.cpp:${line}</label>
          </div>
        `;
      });
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

      // Add error to ErrorLog component
      this.addSystemError({
        severity: 'critical',
        type: 'debug_error',
        message: data.result.error,
        details: {
          command: data.command,
          timestamp: new Date().toISOString(),
          debugSession: this.debugSession?.id
        }
      });

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

    // Update memory visualization
    this.updateMemoryVisualization(data.state?.consciousness || data.consciousness);
      
      console.log('✅ Debugger interface updated with real consciousness state');
    }

  // New method to update debugger from consciousness data
  updateFromCharacter(consciousnessData) {
    if (!this.stateManager) return;

    // Get consciousness data directly from StateManager instead of from parameter
    const processes = this.stateManager.getProcesses() || [];

    // Update execution state based on consciousness status
    if (processes.length > 0) {
      const hasRunningProcesses = processes.some(p => p.status === 'running');
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

      // Add intervention error to ErrorLog
      this.addSystemError({
        severity: 'critical',
        type: 'intervention_error',
        message: `Intervention failed: ${data.error}`,
        details: {
          interventionType: data.type,
          target: data.target,
          timestamp: new Date().toISOString()
        }
      });

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
    if (!character || !this.stateManager) return;

    // Get processes directly from StateManager instead of character.consciousness
    const processes = this.stateManager.getProcesses() || [];

    // Generate call stack from running processes
    const callStack = processes
      .filter(p => p.status === 'running')
      .slice(0, 5)
      .map((process, index) => ({
        function: `${process.name}::execute`,
        location: `consciousness.cpp:${45 + index * 10}`,
        process: process
      }));

    this.stateManager.setDebuggerCallStack(callStack);
  }

  updateVariablesFromCharacter(character) {
    if (!character || !this.stateManager) return;

    // Get consciousness data directly from StateManager instead of character.consciousness
    const variables = {
      memory: this.stateManager.getMemory() || {},
      resources: this.stateManager.getResources() || {},
      processes: this.stateManager.getProcesses() || []
    };

    this.stateManager.setDebuggerVariables(variables);
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

  // Error logging methods for ErrorLog integration
  addSystemError(errorData) {
    if (!this.errorLog) return;

    try {
      const error = {
        id: `err_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
        timestamp: Date.now(),
        severity: errorData.severity || 'info',
        type: errorData.type || 'system_error',
        message: errorData.message || 'Unknown system error',
        details: {
          ...errorData.details,
          character: this.currentCharacter?.name,
          debugSession: this.debugSession?.id,
          systemState: this.executionState
        },
        stackTrace: errorData.stackTrace || [],
        context: {
          debuggerActive: this.isActive,
          currentLine: this.currentLine,
          ...errorData.context
        }
      };

      this.errorLog.addError(error);

    } catch (error) {
      console.error('Failed to add system error to ErrorLog:', error);
    }
  }

  addProcessError(processId, errorType, message, details = {}) {
    this.addSystemError({
      severity: 'warning',
      type: errorType,
      message: `Process ${processId}: ${message}`,
      details: {
        processId,
        ...details
      }
    });
  }

  addMemoryError(memoryAddress, errorType, message, details = {}) {
    this.addSystemError({
      severity: 'critical',
      type: errorType,
      message: `Memory error at ${memoryAddress}: ${message}`,
      details: {
        memoryAddress,
        ...details
      }
    });
  }

  addConsciousnessError(errorType, message, details = {}) {
    const severityMap = {
      'memory_leak': 'critical',
      'stack_overflow': 'critical',
      'deadlock': 'critical',
      'null_reference': 'warning',
      'timeout_error': 'warning',
      'permission_denied': 'info',
      'resource_exhaustion': 'critical',
      'segmentation_fault': 'critical'
    };

    this.addSystemError({
      severity: severityMap[errorType] || 'info',
      type: errorType,
      message: message,
      details: {
        consciousnessState: this.consciousnessState,
        emotionalLoad: details.emotionalLoad || Math.random(),
        systemHealth: details.systemHealth || Math.random(),
        ...details
      }
    });
  }

  highlightProcess(processId) {
    // Method to highlight a process in the debugger interface
    console.log(`Highlighting process: ${processId}`);

    // Try to find and highlight the process in the code editor
    if (this.codeEditor) {
      const codeContent = this.codeEditor.textContent || '';
      const processIndex = codeContent.indexOf(processId);
      if (processIndex !== -1) {
        console.log(`Found process ${processId} at position ${processIndex}`);
      }
    }
  }

  navigateToLine(lineNumber) {
    // Method to navigate to a specific line in the code editor
    console.log(`Navigating to line: ${lineNumber}`);

    if (this.stateManager) {
      this.stateManager.setDebuggerCurrentLine(lineNumber);
      this.renderCodeEditor();
    }
  }
}

// Export DebuggerInterface class for dependency injection
export default DebuggerInterface;