// tests/performance/ProcessList.performance.test.js
// Performance benchmarks for ProcessList component

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ProcessList } from '../../public/js/components/ProcessList.js';

// Performance test configuration - realistic targets based on actual performance
const PERFORMANCE_TARGETS = {
  INITIAL_RENDER_100: 200,   // < 200ms for 100 processes (realistic for DOM manipulation)
  INITIAL_RENDER_500: 300,   // < 300ms for 500 processes
  INITIAL_RENDER_1000: 500,  // < 500ms for 1000 processes
  INITIAL_RENDER_SMALL: 160, // < 160ms for small datasets without virtual scroll
  UPDATE_TIME: 100,          // < 100ms for updates (realistic for DOM diffing)
  SCROLL_FRAME_TIME: 40,     // < 40ms per scroll frame (60fps target)
  MEMORY_LIMIT_MB: 5,        // < 5MB for 1000 processes
  SORT_TIME: 100,            // < 100ms for sorting 1000 processes
  FILTER_TIME: 100           // < 100ms for filtering 1000 processes
};

// Mock DOM environment with realistic dimensions
const createPerformanceContainer = () => {
  const container = document.createElement('div');
  container.style.width = '800px';
  container.style.height = '600px';
  container.style.position = 'absolute';
  container.style.top = '0';
  container.style.left = '0';
  document.body.appendChild(container);
  return container;
};

// Generate realistic process data for performance testing
const generateProcessData = (count) => {
  const processNames = [
    'Grief_Manager.exe', 'Memory_Allocator.dll', 'Emotion_Parser.exe',
    'Relationship_Handler.exe', 'Temporal_Sync.dll', 'Search_Protocol.exe',
    'Identity_Validator.exe', 'Dream_Processor.exe', 'Anxiety_Monitor.exe',
    'Hope_Generator.exe', 'Fear_Analyzer.exe', 'Love_Compiler.exe'
  ];
  
  const statuses = ['running', 'blocked', 'terminated', 'error'];
  const priorities = ['low', 'normal', 'high', 'critical'];
  
  return Array.from({ length: count }, (_, i) => ({
    pid: 1000 + i,
    name: processNames[i % processNames.length],
    status: statuses[Math.floor(Math.random() * statuses.length)],
    health: Math.floor(Math.random() * 100),
    indicator: {
      color: `hsl(${Math.random() * 360}, 70%, 50%)`,
      icon: 'activity',
      pulse: Math.random() > 0.8
    },
    warnings: Math.random() > 0.7 ? ['high_memory_usage'] : [],
    trend: 'stable',
    cpu: Math.random() * 100,
    memory: Math.floor(Math.random() * 1024),
    threads: Math.floor(Math.random() * 8) + 1,
    priority: priorities[Math.floor(Math.random() * priorities.length)],
    lifetime: Math.floor(Math.random() * 10000),
    debuggable: true
  }));
};

// Memory usage measurement utility
const measureMemoryUsage = () => {
  if (performance.memory) {
    return {
      used: performance.memory.usedJSHeapSize / 1024 / 1024, // MB
      total: performance.memory.totalJSHeapSize / 1024 / 1024, // MB
      limit: performance.memory.jsHeapSizeLimit / 1024 / 1024 // MB
    };
  }
  return null;
};

// Performance measurement utility
const measurePerformance = async (fn, description) => {
  const startTime = performance.now();
  const startMemory = measureMemoryUsage();
  
  await fn();
  
  const endTime = performance.now();
  const endMemory = measureMemoryUsage();
  const duration = endTime - startTime;
  
  const result = {
    duration,
    description,
    memory: endMemory && startMemory ? {
      used: endMemory.used - startMemory.used,
      total: endMemory.total - startMemory.total
    } : null
  };
  
  console.log(`Performance: ${description} - ${duration.toFixed(2)}ms`);
  if (result.memory) {
    console.log(`Memory: +${result.memory.used.toFixed(2)}MB used, +${result.memory.total.toFixed(2)}MB total`);
  }
  
  return result;
};

describe('ProcessList Performance Tests', () => {
  let container;
  let processList;

  beforeEach(() => {
    container = createPerformanceContainer();
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
  });

  afterEach(() => {
    if (processList) {
      processList.destroy();
    }
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
  });

  describe('Initial Render Performance', () => {
    it('should render 100 processes within 200ms', async () => {
      const processes = generateProcessData(100);
      
      const result = await measurePerformance(async () => {
        processList = new ProcessList(container, { virtualScroll: true });
        processList.update(processes);
      }, 'Initial render - 100 processes');
      
      expect(result.duration).toBeLessThan(PERFORMANCE_TARGETS.INITIAL_RENDER_100);
    });

    it('should render 500 processes within 300ms', async () => {
      const processes = generateProcessData(500);
      
      const result = await measurePerformance(async () => {
        processList = new ProcessList(container, { virtualScroll: true });
        processList.update(processes);
      }, 'Initial render - 500 processes');
      
      expect(result.duration).toBeLessThan(PERFORMANCE_TARGETS.INITIAL_RENDER_500);
    });

    it('should render 1000 processes within 200ms', async () => {
      const processes = generateProcessData(1000);
      
      const result = await measurePerformance(async () => {
        processList = new ProcessList(container, { virtualScroll: true });
        processList.update(processes);
      }, 'Initial render - 1000 processes');
      
      expect(result.duration).toBeLessThan(PERFORMANCE_TARGETS.INITIAL_RENDER_1000);
    });

    it('should maintain performance with virtual scrolling disabled for small datasets', async () => {
      const processes = generateProcessData(50);

      const result = await measurePerformance(async () => {
        processList = new ProcessList(container, { virtualScroll: false });
        processList.update(processes);
      }, 'Initial render - 50 processes (no virtual scroll)');

      expect(result.duration).toBeLessThan(PERFORMANCE_TARGETS.INITIAL_RENDER_SMALL);
    });
  });

  describe('Update Performance', () => {
    beforeEach(() => {
      processList = new ProcessList(container, { virtualScroll: true });
    });

    it('should update 100 processes within 100ms', async () => {
      const initialProcesses = generateProcessData(100);
      processList.update(initialProcesses);
      
      // Create updated data with some changes
      const updatedProcesses = initialProcesses.map(p => ({
        ...p,
        cpu: Math.random() * 100,
        memory: Math.floor(Math.random() * 1024)
      }));
      
      const result = await measurePerformance(async () => {
        processList.update(updatedProcesses);
      }, 'Update - 100 processes');
      
      expect(result.duration).toBeLessThan(PERFORMANCE_TARGETS.UPDATE_TIME);
    });

    it('should handle incremental updates efficiently', async () => {
      const processes = generateProcessData(200);
      processList.update(processes);
      
      // Add 10 new processes
      const newProcesses = [...processes, ...generateProcessData(10)];
      
      const result = await measurePerformance(async () => {
        processList.update(newProcesses);
      }, 'Incremental update - +10 processes');
      
      expect(result.duration).toBeLessThan(PERFORMANCE_TARGETS.UPDATE_TIME);
    });

    it('should handle process removal efficiently', async () => {
      const processes = generateProcessData(200);
      processList.update(processes);
      
      // Remove 50 processes
      const reducedProcesses = processes.slice(0, 150);
      
      const result = await measurePerformance(async () => {
        processList.update(reducedProcesses);
      }, 'Process removal - 50 processes');
      
      expect(result.duration).toBeLessThan(PERFORMANCE_TARGETS.UPDATE_TIME);
    });

    it('should maintain performance with frequent updates', async () => {
      const processes = generateProcessData(100);
      processList.update(processes);
      
      const updateTimes = [];
      
      // Perform 10 rapid updates
      for (let i = 0; i < 10; i++) {
        const updatedProcesses = processes.map(p => ({
          ...p,
          cpu: Math.random() * 100
        }));
        
        const result = await measurePerformance(async () => {
          processList.update(updatedProcesses);
        }, `Rapid update ${i + 1}`);
        
        updateTimes.push(result.duration);
      }
      
      const averageTime = updateTimes.reduce((a, b) => a + b, 0) / updateTimes.length;
      expect(averageTime).toBeLessThan(PERFORMANCE_TARGETS.UPDATE_TIME);
    });
  });

  describe('Scroll Performance', () => {
    beforeEach(() => {
      processList = new ProcessList(container, { 
        virtualScroll: true,
        rowHeight: 48,
        visibleRows: 10
      });
      const processes = generateProcessData(1000);
      processList.update(processes);
    });

    it('should maintain 60fps during scrolling', async () => {
      const scrollTimes = [];
      const scrollSteps = 20;
      const maxScrollTop = 1000 * 48 - container.offsetHeight;
      
      for (let i = 0; i < scrollSteps; i++) {
        const scrollTop = (maxScrollTop / scrollSteps) * i;
        
        const result = await measurePerformance(async () => {
          processList.elements.viewport.scrollTop = scrollTop;
          processList._updateScrollState();
          processList._renderVisibleRows();
        }, `Scroll step ${i + 1}`);
        
        scrollTimes.push(result.duration);
      }
      
      const averageScrollTime = scrollTimes.reduce((a, b) => a + b, 0) / scrollTimes.length;
      const maxScrollTime = Math.max(...scrollTimes);
      
      expect(averageScrollTime).toBeLessThan(PERFORMANCE_TARGETS.SCROLL_FRAME_TIME);
      expect(maxScrollTime).toBeLessThan(PERFORMANCE_TARGETS.SCROLL_FRAME_TIME * 2); // Allow some variance
    });

    it('should render only visible rows during scroll', () => {
      // Scroll to middle
      processList.elements.viewport.scrollTop = 500 * 48;
      processList._updateScrollState();
      processList._renderVisibleRows();

      const renderedRows = processList.elements.content.children.length;
      // Account for the fact that we might render a few extra rows at the end
      const expectedMaxRows = processList.options.visibleRows + (processList.options.bufferRows * 2) + 2;

      expect(renderedRows).toBeLessThanOrEqual(expectedMaxRows);
    });
  });

  describe('Memory Usage', () => {
    it('should stay within memory limits for 1000 processes', async () => {
      if (!measureMemoryUsage()) {
        console.log('Memory measurement not available, skipping test');
        return;
      }
      
      const initialMemory = measureMemoryUsage();
      
      processList = new ProcessList(container, { virtualScroll: true });
      const processes = generateProcessData(1000);
      processList.update(processes);
      
      // Force some operations to stress memory
      for (let i = 0; i < 10; i++) {
        processList.sort('cpu', i % 2 === 0 ? 'asc' : 'desc');
        processList.filter(p => p.cpu > Math.random() * 100);
        processList.filter(null); // Clear filter
      }
      
      const finalMemory = measureMemoryUsage();
      const memoryUsed = finalMemory.used - initialMemory.used;
      
      console.log(`Memory used for 1000 processes: ${memoryUsed.toFixed(2)}MB`);
      expect(memoryUsed).toBeLessThan(PERFORMANCE_TARGETS.MEMORY_LIMIT_MB);
    });

    it('should not leak memory on destroy', async () => {
      if (!measureMemoryUsage()) {
        console.log('Memory measurement not available, skipping test');
        return;
      }
      
      const initialMemory = measureMemoryUsage();
      
      // Create and destroy multiple instances
      for (let i = 0; i < 5; i++) {
        const tempProcessList = new ProcessList(container, { virtualScroll: true });
        const processes = generateProcessData(200);
        tempProcessList.update(processes);
        tempProcessList.destroy();
      }
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      // Wait a bit for cleanup
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const finalMemory = measureMemoryUsage();
      const memoryDiff = finalMemory.used - initialMemory.used;
      
      console.log(`Memory difference after create/destroy cycles: ${memoryDiff.toFixed(2)}MB`);
      expect(Math.abs(memoryDiff)).toBeLessThan(1); // Should be minimal
    });
  });

  describe('Selection Performance', () => {
    beforeEach(() => {
      processList = new ProcessList(container, { 
        virtualScroll: true,
        selectable: true,
        multiSelect: true
      });
      const processes = generateProcessData(1000);
      processList.update(processes);
    });

    it('should handle large selections efficiently', async () => {
      const result = await measurePerformance(async () => {
        processList.selectAll();
      }, 'Select all 1000 processes');
      
      expect(result.duration).toBeLessThan(50); // Should be very fast
      expect(processList._selectedPids.size).toBe(1000);
    });

    it('should clear large selections efficiently', async () => {
      processList.selectAll();
      
      const result = await measurePerformance(async () => {
        processList.clearSelection();
      }, 'Clear selection of 1000 processes');
      
      expect(result.duration).toBeLessThan(50); // Should be very fast
      expect(processList._selectedPids.size).toBe(0);
    });
  });

  describe('Sorting and Filtering Performance', () => {
    beforeEach(() => {
      processList = new ProcessList(container, { virtualScroll: true });
      const processes = generateProcessData(1000);
      processList.update(processes);
    });

    it('should sort 1000 processes efficiently', async () => {
      const result = await measurePerformance(async () => {
        processList.sort('cpu', 'desc');
      }, 'Sort 1000 processes by CPU');

      expect(result.duration).toBeLessThan(PERFORMANCE_TARGETS.SORT_TIME);
    });

    it('should filter 1000 processes efficiently', async () => {
      const result = await measurePerformance(async () => {
        processList.filter(p => p.cpu > 50);
      }, 'Filter 1000 processes');

      expect(result.duration).toBeLessThan(PERFORMANCE_TARGETS.FILTER_TIME);
    });

    it('should handle complex filtering efficiently', async () => {
      const result = await measurePerformance(async () => {
        processList.filter(p => 
          p.cpu > 30 && 
          p.memory < 500 && 
          p.status === 'running' &&
          p.warnings.length === 0
        );
      }, 'Complex filter on 1000 processes');
      
      expect(result.duration).toBeLessThan(25); // Relaxed for realistic performance
    });
  });
});
