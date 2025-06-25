# Consciousness Monitoring Architecture

## Data Flow
- User action (character card click) triggers character load and monitoring start.
- ConsciousnessManager manages all monitoring intervals and WebSocket events.
- StateManager is only updated by explicit calls from ConsciousnessManager methods.
- No system or state event should auto-start monitoring.

## Event Sequence
1. User clicks character card.
2. App loads character data and calls `window.consciousness.loadCharacter(character)`.
3. App calls `window.consciousness.userStartMonitoring()` (user action only).
4. ConsciousnessManager starts interval and emits `startMonitoring` to server.
5. Server emits `consciousness-update` events at intervals.
6. User can stop monitoring with `window.consciousness.userStopMonitoring()`.
7. ConsciousnessManager stops interval and emits `stopMonitoring` to server.

## Best Practices
- Always separate user-initiated and system-generated events.
- Never start monitoring from within state subscriptions or on page load.
- Use `getCurrentState()` for debugging.
- Add unit/integration tests for all monitoring lifecycle transitions.
