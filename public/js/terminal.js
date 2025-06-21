// Terminal Interface Module
class Terminal {
  constructor() {
    this.element = null;
    this.outputElement = null;
    this.inputElement = null;
    this.currentCharacter = null;
    this.commandHistory = [];
    this.historyIndex = -1;
    this.isActive = false;
    
    this.commands = {
      'ps': this.processListCommand.bind(this),
      'top': this.topCommand.bind(this),
      'kill': this.killCommand.bind(this),
      'monitor': this.monitorCommand.bind(this),
      'attach': this.attachCommand.bind(this),
      'debug': this.debugCommand.bind(this),
      'help': this.helpCommand.bind(this),
      'clear': this.clearCommand.bind(this),
      'status': this.statusCommand.bind(this),
      'memory': this.memoryCommand.bind(this),
      'errors': this.errorsCommand.bind(this)
    };
    
    this.init();
  }

  init() {
    this.setupElements();
    this.setupEventListeners();
    this.loadCommandHistory();
    this.displayWelcomeMessage();
  }

  setupElements() {
    this.element = document.getElementById('terminal');
    this.outputElement = document.getElementById('terminalOutput');
    this.inputElement = document.getElementById('terminalInput');
    
    const clearBtn = document.getElementById('clearTerminal');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => this.clearCommand());
    }
  }

  setupEventListeners() {
    if (!this.inputElement) return;

    // Command input handling
    this.inputElement.addEventListener('keydown', (e) => {
      switch (e.key) {
        case 'Enter':
          e.preventDefault();
          this.executeCommand();
          break;
        case 'ArrowUp':
          e.preventDefault();
          this.navigateHistory(-1);
          break;
        case 'ArrowDown':
          e.preventDefault();
          this.navigateHistory(1);
          break;
        case 'Tab':
          e.preventDefault();
          this.autocomplete();
          break;
      }
    });

    // Focus management
    this.inputElement.addEventListener('blur', () => {
      setTimeout(() => this.focus(), 100);
    });

    // Subscribe to state changes
    window.stateManager.subscribe('currentCharacter', (character) => {
      this.currentCharacter = character;
      if (character) {
        this.addOutput(`Attached to ${character.name}'s consciousness`, 'success');
      }
    });
  }

  focus() {
    if (this.inputElement && this.isActive) {
      this.inputElement.focus();
    }
  }

  activate() {
    this.isActive = true;
    this.focus();
  }

  deactivate() {
    this.isActive = false;
  }

  displayWelcomeMessage() {
    this.addOutput('Runtime.zyjeski.com Consciousness Debugger v1.0', 'success');
    this.addOutput('Type "help" for available commands', 'info');
    this.addOutput('');
  }

  executeCommand() {
    const input = this.inputElement.value.trim();
    if (!input) return;

    // Add to history
    this.addToHistory(input);
    
    // Display command
    this.addOutput(`debug@consciousness:~$ ${input}`, 'command');
    
    // Parse and execute
    const [command, ...args] = input.split(' ');
    this.runCommand(command.toLowerCase(), args);
    
    // Clear input
    this.inputElement.value = '';
    this.historyIndex = -1;
  }

  runCommand(command, args) {
    if (this.commands[command]) {
      try {
        this.commands[command](args);
      } catch (error) {
        this.addOutput(`Error executing command: ${error.message}`, 'error');
      }
    } else {
      this.addOutput(`Command not found: ${command}`, 'error');
      this.addOutput('Type "help" for available commands', 'info');
    }
  }

  // Command implementations
  processListCommand(args) {
    if (!this.currentCharacter) {
      this.addOutput('No character attached. Use "attach <character-id>" first.', 'error');
      return;
    }

    const processes = window.stateManager.getProcesses();
    if (!processes || processes.length === 0) {
      this.addOutput('No processes found', 'warning');
      return;
    }

    // Create process table
    const table = this.createProcessTable(processes);
    this.addOutput(table, 'output');
  }

  topCommand(args) {
    if (!this.currentCharacter) {
      this.addOutput('No character attached. Use "attach <character-id>" first.', 'error');
      return;
    }

    const processes = window.stateManager.getProcesses();
    const resources = window.stateManager.getResources();
    
    // Display resource usage
    this.addOutput('System Resources:', 'info');
    if (resources.attention) {
      this.addOutput(`  Attention: ${resources.attention.current}/${resources.attention.max} (${Math.round(resources.attention.current/resources.attention.max*100)}%)`, 'output');
    }
    if (resources.emotional_energy) {
      this.addOutput(`  Emotional Energy: ${resources.emotional_energy.current}/${resources.emotional_energy.max} (${Math.round(resources.emotional_energy.current/resources.emotional_energy.max*100)}%)`, 'output');
    }
    
    this.addOutput('', 'output');
    
    // Display top processes by CPU usage
    if (processes && processes.length > 0) {
      const sortedProcesses = [...processes].sort((a, b) => (b.cpu_usage || 0) - (a.cpu_usage || 0));
      const table = this.createProcessTable(sortedProcesses.slice(0, 10));
      this.addOutput(table, 'output');
    }
  }

  killCommand(args) {
    if (!args.length) {
      this.addOutput('Usage: kill <pid>', 'error');
      return;
    }

    const pid = parseInt(args[0]);
    if (isNaN(pid)) {
      this.addOutput('Invalid PID', 'error');
      return;
    }

    if (!this.currentCharacter) {
      this.addOutput('No character attached', 'error');
      return;
    }

    // Send kill command through consciousness manager
    if (window.consciousness) {
      window.consciousness.killProcess(pid)
        .then(() => {
          this.addOutput(`Process ${pid} terminated`, 'success');
        })
        .catch((error) => {
          this.addOutput(`Failed to kill process ${pid}: ${error.message}`, 'error');
        });
    }
  }

  monitorCommand(args) {
    if (!this.currentCharacter) {
      this.addOutput('No character attached', 'error');
      return;
    }

    const errors = window.stateManager.getErrors();
    const processes = window.stateManager.getProcesses();
    
    this.addOutput('Consciousness Monitor Report:', 'info');
    this.addOutput(`Active Processes: ${processes.length}`, 'output');
    this.addOutput(`System Errors: ${errors.length}`, 'output');
    
    if (errors.length > 0) {
      this.addOutput('', 'output');
      this.addOutput('Recent Errors:', 'warning');
      errors.slice(0, 5).forEach(error => {
        this.addOutput(`  [${error.severity.toUpperCase()}] ${error.type}: ${error.message}`, 'error');
      });
    }
  }

  attachCommand(args) {
    if (!args.length) {
      this.addOutput('Usage: attach <character-id>', 'error');
      this.addOutput('Available characters: alexander-kane', 'info');
      return;
    }

    const characterId = args[0];
    this.addOutput(`Attaching to ${characterId}...`, 'info');
    
    // Load character through app
    if (window.app) {
      window.app.selectCharacter(characterId);
    }
  }

  debugCommand(args) {
    if (!this.currentCharacter) {
      this.addOutput('No character attached', 'error');
      return;
    }

    this.addOutput('Starting debug session...', 'info');
    
    // Start debugging session
    const session = window.stateManager.startDebuggingSession(this.currentCharacter.id);
    this.addOutput(`Debug session started: ${session.id}`, 'success');
    
    // Switch to debugger view
    if (window.app) {
      window.app.navigateToSection('debugger');
    }
  }

  statusCommand(args) {
    const connectionStatus = window.stateManager.getConnectionStatus();
    const character = window.stateManager.getCurrentCharacter();
    const monitoring = window.stateManager.isMonitoringActive();
    
    this.addOutput('System Status:', 'info');
    this.addOutput(`Connection: ${connectionStatus}`, connectionStatus === 'connected' ? 'success' : 'error');
    this.addOutput(`Character: ${character ? character.name : 'None'}`, character ? 'success' : 'warning');
    this.addOutput(`Monitoring: ${monitoring ? 'Active' : 'Inactive'}`, monitoring ? 'success' : 'warning');
  }

  memoryCommand(args) {
    if (!this.currentCharacter) {
      this.addOutput('No character attached', 'error');
      return;
    }

    const consciousness = window.stateManager.getConsciousnessState();
    if (!consciousness || !consciousness.memory) {
      this.addOutput('No memory data available', 'warning');
      return;
    }

    this.addOutput('Memory Allocation:', 'info');
    Object.entries(consciousness.memory).forEach(([address, data]) => {
      this.addOutput(`  ${address}: ${data.type} - ${data.description} (${data.size || 'unknown'})`, 'output');
    });
  }

  errorsCommand(args) {
    const errors = window.stateManager.getErrors();
    
    if (errors.length === 0) {
      this.addOutput('No system errors', 'success');
      return;
    }

    this.addOutput(`System Errors (${errors.length}):`, 'info');
    errors.forEach((error, index) => {
      const timestamp = new Date(error.timestamp).toLocaleTimeString();
      this.addOutput(`  ${index + 1}. [${timestamp}] ${error.type}: ${error.message}`, 'error');
    });
  }

  helpCommand(args) {
    this.addOutput('Available Commands:', 'info');
    this.addOutput('  ps                 - List running processes', 'output');
    this.addOutput('  top                - Show resource usage and top processes', 'output');
    this.addOutput('  kill <pid>         - Terminate a process', 'output');
    this.addOutput('  monitor            - Show consciousness monitor report', 'output');
    this.addOutput('  attach <char-id>   - Attach to character consciousness', 'output');
    this.addOutput('  debug              - Start debugging session', 'output');
    this.addOutput('  status             - Show system status', 'output');
    this.addOutput('  memory             - Show memory allocation', 'output');
    this.addOutput('  errors             - Show system errors', 'output');
    this.addOutput('  clear              - Clear terminal output', 'output');
    this.addOutput('  help               - Show this help message', 'output');
  }

  clearCommand(args) {
    if (this.outputElement) {
      this.outputElement.innerHTML = '';
    }
    this.displayWelcomeMessage();
  }

  // Utility methods
  createProcessTable(processes) {
    let table = `
PID    NAME                     CPU%    MEMORY     STATUS      LAST ACTIVITY
────────────────────────────────────────────────────────────────────────────`;

    processes.forEach(process => {
      const pid = String(process.pid || 'N/A').padEnd(6);
      const name = String(process.name || 'Unknown').padEnd(24);
      const cpu = String(Math.round(process.cpu_usage || 0) + '%').padEnd(7);
      const memory = String(Math.round(process.memory_mb || 0) + 'MB').padEnd(10);
      const status = String(process.status || 'unknown').padEnd(11);
      const activity = process.last_activity ? 
        new Date(process.last_activity).toLocaleTimeString() : 'N/A';
      
      table += `\n${pid} ${name} ${cpu} ${memory} ${status} ${activity}`;
    });

    return table;
  }

  addOutput(text, type = 'output') {
    if (!this.outputElement) return;

    const line = document.createElement('div');
    line.className = `terminal-line ${type}`;
    line.textContent = text;
    
    this.outputElement.appendChild(line);
    this.outputElement.scrollTop = this.outputElement.scrollHeight;
  }

  addToHistory(command) {
    this.commandHistory.unshift(command);
    if (this.commandHistory.length > 100) {
      this.commandHistory.pop();
    }
    this.saveCommandHistory();
  }

  navigateHistory(direction) {
    if (this.commandHistory.length === 0) return;

    this.historyIndex += direction;
    
    if (this.historyIndex < -1) {
      this.historyIndex = -1;
    } else if (this.historyIndex >= this.commandHistory.length) {
      this.historyIndex = this.commandHistory.length - 1;
    }

    if (this.historyIndex === -1) {
      this.inputElement.value = '';
    } else {
      this.inputElement.value = this.commandHistory[this.historyIndex];
    }
  }

  autocomplete() {
    const input = this.inputElement.value;
    const commands = Object.keys(this.commands);
    const matches = commands.filter(cmd => cmd.startsWith(input.toLowerCase()));
    
    if (matches.length === 1) {
      this.inputElement.value = matches[0];
    } else if (matches.length > 1) {
      this.addOutput(`Possible completions: ${matches.join(', ')}`, 'info');
    }
  }

  saveCommandHistory() {
    try {
      localStorage.setItem('terminal-history', JSON.stringify(this.commandHistory.slice(0, 50)));
    } catch (error) {
      console.warn('Failed to save command history:', error);
    }
  }

  loadCommandHistory() {
    try {
      const saved = localStorage.getItem('terminal-history');
      if (saved) {
        this.commandHistory = JSON.parse(saved);
      }
    } catch (error) {
      console.warn('Failed to load command history:', error);
    }
  }

  // External interface methods
  startDebuggingSession(characterId) {
    this.addOutput(`Starting debugging session for ${characterId}...`, 'info');
    this.runCommand('attach', [characterId]);
  }

  addDebugResult(data) {
    this.addOutput(`Debug result for ${data.command}:`, 'info');
    
    if (data.result.error) {
      this.addOutput(data.result.error, 'error');
    } else {
      Object.entries(data.result).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          this.addOutput(`${key}: ${value.length} items`, 'output');
        } else if (typeof value === 'object') {
          this.addOutput(`${key}: ${JSON.stringify(value, null, 2)}`, 'output');
        } else {
          this.addOutput(`${key}: ${value}`, 'output');
        }
      });
    }
  }

  onConsciousnessUpdate(event, data) {
    if (event === 'consciousness-updated' && this.isActive) {
      // Optionally show real-time updates in terminal
      // this.addOutput('Consciousness state updated', 'info');
    }
  }
}

// Create global terminal instance
window.terminal = new Terminal();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Terminal;
}

