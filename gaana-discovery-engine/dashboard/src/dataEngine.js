export function processAggregatedData(aggregated, unmetNeeds, classifiedReviews) {
  const formatLabel = (str) => {
    if (!str) return null;
    return str.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  const formatObj = (obj) => Object.entries(obj || {}).map(([name, value]) => ({ name: formatLabel(name), value }));
  
  const segments = Object.entries(aggregated.segments || {}).map(([name, count]) => ({
    name: formatLabel(name),
    count: count,
    negativePct: 0, // Not explicitly tracked in new aggregation script, but can be added back if needed
  }));

  const evidenceReviews = (classifiedReviews || [])
    .filter(r => r.claude_output?.discovery_friction === true && r.claude_output?.sentiment === 'negative' && r.content?.length > 30)
    .slice(0, 5)
    .map(r => ({ source: r.source, content: r.content, rating: r.rating }));

  return {
    total: aggregated.total_reviews || 0,
    discoveryPct: aggregated.discovery_friction_pct || 0,
    discoveryCount: Math.round(((aggregated.total_reviews || 0) * (aggregated.discovery_friction_pct || 0)) / 100),
    sentimentCounts: {
      POSITIVE: aggregated.sentiment?.positive || 0,
      NEGATIVE: aggregated.sentiment?.negative || 0,
      NEUTRAL: aggregated.sentiment?.neutral || 0,
    },
    topFrustrations: formatObj(aggregated.frustrations),
    topBehaviors: formatObj(aggregated.listening_intents),
    topRepetitionCauses: formatObj(aggregated.repetition_causes),
    segments: segments,
    unmetNeeds: unmetNeeds || [],
    evidenceReviews: evidenceReviews,
  };
}
