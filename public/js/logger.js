/**
 * Centralized Logging Service
 * Provides controlled logging for browser environments with module-based filtering
 */

// Global logging configuration
const globalConfig = {
  // Log levels (higher number = more verbose)
  levels: {
    none: -1,
    error: 0,
    warn: 1,
    info: 2,
    debug: 3
  },

  // Current global log level - determined by environment
  currentLevel: null,

  // Module-specific overrides
  moduleStates: new Map(), // Map<moduleName, boolean> - true=enabled, false=disabled

  // Initialize global level based on environment
  init() {
    // Check for DEBUG_MODE flag first, then fallback to environment detection
    const debugMode = window.DEBUG_MODE;
    const isDevelopment = window.location.hostname === 'localhost' ||
                         window.location.hostname === '127.0.0.1' ||
                         window.location.search.includes('debug=true');

    if (debugMode === true) {
      this.currentLevel = this.levels.debug;
    } else if (debugMode === false) {
      this.currentLevel = this.levels.info;
    } else {
      // Fallback to environment detection if DEBUG_MODE is undefined
      this.currentLevel = isDevelopment ? this.levels.debug : this.levels.info;
    }
  }
};

// Initialize global config
globalConfig.init();

/**
 * Logger instance for a specific module
 */
class ModuleLogger {
  constructor(moduleName) {
    this.moduleName = moduleName;
  }

  /**
   * Internal method to handle logging
   */
  _log(level, message, ...args) {
    // Check if this module is specifically disabled
    if (globalConfig.moduleStates.has(this.moduleName) &&
        globalConfig.moduleStates.get(this.moduleName) === false) {
      return; // Module is disabled
    }

    // Check global log level
    if (globalConfig.levels[level] > globalConfig.currentLevel) {
      return; // Log level too verbose for current setting
    }

    // Format message with module name
    const prefix = `[${level.toUpperCase()}] [${this.moduleName}]`;
    const consoleMethod = console[level] || console.log;

    if (args.length > 0) {
      consoleMethod(prefix, message, ...args);
    } else {
      consoleMethod(prefix, message);
    }
  }
  
  /**
   * Log debug messages
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
}

/**
 * Create a logger instance for a specific module
 * @param {string} moduleName - Name of the module (e.g., 'SocketClient', 'Consciousness')
 * @returns {ModuleLogger} Logger instance for the module
 */
export function createLogger(moduleName) {
  if (!moduleName || typeof moduleName !== 'string') {
    throw new Error('Module name is required and must be a string');
  }
  return new ModuleLogger(moduleName);
}

/**
 * Set global log level for all loggers
 * @param {string} level - Log level: 'debug', 'info', 'warn', 'error', 'none'
 */
export function setGlobalLevel(level) {
  if (globalConfig.levels.hasOwnProperty(level)) {
    globalConfig.currentLevel = globalConfig.levels[level];
    console.log(`[LOGGER] Global log level set to: ${level.toUpperCase()}`);
  } else {
    console.error(`[LOGGER] Invalid log level: ${level}. Valid levels:`, Object.keys(globalConfig.levels));
  }
}

/**
 * Enable logging for a specific module
 * @param {string} moduleName - Name of the module to enable
 */
export function enableModule(moduleName) {
  globalConfig.moduleStates.set(moduleName, true);
  console.log(`[LOGGER] Module '${moduleName}' logging enabled`);
}

/**
 * Disable logging for a specific module
 * @param {string} moduleName - Name of the module to disable
 */
export function disableModule(moduleName) {
  globalConfig.moduleStates.set(moduleName, false);
  console.log(`[LOGGER] Module '${moduleName}' logging disabled`);
}

// Make global control functions available on window for browser console access
window.setGlobalLevel = setGlobalLevel;
window.enableModule = enableModule;
window.disableModule = disableModule;

// Export the createLogger function as default for backward compatibility
export default createLogger;
