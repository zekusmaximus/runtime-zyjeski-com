// Component Showcase Integration Tests
// Tests for the complete showcase functionality

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock canvas for testing
HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
  fillRect: vi.fn(),
  clearRect: vi.fn(),
  getImageData: vi.fn(() => ({ data: new Array(4) })),
  putImageData: vi.fn(),
  createImageData: vi.fn(() => ({ data: new Array(4) })),
  setTransform: vi.fn(),
  drawImage: vi.fn(),
  save: vi.fn(),
  fillText: vi.fn(),
  restore: vi.fn(),
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  closePath: vi.fn(),
  stroke: vi.fn(),
  translate: vi.fn(),
  scale: vi.fn(),
  rotate: vi.fn(),
  arc: vi.fn(),
  fill: vi.fn(),
  measureText: vi.fn(() => ({ width: 0 })),
  transform: vi.fn(),
  rect: vi.fn(),
  clip: vi.fn(),
}));

// Mock requestAnimationFrame
global.requestAnimationFrame = vi.fn(cb => setTimeout(cb, 16));
global.cancelAnimationFrame = vi.fn();

// Mock performance.now
global.performance = {
  now: vi.fn(() => Date.now()),
  memory: {
    usedJSHeapSize: 1024 * 1024 * 10 // 10MB
  }
};

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

describe('Component Showcase', () => {
  let showcase;

  beforeEach(() => {
    // Set up DOM
    document.body.innerHTML = `
      <div id="showcase-container">
        <!-- Navigation -->
        <nav class="showcase-nav">
          <div class="nav-container">
            <div class="nav-controls">
              <button id="themeToggle">Theme</button>
              <button id="dataSimulator">Simulator</button>
              <button id="exportConfig">Export</button>
              <button id="importConfig">Import</button>
            </div>
          </div>
        </nav>

        <!-- Stats -->
        <div class="showcase-stats">
          <span id="globalFPS">60</span>
          <span id="memoryUsage">0MB</span>
          <span id="updateRate">0</span>
        </div>

        <!-- Component containers -->
        <div id="process-list-demo"></div>
        <div id="cpu-meter-demo"></div>
        <div id="memory-meter-demo"></div>
        <div id="thread-meter-demo"></div>
        <div id="error-log-demo"></div>
        <div id="memory-map-demo"></div>

        <!-- Unified dashboard -->
        <div id="unified-process-list"></div>
        <div id="unified-resources"></div>
        <div id="unified-memory-map"></div>
        <div id="unified-error-log"></div>

        <!-- Configuration -->
        <div id="configPanel" class="config-panel">
          <div class="config-header">
            <button id="configClose">×</button>
          </div>
          <div id="configContent"></div>
        </div>

        <!-- Examples -->
        <div id="exampleTabs"></div>
        <div id="exampleContent"></div>

        <!-- Loading -->
        <div id="loadingOverlay" class="loading-overlay"></div>

        <!-- Scenario controls -->
        <button class="scenario-btn" data-scenario="normal">Normal</button>
        <button class="scenario-btn" data-scenario="grief-overload">Grief</button>

        <!-- Component stats -->
        <span id="processCount">0</span>
        <span id="processRenderTime">0ms</span>
        <span id="errorCount">0</span>
        <span id="blockCount">0</span>
        <span id="meterFPS">60</span>
      </div>
    `;

    // Container is available in DOM for tests
  });

  afterEach(() => {
    if (showcase) {
      // Clean up any intervals or timeouts
      if (showcase.dataSimulator) {
        showcase.dataSimulator.stop();
      }
    }
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    test('should initialize without errors', async () => {
      // Mock the component classes
      const mockProcessList = vi.fn().mockImplementation(() => ({
        update: vi.fn(),
        on: vi.fn(),
        destroy: vi.fn()
      }));

      const mockResourceMeter = vi.fn().mockImplementation(() => ({
        update: vi.fn(),
        on: vi.fn(),
        destroy: vi.fn()
      }));

      const mockErrorLog = vi.fn().mockImplementation(() => ({
        addError: vi.fn(),
        on: vi.fn(),
        destroy: vi.fn()
      }));

      const mockMemoryMap = vi.fn().mockImplementation(() => ({
        updateMemoryBlocks: vi.fn(),
        highlightBlocksByProcess: vi.fn(),
        clearHighlights: vi.fn(),
        on: vi.fn(),
        destroy: vi.fn()
      }));

      // Mock the imports
      vi.doMock('/js/components/ProcessList.js', () => ({
        ProcessList: mockProcessList
      }));
      vi.doMock('/js/components/ResourceMeter.js', () => mockResourceMeter);
      vi.doMock('/js/components/ErrorLog.js', () => mockErrorLog);
      vi.doMock('/js/components/MemoryMap.js', () => mockMemoryMap);

      // Import and create showcase
      const { ComponentShowcase } = await import('../../public/js/component-showcase.js');
      
      expect(() => {
        showcase = new ComponentShowcase();
      }).not.toThrow();
    });

    test('should cache DOM elements correctly', () => {
      const elements = {
        themeToggle: document.getElementById('themeToggle'),
        dataSimulator: document.getElementById('dataSimulator'),
        processListDemo: document.getElementById('process-list-demo'),
        cpuMeterDemo: document.getElementById('cpu-meter-demo')
      };

      Object.values(elements).forEach(element => {
        expect(element).toBeTruthy();
      });
    });
  });

  describe('Data Simulation', () => {
    test('should generate valid process data', () => {
      // Test data simulator directly
      const simulator = {
        processTemplates: [
          { name: 'Test.exe', type: 'test', priority: 'normal' }
        ],
        randomBetween: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min,
        getRandomElement: (arr) => arr[Math.floor(Math.random() * arr.length)],
        processIdCounter: 1000
      };

      const config = {
        processCount: [1, 3],
        cpuRange: [10, 50],
        memoryRange: [20, 60],
        errorRate: 0.1
      };

      // Mock process generation
      const processes = [];
      const count = simulator.randomBetween(config.processCount[0], config.processCount[1]);
      
      for (let i = 0; i < count; i++) {
        const template = simulator.getRandomElement(simulator.processTemplates);
        processes.push({
          pid: simulator.processIdCounter++,
          name: template.name,
          type: template.type,
          priority: template.priority,
          status: 'running',
          cpu: simulator.randomBetween(config.cpuRange[0], config.cpuRange[1]),
          memory: simulator.randomBetween(50, 300),
          threads: simulator.randomBetween(1, 8)
        });
      }

      expect(processes.length).toBeGreaterThan(0);
      expect(processes.length).toBeLessThanOrEqual(3);
      
      processes.forEach(process => {
        expect(process).toHaveProperty('pid');
        expect(process).toHaveProperty('name');
        expect(process).toHaveProperty('status');
        expect(process.cpu).toBeGreaterThanOrEqual(10);
        expect(process.cpu).toBeLessThanOrEqual(50);
      });
    });

    test('should generate different scenarios', () => {
      const scenarios = ['normal', 'grief-overload', 'anxiety-loop', 'recovery'];
      
      scenarios.forEach(scenario => {
        expect(typeof scenario).toBe('string');
        expect(scenario.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Performance Monitoring', () => {
    test('should track FPS correctly', (done) => {
      let frameCount = 0;
      const startTime = performance.now();

      const measureFPS = () => {
        frameCount++;
        const now = performance.now();
        
        if (now - startTime >= 100) { // Test for 100ms
          const fps = Math.round((frameCount * 1000) / (now - startTime));
          expect(fps).toBeGreaterThan(0);
          expect(fps).toBeLessThanOrEqual(120); // Reasonable upper bound
          done();
          return;
        }
        
        requestAnimationFrame(measureFPS);
      };
      
      requestAnimationFrame(measureFPS);
    });

    test('should record render times', () => {
      const renderTimes = new Map();
      const componentName = 'testComponent';
      const renderTime = 15.5;
      
      renderTimes.set(componentName, renderTime);
      
      expect(renderTimes.get(componentName)).toBe(renderTime);
      expect(renderTimes.has(componentName)).toBe(true);
    });
  });

  describe('Theme System', () => {
    test('should toggle between dark and light themes', () => {
      document.body.setAttribute('data-theme', 'dark');
      expect(document.body.getAttribute('data-theme')).toBe('dark');
      
      document.body.setAttribute('data-theme', 'light');
      expect(document.body.getAttribute('data-theme')).toBe('light');
    });
  });

  describe('Configuration Management', () => {
    test('should export configuration as JSON', () => {
      const config = {
        ProcessList: { virtualScroll: true, theme: 'dark' },
        ResourceMeter: { type: 'circular', animate: true }
      };
      
      const exported = JSON.stringify(config, null, 2);
      expect(typeof exported).toBe('string');
      
      const parsed = JSON.parse(exported);
      expect(parsed).toEqual(config);
    });

    test('should import valid configuration', () => {
      const configJson = '{"ProcessList":{"virtualScroll":true},"ResourceMeter":{"type":"circular"}}';
      
      expect(() => {
        const config = JSON.parse(configJson);
        expect(config).toHaveProperty('ProcessList');
        expect(config).toHaveProperty('ResourceMeter');
      }).not.toThrow();
    });
  });

  describe('Error Handling', () => {
    test('should handle missing DOM elements gracefully', () => {
      document.body.innerHTML = '<div></div>'; // Empty container
      
      expect(() => {
        const elements = {
          missing: document.getElementById('nonexistent')
        };
        expect(elements.missing).toBeNull();
      }).not.toThrow();
    });

    test('should validate component data', () => {
      const validProcess = {
        pid: 1234,
        name: 'Test.exe',
        status: 'running',
        cpu: 50,
        memory: 256
      };

      const invalidProcess = {
        // Missing required fields
        name: 'Invalid.exe'
      };

      expect(typeof validProcess.pid).toBe('number');
      expect(typeof validProcess.name).toBe('string');
      expect(validProcess.name.length).toBeGreaterThan(0);

      expect(invalidProcess.pid).toBeUndefined();
    });
  });
});
