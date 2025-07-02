// ErrorLog.js - Error logging and display component for runtime.zyjeski.com
// Displays and manages system errors representing mental glitches, unprocessed emotions, and consciousness malfunctions

/**
 * ErrorLog - High-performance error logging and display component
 * 
 * Features:
 * - Error severity levels: critical, warning, info, debug
 * - Real-time error display with smooth entry animations
 * - Automatic error grouping for repeated messages
 * - Timestamp formatting with relative times ("2m ago", "just now")
 * - Stack trace expansion/collapse functionality
 * - Search and filter capabilities
 * - Auto-dismissal of old/resolved errors
 * - Export functionality for debugging sessions
 * - Maximum error limit with FIFO removal
 * - Error context preservation (process ID, memory address, etc.)
 * - Virtual scrolling for performance with large error lists
 * - Consciousness-as-code metaphor integration
 * 
 * Usage:
 * const errorLog = new ErrorLog(container, {
 *   maxErrors: 100,
 *   autoDismiss: true,
 *   dismissDelay: 30000,
 *   groupSimilar: true,
 *   severityFilter: ['critical', 'warning', 'info', 'debug'],
 *   customFormatters: {
 *     'memory_leak': (error) => `Memory leak of <strong>${error.details.size}</strong> detected`
 *   }
 * });
 */

export default class ErrorLog {
  constructor(container, options = {}) {
    if (!container) {
      throw new Error('ErrorLog: Container element is required');
    }
    
    this.container = container;
    this.options = {
      // Error management
      maxErrors: 100,
      autoDismiss: true,
      dismissDelay: 30000,
      groupSimilar: true,
      
      // Display options
      severityFilter: ['critical', 'warning', 'info', 'debug'],
      showTimestamps: true,
      timestampFormat: 'relative', // 'relative' | 'absolute' | 'both'
      showStackTrace: true,
      collapsedByDefault: true,
      
      // Features
      enableSearch: true,
      enableExport: true,
      
      // Performance
      virtualScroll: true,
      rowHeight: 80,
      visibleRows: 10,
      bufferRows: 2,
      
      // Styling
      theme: 'dark',
      compactMode: false,
      
      // Custom formatters
      customFormatters: {},
      
      // Callbacks
      onErrorClick: null,
      onErrorDismiss: null,
      onErrorAdd: null,
      
      ...options
    };
    
    // Internal state
    this.errors = new Map(); // Map<id, error>
    this.filteredErrors = [];
    this.selectedErrors = new Set();
    this.searchQuery = '';
    this.activeSeverityFilters = new Set(this.options.severityFilter);
    this.dismissTimers = new Map(); // Map<id, timeoutId>
    
    // Virtual scrolling state
    this.scrollTop = 0;
    this.visibleStartIndex = 0;
    this.visibleEndIndex = 0;
    this.totalHeight = 0;
    
    // Performance tracking
    this.lastUpdateTime = 0;
    this.updateCount = 0;
    this.renderCount = 0;
    
    // DOM elements (will be set in init)
    this.elements = {};
    
    // Bind methods
    this.handleScroll = this.handleScroll.bind(this);
    this.handleResize = this.handleResize.bind(this);
    this.handleSeverityFilter = this.handleSeverityFilter.bind(this);
    this.handleErrorClick = this.handleErrorClick.bind(this);
    this.handleStackToggle = this.handleStackToggle.bind(this);
    this.handleClearAll = this.handleClearAll.bind(this);
    this.handleExport = this.handleExport.bind(this);
    
    // Initialize component
    this.init();
  }
  
  init() {
    try {
      this.createStructure();
      this.attachEventListeners();
      this.render();
      
      // Set up resize observer for responsive behavior
      if (window.ResizeObserver) {
        this.resizeObserver = new ResizeObserver(this.handleResize);
        this.resizeObserver.observe(this.container);
      } else {
        this.resizeObserver = null;
      }
      
    } catch (error) {
      console.error('ErrorLog: Initialization failed', error);
      throw error;
    }
  }
  
  createStructure() {
    // Clear container
    this.container.innerHTML = '';
    this.container.className = `error-log-container ${this.options.theme} ${this.options.compactMode ? 'compact' : ''}`;
    
    // Create main structure
    const html = `
      <div class="error-log-header">
        <div class="error-summary">
          <span class="error-count">0 errors</span>
          <div class="error-stats">
            <span class="critical-count stat-badge critical">0</span>
            <span class="warning-count stat-badge warning">0</span>
            <span class="info-count stat-badge info">0</span>
            <span class="debug-count stat-badge debug">0</span>
          </div>
        </div>
        <div class="error-controls">
          ${this.options.enableSearch ? '<input type="search" class="error-search" placeholder="Search errors..." autocomplete="off">' : ''}
          <div class="severity-filters">
            <button class="filter-btn critical active" data-severity="critical" title="Critical Errors">
              <span class="filter-icon">⚠️</span>
              <span class="filter-label">Critical</span>
            </button>
            <button class="filter-btn warning active" data-severity="warning" title="Warning Errors">
              <span class="filter-icon">⚡</span>
              <span class="filter-label">Warning</span>
            </button>
            <button class="filter-btn info active" data-severity="info" title="Info Messages">
              <span class="filter-icon">ℹ️</span>
              <span class="filter-label">Info</span>
            </button>
            <button class="filter-btn debug" data-severity="debug" title="Debug Messages">
              <span class="filter-icon">🐛</span>
              <span class="filter-label">Debug</span>
            </button>
          </div>
          <button class="clear-all-btn" title="Clear All Errors">Clear All</button>
          ${this.options.enableExport ? '<button class="export-btn" title="Export Errors">Export</button>' : ''}
        </div>
      </div>
      <div class="error-log-body">
        <div class="error-log-viewport">
          <div class="error-log-content"></div>
        </div>
        <div class="error-log-empty" style="display: none;">
          <div class="empty-icon">✨</div>
          <div class="empty-message">No errors detected</div>
          <div class="empty-subtitle">Consciousness running smoothly</div>
        </div>
      </div>
    `;
    
    this.container.innerHTML = html;
    
    // Store element references
    this.elements = {
      header: this.container.querySelector('.error-log-header'),
      summary: this.container.querySelector('.error-summary'),
      errorCount: this.container.querySelector('.error-count'),
      stats: {
        critical: this.container.querySelector('.critical-count'),
        warning: this.container.querySelector('.warning-count'),
        info: this.container.querySelector('.info-count'),
        debug: this.container.querySelector('.debug-count')
      },
      controls: this.container.querySelector('.error-controls'),
      search: this.container.querySelector('.error-search'),
      filters: this.container.querySelector('.severity-filters'),
      clearAll: this.container.querySelector('.clear-all-btn'),
      export: this.container.querySelector('.export-btn'),
      body: this.container.querySelector('.error-log-body'),
      viewport: this.container.querySelector('.error-log-viewport'),
      content: this.container.querySelector('.error-log-content'),
      empty: this.container.querySelector('.error-log-empty')
    };
  }
  
  attachEventListeners() {
    // Search input
    if (this.elements.search) {
      let searchTimeout;
      this.elements.search.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
          this.searchQuery = e.target.value.toLowerCase().trim();
          this.applyFilters();
        }, 300); // Debounce search
      });
    }

    // Severity filter buttons
    if (this.elements.filters) {
      this.elements.filters.addEventListener('click', (e) => {
        const filterBtn = e.target.closest('.filter-btn');
        if (filterBtn) {
          this.handleSeverityFilter(filterBtn);
        }
      });
    }

    // Clear all button
    if (this.elements.clearAll) {
      this.elements.clearAll.addEventListener('click', this.handleClearAll);
    }

    // Export button
    if (this.elements.export) {
      this.elements.export.addEventListener('click', this.handleExport);
    }

    // Viewport scrolling
    if (this.elements.viewport) {
      this.elements.viewport.addEventListener('scroll', this.handleScroll);
    }

    // Error entry clicks (event delegation)
    if (this.elements.content) {
      this.elements.content.addEventListener('click', (e) => {
        const errorEntry = e.target.closest('.error-entry');
        if (errorEntry) {
          const errorId = errorEntry.dataset.errorId;

          // Handle stack trace toggle
          if (e.target.closest('.toggle-stack')) {
            this.handleStackToggle(errorId, e.target.closest('.toggle-stack'));
            return;
          }

          // Handle error click
          this.handleErrorClick(errorId, e);
        }
      });
    }
  }

  render() {
    const startTime = performance.now();

    try {
      this.updateSummary();
      this.renderErrorList();
      this.updateEmptyState();

      // Performance tracking
      const renderTime = performance.now() - startTime;
      this.lastUpdateTime = renderTime;
      this.renderCount++;

      if (renderTime > 16) { // More than one frame at 60fps
        console.warn(`ErrorLog: Render took ${renderTime.toFixed(2)}ms (target: <16ms)`);
      }

    } catch (error) {
      console.error('ErrorLog: Render failed', error);
    }
  }

  handleScroll() {
    if (!this.options.virtualScroll || this.filteredErrors.length === 0) return;

    const viewport = this.elements.viewport;
    this.scrollTop = viewport.scrollTop;

    // Calculate visible range
    const startIndex = Math.floor(this.scrollTop / this.options.rowHeight);
    const endIndex = Math.min(
      startIndex + this.options.visibleRows + this.options.bufferRows * 2,
      this.filteredErrors.length
    );

    // Update if range changed
    if (startIndex !== this.visibleStartIndex || endIndex !== this.visibleEndIndex) {
      this.visibleStartIndex = Math.max(0, startIndex - this.options.bufferRows);
      this.visibleEndIndex = endIndex;
      this.renderErrorList();
    }
  }

  handleResize() {
    // Recalculate virtual scroll dimensions
    if (this.options.virtualScroll) {
      this.calculateVirtualScrollDimensions();
      this.render();
    }
  }

  handleSeverityFilter(filterBtn) {
    const severity = filterBtn.dataset.severity;
    const isActive = filterBtn.classList.contains('active');

    if (isActive) {
      filterBtn.classList.remove('active');
      this.activeSeverityFilters.delete(severity);
    } else {
      filterBtn.classList.add('active');
      this.activeSeverityFilters.add(severity);
    }

    this.applyFilters();
  }

  handleErrorClick(errorId, event) {
    const error = this.errors.get(errorId);
    if (!error) return;

    // Toggle selection if multi-select enabled
    if (event.ctrlKey || event.metaKey) {
      if (this.selectedErrors.has(errorId)) {
        this.selectedErrors.delete(errorId);
      } else {
        this.selectedErrors.add(errorId);
      }
      this.updateSelectionDisplay();
    } else {
      // Single selection
      this.selectedErrors.clear();
      this.selectedErrors.add(errorId);
      this.updateSelectionDisplay();
    }

    // Call callback if provided
    if (this.options.onErrorClick) {
      this.options.onErrorClick(error, event);
    }
  }

  handleStackToggle(_errorId, toggleBtn) {
    const errorEntry = toggleBtn.closest('.error-entry');
    const stackContainer = errorEntry.querySelector('.error-stack');
    const stackTrace = stackContainer.querySelector('.stack-trace');

    const isCollapsed = stackContainer.classList.contains('collapsed');

    if (isCollapsed) {
      stackContainer.classList.remove('collapsed');
      toggleBtn.textContent = 'Hide Stack Trace';
      stackTrace.style.display = 'block';
    } else {
      stackContainer.classList.add('collapsed');
      toggleBtn.textContent = 'Show Stack Trace';
      stackTrace.style.display = 'none';
    }
  }

  handleClearAll() {
    if (this.errors.size === 0) return;

    // Clear all dismiss timers
    this.dismissTimers.forEach(timerId => clearTimeout(timerId));
    this.dismissTimers.clear();

    // Clear errors
    this.errors.clear();
    this.filteredErrors = [];
    this.selectedErrors.clear();

    this.render();
  }

  handleExport() {
    if (this.errors.size === 0) {
      alert('No errors to export');
      return;
    }

    // Show export options
    const format = prompt('Export format (json, csv, text):', 'json');
    if (!format) return;

    try {
      const exportData = this.export(format.toLowerCase());
      this.downloadExport(exportData, format);
    } catch (error) {
      console.error('ErrorLog: Export failed', error);
      alert('Export failed: ' + error.message);
    }
  }
  
  // Public API methods
  addError(errorData) {
    if (!errorData || typeof errorData !== 'object') {
      console.warn('ErrorLog: Invalid error data provided');
      return null;
    }

    const startTime = performance.now();

    try {
      // Generate ID if not provided
      const id = errorData.id || this.generateErrorId();

      // Normalize error data
      const error = this.normalizeError({ ...errorData, id });

      // Check for similar errors if grouping is enabled
      if (this.options.groupSimilar) {
        const existingError = this.findSimilarError(error);
        if (existingError) {
          existingError.count++;
          existingError.timestamp = error.timestamp; // Update to latest timestamp
          this.applyFilters();
          this.render();
          return existingError.id;
        }
      }

      // Add new error
      this.errors.set(id, error);

      // Enforce max errors limit (FIFO)
      if (this.errors.size > this.options.maxErrors) {
        const oldestId = this.errors.keys().next().value;
        this.removeError(oldestId);
      }

      // Set up auto-dismissal if enabled
      if (this.options.autoDismiss && error.resolved) {
        this.setDismissTimer(id);
      }

      // Update display
      this.applyFilters();
      this.render();

      // Call callback if provided
      if (this.options.onErrorAdd) {
        this.options.onErrorAdd(error);
      }

      // Performance tracking
      const addTime = performance.now() - startTime;
      if (addTime > 5) { // Target: <5ms
        console.warn(`ErrorLog: addError took ${addTime.toFixed(2)}ms (target: <5ms)`);
      }

      return id;

    } catch (error) {
      console.error('ErrorLog: Failed to add error', error);
      return null;
    }
  }

  removeError(id) {
    if (!this.errors.has(id)) return false;

    const error = this.errors.get(id);

    // Clear dismiss timer if exists
    if (this.dismissTimers.has(id)) {
      clearTimeout(this.dismissTimers.get(id));
      this.dismissTimers.delete(id);
    }

    // Remove from collections
    this.errors.delete(id);
    this.selectedErrors.delete(id);

    // Update display
    this.applyFilters();
    this.render();

    // Call callback if provided
    if (this.options.onErrorDismiss) {
      this.options.onErrorDismiss(error);
    }

    return true;
  }

  clearAll() {
    this.handleClearAll();
  }

  clearBySeverity(severity) {
    const toRemove = [];
    for (const [id, error] of this.errors) {
      if (error.severity === severity) {
        toRemove.push(id);
      }
    }

    toRemove.forEach(id => this.removeError(id));
    return toRemove.length;
  }

  filter(criteria) {
    if (typeof criteria === 'function') {
      this.filteredErrors = Array.from(this.errors.values()).filter(criteria);
    } else if (typeof criteria === 'object') {
      this.filteredErrors = Array.from(this.errors.values()).filter(error => {
        return Object.entries(criteria).every(([key, value]) => {
          if (Array.isArray(value)) {
            return value.includes(error[key]);
          }
          return error[key] === value;
        });
      });
    }

    this.render();
    return this.filteredErrors.length;
  }

  search(query) {
    this.searchQuery = query.toLowerCase().trim();
    this.applyFilters();
    return this.filteredErrors.length;
  }

  setSeverityFilter(severities) {
    this.activeSeverityFilters = new Set(severities);

    // Update filter button states
    const filterBtns = this.elements.filters.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
      const severity = btn.dataset.severity;
      if (this.activeSeverityFilters.has(severity)) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    this.applyFilters();
    return this.filteredErrors.length;
  }

  getErrorCount() {
    return this.errors.size;
  }

  getErrors() {
    return Array.from(this.errors.values());
  }

  getFilteredErrors() {
    return [...this.filteredErrors];
  }

  export(format = 'json') {
    const errors = this.getErrors();

    switch (format.toLowerCase()) {
      case 'json':
        return JSON.stringify(errors, null, 2);

      case 'csv':
        return this.exportToCsv(errors);

      case 'text':
        return this.exportToText(errors);

      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  destroy() {
    try {
      // Clear all timers
      this.dismissTimers.forEach(timerId => clearTimeout(timerId));
      this.dismissTimers.clear();

      // Note: Search event listener is handled inline and doesn't need explicit removal

      if (this.elements.viewport) {
        this.elements.viewport.removeEventListener('scroll', this.handleScroll);
      }

      // Disconnect resize observer
      if (this.resizeObserver) {
        this.resizeObserver.disconnect();
        this.resizeObserver = null;
      }

      // Clear container
      this.container.innerHTML = '';
      this.container.className = '';

      // Clear references
      this.errors.clear();
      this.filteredErrors = [];
      this.selectedErrors.clear();
      this.elements = {};

    } catch (error) {
      console.error('ErrorLog: Cleanup failed', error);
    }
  }

  // Helper methods
  generateErrorId() {
    return `err_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  normalizeError(errorData) {
    const now = Date.now();

    return {
      id: errorData.id,
      timestamp: errorData.timestamp || now,
      severity: this.validateSeverity(errorData.severity) || 'info',
      type: errorData.type || 'unknown',
      message: String(errorData.message || 'Unknown error'),
      details: errorData.details || {},
      stackTrace: Array.isArray(errorData.stackTrace) ? errorData.stackTrace : [],
      count: errorData.count || 1,
      resolved: Boolean(errorData.resolved),
      context: errorData.context || {}
    };
  }

  validateSeverity(severity) {
    const validSeverities = ['critical', 'warning', 'info', 'debug'];
    return validSeverities.includes(severity) ? severity : null;
  }

  findSimilarError(newError) {
    for (const error of this.errors.values()) {
      if (error.type === newError.type &&
          error.message === newError.message &&
          error.severity === newError.severity) {
        return error;
      }
    }
    return null;
  }

  setDismissTimer(errorId) {
    if (this.dismissTimers.has(errorId)) {
      clearTimeout(this.dismissTimers.get(errorId));
    }

    const timerId = setTimeout(() => {
      this.removeError(errorId);
    }, this.options.dismissDelay);

    this.dismissTimers.set(errorId, timerId);
  }

  applyFilters() {
    let filtered = Array.from(this.errors.values());

    // Apply severity filter
    if (this.activeSeverityFilters.size > 0) {
      filtered = filtered.filter(error =>
        this.activeSeverityFilters.has(error.severity)
      );
    }

    // Apply search filter
    if (this.searchQuery) {
      filtered = filtered.filter(error => {
        const searchText = [
          error.message,
          error.type,
          error.details ? Object.values(error.details).join(' ') : '',
          error.context ? Object.values(error.context).join(' ') : ''
        ].join(' ').toLowerCase();

        return searchText.includes(this.searchQuery);
      });
    }

    // Sort by timestamp (newest first)
    filtered.sort((a, b) => b.timestamp - a.timestamp);

    this.filteredErrors = filtered;

    // Update virtual scroll if enabled
    if (this.options.virtualScroll) {
      this.calculateVirtualScrollDimensions();
    }
  }

  calculateVirtualScrollDimensions() {
    this.totalHeight = this.filteredErrors.length * this.options.rowHeight;

    if (this.elements.content) {
      this.elements.content.style.height = `${this.totalHeight}px`;
    }

    // Recalculate visible range
    const viewport = this.elements.viewport;
    if (viewport) {
      const viewportHeight = viewport.clientHeight;
      this.options.visibleRows = Math.ceil(viewportHeight / this.options.rowHeight);
      this.handleScroll(); // Update visible range
    }
  }

  updateSummary() {
    const totalErrors = this.errors.size;
    const stats = { critical: 0, warning: 0, info: 0, debug: 0 };

    // Count by severity
    for (const error of this.errors.values()) {
      if (stats.hasOwnProperty(error.severity)) {
        stats[error.severity] += error.count || 1;
      }
    }

    // Update error count
    const errorText = totalErrors === 1 ? '1 error' : `${totalErrors} errors`;
    this.elements.errorCount.textContent = errorText;

    // Update severity stats
    Object.entries(stats).forEach(([severity, count]) => {
      const element = this.elements.stats[severity];
      if (element) {
        element.textContent = count;
        element.style.display = count > 0 ? 'inline-block' : 'none';
      }
    });
  }

  updateEmptyState() {
    const hasErrors = this.filteredErrors.length > 0;
    this.elements.empty.style.display = hasErrors ? 'none' : 'flex';
    this.elements.viewport.style.display = hasErrors ? 'block' : 'none';
  }

  updateSelectionDisplay() {
    const errorEntries = this.elements.content.querySelectorAll('.error-entry');
    errorEntries.forEach(entry => {
      const errorId = entry.dataset.errorId;
      if (this.selectedErrors.has(errorId)) {
        entry.classList.add('selected');
      } else {
        entry.classList.remove('selected');
      }
    });
  }

  formatTimestamp(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;

    if (this.options.timestampFormat === 'absolute') {
      return new Date(timestamp).toLocaleString();
    }

    if (this.options.timestampFormat === 'both') {
      const relative = this.getRelativeTime(diff);
      const absolute = new Date(timestamp).toLocaleString();
      return `${relative} (${absolute})`;
    }

    // Default: relative
    return this.getRelativeTime(diff);
  }

  getRelativeTime(diff) {
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 10) return 'just now';
    if (seconds < 60) return `${seconds}s ago`;
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  }

  renderErrorList() {
    if (!this.elements.content) return;

    const fragment = document.createDocumentFragment();

    if (this.options.virtualScroll && this.filteredErrors.length > this.options.visibleRows) {
      // Virtual scrolling for large lists
      this.renderVirtualizedList(fragment);
    } else {
      // Render all errors for small lists
      this.filteredErrors.forEach(error => {
        const errorElement = this.createErrorElement(error);
        fragment.appendChild(errorElement);
      });
    }

    // Clear and update content
    this.elements.content.innerHTML = '';
    this.elements.content.appendChild(fragment);

    // Update selection display
    this.updateSelectionDisplay();
  }

  renderVirtualizedList(fragment) {
    // Set content height for scrolling
    this.elements.content.style.height = `${this.totalHeight}px`;

    // Calculate offset for visible items
    const offsetTop = this.visibleStartIndex * this.options.rowHeight;

    // Create spacer for items above visible area
    if (offsetTop > 0) {
      const spacer = document.createElement('div');
      spacer.style.height = `${offsetTop}px`;
      fragment.appendChild(spacer);
    }

    // Render visible items
    for (let i = this.visibleStartIndex; i < this.visibleEndIndex; i++) {
      if (i >= this.filteredErrors.length) break;

      const error = this.filteredErrors[i];
      const errorElement = this.createErrorElement(error);
      fragment.appendChild(errorElement);
    }
  }

  createErrorElement(error) {
    const errorDiv = document.createElement('div');
    errorDiv.className = `error-entry ${error.severity} ${error.resolved ? 'resolved' : ''}`;
    errorDiv.dataset.errorId = error.id;
    errorDiv.setAttribute('tabindex', '0'); // For keyboard navigation
    errorDiv.setAttribute('tabindex', '0'); // For keyboard navigation
    errorDiv.setAttribute('tabindex', '0'); // For keyboard navigation

    // Apply custom formatter if available
    const customFormatter = this.options.customFormatters[error.type];
    let messageHtml = error.message;

    if (customFormatter && typeof customFormatter === 'function') {
      try {
        messageHtml = customFormatter(error);
      } catch (e) {
        console.warn(`ErrorLog: Custom formatter failed for type "${error.type}"`, e);
      }
    }

    // Build error HTML
    const html = `
      <div class="error-header">
        <span class="error-icon">${this.getSeverityIcon(error.severity)}</span>
        <span class="error-type">${this.escapeHtml(error.type)}</span>
        <span class="error-timestamp">${this.formatTimestamp(error.timestamp)}</span>
        ${error.count > 1 ? `<span class="error-count-badge">×${error.count}</span>` : ''}
        <button class="error-dismiss" title="Dismiss error" aria-label="Dismiss error">×</button>
      </div>
      <div class="error-message">${messageHtml}</div>
      ${this.renderErrorDetails(error)}
      ${this.renderStackTrace(error)}
    `;

    errorDiv.innerHTML = html;

    // Add dismiss handler
    const dismissBtn = errorDiv.querySelector('.error-dismiss');
    if (dismissBtn) {
      dismissBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.removeError(error.id);
      });
    }

    return errorDiv;
  }

  renderErrorDetails(error) {
    if (!error.details || Object.keys(error.details).length === 0) {
      return '';
    }

    const detailItems = Object.entries(error.details)
      .map(([key, value]) => `<span class="detail-item">${this.escapeHtml(key)}: ${this.escapeHtml(String(value))}</span>`)
      .join('');

    return `<div class="error-details">${detailItems}</div>`;
  }

  renderStackTrace(error) {
    if (!this.options.showStackTrace || !error.stackTrace || error.stackTrace.length === 0) {
      return '';
    }

    const stackHtml = error.stackTrace
      .map(line => this.escapeHtml(line))
      .join('\n');

    const collapsed = this.options.collapsedByDefault ? 'collapsed' : '';
    const toggleText = this.options.collapsedByDefault ? 'Show Stack Trace' : 'Hide Stack Trace';
    const stackDisplay = this.options.collapsedByDefault ? 'none' : 'block';

    return `
      <div class="error-stack ${collapsed}">
        <button class="toggle-stack">${toggleText}</button>
        <pre class="stack-trace" style="display: ${stackDisplay};">${stackHtml}</pre>
      </div>
    `;
  }

  getSeverityIcon(severity) {
    const icons = {
      critical: '⚠️',
      warning: '⚡',
      info: 'ℹ️',
      debug: '🐛'
    };
    return icons[severity] || '❓';
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  exportToCsv(errors) {
    const headers = ['ID', 'Timestamp', 'Severity', 'Type', 'Message', 'Count', 'Resolved'];
    const rows = [headers.join(',')];

    errors.forEach(error => {
      const row = [
        error.id,
        new Date(error.timestamp).toISOString(),
        error.severity,
        error.type,
        `"${error.message.replace(/"/g, '""')}"`, // Escape quotes
        error.count,
        error.resolved
      ];
      rows.push(row.join(','));
    });

    return rows.join('\n');
  }

  exportToText(errors) {
    return errors.map(error => {
      let text = `[${error.severity.toUpperCase()}] ${error.type} - ${error.message}\n`;
      text += `  Time: ${new Date(error.timestamp).toLocaleString()}\n`;
      text += `  Count: ${error.count}\n`;

      if (error.details && Object.keys(error.details).length > 0) {
        text += `  Details: ${JSON.stringify(error.details)}\n`;
      }

      if (error.stackTrace && error.stackTrace.length > 0) {
        text += `  Stack Trace:\n${error.stackTrace.map(line => `    ${line}`).join('\n')}\n`;
      }

      return text + '\n';
    }).join('');
  }

  downloadExport(data, format) {
    const blob = new Blob([data], { type: this.getExportMimeType(format) });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `error-log-${new Date().toISOString().split('T')[0]}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    URL.revokeObjectURL(url);
  }

  getExportMimeType(format) {
    const mimeTypes = {
      json: 'application/json',
      csv: 'text/csv',
      text: 'text/plain'
    };
    return mimeTypes[format] || 'text/plain';
  }
}
