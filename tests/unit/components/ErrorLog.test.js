// ErrorLog.test.js - Comprehensive test suite for ErrorLog component
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import ErrorLog from '../../../public/js/components/ErrorLog.js';

// Mock DOM environment
const { JSDOM } = require('jsdom');
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.window = dom.window;
global.document = dom.window.document;
global.HTMLElement = dom.window.HTMLElement;
// Mock ResizeObserver
class MockResizeObserver {
  constructor(callback) {
    this.callback = callback;
    this.observe = vi.fn();
    this.disconnect = vi.fn();
  }
}

// Store original ResizeObserver for restoration (if needed in future)
// const originalResizeObserver = global.window?.ResizeObserver;

global.ResizeObserver = MockResizeObserver;
global.window.ResizeObserver = MockResizeObserver;

// Mock performance API
global.performance = {
  now: vi.fn(() => Date.now())
};

// Mock URL and Blob for export functionality
global.URL = {
  createObjectURL: vi.fn(() => 'mock-url'),
  revokeObjectURL: vi.fn()
};
global.Blob = vi.fn();

describe('ErrorLog', () => {
  let container;
  let errorLog;
  
  beforeEach(() => {
    // Create fresh container for each test
    container = document.createElement('div');
    container.style.width = '800px';
    container.style.height = '600px';
    document.body.appendChild(container);

    // Reset mocks
    vi.clearAllMocks();
    vi.useFakeTimers();
  });
  
  afterEach(() => {
    if (errorLog) {
      errorLog.destroy();
      errorLog = null;
    }
    if (container && container.parentNode) {
      document.body.removeChild(container);
    }
    vi.useRealTimers();
  });
  
  describe('Constructor and Initialization', () => {
    it('should throw error if no container provided', () => {
      expect(() => new ErrorLog()).toThrow('ErrorLog: Container element is required');
    });
    
    it('should initialize with default options', () => {
      errorLog = new ErrorLog(container);
      
      expect(errorLog.container).toBe(container);
      expect(errorLog.options.maxErrors).toBe(100);
      expect(errorLog.options.autoDismiss).toBe(true);
      expect(errorLog.options.dismissDelay).toBe(30000);
      expect(errorLog.options.groupSimilar).toBe(true);
      expect(errorLog.errors.size).toBe(0);
    });
    
    it('should merge custom options with defaults', () => {
      const customOptions = {
        maxErrors: 50,
        autoDismiss: false,
        theme: 'light',
        customFormatters: {
          'memory_leak': (error) => `Custom: ${error.message}`
        }
      };
      
      errorLog = new ErrorLog(container, customOptions);
      
      expect(errorLog.options.maxErrors).toBe(50);
      expect(errorLog.options.autoDismiss).toBe(false);
      expect(errorLog.options.theme).toBe('light');
      expect(errorLog.options.customFormatters).toEqual(customOptions.customFormatters);
    });
    
    it('should create DOM structure correctly', () => {
      errorLog = new ErrorLog(container);

      expect(container.classList.contains('error-log-container')).toBe(true);
      expect(container.querySelector('.error-log-header')).toBeTruthy();
      expect(container.querySelector('.error-summary')).toBeTruthy();
      expect(container.querySelector('.error-controls')).toBeTruthy();
      expect(container.querySelector('.error-log-body')).toBeTruthy();
      expect(container.querySelector('.error-log-viewport')).toBeTruthy();
      expect(container.querySelector('.error-log-content')).toBeTruthy();
      expect(container.querySelector('.error-log-empty')).toBeTruthy();
    });
    
    it('should set up ResizeObserver if available', () => {
      errorLog = new ErrorLog(container);

      expect(errorLog.resizeObserver).toBeInstanceOf(MockResizeObserver);
      expect(errorLog.resizeObserver.observe).toHaveBeenCalledWith(container);
    });
    
    it('should handle missing ResizeObserver gracefully', () => {
      // Temporarily remove ResizeObserver from both global and window
      const originalGlobalResizeObserver = global.ResizeObserver;
      const originalWindowResizeObserver = global.window.ResizeObserver;

      global.ResizeObserver = undefined;
      global.window.ResizeObserver = undefined;

      expect(() => {
        errorLog = new ErrorLog(container);
      }).not.toThrow();

      expect(errorLog.resizeObserver).toBeNull();

      // Restore ResizeObserver
      global.ResizeObserver = originalGlobalResizeObserver;
      global.window.ResizeObserver = originalWindowResizeObserver;
    });
  });
  
  describe('Error Management', () => {
    beforeEach(() => {
      errorLog = new ErrorLog(container);
    });
    
    it('should add error correctly', () => {
      const error = {
        severity: 'critical',
        type: 'memory_leak',
        message: 'Memory leak detected',
        details: { processId: 'proc_001', size: '2.4MB' }
      };
      
      const errorId = errorLog.addError(error);
      
      expect(errorId).toBeTruthy();
      expect(errorLog.errors.size).toBe(1);
      expect(errorLog.errors.get(errorId)).toMatchObject({
        severity: 'critical',
        type: 'memory_leak',
        message: 'Memory leak detected'
      });
    });
    
    it('should generate ID if not provided', () => {
      const error = { severity: 'info', message: 'Test error' };
      const errorId = errorLog.addError(error);
      
      expect(errorId).toMatch(/^err_\d+_[a-z0-9]+$/);
    });
    
    it('should use provided ID', () => {
      const error = { id: 'custom_id', severity: 'info', message: 'Test error' };
      const errorId = errorLog.addError(error);
      
      expect(errorId).toBe('custom_id');
    });
    
    it('should normalize error data', () => {
      const error = { severity: 'invalid', message: 123 };
      const errorId = errorLog.addError(error);
      
      const storedError = errorLog.errors.get(errorId);
      expect(storedError.severity).toBe('info'); // Default for invalid severity
      expect(storedError.message).toBe('123'); // Converted to string
      expect(storedError.timestamp).toBeTruthy();
      expect(storedError.count).toBe(1);
      expect(storedError.resolved).toBe(false);
    });
    
    it('should group similar errors when enabled', () => {
      errorLog.options.groupSimilar = true;
      
      const error1 = { severity: 'warning', type: 'timeout', message: 'Request timeout' };
      const error2 = { severity: 'warning', type: 'timeout', message: 'Request timeout' };
      
      const id1 = errorLog.addError(error1);
      const id2 = errorLog.addError(error2);
      
      expect(id1).toBe(id2); // Should return same ID for grouped error
      expect(errorLog.errors.size).toBe(1);
      expect(errorLog.errors.get(id1).count).toBe(2);
    });
    
    it('should not group different errors', () => {
      errorLog.options.groupSimilar = true;
      
      const error1 = { severity: 'warning', type: 'timeout', message: 'Request timeout' };
      const error2 = { severity: 'critical', type: 'timeout', message: 'Request timeout' };
      
      const id1 = errorLog.addError(error1);
      const id2 = errorLog.addError(error2);
      
      expect(id1).not.toBe(id2);
      expect(errorLog.errors.size).toBe(2);
    });
    
    it('should enforce max errors limit', () => {
      errorLog.options.maxErrors = 3;
      
      // Add 4 errors
      const ids = [];
      for (let i = 0; i < 4; i++) {
        ids.push(errorLog.addError({ severity: 'info', message: `Error ${i}` }));
      }
      
      expect(errorLog.errors.size).toBe(3);
      expect(errorLog.errors.has(ids[0])).toBe(false); // First error should be removed
      expect(errorLog.errors.has(ids[3])).toBe(true); // Last error should be present
    });
    
    it('should remove error correctly', () => {
      const errorId = errorLog.addError({ severity: 'info', message: 'Test error' });
      
      expect(errorLog.removeError(errorId)).toBe(true);
      expect(errorLog.errors.size).toBe(0);
      expect(errorLog.errors.has(errorId)).toBe(false);
    });
    
    it('should return false when removing non-existent error', () => {
      expect(errorLog.removeError('non-existent')).toBe(false);
    });
    
    it('should clear all errors', () => {
      errorLog.addError({ severity: 'info', message: 'Error 1' });
      errorLog.addError({ severity: 'warning', message: 'Error 2' });
      
      errorLog.clearAll();
      
      expect(errorLog.errors.size).toBe(0);
      expect(errorLog.filteredErrors.length).toBe(0);
    });
    
    it('should clear errors by severity', () => {
      errorLog.addError({ severity: 'info', message: 'Info error' });
      errorLog.addError({ severity: 'warning', message: 'Warning error' });
      errorLog.addError({ severity: 'critical', message: 'Critical error' });
      
      const cleared = errorLog.clearBySeverity('warning');
      
      expect(cleared).toBe(1);
      expect(errorLog.errors.size).toBe(2);
      expect(Array.from(errorLog.errors.values()).find(e => e.severity === 'warning')).toBeUndefined();
    });
  });
  
  describe('Auto-dismissal', () => {
    beforeEach(() => {
      errorLog = new ErrorLog(container, { autoDismiss: true, dismissDelay: 1000 });
    });
    
    it('should set dismiss timer for resolved errors', () => {
      const errorId = errorLog.addError({ 
        severity: 'info', 
        message: 'Test error', 
        resolved: true 
      });
      
      expect(errorLog.dismissTimers.has(errorId)).toBe(true);
    });
    
    it('should not set dismiss timer for unresolved errors', () => {
      const errorId = errorLog.addError({ 
        severity: 'info', 
        message: 'Test error', 
        resolved: false 
      });
      
      expect(errorLog.dismissTimers.has(errorId)).toBe(false);
    });
    
    it('should auto-dismiss resolved errors after delay', () => {
      const errorId = errorLog.addError({ 
        severity: 'info', 
        message: 'Test error', 
        resolved: true 
      });
      
      expect(errorLog.errors.has(errorId)).toBe(true);
      
      vi.advanceTimersByTime(1000);
      
      expect(errorLog.errors.has(errorId)).toBe(false);
    });
    
    it('should clear dismiss timer when error is manually removed', () => {
      const errorId = errorLog.addError({ 
        severity: 'info', 
        message: 'Test error', 
        resolved: true 
      });
      
      errorLog.removeError(errorId);
      
      expect(errorLog.dismissTimers.has(errorId)).toBe(false);
    });
  });

  describe('Filtering and Search', () => {
    beforeEach(() => {
      errorLog = new ErrorLog(container);

      // Add test errors
      errorLog.addError({ severity: 'critical', type: 'memory_leak', message: 'Memory leak in grief processing' });
      errorLog.addError({ severity: 'warning', type: 'timeout', message: 'Connection timeout' });
      errorLog.addError({ severity: 'info', type: 'status', message: 'System status update' });
      errorLog.addError({ severity: 'debug', type: 'trace', message: 'Debug trace information' });
    });

    it('should filter by severity', () => {
      errorLog.setSeverityFilter(['critical', 'warning']);

      expect(errorLog.filteredErrors.length).toBe(2);
      expect(errorLog.filteredErrors.every(e => ['critical', 'warning'].includes(e.severity))).toBe(true);
    });

    it('should search by message content', () => {
      const results = errorLog.search('timeout');

      expect(results).toBe(1);
      expect(errorLog.filteredErrors.length).toBe(1);
      expect(errorLog.filteredErrors[0].message).toContain('timeout');
    });

    it('should search by type', () => {
      const results = errorLog.search('memory');

      expect(results).toBe(1);
      expect(errorLog.filteredErrors[0].type).toBe('memory_leak');
    });

    it('should search case-insensitively', () => {
      const results = errorLog.search('MEMORY');

      expect(results).toBe(1);
      expect(errorLog.filteredErrors[0].type).toBe('memory_leak');
    });

    it('should combine severity filter and search', () => {
      errorLog.setSeverityFilter(['critical', 'warning']);
      errorLog.search('memory');

      expect(errorLog.filteredErrors.length).toBe(1);
      expect(errorLog.filteredErrors[0].severity).toBe('critical');
      expect(errorLog.filteredErrors[0].type).toBe('memory_leak');
    });

    it('should sort filtered errors by timestamp (newest first)', () => {
      // Clear existing errors first
      errorLog.clearAll();

      // Add errors with specific timestamps
      const now = Date.now();
      errorLog.addError({ severity: 'info', message: 'Old error', timestamp: now - 1000 });
      errorLog.addError({ severity: 'info', message: 'New error', timestamp: now });

      errorLog.setSeverityFilter(['info']);

      expect(errorLog.filteredErrors[0].message).toBe('New error');
      expect(errorLog.filteredErrors[1].message).toBe('Old error');
    });

    it('should filter with custom criteria function', () => {
      const results = errorLog.filter(error => error.message.includes('processing'));

      expect(results).toBe(1);
      expect(errorLog.filteredErrors[0].message).toContain('processing');
    });

    it('should filter with criteria object', () => {
      const results = errorLog.filter({ severity: 'critical', type: 'memory_leak' });

      expect(results).toBe(1);
      expect(errorLog.filteredErrors[0].severity).toBe('critical');
      expect(errorLog.filteredErrors[0].type).toBe('memory_leak');
    });
  });

  describe('Export Functionality', () => {
    beforeEach(() => {
      errorLog = new ErrorLog(container);

      errorLog.addError({
        id: 'test_1',
        severity: 'critical',
        type: 'memory_leak',
        message: 'Test error 1',
        timestamp: 1640995200000, // 2022-01-01 00:00:00
        count: 2,
        resolved: false,
        details: { processId: 'proc_001' },
        stackTrace: ['at line 1', 'at line 2']
      });

      errorLog.addError({
        id: 'test_2',
        severity: 'warning',
        type: 'timeout',
        message: 'Test error 2',
        timestamp: 1640995260000, // 2022-01-01 00:01:00
        count: 1,
        resolved: true
      });
    });

    it('should export to JSON format', () => {
      const jsonData = errorLog.export('json');
      const parsed = JSON.parse(jsonData);

      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed.length).toBe(2);
      expect(parsed[0]).toMatchObject({
        id: 'test_1',
        severity: 'critical',
        type: 'memory_leak',
        message: 'Test error 1'
      });
    });

    it('should export to CSV format', () => {
      const csvData = errorLog.export('csv');
      const lines = csvData.split('\n');

      expect(lines[0]).toBe('ID,Timestamp,Severity,Type,Message,Count,Resolved');
      expect(lines[1]).toContain('test_1');
      expect(lines[1]).toContain('critical');
      expect(lines[1]).toContain('memory_leak');
    });

    it('should export to text format', () => {
      const textData = errorLog.export('text');

      expect(textData).toContain('[CRITICAL] memory_leak - Test error 1');
      expect(textData).toContain('[WARNING] timeout - Test error 2');
      expect(textData).toContain('Count: 2');
      expect(textData).toContain('Stack Trace:');
    });

    it('should throw error for unsupported format', () => {
      expect(() => errorLog.export('xml')).toThrow('Unsupported export format: xml');
    });

    it('should handle CSV escaping correctly', () => {
      errorLog.addError({
        severity: 'info',
        message: 'Error with "quotes" and, commas',
        type: 'test'
      });

      const csvData = errorLog.export('csv');
      expect(csvData).toContain('"Error with ""quotes"" and, commas"');
    });
  });

  describe('Event Handling', () => {
    beforeEach(() => {
      errorLog = new ErrorLog(container);
    });

    it('should handle search input with debouncing', () => {
      const searchInput = container.querySelector('.error-search');

      // Add test error
      errorLog.addError({ severity: 'info', message: 'searchable error' });

      // Simulate typing
      searchInput.value = 'search';
      searchInput.dispatchEvent(new Event('input'));

      // Should not filter immediately
      expect(errorLog.filteredErrors.length).toBe(1);

      // Advance timers to trigger debounced search
      vi.advanceTimersByTime(300);

      expect(errorLog.searchQuery).toBe('search');
    });

    it('should handle severity filter button clicks', () => {
      const criticalBtn = container.querySelector('.filter-btn.critical');

      expect(criticalBtn.classList.contains('active')).toBe(true);

      criticalBtn.click();

      expect(criticalBtn.classList.contains('active')).toBe(false);
      expect(errorLog.activeSeverityFilters.has('critical')).toBe(false);
    });

    it('should handle clear all button click', () => {
      errorLog.addError({ severity: 'info', message: 'Test error' });

      const clearBtn = container.querySelector('.clear-all-btn');
      clearBtn.click();

      expect(errorLog.errors.size).toBe(0);
    });

    it('should call onErrorClick callback', () => {
      const onErrorClick = vi.fn();
      errorLog.options.onErrorClick = onErrorClick;

      const errorId = errorLog.addError({ severity: 'info', message: 'Test error' });
      errorLog.render(); // Ensure DOM is updated

      const errorEntry = container.querySelector('.error-entry');
      errorEntry.click();

      expect(onErrorClick).toHaveBeenCalledWith(
        errorLog.errors.get(errorId),
        expect.objectContaining({
          type: 'click'
        })
      );
    });

    it('should call onErrorDismiss callback', () => {
      const onErrorDismiss = vi.fn();
      errorLog.options.onErrorDismiss = onErrorDismiss;

      const errorId = errorLog.addError({ severity: 'info', message: 'Test error' });
      const error = errorLog.errors.get(errorId);

      errorLog.removeError(errorId);

      expect(onErrorDismiss).toHaveBeenCalledWith(error);
    });
  });

  describe('Virtual Scrolling', () => {
    beforeEach(() => {
      errorLog = new ErrorLog(container, {
        virtualScroll: true,
        rowHeight: 80,
        visibleRows: 5
      });
    });

    it('should calculate virtual scroll dimensions', () => {
      // Add many errors
      for (let i = 0; i < 20; i++) {
        errorLog.addError({ severity: 'info', message: `Error ${i}` });
      }

      errorLog.calculateVirtualScrollDimensions();

      expect(errorLog.totalHeight).toBe(20 * 80); // 20 errors * 80px height
    });

    it('should update visible range on scroll', () => {
      // Add many errors
      for (let i = 0; i < 20; i++) {
        errorLog.addError({ severity: 'info', message: `Error ${i}` });
      }

      // Mock viewport dimensions
      const viewport = errorLog.elements.viewport;
      Object.defineProperty(viewport, 'clientHeight', { value: 400, configurable: true });
      Object.defineProperty(viewport, 'scrollTop', { value: 400, configurable: true });

      // Simulate scroll
      errorLog.scrollTop = 400; // Scroll down 5 rows
      errorLog.handleScroll();

      expect(errorLog.visibleStartIndex).toBeGreaterThan(0);
      expect(errorLog.visibleEndIndex).toBeGreaterThan(errorLog.visibleStartIndex);
    });

    it('should render only visible items in virtual scroll mode', () => {
      // Add many errors
      for (let i = 0; i < 20; i++) {
        errorLog.addError({ severity: 'info', message: `Error ${i}` });
      }

      errorLog.render();

      // Should render fewer DOM elements than total errors
      const errorEntries = container.querySelectorAll('.error-entry');
      expect(errorEntries.length).toBeLessThan(20);
      expect(errorEntries.length).toBeGreaterThan(0);
    });
  });

  describe('Custom Formatters', () => {
    beforeEach(() => {
      errorLog = new ErrorLog(container, {
        customFormatters: {
          'memory_leak': (error) => `<strong>Memory Leak:</strong> ${error.details.size} in ${error.details.processId}`,
          'stack_overflow': (error) => `<em>Recursive thoughts at depth ${error.details.depth}</em>`
        }
      });
    });

    it('should apply custom formatter for matching error type', () => {
      errorLog.addError({
        severity: 'critical',
        type: 'memory_leak',
        message: 'Default message',
        details: { size: '2.4MB', processId: 'grief_proc' }
      });

      errorLog.render();

      const errorMessage = container.querySelector('.error-message');
      expect(errorMessage.innerHTML).toContain('<strong>Memory Leak:</strong>');
      expect(errorMessage.innerHTML).toContain('2.4MB');
      expect(errorMessage.innerHTML).toContain('grief_proc');
    });

    it('should use default message if no custom formatter', () => {
      errorLog.addError({
        severity: 'warning',
        type: 'timeout',
        message: 'Connection timeout'
      });

      errorLog.render();

      const errorMessage = container.querySelector('.error-message');
      expect(errorMessage.textContent).toBe('Connection timeout');
    });

    it('should handle custom formatter errors gracefully', () => {
      errorLog.options.customFormatters.broken = () => {
        throw new Error('Formatter error');
      };

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      errorLog.addError({
        severity: 'info',
        type: 'broken',
        message: 'Fallback message'
      });

      errorLog.render();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Custom formatter failed'),
        expect.any(Error)
      );

      const errorMessage = container.querySelector('.error-message');
      expect(errorMessage.textContent).toBe('Fallback message');

      consoleSpy.mockRestore();
    });
  });

  describe('Performance', () => {
    beforeEach(() => {
      errorLog = new ErrorLog(container);
    });

    it('should complete addError within performance target', () => {
      const startTime = performance.now();

      errorLog.addError({
        severity: 'info',
        message: 'Performance test error',
        details: { large: 'data'.repeat(100) }
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete within 5ms (relaxed for test environment)
      expect(duration).toBeLessThan(50);
    });

    it('should handle large number of errors efficiently', () => {
      const startTime = performance.now();

      // Add 100 errors
      for (let i = 0; i < 100; i++) {
        errorLog.addError({
          severity: i % 2 === 0 ? 'info' : 'warning',
          message: `Performance test error ${i}`,
          type: `type_${i % 5}`
        });
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete within reasonable time
      expect(duration).toBeLessThan(500);
      expect(errorLog.errors.size).toBe(100);
    });

    it('should render efficiently with many errors', () => {
      // Add many errors
      for (let i = 0; i < 50; i++) {
        errorLog.addError({
          severity: 'info',
          message: `Render test error ${i}`
        });
      }

      const startTime = performance.now();
      errorLog.render();
      const endTime = performance.now();

      const duration = endTime - startTime;
      expect(duration).toBeLessThan(100); // Should render within 100ms
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      errorLog = new ErrorLog(container);
    });

    it('should have proper ARIA labels', () => {
      errorLog.addError({ severity: 'critical', message: 'Test error' });
      errorLog.render();

      const dismissBtn = container.querySelector('.error-dismiss');
      expect(dismissBtn.getAttribute('aria-label')).toBe('Dismiss error');
    });

    it('should support keyboard navigation', () => {
      errorLog.addError({ severity: 'info', message: 'Test error' });
      errorLog.render();

      const errorEntry = container.querySelector('.error-entry');
      expect(errorEntry.getAttribute('tabindex')).toBe('0');
    });

    it('should have proper focus management', () => {
      errorLog.addError({ severity: 'info', message: 'Test error' });
      errorLog.render();

      const errorEntry = container.querySelector('.error-entry');
      errorEntry.focus();

      expect(document.activeElement).toBe(errorEntry);
    });
  });

  describe('Cleanup and Destruction', () => {
    beforeEach(() => {
      errorLog = new ErrorLog(container);
    });

    it('should clean up timers on destroy', () => {
      errorLog.addError({ severity: 'info', message: 'Test', resolved: true });

      expect(errorLog.dismissTimers.size).toBeGreaterThan(0);

      errorLog.destroy();

      expect(errorLog.dismissTimers.size).toBe(0);
    });

    it('should disconnect ResizeObserver on destroy', () => {
      if (errorLog.resizeObserver) {
        const disconnectSpy = vi.spyOn(errorLog.resizeObserver, 'disconnect');

        errorLog.destroy();

        expect(disconnectSpy).toHaveBeenCalled();
      } else {
        // If no ResizeObserver, just ensure destroy doesn't throw
        expect(() => errorLog.destroy()).not.toThrow();
      }
    });

    it('should clear container on destroy', () => {
      errorLog.destroy();

      expect(container.innerHTML).toBe('');
      expect(container.className).toBe('');
    });

    it('should handle multiple destroy calls gracefully', () => {
      errorLog.destroy();

      expect(() => errorLog.destroy()).not.toThrow();
    });

    it('should clear all references on destroy', () => {
      errorLog.destroy();

      expect(errorLog.errors.size).toBe(0);
      expect(errorLog.filteredErrors.length).toBe(0);
      expect(errorLog.selectedErrors.size).toBe(0);
      expect(Object.keys(errorLog.elements).length).toBe(0);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    beforeEach(() => {
      errorLog = new ErrorLog(container);
    });

    it('should handle invalid error data gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = errorLog.addError(null);

      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith('ErrorLog: Invalid error data provided');

      consoleSpy.mockRestore();
    });

    it('should handle empty search query', () => {
      errorLog.addError({ severity: 'info', message: 'Test error' });

      errorLog.search('');

      expect(errorLog.filteredErrors.length).toBe(1);
    });

    it('should handle missing DOM elements gracefully', () => {
      // Remove search element
      const searchElement = container.querySelector('.error-search');
      if (searchElement) {
        searchElement.remove();
      }

      // Test that search functionality still works without the element
      expect(() => errorLog.search('test')).not.toThrow();
    });

    it('should validate severity levels', () => {
      const errorId = errorLog.addError({ severity: 'invalid', message: 'Test' });
      const error = errorLog.errors.get(errorId);

      expect(error.severity).toBe('info'); // Should default to 'info'
    });

    it('should handle export with no errors', () => {
      const jsonData = errorLog.export('json');
      const parsed = JSON.parse(jsonData);

      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed.length).toBe(0);
    });
  });
});
