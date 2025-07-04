// Component Showcase - Runtime.zyjeski.com
// Interactive demonstration of consciousness debugging UI components

// Import all components
import { ProcessList } from '/js/components/ProcessList.js';
import ResourceMeter from '/js/components/ResourceMeter.js';
import ErrorLog from '/js/components/ErrorLog.js';
import MemoryMap from '/js/components/MemoryMap.js';
import { ConsciousnessTransformer } from '/js/utils/ConsciousnessTransformer.js';

/**
 * Data Simulation System
 * Generates realistic consciousness debugging data for all components
 */
class DataSimulator {
  constructor() {
    this.running = false;
    this.interval = null;
    this.currentScenario = 'normal';
    this.processIdCounter = 1000;
    this.errorIdCounter = 1;
    
    // Scenario configurations
    this.scenarios = {
      'normal': {
        processCount: [5, 12],
        cpuRange: [10, 40],
        memoryRange: [30, 60],
        errorRate: 0.1,
        memoryFragmentation: 0.15
      },
      'grief-overload': {
        processCount: [15, 25],
        cpuRange: [60, 95],
        memoryRange: [70, 95],
        errorRate: 0.4,
        memoryFragmentation: 0.45,
        dominantProcess: 'Grief_Manager.exe'
      },
      'anxiety-loop': {
        processCount: [8, 15],
        cpuRange: [80, 100],
        memoryRange: [40, 70],
        errorRate: 0.6,
        memoryFragmentation: 0.25,
        dominantProcess: 'Anxiety_Loop.exe'
      },
      'memory-consolidation': {
        processCount: [6, 10],
        cpuRange: [20, 50],
        memoryRange: [60, 85],
        errorRate: 0.05,
        memoryFragmentation: 0.8,
        dominantProcess: 'Memory_Consolidator.exe'
      },
      'recovery': {
        processCount: [4, 8],
        cpuRange: [5, 25],
        memoryRange: [20, 45],
        errorRate: 0.02,
        memoryFragmentation: 0.1,
        dominantProcess: 'Recovery_Manager.exe'
      }
    };
    
    // Process templates for consciousness debugging
    this.processTemplates = [
      { name: 'Grief_Manager.exe', type: 'emotion', priority: 'high' },
      { name: 'Anxiety_Loop.exe', type: 'emotion', priority: 'critical' },
      { name: 'Memory_Consolidator.exe', type: 'system', priority: 'normal' },
      { name: 'Temporal_Sync.dll', type: 'system', priority: 'high' },
      { name: 'Search_Protocol.exe', type: 'cognitive', priority: 'normal' },
      { name: 'Relationship_Manager.dll', type: 'social', priority: 'normal' },
      { name: 'Self_Identity.exe', type: 'core', priority: 'critical' },
      { name: 'Reality_Anchor.dll', type: 'core', priority: 'critical' },
      { name: 'Emotion_Processor.exe', type: 'emotion', priority: 'high' },
      { name: 'Decision_Engine.dll', type: 'cognitive', priority: 'high' },
      { name: 'Memory_Allocator.sys', type: 'system', priority: 'normal' },
      { name: 'Trauma_Handler.exe', type: 'emotion', priority: 'high' },
      { name: 'Social_Parser.dll', type: 'social', priority: 'normal' },
      { name: 'Attention_Manager.exe', type: 'cognitive', priority: 'high' },
      { name: 'Dream_Processor.exe', type: 'subconscious', priority: 'low' }
    ];
    
    // Error templates for consciousness debugging
    this.errorTemplates = [
      { type: 'memory_leak', severity: 'warning', message: 'Unprocessed emotional memory detected' },
      { type: 'stack_overflow', severity: 'critical', message: 'Recursive anxiety pattern detected' },
      { type: 'null_reference', severity: 'error', message: 'Missing self-reference in identity matrix' },
      { type: 'timeout', severity: 'warning', message: 'Decision process timeout exceeded' },
      { type: 'access_violation', severity: 'error', message: 'Unauthorized access to traumatic memory' },
      { type: 'deadlock', severity: 'critical', message: 'Circular dependency in relationship processing' },
      { type: 'resource_exhaustion', severity: 'error', message: 'Attention resources depleted' },
      { type: 'validation_error', severity: 'warning', message: 'Reality anchor validation failed' },
      { type: 'synchronization_error', severity: 'error', message: 'Temporal sync desynchronization' },
      { type: 'buffer_overflow', severity: 'critical', message: 'Emotional buffer capacity exceeded' }
    ];
    
    // Current state
    this.currentData = {
      processes: [],
      resources: { cpu: 0, memory: 0, threads: 0 },
      errors: [],
      memoryBlocks: []
    };
  }
  
  /**
   * Start data simulation with specified scenario
   * Only starts continuous updates if explicitly requested
   */
  start(scenario = 'normal', continuous = false) {
    if (this.running) {
      this.stop();
    }

    this.currentScenario = scenario;
    this.running = continuous;

    // Generate initial data
    this.generateData();

    // Only set up interval for continuous updates if explicitly requested
    if (continuous) {
      this.interval = setInterval(() => {
        this.generateData();
        this.broadcastData();
      }, 1000);
      console.log(`DataSimulator: Started continuous updates with scenario '${scenario}'`);
    } else {
      console.log(`DataSimulator: Generated static data for scenario '${scenario}'`);
    }
  }
  
  /**
   * Stop data simulation
   */
  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.running = false;
    console.log('DataSimulator: Stopped');
  }
  
  /**
   * Generate data based on current scenario
   */
  generateData() {
    const config = this.scenarios[this.currentScenario];
    
    this.currentData = {
      processes: this.generateProcesses(config),
      resources: this.generateResources(config),
      errors: this.generateErrors(config),
      memoryBlocks: this.generateMemoryBlocks(config)
    };
  }
  
  /**
   * Generate process data
   */
  generateProcesses(config) {
    const count = this.randomBetween(config.processCount[0], config.processCount[1]);
    const processes = [];
    
    // Always include dominant process if specified
    if (config.dominantProcess) {
      const template = this.processTemplates.find(t => t.name === config.dominantProcess);
      if (template) {
        processes.push(this.createProcess(template, config, true));
      }
    }
    
    // Fill remaining slots with random processes
    while (processes.length < count) {
      const template = this.getRandomElement(this.processTemplates);
      processes.push(this.createProcess(template, config, false));
    }
    
    return processes;
  }
  
  /**
   * Create individual process
   */
  createProcess(template, config, isDominant = false) {
    const baseMemory = isDominant ? 200 : 50;
    const baseCpu = isDominant ? 30 : 5;
    
    return {
      pid: this.processIdCounter++,
      name: template.name,
      type: template.type,
      priority: template.priority,
      status: this.getProcessStatus(config, isDominant),
      cpu: Math.min(100, baseCpu + this.randomBetween(0, config.cpuRange[1] - config.cpuRange[0])),
      memory: Math.min(1024, baseMemory + this.randomBetween(0, 300)),
      threads: this.randomBetween(1, 8),
      startTime: Date.now() - this.randomBetween(1000, 300000),
      description: this.getProcessDescription(template.name, template.type)
    };
  }
  
  /**
   * Get process status based on scenario
   */
  getProcessStatus(config, isDominant) {
    if (isDominant && config.errorRate > 0.3) {
      return Math.random() < 0.7 ? 'error' : 'warning';
    }
    
    const rand = Math.random();
    if (rand < config.errorRate * 0.3) return 'error';
    if (rand < config.errorRate) return 'warning';
    return 'running';
  }
  
  /**
   * Generate resource data
   */
  generateResources(config) {
    return {
      cpu: {
        percentage: this.randomBetween(config.cpuRange[0], config.cpuRange[1]),
        cores: 4,
        temperature: this.randomBetween(45, 75)
      },
      memory: {
        percentage: this.randomBetween(config.memoryRange[0], config.memoryRange[1]),
        used: this.randomBetween(2048, 6144),
        total: 8192
      },
      threads: {
        used: this.randomBetween(8, 32),
        total: 64
      }
    };
  }
  
  /**
   * Generate error data
   */
  generateErrors(config) {
    const errors = [];
    const errorCount = Math.floor(Math.random() * 5 * config.errorRate);
    
    for (let i = 0; i < errorCount; i++) {
      const template = this.getRandomElement(this.errorTemplates);
      errors.push({
        id: this.errorIdCounter++,
        type: template.type,
        severity: template.severity,
        message: template.message,
        timestamp: Date.now() - this.randomBetween(0, 60000),
        processId: Math.random() < 0.7 ? this.getRandomProcessId() : null,
        details: this.generateErrorDetails(template.type)
      });
    }
    
    return errors;
  }
  
  /**
   * Generate memory block data
   */
  generateMemoryBlocks(config) {
    const blocks = [];
    const blockCount = this.randomBetween(50, 200);
    const types = ['emotion', 'trauma', 'relationship', 'system'];
    
    for (let i = 0; i < blockCount; i++) {
      const isFragmented = Math.random() < config.memoryFragmentation;
      blocks.push({
        id: i,
        address: 0x1000 + (i * 64),
        size: isFragmented ? this.randomBetween(16, 32) : this.randomBetween(32, 128),
        type: this.getRandomElement(types),
        allocated: Math.random() < 0.8,
        fragmented: isFragmented,
        lastAccess: Date.now() - this.randomBetween(0, 3600000),
        content: this.generateMemoryContent()
      });
    }
    
    return blocks;
  }
  
  /**
   * Utility methods
   */
  randomBetween(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  
  getRandomElement(array) {
    return array[Math.floor(Math.random() * array.length)];
  }
  
  getRandomProcessId() {
    return this.randomBetween(1000, this.processIdCounter);
  }
  
  getProcessDescription(name, type) {
    const descriptions = {
      'Grief_Manager.exe': 'Processes and manages grief-related emotional states',
      'Anxiety_Loop.exe': 'Handles anxiety processing and loop detection',
      'Memory_Consolidator.exe': 'Consolidates short-term memories into long-term storage',
      'Temporal_Sync.dll': 'Synchronizes temporal perception and memory timestamps',
      'Search_Protocol.exe': 'Searches memory for relevant information and patterns'
    };
    return descriptions[name] || `${type} processing component`;
  }
  
  generateErrorDetails(type) {
    const details = {
      'memory_leak': { memoryAddress: '0x' + Math.floor(Math.random() * 0xFFFFFF).toString(16) },
      'stack_overflow': { stackDepth: this.randomBetween(1000, 5000) },
      'null_reference': { objectType: 'IdentityMatrix' },
      'timeout': { timeoutMs: this.randomBetween(5000, 30000) }
    };
    return details[type] || {};
  }
  
  generateMemoryContent() {
    const contents = [
      'Childhood memory fragment',
      'Emotional association data',
      'Relationship context',
      'System configuration',
      'Traumatic event marker',
      'Decision tree node',
      'Sensory data cache'
    ];
    return this.getRandomElement(contents);
  }
  
  /**
   * Broadcast data to all listeners
   */
  broadcastData() {
    // Emit custom event with current data
    window.dispatchEvent(new CustomEvent('simulatorData', {
      detail: this.currentData
    }));
  }
  
  /**
   * Get current data snapshot
   */
  getCurrentData() {
    return { ...this.currentData };
  }

  /**
   * Manually trigger a single data update
   * Used for user-initiated actions while maintaining Ground State Principle
   */
  triggerUpdate() {
    this.generateData();
    this.broadcastData();
  }
}

/**
 * Performance Monitor
 * Tracks component performance metrics
 */
class PerformanceMonitor {
  constructor() {
    this.metrics = {
      fps: 60,
      renderTimes: new Map(),
      memoryUsage: 0,
      updateRate: 0
    };

    this.frameCount = 0;
    this.lastFrameTime = performance.now();
    this.updateCount = 0;
    this.lastUpdateTime = performance.now();

    this.startMonitoring();
  }

  startMonitoring() {
    // FPS monitoring
    const measureFPS = () => {
      this.frameCount++;
      const now = performance.now();

      if (now - this.lastFrameTime >= 1000) {
        this.metrics.fps = Math.round((this.frameCount * 1000) / (now - this.lastFrameTime));
        this.frameCount = 0;
        this.lastFrameTime = now;
      }

      requestAnimationFrame(measureFPS);
    };
    requestAnimationFrame(measureFPS);

    // Memory usage monitoring (if available) - manual updates only
    // Following Ground State Principle - no automatic background processes
    this.updateMemoryUsage();

    // Update rate monitoring - manual updates only
    this.updateRate();
  }

  /**
   * Manually update memory usage metrics
   */
  updateMemoryUsage() {
    if (performance.memory) {
      this.metrics.memoryUsage = Math.round(performance.memory.usedJSHeapSize / 1024 / 1024);
    }
  }

  /**
   * Manually update rate metrics
   */
  updateRate() {
    const now = performance.now();
    this.metrics.updateRate = Math.round((this.updateCount * 1000) / (now - this.lastUpdateTime));
    this.updateCount = 0;
    this.lastUpdateTime = now;
  }

  recordRenderTime(componentName, time) {
    this.metrics.renderTimes.set(componentName, time);
  }

  recordUpdate() {
    this.updateCount++;
  }

  getMetrics() {
    return { ...this.metrics };
  }

  reset() {
    this.metrics.renderTimes.clear();
    this.frameCount = 0;
    this.updateCount = 0;
    this.lastFrameTime = performance.now();
    this.lastUpdateTime = performance.now();
  }

  startProfiling() {
    console.log('Performance profiling started');
    this.profilingEnabled = true;
  }

  stopProfiling() {
    console.log('Performance profiling stopped');
    this.profilingEnabled = false;
  }
}

/**
 * Configuration Manager
 * Handles component configuration and presets
 */
class ConfigurationManager {
  constructor() {
    this.configurations = new Map();
    this.presets = new Map();
    this.loadDefaultPresets();
  }

  loadDefaultPresets() {
    this.presets.set('default', {
      ProcessList: {
        virtualScroll: true,
        rowHeight: 48,
        theme: 'dark',
        showResources: true
      },
      ResourceMeter: {
        type: 'circular',
        animate: true,
        thresholds: { low: 30, medium: 70, high: 90 }
      },
      ErrorLog: {
        maxErrors: 100,
        autoDismiss: true,
        groupSimilar: true
      },
      MemoryMap: {
        viewMode: 'type',
        blockSize: 16,
        enableZoom: true
      }
    });

    this.presets.set('performance', {
      ProcessList: {
        virtualScroll: true,
        rowHeight: 32,
        theme: 'dark',
        showResources: false
      },
      ResourceMeter: {
        type: 'linear',
        animate: false,
        thresholds: { low: 50, medium: 80, high: 95 }
      },
      ErrorLog: {
        maxErrors: 50,
        autoDismiss: true,
        groupSimilar: true
      },
      MemoryMap: {
        viewMode: 'fragmentation',
        blockSize: 8,
        enableZoom: false
      }
    });
  }

  setConfiguration(componentName, config) {
    this.configurations.set(componentName, { ...config });
  }

  getConfiguration(componentName) {
    return this.configurations.get(componentName) || {};
  }

  exportConfiguration() {
    const config = {};
    for (const [name, conf] of this.configurations) {
      config[name] = conf;
    }
    return JSON.stringify(config, null, 2);
  }

  importConfiguration(jsonString) {
    try {
      const config = JSON.parse(jsonString);
      for (const [name, conf] of Object.entries(config)) {
        this.configurations.set(name, conf);
      }
      return true;
    } catch (error) {
      console.error('Failed to import configuration:', error);
      return false;
    }
  }

  applyPreset(presetName) {
    const preset = this.presets.get(presetName);
    if (preset) {
      for (const [name, config] of Object.entries(preset)) {
        this.configurations.set(name, { ...config });
      }
      return true;
    }
    return false;
  }
}

/**
 * Main Component Showcase Class
 * Orchestrates all components and manages the showcase interface
 */
class ComponentShowcase {
  constructor() {
    this.components = new Map();
    this.dataSimulator = new DataSimulator();
    this.performanceMonitor = new PerformanceMonitor();
    this.configManager = new ConfigurationManager();
    this.consciousnessTransformer = new ConsciousnessTransformer();

    this.currentTheme = 'dark';
    this.isInitialized = false;

    // DOM elements
    this.elements = {};

    this.init();
  }

  /**
   * Initialize the showcase
   */
  async init() {
    try {
      console.log('ComponentShowcase: Initializing...');

      // Cache DOM elements
      this.cacheElements();

      // Initialize components
      await this.initializeComponents();

      // Initialize throttling for events
      this._lastThresholdErrors = new Map();
      this._thresholdErrorCooldown = 5000; // 5 second cooldown per metric

      // Setup event listeners
      this.setupEventListeners();

      // Setup data simulation
      this.setupDataSimulation();

      // Setup performance monitoring
      this.setupPerformanceDisplay();

      // Apply default configurations
      this.configManager.applyPreset('default');

      // Hide loading overlay
      this.hideLoadingOverlay();

      this.isInitialized = true;
      console.log('ComponentShowcase: Initialization complete');

    } catch (error) {
      console.error('ComponentShowcase: Initialization failed', error);
      this.showError('Failed to initialize showcase: ' + error.message);
    }
  }

  /**
   * Cache DOM elements
   */
  cacheElements() {
    this.elements = {
      // Navigation
      themeToggle: document.getElementById('themeToggle'),
      dataSimulator: document.getElementById('dataSimulator'),
      exportConfig: document.getElementById('exportConfig'),
      importConfig: document.getElementById('importConfig'),

      // Stats
      globalFPS: document.getElementById('globalFPS'),
      memoryUsage: document.getElementById('memoryUsage'),
      updateRate: document.getElementById('updateRate'),

      // Component containers
      processListDemo: document.getElementById('process-list-demo'),
      cpuMeterDemo: document.getElementById('cpu-meter-demo'),
      memoryMeterDemo: document.getElementById('memory-meter-demo'),
      threadMeterDemo: document.getElementById('thread-meter-demo'),
      errorLogDemo: document.getElementById('error-log-demo'),
      memoryMapDemo: document.getElementById('memory-map-demo'),

      // Unified dashboard
      unifiedProcessList: document.getElementById('unified-process-list'),
      unifiedResources: document.getElementById('unified-resources'),
      unifiedMemoryMap: document.getElementById('unified-memory-map'),
      unifiedErrorLog: document.getElementById('unified-error-log'),

      // Configuration
      configPanel: document.getElementById('configPanel'),
      configClose: document.getElementById('configClose'),
      configContent: document.getElementById('configContent'),

      // Examples
      exampleTabs: document.getElementById('exampleTabs'),
      exampleContent: document.getElementById('exampleContent'),

      // Loading
      loadingOverlay: document.getElementById('loadingOverlay'),

      // Scenario controls
      scenarioButtons: document.querySelectorAll('.scenario-btn'),

      // Component stats
      processCount: document.getElementById('processCount'),
      processRenderTime: document.getElementById('processRenderTime'),
      errorCount: document.getElementById('errorCount'),
      blockCount: document.getElementById('blockCount'),
      meterFPS: document.getElementById('meterFPS')
    };
  }

  /**
   * Initialize all components
   */
  async initializeComponents() {
    console.log('Initializing components...');

    // Initialize ProcessList components
    this.initializeProcessLists();

    // Initialize ResourceMeter components
    this.initializeResourceMeters();

    // Initialize ErrorLog components
    this.initializeErrorLogs();

    // Initialize MemoryMap components
    this.initializeMemoryMaps();

    console.log('All components initialized');
  }

  /**
   * Initialize ProcessList components
   */
  initializeProcessLists() {
    // Individual showcase ProcessList
    if (this.elements.processListDemo) {
      this.components.set('processListDemo', new ProcessList(this.elements.processListDemo, {
        showHealth: true,
        showWarnings: true,
        showResources: true,
        interactive: true,
        selectable: true,
        virtualScroll: true,
        rowHeight: 48,
        visibleRows: 8,
        theme: 'dark'
      }));
    }

    // Unified dashboard ProcessList
    if (this.elements.unifiedProcessList) {
      this.components.set('unifiedProcessList', new ProcessList(this.elements.unifiedProcessList, {
        showHealth: true,
        showWarnings: true,
        showResources: true,
        interactive: true,
        selectable: true,
        virtualScroll: true,
        rowHeight: 40,
        visibleRows: 12,
        theme: 'dark',
        compactMode: true
      }));
    }
  }

  /**
   * Initialize ResourceMeter components
   */
  initializeResourceMeters() {
    // Individual showcase meters
    if (this.elements.cpuMeterDemo) {
      this.components.set('cpuMeter', new ResourceMeter(this.elements.cpuMeterDemo, {
        type: 'circular',
        metric: 'cpu',
        size: { width: 120, height: 120 },
        animate: true,
        label: 'CPU',
        thresholds: { low: 30, medium: 70, high: 90 }
      }));
    }

    if (this.elements.memoryMeterDemo) {
      this.components.set('memoryMeter', new ResourceMeter(this.elements.memoryMeterDemo, {
        type: 'circular',
        metric: 'memory',
        size: { width: 120, height: 120 },
        animate: true,
        label: 'Memory',
        thresholds: { low: 40, medium: 75, high: 90 }
      }));
    }

    if (this.elements.threadMeterDemo) {
      this.components.set('threadMeter', new ResourceMeter(this.elements.threadMeterDemo, {
        type: 'circular',
        metric: 'threads',
        size: { width: 120, height: 120 },
        animate: true,
        label: 'Threads',
        max: 64,
        thresholds: { low: 20, medium: 40, high: 55 }
      }));
    }
  }

  /**
   * Initialize ErrorLog components
   */
  initializeErrorLogs() {
    // Individual showcase ErrorLog
    if (this.elements.errorLogDemo) {
      this.components.set('errorLogDemo', new ErrorLog(this.elements.errorLogDemo, {
        maxErrors: 50,
        autoDismiss: true,
        autoDismissDelay: 10000,
        groupSimilar: true,
        showTimestamp: true,
        showSeverity: true,
        theme: 'dark',
        virtualScroll: true
      }));
    }

    // Unified dashboard ErrorLog
    if (this.elements.unifiedErrorLog) {
      this.components.set('unifiedErrorLog', new ErrorLog(this.elements.unifiedErrorLog, {
        maxErrors: 20,
        autoDismiss: true,
        autoDismissDelay: 15000,
        groupSimilar: true,
        showTimestamp: true,
        showSeverity: true,
        theme: 'dark',
        compactMode: true,
        virtualScroll: true
      }));
    }
  }

  /**
   * Initialize MemoryMap components
   */
  initializeMemoryMaps() {
    // Individual showcase MemoryMap
    if (this.elements.memoryMapDemo) {
      this.components.set('memoryMapDemo', new MemoryMap(this.elements.memoryMapDemo, {
        gridSize: { width: 32, height: 16 },
        blockSize: 12,
        viewMode: 'type',
        enableZoom: true,
        enablePan: true,
        enableMinimap: false
      }));
    }

    // Unified dashboard MemoryMap
    if (this.elements.unifiedMemoryMap) {
      this.components.set('unifiedMemoryMap', new MemoryMap(this.elements.unifiedMemoryMap, {
        gridSize: { width: 48, height: 24 },
        blockSize: 8,
        viewMode: 'type',
        enableZoom: true,
        enablePan: true,
        enableMinimap: true
      }));
    }
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Theme toggle
    if (this.elements.themeToggle) {
      this.elements.themeToggle.addEventListener('click', () => this.toggleTheme());
    }

    // Data simulator toggle
    if (this.elements.dataSimulator) {
      this.elements.dataSimulator.addEventListener('click', () => this.toggleDataSimulation());
    }

    // Configuration export/import
    if (this.elements.exportConfig) {
      this.elements.exportConfig.addEventListener('click', () => this.exportConfiguration());
    }

    if (this.elements.importConfig) {
      this.elements.importConfig.addEventListener('click', () => this.importConfiguration());
    }

    // Configuration panel
    if (this.elements.configClose) {
      this.elements.configClose.addEventListener('click', () => this.closeConfigPanel());
    }

    // Configure buttons
    document.querySelectorAll('.configure-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const component = e.target.closest('[data-component]').dataset.component;
        this.openConfigPanel(component);
      });
    });

    // Stress test buttons
    document.querySelectorAll('.stress-test-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const component = e.target.closest('[data-component]').dataset.component;
        this.runStressTest(component);
      });
    });

    // Scenario buttons
    this.elements.scenarioButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const scenario = e.target.dataset.scenario;
        this.switchScenario(scenario);
      });
    });

    // Example tabs
    if (this.elements.exampleTabs) {
      this.elements.exampleTabs.addEventListener('click', (e) => {
        if (e.target.classList.contains('tab-btn')) {
          const example = e.target.dataset.example;
          this.showExample(example);
        }
      });
    }

    // Interactive features
    this.setupInteractiveFeatures();

    // Component cross-communication
    this.setupComponentCommunication();
  }

  /**
   * Setup interactive features and stress testing
   */
  setupInteractiveFeatures() {
    // Stress test buttons
    document.querySelectorAll('.stress-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const testType = e.target.dataset.test;
        this.runAdvancedStressTest(testType, e.target);
      });
    });

    // Demo buttons
    document.querySelectorAll('.demo-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const demoType = e.target.dataset.demo;
        this.runCommunicationDemo(demoType, e.target);
      });
    });

    // Benchmark buttons
    document.querySelectorAll('.benchmark-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const benchmarkType = e.target.dataset.benchmark;
        this.runPerformanceBenchmark(benchmarkType, e.target);
      });
    });

    // Real-time controls
    this.setupRealtimeControls();
  }

  /**
   * Setup real-time control sliders
   */
  setupRealtimeControls() {
    const updateFrequency = document.getElementById('updateFrequency');
    const dataVolume = document.getElementById('dataVolume');
    const errorRate = document.getElementById('errorRate');
    const applyBtn = document.getElementById('applyRealtimeSettings');

    // Update range value displays
    [updateFrequency, dataVolume, errorRate].forEach(slider => {
      if (slider) {
        const updateDisplay = () => {
          const valueSpan = slider.parentElement.querySelector('.range-value');
          if (valueSpan) {
            let value = slider.value;
            let unit = '';

            if (slider.id === 'updateFrequency') {
              unit = 'ms';
            } else if (slider.id === 'dataVolume') {
              unit = 'x';
            } else if (slider.id === 'errorRate') {
              unit = '%';
            }

            valueSpan.textContent = value + unit;
          }
        };

        slider.addEventListener('input', updateDisplay);
        updateDisplay(); // Initial update
      }
    });

    // Apply settings button
    if (applyBtn) {
      applyBtn.addEventListener('click', () => {
        this.applyRealtimeSettings();
      });
    }
  }

  /**
   * Apply real-time settings to data simulator
   */
  applyRealtimeSettings() {
    const updateFrequency = document.getElementById('updateFrequency')?.value || 1000;
    const dataVolume = document.getElementById('dataVolume')?.value || 10;
    const errorRate = document.getElementById('errorRate')?.value || 10;

    // Update data simulator settings
    if (this.dataSimulator) {
      this.dataSimulator.updateFrequency = parseInt(updateFrequency);
      this.dataSimulator.dataVolumeMultiplier = parseInt(dataVolume);
      this.dataSimulator.errorRateMultiplier = parseInt(errorRate) / 10;

      // Generate new data with updated settings and update components
      this.dataSimulator.generateData();
      const newData = this.dataSimulator.getCurrentData();
      this.updateComponentsWithData(newData);
      this.updateStats(newData);
      this.updatePerformanceDisplay();

      console.log('Applied real-time settings:', {
        updateFrequency: updateFrequency + 'ms',
        dataVolume: dataVolume + 'x',
        errorRate: errorRate + '%'
      });
    }
  }

  /**
   * Run advanced stress tests
   */
  runAdvancedStressTest(testType, button) {
    button.classList.add('running');

    const tests = {
      'process-flood': () => this.stressTestProcessFlood(),
      'error-storm': () => this.stressTestErrorStorm(),
      'memory-fragmentation': () => this.stressTestMemoryFragmentation(),
      'resource-spike': () => this.stressTestResourceSpike(),
      'rapid-updates': () => this.stressTestRapidUpdates()
    };

    const test = tests[testType];
    if (test) {
      console.log(`Starting stress test: ${testType}`);
      test().then(() => {
        button.classList.remove('running');
        console.log(`Completed stress test: ${testType}`);
      }).catch(error => {
        button.classList.remove('running');
        console.error(`Stress test failed: ${testType}`, error);
      });
    }
  }

  /**
   * Stress test: Process flood
   */
  async stressTestProcessFlood() {
    const processes = [];
    for (let i = 0; i < 1000; i++) {
      processes.push({
        pid: 10000 + i,
        name: `StressTest_${i}.exe`,
        status: Math.random() < 0.1 ? 'error' : 'running',
        cpu: Math.random() * 100,
        memory: Math.random() * 1024,
        threads: Math.floor(Math.random() * 8) + 1,
        startTime: Date.now() - Math.random() * 300000
      });
    }

    const startTime = performance.now();

    // Update ProcessList components
    ['processListDemo', 'unifiedProcessList'].forEach(name => {
      const component = this.components.get(name);
      if (component && component.update) {
        component.update(processes);
      }
    });

    const endTime = performance.now();
    console.log(`Process flood test: ${processes.length} processes rendered in ${(endTime - startTime).toFixed(2)}ms`);

    // Reset after 5 seconds
    setTimeout(() => {
      this.dataSimulator.generateData();
    }, 5000);
  }

  /**
   * Stress test: Error storm
   */
  async stressTestErrorStorm() {
    const errorTypes = ['memory_leak', 'stack_overflow', 'null_reference', 'timeout', 'access_violation'];
    const severities = ['critical', 'error', 'warning', 'info'];

    let errorCount = 0;
    const interval = setInterval(() => {
      for (let i = 0; i < 10; i++) {
        const error = {
          id: Date.now() + i,
          type: errorTypes[Math.floor(Math.random() * errorTypes.length)],
          severity: severities[Math.floor(Math.random() * severities.length)],
          message: `Stress test error ${errorCount++}`,
          timestamp: Date.now(),
          details: { stressTest: true }
        };

        ['errorLogDemo', 'unifiedErrorLog'].forEach(name => {
          const component = this.components.get(name);
          if (component && component.addError) {
            component.addError(error);
          }
        });
      }
    }, 100);

    // Stop after 5 seconds
    setTimeout(() => {
      clearInterval(interval);
      console.log(`Error storm test completed: ${errorCount} errors generated`);
      // Update performance display after stress test
      this.updatePerformanceDisplay();
    }, 5000);
  }

  /**
   * Stress test: Memory fragmentation
   */
  async stressTestMemoryFragmentation() {
    const blocks = [];
    for (let i = 0; i < 2000; i++) {
      blocks.push({
        id: i,
        address: 0x1000 + (i * 32),
        size: Math.random() < 0.7 ? Math.floor(Math.random() * 16) + 8 : Math.floor(Math.random() * 64) + 32,
        type: ['emotion', 'trauma', 'relationship', 'system'][Math.floor(Math.random() * 4)],
        allocated: Math.random() < 0.8,
        fragmented: Math.random() < 0.6,
        lastAccess: Date.now() - Math.random() * 3600000
      });
    }

    ['memoryMapDemo', 'unifiedMemoryMap'].forEach(name => {
      const component = this.components.get(name);
      if (component && component.updateMemoryBlocks) {
        component.updateMemoryBlocks(blocks);
      }
    });

    console.log(`Memory fragmentation test: ${blocks.length} blocks with high fragmentation`);

    // Reset after 5 seconds
    setTimeout(() => {
      this.dataSimulator.generateData();
    }, 5000);
  }

  /**
   * Stress test: Resource spike
   */
  async stressTestResourceSpike() {
    const spikes = [
      { metric: 'cpu', values: [95, 98, 100, 97, 92, 85, 70, 50, 30] },
      { metric: 'memory', values: [85, 90, 95, 98, 100, 95, 80, 60, 40] },
      { metric: 'threads', values: [50, 55, 60, 58, 45, 35, 25, 15, 8] }
    ];

    let index = 0;
    const interval = setInterval(() => {
      spikes.forEach(spike => {
        const value = spike.values[index] || spike.values[spike.values.length - 1];

        const meterNames = {
          'cpu': ['cpuMeter', 'unifiedCpuMeter'],
          'memory': ['memoryMeter', 'unifiedMemoryMeter'],
          'threads': ['threadMeter', 'unifiedThreadMeter']
        };

        meterNames[spike.metric]?.forEach(name => {
          const component = this.components.get(name);
          if (component && component.update) {
            component.update(value);
          }
        });
      });

      index++;
      if (index >= 9) {
        clearInterval(interval);
        console.log('Resource spike test completed');
        // Update performance display after stress test
        this.updatePerformanceDisplay();
      }
    }, 500);
  }

  /**
   * Stress test: Rapid updates
   */
  async stressTestRapidUpdates() {
    let updateCount = 0;
    const startTime = performance.now();

    const interval = setInterval(() => {
      // Generate small data updates
      const processes = [];
      for (let i = 0; i < 50; i++) {
        processes.push({
          pid: 2000 + i,
          name: `RapidUpdate_${i}.exe`,
          status: 'running',
          cpu: Math.random() * 100,
          memory: Math.random() * 512,
          threads: Math.floor(Math.random() * 4) + 1
        });
      }

      ['processListDemo', 'unifiedProcessList'].forEach(name => {
        const component = this.components.get(name);
        if (component && component.update) {
          component.update(processes);
        }
      });

      updateCount++;
    }, 16); // ~60fps

    // Stop after 3 seconds
    setTimeout(() => {
      clearInterval(interval);
      const endTime = performance.now();
      const avgFPS = (updateCount / ((endTime - startTime) / 1000)).toFixed(1);
      console.log(`Rapid updates test: ${updateCount} updates in ${((endTime - startTime) / 1000).toFixed(1)}s (${avgFPS} FPS)`);
      // Update performance display after stress test
      this.updatePerformanceDisplay();
    }, 3000);
  }

  /**
   * Run communication demonstrations
   */
  runCommunicationDemo(demoType, button) {
    // Remove active class from all demo buttons
    document.querySelectorAll('.demo-btn').forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');

    const demos = {
      'process-memory-link': () => this.demoProcessMemoryLink(),
      'error-process-trace': () => this.demoErrorProcessTrace(),
      'resource-error-cascade': () => this.demoResourceErrorCascade(),
      'memory-process-highlight': () => this.demoMemoryProcessHighlight()
    };

    const demo = demos[demoType];
    if (demo) {
      console.log(`Running communication demo: ${demoType}`);
      demo();

      // Remove active class after demo
      setTimeout(() => {
        button.classList.remove('active');
      }, 3000);
    }
  }

  /**
   * Demo: Process to Memory link
   */
  demoProcessMemoryLink() {
    // Trigger process selection event
    this.showCommunicationIndicator('process-to-memory');
    this.highlightPanel('memory-panel', 3000);

    console.log('Demo: Process selected (PID: 1337), highlighting related memory blocks');
  }

  /**
   * Demo: Error to Process trace
   */
  demoErrorProcessTrace() {
    // Trigger error to process communication
    this.showCommunicationIndicator('error-to-process');
    this.highlightPanel('processes-panel', 3000);

    console.log('Demo: Error clicked (Process: 1337), highlighting related process');
  }

  /**
   * Demo: Resource to Error cascade
   */
  demoResourceErrorCascade() {
    // Simulate resource threshold exceeded
    this.showCommunicationIndicator('resource-to-error');
    this.highlightPanel('errors-panel', 3000);

    // Add a demo error
    ['errorLogDemo', 'unifiedErrorLog'].forEach(name => {
      const component = this.components.get(name);
      if (component && component.addError) {
        component.addError({
          id: Date.now(),
          type: 'resource_warning',
          severity: 'warning',
          message: 'Demo: CPU usage exceeded threshold (95%)',
          timestamp: Date.now(),
          details: { metric: 'cpu', value: 95 }
        });
      }
    });

    console.log('Demo: Resource threshold exceeded, generating error');
  }

  /**
   * Demo: Memory to Process highlight
   */
  demoMemoryProcessHighlight() {
    // Simulate clicking a memory block
    this.showCommunicationIndicator('memory-to-process');
    this.highlightPanel('processes-panel', 3000);

    console.log('Demo: Memory block clicked, highlighting owning process');
  }

  /**
   * Run performance benchmarks
   */
  runPerformanceBenchmark(benchmarkType, button) {
    button.classList.add('running');

    const benchmarks = {
      'render-speed': () => this.benchmarkRenderSpeed(),
      'memory-efficiency': () => this.benchmarkMemoryEfficiency(),
      'update-throughput': () => this.benchmarkUpdateThroughput(),
      'animation-smoothness': () => this.benchmarkAnimationSmoothness()
    };

    const benchmark = benchmarks[benchmarkType];
    if (benchmark) {
      console.log(`Running benchmark: ${benchmarkType}`);
      benchmark().then(results => {
        button.classList.remove('running');
        this.displayBenchmarkResults(benchmarkType, results);
      }).catch(error => {
        button.classList.remove('running');
        console.error(`Benchmark failed: ${benchmarkType}`, error);
      });
    }
  }

  /**
   * Benchmark: Render speed
   */
  async benchmarkRenderSpeed() {
    const results = {};
    const testSizes = [10, 50, 100, 500, 1000];

    for (const size of testSizes) {
      const processes = [];
      for (let i = 0; i < size; i++) {
        processes.push({
          pid: 3000 + i,
          name: `Benchmark_${i}.exe`,
          status: 'running',
          cpu: Math.random() * 100,
          memory: Math.random() * 1024,
          threads: Math.floor(Math.random() * 8) + 1
        });
      }

      const startTime = performance.now();

      const component = this.components.get('processListDemo');
      if (component && component.update) {
        component.update(processes);
      }

      const endTime = performance.now();
      results[`${size}_processes`] = (endTime - startTime).toFixed(2) + 'ms';
    }

    return results;
  }

  /**
   * Benchmark: Memory efficiency
   */
  async benchmarkMemoryEfficiency() {
    const results = {};

    if (performance.memory) {
      const initialMemory = performance.memory.usedJSHeapSize;

      // Create large dataset
      const largeDataset = [];
      for (let i = 0; i < 10000; i++) {
        largeDataset.push({
          id: i,
          data: new Array(100).fill(Math.random())
        });
      }

      const afterCreation = performance.memory.usedJSHeapSize;
      results.memory_increase = ((afterCreation - initialMemory) / 1024 / 1024).toFixed(2) + 'MB';

      // Clean up
      largeDataset.length = 0;

      // Force garbage collection if available
      if (window.gc) {
        window.gc();
      }

      setTimeout(() => {
        const afterCleanup = performance.memory.usedJSHeapSize;
        results.memory_recovered = ((afterCreation - afterCleanup) / 1024 / 1024).toFixed(2) + 'MB';
      }, 1000);
    } else {
      results.error = 'Memory API not available';
    }

    return results;
  }

  /**
   * Benchmark: Update throughput
   */
  async benchmarkUpdateThroughput() {
    const results = {};
    let updateCount = 0;
    const startTime = performance.now();

    return new Promise(resolve => {
      const interval = setInterval(() => {
        // Simulate component updates
        const data = {
          processes: Array(20).fill().map((_, i) => ({
            pid: 4000 + i,
            name: `Throughput_${i}.exe`,
            cpu: Math.random() * 100
          })),
          resources: {
            cpu: { percentage: Math.random() * 100 },
            memory: { percentage: Math.random() * 100 }
          }
        };

        this.updateComponentsWithData(data);
        updateCount++;

        if (updateCount >= 100) {
          clearInterval(interval);
          const endTime = performance.now();
          const duration = (endTime - startTime) / 1000;

          results.updates_per_second = (updateCount / duration).toFixed(1);
          results.total_updates = updateCount;
          results.duration = duration.toFixed(2) + 's';

          // Update performance display after stress test
          this.updatePerformanceDisplay();
          resolve(results);
        }
      }, 10);
    });
  }

  /**
   * Benchmark: Animation smoothness
   */
  async benchmarkAnimationSmoothness() {
    const results = {};
    const frameTimings = [];
    let frameCount = 0;
    let lastFrameTime = performance.now();

    return new Promise(resolve => {
      const measureFrame = () => {
        const currentTime = performance.now();
        const frameDelta = currentTime - lastFrameTime;
        frameTimings.push(frameDelta);
        lastFrameTime = currentTime;
        frameCount++;

        // Update meters with animated values
        const value = (Math.sin(frameCount * 0.1) + 1) * 50;
        ['cpuMeter', 'memoryMeter'].forEach(name => {
          const component = this.components.get(name);
          if (component && component.update) {
            component.update(value);
          }
        });

        if (frameCount < 180) { // 3 seconds at 60fps
          requestAnimationFrame(measureFrame);
        } else {
          // Calculate results
          const avgFrameTime = frameTimings.reduce((a, b) => a + b, 0) / frameTimings.length;
          const avgFPS = 1000 / avgFrameTime;
          const minFrameTime = Math.min(...frameTimings);
          const maxFrameTime = Math.max(...frameTimings);

          results.average_fps = avgFPS.toFixed(1);
          results.min_frame_time = minFrameTime.toFixed(2) + 'ms';
          results.max_frame_time = maxFrameTime.toFixed(2) + 'ms';
          results.frame_consistency = (1 - (maxFrameTime - minFrameTime) / avgFrameTime).toFixed(3);

          resolve(results);
        }
      };

      requestAnimationFrame(measureFrame);
    });
  }

  /**
   * Display benchmark results
   */
  displayBenchmarkResults(benchmarkType, results) {
    const container = document.getElementById('benchmarkResults');
    if (!container) return;

    // Clear previous results
    container.innerHTML = `<h5>Results: ${benchmarkType}</h5>`;

    for (const [key, value] of Object.entries(results)) {
      const resultElement = document.createElement('div');
      resultElement.className = 'benchmark-result';

      const nameElement = document.createElement('span');
      nameElement.className = 'benchmark-name';
      nameElement.textContent = key.replace(/_/g, ' ');

      const valueElement = document.createElement('span');
      valueElement.className = 'benchmark-value';
      valueElement.textContent = value;

      // Color code based on performance
      if (key.includes('fps') && parseFloat(value) >= 55) {
        valueElement.classList.add('excellent');
      } else if (key.includes('time') && parseFloat(value) < 16) {
        valueElement.classList.add('excellent');
      } else if (key.includes('consistency') && parseFloat(value) > 0.8) {
        valueElement.classList.add('excellent');
      } else {
        valueElement.classList.add('good');
      }

      resultElement.appendChild(nameElement);
      resultElement.appendChild(valueElement);
      container.appendChild(resultElement);
    }

    console.log(`Benchmark results for ${benchmarkType}:`, results);
  }

  /**
   * Setup component cross-communication
   */
  setupComponentCommunication() {
    // ProcessList → MemoryMap integration
    const processLists = ['processListDemo', 'unifiedProcessList'];
    const memoryMaps = ['memoryMapDemo', 'unifiedMemoryMap'];

    processLists.forEach(plName => {
      const processList = this.components.get(plName);
      if (processList) {
        processList.on('process-selected', (process) => {
          // Visual feedback for communication
          this.showCommunicationIndicator('process-to-memory');

          memoryMaps.forEach(mmName => {
            const memoryMap = this.components.get(mmName);
            if (memoryMap && memoryMap.highlightBlocksByProcess) {
              memoryMap.clearHighlights();
              memoryMap.highlightBlocksByProcess(process.pid);

              // Highlight the memory panel
              this.highlightPanel('memory-panel', 2000);
            }
          });

          console.log(`Process selected: ${process.name} (PID: ${process.pid})`);
        });

        processList.on('process-hover', (process) => {
          // Show process details in a subtle way
          this.showProcessPreview(process);
        });
      }
    });

    // ErrorLog → ProcessList integration
    const errorLogs = ['errorLogDemo', 'unifiedErrorLog'];

    errorLogs.forEach(elName => {
      const errorLog = this.components.get(elName);
      if (errorLog) {
        errorLog.on('error-clicked', (error) => {
          if (error.details && error.details.processId) {
            // Visual feedback for communication
            this.showCommunicationIndicator('error-to-process');

            processLists.forEach(plName => {
              const processList = this.components.get(plName);
              if (processList && processList.highlightProcess) {
                processList.highlightProcess(error.details.processId);

                // Highlight the process panel
                this.highlightPanel('processes-panel', 2000);
              }
            });

            console.log(`Error clicked: ${error.message} (Process: ${error.details.processId})`);
          }
        });
      }
    });

    // ResourceMeter threshold → ErrorLog
    const resourceMeters = ['cpuMeter', 'memoryMeter', 'threadMeter'];

    resourceMeters.forEach(rmName => {
      const meter = this.components.get(rmName);
      if (meter) {
        meter.on('threshold-exceeded', (data) => {
          // Throttle error creation to prevent loops
          const now = Date.now();
          const lastError = this._lastThresholdErrors.get(data.metric) || 0;

          if (now - lastError < this._thresholdErrorCooldown) {
            return; // Skip if too recent
          }

          this._lastThresholdErrors.set(data.metric, now);

          // Visual feedback for communication
          this.showCommunicationIndicator('resource-to-error');

          errorLogs.forEach(elName => {
            const errorLog = this.components.get(elName);
            if (errorLog && errorLog.addError) {
              errorLog.addError({
                severity: 'warning',
                type: 'resource_warning',
                message: `${data.metric} usage critical: ${data.value.toFixed(1)}%`,
                timestamp: Date.now(),
                details: { metric: data.metric, value: data.value }
              });

              // Highlight the error panel
              this.highlightPanel('errors-panel', 2000);
            }
          });

          console.log(`Resource threshold exceeded: ${data.metric} at ${data.value.toFixed(1)}%`);
        });

        meter.on('value-changed', (value) => {
          // Update related displays
          this.updateResourceRelatedDisplays(rmName, value);
        });
      }
    });

    // MemoryMap → ProcessList integration (reverse)
    memoryMaps.forEach(mmName => {
      const memoryMap = this.components.get(mmName);
      if (memoryMap) {
        memoryMap.on('block-clicked', (block) => {
          if (block.processId) {
            processLists.forEach(plName => {
              const processList = this.components.get(plName);
              if (processList && processList.highlightProcess) {
                processList.highlightProcess(block.processId);
                this.highlightPanel('processes-panel', 2000);
              }
            });

            console.log(`Memory block clicked: ${block.type} (Process: ${block.processId})`);
          }
        });
      }
    });
  }

  /**
   * Show visual communication indicator
   */
  showCommunicationIndicator(type) {
    // Add communication indicators to panels
    const indicators = document.querySelectorAll('.communication-indicator');
    indicators.forEach(indicator => {
      indicator.classList.add('active');
      setTimeout(() => {
        indicator.classList.remove('active');
      }, 1000);
    });

    // Show data flow animation based on type
    this.showDataFlow(type);
  }

  /**
   * Show data flow animation between components
   */
  showDataFlow(type) {
    const flowMap = {
      'process-to-memory': { from: '.processes-panel', to: '.memory-panel' },
      'error-to-process': { from: '.errors-panel', to: '.processes-panel' },
      'resource-to-error': { from: '.resources-panel', to: '.errors-panel' }
    };

    const flow = flowMap[type];
    if (!flow) return;

    const fromElement = document.querySelector(flow.from);
    const toElement = document.querySelector(flow.to);

    if (fromElement && toElement) {
      // Create temporary flow line
      const line = document.createElement('div');
      line.className = 'data-flow-line active';

      // Position the line between elements
      const fromRect = fromElement.getBoundingClientRect();
      const toRect = toElement.getBoundingClientRect();

      const startX = fromRect.right;
      const startY = fromRect.top + fromRect.height / 2;
      const endX = toRect.left;

      line.style.left = `${startX}px`;
      line.style.top = `${startY}px`;
      line.style.width = `${endX - startX}px`;
      line.style.transformOrigin = 'left center';

      document.body.appendChild(line);

      // Remove after animation
      setTimeout(() => {
        document.body.removeChild(line);
      }, 1000);
    }
  }

  /**
   * Highlight a panel temporarily
   */
  highlightPanel(panelClass, duration = 2000) {
    const panel = document.querySelector(`.${panelClass}`);
    if (panel) {
      panel.classList.add('highlight-connection');
      setTimeout(() => {
        panel.classList.remove('highlight-connection');
      }, duration);
    }
  }

  /**
   * Show process preview on hover
   */
  showProcessPreview(process) {
    // Could show a tooltip or update a preview panel
    console.log(`Process hover: ${process.name} - CPU: ${process.cpu}%, Memory: ${process.memory}MB`);
  }

  /**
   * Update displays related to resource changes
   */
  updateResourceRelatedDisplays(meterName, value) {
    // Update any displays that should react to resource changes
    const metricMap = {
      'cpuMeter': 'CPU',
      'memoryMeter': 'Memory',
      'threadMeter': 'Threads'
    };

    const metricName = metricMap[meterName];
    if (metricName) {
      // Could update status displays, trigger warnings, etc.
      if (value > 90) {
        console.log(`High ${metricName} usage detected: ${value.toFixed(1)}%`);
      }
    }
  }

  /**
   * Setup data simulation
   */
  setupDataSimulation() {
    // Listen for simulator data
    window.addEventListener('simulatorData', (event) => {
      this.updateComponentsWithData(event.detail);
      this.updateStats(event.detail);
      this.performanceMonitor.recordUpdate();
    });

    // Generate initial static data instead of starting continuous simulation
    // This follows the Ground State Principle - no automatic background processes
    this.dataSimulator.generateData();
    const staticData = this.dataSimulator.getCurrentData();
    this.updateComponentsWithData(staticData);
    this.updateStats(staticData);

    console.log('ComponentShowcase: Using static data (no automatic updates)');
  }

  /**
   * Update all components with new data
   */
  updateComponentsWithData(data) {
    // Transform raw process data to UI format using ConsciousnessTransformer
    const transformedProcesses = data.processes ?
      data.processes.map(process => this.consciousnessTransformer.formatProcessForUI(process)) :
      [];

    // Update ProcessLists
    ['processListDemo', 'unifiedProcessList'].forEach(name => {
      const component = this.components.get(name);
      if (component && component.update) {
        const startTime = performance.now();
        component.update(transformedProcesses);
        const renderTime = performance.now() - startTime;
        this.performanceMonitor.recordRenderTime(name, renderTime);
      }
    });

    // Update ResourceMeters
    if (data.resources) {
      const meters = [
        { name: 'cpuMeter', value: data.resources.cpu.percentage },
        { name: 'memoryMeter', value: data.resources.memory.percentage },
        { name: 'threadMeter', value: data.resources.threads.used },
        { name: 'unifiedCpuMeter', value: data.resources.cpu.percentage },
        { name: 'unifiedMemoryMeter', value: data.resources.memory.percentage },
        { name: 'unifiedThreadMeter', value: data.resources.threads.used }
      ];

      meters.forEach(({ name, value }) => {
        const component = this.components.get(name);
        if (component && component.update) {
          component.update(value);
        }
      });
    }

    // Update ErrorLogs
    if (data.errors && data.errors.length > 0) {
      ['errorLogDemo', 'unifiedErrorLog'].forEach(name => {
        const component = this.components.get(name);
        if (component && component.addError) {
          data.errors.forEach(error => {
            component.addError(error);
          });
        }
      });
    }

    // Update MemoryMaps
    if (data.memoryBlocks) {
      ['memoryMapDemo', 'unifiedMemoryMap'].forEach(name => {
        const component = this.components.get(name);
        if (component && component.updateMemoryBlocks) {
          component.updateMemoryBlocks(data.memoryBlocks);
        }
      });
    }
  }

  /**
   * Update statistics display
   */
  updateStats(data) {
    if (this.elements.processCount) {
      this.elements.processCount.textContent = data.processes.length;
    }

    if (this.elements.errorCount) {
      this.elements.errorCount.textContent = data.errors.length;
    }

    if (this.elements.blockCount) {
      this.elements.blockCount.textContent = data.memoryBlocks.length;
    }

    // Update fragmentation percentage
    if (this.elements.fragmentation && data.memoryBlocks) {
      const fragmentedBlocks = data.memoryBlocks.filter(block => block.fragmented).length;
      const fragmentation = ((fragmentedBlocks / data.memoryBlocks.length) * 100).toFixed(1);
      document.getElementById('fragmentation').textContent = `${fragmentation}%`;
    }
  }

  /**
   * Setup performance display updates
   * Following Ground State Principle - no automatic background processes
   */
  setupPerformanceDisplay() {
    // Perform initial update only
    this.updatePerformanceDisplay();

    // Setup performance dashboard controls
    this.setupPerformanceDashboardControls();
  }

  /**
   * Manually update performance display
   * Called only when needed (user actions, stress tests, etc.)
   */
  updatePerformanceDisplay() {
    // Update performance monitor metrics first
    this.performanceMonitor.updateMemoryUsage();
    this.performanceMonitor.updateRate();

    const metrics = this.performanceMonitor.getMetrics();

    // Update basic stats
    if (this.elements.globalFPS) {
      this.elements.globalFPS.textContent = metrics.fps;
    }

    if (this.elements.memoryUsage) {
      this.elements.memoryUsage.textContent = `${metrics.memoryUsage}MB`;
    }

    if (this.elements.updateRate) {
      this.elements.updateRate.textContent = metrics.updateRate;
    }

    if (this.elements.meterFPS) {
      this.elements.meterFPS.textContent = metrics.fps;
    }

    // Update render times
    if (this.elements.processRenderTime) {
      const renderTime = metrics.renderTimes.get('processListDemo') || 0;
      this.elements.processRenderTime.textContent = `${renderTime.toFixed(1)}ms`;
    }

    // Update performance dashboard
    this.updatePerformanceDashboard(metrics);
  }

  /**
   * Update performance dashboard with detailed metrics
   */
  updatePerformanceDashboard(metrics) {
    // Update FPS
    const fpsElement = document.getElementById('performanceFPS');
    const fpsBar = document.getElementById('fpsBar');
    const fpsStatus = document.getElementById('fpsStatus');

    if (fpsElement) {
      fpsElement.textContent = metrics.fps;

      if (fpsBar) {
        const fpsPercent = Math.min(100, (metrics.fps / 60) * 100);
        fpsBar.style.width = `${fpsPercent}%`;

        // Update color based on performance
        if (metrics.fps >= 55) {
          fpsBar.style.background = 'linear-gradient(90deg, var(--cyber-green), var(--cyber-cyan))';
        } else if (metrics.fps >= 30) {
          fpsBar.style.background = 'linear-gradient(90deg, var(--cyber-amber), var(--cyber-cyan))';
        } else {
          fpsBar.style.background = 'linear-gradient(90deg, var(--cyber-red), var(--cyber-amber))';
        }
      }

      if (fpsStatus) {
        if (metrics.fps >= 55) {
          fpsStatus.textContent = 'Excellent';
          fpsStatus.className = 'metric-status excellent';
        } else if (metrics.fps >= 30) {
          fpsStatus.textContent = 'Good';
          fpsStatus.className = 'metric-status good';
        } else if (metrics.fps >= 15) {
          fpsStatus.textContent = 'Poor';
          fpsStatus.className = 'metric-status warning';
        } else {
          fpsStatus.textContent = 'Critical';
          fpsStatus.className = 'metric-status critical';
        }
      }
    }

    // Update Memory
    const memoryElement = document.getElementById('performanceMemory');
    const memoryBar = document.getElementById('memoryBar');
    const memoryStatus = document.getElementById('memoryStatus');

    if (memoryElement) {
      memoryElement.textContent = metrics.memoryUsage;

      if (memoryBar) {
        const memoryPercent = Math.min(100, (metrics.memoryUsage / 100) * 100); // Assume 100MB as max
        memoryBar.style.width = `${memoryPercent}%`;

        if (metrics.memoryUsage < 50) {
          memoryBar.style.background = 'linear-gradient(90deg, var(--cyber-green), var(--cyber-cyan))';
        } else if (metrics.memoryUsage < 80) {
          memoryBar.style.background = 'linear-gradient(90deg, var(--cyber-amber), var(--cyber-cyan))';
        } else {
          memoryBar.style.background = 'linear-gradient(90deg, var(--cyber-red), var(--cyber-amber))';
        }
      }

      if (memoryStatus) {
        if (metrics.memoryUsage < 50) {
          memoryStatus.textContent = 'Normal';
          memoryStatus.className = 'metric-status excellent';
        } else if (metrics.memoryUsage < 80) {
          memoryStatus.textContent = 'Elevated';
          memoryStatus.className = 'metric-status warning';
        } else {
          memoryStatus.textContent = 'High';
          memoryStatus.className = 'metric-status critical';
        }
      }
    }

    // Update Update Rate
    const updatesElement = document.getElementById('performanceUpdates');
    const updatesBar = document.getElementById('updatesBar');
    const updatesStatus = document.getElementById('updatesStatus');

    if (updatesElement) {
      updatesElement.textContent = metrics.updateRate;

      if (updatesBar) {
        const updatesPercent = Math.min(100, (metrics.updateRate / 10) * 100); // Assume 10/sec as max
        updatesBar.style.width = `${updatesPercent}%`;
      }

      if (updatesStatus) {
        if (metrics.updateRate === 0) {
          updatesStatus.textContent = 'Idle';
          updatesStatus.className = 'metric-status';
        } else if (metrics.updateRate < 5) {
          updatesStatus.textContent = 'Active';
          updatesStatus.className = 'metric-status good';
        } else {
          updatesStatus.textContent = 'Busy';
          updatesStatus.className = 'metric-status warning';
        }
      }
    }

    // Update Render Time
    const renderTimeElement = document.getElementById('performanceRenderTime');
    const renderTimeBar = document.getElementById('renderTimeBar');
    const renderTimeStatus = document.getElementById('renderTimeStatus');

    if (renderTimeElement) {
      const avgRenderTime = this.calculateAverageRenderTime(metrics.renderTimes);
      renderTimeElement.textContent = avgRenderTime.toFixed(1);

      if (renderTimeBar) {
        const renderTimePercent = Math.min(100, (avgRenderTime / 16) * 100); // 16ms = 60fps
        renderTimeBar.style.width = `${renderTimePercent}%`;

        if (avgRenderTime < 8) {
          renderTimeBar.style.background = 'linear-gradient(90deg, var(--cyber-green), var(--cyber-cyan))';
        } else if (avgRenderTime < 16) {
          renderTimeBar.style.background = 'linear-gradient(90deg, var(--cyber-amber), var(--cyber-cyan))';
        } else {
          renderTimeBar.style.background = 'linear-gradient(90deg, var(--cyber-red), var(--cyber-amber))';
        }
      }

      if (renderTimeStatus) {
        if (avgRenderTime < 8) {
          renderTimeStatus.textContent = 'Fast';
          renderTimeStatus.className = 'metric-status excellent';
        } else if (avgRenderTime < 16) {
          renderTimeStatus.textContent = 'Good';
          renderTimeStatus.className = 'metric-status good';
        } else {
          renderTimeStatus.textContent = 'Slow';
          renderTimeStatus.className = 'metric-status warning';
        }
      }
    }

    // Update component metrics
    this.updateComponentMetrics(metrics.renderTimes);
  }

  /**
   * Calculate average render time across all components
   */
  calculateAverageRenderTime(renderTimes) {
    if (renderTimes.size === 0) return 0;

    let total = 0;
    for (const time of renderTimes.values()) {
      total += time;
    }

    return total / renderTimes.size;
  }

  /**
   * Update component-specific metrics display
   */
  updateComponentMetrics(renderTimes) {
    const container = document.getElementById('componentMetrics');
    if (!container) return;

    container.innerHTML = '';

    for (const [componentName, renderTime] of renderTimes.entries()) {
      const metricElement = document.createElement('div');
      metricElement.className = 'component-metric';

      const nameElement = document.createElement('span');
      nameElement.className = 'component-name';
      nameElement.textContent = this.formatComponentName(componentName);

      const timeElement = document.createElement('span');
      timeElement.className = 'component-time';
      timeElement.textContent = `${renderTime.toFixed(1)}ms`;

      // Color code based on performance
      if (renderTime < 8) {
        timeElement.style.color = 'var(--cyber-green)';
      } else if (renderTime < 16) {
        timeElement.style.color = 'var(--cyber-amber)';
      } else {
        timeElement.style.color = 'var(--cyber-red)';
      }

      metricElement.appendChild(nameElement);
      metricElement.appendChild(timeElement);
      container.appendChild(metricElement);
    }
  }

  /**
   * Format component name for display
   */
  formatComponentName(componentName) {
    const nameMap = {
      'processListDemo': 'ProcessList (Demo)',
      'unifiedProcessList': 'ProcessList (Unified)',
      'cpuMeter': 'CPU Meter',
      'memoryMeter': 'Memory Meter',
      'threadMeter': 'Thread Meter',
      'errorLogDemo': 'ErrorLog (Demo)',
      'unifiedErrorLog': 'ErrorLog (Unified)',
      'memoryMapDemo': 'MemoryMap (Demo)',
      'unifiedMemoryMap': 'MemoryMap (Unified)'
    };

    return nameMap[componentName] || componentName;
  }

  /**
   * Setup performance dashboard controls
   */
  setupPerformanceDashboardControls() {
    const resetBtn = document.getElementById('resetMetrics');
    const exportBtn = document.getElementById('exportMetrics');
    const profilingBtn = document.getElementById('toggleProfiling');

    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        this.performanceMonitor.reset();
        console.log('Performance metrics reset');
      });
    }

    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        this.exportPerformanceMetrics();
      });
    }

    if (profilingBtn) {
      profilingBtn.addEventListener('click', () => {
        this.toggleProfiling(profilingBtn);
      });
    }
  }

  /**
   * Export performance metrics
   */
  exportPerformanceMetrics() {
    const metrics = this.performanceMonitor.getMetrics();
    const exportData = {
      timestamp: new Date().toISOString(),
      fps: metrics.fps,
      memoryUsage: metrics.memoryUsage,
      updateRate: metrics.updateRate,
      renderTimes: Object.fromEntries(metrics.renderTimes),
      averageRenderTime: this.calculateAverageRenderTime(metrics.renderTimes)
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-metrics-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log('Performance metrics exported');
  }

  /**
   * Toggle performance profiling
   */
  toggleProfiling(button) {
    const isActive = button.classList.contains('active');

    if (isActive) {
      button.textContent = 'Start Profiling';
      button.classList.remove('active');
      this.performanceMonitor.stopProfiling();
    } else {
      button.textContent = 'Stop Profiling';
      button.classList.add('active');
      this.performanceMonitor.startProfiling();
    }
  }

  /**
   * Toggle theme between dark and light
   */
  toggleTheme() {
    this.currentTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
    document.body.setAttribute('data-theme', this.currentTheme);

    // Update theme icon
    const icon = this.elements.themeToggle.querySelector('.theme-icon');
    if (icon) {
      icon.textContent = this.currentTheme === 'dark' ? '☀️' : '🌙';
    }

    console.log(`Theme switched to: ${this.currentTheme}`);
  }

  /**
   * Toggle data simulation
   */
  toggleDataSimulation() {
    if (this.dataSimulator.running) {
      this.dataSimulator.stop();
      this.elements.dataSimulator.querySelector('.sim-icon').textContent = '▶️';
      this.elements.dataSimulator.title = 'Start Data Simulation';
    } else {
      this.dataSimulator.start(this.dataSimulator.currentScenario);
      this.elements.dataSimulator.querySelector('.sim-icon').textContent = '⏸️';
      this.elements.dataSimulator.title = 'Stop Data Simulation';
    }
  }

  /**
   * Switch to different scenario
   */
  switchScenario(scenario) {
    // Update active button
    this.elements.scenarioButtons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.scenario === scenario);
    });

    // Switch simulator scenario
    this.dataSimulator.start(scenario);

    console.log(`Switched to scenario: ${scenario}`);
  }

  /**
   * Export configuration
   */
  exportConfiguration() {
    const config = this.configManager.exportConfiguration();
    const blob = new Blob([config], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'component-showcase-config.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log('Configuration exported');
  }

  /**
   * Import configuration
   */
  importConfiguration() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';

    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const success = this.configManager.importConfiguration(e.target.result);
          if (success) {
            console.log('Configuration imported successfully');
            // Apply imported configuration to components
            this.applyConfigurations();
          } else {
            console.error('Failed to import configuration');
          }
        };
        reader.readAsText(file);
      }
    };

    input.click();
  }

  /**
   * Apply configurations to components
   */
  applyConfigurations() {
    // This would apply the current configurations to all components
    // Implementation depends on component APIs
    console.log('Applying configurations to components');
  }

  /**
   * Open configuration panel for component
   */
  openConfigPanel(componentName) {
    // Generate configuration form for the component
    this.generateConfigForm(componentName);
    this.elements.configPanel.classList.add('open');
  }

  /**
   * Close configuration panel
   */
  closeConfigPanel() {
    this.elements.configPanel.classList.remove('open');
  }

  /**
   * Generate configuration form
   */
  generateConfigForm(componentName) {
    const configs = this.getComponentConfigurations();
    const config = configs[componentName] || {};

    let formHTML = `
      <h4>Configure ${componentName}</h4>
      <form class="config-form" data-component="${componentName}">
    `;

    // Generate form fields based on component type
    switch (componentName) {
      case 'ProcessList':
        formHTML += this.generateProcessListConfig(config);
        break;
      case 'ResourceMeter':
        formHTML += this.generateResourceMeterConfig(config);
        break;
      case 'ErrorLog':
        formHTML += this.generateErrorLogConfig(config);
        break;
      case 'MemoryMap':
        formHTML += this.generateMemoryMapConfig(config);
        break;
      default:
        formHTML += '<p>No configuration available for this component.</p>';
    }

    formHTML += `
        <div class="config-actions">
          <button type="button" class="btn-apply">Apply Changes</button>
          <button type="button" class="btn-reset">Reset to Default</button>
          <button type="button" class="btn-preset" data-preset="performance">Performance Mode</button>
        </div>
      </form>
    `;

    this.elements.configContent.innerHTML = formHTML;
    this.attachConfigFormListeners(componentName);
  }

  /**
   * Generate ProcessList configuration form
   */
  generateProcessListConfig(config) {
    return `
      <div class="config-section">
        <h5>Display Options</h5>
        <label class="config-field">
          <input type="checkbox" name="showHealth" ${config.showHealth !== false ? 'checked' : ''}>
          <span>Show Health Status</span>
        </label>
        <label class="config-field">
          <input type="checkbox" name="showWarnings" ${config.showWarnings !== false ? 'checked' : ''}>
          <span>Show Warnings</span>
        </label>
        <label class="config-field">
          <input type="checkbox" name="showResources" ${config.showResources !== false ? 'checked' : ''}>
          <span>Show Resource Bars</span>
        </label>
        <label class="config-field">
          <input type="checkbox" name="showDescription" ${config.showDescription ? 'checked' : ''}>
          <span>Show Descriptions</span>
        </label>
      </div>

      <div class="config-section">
        <h5>Performance Options</h5>
        <label class="config-field">
          <input type="checkbox" name="virtualScroll" ${config.virtualScroll !== false ? 'checked' : ''}>
          <span>Virtual Scrolling</span>
        </label>
        <label class="config-field">
          <span>Row Height</span>
          <input type="range" name="rowHeight" min="32" max="64" value="${config.rowHeight || 48}">
          <span class="range-value">${config.rowHeight || 48}px</span>
        </label>
        <label class="config-field">
          <span>Visible Rows</span>
          <input type="range" name="visibleRows" min="5" max="20" value="${config.visibleRows || 10}">
          <span class="range-value">${config.visibleRows || 10}</span>
        </label>
      </div>

      <div class="config-section">
        <h5>Interaction</h5>
        <label class="config-field">
          <input type="checkbox" name="interactive" ${config.interactive !== false ? 'checked' : ''}>
          <span>Interactive</span>
        </label>
        <label class="config-field">
          <input type="checkbox" name="selectable" ${config.selectable !== false ? 'checked' : ''}>
          <span>Selectable</span>
        </label>
        <label class="config-field">
          <input type="checkbox" name="multiSelect" ${config.multiSelect ? 'checked' : ''}>
          <span>Multi-Select</span>
        </label>
      </div>

      <div class="config-section">
        <h5>Styling</h5>
        <label class="config-field">
          <span>Theme</span>
          <select name="theme">
            <option value="dark" ${config.theme === 'dark' ? 'selected' : ''}>Dark</option>
            <option value="light" ${config.theme === 'light' ? 'selected' : ''}>Light</option>
          </select>
        </label>
        <label class="config-field">
          <input type="checkbox" name="compactMode" ${config.compactMode ? 'checked' : ''}>
          <span>Compact Mode</span>
        </label>
      </div>
    `;
  }

  /**
   * Generate ResourceMeter configuration form
   */
  generateResourceMeterConfig(config) {
    return `
      <div class="config-section">
        <h5>Visualization</h5>
        <label class="config-field">
          <span>Type</span>
          <select name="type">
            <option value="circular" ${config.type === 'circular' ? 'selected' : ''}>Circular</option>
            <option value="linear" ${config.type === 'linear' ? 'selected' : ''}>Linear</option>
            <option value="arc" ${config.type === 'arc' ? 'selected' : ''}>Arc</option>
          </select>
        </label>
        <label class="config-field">
          <span>Metric</span>
          <select name="metric">
            <option value="cpu" ${config.metric === 'cpu' ? 'selected' : ''}>CPU</option>
            <option value="memory" ${config.metric === 'memory' ? 'selected' : ''}>Memory</option>
            <option value="threads" ${config.metric === 'threads' ? 'selected' : ''}>Threads</option>
            <option value="custom" ${config.metric === 'custom' ? 'selected' : ''}>Custom</option>
          </select>
        </label>
      </div>

      <div class="config-section">
        <h5>Size</h5>
        <label class="config-field">
          <span>Width</span>
          <input type="range" name="width" min="100" max="400" value="${config.size?.width || 200}">
          <span class="range-value">${config.size?.width || 200}px</span>
        </label>
        <label class="config-field">
          <span>Height</span>
          <input type="range" name="height" min="100" max="400" value="${config.size?.height || 200}">
          <span class="range-value">${config.size?.height || 200}px</span>
        </label>
      </div>

      <div class="config-section">
        <h5>Thresholds</h5>
        <label class="config-field">
          <span>Low Threshold</span>
          <input type="range" name="lowThreshold" min="0" max="100" value="${config.thresholds?.low || 30}">
          <span class="range-value">${config.thresholds?.low || 30}%</span>
        </label>
        <label class="config-field">
          <span>Medium Threshold</span>
          <input type="range" name="mediumThreshold" min="0" max="100" value="${config.thresholds?.medium || 70}">
          <span class="range-value">${config.thresholds?.medium || 70}%</span>
        </label>
        <label class="config-field">
          <span>High Threshold</span>
          <input type="range" name="highThreshold" min="0" max="100" value="${config.thresholds?.high || 90}">
          <span class="range-value">${config.thresholds?.high || 90}%</span>
        </label>
      </div>

      <div class="config-section">
        <h5>Animation</h5>
        <label class="config-field">
          <input type="checkbox" name="animate" ${config.animate !== false ? 'checked' : ''}>
          <span>Enable Animations</span>
        </label>
        <label class="config-field">
          <span>Animation Duration</span>
          <input type="range" name="animationDuration" min="100" max="2000" value="${config.animationDuration || 500}">
          <span class="range-value">${config.animationDuration || 500}ms</span>
        </label>
      </div>
    `;
  }

  /**
   * Generate ErrorLog configuration form
   */
  generateErrorLogConfig(config) {
    return `
      <div class="config-section">
        <h5>Display Options</h5>
        <label class="config-field">
          <span>Max Errors</span>
          <input type="range" name="maxErrors" min="10" max="200" value="${config.maxErrors || 100}">
          <span class="range-value">${config.maxErrors || 100}</span>
        </label>
        <label class="config-field">
          <input type="checkbox" name="showTimestamp" ${config.showTimestamp !== false ? 'checked' : ''}>
          <span>Show Timestamps</span>
        </label>
        <label class="config-field">
          <input type="checkbox" name="showSeverity" ${config.showSeverity !== false ? 'checked' : ''}>
          <span>Show Severity</span>
        </label>
        <label class="config-field">
          <input type="checkbox" name="showStackTrace" ${config.showStackTrace !== false ? 'checked' : ''}>
          <span>Show Stack Traces</span>
        </label>
      </div>

      <div class="config-section">
        <h5>Behavior</h5>
        <label class="config-field">
          <input type="checkbox" name="autoDismiss" ${config.autoDismiss !== false ? 'checked' : ''}>
          <span>Auto Dismiss</span>
        </label>
        <label class="config-field">
          <span>Auto Dismiss Delay</span>
          <input type="range" name="autoDismissDelay" min="5000" max="60000" step="1000" value="${config.autoDismissDelay || 10000}">
          <span class="range-value">${(config.autoDismissDelay || 10000) / 1000}s</span>
        </label>
        <label class="config-field">
          <input type="checkbox" name="groupSimilar" ${config.groupSimilar !== false ? 'checked' : ''}>
          <span>Group Similar Errors</span>
        </label>
        <label class="config-field">
          <input type="checkbox" name="collapsedByDefault" ${config.collapsedByDefault !== false ? 'checked' : ''}>
          <span>Collapsed by Default</span>
        </label>
      </div>

      <div class="config-section">
        <h5>Performance</h5>
        <label class="config-field">
          <input type="checkbox" name="virtualScroll" ${config.virtualScroll !== false ? 'checked' : ''}>
          <span>Virtual Scrolling</span>
        </label>
        <label class="config-field">
          <span>Row Height</span>
          <input type="range" name="rowHeight" min="60" max="120" value="${config.rowHeight || 80}">
          <span class="range-value">${config.rowHeight || 80}px</span>
        </label>
        <label class="config-field">
          <span>Visible Rows</span>
          <input type="range" name="visibleRows" min="5" max="20" value="${config.visibleRows || 10}">
          <span class="range-value">${config.visibleRows || 10}</span>
        </label>
      </div>

      <div class="config-section">
        <h5>Features</h5>
        <label class="config-field">
          <input type="checkbox" name="enableSearch" ${config.enableSearch !== false ? 'checked' : ''}>
          <span>Enable Search</span>
        </label>
        <label class="config-field">
          <input type="checkbox" name="enableExport" ${config.enableExport !== false ? 'checked' : ''}>
          <span>Enable Export</span>
        </label>
        <label class="config-field">
          <input type="checkbox" name="compactMode" ${config.compactMode ? 'checked' : ''}>
          <span>Compact Mode</span>
        </label>
      </div>
    `;
  }

  /**
   * Generate MemoryMap configuration form
   */
  generateMemoryMapConfig(config) {
    return `
      <div class="config-section">
        <h5>Grid Configuration</h5>
        <label class="config-field">
          <span>Grid Width</span>
          <input type="range" name="gridWidth" min="16" max="128" value="${config.gridSize?.width || 64}">
          <span class="range-value">${config.gridSize?.width || 64}</span>
        </label>
        <label class="config-field">
          <span>Grid Height</span>
          <input type="range" name="gridHeight" min="8" max="64" value="${config.gridSize?.height || 32}">
          <span class="range-value">${config.gridSize?.height || 32}</span>
        </label>
        <label class="config-field">
          <span>Block Size</span>
          <input type="range" name="blockSize" min="4" max="32" value="${config.blockSize || 16}">
          <span class="range-value">${config.blockSize || 16}px</span>
        </label>
      </div>

      <div class="config-section">
        <h5>View Options</h5>
        <label class="config-field">
          <span>View Mode</span>
          <select name="viewMode">
            <option value="type" ${config.viewMode === 'type' ? 'selected' : ''}>Memory Type</option>
            <option value="access" ${config.viewMode === 'access' ? 'selected' : ''}>Access Frequency</option>
            <option value="fragmentation" ${config.viewMode === 'fragmentation' ? 'selected' : ''}>Fragmentation</option>
            <option value="age" ${config.viewMode === 'age' ? 'selected' : ''}>Memory Age</option>
          </select>
        </label>
        <label class="config-field">
          <input type="checkbox" name="enableZoom" ${config.enableZoom !== false ? 'checked' : ''}>
          <span>Enable Zoom</span>
        </label>
        <label class="config-field">
          <input type="checkbox" name="enablePan" ${config.enablePan !== false ? 'checked' : ''}>
          <span>Enable Pan</span>
        </label>
        <label class="config-field">
          <input type="checkbox" name="enableMinimap" ${config.enableMinimap ? 'checked' : ''}>
          <span>Enable Minimap</span>
        </label>
      </div>

      <div class="config-section">
        <h5>Color Scheme</h5>
        <label class="config-field">
          <span>Emotion Color</span>
          <input type="color" name="emotionColor" value="${config.colorScheme?.emotion || '#FF6B6B'}">
        </label>
        <label class="config-field">
          <span>Trauma Color</span>
          <input type="color" name="traumaColor" value="${config.colorScheme?.trauma || '#845EC2'}">
        </label>
        <label class="config-field">
          <span>Relationship Color</span>
          <input type="color" name="relationshipColor" value="${config.colorScheme?.relationship || '#4E8397'}">
        </label>
        <label class="config-field">
          <span>System Color</span>
          <input type="color" name="systemColor" value="${config.colorScheme?.system || '#B39CD0'}">
        </label>
        <label class="config-field">
          <span>Free Space Color</span>
          <input type="color" name="freeColor" value="${config.colorScheme?.free || '#2C2C2C'}">
        </label>
        <label class="config-field">
          <span>Fragmented Color</span>
          <input type="color" name="fragmentedColor" value="${config.colorScheme?.fragmented || '#FFB800'}">
        </label>
      </div>
    `;
  }

  /**
   * Attach event listeners to configuration form
   */
  attachConfigFormListeners(componentName) {
    const form = this.elements.configContent.querySelector('.config-form');
    if (!form) return;

    // Range input updates
    form.querySelectorAll('input[type="range"]').forEach(range => {
      const valueSpan = range.parentElement.querySelector('.range-value');
      range.addEventListener('input', (e) => {
        const value = e.target.value;
        const unit = e.target.name.includes('Delay') ? 's' :
                    e.target.name.includes('Duration') ? 'ms' :
                    e.target.name.includes('Threshold') ? '%' :
                    e.target.name.includes('Size') || e.target.name.includes('Height') || e.target.name.includes('Width') ? 'px' : '';

        if (valueSpan) {
          valueSpan.textContent = e.target.name.includes('Delay') ? (value / 1000) + unit : value + unit;
        }

        // Apply change immediately for real-time preview
        this.applyConfigurationChange(componentName, e.target.name, this.parseConfigValue(e.target));
      });
    });

    // Checkbox updates
    form.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
      checkbox.addEventListener('change', (e) => {
        this.applyConfigurationChange(componentName, e.target.name, e.target.checked);
      });
    });

    // Select updates
    form.querySelectorAll('select').forEach(select => {
      select.addEventListener('change', (e) => {
        this.applyConfigurationChange(componentName, e.target.name, e.target.value);
      });
    });

    // Color input updates
    form.querySelectorAll('input[type="color"]').forEach(colorInput => {
      colorInput.addEventListener('change', (e) => {
        this.applyConfigurationChange(componentName, e.target.name, e.target.value);
      });
    });

    // Action buttons
    const applyBtn = form.querySelector('.btn-apply');
    const resetBtn = form.querySelector('.btn-reset');
    const presetBtn = form.querySelector('.btn-preset');

    if (applyBtn) {
      applyBtn.addEventListener('click', () => {
        this.applyAllConfigurationChanges(componentName);
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        this.resetComponentConfiguration(componentName);
      });
    }

    if (presetBtn) {
      presetBtn.addEventListener('click', (e) => {
        const preset = e.target.dataset.preset;
        this.applyConfigurationPreset(componentName, preset);
      });
    }
  }

  /**
   * Parse configuration value from form input
   */
  parseConfigValue(input) {
    switch (input.type) {
      case 'checkbox':
        return input.checked;
      case 'range':
      case 'number':
        return parseInt(input.value);
      case 'color':
      case 'text':
      case 'select-one':
        return input.value;
      default:
        return input.value;
    }
  }

  /**
   * Apply single configuration change
   */
  applyConfigurationChange(componentName, propertyName, value) {
    const component = this.getComponentByName(componentName);
    if (!component) return;

    // Handle nested properties (like size.width, thresholds.low)
    if (propertyName.includes('Threshold')) {
      const thresholdType = propertyName.replace('Threshold', '').toLowerCase();
      if (component.options && component.options.thresholds) {
        component.options.thresholds[thresholdType] = value;
      }
    } else if (propertyName === 'width' || propertyName === 'height') {
      if (component.options && component.options.size) {
        component.options.size[propertyName] = value;
      }
    } else if (propertyName.includes('Color')) {
      const colorType = propertyName.replace('Color', '').toLowerCase();
      if (component.options && component.options.colorScheme) {
        component.options.colorScheme[colorType] = value;
      }
    } else {
      // Direct property
      if (component.options) {
        component.options[propertyName] = value;
      }
    }

    // Trigger component update if it has a refresh method
    if (component.refresh) {
      component.refresh();
    } else if (component.render) {
      component.render();
    }

    // Store configuration
    this.configManager.setConfiguration(componentName, component.options);
  }

  /**
   * Apply all configuration changes from form
   */
  applyAllConfigurationChanges(componentName) {
    const form = this.elements.configContent.querySelector('.config-form');
    if (!form) return;

    const formData = new FormData(form);
    const config = {};

    for (const [key] of formData.entries()) {
      config[key] = this.parseConfigValue(form.querySelector(`[name="${key}"]`));
    }

    // Apply configuration to component
    const component = this.getComponentByName(componentName);
    if (component && component.updateOptions) {
      component.updateOptions(config);
    }

    this.configManager.setConfiguration(componentName, config);
    console.log(`Applied configuration to ${componentName}:`, config);
  }

  /**
   * Reset component configuration to defaults
   */
  resetComponentConfiguration(componentName) {
    this.configManager.applyPreset('default');
    this.generateConfigForm(componentName); // Regenerate form with default values

    const component = this.getComponentByName(componentName);
    if (component && component.resetToDefaults) {
      component.resetToDefaults();
    }
  }

  /**
   * Apply configuration preset
   */
  applyConfigurationPreset(componentName, presetName) {
    this.configManager.applyPreset(presetName);
    this.generateConfigForm(componentName); // Regenerate form with preset values

    const config = this.configManager.getConfiguration(componentName);
    const component = this.getComponentByName(componentName);
    if (component && component.updateOptions) {
      component.updateOptions(config);
    }
  }

  /**
   * Get component instance by name
   */
  getComponentByName(componentName) {
    const componentMap = {
      'ProcessList': ['processListDemo', 'unifiedProcessList'],
      'ResourceMeter': ['cpuMeter', 'memoryMeter', 'threadMeter'],
      'ErrorLog': ['errorLogDemo', 'unifiedErrorLog'],
      'MemoryMap': ['memoryMapDemo', 'unifiedMemoryMap']
    };

    const componentKeys = componentMap[componentName];
    if (componentKeys) {
      // Return the first available component instance
      for (const key of componentKeys) {
        const component = this.components.get(key);
        if (component) return component;
      }
    }

    return null;
  }

  /**
   * Get current component configurations
   */
  getComponentConfigurations() {
    const configs = {};

    // Get configurations from configManager
    ['ProcessList', 'ResourceMeter', 'ErrorLog', 'MemoryMap'].forEach(componentName => {
      configs[componentName] = this.configManager.getConfiguration(componentName);
    });

    return configs;
  }

  /**
   * Run stress test on component
   */
  runStressTest(componentName) {
    console.log(`Running stress test on ${componentName}`);

    // Generate high-volume test data
    const stressData = this.generateStressTestData();

    // Apply to specific component
    const component = this.components.get(componentName.toLowerCase() + 'Demo');
    if (component && component.update) {
      const startTime = performance.now();
      component.update(stressData);
      const endTime = performance.now();

      console.log(`Stress test completed in ${(endTime - startTime).toFixed(2)}ms`);
    }
  }

  /**
   * Generate stress test data
   */
  generateStressTestData() {
    // Generate large dataset for stress testing
    const processes = [];
    for (let i = 0; i < 1000; i++) {
      processes.push({
        pid: 1000 + i,
        name: `StressTest_${i}.exe`,
        status: 'running',
        cpu: Math.random() * 100,
        memory: Math.random() * 1024,
        threads: Math.floor(Math.random() * 8) + 1
      });
    }
    return processes;
  }

  /**
   * Show code example
   */
  showExample(exampleType) {
    // Update active tab
    this.elements.exampleTabs.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.example === exampleType);
    });

    // Load example content
    this.loadExampleContent(exampleType);
  }

  /**
   * Load example content
   */
  loadExampleContent(exampleType) {
    const examples = {
      'basic': this.getBasicUsageExample(),
      'integration': this.getIntegrationExample(),
      'events': this.getEventHandlingExample(),
      'performance': this.getPerformanceExample()
    };

    const content = examples[exampleType] || 'Example not found';
    this.elements.exampleContent.innerHTML = `<pre><code class="language-javascript">${content}</code></pre>`;

    // Trigger syntax highlighting
    if (window.Prism) {
      window.Prism.highlightAll();
    }
  }

  /**
   * Hide loading overlay
   */
  hideLoadingOverlay() {
    if (this.elements.loadingOverlay) {
      this.elements.loadingOverlay.classList.add('hidden');
      setTimeout(() => {
        this.elements.loadingOverlay.style.display = 'none';
      }, 500);
    }
  }

  /**
   * Show error message
   */
  showError(message) {
    console.error(message);
    // Could show a toast notification or modal
    alert(message);
  }

  /**
   * Get basic usage example
   */
  getBasicUsageExample() {
    return `// Basic Component Usage Examples

// ProcessList Component
import { ProcessList } from '/js/components/ProcessList.js';

const processList = new ProcessList(container, {
  showHealth: true,
  showWarnings: true,
  showResources: true,
  virtualScroll: true,
  theme: 'dark'
});

// Update with process data
processList.update([
  {
    pid: 1234,
    name: 'Grief_Manager.exe',
    status: 'running',
    cpu: 45.2,
    memory: 256,
    threads: 4
  }
]);

// ResourceMeter Component
import ResourceMeter from '/js/components/ResourceMeter.js';

const cpuMeter = new ResourceMeter(container, {
  type: 'circular',
  metric: 'cpu',
  size: { width: 200, height: 200 },
  animate: true,
  thresholds: { low: 30, medium: 70, high: 90 }
});

// Update meter value
cpuMeter.update(75.5);`;
  }

  /**
   * Get integration example
   */
  getIntegrationExample() {
    return `// Component Integration Example

class ConsciousnessDebugger {
  constructor() {
    this.components = new Map();
    this.initializeComponents();
    this.setupCommunication();
  }

  initializeComponents() {
    // Initialize all components
    this.components.set('processList', new ProcessList(
      document.getElementById('processes'),
      { theme: 'dark', virtualScroll: true }
    ));

    this.components.set('memoryMap', new MemoryMap(
      document.getElementById('memory'),
      { viewMode: 'type', enableZoom: true }
    ));

    this.components.set('errorLog', new ErrorLog(
      document.getElementById('errors'),
      { maxErrors: 100, autoDismiss: true }
    ));
  }

  setupCommunication() {
    // Process selection highlights memory
    this.components.get('processList').on('process-selected', (process) => {
      this.components.get('memoryMap').highlightBlocksByProcess(process.pid);
    });

    // Errors link to processes
    this.components.get('errorLog').on('error-clicked', (error) => {
      if (error.processId) {
        this.components.get('processList').highlightProcess(error.processId);
      }
    });
  }
}`;
  }

  /**
   * Get event handling example
   */
  getEventHandlingExample() {
    return `// Event Handling Examples

// ProcessList Events
processList.on('process-selected', (process) => {
  console.log('Selected process:', process.name);
});

processList.on('process-hover', (process) => {
  showTooltip(process.description);
});

processList.on('selection-change', (selectedPids) => {
  updateSelectionCount(selectedPids.length);
});

// ResourceMeter Events
cpuMeter.on('threshold-exceeded', (data) => {
  console.log('CPU threshold exceeded: ' + data.value + '%');
  showAlert('High CPU usage detected!');
});

cpuMeter.on('value-changed', (value) => {
  updateCpuDisplay(value);
});

// ErrorLog Events
errorLog.on('error-added', (error) => {
  if (error.severity === 'critical') {
    playAlertSound();
  }
});

errorLog.on('error-dismissed', (errorId) => {
  console.log('Error dismissed:', errorId);
});

// MemoryMap Events
memoryMap.on('block-clicked', (block) => {
  showMemoryDetails(block);
});

memoryMap.on('zoom-changed', (zoomLevel) => {
  updateZoomIndicator(zoomLevel);
});`;
  }

  /**
   * Get performance example
   */
  getPerformanceExample() {
    return `// Performance Optimization Tips

// 1. Use Virtual Scrolling for Large Lists
const processList = new ProcessList(container, {
  virtualScroll: true,
  rowHeight: 48,        // Fixed height for performance
  visibleRows: 10,      // Limit visible rows
  bufferRows: 2         // Extra rows for smooth scrolling
});

// 2. Batch Updates
const updates = [];
for (let i = 0; i < 1000; i++) {
  updates.push(generateProcessData(i));
}
// Single update instead of 1000 individual updates
processList.update(updates);

// 3. Throttle High-Frequency Updates
let updateTimeout;
function throttledUpdate(data) {
  if (updateTimeout) return;

  updateTimeout = setTimeout(() => {
    processList.update(data);
    updateTimeout = null;
  }, 16); // ~60fps
}

// 4. Disable Animations for Performance Mode
const meter = new ResourceMeter(container, {
  animate: false,  // Disable for better performance
  type: 'linear'   // Linear meters are faster than circular
});

// 5. Memory Management
function cleanup() {
  // Destroy components when no longer needed
  processList.destroy();
  meter.destroy();
  errorLog.destroy();
  memoryMap.destroy();
}

// 6. Monitor Performance
const monitor = new PerformanceMonitor();
monitor.on('fps-drop', (fps) => {
  if (fps < 30) {
    console.warn('Performance degraded, consider optimizations');
  }
});`;
  }
}

// Initialize the showcase when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.componentShowcase = new ComponentShowcase();
});
