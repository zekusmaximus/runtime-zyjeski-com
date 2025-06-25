export function generateConflictResponse(context = {}) {
  return {
    name: `conflict_response_${context.id ?? 'default'}`,
    type: 'emotional',
    intensity: context.intensity ?? 1,
    context
  };
}
