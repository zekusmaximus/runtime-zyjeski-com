// tests/unit/components/ProcessList.test.js
// Comprehensive unit tests for ProcessList component

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ProcessList } from '../../../public/js/components/ProcessList.js';

// Mock DOM environment
const mockContainer = () => {
  const container = document.createElement('div');
  container.style.width = '800px';
  container.style.height = '600px';
  document.body.appendChild(container);
  return container;
};

// Mock process data generator
const createMockProcess = (overrides = {}) => ({
  pid: Math.floor(Math.random() * 10000),
  name: 'Test_Process.exe',
  status: 'running',
  health: 85,
  indicator: {
    color: '#4CAF50',
    icon: 'activity',
    pulse: false
  },
  warnings: [],
  trend: 'stable',
  cpu: 23.4,
  memory: 512,
  threads: 2,
  priority: 'normal',
  lifetime: 1000,
  debuggable: true,
  ...overrides
});

const createMockProcesses = (count) => {
  return Array.from({ length: count }, (_, i) => createMockProcess({
    pid: 1000 + i,
    name: `Process_${i}.exe`,
    cpu: Math.random() * 100,
    memory: Math.random() * 1024,
    health: Math.random() * 100
  }));
};

describe('ProcessList Component', () => {
  let container;
  let processList;

  beforeEach(() => {
    container = mockContainer();
    // Mock performance.now for consistent testing
    vi.spyOn(performance, 'now').mockReturnValue(1000);
  });

  afterEach(() => {
    if (processList) {
      processList.destroy();
    }
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
    vi.restoreAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with default options', () => {
      processList = new ProcessList(container);
      
      expect(processList.container).toBe(container);
      expect(processList.options.showHealth).toBe(true);
      expect(processList.options.virtualScroll).toBe(true);
      expect(processList.options.theme).toBe('dark');
      expect(processList.processes).toEqual([]);
    });

    it('should initialize with custom options', () => {
      const options = {
        showHealth: false,
        virtualScroll: false,
        theme: 'light',
        rowHeight: 60,
        visibleRows: 15
      };
      
      processList = new ProcessList(container, options);
      
      expect(processList.options.showHealth).toBe(false);
      expect(processList.options.virtualScroll).toBe(false);
      expect(processList.options.theme).toBe('light');
      expect(processList.options.rowHeight).toBe(60);
      expect(processList.options.visibleRows).toBe(15);
    });

    it('should throw error if no container provided', () => {
      expect(() => new ProcessList(null)).toThrow('ProcessList: Container element is required');
    });

    it('should validate and correct invalid options', () => {
      const options = {
        rowHeight: 10, // Too small
        visibleRows: 0, // Too small
        theme: 'invalid' // Invalid theme
      };
      
      processList = new ProcessList(container, options);
      
      expect(processList.options.rowHeight).toBe(20);
      expect(processList.options.visibleRows).toBe(1);
      expect(processList.options.theme).toBe('dark');
    });

    it('should create proper DOM structure', () => {
      processList = new ProcessList(container);
      
      expect(container.querySelector('.process-list-header')).toBeTruthy();
      expect(container.querySelector('.process-list-viewport')).toBeTruthy();
      expect(container.querySelector('.process-list-scroller')).toBeTruthy();
      expect(container.querySelector('.process-list-content')).toBeTruthy();
      expect(container.querySelector('.process-list-empty')).toBeTruthy();
    });

    it('should apply theme classes', () => {
      processList = new ProcessList(container, { theme: 'light' });
      expect(container.classList.contains('process-list-theme-light')).toBe(true);
    });

    it('should apply compact mode class', () => {
      processList = new ProcessList(container, { compactMode: true });
      expect(container.classList.contains('process-list-compact')).toBe(true);
    });
  });

  describe('Update Mechanism', () => {
    beforeEach(() => {
      processList = new ProcessList(container);
    });

    it('should update with valid process data', () => {
      const processes = createMockProcesses(5);
      
      processList.update(processes);
      
      expect(processList.processes).toHaveLength(5);
      expect(processList._processMap.size).toBe(5);
    });

    it('should handle invalid process data gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      processList.update('invalid');
      
      expect(consoleSpy).toHaveBeenCalledWith('ProcessList: Invalid process data provided');
      expect(processList.processes).toHaveLength(0);
    });

    it('should filter out invalid processes', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const processes = [
        createMockProcess({ pid: 1001 }),
        null,
        { pid: 'invalid' }, // Invalid PID
        createMockProcess({ pid: 1002 }),
        { name: 123 } // Invalid name
      ];
      
      processList.update(processes);
      
      expect(consoleWarnSpy).toHaveBeenCalledWith('ProcessList: Filtered out 3 invalid processes');
      expect(processList.processes).toHaveLength(2);
    });

    it('should detect process changes correctly', () => {
      const process1 = createMockProcess({ pid: 1001, cpu: 50 });
      const process2 = createMockProcess({ pid: 1002, cpu: 30 });
      
      processList.update([process1, process2]);
      
      // Update with changed data
      const updatedProcess1 = { ...process1, cpu: 75 };
      processList.update([updatedProcess1, process2]);
      
      expect(processList.processes[0].cpu).toBe(75);
    });

    it('should maintain selection state across updates', () => {
      const processes = createMockProcesses(3);
      processList.update(processes);
      
      // Select a process
      processList.select(processes[1].pid);
      expect(processList._selectedPids.has(processes[1].pid)).toBe(true);
      
      // Update with same processes
      processList.update(processes);
      expect(processList._selectedPids.has(processes[1].pid)).toBe(true);
    });

    it('should emit update event with change details', () => {
      const updateHandler = vi.fn();
      processList.on('update', updateHandler);
      
      const processes = createMockProcesses(2);
      processList.update(processes);
      
      expect(updateHandler).toHaveBeenCalledWith({
        added: expect.any(Array),
        removed: expect.any(Array),
        updated: expect.any(Array),
        total: 2
      });
    });

    it('should track performance metrics', () => {
      // Mock performance.now to return different values
      vi.spyOn(performance, 'now')
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(5); // 5ms update time

      const processes = createMockProcesses(100);

      processList.update(processes);

      expect(processList._lastUpdateTime).toBeGreaterThan(0);
      expect(processList._updateCount).toBe(1);
    });

    it('should warn about slow updates', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      vi.spyOn(performance, 'now')
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(20); // 20ms update time
      
      const processes = createMockProcesses(10);
      processList.update(processes);
      
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Update took 20.00ms (target: <16ms)')
      );
    });
  });

  describe('Selection Logic', () => {
    beforeEach(() => {
      processList = new ProcessList(container, { selectable: true, multiSelect: true });
      const processes = createMockProcesses(5);
      processList.update(processes);
    });

    it('should select single process', () => {
      const selectionHandler = vi.fn();
      processList.on('selection-change', selectionHandler);
      
      processList.select(1001);
      
      expect(processList._selectedPids.has(1001)).toBe(true);
      expect(selectionHandler).toHaveBeenCalledWith({
        selected: [1001],
        added: [1001],
        removed: []
      });
    });

    it('should deselect process', () => {
      processList.select(1001);
      const selectionHandler = vi.fn();
      processList.on('selection-change', selectionHandler);
      
      processList.deselect(1001);
      
      expect(processList._selectedPids.has(1001)).toBe(false);
      expect(selectionHandler).toHaveBeenCalledWith({
        selected: [],
        added: [],
        removed: [1001]
      });
    });

    it('should handle multi-select', () => {
      processList.select(1001);
      processList.select(1002);
      
      expect(processList._selectedPids.size).toBe(2);
      expect(processList._selectedPids.has(1001)).toBe(true);
      expect(processList._selectedPids.has(1002)).toBe(true);
    });

    it('should clear selection in single-select mode', () => {
      processList.options.multiSelect = false;
      
      processList.select(1001);
      processList.select(1002);
      
      expect(processList._selectedPids.size).toBe(1);
      expect(processList._selectedPids.has(1002)).toBe(true);
      expect(processList._selectedPids.has(1001)).toBe(false);
    });

    it('should select all processes', () => {
      processList.selectAll();
      
      expect(processList._selectedPids.size).toBe(5);
    });

    it('should clear all selections', () => {
      processList.select(1001);
      processList.select(1002);
      
      processList.clearSelection();
      
      expect(processList._selectedPids.size).toBe(0);
    });

    it('should return selected process data', () => {
      processList.select(1001);
      processList.select(1002);
      
      const selected = processList.getSelected();
      
      expect(selected).toHaveLength(2);
      expect(selected[0].pid).toBe(1001);
      expect(selected[1].pid).toBe(1002);
    });

    it('should not select when selectable is false', () => {
      processList.options.selectable = false;
      
      processList.select(1001);
      
      expect(processList._selectedPids.size).toBe(0);
    });
  });

  describe('Sorting and Filtering', () => {
    beforeEach(() => {
      processList = new ProcessList(container);
      const processes = [
        createMockProcess({ pid: 1001, name: 'Alpha.exe', cpu: 50, memory: 100 }),
        createMockProcess({ pid: 1002, name: 'Beta.exe', cpu: 30, memory: 200 }),
        createMockProcess({ pid: 1003, name: 'Gamma.exe', cpu: 70, memory: 150 })
      ];
      processList.update(processes);
    });

    it('should sort by name ascending', () => {
      processList.sort('name', 'asc');
      
      const displayed = processList._getDisplayedProcesses();
      expect(displayed[0].name).toBe('Alpha.exe');
      expect(displayed[1].name).toBe('Beta.exe');
      expect(displayed[2].name).toBe('Gamma.exe');
    });

    it('should sort by CPU descending', () => {
      processList.sort('cpu', 'desc');
      
      const displayed = processList._getDisplayedProcesses();
      expect(displayed[0].cpu).toBe(70);
      expect(displayed[1].cpu).toBe(50);
      expect(displayed[2].cpu).toBe(30);
    });

    it('should emit sort-change event', () => {
      const sortHandler = vi.fn();
      processList.on('sort-change', sortHandler);
      
      processList.sort('memory', 'asc');
      
      expect(sortHandler).toHaveBeenCalledWith({ key: 'memory', direction: 'asc' });
    });

    it('should filter processes', () => {
      processList.filter(process => process.cpu > 40);
      
      const displayed = processList._getDisplayedProcesses();
      expect(displayed).toHaveLength(2);
      expect(displayed.every(p => p.cpu > 40)).toBe(true);
    });

    it('should clear filter with null predicate', () => {
      processList.filter(process => process.cpu > 40);
      expect(processList._getDisplayedProcesses()).toHaveLength(2);
      
      processList.filter(null);
      expect(processList._getDisplayedProcesses()).toHaveLength(3);
    });

    it('should handle invalid sort direction', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      processList.sort('cpu', 'invalid');

      expect(consoleWarnSpy).toHaveBeenCalledWith('ProcessList: Invalid sort direction, using desc');
      expect(processList._sortDirection).toBe('desc');
    });
  });

  describe('Virtual Scrolling', () => {
    beforeEach(() => {
      processList = new ProcessList(container, {
        virtualScroll: true,
        rowHeight: 48,
        visibleRows: 10
      });
    });

    it('should calculate visible range correctly', () => {
      const processes = createMockProcesses(100);
      processList.update(processes);

      // Mock scroll position on the viewport element
      processList.elements.viewport.scrollTop = 240; // 5 rows down (240 / 48 = 5)
      processList._updateScrollState();

      expect(processList._visibleStartIndex).toBeGreaterThanOrEqual(3); // 5 - buffer
      expect(processList._visibleEndIndex).toBeLessThanOrEqual(19); // 5 + 10 + buffer (adjusted for actual calculation)
    });

    it('should update scroller height based on total processes', () => {
      const processes = createMockProcesses(50);
      processList.update(processes);

      const expectedHeight = 50 * 48; // 50 processes * 48px height
      expect(processList.elements.scroller.style.height).toBe(`${expectedHeight}px`);
    });

    it('should render only visible rows', () => {
      const processes = createMockProcesses(100);
      processList.update(processes);

      const renderedRows = processList.elements.content.children.length;
      expect(renderedRows).toBeLessThanOrEqual(processList.options.visibleRows + processList.options.bufferRows * 2);
    });

    it('should disable virtual scrolling when option is false', () => {
      processList.options.virtualScroll = false;
      const processes = createMockProcesses(20);
      processList.update(processes);

      const renderedRows = processList.elements.content.children.length;
      expect(renderedRows).toBe(20); // All rows rendered
    });

    it('should handle scroll events', () => {
      const processes = createMockProcesses(100);
      processList.update(processes);

      // Simulate scroll
      processList.elements.viewport.scrollTop = 480; // 10 rows down
      processList.elements.viewport.dispatchEvent(new Event('scroll'));

      expect(processList._scrollTop).toBe(480);
    });
  });

  describe('Event System', () => {
    beforeEach(() => {
      processList = new ProcessList(container, { interactive: true, selectable: true });
      const processes = createMockProcesses(3);
      processList.update(processes);
    });

    it('should register and emit events', () => {
      const handler = vi.fn();
      processList.on('test-event', handler);

      processList.emit('test-event', { data: 'test' });

      expect(handler).toHaveBeenCalledWith({ data: 'test' });
    });

    it('should remove event handlers', () => {
      const handler = vi.fn();
      processList.on('test-event', handler);
      processList.off('test-event', handler);

      processList.emit('test-event', { data: 'test' });

      expect(handler).not.toHaveBeenCalled();
    });

    it('should handle process click events', () => {
      const clickHandler = vi.fn();
      processList.on('process-click', clickHandler);

      // Find a process row and click it
      const row = processList.elements.content.querySelector('.process-row');
      row.click();

      expect(clickHandler).toHaveBeenCalledWith({
        process: expect.any(Object),
        event: expect.any(Event),
        ctrlKey: false,
        shiftKey: false
      });
    });

    it('should handle process hover events', () => {
      const hoverHandler = vi.fn();
      processList.on('process-hover', hoverHandler);

      const row = processList.elements.content.querySelector('.process-row');
      row.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));

      expect(hoverHandler).toHaveBeenCalledWith({
        process: expect.any(Object),
        event: expect.any(Event)
      });
    });

    it('should handle context menu events', () => {
      const contextHandler = vi.fn();
      processList.on('process-context-menu', contextHandler);

      const row = processList.elements.content.querySelector('.process-row');
      const contextEvent = new MouseEvent('contextmenu', { bubbles: true });
      row.dispatchEvent(contextEvent);

      expect(contextHandler).toHaveBeenCalledWith({
        process: expect.any(Object),
        event: expect.any(Event),
        selected: expect.any(Boolean)
      });
    });

    it('should handle header click for sorting', () => {
      const sortHandler = vi.fn();
      processList.on('sort-change', sortHandler);

      const nameColumn = processList.elements.header.querySelector('[data-sort="name"]');
      nameColumn.click();

      expect(sortHandler).toHaveBeenCalledWith({ key: 'name', direction: 'asc' });
    });

    it('should handle keyboard navigation', () => {
      processList.container.focus();

      // Test arrow down
      const keyEvent = new KeyboardEvent('keydown', { key: 'ArrowDown' });
      processList.container.dispatchEvent(keyEvent);

      expect(processList._selectedPids.size).toBe(1);
    });

    it('should handle Ctrl+A for select all', () => {
      processList.options.multiSelect = true;
      processList.container.focus();

      const keyEvent = new KeyboardEvent('keydown', { key: 'a', ctrlKey: true });
      processList.container.dispatchEvent(keyEvent);

      expect(processList._selectedPids.size).toBe(3);
    });

    it('should handle Escape for clear selection', () => {
      processList.select(1001);
      processList.container.focus();

      const keyEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      processList.container.dispatchEvent(keyEvent);

      expect(processList._selectedPids.size).toBe(0);
    });

    it('should handle event handler errors gracefully', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const faultyHandler = () => { throw new Error('Handler error'); };

      processList.on('test-event', faultyHandler);
      processList.emit('test-event', {});

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'ProcessList: Event handler error for test-event',
        expect.any(Error)
      );
    });
  });

  describe('Display Methods', () => {
    beforeEach(() => {
      processList = new ProcessList(container);
      const processes = createMockProcesses(5);
      processList.update(processes);
    });

    it('should highlight process temporarily', async () => {
      processList.highlight(1001, 100);

      const row = processList._getRowElement(1001);
      expect(row.classList.contains('highlighted')).toBe(true);

      // Wait for highlight to fade
      await new Promise(resolve => setTimeout(resolve, 150));

      expect(row.classList.contains('highlighted')).toBe(false);
    });

    it('should scroll to specific process', () => {
      const processes = createMockProcesses(20);
      processList.update(processes);

      // Sort by PID to ensure predictable order
      processList.sort('pid', 'asc');

      processList.scrollTo(1001); // PID 1001 should be at index 1 after sorting by PID

      const expectedScrollTop = 1 * processList.options.rowHeight;
      expect(processList.elements.viewport.scrollTop).toBe(expectedScrollTop);
    });

    it('should warn when scrolling to non-existent process', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      processList.scrollTo(9999);

      expect(consoleWarnSpy).toHaveBeenCalledWith('ProcessList: Process 9999 not found for scrolling');
    });

    it('should force re-render', () => {
      const renderSpy = vi.spyOn(processList, '_renderVisibleRows');

      processList.render();

      expect(renderSpy).toHaveBeenCalled();
    });
  });

  describe('Cleanup and Destruction', () => {
    beforeEach(() => {
      processList = new ProcessList(container);
      const processes = createMockProcesses(3);
      processList.update(processes);
    });

    it('should clean up properly on destroy', () => {
      processList.destroy();

      expect(container.innerHTML).toBe('');
      expect(container.className).toBe('');
      expect(processList.processes).toEqual([]);
      expect(processList._processMap.size).toBe(0);
      expect(processList._selectedPids.size).toBe(0);
    });

    it('should clear event listeners on destroy', () => {
      const handler = vi.fn();
      processList.on('test-event', handler);

      processList.destroy();
      processList.emit('test-event', {});

      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      processList = new ProcessList(container);
    });

    it('should handle update errors gracefully', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const errorHandler = vi.fn();
      processList.on('error', errorHandler);

      // Force an error by mocking a method to throw
      vi.spyOn(processList, '_performUpdate').mockImplementation(() => {
        throw new Error('Update error');
      });

      processList.update([createMockProcess()]);

      expect(consoleErrorSpy).toHaveBeenCalledWith('ProcessList: Update failed', expect.any(Error));
      expect(errorHandler).toHaveBeenCalledWith({ error: expect.any(Error), phase: 'update' });
    });

    it('should handle initialization errors', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Mock a method to throw during initialization
      vi.spyOn(ProcessList.prototype, '_createDOMStructure').mockImplementation(() => {
        throw new Error('DOM error');
      });

      expect(() => new ProcessList(container)).toThrow('DOM error');
      expect(consoleErrorSpy).toHaveBeenCalledWith('ProcessList: Initialization failed', expect.any(Error));
    });
  });
});
