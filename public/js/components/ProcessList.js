// public/js/components/ProcessList.js
// High-performance reusable ProcessList component for runtime.zyjeski.com
// Implements virtual scrolling, efficient DOM diffing, and comprehensive event system

export class ProcessList {
  constructor(container, options = {}) {
    if (!container) {
      throw new Error('ProcessList: Container element is required');
    }
    
    this.container = container;
    this.options = {
      // Display options
      showHealth: true,
      showWarnings: true,
      showResources: true,    // CPU/Memory bars
      showDescription: false,  // Tooltip only by default
      
      // Interaction options
      interactive: true,
      selectable: true,
      multiSelect: false,
      
      // Performance options
      virtualScroll: true,    // For large lists
      rowHeight: 48,          // Fixed height for virtual scroll
      visibleRows: 10,        // Visible without scrolling
      bufferRows: 2,          // Extra rows for smooth scrolling
      
      // Styling options
      theme: 'dark',          // 'dark' or 'light'
      compactMode: false,
      
      ...options
    };
    
    // State management
    this.processes = [];
    this._processMap = new Map(); // For efficient lookups
    this._selectedPids = new Set();
    this._hoveredPid = null;
    this._sortKey = 'cpu';
    this._sortDirection = 'desc';
    this._filteredProcesses = [];
    this._filterPredicate = null;
    
    // Virtual scrolling state
    this._scrollTop = 0;
    this._visibleStartIndex = 0;
    this._visibleEndIndex = 0;
    this._rowElements = new Map(); // Reusable row elements
    this._rowPool = []; // Pool of unused row elements
    
    // Event system
    this._eventListeners = new Map();
    
    // Performance tracking
    this._lastUpdateTime = 0;
    this._updateCount = 0;
    
    // DOM elements
    this.elements = {};
    
    this._initialize();
  }
  
  /**
   * Initialize the component
   * @private
   */
  _initialize() {
    try {
      this._validateOptions();
      this._createDOMStructure();
      this._setupEventListeners();
      this._setupVirtualScroll();
      
      // Add theme class
      this.container.classList.add(`process-list-theme-${this.options.theme}`);
      
      if (this.options.compactMode) {
        this.container.classList.add('process-list-compact');
      }
      
      console.log('ProcessList: Initialized successfully', {
        options: this.options,
        container: this.container
      });
    } catch (error) {
      console.error('ProcessList: Initialization failed', error);
      this.emit('error', { error, phase: 'initialization' });
      throw error;
    }
  }
  
  /**
   * Validate constructor options
   * @private
   */
  _validateOptions() {
    if (this.options.rowHeight < 20) {
      console.warn('ProcessList: rowHeight too small, setting to minimum 20px');
      this.options.rowHeight = 20;
    }
    
    if (this.options.visibleRows < 1) {
      console.warn('ProcessList: visibleRows too small, setting to minimum 1');
      this.options.visibleRows = 1;
    }
    
    if (!['dark', 'light'].includes(this.options.theme)) {
      console.warn('ProcessList: Invalid theme, defaulting to dark');
      this.options.theme = 'dark';
    }
  }
  
  /**
   * Create the DOM structure
   * @private
   */
  _createDOMStructure() {
    // Clear container
    this.container.innerHTML = '';
    this.container.className = 'process-list';
    
    // Create header
    this.elements.header = this._createElement('div', 'process-list-header');
    this.elements.header.innerHTML = this._generateHeaderHTML();
    this.container.appendChild(this.elements.header);
    
    // Create viewport for virtual scrolling
    this.elements.viewport = this._createElement('div', 'process-list-viewport');
    this.elements.viewport.style.height = `${this.options.visibleRows * this.options.rowHeight}px`;
    this.elements.viewport.style.overflow = 'auto';
    this.container.appendChild(this.elements.viewport);
    
    // Create scroller (will be sized based on total content)
    this.elements.scroller = this._createElement('div', 'process-list-scroller');
    this.elements.viewport.appendChild(this.elements.scroller);
    
    // Create content container for visible rows
    this.elements.content = this._createElement('div', 'process-list-content');
    this.elements.scroller.appendChild(this.elements.content);
    
    // Create empty state element
    this.elements.emptyState = this._createElement('div', 'process-list-empty');
    this.elements.emptyState.innerHTML = '<div class="empty-message">No processes to display</div>';
    this.elements.emptyState.style.display = 'none';
    this.container.appendChild(this.elements.emptyState);
  }
  
  /**
   * Generate header HTML
   * @private
   * @returns {string} Header HTML
   */
  _generateHeaderHTML() {
    const columns = [
      { key: 'status', label: 'Status', sortable: false, width: '60px' },
      { key: 'name', label: 'Process', sortable: true, width: 'auto' },
      { key: 'cpu', label: 'CPU', sortable: true, width: '80px' },
      { key: 'memory', label: 'Memory', sortable: true, width: '100px' }
    ];
    
    if (this.options.showHealth) {
      columns.splice(2, 0, { key: 'health', label: 'Health', sortable: true, width: '80px' });
    }
    
    return columns.map(col => {
      const sortClass = col.sortable ? 'sortable' : '';
      const activeSort = this._sortKey === col.key ? `sort-${this._sortDirection}` : '';
      const style = col.width !== 'auto' ? `style="width: ${col.width}"` : '';
      
      return `<div class="column column-${col.key} ${sortClass} ${activeSort}" 
                   data-sort="${col.key}" ${style}>
                ${col.label}
                ${col.sortable ? '<span class="sort-indicator"></span>' : ''}
              </div>`;
    }).join('');
  }
  
  /**
   * Create DOM element with class
   * @private
   * @param {string} tag - Element tag name
   * @param {string} className - CSS class name
   * @returns {HTMLElement} Created element
   */
  _createElement(tag, className) {
    const element = document.createElement(tag);
    if (className) {
      element.className = className;
    }
    return element;
  }
  
  /**
   * Setup event listeners
   * @private
   */
  _setupEventListeners() {
    // Header click for sorting
    this.elements.header.addEventListener('click', this._handleHeaderClick.bind(this));
    
    // Viewport scroll for virtual scrolling
    this.elements.viewport.addEventListener('scroll', this._handleScroll.bind(this));
    
    // Content click delegation for process interactions
    this.elements.content.addEventListener('click', this._handleProcessClick.bind(this));
    this.elements.content.addEventListener('mouseover', this._handleProcessHover.bind(this));
    this.elements.content.addEventListener('mouseout', this._handleProcessHoverOut.bind(this));
    this.elements.content.addEventListener('contextmenu', this._handleProcessContextMenu.bind(this));
    
    // Keyboard navigation
    if (this.options.interactive) {
      this.container.addEventListener('keydown', this._handleKeyDown.bind(this));
      this.container.setAttribute('tabindex', '0');
    }
  }
  
  /**
   * Setup virtual scrolling
   * @private
   */
  _setupVirtualScroll() {
    if (!this.options.virtualScroll) {
      return;
    }
    
    // Initial scroll state
    this._updateScrollState();
  }
  
  // Core public API methods will be added in the next chunk
  
  /**
   * Update with new process data
   * @param {Array} processes - Array of process objects from ConsciousnessTransformer
   */
  update(processes) {
    const startTime = performance.now();
    
    if (!Array.isArray(processes)) {
      console.error('ProcessList: Invalid process data provided');
      return;
    }
    
    try {
      const validProcesses = processes.filter(p => 
        p && typeof p.pid === 'number' && typeof p.name === 'string'
      );
      
      if (validProcesses.length !== processes.length) {
        console.warn(`ProcessList: Filtered out ${processes.length - validProcesses.length} invalid processes`);
      }
      
      this._performUpdate(validProcesses);
      
      // Performance tracking
      const updateTime = performance.now() - startTime;
      this._lastUpdateTime = updateTime;
      this._updateCount++;
      
      if (updateTime > 16) { // More than one frame at 60fps
        console.warn(`ProcessList: Update took ${updateTime.toFixed(2)}ms (target: <16ms)`);
      }
      
    } catch (error) {
      console.error('ProcessList: Update failed', error);
      this.emit('error', { error, phase: 'update' });
    }
  }
  
  /**
   * Force re-render of the component
   */
  render() {
    this._renderVisibleRows();
  }
  
  /**
   * Clean up and destroy the component
   */
  destroy() {
    // Remove all event listeners
    this._eventListeners.clear();

    // Clear DOM
    this.container.innerHTML = '';
    this.container.className = '';

    // Clear state
    this.processes = [];
    this._processMap.clear();
    this._selectedPids.clear();
    this._rowElements.clear();
    this._rowPool = [];

    console.log('ProcessList: Destroyed successfully');
  }

  // Selection methods

  /**
   * Select a process by PID
   * @param {number} pid - Process ID to select
   */
  select(pid) {
    if (!this.options.selectable) return;

    if (!this.options.multiSelect) {
      this._selectedPids.clear();
    }

    this._selectedPids.add(pid);
    this._updateRowSelection(pid, true);

    this.emit('selection-change', {
      selected: [...this._selectedPids],
      added: [pid],
      removed: []
    });
  }

  /**
   * Deselect a process by PID
   * @param {number} pid - Process ID to deselect
   */
  deselect(pid) {
    if (!this.options.selectable) return;

    this._selectedPids.delete(pid);
    this._updateRowSelection(pid, false);

    this.emit('selection-change', {
      selected: [...this._selectedPids],
      added: [],
      removed: [pid]
    });
  }

  /**
   * Select all visible processes
   */
  selectAll() {
    if (!this.options.selectable || !this.options.multiSelect) return;

    const previousSelection = [...this._selectedPids];
    const currentProcesses = this._getDisplayedProcesses();

    currentProcesses.forEach(process => {
      this._selectedPids.add(process.pid);
      this._updateRowSelection(process.pid, true);
    });

    const added = currentProcesses
      .filter(p => !previousSelection.includes(p.pid))
      .map(p => p.pid);

    this.emit('selection-change', {
      selected: [...this._selectedPids],
      added: added,
      removed: []
    });
  }

  /**
   * Clear all selections
   */
  clearSelection() {
    if (!this.options.selectable) return;

    const previousSelection = [...this._selectedPids];
    this._selectedPids.clear();

    // Update visual state for all previously selected rows
    previousSelection.forEach(pid => {
      this._updateRowSelection(pid, false);
    });

    this.emit('selection-change', {
      selected: [],
      added: [],
      removed: previousSelection
    });
  }

  /**
   * Get selected process data
   * @returns {Array} Array of selected process objects
   */
  getSelected() {
    return this.processes.filter(process => this._selectedPids.has(process.pid));
  }

  // Display methods

  /**
   * Temporarily highlight a process
   * @param {number} pid - Process ID to highlight
   * @param {number} duration - Highlight duration in ms (default: 2000)
   */
  highlight(pid, duration = 2000) {
    const rowElement = this._getRowElement(pid);
    if (!rowElement) return;

    rowElement.classList.add('highlighted');

    setTimeout(() => {
      if (rowElement.parentNode) {
        rowElement.classList.remove('highlighted');
      }
    }, duration);
  }

  /**
   * Filter visible processes
   * @param {Function|null} predicate - Filter function or null to clear filter
   */
  filter(predicate) {
    this._filterPredicate = predicate;
    this._applyFilter();
    this._updateVirtualScroll();
    this._renderVisibleRows();
  }

  /**
   * Sort processes by column
   * @param {string} key - Sort key (name, cpu, memory, health, etc.)
   * @param {string} direction - Sort direction ('asc' or 'desc')
   */
  sort(key, direction = 'desc') {
    if (!['asc', 'desc'].includes(direction)) {
      console.warn('ProcessList: Invalid sort direction, using desc');
      direction = 'desc';
    }

    this._sortKey = key;
    this._sortDirection = direction;

    this._applySorting();
    this._updateHeaderSortIndicators();
    this._renderVisibleRows();

    this.emit('sort-change', { key, direction });
  }

  /**
   * Scroll to specific process
   * @param {number} pid - Process ID to scroll to
   */
  scrollTo(pid) {
    const processes = this._getDisplayedProcesses();
    const index = processes.findIndex(p => p.pid === pid);

    if (index === -1) {
      console.warn(`ProcessList: Process ${pid} not found for scrolling`);
      return;
    }

    const scrollTop = index * this.options.rowHeight;
    this.elements.viewport.scrollTop = scrollTop;
  }

  // Event system methods

  /**
   * Register event handler
   * @param {string} event - Event name
   * @param {Function} callback - Event callback
   */
  on(event, callback) {
    if (!this._eventListeners.has(event)) {
      this._eventListeners.set(event, []);
    }
    this._eventListeners.get(event).push(callback);
  }

  /**
   * Remove event handler
   * @param {string} event - Event name
   * @param {Function} callback - Event callback to remove
   */
  off(event, callback) {
    if (!this._eventListeners.has(event)) return;

    const listeners = this._eventListeners.get(event);
    const index = listeners.indexOf(callback);
    if (index > -1) {
      listeners.splice(index, 1);
    }
  }

  /**
   * Emit custom event
   * @param {string} event - Event name
   * @param {*} data - Event data
   */
  emit(event, data) {
    if (!this._eventListeners.has(event)) return;

    const listeners = this._eventListeners.get(event);
    listeners.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`ProcessList: Event handler error for ${event}`, error);
      }
    });
  }

  // Private implementation methods

  /**
   * Perform the actual update with validated data
   * @private
   * @param {Array} processes - Validated process array
   */
  _performUpdate(processes) {
    const oldMap = new Map(this.processes.map(p => [p.pid, p]));
    const newMap = new Map(processes.map(p => [p.pid, p]));

    // Determine changes
    const added = processes.filter(p => !oldMap.has(p.pid));
    const removed = this.processes.filter(p => !newMap.has(p.pid));
    const updated = processes.filter(p => {
      const old = oldMap.get(p.pid);
      return old && this._hasChanged(old, p);
    });

    // Update internal state
    this.processes = processes;
    this._processMap = newMap;

    // Apply filter and sorting
    this._applyFilter();
    this._applySorting();

    // Update virtual scroll and render
    this._updateVirtualScroll();
    this._renderVisibleRows();

    // Show/hide empty state
    this._updateEmptyState();

    // Emit update event
    this.emit('update', { added, removed, updated, total: processes.length });
  }

  /**
   * Check if process data has changed
   * @private
   * @param {Object} oldProcess - Previous process data
   * @param {Object} newProcess - New process data
   * @returns {boolean} True if changed
   */
  _hasChanged(oldProcess, newProcess) {
    const keys = ['status', 'health', 'cpu', 'memory', 'threads', 'warnings'];
    return keys.some(key => {
      const oldVal = oldProcess[key];
      const newVal = newProcess[key];

      if (Array.isArray(oldVal) && Array.isArray(newVal)) {
        return JSON.stringify(oldVal) !== JSON.stringify(newVal);
      }

      return oldVal !== newVal;
    });
  }

  /**
   * Apply current filter predicate
   * @private
   */
  _applyFilter() {
    if (this._filterPredicate) {
      this._filteredProcesses = this.processes.filter(this._filterPredicate);
    } else {
      this._filteredProcesses = [...this.processes];
    }
  }

  /**
   * Apply current sorting
   * @private
   */
  _applySorting() {
    this._filteredProcesses.sort((a, b) => {
      let aVal = a[this._sortKey];
      let bVal = b[this._sortKey];

      // Handle special cases
      if (this._sortKey === 'name') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        const result = aVal.localeCompare(bVal);
        return this._sortDirection === 'asc' ? result : -result;
      }

      if (aVal < bVal) return this._sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return this._sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }

  /**
   * Update virtual scroll dimensions and visible range
   * @private
   */
  _updateVirtualScroll() {
    if (!this.options.virtualScroll) {
      return;
    }

    const totalHeight = this._filteredProcesses.length * this.options.rowHeight;
    this.elements.scroller.style.height = `${totalHeight}px`;

    this._updateScrollState();
  }

  /**
   * Update scroll state and visible range
   * @private
   */
  _updateScrollState() {
    if (!this.options.virtualScroll) {
      return;
    }

    this._scrollTop = this.elements.viewport.scrollTop;

    const startIndex = Math.floor(this._scrollTop / this.options.rowHeight);
    const endIndex = Math.min(
      startIndex + this.options.visibleRows + this.options.bufferRows * 2,
      this._filteredProcesses.length
    );

    this._visibleStartIndex = Math.max(0, startIndex - this.options.bufferRows);
    this._visibleEndIndex = endIndex;
  }

  /**
   * Get currently displayed processes (filtered and sorted)
   * @private
   * @returns {Array} Displayed processes
   */
  _getDisplayedProcesses() {
    return this._filteredProcesses;
  }

  /**
   * Get row element for a specific PID
   * @private
   * @param {number} pid - Process ID
   * @returns {HTMLElement|null} Row element or null
   */
  _getRowElement(pid) {
    return this._rowElements.get(pid) || null;
  }

  /**
   * Update row selection visual state
   * @private
   * @param {number} pid - Process ID
   * @param {boolean} selected - Selection state
   */
  _updateRowSelection(pid, selected) {
    const rowElement = this._getRowElement(pid);
    if (!rowElement) return;

    if (selected) {
      rowElement.classList.add('selected');
    } else {
      rowElement.classList.remove('selected');
    }
  }

  /**
   * Update header sort indicators
   * @private
   */
  _updateHeaderSortIndicators() {
    // Remove all existing sort classes
    this.elements.header.querySelectorAll('.column').forEach(col => {
      col.classList.remove('sort-asc', 'sort-desc');
    });

    // Add current sort class
    const activeColumn = this.elements.header.querySelector(`[data-sort="${this._sortKey}"]`);
    if (activeColumn) {
      activeColumn.classList.add(`sort-${this._sortDirection}`);
    }
  }

  /**
   * Update empty state visibility
   * @private
   */
  _updateEmptyState() {
    const hasProcesses = this._filteredProcesses.length > 0;

    this.elements.emptyState.style.display = hasProcesses ? 'none' : 'block';
    this.elements.viewport.style.display = hasProcesses ? 'block' : 'none';
  }

  /**
   * Render visible rows in the viewport
   * @private
   */
  _renderVisibleRows() {
    if (this._filteredProcesses.length === 0) {
      this.elements.content.innerHTML = '';
      return;
    }

    if (!this.options.virtualScroll) {
      this._renderAllRows();
      return;
    }

    // Clear content
    this.elements.content.innerHTML = '';

    // Set content offset for virtual scrolling
    const offsetTop = this._visibleStartIndex * this.options.rowHeight;
    this.elements.content.style.transform = `translateY(${offsetTop}px)`;

    // Render visible range
    for (let i = this._visibleStartIndex; i < this._visibleEndIndex; i++) {
      if (i >= this._filteredProcesses.length) break;

      const process = this._filteredProcesses[i];
      const rowElement = this._createRowElement(process);
      this.elements.content.appendChild(rowElement);

      // Store reference for updates
      this._rowElements.set(process.pid, rowElement);
    }
  }

  /**
   * Render all rows (non-virtual scrolling)
   * @private
   */
  _renderAllRows() {
    this.elements.content.innerHTML = '';
    this.elements.content.style.transform = '';

    this._filteredProcesses.forEach(process => {
      const rowElement = this._createRowElement(process);
      this.elements.content.appendChild(rowElement);
      this._rowElements.set(process.pid, rowElement);
    });
  }

  /**
   * Create a row element for a process
   * @private
   * @param {Object} process - Process data
   * @returns {HTMLElement} Row element
   */
  _createRowElement(process) {
    const row = this._createElement('div', 'process-row');
    row.setAttribute('data-pid', process.pid);
    row.style.height = `${this.options.rowHeight}px`;

    // Add status classes
    row.classList.add(`status-${process.status}`);
    if (process.indicator && process.indicator.pulse) {
      row.classList.add('pulse');
    }

    // Add selection state
    if (this._selectedPids.has(process.pid)) {
      row.classList.add('selected');
    }

    // Build row content
    row.innerHTML = this._generateRowHTML(process);

    return row;
  }

  /**
   * Generate HTML for a process row
   * @private
   * @param {Object} process - Process data
   * @returns {string} Row HTML
   */
  _generateRowHTML(process) {
    const columns = [];

    // Status indicator
    columns.push(`
      <div class="column column-status">
        <div class="status-indicator"
             style="background-color: ${process.indicator.color}"
             title="${process.status}">
          <i class="icon-${process.indicator.icon}"></i>
        </div>
      </div>
    `);

    // Process name and PID
    columns.push(`
      <div class="column column-name">
        <div class="process-name">${this._escapeHtml(process.name)}</div>
        <div class="process-pid">PID: ${process.pid}</div>
        ${this.options.showWarnings && process.warnings.length > 0 ?
          `<div class="warnings">
            <span class="warning-count">${process.warnings.length}</span>
            <span class="warning-icon">⚠</span>
          </div>` : ''}
      </div>
    `);

    // Health bar (if enabled)
    if (this.options.showHealth) {
      columns.push(`
        <div class="column column-health">
          <div class="health-bar">
            <div class="health-fill" style="width: ${process.health}%"></div>
          </div>
          <div class="health-value">${process.health}%</div>
        </div>
      `);
    }

    // CPU usage
    if (this.options.showResources) {
      columns.push(`
        <div class="column column-cpu">
          <div class="resource-bar">
            <div class="resource-fill" style="width: ${Math.min(process.cpu, 100)}%"></div>
          </div>
          <div class="resource-value">${process.cpu.toFixed(1)}%</div>
        </div>
      `);
    } else {
      columns.push(`
        <div class="column column-cpu">
          <div class="resource-value">${process.cpu.toFixed(1)}%</div>
        </div>
      `);
    }

    // Memory usage
    if (this.options.showResources) {
      const memoryPercent = Math.min((process.memory / 2048) * 100, 100); // Assume 2GB max
      columns.push(`
        <div class="column column-memory">
          <div class="resource-bar">
            <div class="resource-fill" style="width: ${memoryPercent}%"></div>
          </div>
          <div class="resource-value">${process.memory}MB</div>
        </div>
      `);
    } else {
      columns.push(`
        <div class="column column-memory">
          <div class="resource-value">${process.memory}MB</div>
        </div>
      `);
    }

    return columns.join('');
  }

  /**
   * Escape HTML to prevent XSS
   * @private
   * @param {string} text - Text to escape
   * @returns {string} Escaped text
   */
  _escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Event handlers

  /**
   * Handle header click for sorting
   * @private
   * @param {Event} event - Click event
   */
  _handleHeaderClick(event) {
    const column = event.target.closest('.column[data-sort]');
    if (!column) return;

    const sortKey = column.getAttribute('data-sort');
    const currentDirection = this._sortKey === sortKey ? this._sortDirection : 'desc';
    const newDirection = currentDirection === 'desc' ? 'asc' : 'desc';

    this.sort(sortKey, newDirection);
  }

  /**
   * Handle viewport scroll
   * @private
   * @param {Event} event - Scroll event
   */
  _handleScroll(event) {
    if (!this.options.virtualScroll) return;

    this._updateScrollState();
    this._renderVisibleRows();
  }

  /**
   * Handle process row click
   * @private
   * @param {Event} event - Click event
   */
  _handleProcessClick(event) {
    if (!this.options.interactive) return;

    const row = event.target.closest('.process-row');
    if (!row) return;

    const pid = parseInt(row.getAttribute('data-pid'));
    const process = this._processMap.get(pid);

    if (!process) return;

    // Handle selection
    if (this.options.selectable) {
      if (event.ctrlKey && this.options.multiSelect) {
        // Toggle selection
        if (this._selectedPids.has(pid)) {
          this.deselect(pid);
        } else {
          this.select(pid);
        }
      } else if (event.shiftKey && this.options.multiSelect && this._selectedPids.size > 0) {
        // Range selection
        this._handleRangeSelection(pid);
      } else {
        // Single selection
        this.clearSelection();
        this.select(pid);
      }
    }

    // Emit click event
    this.emit('process-click', {
      process: process,
      event: event,
      ctrlKey: event.ctrlKey,
      shiftKey: event.shiftKey
    });
  }

  /**
   * Handle range selection
   * @private
   * @param {number} endPid - End PID for range selection
   */
  _handleRangeSelection(endPid) {
    const processes = this._getDisplayedProcesses();
    const selectedPids = [...this._selectedPids];

    if (selectedPids.length === 0) {
      this.select(endPid);
      return;
    }

    const lastSelectedPid = selectedPids[selectedPids.length - 1];
    const startIndex = processes.findIndex(p => p.pid === lastSelectedPid);
    const endIndex = processes.findIndex(p => p.pid === endPid);

    if (startIndex === -1 || endIndex === -1) return;

    const minIndex = Math.min(startIndex, endIndex);
    const maxIndex = Math.max(startIndex, endIndex);

    // Select range
    for (let i = minIndex; i <= maxIndex; i++) {
      this.select(processes[i].pid);
    }
  }

  /**
   * Handle process hover
   * @private
   * @param {Event} event - Mouseover event
   */
  _handleProcessHover(event) {
    const row = event.target.closest('.process-row');
    if (!row) return;

    const pid = parseInt(row.getAttribute('data-pid'));
    const process = this._processMap.get(pid);

    if (!process) return;

    this._hoveredPid = pid;
    row.classList.add('hovered');

    this.emit('process-hover', {
      process: process,
      event: event
    });
  }

  /**
   * Handle process hover out
   * @private
   * @param {Event} event - Mouseout event
   */
  _handleProcessHoverOut(event) {
    const row = event.target.closest('.process-row');
    if (!row) return;

    this._hoveredPid = null;
    row.classList.remove('hovered');
  }

  /**
   * Handle process context menu
   * @private
   * @param {Event} event - Context menu event
   */
  _handleProcessContextMenu(event) {
    if (!this.options.interactive) return;

    event.preventDefault();

    const row = event.target.closest('.process-row');
    if (!row) return;

    const pid = parseInt(row.getAttribute('data-pid'));
    const process = this._processMap.get(pid);

    if (!process) return;

    this.emit('process-context-menu', {
      process: process,
      event: event,
      selected: this._selectedPids.has(pid)
    });
  }

  /**
   * Handle keyboard navigation
   * @private
   * @param {Event} event - Keydown event
   */
  _handleKeyDown(event) {
    if (!this.options.interactive) return;

    const processes = this._getDisplayedProcesses();
    if (processes.length === 0) return;

    let currentIndex = -1;
    if (this._selectedPids.size > 0) {
      const lastSelected = [...this._selectedPids].pop();
      currentIndex = processes.findIndex(p => p.pid === lastSelected);
    }

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this._navigateToIndex(Math.min(currentIndex + 1, processes.length - 1), event);
        break;

      case 'ArrowUp':
        event.preventDefault();
        this._navigateToIndex(Math.max(currentIndex - 1, 0), event);
        break;

      case ' ':
        event.preventDefault();
        if (currentIndex >= 0 && this.options.selectable) {
          const pid = processes[currentIndex].pid;
          if (this._selectedPids.has(pid)) {
            this.deselect(pid);
          } else {
            this.select(pid);
          }
        }
        break;

      case 'a':
        if (event.ctrlKey && this.options.multiSelect) {
          event.preventDefault();
          this.selectAll();
        }
        break;

      case 'Escape':
        event.preventDefault();
        this.clearSelection();
        break;
    }
  }

  /**
   * Navigate to specific index
   * @private
   * @param {number} index - Target index
   * @param {Event} event - Keyboard event
   */
  _navigateToIndex(index, event) {
    const processes = this._getDisplayedProcesses();
    if (index < 0 || index >= processes.length) return;

    const process = processes[index];

    if (!event.shiftKey || !this.options.multiSelect) {
      this.clearSelection();
    }

    this.select(process.pid);
    this.scrollTo(process.pid);
  }
}
