// Story-specific terminal commands for the Fractured Time narrative
class StoryTerminalCommands {
  constructor(terminal) {
    this.terminal = terminal;
    this.storyState = {
      currentScenario: null,
      scenarioProgress: {},
      unlockedMemories: [],
      timelineAccess: ['prime'],
      quantumCoherence: 1.0
    };
  }

  // Return mapping of command names to handlers
  getCommands() {
    return {
      'timeline': this.timelineCommand.bind(this),
      'memory': this.memoryCommand.bind(this),
      'quantum': this.quantumCommand.bind(this),
      'search': this.searchCommand.bind(this),
      'accept': this.acceptCommand.bind(this),
      'fragment': this.fragmentCommand.bind(this),
      'resonate': this.resonateCommand.bind(this),
      'leo': this.leoCommand.bind(this)
    };
  }

  timelineCommand(args) {
    if (!args || args.length === 0) {
      this.terminal.addOutput('Timeline Analysis System v2.1', 'info');
      this.terminal.addOutput('Current timeline: PRIME (fractured)', 'warning');
      this.terminal.addOutput('Detected branches: 7', 'output');
      this.terminal.addOutput('', 'output');
      this.terminal.addOutput('Usage: timeline <subcommand>', 'output');
      this.terminal.addOutput('  list     - Show all detected timelines', 'output');
      this.terminal.addOutput('  analyze  - Analyze timeline coherence', 'output');
      this.terminal.addOutput('  merge    - Attempt timeline reconciliation', 'output');
      this.terminal.addOutput('  lock     - Lock to specific timeline', 'output');
      return;
    }

    const subcommand = args[0];
    switch (subcommand) {
      case 'list':
        this.terminal.addOutput('Detected Timeline Branches:', 'info');
        this.terminal.addOutput('─────────────────────────────────────', 'output');
        this.terminal.addOutput('[PRIME]   Leo exists, experiment pending', 'success');
        this.terminal.addOutput('[ALPHA]   Experiment cancelled, Leo safe', 'output');
        this.terminal.addOutput('[BETA]    Partial field collapse, Leo injured', 'warning');
        this.terminal.addOutput('[GAMMA]   Field success, Leo phase-shifted', 'warning');
        this.terminal.addOutput('[DELTA]   No experiment, different life path', 'output');
        this.terminal.addOutput('[EPSILON] Leo found in parallel timeline', 'info');
        this.terminal.addOutput('[ZETA]    Consciousness merge with Leo', 'error');
        break;

      case 'analyze':
        this.terminal.addOutput('Analyzing timeline coherence...', 'info');
        setTimeout(() => {
          this.terminal.addOutput('Timeline Coherence Report:', 'info');
          this.terminal.addOutput('├─ Quantum signature overlap: 47%', 'warning');
          this.terminal.addOutput('├─ Causal paradoxes detected: 3', 'error');
          this.terminal.addOutput('├─ Memory fragment distribution:', 'output');
          this.terminal.addOutput('│  ├─ PRIME: 31%', 'output');
          this.terminal.addOutput('│  ├─ ALPHA: 12%', 'output');
          this.terminal.addOutput('│  ├─ BETA: 23%', 'output');
          this.terminal.addOutput('│  └─ Others: 34%', 'output');
          this.terminal.addOutput('└─ Stability rating: CRITICAL', 'error');
        }, 1500);
        break;

      case 'merge':
        this.terminal.addOutput('WARNING: Timeline merge is highly experimental', 'warning');
        this.terminal.addOutput('This operation may cause:', 'warning');
        this.terminal.addOutput('  - Severe memory fragmentation', 'error');
        this.terminal.addOutput('  - Identity dissociation', 'error');
        this.terminal.addOutput('  - Temporal paradox cascade', 'error');
        this.terminal.addOutput('', 'output');
        this.terminal.addOutput('Type "timeline merge --confirm" to proceed', 'warning');
        break;

      case 'lock':
        if (args[1]) {
          this.terminal.addOutput(`Attempting to lock to timeline ${args[1].toUpperCase()}...`, 'info');
          setTimeout(() => {
            this.terminal.addOutput('ERROR: Cannot lock timeline while memories remain fragmented', 'error');
            this.terminal.addOutput('Resolve memory conflicts first using "memory defrag"', 'warning');
          }, 1000);
        } else {
          this.terminal.addOutput('Usage: timeline lock <timeline-id>', 'output');
        }
        break;
    }
  }

  memoryCommand(args) {
    if (!args || args.length === 0) {
      this.terminal.addOutput('Memory Management Interface', 'info');
      this.terminal.addOutput('Total: 8192 MB | Used: 6847 MB | Free: 1345 MB', 'output');
      this.terminal.addOutput('', 'output');
      this.terminal.addOutput('Subcommands:', 'output');
      this.terminal.addOutput('  scan     - Scan for memory leaks', 'output');
      this.terminal.addOutput('  defrag   - Defragment emotional memories', 'output');
      this.terminal.addOutput('  protect  - Protect specific memories', 'output');
      this.terminal.addOutput('  release  - Release memory allocations', 'output');
      return;
    }

    const subcommand = args[0];
    switch (subcommand) {
      case 'scan':
        this.terminal.addOutput('Scanning memory for leaks...', 'info');
        this.simulateProgress('Memory scan', 3000, () => {
          this.terminal.addOutput('', 'output');
          this.terminal.addOutput('Memory Leak Detection Results:', 'warning');
          this.terminal.addOutput('├─ grief_processing.exe: 847 MB (GROWING)', 'error');
          this.terminal.addOutput('├─ leo_search_loop.dll: 423 MB (RECURSIVE)', 'error');
          this.terminal.addOutput('├─ park_memory_3_15.dat: 234 MB (LOCKED)', 'warning');
          this.terminal.addOutput('└─ emily_neglect.tmp: 156 MB (ORPHANED)', 'warning');
          this.terminal.addOutput('', 'output');
          this.terminal.addOutput('Total leaked memory: 1660 MB', 'error');
        });
        break;

      case 'defrag':
        this.terminal.addOutput('WARNING: Defragmentation may cause temporary disorientation', 'warning');
        this.terminal.addOutput('Emotional memories will be reorganized and compressed', 'info');
        this.terminal.addOutput('', 'output');
        this.terminal.addOutput('Continue? (y/n)', 'input');
        break;

      case 'protect':
        if (args[1]) {
          this.terminal.addOutput(`Protecting memory region: ${args[1]}`, 'info');
          this.terminal.addOutput('Memory protection enabled', 'success');
          this.terminal.addOutput('This memory will not be garbage collected', 'output');
        } else {
          this.terminal.addOutput('Currently protected memories:', 'info');
          this.terminal.addOutput('├─ 0x1000000000000000: Leo\'s Memories (2048 MB)', 'output');
          this.terminal.addOutput('└─ 0x6000000000000000: Timeline Fragments (1024 MB)', 'output');
        }
        break;
    }
  }

  quantumCommand(args) {
    this.terminal.addOutput('Quantum State Observer v1.3', 'info');
    this.terminal.addOutput('─────────────────────────────', 'output');
    this.terminal.addOutput('Consciousness Coherence: 73%', 'warning');
    this.terminal.addOutput('Quantum Superposition: ACTIVE', 'info');
    this.terminal.addOutput('Observer Effect: INTERFERING', 'warning');
    this.terminal.addOutput('', 'output');
    this.terminal.addOutput('Wave Function Status:', 'info');
    this.terminal.addOutput('├─ Leo Present:  ▓▓▓▓░░░░░░ 42%', 'output');
    this.terminal.addOutput('├─ Leo Absent:   ▓▓▓▓▓▓░░░░ 58%', 'output');
    this.terminal.addOutput('└─ Collapse Risk: HIGH', 'error');
  }

  searchCommand(args) {
    if (!args || args.length === 0) {
      this.terminal.addOutput('Search Protocol Manager', 'info');
      this.terminal.addOutput('Status: INFINITE LOOP DETECTED', 'error');
      return;
    }

    if (args[0] === 'status') {
      this.terminal.addOutput('Leo Search Protocol Status:', 'info');
      this.terminal.addOutput('├─ Iterations: 2,847,293', 'output');
      this.terminal.addOutput('├─ Timelines Scanned: 7/∞', 'warning');
      this.terminal.addOutput('├─ Pattern Matches: 0', 'error');
      this.terminal.addOutput('├─ CPU Usage: 89%', 'error');
      this.terminal.addOutput('└─ Est. Completion: Never', 'error');
    } else if (args[0] === 'pause') {
      this.terminal.addOutput('Attempting to pause search protocol...', 'info');
      setTimeout(() => {
        this.terminal.addOutput('ERROR: Cannot pause - emotional dependency too strong', 'error');
        this.terminal.addOutput('Try: kill -9 $(pgrep -f leo_search)', 'warning');
      }, 1000);
    } else if (args[0] === 'optimize') {
      this.terminal.addOutput('Optimizing search parameters...', 'info');
      this.terminal.addOutput('Applying quantum probability filters...', 'output');
      this.terminal.addOutput('Search efficiency improved by 12%', 'success');
      this.terminal.addOutput('Warning: Hope index decreased by 8%', 'warning');
    }
  }

  acceptCommand(args) {
    this.terminal.addOutput('Acceptance Protocol Installer', 'info');
    this.terminal.addOutput('Version: 0.9.1-beta (Dr. Evelyn Cross)', 'output');
    this.terminal.addOutput('', 'output');
    this.terminal.addOutput('This protocol will:', 'warning');
    this.terminal.addOutput('  1. Reduce grief_processing.exe priority', 'output');
    this.terminal.addOutput('  2. Install acceptance_handler.dll', 'output');
    this.terminal.addOutput('  3. Modify search parameters to "sustainable"', 'output');
    this.terminal.addOutput('  4. Enable dual-state quantum acceptance', 'output');
    this.terminal.addOutput('', 'output');
    this.terminal.addOutput('WARNING: System showing 95% resistance', 'error');
    this.terminal.addOutput('Installation blocked by defense_mechanism.sys', 'error');
  }

  fragmentCommand(args) {
    this.terminal.addOutput('Memory Fragment Analysis:', 'info');
    this.terminal.addOutput('', 'output');
    this.terminal.addOutput('Fragment 0x1000…15a7: "Leo laughing at the pond"', 'success');
    this.terminal.addOutput('├─ Integrity: 97%', 'output');
    this.terminal.addOutput('├─ Access Count: 84,291', 'warning');
    this.terminal.addOutput('└─ Emotional Weight: EXTREME', 'error');
    this.terminal.addOutput('', 'output');
    this.terminal.addOutput('Fragment 0x1000…22bf: "The flash of light"', 'error');
    this.terminal.addOutput('├─ Integrity: 31% (CORRUPTED)', 'error');
    this.terminal.addOutput('├─ Access Count: 147,892', 'error');
    this.terminal.addOutput('└─ Emotional Weight: TRAUMATIC', 'error');
    this.terminal.addOutput('', 'output');
    this.terminal.addOutput('Fragment 0x1000…78de: "Empty swing"', 'warning');
    this.terminal.addOutput('├─ Integrity: 84%', 'output');
    this.terminal.addOutput('├─ Access Count: 62,102', 'warning');
    this.terminal.addOutput('└─ Emotional Weight: HEAVY', 'warning');
  }

  resonateCommand(args) {
    this.terminal.addOutput('Temporal Resonance Scanner', 'info');
    this.terminal.addOutput('Scanning for Leo\'s quantum signature…', 'output');

    let progress = 0;
    const scanInterval = setInterval(() => {
      progress += 10;
      this.terminal.addOutput(`Scanning: [${'▓'.repeat(progress / 5).padEnd(20, '░')}] ${progress}%`, 'output');

      if (progress >= 100) {
        clearInterval(scanInterval);
        this.terminal.addOutput('', 'output');
        this.terminal.addOutput('Resonance detected in:', 'success');
        this.terminal.addOutput('├─ Timeline EPSILON: 0.23 probability', 'info');
        this.terminal.addOutput('├─ Timeline GAMMA: 0.17 probability', 'info');
        this.terminal.addOutput('├─ Quantum void: 0.60 probability', 'warning');
        this.terminal.addOutput('', 'output');
        this.terminal.addOutput('WARNING: Pursuing resonance may destabilize current timeline', 'error');
      }
    }, 300);
  }

  leoCommand(args) {
    this.terminal.addOutput('', 'output');
    this.terminal.addOutput('Leo Kane', 'info');
    this.terminal.addOutput('Age: 8 years, 3 months, 6 days', 'output');
    this.terminal.addOutput('Status: UNKNOWN', 'error');
    this.terminal.addOutput('Last Seen: March 15, 2024, 3:47 PM', 'output');
    this.terminal.addOutput('Location: Riverview Park, pond area', 'output');
    this.terminal.addOutput('', 'output');
    this.terminal.addOutput('Favorite Things:', 'success');
    this.terminal.addOutput('├─ Feeding ducks at the pond', 'output');
    this.terminal.addOutput('├─ Building time machines with Dad', 'output');
    this.terminal.addOutput('├─ Chocolate chip pancakes', 'output');
    this.terminal.addOutput('├─ Asking "Why?" about everything', 'output');
    this.terminal.addOutput('└─ Bedtime stories about space', 'output');
    this.terminal.addOutput('', 'output');
    this.terminal.addOutput('System Note: Memory access causing emotional spike', 'warning');
  }

  // Helper to simulate progress for memory scans
  simulateProgress(label, duration, callback) {
    const steps = 10;
    let progress = 0;
    const interval = duration / steps;
    const progressInterval = setInterval(() => {
      progress += 1;
      const percent = (progress / steps) * 100;
      this.terminal.addOutput(`${label}: ${percent}%`, 'output');
      if (progress >= steps) {
        clearInterval(progressInterval);
        if (callback) callback();
      }
    }, interval);
  }
}

export default StoryTerminalCommands;

