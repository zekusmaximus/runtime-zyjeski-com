export function isProcessValid(process, state = {}) {
  return !process.disabled && !state.blockedProcesses?.includes(process.name);
}

export function isProcessActive(process, state = {}) {
  return state.activeProcesses?.includes(process.name) || false;
}
