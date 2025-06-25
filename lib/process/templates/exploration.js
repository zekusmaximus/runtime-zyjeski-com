export function generateExplorationProcess(context = {}) {
  return {
    name: `exploration_${context.id ?? 'default'}`,
    type: 'cognitive',
    steps: ['gather_data', 'analyze', 'store'],
    context
  };
}
