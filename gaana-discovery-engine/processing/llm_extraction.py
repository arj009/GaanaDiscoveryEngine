import os
import json
import time
from groq import Groq
from dotenv import load_dotenv

load_dotenv(dotenv_path="../.env")

SYSTEM_PROMPT = """You are a product analyst AI for Gaana, India's leading music streaming platform.
Your job is to analyze user reviews and extract structured product insights in JSON format.
Always respond with valid JSON only — no markdown, no explanation."""

USER_PROMPT_TEMPLATE = """Analyze this Gaana music app review and extract insights for a product research study on music discovery.

Review: "{review_text}"
Star rating: {rating}/5
Source: {source}

Respond ONLY with a valid JSON object. No preamble, no explanation, no markdown.

{{
  "sentiment": "positive | negative | neutral",
  "sentiment_confidence": 0.0,
  "discovery_friction": true,
  "primary_frustration": "repetitive_recommendations | poor_discovery_ui | limited_genre_support | algorithm_echo_chamber | no_explore_mode | content_library_gaps | payment_issue | app_performance | other | none",
  "listening_intent": "seek_new_music | artist_deep_dive | mood_listening | background_listening | playlist_curation | none",
  "repetition_cause": "algorithm_overfits_history | autoplay_loops_same_genre | no_serendipity_feature | limited_content_variety | none",
  "user_segment": "discovery_seeker | casual_listener | audiophile | power_user | general_user",
  "unmet_need": "one sentence describing what this user wishes existed, or null if none expressed",
  "key_phrase": "the most important 5-10 word phrase from this review that captures their core feeling, or null"
}}

Rules:
- sentiment must reflect the OVERALL tone of the review, not just one sentence
- discovery_friction is true if the user mentions anything about repetitive songs, poor recommendations, inability to find new music, or being stuck in a listening bubble
- primary_frustration must be exactly one of the listed values
- unmet_need should describe a FEATURE or BEHAVIOR the user wants, not just restate the complaint
- If rating is 4-5 stars, sentiment should almost never be "negative"
- If rating is 1-2 stars, sentiment should almost never be "positive"
"""

class LLMExtractor:
    def __init__(self):
        self.api_key = os.getenv("GROQ_API_KEY")
        if self.api_key and len(self.api_key) > 10 and self.api_key != "your_groq_api_key_here":
            self.client = Groq(api_key=self.api_key)
            print("✅ Groq LLM client initialized")
        else:
            self.client = None
            print("⚠️ No GROQ_API_KEY found")

    def extract_insights(self, review: dict) -> dict:
        text = review.get("content", "")
        if not text or len(text.strip()) < 20:
            return None

        if not self.client:
            return None

        rating = review.get("rating")
        rating_str = str(rating) if rating is not None else "not available"
        source = review.get("source", "unknown")

        prompt = USER_PROMPT_TEMPLATE.format(review_text=text[:800], rating=rating_str, source=source)

        max_retries = 3
        for attempt in range(max_retries):
            try:
                response = self.client.chat.completions.create(
                    model="llama-3.3-70b-versatile",
                    messages=[
                        {"role": "system", "content": SYSTEM_PROMPT},
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.1,
                    max_tokens=400,
                    response_format={"type": "json_object"}
                )
                raw = response.choices[0].message.content
                return json.loads(raw)
            except Exception as e:
                err_msg = str(e).lower()
                if "rate limit" in err_msg or "429" in err_msg:
                    sleep_time = 15 * (attempt + 1)
                    print(f"Rate limit hit. Sleeping for {sleep_time} seconds (attempt {attempt+1}/{max_retries})...")
                    time.sleep(sleep_time)
                else:
                    print(f"Groq API error: {e}")
                    return None
        return None
