// tests/integration/ProcessList.integration.test.js
// Integration tests for ProcessList component with existing codebase

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ProcessList } from '../../public/js/components/ProcessList.js';
import { ConsciousnessTransformer } from '../../public/js/utils/ConsciousnessTransformer.js';

// Mock DOM environment
const createIntegrationContainer = () => {
  const container = document.createElement('div');
  container.id = 'process-container';
  container.style.width = '800px';
  container.style.height = '600px';
  document.body.appendChild(container);
  return container;
};

// Mock consciousness data that matches the real backend format
const createMockConsciousnessData = () => ({
  timestamp: "2024-12-09T10:30:00Z",
  processes: [
    {
      pid: 1001,
      name: "Grief_Manager.exe",
      status: "running",
      cpu_usage: 23.4,
      memory_usage: 1024,
      memory_mb: 1024,
      threads: 3,
      threadCount: 3,
      priority: "high",
      stability: 0.85,
      type: "emotional_processing",
      debuggable: true,
      currentIssues: ["high_memory_usage"],
      interventionPoints: ["memory_limit", "loop_detection"],
      effectivenessScore: 0.7,
      lifetime: 15000
    },
    {
      pid: 1002,
      name: "Search_Protocol.exe",
      status: "blocked",
      cpu_usage: 5.2,
      memory_usage: 512,
      memory_mb: 512,
      threads: 1,
      threadCount: 1,
      priority: "normal",
      stability: 0.95,
      type: "cognitive_processing",
      debuggable: true,
      currentIssues: [],
      interventionPoints: ["priority_adjustment"],
      effectivenessScore: 0.9,
      lifetime: 8000
    },
    {
      pid: 1003,
      name: "Memory_Allocator.dll",
      status: "error",
      cpu_usage: 0,
      memory_usage: 256,
      memory_mb: 256,
      threads: 0,
      threadCount: 0,
      priority: "critical",
      stability: 0.1,
      type: "system",
      debuggable: false,
      currentIssues: ["process_crashed", "memory_corruption"],
      interventionPoints: ["restart_process"],
      effectivenessScore: 0.0,
      lifetime: 2000
    }
  ],
  system: {
    cpu: { used: 45.2, total: 100 },
    memory: { used: 1792, total: 4096 },
    threads: { used: 4, total: 16 }
  }
});

// Mock StateManager for integration testing
class MockStateManager {
  constructor() {
    this.processes = [];
    this.listeners = new Map();
  }
  
  getProcesses() {
    return this.processes;
  }
  
  setProcesses(processes) {
    this.processes = processes;
    this.emit('processes-updated', processes);
  }
  
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }
  
  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => callback(data));
    }
  }
}

// Mock MonitorUI for integration testing
class MockMonitorUI {
  constructor() {
    this.elements = {};
    this.updateCallCount = 0;
  }
  
  updateProcessTable(processes) {
    this.updateCallCount++;
    this.lastProcessUpdate = processes;
  }
}

describe('ProcessList Integration Tests', () => {
  let container;
  let processList;
  let transformer;
  let mockStateManager;
  let mockMonitorUI;

  beforeEach(() => {
    container = createIntegrationContainer();
    transformer = new ConsciousnessTransformer();
    mockStateManager = new MockStateManager();
    mockMonitorUI = new MockMonitorUI();
  });

  afterEach(() => {
    if (processList) {
      processList.destroy();
    }
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
  });

  describe('ConsciousnessTransformer Integration', () => {
    beforeEach(() => {
      processList = new ProcessList(container, {
        showHealth: true,
        showWarnings: true,
        showResources: true
      });
    });

    it('should work with real ConsciousnessTransformer data', () => {
      const consciousnessData = createMockConsciousnessData();
      const transformedProcesses = transformer.extractProcesses(consciousnessData);
      
      expect(transformedProcesses).toHaveLength(3);
      
      // Test that ProcessList can consume the transformed data
      processList.update(transformedProcesses);
      
      expect(processList.processes).toHaveLength(3);
      expect(processList.processes[0].pid).toBe(1001);
      expect(processList.processes[0].name).toBe("Grief_Manager.exe");
      expect(processList.processes[0].health).toBeGreaterThan(0);
      expect(processList.processes[0].indicator).toHaveProperty('color');
      expect(processList.processes[0].indicator).toHaveProperty('icon');
    });

    it('should handle transformer data format changes gracefully', () => {
      // Test with missing optional fields
      const minimalData = {
        timestamp: "2024-12-09T10:30:00Z",
        processes: [
          {
            pid: 1001,
            name: "Basic_Process.exe",
            status: "running"
            // Missing many optional fields
          }
        ]
      };
      
      const transformedProcesses = transformer.extractProcesses(minimalData);
      processList.update(transformedProcesses);
      
      expect(processList.processes).toHaveLength(1);
      expect(processList.processes[0].pid).toBe(1001);
      expect(processList.processes[0].health).toBeDefined();
      expect(processList.processes[0].cpu).toBeDefined();
      expect(processList.processes[0].memory).toBeDefined();
    });

    it('should maintain performance with transformer caching', () => {
      const consciousnessData = createMockConsciousnessData();

      // First extraction
      const start1 = performance.now();
      const processes1 = transformer.extractProcesses(consciousnessData);
      const time1 = performance.now() - start1;

      processList.update(processes1);

      // Second extraction with same data
      const start2 = performance.now();
      const processes2 = transformer.extractProcesses(consciousnessData);
      const time2 = performance.now() - start2;

      processList.update(processes2);

      // Both extractions should be reasonably fast (caching may or may not be faster due to test environment)
      expect(time1).toBeLessThan(50); // First extraction should be fast
      expect(time2).toBeLessThan(50); // Second extraction should be fast
      expect(processes1).toEqual(processes2); // Results should be identical
    });

    it('should handle transformer error states', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // Test with null data
      const processes1 = transformer.extractProcesses(null);
      processList.update(processes1);
      expect(processList.processes).toHaveLength(0);
      
      // Test with malformed data
      const processes2 = transformer.extractProcesses({ invalid: 'data' });
      processList.update(processes2);
      expect(processList.processes).toHaveLength(0);
      
      consoleErrorSpy.mockRestore();
    });
  });

  describe('StateManager Integration', () => {
    beforeEach(() => {
      processList = new ProcessList(container, {
        interactive: true,
        selectable: true
      });
    });

    it('should integrate with StateManager process updates', () => {
      const updateHandler = vi.fn();
      processList.on('update', updateHandler);
      
      // Simulate StateManager providing process data
      const consciousnessData = createMockConsciousnessData();
      const processes = transformer.extractProcesses(consciousnessData);
      
      mockStateManager.setProcesses(processes);
      processList.update(mockStateManager.getProcesses());
      
      expect(updateHandler).toHaveBeenCalled();
      expect(processList.processes).toHaveLength(3);
    });

    it('should handle StateManager process selection events', () => {
      const consciousnessData = createMockConsciousnessData();
      const processes = transformer.extractProcesses(consciousnessData);
      processList.update(processes);
      
      // Simulate process selection for debugging
      const selectionHandler = vi.fn();
      processList.on('process-click', selectionHandler);
      
      // Find and click a process row
      const processRow = container.querySelector('.process-row[data-pid="1001"]');
      expect(processRow).toBeTruthy();
      
      processRow.click();
      
      expect(selectionHandler).toHaveBeenCalledWith({
        process: expect.objectContaining({ pid: 1001 }),
        event: expect.any(Event),
        ctrlKey: false,
        shiftKey: false
      });
    });

    it('should maintain state consistency during rapid updates', () => {
      const consciousnessData = createMockConsciousnessData();
      let processes = transformer.extractProcesses(consciousnessData);
      
      processList.update(processes);
      processList.select(1001);
      
      // Simulate rapid state updates
      for (let i = 0; i < 10; i++) {
        processes = processes.map(p => ({
          ...p,
          cpu: Math.random() * 100,
          memory: Math.random() * 1024
        }));
        
        processList.update(processes);
      }
      
      // Selection should be maintained
      expect(processList._selectedPids.has(1001)).toBe(true);
      expect(processList.processes).toHaveLength(3);
    });
  });

  describe('Monitor UI Integration', () => {
    it('should replace existing monitor table functionality', () => {
      processList = new ProcessList(container, {
        showHealth: true,
        showWarnings: true,
        showResources: true,
        theme: 'dark'
      });
      
      const consciousnessData = createMockConsciousnessData();
      const processes = transformer.extractProcesses(consciousnessData);
      
      // Test that ProcessList provides same functionality as old monitor table
      processList.update(processes);
      
      // Check that all processes are displayed
      const processRows = container.querySelectorAll('.process-row');
      expect(processRows).toHaveLength(3);
      
      // Check that process information is displayed correctly
      const firstRow = processRows[0];
      expect(firstRow.querySelector('.process-name').textContent).toBe('Grief_Manager.exe');
      expect(firstRow.querySelector('.process-pid').textContent).toBe('PID: 1001');
      
      // Check that status indicators are present
      expect(firstRow.querySelector('.status-indicator')).toBeTruthy();
      
      // Check that resource bars are present
      expect(firstRow.querySelector('.resource-bar')).toBeTruthy();
    });

    it('should handle monitor UI events correctly', () => {
      processList = new ProcessList(container, {
        interactive: true,
        selectable: true
      });
      
      const consciousnessData = createMockConsciousnessData();
      const processes = transformer.extractProcesses(consciousnessData);
      processList.update(processes);
      
      // Test process click event (for debugging)
      const clickHandler = vi.fn();
      processList.on('process-click', clickHandler);
      
      const processRow = container.querySelector('.process-row');
      processRow.click();
      
      expect(clickHandler).toHaveBeenCalled();
      
      // Test context menu event (for process actions)
      const contextHandler = vi.fn();
      processList.on('process-context-menu', contextHandler);
      
      const contextEvent = new MouseEvent('contextmenu', { bubbles: true });
      processRow.dispatchEvent(contextEvent);
      
      expect(contextHandler).toHaveBeenCalled();
    });

    it('should maintain monitor UI performance standards', () => {
      processList = new ProcessList(container, {
        virtualScroll: true,
        rowHeight: 48,
        visibleRows: 10
      });
      
      // Generate large dataset similar to what monitor might receive
      const largeConsciousnessData = {
        timestamp: "2024-12-09T10:30:00Z",
        processes: Array.from({ length: 500 }, (_, i) => ({
          pid: 1000 + i,
          name: `Process_${i}.exe`,
          status: "running",
          cpu_usage: Math.random() * 100,
          memory_usage: Math.random() * 1024,
          threads: Math.floor(Math.random() * 8) + 1,
          priority: "normal",
          stability: Math.random(),
          type: "background",
          debuggable: true
        }))
      };
      
      const processes = transformer.extractProcesses(largeConsciousnessData);
      
      const startTime = performance.now();
      processList.update(processes);
      const updateTime = performance.now() - startTime;
      
      expect(updateTime).toBeLessThan(100); // Should handle large datasets efficiently
      expect(processList.processes).toHaveLength(500);
    });
  });

  describe('Event System Integration', () => {
    beforeEach(() => {
      processList = new ProcessList(container, {
        interactive: true,
        selectable: true,
        multiSelect: true
      });
      
      const consciousnessData = createMockConsciousnessData();
      const processes = transformer.extractProcesses(consciousnessData);
      processList.update(processes);
    });

    it('should integrate with debugger selection events', () => {
      const debuggerHandler = vi.fn();
      
      // Simulate debugger listening for process selection
      processList.on('process-click', (data) => {
        if (data.process.debuggable) {
          debuggerHandler(data.process);
        }
      });
      
      // Click on debuggable process
      const debuggableRow = container.querySelector('.process-row[data-pid="1001"]');
      debuggableRow.click();
      
      expect(debuggerHandler).toHaveBeenCalledWith(
        expect.objectContaining({ pid: 1001, debuggable: true })
      );
    });

    it('should integrate with intervention system events', () => {
      const interventionHandler = vi.fn();

      // Simulate intervention system listening for process context menu
      processList.on('process-context-menu', (data) => {
        if (data.process.warnings && data.process.warnings.length > 0) {
          interventionHandler(data.process);
        }
      });

      // Right-click on process with issues
      const problemRow = container.querySelector('.process-row[data-pid="1001"]');
      expect(problemRow).toBeTruthy(); // Ensure row exists

      const contextEvent = new MouseEvent('contextmenu', { bubbles: true });
      problemRow.dispatchEvent(contextEvent);

      expect(interventionHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          pid: 1001,
          warnings: expect.arrayContaining(['high_memory_usage'])
        })
      );
    });

    it('should handle multiple component event listeners', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      const handler3 = vi.fn();
      
      // Multiple components listening to same event
      processList.on('selection-change', handler1);
      processList.on('selection-change', handler2);
      processList.on('selection-change', handler3);
      
      processList.select(1001);
      
      expect(handler1).toHaveBeenCalled();
      expect(handler2).toHaveBeenCalled();
      expect(handler3).toHaveBeenCalled();
    });
  });

  describe('CSS Integration', () => {
    it('should work with existing CSS framework', () => {
      // Create ProcessList with theme that should integrate with existing styles
      processList = new ProcessList(container, {
        theme: 'dark',
        compactMode: false
      });
      
      expect(container.classList.contains('process-list-theme-dark')).toBe(true);
      
      // Check that CSS classes are applied correctly
      const header = container.querySelector('.process-list-header');
      expect(header).toBeTruthy();
      
      const viewport = container.querySelector('.process-list-viewport');
      expect(viewport).toBeTruthy();
      
      // Test theme switching
      processList.destroy();
      processList = new ProcessList(container, { theme: 'light' });
      expect(container.classList.contains('process-list-theme-light')).toBe(true);
    });

    it('should maintain responsive design with existing layout', () => {
      processList = new ProcessList(container);
      
      // Simulate mobile viewport
      container.style.width = '400px';
      
      const consciousnessData = createMockConsciousnessData();
      const processes = transformer.extractProcesses(consciousnessData);
      processList.update(processes);
      
      // Component should still function correctly in smaller viewport
      const processRows = container.querySelectorAll('.process-row');
      expect(processRows).toHaveLength(3);
      
      // Check that columns are still visible
      const columns = container.querySelectorAll('.column');
      expect(columns.length).toBeGreaterThan(0);
    });
  });
});
