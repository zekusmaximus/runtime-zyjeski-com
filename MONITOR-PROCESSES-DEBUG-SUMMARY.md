# Monitor Processes Debug Summary

## Issue Identified
**Problem**: Monitor shows 0 processes even though character loads successfully
**Symptoms**: 
- `📊 Monitor state transformed: {processCount: 0, errorCount: 0, memoryRegions: 0, cpuUsage: 0, memoryUsage: 0}`
- `🔄 Updating process table: []`
- Monitor UI displays empty process list

## Root Cause Analysis

The issue is in the data flow from character loading to monitor display:

1. **Character loads successfully** - alexander-kane.json has `baseProcesses` array with 5 processes
2. **StateManager processes empty** - `getProcesses()` returns empty array
3. **Monitor gets empty data** - Monitor state builds from empty StateManager processes
4. **UI shows no processes** - Empty array results in empty process table

## Debugging Strategy

### Added Debug Logging to StateManager

1. **Character Structure Logging**:
   ```javascript
   console.log('[STATE MANAGER] Flat structure detected:');
   console.log('  character.baseProcesses:', character.baseProcesses?.length || 0);
   console.log('  character.processes:', character.processes?.length || 0);
   console.log('  final processes array:', processes.length);
   ```

2. **Process Setting Logging**:
   ```javascript
   console.log('[STATE MANAGER] setProcesses called with:', processArray.length, 'processes');
   if (processArray.length > 0) {
     console.log('[STATE MANAGER] Sample process:', processArray[0].name || processArray[0]);
   }
   ```

### Created Debug Test Page

**File**: `debug-monitor-processes.html`

**Tests**:
- **debugStateManager()** - Checks StateManager character and processes
- **debugCharacterData()** - Fetches raw character data from API
- **debugMonitorState()** - Tests monitor state getter step by step
- **debugTransformData()** - Tests transform function with mock data
- **loadCharacterAndDebug()** - Full character loading with debug

## Expected Debug Results

### What We Should See:
```
[STATE MANAGER] Loading character: alexander-kane
[STATE MANAGER] Character data received: {id: 'alexander-kane', name: 'Alexander Kane', ...}
[STATE MANAGER] Flat structure detected:
  character.baseProcesses: 5
  character.processes: 0
  final processes array: 5
[STATE MANAGER] setProcesses called with: 5 processes
[STATE MANAGER] Sample process: grief_processing
Character state loaded successfully: Alexander Kane
Loaded processes: 5
```

### What We're Actually Seeing:
```
Character state loaded successfully: Alexander Kane
Loaded processes: 5  ← This suggests StateManager has processes
📊 Monitor state transformed: {processCount: 0, ...}  ← But monitor sees 0
```

## Possible Issues to Investigate

### 1. StateManager Process Storage
- Are processes being set correctly in StateManager?
- Is `getProcesses()` returning the right data?
- Is there a timing issue between setting and getting?

### 2. Monitor State Data Access
- Is MonitorState's `consciousnessData` getter accessing the right StateManager methods?
- Is the data structure being built correctly?
- Is the transform function receiving the right input?

### 3. Data Structure Mismatch
- Are the processes in the right format for the monitor?
- Is the transform function expecting different field names?
- Are there validation issues in the transform pipeline?

## Testing Instructions

### 1. Run Debug Page
1. Open `debug-monitor-processes.html`
2. Click "Debug StateManager" to see character and process data
3. Click "Debug Monitor State" to see monitor data flow
4. Click "Load Character & Debug" for full flow test

### 2. Check Console Logs
After character selection, look for:
- `[STATE MANAGER] Flat structure detected:` logs
- `[STATE MANAGER] setProcesses called with:` logs
- Process counts at each stage

### 3. Manual Console Testing
```javascript
// Test 1: Check StateManager directly
console.log('Character:', window.stateManager.getCurrentCharacter());
console.log('Processes:', window.stateManager.getProcesses());

// Test 2: Check monitor state
console.log('Monitor data:', window.monitor.state.consciousnessData);

// Test 3: Check raw character data
fetch('/api/character/alexander-kane').then(r => r.json()).then(console.log);
```

## Expected Fixes

Based on debug results, we may need to:

1. **Fix process array assignment** if StateManager isn't storing processes correctly
2. **Fix monitor data access** if MonitorState isn't reading StateManager correctly
3. **Fix transform function** if it's not processing the data structure properly
4. **Fix timing issues** if there's a race condition between setting and getting data

## Success Criteria

After fixing, we should see:
- ✅ StateManager logs showing 5 processes being set
- ✅ Monitor state showing 5 processes in consciousnessData
- ✅ Monitor UI displaying process list with grief_processing, search_protocol, etc.
- ✅ Process table populated with character's consciousness processes

The debug tools will help us identify exactly where in the data flow the processes are being lost.
