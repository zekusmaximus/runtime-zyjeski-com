import ConditionEvaluator from '../ConditionEvaluator.js';

export function isAddressInRange(address, range) {
  const addr = parseInt(address, 16);
  const start = parseInt(range.start, 16);
  const end = parseInt(range.end, 16);
  return addr >= start && addr <= end;
}

export function replacePlaceholders(text, consciousness, storyProgress) {
  return text
    .replace(/\${name}/g, consciousness.name)
    .replace(/\${emotion}/g, consciousness.emotional?.primary || 'neutral')
    .replace(/\${stability}/g, Math.round(consciousness.stability * 100))
    .replace(/\${corruption}/g, Math.round(consciousness.corruption * 100))
    .replace(/\${act}/g, storyProgress?.act || 1);
}

export function weightedSelect(items) {
  const total = items.reduce((s, i) => s + (i.weight || 1), 0);
  let rand = Math.random() * total;
  for (const item of items) {
    rand -= (item.weight || 1);
    if (rand <= 0) return item;
  }
  return items[0];
}

export function selectContextualFragment(candidates, consciousness, story, progress) {
  const scored = candidates.map(f => {
    let score = 0;
    if (f.context?.emotionalContext?.includes(consciousness.emotional?.primary)) score += 10;
    if (f.context?.storyAct === progress?.act) score += 5;
    if (f.context?.complexity === story.config?.technical?.difficult?.initial) score += 3;
    score += Math.random() * 5;
    return { fragment: f, score };
  });
  scored.sort((a,b)=>b.score-a.score);
  return scored[0].fragment;
}

export function enrichFragment(fragment, consciousness, story, evaluator = new ConditionEvaluator()) {
  const enriched = JSON.parse(JSON.stringify(fragment));
  if (enriched.content?.text) {
    enriched.content.text = replacePlaceholders(enriched.content.text, consciousness, story.progress);
  }
  if (enriched.variations?.length) {
    const applicable = enriched.variations.filter(v =>
      evaluator.evaluate({ conditions:[v.condition] }, { consciousness })
    );
    if (applicable.length) {
      const selected = weightedSelect(applicable);
      Object.assign(enriched.content, selected.content);
    }
  }
  return enriched;
}

export function generateGenericMemoryDump(address, consciousness) {
  return {
    id: `generic-memory-${address}`,
    type: 'memory_dump',
    content: {
      text: `Memory at ${address}:\n[Corrupted data - emotional resonance detected]\n` +
            `Stability factor: ${consciousness.stability.toFixed(2)}\n` +
            `Unable to fully decode memory contents.`,
      formatting: 'memory',
      voice: 'system'
    }
  };
}

export function calculatePriority(fragment, context, weights, recentSimilar = 0) {
  let priority = weights[fragment.priority || 'normal'];
  if (context.consciousness?.stability < 0.3) priority *= 1.5;
  if (fragment.context?.emotionalContext?.includes(context.consciousness?.emotional?.primary)) {
    priority *= 1.2;
  }
  priority /= (1 + recentSimilar * 0.2);
  return priority;
}

export function getRecentSimilarFragments(fragment, triggeredIds, fragmentIndex) {
  const recent = Array.from(triggeredIds || []).slice(-10);
  return recent.filter(id => fragmentIndex.get(id)?.type === fragment.type).length;
}
