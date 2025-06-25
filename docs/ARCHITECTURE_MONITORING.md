# Consciousness Monitoring Architecture

## Data Flow
- User action (character card click) triggers character load and monitoring start.
- `MonitorController` in `public/js/modules/monitor` orchestrates monitoring.
- `MonitorSocket` handles WebSocket events for monitoring data.
- `MonitorState` stores the latest resources and process lists.
- StateManager is only updated by explicit calls from the monitoring modules.
- No system or state event should auto-start monitoring.

## Event Sequence
1. User clicks character card.
2. App loads character data and calls `window.consciousness.loadCharacter(character)`.
3. App calls `window.consciousness.userStartMonitoring()` (user action only).
4. `MonitorController` invokes `MonitorSocket.startMonitoring()` which emits `start-monitoring`.
5. Server streams `consciousness-update` events only when state changes.
6. User can stop monitoring with `window.consciousness.userStopMonitoring()`.
7. `MonitorSocket` emits `stop-monitoring` and server halts updates.

## Best Practices
- Always separate user-initiated and system-generated events.
- Never start monitoring from within state subscriptions or on page load.
- Use `getCurrentState()` for debugging.
- Add unit/integration tests for all monitoring lifecycle transitions.
