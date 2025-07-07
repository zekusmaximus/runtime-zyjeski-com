// Enhanced Terminal Interface Module
import StoryTerminalCommands from './story-terminal-commands.js';
import { createLogger } from '/js/logger.js';

class Terminal {
  constructor(dependencies = {}) {
    // Dependency injection - accept dependencies instead of global access
    const { stateManager, socketClient, logger } = dependencies;

    this.stateManager = stateManager;
    this.socketClient = socketClient;
    this.logger = logger || createLogger('Terminal');

    this.element = null;
    this.outputElement = null;
    this.inputElement = null;
    // Remove local currentCharacter - use StateManager getter instead
    this.commandHistory = [];
    this.historyIndex = -1;
    this.isActive = false;
    this.isProcessingCommand = false;

    // Enhanced command set with real implementations
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
      'errors': this.errorsCommand.bind(this),
      'threads': this.threadsCommand.bind(this),
      'resources': this.resourcesCommand.bind(this),
      'restart': this.restartCommand.bind(this),
      'optimize': this.optimizeCommand.bind(this),
      'emergency': this.emergencyCommand.bind(this),
      'whoami': this.whoamiCommand.bind(this),
      'uptime': this.uptimeCommand.bind(this),
      'free': this.freeCommand.bind(this),
      'df': this.diskUsageCommand.bind(this),
      'tail': this.tailCommand.bind(this)
    };

    // Integrate story-specific commands
    this.storyCommands = new StoryTerminalCommands(this);
    Object.assign(this.commands, this.storyCommands.getCommands());
    
    this.init();
  }

  // Getter for current character from StateManager
  get currentCharacter() {
    return this.stateManager ? this.stateManager.getCurrentCharacter() : null;
  }

  init() {
    this.setupElements();
    this.setupEventListeners();
    this.loadCommandHistory();
    this.displayWelcomeMessage();
    this.setupSocketListeners();
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
          if (!this.isProcessingCommand) {
            this.executeCommand();
          }
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
        case 'c':
          if (e.ctrlKey) {
            e.preventDefault();
            this.cancelCommand();
          }
          break;
      }
    });

    // Focus management
    this.inputElement.addEventListener('blur', () => {
      setTimeout(() => this.focus(), 100);
    });

    // Subscribe to state changes
    if (this.stateManager) {
      this.stateManager.subscribe('currentCharacter', (character) => {
        // No need to set local state - use getter instead
        if (character) {
          this.addOutput(`Attached to ${character.name}'s consciousness`, 'success');
          this.updatePrompt();
        }
      });

      this.stateManager.subscribe('connectionStatus', (status) => {
        if (status === 'connected') {
          this.addOutput('Connection established', 'success');
        } else {
          this.addOutput('Connection lost', 'error');
        }
      });
    }
  }

  setupSocketListeners() {
    if (!this.socketClient) return;

    // Listen for debug command results
    this.socketClient.on('debug-result', (data) => {
      this.handleDebugResult(data);
    });

    // Listen for consciousness updates
    this.socketClient.on('consciousness-update', (data) => {
      if (data.type === 'simulation-update' && this.currentCharacter && data.characterId === this.currentCharacter.id) {
        // Show subtle updates for critical changes
        this.handleConsciousnessUpdate(data);
      }
    });

    // Listen for intervention results
    this.socketClient.on('intervention-applied', (data) => {
      this.addOutput(`Intervention applied: ${data.intervention.type}`, 'success');
    });

    // Listen for system messages
    this.socketClient.on('system-message', (data) => {
      this.addOutput(`SYSTEM: ${data.message}`, data.type);
    });

    // Listen for debug hooks
    this.socketClient.on('debug-hook-triggered', (data) => {
      this.addOutput(`DEBUG HOOK: ${data.hook.name} triggered`, 'warning');
      this.addOutput(`Condition: ${data.hook.condition}`, 'info');
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

  updatePrompt() {
    const prompt = document.querySelector('.terminal-prompt');
    if (prompt && this.currentCharacter) {
      prompt.textContent = `debug@${this.currentCharacter.id}:~$ `;
    }
  }

  displayWelcomeMessage() {
    this.addOutput('╭─────────────────────────────────────────────╮', 'info');
    this.addOutput('│    Runtime.zyjeski.com Consciousness       │', 'info');
    this.addOutput('│         Debugging Terminal v2.0            │', 'info');
    this.addOutput('╰─────────────────────────────────────────────╯', 'info');
    this.addOutput('', 'output');
    this.addOutput('Type "help" for available commands', 'info');
    this.addOutput('Type "attach alexander-kane" to begin debugging', 'info');
    this.addOutput('', 'output');
  }

  executeCommand() {
    const input = this.inputElement.value.trim();
    if (!input) return;

    // Prevent multiple commands
    this.isProcessingCommand = true;
    
    // Add to history
    this.addToHistory(input);
    
    // Display command with proper prompt
    const prompt = this.currentCharacter ? 
      `debug@${this.currentCharacter.id}:~$ ` : 
      'debug@consciousness:~$ ';
    this.addOutput(`${prompt}${input}`, 'command');
    
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
        this.isProcessingCommand = false;
      }
    } else {
      this.addOutput(`Command not found: ${command}`, 'error');
      this.addOutput('Type "help" for available commands', 'info');
      this.isProcessingCommand = false;
    }
  }

  cancelCommand() {
    if (this.isProcessingCommand) {
      this.addOutput('Command cancelled', 'warning');
      this.isProcessingCommand = false;
    }
  }

  // Enhanced Command implementations
  processListCommand(args) {
    if (!this.currentCharacter) {
      this.addOutput('No character attached. Use "attach <character-id>" first.', 'error');
      this.isProcessingCommand = false;
      return;
    }

    this.addOutput('Querying consciousness processes...', 'info');
    // Don't set isProcessingCommand to false here - let the response handler do it

    // Send real command to backend
    if (this.socketClient) {
      this.socketClient.sendDebugCommand(this.currentCharacter.id, 'ps', { args });
    }
  }

  topCommand(args) {
    if (!this.currentCharacter) {
      this.addOutput('No character attached. Use "attach <character-id>" first.', 'error');
      this.isProcessingCommand = false;
      return;
    }

    this.addOutput('Retrieving resource usage...', 'info');
    // Don't set isProcessingCommand to false here - let the response handler do it
    if (this.socketClient) {
      this.socketClient.sendDebugCommand(this.currentCharacter.id, 'top', { args });
    }
  }

  killCommand(args) {
    if (!args.length) {
      this.addOutput('Usage: kill <pid>', 'error');
      this.addOutput('Example: kill 1001', 'info');
      this.isProcessingCommand = false;
      return;
    }

    const pid = parseInt(args[0]);
    if (isNaN(pid)) {
      this.addOutput('Invalid PID. Must be a number.', 'error');
      this.isProcessingCommand = false;
      return;
    }

    if (!this.currentCharacter) {
      this.addOutput('No character attached', 'error');
      this.isProcessingCommand = false;
      return;
    }

    this.addOutput(`Terminating process ${pid}...`, 'warning');
    // Don't set isProcessingCommand to false here - let the response handler do it
    if (this.socketClient) {
      this.socketClient.sendDebugCommand(this.currentCharacter.id, 'kill', { pid });
    }
  }

  restartCommand(args) {
    if (!args.length) {
      this.addOutput('Usage: restart <pid>', 'error');
      this.addOutput('Example: restart 1001', 'info');
      this.isProcessingCommand = false;
      return;
    }

    const pid = parseInt(args[0]);
    if (isNaN(pid)) {
      this.addOutput('Invalid PID. Must be a number.', 'error');
      this.isProcessingCommand = false;
      return;
    }

    if (!this.currentCharacter) {
      this.addOutput('No character attached', 'error');
      this.isProcessingCommand = false;
      return;
    }

    this.addOutput(`Restarting process ${pid}...`, 'info');
    if (this.socketClient) {
      this.socketClient.sendPlayerIntervention(this.currentCharacter.id, {
        type: 'restart_process',
        pid: pid
      });
    }
  }

  monitorCommand(args) {
    if (!this.currentCharacter) {
      this.addOutput('No character attached', 'error');
      this.isProcessingCommand = false;
      return;
    }

    this.addOutput('Generating consciousness monitor report...', 'info');
    if (this.socketClient) {
      this.socketClient.sendDebugCommand(this.currentCharacter.id, 'monitor', { args });
    }
  }

  attachCommand(args) {
    if (!args.length) {
      this.addOutput('Usage: attach <character-id>', 'error');
      this.addOutput('Available characters: alexander-kane', 'info');
      this.isProcessingCommand = false;
      return;
    }

    const characterId = args[0];
    this.addOutput(`Attaching to ${characterId}...`, 'info');
    
    // Load character through app first
    if (window.app) {
      window.app.selectCharacter(characterId).then(() => {
        // Character loaded, now start monitoring
        this.addOutput(`✓ Character ${characterId} loaded`, 'success');
        this.addOutput(`✓ Starting consciousness monitoring...`, 'info');

        // Start monitoring the consciousness
        if (this.socketClient) {
          this.socketClient.emitToServer('monitor:start', { characterId });
        }

        // Character is now managed by StateManager - no need to set locally
        // this.currentCharacter = { id: characterId, name: characterId }; // ❌ Removed
        this.updatePrompt();

        // Send initial ps command to show processes
        setTimeout(() => {
          this.addOutput(`✓ Attached to ${characterId} consciousness`, 'success');
          this.addOutput('', 'output');
          this.addOutput('Running initial process scan...', 'info');
          if (this.socketClient) {
            this.socketClient.sendDebugCommand(characterId, 'ps', {});
          }
        }, 500);

        this.isProcessingCommand = false;
      }).catch((error) => {
        this.addOutput(`✗ Failed to attach to ${characterId}: ${error.message}`, 'error');
        this.isProcessingCommand = false;
      });
    } else {
      this.addOutput(`✗ Application context not available`, 'error');
      this.isProcessingCommand = false;
    }
  }

  debugCommand(args) {
    if (!this.currentCharacter) {
      this.addOutput('No character attached', 'error');
      this.isProcessingCommand = false;
      return;
    }

    this.addOutput('Starting debug session...', 'info');
    if (this.socketClient) {
      this.socketClient.sendDebugCommand(this.currentCharacter.id, 'debug', { args });
    }
  }

  memoryCommand(args) {
    if (!this.currentCharacter) {
      this.addOutput('No character attached', 'error');
      this.isProcessingCommand = false;
      return;
    }

    this.addOutput('Analyzing memory allocation...', 'info');
    if (this.socketClient) {
      this.socketClient.sendDebugCommand(this.currentCharacter.id, 'memory', { args });
    }
  }

  errorsCommand(args) {
    if (!this.currentCharacter) {
      this.addOutput('No character attached', 'error');
      this.isProcessingCommand = false;
      return;
    }

    this.addOutput('Retrieving system errors...', 'info');
    if (this.socketClient) {
      this.socketClient.sendDebugCommand(this.currentCharacter.id, 'errors', { args });
    }
  }

  threadsCommand(args) {
    if (!this.currentCharacter) {
      this.addOutput('No character attached', 'error');
      this.isProcessingCommand = false;
      return;
    }

    this.addOutput('Examining thread states...', 'info');
    if (this.socketClient) {
      this.socketClient.sendDebugCommand(this.currentCharacter.id, 'threads', { args });
    }
  }

  resourcesCommand(args) {
    if (!this.currentCharacter) {
      this.addOutput('No character attached', 'error');
      this.isProcessingCommand = false;
      return;
    }

    this.addOutput('Checking resource allocation...', 'info');
    if (this.socketClient) {
      this.socketClient.sendDebugCommand(this.currentCharacter.id, 'resources', { args });
    }
  }

  optimizeCommand(args) {
    if (!args.length) {
      this.addOutput('Usage: optimize <pid> [memory_limit] [cpu_limit]', 'error');
      this.addOutput('Example: optimize 1001 500 50', 'info');
      this.isProcessingCommand = false;
      return;
    }

    const pid = parseInt(args[0]);
    if (isNaN(pid)) {
      this.addOutput('Invalid PID. Must be a number.', 'error');
      this.isProcessingCommand = false;
      return;
    }

    const memoryLimit = args[1] ? parseInt(args[1]) : null;
    const cpuLimit = args[2] ? parseInt(args[2]) : null;

    if (!this.currentCharacter) {
      this.addOutput('No character attached', 'error');
      this.isProcessingCommand = false;
      return;
    }

    const parameters = {};
    if (memoryLimit) parameters.memory_limit = memoryLimit;
    if (cpuLimit) parameters.cpu_limit = cpuLimit;

    this.addOutput(`Optimizing process ${pid}...`, 'info');
    if (this.socketClient) {
      this.socketClient.sendPlayerIntervention(this.currentCharacter.id, {
        type: 'optimize_process',
        pid: pid,
        parameters: parameters
      });
    }
  }

  emergencyCommand(args) {
    if (!this.currentCharacter) {
      this.addOutput('No character attached', 'error');
      this.isProcessingCommand = false;
      return;
    }

    this.addOutput('EMERGENCY STOP INITIATED', 'error');
    this.addOutput('Stopping all consciousness processes...', 'warning');

    if (this.socketClient) {
      this.socketClient.emitToServer('emergency-stop', {
        characterId: this.currentCharacter.id
      });
    }
  }

  // Utility commands
  statusCommand(args) {
    const connectionStatus = this.stateManager ? this.stateManager.getConnectionStatus() : 'unknown';
    const character = this.stateManager ? this.stateManager.getCurrentCharacter() : null;
    const monitoring = this.stateManager ? this.stateManager.isMonitoringActive() : false;
    
    this.addOutput('╭─ System Status ─────────────────────────╮', 'info');
    this.addOutput(`│ Connection: ${connectionStatus.padEnd(27)} │`, connectionStatus === 'connected' ? 'success' : 'error');
    this.addOutput(`│ Character:  ${(character ? character.name : 'None').padEnd(27)} │`, character ? 'success' : 'warning');
    this.addOutput(`│ Monitoring: ${(monitoring ? 'Active' : 'Inactive').padEnd(27)} │`, monitoring ? 'success' : 'warning');
    this.addOutput(`│ Terminal:   ${(this.isActive ? 'Active' : 'Inactive').padEnd(27)} │`, 'info');
    this.addOutput('╰─────────────────────────────────────────╯', 'info');
    
    this.isProcessingCommand = false;
  }

  whoamiCommand(args) {
    if (this.currentCharacter) {
      this.addOutput(`Currently debugging: ${this.currentCharacter.name} (${this.currentCharacter.id})`, 'info');
      this.addOutput(`Status: ${this.currentCharacter.status}`, 'info');
      this.addOutput(`Description: ${this.currentCharacter.description}`, 'output');
    } else {
      this.addOutput('No character attached', 'warning');
    }
    this.isProcessingCommand = false;
  }

  uptimeCommand(args) {
    if (!this.currentCharacter) {
      this.addOutput('No character attached', 'error');
      this.isProcessingCommand = false;
      return;
    }

    // Calculate uptime from character metadata
    const created = new Date(this.currentCharacter.metadata?.created || Date.now());
    const now = new Date();
    const uptimeMs = now - created;
    const days = Math.floor(uptimeMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((uptimeMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((uptimeMs % (1000 * 60 * 60)) / (1000 * 60));
    
    this.addOutput(`Consciousness uptime: ${days} days, ${hours} hours, ${minutes} minutes`, 'info');
    this.isProcessingCommand = false;
  }

  freeCommand(args) {
    if (!this.currentCharacter) {
      this.addOutput('No character attached', 'error');
      this.isProcessingCommand = false;
      return;
    }

    // Show memory usage summary
    this.addOutput('Requesting memory usage summary...', 'info');
    if (this.socketClient) {
      this.socketClient.sendDebugCommand(this.currentCharacter.id, 'memory', { summary: true });
    }
  }

  diskUsageCommand(args) {
    this.addOutput('Emotional Storage Usage:', 'info');
    this.addOutput('Filesystem         Used  Available Use%', 'output');
    this.addOutput('/consciousness      847M     153M  85%', 'warning');
    this.addOutput('/memories          2.1G     900M  70%', 'output');
    this.addOutput('/relationships     156M     844M  16%', 'success');
    this.addOutput('/trauma           3.2G     800M  80%', 'error');
    this.isProcessingCommand = false;
  }

  tailCommand(args) {
    if (!args.length) {
      this.addOutput('Usage: tail <log_type>', 'error');
      this.addOutput('Available logs: errors, processes, memory', 'info');
      this.isProcessingCommand = false;
      return;
    }

    const logType = args[0];
    this.addOutput(`Tailing ${logType} log...`, 'info');
    
    // Simulate real-time log output
    switch (logType) {
      case 'errors':
        this.addOutput('[ERROR] Grief_Manager.exe: Memory leak detected', 'error');
        this.addOutput('[WARN]  Search_Protocol.exe: Infinite loop detected', 'warning');
        break;
      case 'processes':
        this.addOutput('[INFO]  Process monitor: 7 active processes', 'info');
        this.addOutput('[INFO]  CPU usage: 89.7% (critical)', 'warning');
        break;
      case 'memory':
        this.addOutput('[INFO]  Memory usage: 847MB/1000MB (84.7%)', 'warning');
        this.addOutput('[WARN]  Fragmentation detected in emotional memories', 'warning');
        break;
    }
    
    this.isProcessingCommand = false;
  }

  helpCommand(args) {
    this.addOutput('╭─ Available Commands ────────────────────────────────────╮', 'info');
    this.addOutput('│ Process Management:                                      │', 'info');
    this.addOutput('│   ps                 - List running processes           │', 'output');
    this.addOutput('│   top                - Show resource usage & top procs  │', 'output');
    this.addOutput('│   kill <pid>         - Terminate a process              │', 'output');
    this.addOutput('│   restart <pid>      - Restart a terminated process     │', 'output');
    this.addOutput('│   optimize <pid>     - Optimize process performance     │', 'output');
    this.addOutput('│                                                          │', 'info');
    this.addOutput('│ Memory & Resources:                                      │', 'info');
    this.addOutput('│   memory             - Show memory allocation           │', 'output');
    this.addOutput('│   resources          - Display resource usage           │', 'output');
    this.addOutput('│   threads            - List active threads              │', 'output');
    this.addOutput('│   free               - Memory usage summary             │', 'output');
    this.addOutput('│   df                 - Emotional storage usage          │', 'output');
    this.addOutput('│                                                          │', 'info');
    this.addOutput('│ Debugging & Analysis:                                    │', 'info');
    this.addOutput('│   monitor            - Generate health report           │', 'output');
    this.addOutput('│   errors             - Show system errors               │', 'output');
    this.addOutput('│   debug              - Start debugging session          │', 'output');
    this.addOutput('│   tail <log>         - Follow log output                │', 'output');
    this.addOutput('│                                                          │', 'info');
    this.addOutput('│ Connection & System:                                     │', 'info');
    this.addOutput('│   attach <char-id>   - Attach to character              │', 'output');
    this.addOutput('│   status             - Show system status               │', 'output');
    this.addOutput('│   whoami             - Show current character           │', 'output');
    this.addOutput('│   uptime             - Consciousness uptime             │', 'output');
    this.addOutput('│   emergency          - Emergency stop all processes     │', 'output');
    this.addOutput('│   clear              - Clear terminal output            │', 'output');
    this.addOutput('│   help               - Show this help message           │', 'output');
    this.addOutput('╰──────────────────────────────────────────────────────────╯', 'info');
    this.addOutput('', 'output');
    this.addOutput('Use Ctrl+C to cancel a running command', 'info');
    this.addOutput('Use Tab for command completion', 'info');
    this.isProcessingCommand = false;
  }

  clearCommand(args) {
    if (this.outputElement) {
      this.outputElement.innerHTML = '';
    }
    this.displayWelcomeMessage();
    this.isProcessingCommand = false;
  }

  // Handle debug command results from WebSocket
  handleDebugResult(data) {
    this.isProcessingCommand = false;

    if (!data.success) {
      this.addOutput(`Command failed: ${data.result.error}`, 'error');
      return;
    }

    const { command, result } = data;

    switch (command) {
      case 'ps':
        this.displayProcessList(result.processes);
        break;
        
      case 'top':
        this.displayTopOutput(result);
        break;
        
      case 'kill':
        if (result.success) {
          this.addOutput(`✓ Process ${result.pid} terminated successfully`, 'success');
        } else if (result.error) {
          this.addOutput(`✗ ${result.error}`, 'error');
        }
        break;
        
      case 'monitor':
        this.displayMonitorReport(result);
        break;
        
      case 'attach':
        this.addOutput(result.message, 'success');
        break;
        
      case 'debug':
        this.addOutput(result.message, 'success');
        if (window.app) {
          window.app.navigateToSection('debugger');
        }
        break;
        
      case 'memory':
        this.displayMemoryInfo(result);
        break;
        
      case 'errors':
        this.displayErrorList(result.errors);
        break;
        
      case 'threads':
        this.displayThreadList(result.threads);
        break;
        
      case 'resources':
        this.displayResourceInfo(result.resources);
        break;
        
      default:
        this.addOutput(JSON.stringify(result, null, 2), 'output');
    }
  }

  displayProcessList(processes) {
    if (!processes || processes.length === 0) {
      this.addOutput('No processes found', 'warning');
      return;
    }

    const table = this.createProcessTable(processes);
    this.addOutput(table, 'output');
  }

  displayTopOutput(result) {
    const { processes, resources } = result;
    
    this.addOutput('System Resources:', 'info');
    if (resources) {
      Object.entries(resources).forEach(([name, resource]) => {
        if (resource.current !== undefined && resource.max !== undefined) {
          const percentage = Math.round((resource.current / resource.max) * 100);
          const bar = this.createProgressBar(percentage);
          this.addOutput(`  ${this.formatResourceName(name)}: ${bar} ${resource.current.toFixed(1)}/${resource.max.toFixed(1)} (${percentage}%)`, 'output');
        }
      });
    }
    
    this.addOutput('', 'output');
    this.addOutput('Top Processes by CPU Usage:', 'info');
    if (processes) {
      const table = this.createProcessTable(processes.slice(0, 10));
      this.addOutput(table, 'output');
    }
  }

  displayMonitorReport(result) {
    const { memory, errors, resources, threads } = result;
    
    this.addOutput('╭─ Consciousness Monitor Report ──────────────────────╮', 'info');
    
    if (resources) {
      this.addOutput('│ Resources:                                           │', 'info');
      Object.entries(resources).forEach(([name, resource]) => {
        const percentage = Math.round((resource.current / resource.max) * 100);
        const status = percentage > 80 ? 'CRITICAL' : percentage > 60 ? 'WARNING' : 'OK';
        const statusColor = percentage > 80 ? 'error' : percentage > 60 ? 'warning' : 'success';
        this.addOutput(`│   ${this.formatResourceName(name).padEnd(15)}: ${percentage.toString().padStart(3)}% [${status}]${' '.repeat(10)}│`, statusColor);
      });
    }
    
    if (memory) {
      const memoryCount = Object.keys(memory).length;
      this.addOutput(`│ Memory Blocks: ${memoryCount.toString().padEnd(35)} │`, 'info');
    }
    
    if (threads) {
      const activeThreads = threads.filter(t => t.status === 'running').length;
      this.addOutput(`│ Active Threads: ${activeThreads.toString().padEnd(34)} │`, 'info');
    }
    
    if (errors) {
      const criticalErrors = errors.filter(e => e.severity === 'critical').length;
      this.addOutput(`│ Critical Errors: ${criticalErrors.toString().padEnd(33)} │`, criticalErrors > 0 ? 'error' : 'success');
    }
    
    this.addOutput('╰──────────────────────────────────────────────────────╯', 'info');
    
    if (errors && errors.length > 0) {
      this.addOutput('', 'output');
      this.addOutput('Recent Errors:', 'warning');
      errors.slice(0, 5).forEach((error, index) => {
        const timestamp = new Date(error.timestamp).toLocaleTimeString();
        this.addOutput(`  ${index + 1}. [${timestamp}] ${error.type}: ${error.message}`, 'error');
      });
    }
  }

  displayMemoryInfo(result) {
    const { memory, allocation } = result;
    
    if (allocation) {
      this.addOutput('Memory Allocation Summary:', 'info');
      this.addOutput(`Total Allocated: ${this.formatBytes(allocation.total)}`, 'output');
      this.addOutput('', 'output');
      this.addOutput('By Type:', 'info');
      Object.entries(allocation.byType).forEach(([type, size]) => {
        this.addOutput(`  ${type.padEnd(12)}: ${this.formatBytes(size)}`, 'output');
      });
      this.addOutput('', 'output');
    }
    
    if (memory) {
      this.addOutput('Memory Blocks:', 'info');
      const sortedEntries = Object.entries(memory)
        .sort(([,a], [,b]) => b.size - a.size)
        .slice(0, 10);
        
      sortedEntries.forEach(([address, block]) => {
        const protection = block.protected ? '[PROTECTED]' : '';
        const fragmented = block.fragmented ? '[FRAGMENTED]' : '';
        this.addOutput(`  ${address}: ${block.type.toUpperCase()} - ${this.formatBytes(block.size)} ${protection} ${fragmented}`, 'output');
        this.addOutput(`    ${block.description}`, 'output');
      });
    }
  }

  displayErrorList(errors) {
    if (!errors || errors.length === 0) {
      this.addOutput('No system errors found', 'success');
      return;
    }

    this.addOutput(`System Errors (${errors.length}):`, 'info');
    errors.forEach((error, index) => {
      const timestamp = new Date(error.timestamp).toLocaleTimeString();
      const severityColor = error.severity === 'critical' ? 'error' : 
                           error.severity === 'warning' ? 'warning' : 'info';
      
      this.addOutput(`${(index + 1).toString().padStart(3)}. [${timestamp}] [${error.severity.toUpperCase()}] ${error.type}`, severityColor);
      this.addOutput(`     ${error.message}`, 'output');
      
      if (error.recovery_suggestion) {
        this.addOutput(`     Suggestion: ${error.recovery_suggestion}`, 'info');
      }
      
      if (index < errors.length - 1) {
        this.addOutput('', 'output');
      }
    });
  }

  displayThreadList(threads) {
    if (!threads || threads.length === 0) {
      this.addOutput('No threads found', 'warning');
      return;
    }

    this.addOutput('Active Threads:', 'info');
    this.addOutput('TID   NAME                     STATUS    PRIORITY  CPU_TIME', 'info');
    this.addOutput('─'.repeat(65), 'info');
    
    threads.forEach(thread => {
      const tid = thread.tid.toString().padEnd(5);
      const name = thread.name.padEnd(24);
      const status = thread.status.padEnd(9);
      const priority = thread.priority.toString().padEnd(9);
      const cpuTime = thread.cpu_time ? thread.cpu_time.toFixed(1) : '0.0';
      
      const statusColor = thread.status === 'running' ? 'success' : 
                         thread.status === 'waiting' ? 'warning' : 'error';
      
      this.addOutput(`${tid} ${name} ${status} ${priority} ${cpuTime}`, statusColor);
      
      if (thread.wait_reason) {
        this.addOutput(`      Wait reason: ${thread.wait_reason}`, 'warning');
      }
    });
  }

  displayResourceInfo(resources) {
    if (!resources) {
      this.addOutput('No resource information available', 'warning');
      return;
    }

    this.addOutput('Resource Status:', 'info');
    this.addOutput('', 'output');
    
    Object.entries(resources).forEach(([name, resource]) => {
      if (resource.current !== undefined && resource.max !== undefined) {
        const percentage = Math.round((resource.current / resource.max) * 100);
        const bar = this.createProgressBar(percentage, 20);
        
        this.addOutput(`${this.formatResourceName(name)}:`, 'info');
        this.addOutput(`  ${bar} ${percentage}%`, 'output');
        this.addOutput(`  Current: ${resource.current.toFixed(1)} / Max: ${resource.max.toFixed(1)}`, 'output');
        
        if (resource.allocation) {
          this.addOutput('  Allocation:', 'info');
          Object.entries(resource.allocation).forEach(([task, amount]) => {
            this.addOutput(`    ${task}: ${amount.toFixed(1)}%`, 'output');
          });
        }
        
        if (resource.regeneration_rate) {
          this.addOutput(`  Regeneration: ${resource.regeneration_rate}/hour`, 'info');
        }
        
        this.addOutput('', 'output');
      }
    });
  }

  handleConsciousnessUpdate(data) {
    // Show subtle notifications for critical changes
    if (data.state.system_errors) {
      const criticalErrors = data.state.system_errors.filter(e => e.severity === 'critical');
      if (criticalErrors.length > 0) {
        criticalErrors.forEach(error => {
          this.addOutput(`ALERT: ${error.type} - ${error.message}`, 'error');
        });
      }
    }
  }

  // Utility methods
  createProcessTable(processes) {
    let table = 'PID   NAME                     CPU%   MEMORY    STATUS      LAST ACTIVITY\n';
    table += '─'.repeat(75) + '\n';

    processes.forEach(process => {
      const pid = process.pid.toString().padEnd(5);
      const name = (process.name || 'Unknown').padEnd(24);
      const cpu = (Math.round(process.cpu_usage || 0) + '%').padEnd(6);
      const memory = (Math.round(process.memory_mb || 0) + 'MB').padEnd(9);
      const status = (process.status || 'unknown').padEnd(11);
      const activity = process.last_activity ? 
        new Date(process.last_activity).toLocaleTimeString() : 'N/A';
      
      table += `${pid} ${name} ${cpu} ${memory} ${status} ${activity}\n`;
    });

    return table;
  }

  createProgressBar(percentage, width = 15) {
    const filled = Math.round((percentage / 100) * width);
    const empty = width - filled;
    const bar = '█'.repeat(filled) + '░'.repeat(empty);
    return `[${bar}]`;
  }

  formatResourceName(name) {
    return name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  addOutput(text, type = 'output') {
    if (!this.outputElement) return;

    const line = document.createElement('div');
    line.className = `terminal-line ${type}`;
    
    // Handle special formatting for tables and progress bars
    if (text.includes('─') || text.includes('█') || text.includes('░')) {
      line.classList.add('terminal-formatted');
    }
    
    line.textContent = text;
    
    this.outputElement.appendChild(line);
    this.outputElement.scrollTop = this.outputElement.scrollHeight;
  }

  addToHistory(command) {
    // Don't add duplicate consecutive commands
    if (this.commandHistory[0] !== command) {
      this.commandHistory.unshift(command);
      if (this.commandHistory.length > 100) {
        this.commandHistory.pop();
      }
      this.saveCommandHistory();
    }
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
    this.handleDebugResult(data);
  }

  onConsciousnessUpdate(event, data) {
    if (event === 'consciousness-updated' && this.isActive) {
      this.handleConsciousnessUpdate({ state: data });
    }
  }
}

// Export Terminal class for dependency injection
export default Terminal;

