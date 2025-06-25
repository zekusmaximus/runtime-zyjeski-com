# Debugging Consciousness Monitoring

## Monitoring Lifecycle
- Monitoring does NOT start automatically.
- To start monitoring, call: `window.consciousness.userStartMonitoring()` (typically from a user action, e.g., character card click).
- To stop monitoring, call: `window.consciousness.userStopMonitoring()`.
- The state manager’s `monitoringActive` is only set by these methods.
- Never trigger monitoring from system events or state subscriptions.
- If you see runaway updates, check for accidental auto-starts or duplicate intervals.

## Debugging Checklist
- If monitoring starts on page load, check for accidental calls to `userStartMonitoring()` or direct interval starts.
- Use `window.consciousness.getCurrentState()` in the browser console to inspect the current state.
- If updates never stop, ensure `userStopMonitoring()` is called and no duplicate intervals exist.
- All monitoring lifecycle transitions should be user-driven.

## Event Flow
1. User clicks a character card.
2. App loads character and calls `window.consciousness.loadCharacter(character)`.
3. App calls `window.consciousness.userStartMonitoring()` (user action only).
4. Monitoring starts, updates flow.
5. User can stop monitoring with `window.consciousness.userStopMonitoring()`.

## Regression Prevention
- Add a test that fails if monitoring starts without user action.
- Document the expected event flow in your architecture docs.

See also: `docs/ARCHITECTURE_MONITORING.md` for monitoring module details.
