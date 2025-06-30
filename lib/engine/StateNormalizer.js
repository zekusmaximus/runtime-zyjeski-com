import { warn } from '../logger.js'; // As requested, though not used by current normalizeState

export class StateNormalizer {
  /**
   * Validates and normalizes consciousness state data.
   * Ensures a consistent structure for the state object.
   * @param {object} rawState - The raw state object from a consciousness instance.
   * @returns {object} The normalized state object.
   */
  normalizeState(rawState) {
    if (!rawState) {
      // Handle empty/null state by returning a default structure
      // This part fulfills "Test normalizing an empty/null state returns default structure"
      // warn('normalizeState received null or undefined rawState. Returning default structure.'); // Optional: log a warning
      return {
        processes: [],
        system_errors: [],
        threads: [],
        consciousness: {
          memory: {
            capacity: { allocated: 0, available: 10000, reserved: 1000, total: 10000 },
            pools: { shortTerm: 0, longTerm: 0, traumatic: 0, suppressed: 0, procedural: 0 },
            totalMemories: 0,
            compressionRatio: 1,
            fragmentationLevel: 0,
            emotionalIndexes: 0,
            isInitialized: false, // Assuming not initialized if rawState is null
            debuggableIssues: {
              memoryLeaks: [],
              corruptedMemories: [],
              fragmentedMemories: [],
              highPressureWarning: false
            }
          },
          // Add other default consciousness substructures if necessary
        }
        // Add other top-level default properties if necessary
      };
    }

    // Ensure all required properties are properly formatted
    const normalizedState = {
      ...rawState, // Spread the original state first
      processes: rawState.consciousness?.processes || [],
      system_errors: rawState.system_errors || [], // Preserve existing errors or default to empty
      threads: rawState.consciousness?.resources?.threads ? [rawState.consciousness.resources.threads] : [],
      consciousness: {
        ...(rawState.consciousness || {}), // Ensure consciousness object exists
        memory: rawState.consciousness?.memory || {
          capacity: { allocated: 0, available: 10000, reserved: 1000, total: 10000 },
          pools: { shortTerm: 0, longTerm: 0, traumatic: 0, suppressed: 0, procedural: 0 },
          totalMemories: 0,
          compressionRatio: 1,
          fragmentationLevel: 0,
          emotionalIndexes: 0,
          isInitialized: true, // Assuming initialized if rawState is provided
          debuggableIssues: {
            memoryLeaks: [],
            corruptedMemories: [],
            fragmentedMemories: [],
            highPressureWarning: false
          }
        }
        // Ensure other nested structures under consciousness have defaults if they might be missing
      }
    };

    return normalizedState;
  }
}

export default StateNormalizer;
