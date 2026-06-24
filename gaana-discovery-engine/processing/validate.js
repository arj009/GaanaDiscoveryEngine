import fs from 'fs';

const data = JSON.parse(fs.readFileSync('data/aggregated_insights.json', 'utf8'));

const s = data.sentiment;
const total = (s.positive || 0) + (s.negative || 0) + (s.neutral || 0);

if (total === 0) {
    console.log("No sentiment data found.");
    process.exit(1);
}

const negPct = (s.negative || 0) / total * 100;
const posPct = (s.positive || 0) / total * 100;
const neutralPct = (s.neutral || 0) / total * 100;

console.log(`Sentiment: ${posPct.toFixed(0)}% positive / ${negPct.toFixed(0)}% negative / ${neutralPct.toFixed(0)}% neutral`);

if (neutralPct >= 40) {
    console.warn(`⚠️ Warning: Neutral too high (${neutralPct.toFixed(0)}%) — classifier may be defaulting to neutral.`);
}
if (negPct <= 10 && total > 50) {
    console.warn(`⚠️ Warning: Negative too low (${negPct.toFixed(0)}%) — real reviews always have complaints.`);
}

console.log("✅ Validation check complete.");
