/**
 * Frontend Logger Utility
 * Provides controlled logging for browser environments with environment-based filtering
 */
class Logger {
  constructor() {
    // Determine log level based on environment
    this.isDevelopment = window.location.hostname === 'localhost' || 
                        window.location.hostname === '127.0.0.1' ||
                        window.location.search.includes('debug=true');
    
    // Log levels (higher number = more verbose)
    this.levels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3
    };
    
    // Set current log level based on environment
    this.currentLevel = this.isDevelopment ? this.levels.debug : this.levels.warn;
    
    // Store logs for potential reporting
    this.logBuffer = [];
    this.maxBufferSize = 100;
  }
  
  /**
   * Internal method to handle logging
   */
  _log(level, message, ...args) {
    if (this.levels[level] > this.currentLevel) {
      return; // Skip if log level is too verbose for current environment
    }
    
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      args: args.length > 0 ? args : undefined
    };
    
    // Add to buffer
    this._addToBuffer(logEntry);
    
    // Output to console based on level
    const consoleMethod = console[level] || console.log;
    const prefix = `[${timestamp}] [${level.toUpperCase()}]:`;
    
    if (args.length > 0) {
      consoleMethod(prefix, message, ...args);
    } else {
      consoleMethod(prefix, message);
    }
  }
  
  /**
   * Add log entry to buffer for potential error reporting
   */
  _addToBuffer(logEntry) {
    this.logBuffer.push(logEntry);
    if (this.logBuffer.length > this.maxBufferSize) {
      this.logBuffer.shift(); // Remove oldest entry
    }
  }
  
  /**
   * Log debug messages (only in development)
   */
  debug(message, ...args) {
    this._log('debug', message, ...args);
  }
  
  /**
   * Log info messages
   */
  info(message, ...args) {
    this._log('info', message, ...args);
  }
  
  /**
   * Log warning messages
   */
  warn(message, ...args) {
    this._log('warn', message, ...args);
  }
  
  /**
   * Log error messages
   */
  error(message, ...args) {
    this._log('error', message, ...args);
  }
  
  /**
   * Get recent logs for error reporting
   */
  getRecentLogs(count = 10) {
    return this.logBuffer.slice(-count);
  }
  
  /**
   * Clear the log buffer
   */
  clearBuffer() {
    this.logBuffer = [];
  }
  
  /**
   * Set log level programmatically
   */
  setLevel(level) {
    if (this.levels.hasOwnProperty(level)) {
      this.currentLevel = this.levels[level];
    }
  }
  
  /**
   * Check if a log level is enabled
   */
  isLevelEnabled(level) {
    return this.levels[level] <= this.currentLevel;
  }
}

// Create and export global logger instance
const logger = new Logger();

// Make it available globally for easy access
window.logger = logger;

export default logger;
