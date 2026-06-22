/**
 * dataEngine.js
 * Processes enriched_reviews.json to answer the 6 Problem Statement questions.
 */

const DISCOVERY_KEYWORDS = ['discover', 'discovery', 'new music', 'new songs', 'new artist', 'recommend', 'suggestion', 'explore', 'find new', 'algorithm', 'playlist loop', 'same songs', 'repetitive', 'stuck', 'boring', 'limited', 'repetition'];
const FRUSTRATION_KEYWORDS = {
  'Repetitive Recommendations': ['same songs', 'repetitive', 'same playlist', 'loop', 'repeat', 'again and again', 'same tracks', 'same music'],
  'Poor Discovery Algorithm': ['algorithm', 'bad recommend', 'wrong suggest', 'not relevant', 'irrelevant', 'random songs', 'unrelated'],
  'Limited Genre Support': ['genre', 'indie', 'niche', 'regional', 'language', 'local', 'classical', 'jazz', 'lo-fi'],
  'App Performance Issues': ['crash', 'slow', 'lag', 'freeze', 'buffer', 'loading', 'glitch', 'bug'],
  'Payment / Subscription': ['scam', 'charge', 'payment', 'subscription', 'refund', 'money', 'price', 'premium', 'auto pay'],
  'UI / Navigation Issues': ['ui', 'interface', 'confusing', 'navigation', 'hard to find', 'design'],
};

const BEHAVIOR_KEYWORDS = {
  'Mood-Based Listening': ['mood', 'chill', 'relax', 'party', 'workout', 'sleep', 'study', 'focus'],
  'Artist / Album Deep Dive': ['artist', 'album', 'discography', 'band', 'singer'],
  'Background Listening': ['background', 'while working', 'commute', 'drive', 'gym'],
  'Playlist Curation': ['playlist', 'create playlist', 'add to playlist', 'curate', 'mix'],
  'Seeking New Discoveries': ['discover', 'explore', 'new music', 'find new', 'suggest me'],
};

const REPETITION_CAUSES = {
  'Algorithm Echo Chamber': ['same songs', 'loop', 'echo', 'repetitive', 'same playlist', 'keeps playing', 'stuck'],
  'Limited Library Variety': ['limited', 'not enough', 'small library', 'missing songs', 'cant find'],
  'No Exploration UI': ['no option', 'no way to', 'cannot find', 'nowhere to', 'hard to explore'],
  'Excessive Autoplay': ['autoplay', 'auto play', 'auto-play', 'keeps playing'],
};

export function processReviews(reviews) {
  const completed = reviews.filter(r => r.processing_status === 'completed');
  const total = completed.length;

  // ── Q1: Sentiment breakdown by source ──
  const sentimentBySource = {};
  const sentimentCounts = { POSITIVE: 0, NEGATIVE: 0, NEUTRAL: 0 };

  completed.forEach(r => {
    const s = r.sentiment || 'NEUTRAL';
    sentimentCounts[s] = (sentimentCounts[s] || 0) + 1;
    if (!sentimentBySource[r.source]) sentimentBySource[r.source] = { POSITIVE: 0, NEGATIVE: 0, NEUTRAL: 0 };
    sentimentBySource[r.source][s]++;
  });

  // ── Q1: Why do users struggle to discover? – Discovery-related review count ──
  const discoveryReviews = completed.filter(r =>
    DISCOVERY_KEYWORDS.some(kw => r.content?.toLowerCase().includes(kw))
  );
  const discoveryPct = Math.round((discoveryReviews.length / total) * 100);

  // ── Q2: Top frustrations ──
  const frustrationCounts = {};
  completed.forEach(r => {
    const text = (r.content || '').toLowerCase();
    Object.entries(FRUSTRATION_KEYWORDS).forEach(([category, keywords]) => {
      if (keywords.some(kw => text.includes(kw))) {
        frustrationCounts[category] = (frustrationCounts[category] || 0) + 1;
      }
    });
  });
  const topFrustrations = Object.entries(frustrationCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, value }));

  // ── Q3: Listening behaviors ──
  const behaviorCounts = {};
  completed.forEach(r => {
    const text = (r.content || '').toLowerCase();
    Object.entries(BEHAVIOR_KEYWORDS).forEach(([behavior, keywords]) => {
      if (keywords.some(kw => text.includes(kw))) {
        behaviorCounts[behavior] = (behaviorCounts[behavior] || 0) + 1;
      }
    });
  });
  const topBehaviors = Object.entries(behaviorCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, value }));

  // ── Q4: Causes of repetitive listening ──
  const repetitionCounts = {};
  completed.forEach(r => {
    const text = (r.content || '').toLowerCase();
    Object.entries(REPETITION_CAUSES).forEach(([cause, keywords]) => {
      if (keywords.some(kw => text.includes(kw))) {
        repetitionCounts[cause] = (repetitionCounts[cause] || 0) + 1;
      }
    });
  });
  const topRepetitionCauses = Object.entries(repetitionCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, value }));

  // ── Q5: Segment distribution + their top issues ──
  const segmentMap = {};
  completed.forEach(r => {
    const seg = r.user_segment || 'General User';
    if (!segmentMap[seg]) segmentMap[seg] = { count: 0, negative: 0, topWords: {} };
    segmentMap[seg].count++;
    if (r.sentiment === 'NEGATIVE') segmentMap[seg].negative++;
  });
  const segments = Object.entries(segmentMap)
    .sort((a, b) => b[1].count - a[1].count)
    .map(([name, data]) => ({
      name,
      count: data.count,
      negativePct: Math.round((data.negative / data.count) * 100),
    }));

  // ── Q6: Unmet needs – collect LLM insight data ──
  const unmetNeedsMap = {};
  completed.forEach(r => {
    const needs = r.llm_insights?.unmet_needs || [];
    needs.forEach(need => {
      unmetNeedsMap[need] = (unmetNeedsMap[need] || 0) + 1;
    });
  });
  const unmetNeeds = Object.entries(unmetNeedsMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, count]) => ({ name, count }));

  // ── Sample negative discovery reviews for evidence ──
  const evidenceReviews = discoveryReviews
    .filter(r => r.sentiment === 'NEGATIVE' && r.content?.length > 30)
    .slice(0, 5)
    .map(r => ({ source: r.source, content: r.content, rating: r.rating }));

  return {
    total,
    sentimentCounts,
    sentimentBySource,
    discoveryPct,
    discoveryCount: discoveryReviews.length,
    topFrustrations,
    topBehaviors,
    topRepetitionCauses,
    segments,
    unmetNeeds,
    evidenceReviews,
  };
}
