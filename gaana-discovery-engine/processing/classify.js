import Groq from 'groq-sdk';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

const CLASSIFICATION_PROMPT = (review) => `
You are analyzing a user review of Gaana, an Indian music streaming app.
Your job is to extract structured insights for a product research study on music discovery.

Review text: "${review.content.replace(/\n/g, ' ')}"
Star rating: ${review.rating ?? 'not available'}/5
Source: ${review.source}

Respond ONLY with a valid JSON object. No preamble, no explanation, no markdown formatting blocks.

{
  "sentiment": "positive" | "negative" | "neutral",
  "sentiment_confidence": 0.0,
  "discovery_friction": true | false,
  "primary_frustration": "repetitive_recommendations" | "poor_discovery_ui" | "limited_genre_support" | "algorithm_echo_chamber" | "no_explore_mode" | "content_library_gaps" | "payment_issue" | "app_performance" | "other" | "none",
  "listening_intent": "seek_new_music" | "artist_deep_dive" | "mood_listening" | "background_listening" | "playlist_curation" | "none",
  "repetition_cause": "algorithm_overfits_history" | "autoplay_loops_same_genre" | "no_serendipity_feature" | "limited_content_variety" | "none",
  "user_segment": "discovery_seeker" | "casual_listener" | "audiophile" | "power_user" | "general_user",
  "unmet_need": "one sentence describing what this user wishes existed, or null if none expressed",
  "key_phrase": "the most important 5-10 word phrase from this review that captures their core feeling, or null"
}

Rules:
- sentiment must reflect the OVERALL tone of the review
- discovery_friction is true if the user mentions anything about repetitive songs, poor recommendations, inability to find new music, or being stuck in a listening bubble
- primary_frustration must be exactly one of the listed values
- unmet_need should describe a FEATURE or BEHAVIOR the user wants, not just restate the complaint
`;

async function classifyReviews() {
  const rawData = fs.readFileSync('data/reviews_raw.json', 'utf8');
  let reviews = JSON.parse(rawData);
  
  // Set limit to 200 reviews to safely fit inside the 100,000 TPD limit of llama-3.1-8b-instant
  const limit = 200;
  reviews = reviews.slice(0, limit);
  
  const results = [];
  const DELAY_MS = 1500; 

  console.log(`Classifying ${reviews.length} reviews using llama-3.1-8b-instant...`);

  for (let i = 0; i < reviews.length; i++) {
    const review = reviews[i];
    
    try {
      const response = await client.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: CLASSIFICATION_PROMPT(review) }],
        temperature: 0.1,
        response_format: { type: "json_object" }
      });

      let raw = response.choices[0].message.content.trim();
      const parsed = JSON.parse(raw);
      results.push({ ...review, claude_output: parsed, processing_status: 'done' });
    } catch (err) {
      results.push({ ...review, processing_status: 'failed', claude_output: null });
    }

    process.stdout.write(`\rProgress: ${i + 1}/${reviews.length} reviews classified`);
    await new Promise(r => setTimeout(r, DELAY_MS));
  }

  if (!fs.existsSync('data')) fs.mkdirSync('data');
  fs.writeFileSync('data/reviews_classified.json', JSON.stringify(results, null, 2));
  console.log(`\n✅ Classification complete → data/reviews_classified.json`);
}

classifyReviews().catch(console.error);
