import fs from 'fs';

const data = fs.readFileSync('data/reviews_classified.json', 'utf8');
const reviews = JSON.parse(data);

const classified = reviews.filter(r => r.claude_output);

const countFrequencies = (arr) => {
    return arr.reduce((acc, val) => {
        if (val) {
            acc[val] = (acc[val] || 0) + 1;
        }
        return acc;
    }, {});
};

const sentiments = countFrequencies(classified.map(r => r.claude_output.sentiment));

const frustrations = countFrequencies(
    classified.map(r => r.claude_output.primary_frustration).filter(f => f && !['none', 'payment_issue', 'app_performance', 'other'].includes(f))
);

const intents = countFrequencies(
    classified.map(r => r.claude_output.listening_intent).filter(i => i && i !== 'none')
);

const repetitionCauses = countFrequencies(
    classified.map(r => r.claude_output.repetition_cause).filter(c => c && c !== 'none')
);

const segments = countFrequencies(classified.map(r => r.claude_output.user_segment));

const discoveryFrictionCount = classified.filter(r => r.claude_output.discovery_friction === true).length;
const discoveryFrictionPct = classified.length > 0 ? (discoveryFrictionCount / classified.length) * 100 : 0;

// Sort function for object entries
const sortEntries = (obj) => Object.fromEntries(
    Object.entries(obj).sort(([,a], [,b]) => b - a)
);

const aggregated = {
    total_reviews: classified.length,
    discovery_friction_pct: Number(discoveryFrictionPct.toFixed(1)),
    sentiment: sortEntries(sentiments),
    frustrations: sortEntries(frustrations),
    listening_intents: sortEntries(intents),
    repetition_causes: sortEntries(repetitionCauses),
    segments: sortEntries(segments),
};

fs.writeFileSync('data/aggregated_insights.json', JSON.stringify(aggregated, null, 2));
console.log("✅ Aggregated insights → data/aggregated_insights.json");
