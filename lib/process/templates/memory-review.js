export function generateMemoryReview(context = {}) {
  return {
    name: `memory_review_${context.id ?? 'default'}`,
    type: 'reflective',
    target: context.target || 'recent',
    context
  };
}
