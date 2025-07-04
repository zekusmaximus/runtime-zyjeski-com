// ResourceMeter.js - Canvas-based resource visualization component for runtime.zyjeski.com
// Provides circular, linear, and arc visualizations for CPU, memory, threads, and custom metrics

/**
 * ResourceMeter - High-performance Canvas-based resource visualization component
 * 
 * Features:
 * - Three visualization types: circular (gauge), linear (bar), arc (semicircle)
 * - Smooth 60fps animations with requestAnimationFrame
 * - Threshold-based color coding (green → yellow → red)
 * - Support for CPU, memory, thread, and custom metrics
 * - Real-time updates via WebSocket data
 * - Configurable size, colors, and thresholds
 * - Tooltip support with exact values
 * - Accessibility support with ARIA labels
 * - Device pixel ratio support for retina displays
 * 
 * Usage:
 * const meter = new ResourceMeter(container, {
 *   type: 'circular',
 *   metric: 'cpu',
 *   size: { width: 200, height: 200 },
 *   thresholds: { low: 30, medium: 70, high: 90 }
 * });
 * meter.update(75); // Update to 75%
 */
export default class ResourceMeter {
  constructor(container, options = {}) {
    if (!container) {
      throw new Error('ResourceMeter: Container element is required');
    }

    this.container = container;
    this.options = {
      // Visualization type
      type: 'circular', // 'circular', 'linear', 'arc'
      metric: 'cpu', // 'cpu', 'memory', 'threads', 'custom'

      // Initial value
      value: 0, // Initial value (0 to max)

      // Size configuration
      size: { width: 200, height: 200 },
      
      // Threshold configuration
      thresholds: {
        low: 30,    // Green below this
        medium: 70, // Yellow between low and medium  
        high: 90    // Red above this
      },
      
      // Color configuration
      colors: {
        low: '#4CAF50',      // Green
        medium: '#FF9800',   // Orange
        high: '#F44336',     // Red
        background: '#2a2a2a',
        text: '#ffffff',
        track: '#404040'     // Background track color
      },
      
      // Animation configuration
      animate: true,
      animationDuration: 300, // milliseconds
      
      // Display configuration
      showLabel: true,
      showValue: true,
      labelFormat: (value, metric) => `${metric.toUpperCase()}: ${value.toFixed(1)}%`,
      valueFormat: (value) => `${value.toFixed(1)}%`,
      
      // Custom metric configuration
      customUnit: 'MB',
      max: 100, // Maximum value (important for custom metrics)
      
      // Performance configuration
      devicePixelRatio: window.devicePixelRatio || 1,
      
      ...options
    };

    // State
    const initialValue = Math.max(0, Math.min(this.options.max, this.options.value || 0));
    this.currentValue = initialValue;
    this.targetValue = initialValue;
    this.animationId = null;
    this.animationStartTime = null;
    this.animationStartValue = 0;
    this.isDestroyed = false;

    // Event system
    this._eventListeners = new Map();
    this._lastThresholdEmit = 0;
    this._thresholdEmitCooldown = 1000; // 1 second cooldown
    this._lastValueEmit = 0;
    this._valueEmitCooldown = 100; // 100ms cooldown for value changes

    // Canvas elements
    this.canvas = null;
    this.ctx = null;
    this.tooltip = null;

    // Bind methods
    this.handleResize = this.handleResize.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleMouseLeave = this.handleMouseLeave.bind(this);
    this.animate = this.animate.bind(this);
    
    // Initialize component
    this.init();
  }

  /**
   * Initialize the component
   * @private
   */
  init() {
    this.createCanvas();
    this.createTooltip();
    this.setupEventListeners();
    this.setupAccessibility();
    this.render();
  }

  /**
   * Create and configure the canvas element
   * @private
   */
  createCanvas() {
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'resource-meter-canvas';
    this.canvas.style.cssText = `
      display: block;
      width: 100%;
      height: 100%;
      cursor: pointer;
    `;

    this.ctx = this.canvas.getContext('2d');

    // Check if context is available (for testing environments)
    if (!this.ctx) {
      console.warn('ResourceMeter: Canvas context not available, component may not render properly');
      return;
    }

    // Set canvas size accounting for device pixel ratio
    this.resizeCanvas();

    this.container.appendChild(this.canvas);
  }

  /**
   * Create tooltip element
   * @private
   */
  createTooltip() {
    this.tooltip = document.createElement('div');
    this.tooltip.className = 'resource-meter-tooltip';
    this.tooltip.style.cssText = `
      position: absolute;
      background: rgba(0, 0, 0, 0.9);
      color: white;
      padding: 8px 12px;
      border-radius: 4px;
      font-size: 12px;
      font-family: monospace;
      pointer-events: none;
      z-index: 1000;
      opacity: 0;
      transition: opacity 0.2s ease;
      white-space: nowrap;
    `;
    
    document.body.appendChild(this.tooltip);
  }

  /**
   * Setup event listeners
   * @private
   */
  setupEventListeners() {
    this.canvas.addEventListener('mousemove', this.handleMouseMove);
    this.canvas.addEventListener('mouseleave', this.handleMouseLeave);
    window.addEventListener('resize', this.handleResize);
  }

  /**
   * Setup accessibility attributes
   * @private
   */
  setupAccessibility() {
    this.canvas.setAttribute('role', 'img');
    this.canvas.setAttribute('tabindex', '0');
    this.updateAccessibilityLabel();
  }

  /**
   * Update accessibility label
   * @private
   */
  updateAccessibilityLabel() {
    const label = this.options.labelFormat(this.currentValue, this.options.metric);
    this.canvas.setAttribute('aria-label', label);
  }

  /**
   * Resize canvas to match container and device pixel ratio
   * @private
   */
  resizeCanvas() {
    if (!this.canvas || !this.ctx) return;

    const rect = this.container.getBoundingClientRect();
    const dpr = this.options.devicePixelRatio;

    // Ensure we have valid dimensions
    if (rect.width <= 0 || rect.height <= 0) {
      console.warn('ResourceMeter: Invalid container dimensions, skipping resize');
      return;
    }

    // Set actual canvas size in memory (scaled for device pixel ratio)
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;

    // Scale the canvas back down using CSS
    this.canvas.style.width = rect.width + 'px';
    this.canvas.style.height = rect.height + 'px';

    // Scale the drawing context so everything draws at the correct size
    this.ctx.scale(dpr, dpr);

    // Store logical dimensions for calculations
    this.logicalWidth = rect.width;
    this.logicalHeight = rect.height;
  }

  /**
   * Handle window resize
   * @private
   */
  handleResize() {
    if (this.isDestroyed) return;
    this.resizeCanvas();
    this.render();
  }

  /**
   * Handle mouse move for tooltip
   * @private
   */
  handleMouseMove(event) {
    if (this.isDestroyed) return;

    // Show tooltip with current value
    const tooltipText = this.options.labelFormat(this.currentValue, this.options.metric);
    this.tooltip.textContent = tooltipText;
    this.tooltip.style.left = (event.clientX + 10) + 'px';
    this.tooltip.style.top = (event.clientY - 30) + 'px';
    this.tooltip.style.opacity = '1';
  }

  /**
   * Handle mouse leave to hide tooltip
   * @private
   */
  handleMouseLeave() {
    if (this.tooltip) {
      this.tooltip.style.opacity = '0';
    }
  }

  /**
   * Get color based on current value and thresholds
   * @private
   */
  getValueColor(value) {
    const { thresholds, colors } = this.options;
    
    if (value <= thresholds.low) {
      return colors.low;
    } else if (value <= thresholds.medium) {
      return colors.medium;
    } else {
      return colors.high;
    }
  }

  /**
   * Easing function for smooth animations
   * @private
   */
  easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  /**
   * Animation loop
   * @private
   */
  animate(timestamp) {
    if (this.isDestroyed) return;
    
    if (!this.animationStartTime) {
      this.animationStartTime = timestamp;
    }
    
    const elapsed = timestamp - this.animationStartTime;
    const progress = Math.min(elapsed / this.options.animationDuration, 1);
    const easedProgress = this.easeInOutCubic(progress);
    
    // Interpolate between start and target values
    const valueDiff = this.targetValue - this.animationStartValue;
    const previousValue = this.currentValue;
    this.currentValue = this.animationStartValue + (valueDiff * easedProgress);

    this.render();
    this.updateAccessibilityLabel();

    // Emit value-changed event during animation (throttled)
    const now = Date.now();
    if (Math.abs(previousValue - this.currentValue) > 0.1 &&
        now - this._lastValueEmit > this._valueEmitCooldown) {
      this._lastValueEmit = now;
      this.emit('value-changed', this.currentValue);
    }

    if (progress < 1) {
      this.animationId = requestAnimationFrame(this.animate);
    } else {
      this.animationId = null;
      this.animationStartTime = null;

      // Emit final value and check thresholds when animation completes
      const now = Date.now();
      if (now - this._lastValueEmit > this._valueEmitCooldown) {
        this._lastValueEmit = now;
        this.emit('value-changed', this.currentValue);
      }
      this.checkThresholds(this.currentValue);
    }
  }

  /**
   * Update the meter value
   * @param {number} value - New value (0 to max)
   */
  update(value) {
    if (this.isDestroyed) return;

    // Clamp value to valid range
    const clampedValue = Math.max(0, Math.min(this.options.max, value));
    const previousValue = this.currentValue;

    if (this.options.animate && typeof requestAnimationFrame !== 'undefined') {
      // Cancel existing animation
      if (this.animationId) {
        cancelAnimationFrame(this.animationId);
      }

      // Start new animation
      this.animationStartValue = this.currentValue;
      this.targetValue = clampedValue;
      this.animationStartTime = null;
      this.animationId = requestAnimationFrame(this.animate);
    } else {
      // Immediate update (also used in test environments)
      this.currentValue = clampedValue;
      this.targetValue = clampedValue;
      this.render();
      this.updateAccessibilityLabel();

      // Emit value-changed event for immediate updates (throttled)
      if (previousValue !== clampedValue) {
        const now = Date.now();
        if (now - this._lastValueEmit > this._valueEmitCooldown) {
          this._lastValueEmit = now;
          this.emit('value-changed', clampedValue);
        }
        this.checkThresholds(clampedValue);
      }
    }
  }

  /**
   * Check if value exceeds thresholds and emit events
   * @private
   * @param {number} value - Current value to check
   */
  checkThresholds(value) {
    const percentage = (value / this.options.max) * 100;
    const now = Date.now();

    // Throttle threshold events to prevent loops
    if (now - this._lastThresholdEmit < this._thresholdEmitCooldown) {
      return;
    }

    // Check high threshold
    if (percentage >= this.options.thresholds.high) {
      this._lastThresholdEmit = now;
      this.emit('threshold-exceeded', {
        metric: this.options.metric,
        value: percentage,
        threshold: 'high',
        rawValue: value
      });
    }
    // Check medium threshold
    else if (percentage >= this.options.thresholds.medium) {
      this._lastThresholdEmit = now;
      this.emit('threshold-exceeded', {
        metric: this.options.metric,
        value: percentage,
        threshold: 'medium',
        rawValue: value
      });
    }
  }

  /**
   * Main render method - delegates to specific visualization type
   * @private
   */
  render() {
    if (this.isDestroyed) return;

    // Skip rendering if no context (test environment)
    if (!this.ctx) {
      return;
    }

    // Clear canvas
    this.ctx.clearRect(0, 0, this.logicalWidth, this.logicalHeight);

    // Set high-quality rendering
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = 'high';

    // Render based on type
    switch (this.options.type) {
      case 'circular':
        this.renderCircular();
        break;
      case 'linear':
        this.renderLinear();
        break;
      case 'arc':
        this.renderArc();
        break;
      default:
        console.warn(`ResourceMeter: Unknown type "${this.options.type}"`);
        this.renderCircular();
    }
  }

  /**
   * Render circular gauge visualization
   * @private
   */
  renderCircular() {
    const centerX = this.logicalWidth / 2;
    const centerY = this.logicalHeight / 2;
    const radius = Math.max(0, Math.min(centerX, centerY) - 20);
    const lineWidth = 12;

    // Skip rendering if radius is too small
    if (radius < 10) {
      console.warn('ResourceMeter: Container too small for circular rendering, skipping render');
      return;
    }

    // Calculate angles (270 degrees total, starting from top)
    const startAngle = -Math.PI * 0.75; // -135 degrees
    const endAngle = Math.PI * 0.75;    // 135 degrees
    const totalAngle = endAngle - startAngle;
    const valueAngle = startAngle + (totalAngle * (this.currentValue / this.options.max));

    // Draw background track
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, radius, startAngle, endAngle);
    this.ctx.strokeStyle = this.options.colors.track;
    this.ctx.lineWidth = lineWidth;
    this.ctx.lineCap = 'round';
    this.ctx.stroke();

    // Draw value arc
    if (this.currentValue > 0) {
      this.ctx.beginPath();
      this.ctx.arc(centerX, centerY, radius, startAngle, valueAngle);
      this.ctx.strokeStyle = this.getValueColor(this.currentValue);
      this.ctx.lineWidth = lineWidth;
      this.ctx.lineCap = 'round';
      this.ctx.stroke();

      // Add glow effect for high values
      if (this.currentValue > this.options.thresholds.high) {
        this.ctx.shadowColor = this.getValueColor(this.currentValue);
        this.ctx.shadowBlur = 10;
        this.ctx.stroke();
        this.ctx.shadowBlur = 0;
      }
    }

    // Draw center text
    if (this.options.showValue) {
      this.ctx.fillStyle = this.options.colors.text;
      this.ctx.font = `bold ${Math.max(14, radius / 6)}px Arial`;
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';

      const displayValue = this.options.valueFormat(this.currentValue);
      this.ctx.fillText(displayValue, centerX, centerY);
    }

    // Draw label
    if (this.options.showLabel) {
      this.ctx.fillStyle = this.options.colors.text;
      this.ctx.font = `${Math.max(10, radius / 10)}px Arial`;
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';

      const label = this.options.metric.toUpperCase();
      this.ctx.fillText(label, centerX, centerY + radius / 3);
    }
  }

  /**
   * Render linear bar visualization
   * @private
   */
  renderLinear() {
    // Use adaptive padding based on container size
    const padding = Math.min(20, Math.max(4, this.logicalWidth * 0.05));
    const barHeight = Math.min(20, Math.max(8, this.logicalHeight * 0.5));
    const barY = (this.logicalHeight - barHeight) / 2;
    const barWidth = this.logicalWidth - (padding * 2);

    // Debug logging
    if (window.DEBUG_MODE || this.currentValue > 0) {
      console.log('🎨 ResourceMeter renderLinear:', {
        currentValue: this.currentValue,
        max: this.options.max,
        logicalWidth: this.logicalWidth,
        logicalHeight: this.logicalHeight,
        barWidth: barWidth,
        barHeight: barHeight,
        barY: barY,
        padding: padding
      });
    }

    // Validate values before calculating fillWidth
    if (!isFinite(barWidth) || !isFinite(this.currentValue) || !isFinite(this.options.max) || this.options.max === 0) {
      console.warn('ResourceMeter: Invalid values for linear rendering', {
        barWidth,
        currentValue: this.currentValue,
        max: this.options.max,
        logicalWidth: this.logicalWidth,
        logicalHeight: this.logicalHeight
      });
      return;
    }

    const fillWidth = (barWidth * this.currentValue) / this.options.max;

    // Skip rendering if bar width is too small
    if (barWidth <= 0) {
      console.warn('ResourceMeter: Container too small for linear rendering, skipping render');
      return;
    }

    // Draw background track
    this.ctx.fillStyle = this.options.colors.track;
    this.ctx.fillRect(padding, barY, barWidth, barHeight);

    // Draw value fill
    if (this.currentValue > 0 && isFinite(fillWidth) && fillWidth > 0) {
      const gradient = this.ctx.createLinearGradient(padding, 0, padding + fillWidth, 0);
      const color = this.getValueColor(this.currentValue);
      gradient.addColorStop(0, color);
      gradient.addColorStop(1, this.adjustColorBrightness(color, 1.2));

      this.ctx.fillStyle = gradient;
      this.ctx.fillRect(padding, barY, fillWidth, barHeight);

      // Debug logging
      if (window.DEBUG_MODE || this.currentValue > 0) {
        console.log('🎨 Drawing fill rect:', {
          fillWidth: fillWidth,
          color: color,
          rect: [padding, barY, fillWidth, barHeight]
        });
      }
    } else {
      // Debug logging for why fill isn't drawn
      if (window.DEBUG_MODE || this.currentValue > 0) {
        console.log('❌ Not drawing fill:', {
          currentValue: this.currentValue,
          fillWidth: fillWidth,
          isFiniteFillWidth: isFinite(fillWidth),
          fillWidthPositive: fillWidth > 0
        });
      }
    }

    // Draw border
    this.ctx.strokeStyle = this.options.colors.text;
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(padding, barY, barWidth, barHeight);

    // Draw value text
    if (this.options.showValue) {
      this.ctx.fillStyle = this.options.colors.text;
      this.ctx.font = 'bold 14px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';

      const displayValue = this.options.valueFormat(this.currentValue);
      this.ctx.fillText(displayValue, this.logicalWidth / 2, barY + barHeight + 20);
    }

    // Draw label
    if (this.options.showLabel) {
      this.ctx.fillStyle = this.options.colors.text;
      this.ctx.font = '12px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';

      const label = this.options.metric.toUpperCase();
      this.ctx.fillText(label, this.logicalWidth / 2, barY - 15);
    }
  }

  /**
   * Render arc (semicircle) visualization
   * @private
   */
  renderArc() {
    const centerX = this.logicalWidth / 2;
    const centerY = this.logicalHeight - 20;
    const radius = Math.max(0, Math.min(centerX, centerY) - 10);
    const lineWidth = 16;

    // Skip rendering if radius is too small
    if (radius < 10) {
      console.warn('ResourceMeter: Container too small for arc rendering, skipping render');
      return;
    }

    // Calculate angles (180 degrees, from left to right)
    const startAngle = Math.PI;
    const endAngle = 0;
    const totalAngle = Math.PI;
    const valueAngle = startAngle - (totalAngle * (this.currentValue / this.options.max));

    // Draw background track
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, radius, startAngle, endAngle);
    this.ctx.strokeStyle = this.options.colors.track;
    this.ctx.lineWidth = lineWidth;
    this.ctx.lineCap = 'round';
    this.ctx.stroke();

    // Draw value arc
    if (this.currentValue > 0) {
      this.ctx.beginPath();
      this.ctx.arc(centerX, centerY, radius, startAngle, valueAngle);
      this.ctx.strokeStyle = this.getValueColor(this.currentValue);
      this.ctx.lineWidth = lineWidth;
      this.ctx.lineCap = 'round';
      this.ctx.stroke();
    }

    // Draw center text
    if (this.options.showValue) {
      this.ctx.fillStyle = this.options.colors.text;
      this.ctx.font = `bold ${Math.max(16, radius / 5)}px Arial`;
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';

      const displayValue = this.options.valueFormat(this.currentValue);
      this.ctx.fillText(displayValue, centerX, centerY - 10);
    }

    // Draw label
    if (this.options.showLabel) {
      this.ctx.fillStyle = this.options.colors.text;
      this.ctx.font = `${Math.max(12, radius / 8)}px Arial`;
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';

      const label = this.options.metric.toUpperCase();
      this.ctx.fillText(label, centerX, centerY + 15);
    }
  }

  /**
   * Adjust color brightness
   * @private
   */
  adjustColorBrightness(color, factor) {
    // Simple brightness adjustment for gradients
    const hex = color.replace('#', '');
    const r = Math.min(255, Math.floor(parseInt(hex.substr(0, 2), 16) * factor));
    const g = Math.min(255, Math.floor(parseInt(hex.substr(2, 2), 16) * factor));
    const b = Math.min(255, Math.floor(parseInt(hex.substr(4, 2), 16) * factor));

    return `rgb(${r}, ${g}, ${b})`;
  }

  /**
   * Set new thresholds
   * @param {Object} thresholds - New threshold configuration
   */
  setThresholds(thresholds) {
    this.options.thresholds = { ...this.options.thresholds, ...thresholds };
    this.render();
  }

  /**
   * Set visualization type
   * @param {string} type - New visualization type ('circular', 'linear', 'arc')
   */
  setType(type) {
    if (['circular', 'linear', 'arc'].includes(type)) {
      this.options.type = type;
      this.render();
    } else {
      console.warn(`ResourceMeter: Invalid type "${type}"`);
    }
  }

  /**
   * Set maximum value for custom metrics
   * @param {number} max - New maximum value
   */
  setMax(max) {
    if (typeof max === 'number' && max > 0) {
      this.options.max = max;
      // Re-clamp current value if needed
      if (this.currentValue > max) {
        this.currentValue = max;
        this.targetValue = max;
        this.render();
        this.updateAccessibilityLabel();
      } else {
        this.render();
      }
    } else {
      console.warn(`ResourceMeter: Invalid max value "${max}"`);
    }
  }

  /**
   * Resize the meter
   * @param {number} width - New width
   * @param {number} height - New height
   */
  resize(width, height) {
    if (typeof width === 'number' && typeof height === 'number') {
      this.options.size = { width, height };
      this.container.style.width = width + 'px';
      this.container.style.height = height + 'px';
      this.resizeCanvas();
      this.render();
    }
  }

  /**
   * Get current value
   * @returns {number} Current value
   */
  getValue() {
    return this.currentValue;
  }

  /**
   * Get current configuration
   * @returns {Object} Current options
   */
  getOptions() {
    return { ...this.options };
  }

  /**
   * Clean up resources and remove event listeners
   */
  destroy() {
    if (this.isDestroyed) return;

    this.isDestroyed = true;

    // Cancel any running animation
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }

    // Remove event listeners
    if (this.canvas) {
      this.canvas.removeEventListener('mousemove', this.handleMouseMove);
      this.canvas.removeEventListener('mouseleave', this.handleMouseLeave);
    }
    window.removeEventListener('resize', this.handleResize);

    // Remove DOM elements
    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }

    if (this.tooltip && this.tooltip.parentNode) {
      this.tooltip.parentNode.removeChild(this.tooltip);
    }

    // Clear event listeners
    this._eventListeners.clear();

    // Clear references
    this.canvas = null;
    this.ctx = null;
    this.tooltip = null;
    this.container = null;
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
        console.error(`ResourceMeter: Event handler error for ${event}`, error);
      }
    });
  }
}
