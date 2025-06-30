// DebugCommand.js - Base class for all debug commands implementing the Command pattern

/**
 * Base class for all debug commands in the consciousness debugging system.
 * Implements the Command pattern to encapsulate debug operations with undo capability.
 */
export class DebugCommand {
    /**
     * Create a new debug command
     * @param {Object} context - Context object containing dependencies and parameters
     */
    constructor(context) {
        this.context = context;
        this.executed = false;
        this.result = null;
        this.timestamp = null;
    }

    /**
     * Check if the command can be executed in the current state
     * @returns {Promise<boolean>} True if command can be executed
     */
    async canExecute() {
        throw new Error('Must implement canExecute');
    }

    /**
     * Execute the command
     * @returns {Promise<Object>} Result of the command execution
     */
    async execute() {
        throw new Error('Must implement execute');
    }

    /**
     * Undo the command (restore previous state)
     * @returns {Promise<Object>} Result of the undo operation
     */
    async undo() {
        throw new Error('Must implement undo');
    }

    /**
     * Get a human-readable description of what this command does
     * @returns {string} Command description
     */
    getDescription() {
        throw new Error('Must implement getDescription');
    }

    /**
     * Get the execution timestamp
     * @returns {number|null} Timestamp when command was executed, or null if not executed
     */
    getTimestamp() {
        return this.timestamp;
    }

    /**
     * Check if the command has been executed
     * @returns {boolean} True if command has been executed
     */
    isExecuted() {
        return this.executed;
    }

    /**
     * Get the result of the last execution
     * @returns {Object|null} Result object or null if not executed
     */
    getResult() {
        return this.result;
    }
}

export default DebugCommand;
