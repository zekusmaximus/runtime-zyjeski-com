// MemoryMap.js - Memory visualization component for runtime.zyjeski.com
// Visualizes consciousness memory allocation as a spatial map showing memories, emotions, and thoughts

/**
 * MemoryMap - High-performance Canvas-based memory visualization component
 * 
 * Features:
 * - Grid-based memory visualization (address space as 2D map)
 * - Color coding by memory type (emotion, trauma, relationship, system)
 * - Interactive hover tooltips showing memory details
 * - Click to inspect memory block contents
 * - Zoom and pan functionality for large memory spaces
 * - Heatmap mode showing access frequency
 * - Fragmentation visualization
 * - Memory allocation animations
 * - Search by address or content
 * - Mini-map for navigation in large memory spaces
 * 
 * Usage:
 * const memoryMap = new MemoryMap(container, {
 *   gridSize: { width: 64, height: 32 },
 *   blockSize: 16,
 *   viewMode: 'type',
 *   enableZoom: true,
 *   enablePan: true
 * });
 */

export default class MemoryMap {
  constructor(container, options = {}) {
    if (!container) {
      throw new Error('MemoryMap: Container element is required');
    }
    
    this.container = container;
    this.options = {
      // Grid configuration
      gridSize: { width: 64, height: 32 },
      blockSize: 16,
      
      // View configuration
      viewMode: 'type', // 'type' | 'access' | 'fragmentation' | 'age'
      colorScheme: {
        emotion: '#FF6B6B',      // Red for emotional memories
        trauma: '#845EC2',       // Purple for traumatic memories
        relationship: '#4E8397', // Blue for relationship memories
        system: '#B39CD0',       // Light purple for system memories
        free: '#2C2C2C',        // Dark gray for free space
        fragmented: '#FFB800'    // Yellow for fragmented blocks
      },
      
      // Interaction configuration
      enableZoom: true,
      zoomLevels: [0.5, 1, 2, 4],
      enablePan: true,
      enableTooltip: true,
      enableMinimap: true,
      minimapSize: { width: 150, height: 75 },
      
      // Animation configuration
      animateAllocations: true,
      animationDuration: 300,
      
      // Display configuration
      showAddresses: true,
      addressFormat: 'hex', // 'hex' | 'decimal'
      
      // Callbacks
      onBlockClick: null,
      onBlockHover: null,
      
      ...options
    };
    
    // Component state
    this.memoryData = null;
    this.currentZoomLevel = 1;
    this.currentZoomIndex = this.options.zoomLevels.indexOf(1);
    this.panOffset = { x: 0, y: 0 };
    this.isPanning = false;
    this.lastPanPoint = { x: 0, y: 0 };
    this.highlights = new Map(); // Persistent highlights
    this.searchResults = [];
    this.animationFrameId = null;
    this.isDestroyed = false;
    
    // Performance tracking
    this.renderCount = 0;
    this.lastRenderTime = 0;

    // Event system
    this._eventListeners = new Map();

    // Canvas contexts
    this.baseCanvas = null;
    this.baseCtx = null;
    this.interactiveCanvas = null;
    this.interactiveCtx = null;
    this.overlayCanvas = null;
    this.overlayCtx = null;
    
    // Mini-map
    this.minimapCanvas = null;
    this.minimapCtx = null;
    
    // Spatial indexing for performance
    this.spatialIndex = new Map();
    
    // Bind methods
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.handleMouseUp = this.handleMouseUp.bind(this);
    this.handleWheel = this.handleWheel.bind(this);
    this.handleClick = this.handleClick.bind(this);
    this.handleResize = this.handleResize.bind(this);
    this.render = this.render.bind(this);
    
    // Initialize component
    this.init();
  }
  
  /**
   * Initialize the component
   * @private
   */
  init() {
    try {
      this.validateOptions();
      this.createDOMStructure();
      this.initCanvases();
      this.setupEventListeners();
      this.buildSpatialIndex();
      this.render();
      
      console.log('MemoryMap: Initialized successfully', {
        options: this.options,
        container: this.container
      });
    } catch (error) {
      console.error('MemoryMap: Initialization failed', error);
      throw error;
    }
  }
  
  /**
   * Validate component options
   * @private
   */
  validateOptions() {
    if (!this.options.gridSize || typeof this.options.gridSize.width !== 'number' || typeof this.options.gridSize.height !== 'number') {
      throw new Error('MemoryMap: gridSize must be an object with width and height numbers');
    }
    
    if (typeof this.options.blockSize !== 'number' || this.options.blockSize <= 0) {
      throw new Error('MemoryMap: blockSize must be a positive number');
    }
    
    if (!['type', 'access', 'fragmentation', 'age'].includes(this.options.viewMode)) {
      throw new Error('MemoryMap: viewMode must be one of: type, access, fragmentation, age');
    }
    
    if (!Array.isArray(this.options.zoomLevels) || this.options.zoomLevels.length === 0) {
      throw new Error('MemoryMap: zoomLevels must be a non-empty array');
    }
  }
  
  /**
   * Create DOM structure
   * @private
   */
  createDOMStructure() {
    this.container.classList.add('memory-map');
    this.container.innerHTML = '';
    
    // Main canvas container
    this.canvasContainer = document.createElement('div');
    this.canvasContainer.className = 'memory-map__canvas-container';
    this.container.appendChild(this.canvasContainer);
    
    // Mini-map container (if enabled)
    if (this.options.enableMinimap) {
      this.minimapContainer = document.createElement('div');
      this.minimapContainer.className = 'memory-map__minimap';
      this.container.appendChild(this.minimapContainer);
    }
    
    // Tooltip container
    this.tooltip = document.createElement('div');
    this.tooltip.className = 'memory-map__tooltip';
    this.tooltip.style.display = 'none';
    this.container.appendChild(this.tooltip);
  }
  
  /**
   * Initialize canvas layers
   * @private
   */
  initCanvases() {
    const canvasWidth = this.options.gridSize.width * this.options.blockSize;
    const canvasHeight = this.options.gridSize.height * this.options.blockSize;
    
    // Base layer - static memory blocks
    this.baseCanvas = this.createCanvas('memory-map__canvas--base', canvasWidth, canvasHeight);
    this.baseCtx = this.baseCanvas.getContext('2d');
    this.canvasContainer.appendChild(this.baseCanvas);
    
    // Interactive layer - highlights, hover effects
    this.interactiveCanvas = this.createCanvas('memory-map__canvas--interactive', canvasWidth, canvasHeight);
    this.interactiveCtx = this.interactiveCanvas.getContext('2d');
    this.canvasContainer.appendChild(this.interactiveCanvas);
    
    // Overlay layer - tooltips, labels
    this.overlayCanvas = this.createCanvas('memory-map__canvas--overlay', canvasWidth, canvasHeight);
    this.overlayCtx = this.overlayCanvas.getContext('2d');
    this.canvasContainer.appendChild(this.overlayCanvas);
    
    // Mini-map canvas
    if (this.options.enableMinimap) {
      this.minimapCanvas = this.createCanvas('memory-map__minimap-canvas',
        this.options.minimapSize.width, this.options.minimapSize.height);
      this.minimapCtx = this.minimapCanvas.getContext('2d');
      this.minimapContainer.appendChild(this.minimapCanvas);

      // Add minimap event listeners
      this.minimapCanvas.addEventListener('click', this.handleMinimapClick.bind(this));
    }
    
    // Set up high DPI support
    this.setupHighDPI();
  }
  
  /**
   * Create a canvas element with proper configuration
   * @private
   */
  createCanvas(className, width, height) {
    const canvas = document.createElement('canvas');
    canvas.className = className;
    canvas.width = width;
    canvas.height = height;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    return canvas;
  }
  
  /**
   * Set up high DPI support for retina displays
   * @private
   */
  setupHighDPI() {
    const dpr = window.devicePixelRatio || 1;
    if (dpr === 1) return;
    
    const canvases = [this.baseCanvas, this.interactiveCanvas, this.overlayCanvas];
    if (this.minimapCanvas) canvases.push(this.minimapCanvas);
    
    canvases.forEach(canvas => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      const ctx = canvas.getContext('2d');
      ctx.scale(dpr, dpr);
    });
  }
  
  /**
   * Set up event listeners
   * @private
   */
  setupEventListeners() {
    // Mouse events for interaction
    this.canvasContainer.addEventListener('mousemove', this.handleMouseMove);
    this.canvasContainer.addEventListener('mousedown', this.handleMouseDown);
    this.canvasContainer.addEventListener('mouseup', this.handleMouseUp);
    this.canvasContainer.addEventListener('click', this.handleClick);
    
    // Wheel event for zoom
    if (this.options.enableZoom) {
      this.canvasContainer.addEventListener('wheel', this.handleWheel, { passive: false });
    }
    
    // Window resize
    window.addEventListener('resize', this.handleResize);
    
    // Prevent context menu on right click
    this.canvasContainer.addEventListener('contextmenu', (e) => e.preventDefault());
  }
  
  /**
   * Build spatial index for efficient hit detection
   * @private
   */
  buildSpatialIndex() {
    this.spatialIndex.clear();
    
    if (!this.memoryData || !this.memoryData.blocks) return;
    
    this.memoryData.blocks.forEach(block => {
      const coords = this.addressToCoordinates(block.address);
      if (coords) {
        const key = `${coords.x},${coords.y}`;
        this.spatialIndex.set(key, block);
      }
    });
  }
  
  /**
   * Main render method - orchestrates all rendering layers
   */
  render() {
    if (this.isDestroyed) return;

    const startTime = performance.now();

    try {
      this.renderBaseLayer();
      this.renderInteractiveLayer();
      this.renderOverlayLayer();

      if (this.options.enableMinimap) {
        this.updateMinimapVisibility();
        this.renderMinimap();
      }

      // Performance tracking
      const renderTime = performance.now() - startTime;
      this.lastRenderTime = renderTime;
      this.renderCount++;

      if (renderTime > 16) { // More than one frame at 60fps
        console.warn(`MemoryMap: Render took ${renderTime.toFixed(2)}ms (target: <16ms)`);
      }

    } catch (error) {
      console.error('MemoryMap: Render failed', error);
    }
  }

  /**
   * Render base layer with static memory blocks
   * @private
   */
  renderBaseLayer() {
    if (!this.baseCtx) {
      console.warn('MemoryMap: No base context available for rendering');
      return;
    }

    // Clear canvas
    this.baseCtx.clearRect(0, 0, this.baseCanvas.width, this.baseCanvas.height);

    // Draw grid background
    this.drawGrid(this.baseCtx);

    // Draw memory blocks
    if (this.memoryData && this.memoryData.blocks) {
      console.log(`MemoryMap: Rendering ${this.memoryData.blocks.length} memory blocks`);
      this.memoryData.blocks.forEach(block => {
        this.drawMemoryBlock(this.baseCtx, block);
      });
    } else {
      console.warn('MemoryMap: No memory data available for rendering', this.memoryData);
    }

    // Draw addresses if enabled
    if (this.options.showAddresses) {
      this.drawAddresses(this.baseCtx);
    }
  }

  /**
   * Render interactive layer with highlights and hover effects
   * @private
   */
  renderInteractiveLayer() {
    if (!this.interactiveCtx) return;

    // Clear canvas
    this.interactiveCtx.clearRect(0, 0, this.interactiveCanvas.width, this.interactiveCanvas.height);

    // Draw persistent highlights
    this.highlights.forEach((highlight, address) => {
      const block = this.getBlockByAddress(address);
      if (block) {
        this.drawHighlight(this.interactiveCtx, block, highlight);
      }
    });

    // Draw search results
    this.searchResults.forEach(address => {
      const block = this.getBlockByAddress(address);
      if (block) {
        this.drawSearchHighlight(this.interactiveCtx, block);
      }
    });
  }

  /**
   * Render overlay layer with tooltips and labels
   * @private
   */
  renderOverlayLayer() {
    if (!this.overlayCtx) return;

    // Clear canvas
    this.overlayCtx.clearRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height);

    // Overlay rendering is mostly handled by DOM elements (tooltips)
    // This layer is reserved for canvas-based overlays if needed
  }

  /**
   * Render mini-map
   * @private
   */
  renderMinimap() {
    if (!this.minimapCtx) return;

    // Clear mini-map
    this.minimapCtx.clearRect(0, 0, this.minimapCanvas.width, this.minimapCanvas.height);

    // Calculate scale factor
    const scaleX = this.options.minimapSize.width / (this.options.gridSize.width * this.options.blockSize);
    const scaleY = this.options.minimapSize.height / (this.options.gridSize.height * this.options.blockSize);
    const scale = Math.min(scaleX, scaleY);

    // Save context
    this.minimapCtx.save();
    this.minimapCtx.scale(scale, scale);

    // Draw simplified memory blocks
    if (this.memoryData && this.memoryData.blocks) {
      this.memoryData.blocks.forEach(block => {
        this.drawMinimapBlock(this.minimapCtx, block);
      });
    }

    // Draw viewport indicator
    this.drawViewportIndicator(this.minimapCtx, scale);

    // Restore context
    this.minimapCtx.restore();
  }

  /**
   * Draw grid background
   * @private
   */
  drawGrid(ctx) {
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 0.5;
    ctx.globalAlpha = 0.3;

    const blockSize = this.options.blockSize * this.currentZoomLevel;
    const gridWidth = this.options.gridSize.width;
    const gridHeight = this.options.gridSize.height;

    // Vertical lines
    for (let x = 0; x <= gridWidth; x++) {
      const xPos = x * blockSize + this.panOffset.x;
      ctx.beginPath();
      ctx.moveTo(xPos, this.panOffset.y);
      ctx.lineTo(xPos, gridHeight * blockSize + this.panOffset.y);
      ctx.stroke();
    }

    // Horizontal lines
    for (let y = 0; y <= gridHeight; y++) {
      const yPos = y * blockSize + this.panOffset.y;
      ctx.beginPath();
      ctx.moveTo(this.panOffset.x, yPos);
      ctx.lineTo(gridWidth * blockSize + this.panOffset.x, yPos);
      ctx.stroke();
    }

    ctx.globalAlpha = 1;
  }

  /**
   * Draw a memory block
   * @private
   */
  drawMemoryBlock(ctx, block) {
    const coords = this.addressToCoordinates(block.address);
    if (!coords) return;

    const blockSize = this.options.blockSize * this.currentZoomLevel;
    const x = coords.x * blockSize + this.panOffset.x;
    const y = coords.y * blockSize + this.panOffset.y;
    const width = (block.size || 1) * blockSize;
    const height = blockSize;

    // Get color based on view mode
    const color = this.getBlockColor(block);

    // Draw block
    ctx.fillStyle = color;
    ctx.fillRect(x, y, width, height);

    // Draw border
    ctx.strokeStyle = this.getBorderColor(block);
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, width, height);

    // Draw additional visual indicators based on block properties
    this.drawBlockIndicators(ctx, block, x, y, width, height);
  }

  /**
   * Get block color based on current view mode
   * @private
   */
  getBlockColor(block) {
    switch (this.options.viewMode) {
      case 'type':
        return this.options.colorScheme[block.type] || this.options.colorScheme.free;

      case 'access':
        return this.getAccessHeatmapColor(block);

      case 'fragmentation':
        return block.content?.fragmented ? this.options.colorScheme.fragmented : this.options.colorScheme[block.type];

      case 'age':
        return this.getAgeGradientColor(block);

      default:
        return this.options.colorScheme[block.type] || this.options.colorScheme.free;
    }
  }

  /**
   * Get access heatmap color based on access frequency
   * @private
   */
  getAccessHeatmapColor(block) {
    if (!block.content?.accessCount) {
      return '#1a1a1a'; // Very dark for never accessed
    }

    // Normalize access count to 0-1 range (assuming max of 100 accesses)
    const normalized = Math.min(block.content.accessCount / 100, 1);

    // Create heat gradient: blue (cold) -> green -> yellow -> red (hot)
    if (normalized < 0.25) {
      return `hsl(240, 100%, ${20 + normalized * 40}%)`; // Blue to cyan
    } else if (normalized < 0.5) {
      return `hsl(${240 - (normalized - 0.25) * 240}, 100%, 60%)`; // Cyan to green
    } else if (normalized < 0.75) {
      return `hsl(${120 - (normalized - 0.5) * 60}, 100%, 60%)`; // Green to yellow
    } else {
      return `hsl(${60 - (normalized - 0.75) * 60}, 100%, 60%)`; // Yellow to red
    }
  }

  /**
   * Get age gradient color
   * @private
   */
  getAgeGradientColor(block) {
    if (!block.content?.age) {
      return this.options.colorScheme[block.type];
    }

    // Normalize age to 0-1 range (assuming max age of 1 year)
    const maxAge = 365 * 24 * 60 * 60 * 1000; // 1 year in milliseconds
    const normalized = Math.min(block.content.age / maxAge, 1);

    // Fade from bright to dark based on age
    const baseColor = this.options.colorScheme[block.type];
    const brightness = 1 - normalized * 0.7; // Keep some minimum brightness

    return this.adjustColorBrightness(baseColor, brightness);
  }

  /**
   * Adjust color brightness
   * @private
   */
  adjustColorBrightness(color, brightness) {
    // Simple brightness adjustment - multiply RGB values
    const hex = color.replace('#', '');
    const r = Math.round(parseInt(hex.substr(0, 2), 16) * brightness);
    const g = Math.round(parseInt(hex.substr(2, 2), 16) * brightness);
    const b = Math.round(parseInt(hex.substr(4, 2), 16) * brightness);

    return `rgb(${r}, ${g}, ${b})`;
  }

  /**
   * Get border color for memory block
   * @private
   */
  getBorderColor(block) {
    if (block.metadata?.protected) {
      return '#FFD700'; // Gold for protected memory
    }
    if (block.content?.fragmented) {
      return '#FF4444'; // Red for fragmented memory
    }
    return '#555555'; // Default border
  }

  /**
   * Draw additional block indicators
   * @private
   */
  drawBlockIndicators(ctx, block, x, y, width, height) {
    // Draw protection indicator
    if (block.metadata?.protected) {
      ctx.fillStyle = '#FFD700';
      ctx.fillRect(x + width - 4, y, 4, 4);
    }

    // Draw compression indicator
    if (block.metadata?.compressed) {
      ctx.fillStyle = '#00FFFF';
      ctx.fillRect(x, y + height - 4, 4, 4);
    }

    // Draw access frequency indicator (pulsing effect for recently accessed)
    if (block.content?.lastAccess && Date.now() - block.content.lastAccess < 5000) {
      const alpha = 0.5 + 0.5 * Math.sin(Date.now() / 200);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(x + 1, y + 1, width - 2, height - 2);
      ctx.globalAlpha = 1;
    }
  }

  /**
   * Draw highlight for memory block
   * @private
   */
  drawHighlight(ctx, block, highlight) {
    const coords = this.addressToCoordinates(block.address);
    if (!coords) return;

    const blockSize = this.options.blockSize * this.currentZoomLevel;
    const x = coords.x * blockSize + this.panOffset.x;
    const y = coords.y * blockSize + this.panOffset.y;
    const width = (block.size || 1) * blockSize;
    const height = blockSize;

    // Draw highlight border
    ctx.strokeStyle = highlight.color || '#FFFF00';
    ctx.lineWidth = highlight.width || 2;
    ctx.setLineDash(highlight.dashed ? [5, 5] : []);
    ctx.strokeRect(x - 1, y - 1, width + 2, height + 2);
    ctx.setLineDash([]);

    // Draw highlight overlay
    if (highlight.overlay) {
      ctx.fillStyle = highlight.color || '#FFFF00';
      ctx.globalAlpha = 0.2;
      ctx.fillRect(x, y, width, height);
      ctx.globalAlpha = 1;
    }
  }

  /**
   * Draw search highlight
   * @private
   */
  drawSearchHighlight(ctx, block) {
    this.drawHighlight(ctx, block, {
      color: '#00FF00',
      width: 3,
      dashed: true,
      overlay: true
    });
  }

  /**
   * Draw minimap block (simplified)
   * @private
   */
  drawMinimapBlock(ctx, block) {
    const coords = this.addressToCoordinates(block.address);
    if (!coords) return;

    const x = coords.x * this.options.blockSize;
    const y = coords.y * this.options.blockSize;
    const width = (block.size || 1) * this.options.blockSize;
    const height = this.options.blockSize;

    // Use simplified color scheme for minimap
    ctx.fillStyle = this.options.colorScheme[block.type] || this.options.colorScheme.free;
    ctx.fillRect(x, y, width, height);
  }

  /**
   * Draw viewport indicator on minimap
   * @private
   */
  drawViewportIndicator(ctx, scale) {
    const viewportWidth = this.canvasContainer.clientWidth / this.currentZoomLevel;
    const viewportHeight = this.canvasContainer.clientHeight / this.currentZoomLevel;
    const x = -this.panOffset.x / this.currentZoomLevel;
    const y = -this.panOffset.y / this.currentZoomLevel;

    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2 / scale;
    ctx.setLineDash([5 / scale, 5 / scale]);
    ctx.strokeRect(x, y, viewportWidth, viewportHeight);
    ctx.setLineDash([]);
  }

  /**
   * Draw addresses on grid
   * @private
   */
  drawAddresses(ctx) {
    if (this.currentZoomLevel < 2) return; // Only show addresses when zoomed in

    ctx.fillStyle = '#888888';
    ctx.font = `${Math.max(8, this.options.blockSize * this.currentZoomLevel / 4)}px monospace`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    const blockSize = this.options.blockSize * this.currentZoomLevel;

    for (let y = 0; y < this.options.gridSize.height; y += 4) { // Show every 4th row
      for (let x = 0; x < this.options.gridSize.width; x += 8) { // Show every 8th column
        const address = this.coordinatesToAddress(x, y);
        const xPos = x * blockSize + this.panOffset.x + 2;
        const yPos = y * blockSize + this.panOffset.y + 2;

        ctx.fillText(address, xPos, yPos);
      }
    }
  }

  /**
   * Convert memory address to grid coordinates
   * @private
   */
  addressToCoordinates(address) {
    if (!address) return null;

    // Parse hex address (e.g., "0x0000" -> 0)
    const numericAddress = typeof address === 'string' ?
      parseInt(address.replace('0x', ''), 16) : address;

    // Convert linear address to 2D coordinates
    const x = numericAddress % this.options.gridSize.width;
    const y = Math.floor(numericAddress / this.options.gridSize.width);

    return { x, y };
  }

  /**
   * Convert grid coordinates to memory address
   * @private
   */
  coordinatesToAddress(x, y) {
    const linearAddress = y * this.options.gridSize.width + x;

    if (this.options.addressFormat === 'hex') {
      return `0x${linearAddress.toString(16).padStart(4, '0').toUpperCase()}`;
    } else {
      return linearAddress.toString();
    }
  }

  /**
   * Get memory block by address
   * @private
   */
  getBlockByAddress(address) {
    if (!this.memoryData || !this.memoryData.blocks) return null;

    return this.memoryData.blocks.find(block => block.address === address);
  }

  /**
   * Handle mouse move events
   * @private
   */
  handleMouseMove(event) {
    if (this.isDestroyed) return;

    const rect = this.canvasContainer.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Handle panning
    if (this.isPanning && this.options.enablePan) {
      const deltaX = x - this.lastPanPoint.x;
      const deltaY = y - this.lastPanPoint.y;

      this.panOffset.x += deltaX;
      this.panOffset.y += deltaY;

      this.lastPanPoint = { x, y };

      // Request render
      this.requestRender();
      return;
    }

    // Handle hover effects
    if (this.options.enableTooltip) {
      const block = this.getBlockAtPosition(x, y);

      if (block) {
        this.showTooltip(event, block);

        // Call hover callback
        if (this.options.onBlockHover) {
          this.options.onBlockHover(block);
        }
      } else {
        this.hideTooltip();
      }
    }
  }

  /**
   * Handle mouse down events
   * @private
   */
  handleMouseDown(event) {
    if (this.isDestroyed) return;

    if (event.button === 0 && this.options.enablePan) { // Left mouse button
      this.isPanning = true;
      const rect = this.canvasContainer.getBoundingClientRect();
      this.lastPanPoint = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      };

      this.canvasContainer.style.cursor = 'grabbing';
      event.preventDefault();
    }
  }

  /**
   * Handle mouse up events
   * @private
   */
  handleMouseUp(event) {
    if (this.isDestroyed) return;

    if (this.isPanning) {
      this.isPanning = false;
      this.canvasContainer.style.cursor = 'grab';
    }
  }

  /**
   * Handle wheel events for zooming
   * @private
   */
  handleWheel(event) {
    if (this.isDestroyed || !this.options.enableZoom) return;

    event.preventDefault();

    const rect = this.canvasContainer.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    // Determine zoom direction
    const zoomIn = event.deltaY < 0;

    if (zoomIn && this.currentZoomIndex < this.options.zoomLevels.length - 1) {
      this.zoomIn(mouseX, mouseY);
    } else if (!zoomIn && this.currentZoomIndex > 0) {
      this.zoomOut(mouseX, mouseY);
    }
  }

  /**
   * Handle click events
   * @private
   */
  handleClick(event) {
    if (this.isDestroyed) return;

    // Don't handle click if we were panning
    if (this.isPanning) return;

    const rect = this.canvasContainer.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const block = this.getBlockAtPosition(x, y);

    if (block) {
      // Clear previous highlights and add new one
      this.clearHighlights();
      this.highlightBlock(block.address, {
        color: '#FFFF00',
        width: 3,
        overlay: true
      });

      // Highlight linked memories
      if (block.content?.linked) {
        block.content.linked.forEach(linkedAddress => {
          this.highlightBlock(linkedAddress, {
            color: '#FF8800',
            width: 2,
            dashed: true
          });
        });
      }

      // Call click callback
      if (this.options.onBlockClick) {
        this.options.onBlockClick(block);
      }

      // Emit block-clicked event
      this.emit('block-clicked', block);

      this.requestRender();
    }
  }

  /**
   * Handle window resize
   * @private
   */
  handleResize() {
    if (this.isDestroyed) return;

    // Debounce resize handling
    clearTimeout(this.resizeTimeout);
    this.resizeTimeout = setTimeout(() => {
      this.setupHighDPI();
      this.requestRender();
    }, 100);
  }

  /**
   * Zoom in at specific point
   */
  zoomIn(centerX = null, centerY = null) {
    if (this.currentZoomIndex >= this.options.zoomLevels.length - 1) return;

    const oldZoom = this.currentZoomLevel;
    this.currentZoomIndex++;
    this.currentZoomLevel = this.options.zoomLevels[this.currentZoomIndex];

    // Adjust pan offset to zoom towards the specified point
    if (centerX !== null && centerY !== null) {
      const zoomFactor = this.currentZoomLevel / oldZoom;
      this.panOffset.x = centerX - (centerX - this.panOffset.x) * zoomFactor;
      this.panOffset.y = centerY - (centerY - this.panOffset.y) * zoomFactor;
    }

    this.requestRender();
  }

  /**
   * Zoom out at specific point
   */
  zoomOut(centerX = null, centerY = null) {
    if (this.currentZoomIndex <= 0) return;

    const oldZoom = this.currentZoomLevel;
    this.currentZoomIndex--;
    this.currentZoomLevel = this.options.zoomLevels[this.currentZoomIndex];

    // Adjust pan offset to zoom towards the specified point
    if (centerX !== null && centerY !== null) {
      const zoomFactor = this.currentZoomLevel / oldZoom;
      this.panOffset.x = centerX - (centerX - this.panOffset.x) * zoomFactor;
      this.panOffset.y = centerY - (centerY - this.panOffset.y) * zoomFactor;
    }

    this.requestRender();
  }

  /**
   * Zoom to fit entire memory map in view
   */
  zoomToFit() {
    const containerWidth = this.canvasContainer.clientWidth;
    const containerHeight = this.canvasContainer.clientHeight;
    const mapWidth = this.options.gridSize.width * this.options.blockSize;
    const mapHeight = this.options.gridSize.height * this.options.blockSize;

    const scaleX = containerWidth / mapWidth;
    const scaleY = containerHeight / mapHeight;
    const targetZoom = Math.min(scaleX, scaleY);

    // Find closest zoom level
    let closestIndex = 0;
    let closestDiff = Math.abs(this.options.zoomLevels[0] - targetZoom);

    for (let i = 1; i < this.options.zoomLevels.length; i++) {
      const diff = Math.abs(this.options.zoomLevels[i] - targetZoom);
      if (diff < closestDiff) {
        closestDiff = diff;
        closestIndex = i;
      }
    }

    this.currentZoomIndex = closestIndex;
    this.currentZoomLevel = this.options.zoomLevels[closestIndex];

    // Center the map
    this.panOffset.x = (containerWidth - mapWidth * this.currentZoomLevel) / 2;
    this.panOffset.y = (containerHeight - mapHeight * this.currentZoomLevel) / 2;

    this.requestRender();
  }

  /**
   * Pan to specific coordinates
   */
  panTo(x, y) {
    this.panOffset.x = -x * this.options.blockSize * this.currentZoomLevel;
    this.panOffset.y = -y * this.options.blockSize * this.currentZoomLevel;
    this.requestRender();
  }

  /**
   * Center view on memory address
   */
  centerOn(address) {
    const coords = this.addressToCoordinates(address);
    if (!coords) return;

    const containerWidth = this.canvasContainer.clientWidth;
    const containerHeight = this.canvasContainer.clientHeight;
    const blockSize = this.options.blockSize * this.currentZoomLevel;

    this.panOffset.x = containerWidth / 2 - (coords.x * blockSize + blockSize / 2);
    this.panOffset.y = containerHeight / 2 - (coords.y * blockSize + blockSize / 2);

    this.requestRender();
  }

  /**
   * Highlight memory block
   */
  highlightBlock(address, options = {}) {
    const highlight = {
      color: '#FFFF00',
      width: 2,
      dashed: false,
      overlay: false,
      ...options
    };

    this.highlights.set(address, highlight);
    this.requestRender();
  }

  /**
   * Clear all highlights
   */
  clearHighlights() {
    this.highlights.clear();
    this.requestRender();
  }

  /**
   * Search memory contents
   */
  search(query) {
    if (!this.memoryData || !this.memoryData.blocks) {
      return [];
    }

    const results = [];
    const lowerQuery = query.toLowerCase();

    this.memoryData.blocks.forEach(block => {
      // Search in address
      if (block.address.toLowerCase().includes(lowerQuery)) {
        results.push(block.address);
        return;
      }

      // Search in content description
      if (block.content?.description?.toLowerCase().includes(lowerQuery)) {
        results.push(block.address);
        return;
      }

      // Search in process ID
      if (block.processId?.toLowerCase().includes(lowerQuery)) {
        results.push(block.address);
        return;
      }

      // Search in type
      if (block.type?.toLowerCase().includes(lowerQuery)) {
        results.push(block.address);
        return;
      }
    });

    this.searchResults = results;
    this.requestRender();

    return results;
  }

  /**
   * Get memory block at screen position
   * @private
   */
  getBlockAtPosition(x, y) {
    if (!this.memoryData || !this.memoryData.blocks) return null;

    const blockSize = this.options.blockSize * this.currentZoomLevel;

    // Convert screen coordinates to grid coordinates
    const gridX = Math.floor((x - this.panOffset.x) / blockSize);
    const gridY = Math.floor((y - this.panOffset.y) / blockSize);

    // Check if coordinates are within grid bounds
    if (gridX < 0 || gridX >= this.options.gridSize.width ||
        gridY < 0 || gridY >= this.options.gridSize.height) {
      return null;
    }

    // Find block at this position
    const address = this.coordinatesToAddress(gridX, gridY);

    // Check if any block occupies this position
    return this.memoryData.blocks.find(block => {
      const blockCoords = this.addressToCoordinates(block.address);
      if (!blockCoords) return false;

      const blockSize = block.size || 1;
      return gridX >= blockCoords.x && gridX < blockCoords.x + blockSize &&
             gridY === blockCoords.y;
    });
  }

  /**
   * Show tooltip for memory block
   * @private
   */
  showTooltip(event, block) {
    if (!this.tooltip) return;

    const content = this.formatTooltipContent(block);
    this.tooltip.innerHTML = content;
    this.tooltip.style.display = 'block';

    // Position tooltip
    const rect = this.container.getBoundingClientRect();
    const tooltipRect = this.tooltip.getBoundingClientRect();

    let left = event.clientX - rect.left + 10;
    let top = event.clientY - rect.top - tooltipRect.height - 10;

    // Adjust if tooltip goes outside container
    if (left + tooltipRect.width > this.container.clientWidth) {
      left = event.clientX - rect.left - tooltipRect.width - 10;
    }
    if (top < 0) {
      top = event.clientY - rect.top + 10;
    }

    this.tooltip.style.left = `${left}px`;
    this.tooltip.style.top = `${top}px`;
  }

  /**
   * Hide tooltip
   * @private
   */
  hideTooltip() {
    if (this.tooltip) {
      this.tooltip.style.display = 'none';
    }
  }

  /**
   * Format tooltip content
   * @private
   */
  formatTooltipContent(block) {
    const content = block.content || {};
    const metadata = block.metadata || {};

    return `
      <div class="memory-map__tooltip-header">
        <strong>${block.address}</strong>
        <span class="memory-map__tooltip-type">${block.type}</span>
      </div>
      <div class="memory-map__tooltip-body">
        <div><strong>Size:</strong> ${block.size || 1} blocks</div>
        <div><strong>Process:</strong> ${block.processId || 'Unknown'}</div>
        ${content.description ? `<div><strong>Description:</strong> ${content.description}</div>` : ''}
        ${content.intensity !== undefined ? `<div><strong>Intensity:</strong> ${(content.intensity * 100).toFixed(1)}%</div>` : ''}
        ${content.accessCount ? `<div><strong>Access Count:</strong> ${content.accessCount}</div>` : ''}
        ${content.age ? `<div><strong>Age:</strong> ${this.formatAge(content.age)}</div>` : ''}
        ${content.fragmented ? '<div class="memory-map__tooltip-warning">⚠️ Fragmented</div>' : ''}
        ${metadata.protected ? '<div class="memory-map__tooltip-protected">🔒 Protected</div>' : ''}
        ${metadata.compressed ? '<div class="memory-map__tooltip-compressed">📦 Compressed</div>' : ''}
        ${content.linked && content.linked.length > 0 ? `<div><strong>Linked:</strong> ${content.linked.join(', ')}</div>` : ''}
      </div>
    `;
  }

  /**
   * Format age for display
   * @private
   */
  formatAge(ageMs) {
    const seconds = Math.floor(ageMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }

  /**
   * Request render using requestAnimationFrame
   * @private
   */
  requestRender() {
    if (this.animationFrameId) return;

    this.animationFrameId = requestAnimationFrame(() => {
      this.animationFrameId = null;
      this.render();
    });
  }

  // Public API Methods

  /**
   * Update memory data
   */
  update(memoryData) {
    if (!memoryData) {
      console.warn('MemoryMap: Invalid memory data provided');
      return;
    }

    console.log('MemoryMap: Updating with data:', memoryData);
    this.memoryData = memoryData;
    this.buildSpatialIndex();
    this.requestRender();
  }

  /**
   * Set view mode
   */
  setViewMode(mode) {
    if (!['type', 'access', 'fragmentation', 'age'].includes(mode)) {
      console.warn(`MemoryMap: Invalid view mode: ${mode}`);
      return;
    }

    this.options.viewMode = mode;
    this.requestRender();
  }

  /**
   * Get memory statistics
   */
  getMemoryStats() {
    if (!this.memoryData) {
      return {
        totalSize: 0,
        usedSize: 0,
        freeSize: 0,
        fragmentation: 0,
        blockCount: 0
      };
    }

    const totalSize = this.memoryData.totalSize || this.options.gridSize.width * this.options.gridSize.height;
    const usedSize = this.memoryData.usedSize || 0;
    const freeSize = totalSize - usedSize;
    const fragmentation = this.memoryData.fragmentation || 0;
    const blockCount = this.memoryData.blocks ? this.memoryData.blocks.length : 0;

    return {
      totalSize,
      usedSize,
      freeSize,
      fragmentation,
      blockCount,
      utilizationPercent: totalSize > 0 ? (usedSize / totalSize) * 100 : 0
    };
  }

  /**
   * Export current view
   */
  exportView(format = 'png') {
    if (!this.baseCanvas) return null;

    try {
      if (format === 'png') {
        return this.baseCanvas.toDataURL('image/png');
      } else if (format === 'svg') {
        // SVG export would require additional implementation
        console.warn('MemoryMap: SVG export not yet implemented');
        return null;
      }
    } catch (error) {
      console.error('MemoryMap: Export failed', error);
      return null;
    }
  }

  /**
   * Animate memory allocation
   */
  animateAllocation(address, size, duration = null) {
    if (!this.options.animateAllocations) return;

    const animationDuration = duration || this.options.animationDuration;
    const coords = this.addressToCoordinates(address);
    if (!coords) return;

    // Create temporary highlight for animation
    const animationId = `allocation_${Date.now()}`;
    let startTime = null;

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / animationDuration, 1);

      // Pulsing effect
      const alpha = 0.5 + 0.5 * Math.sin(progress * Math.PI * 4);

      this.highlights.set(address, {
        color: '#00FF00',
        width: 3,
        overlay: true,
        alpha: alpha
      });

      this.requestRender();

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // Remove animation highlight
        this.highlights.delete(address);
        this.requestRender();
      }
    };

    requestAnimationFrame(animate);
  }

  /**
   * Get current zoom level
   */
  getCurrentZoom() {
    return this.currentZoomLevel;
  }

  /**
   * Get current pan offset
   */
  getPanOffset() {
    return { ...this.panOffset };
  }

  /**
   * Set zoom level
   */
  setZoom(zoomLevel) {
    const index = this.options.zoomLevels.indexOf(zoomLevel);
    if (index === -1) {
      console.warn(`MemoryMap: Invalid zoom level: ${zoomLevel}`);
      return;
    }

    this.currentZoomIndex = index;
    this.currentZoomLevel = zoomLevel;
    this.requestRender();
  }

  /**
   * Get component performance metrics
   */
  getPerformanceMetrics() {
    return {
      renderCount: this.renderCount,
      lastRenderTime: this.lastRenderTime,
      averageRenderTime: this.renderCount > 0 ? this.lastRenderTime : 0,
      memoryBlockCount: this.memoryData?.blocks?.length || 0,
      highlightCount: this.highlights.size,
      searchResultCount: this.searchResults.length
    };
  }

  /**
   * Enable/disable features
   */
  setFeatureEnabled(feature, enabled) {
    switch (feature) {
      case 'zoom':
        this.options.enableZoom = enabled;
        break;
      case 'pan':
        this.options.enablePan = enabled;
        break;
      case 'tooltip':
        this.options.enableTooltip = enabled;
        if (!enabled) this.hideTooltip();
        break;
      case 'minimap':
        this.options.enableMinimap = enabled;
        if (this.minimapContainer) {
          this.minimapContainer.style.display = enabled ? 'block' : 'none';
        }
        break;
      case 'animations':
        this.options.animateAllocations = enabled;
        break;
      default:
        console.warn(`MemoryMap: Unknown feature: ${feature}`);
    }
  }

  /**
   * Update color scheme
   */
  updateColorScheme(newColorScheme) {
    this.options.colorScheme = { ...this.options.colorScheme, ...newColorScheme };
    this.requestRender();
  }

  /**
   * Get visible memory blocks
   */
  getVisibleBlocks() {
    if (!this.memoryData || !this.memoryData.blocks) return [];

    const containerWidth = this.canvasContainer.clientWidth;
    const containerHeight = this.canvasContainer.clientHeight;
    const blockSize = this.options.blockSize * this.currentZoomLevel;

    // Calculate visible grid bounds
    const startX = Math.max(0, Math.floor(-this.panOffset.x / blockSize));
    const endX = Math.min(this.options.gridSize.width, Math.ceil((containerWidth - this.panOffset.x) / blockSize));
    const startY = Math.max(0, Math.floor(-this.panOffset.y / blockSize));
    const endY = Math.min(this.options.gridSize.height, Math.ceil((containerHeight - this.panOffset.y) / blockSize));

    return this.memoryData.blocks.filter(block => {
      const coords = this.addressToCoordinates(block.address);
      if (!coords) return false;

      const blockEndX = coords.x + (block.size || 1);
      return coords.x < endX && blockEndX > startX && coords.y >= startY && coords.y < endY;
    });
  }

  /**
   * Handle minimap click for navigation
   * @private
   */
  handleMinimapClick(event) {
    if (this.isDestroyed) return;

    const rect = this.minimapCanvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Calculate scale factor
    const scaleX = this.options.minimapSize.width / (this.options.gridSize.width * this.options.blockSize);
    const scaleY = this.options.minimapSize.height / (this.options.gridSize.height * this.options.blockSize);
    const scale = Math.min(scaleX, scaleY);

    // Convert minimap coordinates to memory coordinates
    const memoryX = x / scale;
    const memoryY = y / scale;

    // Center main view on clicked position
    const containerWidth = this.canvasContainer.clientWidth;
    const containerHeight = this.canvasContainer.clientHeight;

    this.panOffset.x = containerWidth / 2 - memoryX * this.currentZoomLevel;
    this.panOffset.y = containerHeight / 2 - memoryY * this.currentZoomLevel;

    this.requestRender();
  }

  /**
   * Check if minimap should be auto-hidden
   * @private
   */
  shouldHideMinimap() {
    // Hide minimap when zoomed out fully (can see entire map)
    return this.currentZoomLevel <= 0.5;
  }

  /**
   * Update minimap visibility
   * @private
   */
  updateMinimapVisibility() {
    if (!this.minimapContainer) return;

    const shouldHide = this.shouldHideMinimap();
    this.minimapContainer.style.display = shouldHide ? 'none' : 'block';
  }
  
  /**
   * Clean up component
   */
  destroy() {
    if (this.isDestroyed) return;
    
    this.isDestroyed = true;
    
    // Cancel animation frame
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    
    // Remove event listeners
    this.canvasContainer?.removeEventListener('mousemove', this.handleMouseMove);
    this.canvasContainer?.removeEventListener('mousedown', this.handleMouseDown);
    this.canvasContainer?.removeEventListener('mouseup', this.handleMouseUp);
    this.canvasContainer?.removeEventListener('click', this.handleClick);
    this.canvasContainer?.removeEventListener('wheel', this.handleWheel);
    window.removeEventListener('resize', this.handleResize);
    
    // Clear event listeners
    this._eventListeners.clear();

    // Clear container
    this.container.innerHTML = '';
    this.container.classList.remove('memory-map');

    console.log('MemoryMap: Component destroyed');
  }

  /**
   * Add event listener
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
   * Remove event listener
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
        console.error(`MemoryMap: Event handler error for ${event}`, error);
      }
    });
  }
}
