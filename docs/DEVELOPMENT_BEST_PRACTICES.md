# Development Best Practices for Runtime.zyjeski.com

## Monitoring & Real-Time Updates
- Never start monitoring or real-time update intervals on page load or from state subscriptions.
- Only start monitoring in response to explicit user actions (e.g., character card click).
- Always use `userStartMonitoring()` and `userStopMonitoring()` for lifecycle control.
- Ensure only one update interval is running at any time.

## Debugging
- Use `getCurrentState()` on both App and ConsciousnessManager for live state inspection.
- Add unit and integration tests for all monitoring transitions.
- Document any changes to event flow or monitoring logic in `DEBUGGING.md` and `ARCHITECTURE_MONITORING.md`.

## Data Flow
- Validate all incoming data against expected schemas before updating UI or state.
- Log and handle all data validation errors gracefully.

## Event Handling
- Clean up all event listeners and intervals on destroy/unmount.
- Avoid duplicate event listeners or intervals.

## Regression Prevention
- Add tests that fail if monitoring starts without user action.
- Review all new code for accidental auto-starts or duplicate intervals.
