import Groq from 'groq-sdk';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

const apiKeys = [
  process.env.GROQ_API_KEY_1 || process.env.GROQ_API_KEY,
  process.env.GROQ_API_KEY_2,
  process.env.GROQ_API_KEY_3,
  process.env.GROQ_API_KEY_4,
  process.env.GROQ_API_KEY_5
].filter(k => k); // Keep only defined keys

if (apiKeys.length === 0) {
    console.error("No GROQ API keys found in environment.");
    process.exit(1);
}

// Just use the first valid key for synthesis
const client = new Groq({ apiKey: apiKeys[0] });

async function synthesizeUnmetNeeds() {
  if (!fs.existsSync('data/reviews_classified.json')) {
      console.log("data/reviews_classified.json not found. Did Phase C complete?");
      return;
  }
  
  const reviews = JSON.parse(fs.readFileSync('data/reviews_classified.json', 'utf8'));

  // Filter to negative + discovery-friction reviews only
  const targetReviews = reviews.filter(r =>
    r.claude_output &&
    (r.claude_output.sentiment === 'negative' ||
     r.claude_output.discovery_friction === true)
  );

  console.log(`Found ${targetReviews.length} reviews for unmet needs synthesis.`);

  if (targetReviews.length === 0) {
      console.log("No negative or friction reviews found. Skipping synthesis.");
      fs.writeFileSync('data/unmet_needs.json', JSON.stringify([]));
      return;
  }

  const mappedReviews = targetReviews.map(r => ({
      text: r.content,
      frustration: r.claude_output.primary_frustration,
      unmet_need: r.claude_output.unmet_need,
      segment: r.claude_output.user_segment,
  }));

  const FINAL_PROMPT = `
You are a senior product researcher synthesizing user feedback for Gaana, an Indian music streaming app.

Below are the most critical negative and discovery-related user reviews from our dataset:
${JSON.stringify(mappedReviews, null, 1)}

Your task: Identify the TOP 5 unmet needs that emerge most consistently and urgently across this corpus.

CRITICAL STRATEGIC ALIGNMENT: 
Your company's strategic goal is to "increase meaningful music discovery and reduce repetitive listening behavior."
You MUST IGNORE generic complaints about ads, subscription costs, payment bugs, or app crashes.
Focus strictly on unmet needs related to music discovery, recommendation algorithms, UI friction for exploration, and listening behaviors.
Example of a brilliant unmet need: "Conversational Discovery: Instead of a toggle, the user types or speaks their mood: 'I want something like Arijit but more upbeat, maybe with guitars.'"

For each unmet need, provide:
1. A sharp 3-5 word name (e.g., "Transparent Recommendation Reasoning")
2. Why users want this — 2 sentences grounded in the data
3. Which user segment feels this most acutely
4. What % of the corpus mentions this need (estimate from pattern frequency)
5. One representative verbatim phrase from a review (keep it under 20 words)
6. An opportunity score from 1-10 (10 = most urgent, affects most users)

Respond ONLY with a valid JSON object matching this exact schema:
{
  "unmet_needs": [
    {
      "name": "string",
      "description": "string",
      "primary_segment": "string",
      "mention_pct": 0,
      "example_phrase": "string",
      "opportunity_score": 0
    }
  ]
}
`;

  console.log("Synthesizing final top 5 unmet needs using Groq's llama-3.1-8b-instant...");
  
  try {
      const response = await client.chat.completions.create({
          model: 'llama-3.1-8b-instant',
          messages: [{ role: 'user', content: FINAL_PROMPT }],
          temperature: 0.2,
          response_format: { type: "json_object" }
      });

      const raw = response.choices[0].message.content.trim();
      const parsed = JSON.parse(raw);
      const needs = parsed.unmet_needs || parsed;

      fs.writeFileSync('data/unmet_needs.json', JSON.stringify(needs, null, 2));
      console.log(`\n✅ Synthesized ${needs.length} unmet needs → data/unmet_needs.json`);
  } catch (err) {
      console.error(`Final synthesis failed: ${err.message}`);
  }
}

synthesizeUnmetNeeds().catch(console.error);
