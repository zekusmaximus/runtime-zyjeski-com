import { StateNormalizer } from '../../../lib/engine/StateNormalizer.js';
import { expect } from 'chai';

describe('StateNormalizer', () => {
  let normalizer;

  beforeEach(() => {
    normalizer = new StateNormalizer();
  });

  const getDefaultMemoryStructure = (isInitialized = false) => ({
    capacity: { allocated: 0, available: 10000, reserved: 1000, total: 10000 },
    pools: { shortTerm: 0, longTerm: 0, traumatic: 0, suppressed: 0, procedural: 0 },
    totalMemories: 0,
    compressionRatio: 1,
    fragmentationLevel: 0,
    emotionalIndexes: 0,
    isInitialized: isInitialized,
    debuggableIssues: {
      memoryLeaks: [],
      corruptedMemories: [],
      fragmentedMemories: [],
      highPressureWarning: false
    }
  });

  const getDefaultStateStructure = (isMemoryInitialized = false) => ({
    processes: [],
    system_errors: [],
    threads: [],
    consciousness: {
      memory: getDefaultMemoryStructure(isMemoryInitialized)
    }
  });

  it('should return a default structure for null input', () => {
    const normalized = normalizer.normalizeState(null);
    expect(normalized).to.deep.equal(getDefaultStateStructure(false));
  });

  it('should return a default structure for undefined input', () => {
    const normalized = normalizer.normalizeState(undefined);
    expect(normalized).to.deep.equal(getDefaultStateStructure(false));
  });

  it('should preserve all data for a valid and complete state', () => {
    const rawState = {
      id: 'char1',
      name: 'Test Character',
      system_errors: [{ code: 1, message: 'test error'}],
      consciousness: {
        processes: [{ pid: 1, name: 'P1' }],
        resources: {
          threads: { count: 5, active: 2 }
        },
        memory: {
          capacity: { allocated: 500, available: 9500, reserved: 1000, total: 10000 },
          pools: { shortTerm: 10, longTerm: 5, traumatic: 1, suppressed: 0, procedural: 20 },
          totalMemories: 36,
          compressionRatio: 0.8,
          fragmentationLevel: 0.1,
          emotionalIndexes: 5,
          isInitialized: true,
          debuggableIssues: {
            memoryLeaks: ['leak1'],
            corruptedMemories: [],
            fragmentedMemories: [],
            highPressureWarning: false
          }
        },
        emotionalState: { mood: 'happy' }
      }
    };
    const normalized = normalizer.normalizeState(rawState);

    expect(normalized.id).to.equal('char1');
    expect(normalized.name).to.equal('Test Character');
    expect(normalized.system_errors).to.deep.equal([{ code: 1, message: 'test error'}]);
    expect(normalized.processes).to.deep.equal([{ pid: 1, name: 'P1' }]);
    expect(normalized.threads).to.deep.equal([{ count: 5, active: 2 }]);
    expect(normalized.consciousness.emotionalState).to.deep.equal({ mood: 'happy' });
    expect(normalized.consciousness.memory).to.deep.equal(rawState.consciousness.memory);
  });

  it('should fill in missing fields for a partial state', () => {
    const rawState = {
      id: 'char2',
      consciousness: {
        // processes is missing
        // resources is missing
        // memory is missing
        emotionalState: { mood: 'sad' }
      }
    };
    const normalized = normalizer.normalizeState(rawState);

    expect(normalized.id).to.equal('char2');
    expect(normalized.processes).to.deep.equal([]); // Defaulted
    expect(normalized.threads).to.deep.equal([]); // Defaulted
    expect(normalized.system_errors).to.deep.equal([]); // Defaulted
    expect(normalized.consciousness.emotionalState).to.deep.equal({ mood: 'sad' });
    expect(normalized.consciousness.memory).to.deep.equal(getDefaultMemoryStructure(true)); // Defaulted, isInitialized: true
  });

  it('should handle missing consciousness block gracefully', () => {
    const rawState = {
      id: 'char3',
      // consciousness block is completely missing
    };
    const normalized = normalizer.normalizeState(rawState);

    expect(normalized.id).to.equal('char3');
    expect(normalized.processes).to.deep.equal([]);
    expect(normalized.threads).to.deep.equal([]);
    expect(normalized.system_errors).to.deep.equal([]);
    expect(normalized.consciousness).to.be.an('object');
    expect(normalized.consciousness.memory).to.deep.equal(getDefaultMemoryStructure(true));
  });

  it('should handle missing memory block gracefully within consciousness', () => {
    const rawState = {
      id: 'char4',
      consciousness: {
        processes: [{ pid: 2, name: 'P2' }],
        // memory is missing
      }
    };
    const normalized = normalizer.normalizeState(rawState);

    expect(normalized.id).to.equal('char4');
    expect(normalized.processes).to.deep.equal([{ pid: 2, name: 'P2' }]);
    expect(normalized.threads).to.deep.equal([]);
    expect(normalized.system_errors).to.deep.equal([]);
    expect(normalized.consciousness.memory).to.deep.equal(getDefaultMemoryStructure(true));
  });

  it('should handle missing processes within consciousness gracefully', () => {
    const rawState = {
      id: 'char5',
      consciousness: {
        // processes is missing
        memory: getDefaultMemoryStructure(true)
      }
    };
    const normalized = normalizer.normalizeState(rawState);
    expect(normalized.processes).to.deep.equal([]);
    expect(normalized.consciousness.memory).to.deep.equal(getDefaultMemoryStructure(true));
  });

  it('should handle missing resources (and thus threads) within consciousness gracefully', () => {
    const rawState = {
      id: 'char6',
      consciousness: {
        processes: [{ pid: 1, name: 'P1' }],
        // resources is missing
        memory: getDefaultMemoryStructure(true)
      }
    };
    const normalized = normalizer.normalizeState(rawState);
    expect(normalized.threads).to.deep.equal([]);
    expect(normalized.processes).to.deep.equal([{ pid: 1, name: 'P1' }]);
    expect(normalized.consciousness.memory).to.deep.equal(getDefaultMemoryStructure(true));
  });

  it('should correctly handle system_errors if provided, or default to empty array', () => {
    const rawStateWithErrors = {
      system_errors: [{ type: 'test', message: 'An error' }],
      consciousness: {}
    };
    let normalized = normalizer.normalizeState(rawStateWithErrors);
    expect(normalized.system_errors).to.deep.equal([{ type: 'test', message: 'An error' }]);

    const rawStateWithoutErrors = {
      consciousness: {}
    };
    normalized = normalizer.normalizeState(rawStateWithoutErrors);
    expect(normalized.system_errors).to.deep.equal([]);
  });

  // Test for invalid data (though normalizeState mostly defaults, good to have a placeholder)
  // The current normalizeState is very forgiving and tends to default rather than throw.
  // This test ensures it doesn't crash with unexpected data types.
  it('should handle gracefully when parts of rawState are not objects as expected', () => {
    const rawStateInvalidConsciousness = {
      id: 'char7',
      consciousness: "not_an_object"
    };
    let normalized = normalizer.normalizeState(rawStateInvalidConsciousness);
    expect(normalized.processes).to.deep.equal([]);
    expect(normalized.threads).to.deep.equal([]);
    expect(normalized.consciousness.memory).to.deep.equal(getDefaultMemoryStructure(true));

    const rawStateInvalidMemory = {
      id: 'char8',
      consciousness: {
        memory: "not_an_object"
      }
    };
    normalized = normalizer.normalizeState(rawStateInvalidMemory);
    expect(normalized.consciousness.memory).to.deep.equal(getDefaultMemoryStructure(true));

    const rawStateInvalidProcesses = {
      id: 'char9',
      consciousness: {
        processes: "not_an_array"
      }
    };
    normalized = normalizer.normalizeState(rawStateInvalidProcesses);
    // processes: rawState.consciousness?.processes || [] -> if processes is not array, it becomes []
    expect(normalized.processes).to.deep.equal([]);
  });
});
