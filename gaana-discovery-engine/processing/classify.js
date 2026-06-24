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

const CLASSIFICATION_PROMPT = (review) => `
You are a neutral product analyst classifying a user review of Gaana, an Indian music streaming app.
Classify this review objectively. Do NOT assume the review is about music discovery unless it explicitly mentions it.

Review text: "${review.content.replace(/\n/g, ' ')}"
Star rating: ${review.rating ?? 'not available'}/5
Source: ${review.source}

Respond ONLY with a valid JSON object. No preamble, no explanation, no markdown formatting blocks.

{
  "sentiment": "positive" | "negative" | "neutral",
  "sentiment_confidence": 0.0 to 1.0,
  "discovery_friction": true | false,
  "primary_frustration": "repetitive_recommendations" | "poor_discovery_ui" | "limited_genre_support" | "algorithm_echo_chamber" | "no_explore_mode" | "content_library_gaps" | "payment_issue" | "app_performance" | "other" | "none",
  "listening_intent": "seek_new_music" | "artist_deep_dive" | "mood_listening" | "background_listening" | "playlist_curation" | "none",
  "repetition_cause": "algorithm_overfits_history" | "autoplay_loops_same_genre" | "no_serendipity_feature" | "limited_content_variety" | "none",
  "user_segment": "discovery_seeker" | "casual_listener" | "audiophile" | "power_user" | "general_user",
  "unmet_need": "one sentence describing what this user wishes existed, or null if none expressed",
  "key_phrase": "the most important 5-10 word phrase from this review that captures their core feeling, or null"
}

CRITICAL RULES:
- sentiment must reflect the OVERALL tone of the review
- discovery_friction: Set to true ONLY if the user EXPLICITLY mentions repetitive songs, poor recommendations, inability to find new music, or being stuck in a loop. Generic complaints about ads, crashes, payments, or UI bugs are NOT discovery friction. Be conservative — when in doubt, set to false.
- primary_frustration: Must be exactly one value. Use "payment_issue" for subscription/billing complaints. Use "app_performance" for crashes/bugs/lag. Use "other" for generic complaints. Use "none" for positive reviews.
- user_segment classification rules:
  * "discovery_seeker": ONLY if user explicitly wants new music, new artists, or better recommendations
  * "casual_listener": User listens occasionally, mentions background music, or has simple needs
  * "general_user": Default for users who complain about general app issues (ads, crashes, payments) without mentioning specific listening habits
  * "power_user": User mentions playlists, equalizer, offline mode, or advanced features
  * "audiophile": User specifically discusses audio quality, bitrate, lossless, or sound fidelity
  Most app store reviewers are casual_listener or general_user. Do NOT default to discovery_seeker.
- unmet_need should describe a FEATURE or BEHAVIOR the user wants, not just restate the complaint
`;

async function classifyReviews() {
  const rawData = fs.readFileSync('data/reviews_raw.json', 'utf8');
  let reviews = JSON.parse(rawData);
  
  // Dynamic scaling: 200 reviews per available API key to bypass strict 100k free tier limits!
  const limit = Math.min(apiKeys.length * 200, 1000);
  reviews = reviews.slice(0, limit);
  
  const results = [];
  const DELAY_MS = 1500; 

  console.log(`Classifying ${reviews.length} reviews utilizing ${apiKeys.length} API keys...`);

  let keyIndex = 0;

  for (let i = 0; i < reviews.length; i++) {
    const review = reviews[i];
    
    // Rotate key
    const currentKey = apiKeys[keyIndex % apiKeys.length];
    const client = new Groq({ apiKey: currentKey });
    
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
      keyIndex++; // Only rotate to next key on success to balance load
    } catch (err) {
      if (err.message.includes('rate_limit')) {
         keyIndex++; // If a key hits a rate limit early, jump to the next key
      }
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
