import os
import json
from groq import Groq
from dotenv import load_dotenv

load_dotenv(dotenv_path="../.env")

SYSTEM_PROMPT = """You are a product analyst AI for Gaana, India's leading music streaming platform.
Your job is to analyze user reviews and extract structured product insights in JSON format.
Always respond with valid JSON only — no markdown, no explanation."""

USER_PROMPT_TEMPLATE = """Analyze this Gaana music app review and extract insights.

Review: "{review_text}"

Return a JSON object with these exact keys:
{{
  "user_intent": "string — what the user was trying to do (1 sentence)",
  "frustration_points": ["list of specific frustrations mentioned"],
  "unmet_needs": ["list of features or improvements the user wants"],
  "user_segment": "one of: Casual Listener | Discovery Seeker | Audiophile | Social Listener | General User",
  "discovery_relevant": true or false,
  "severity": "low | medium | high"
}}"""


class LLMExtractor:
    """Uses Groq (Llama 3.1 70B) to extract deep product insights from reviews.
    
    Why Groq over OpenAI?
    - FREE generous tier (no credit card needed)
    - ~10x faster inference (LPU chips vs GPUs)
    - Llama 3.1 70B is 95% as accurate as GPT-4o for JSON extraction tasks
    """

    def __init__(self):
        self.api_key = os.getenv("GROQ_API_KEY")
        self.has_real_key = (
            self.api_key is not None
            and self.api_key != "your_groq_api_key_here"
            and len(self.api_key) > 10
        )

        if self.has_real_key:
            self.client = Groq(api_key=self.api_key)
            print("✅ Groq LLM client initialized (Llama 3.1 70B)")
        else:
            self.client = None
            print("⚠️  No GROQ_API_KEY found — using simulated insights for testing")

    def extract_insights(self, text: str) -> dict:
        # Skip empty or very short reviews — not worth an LLM call
        if not text or len(text.strip()) < 20:
            return {}

        if not self.has_real_key:
            # Fallback simulated response for testing without a key
            return {
                "user_intent": "Simulated: User wants to find new music beyond their current listening bubble.",
                "frustration_points": ["Algorithm keeps looping same 10 songs", "No way to explore new genres"],
                "unmet_needs": ["Better discovery algorithm", "Genre exploration feature", "'Surprise me' button"],
                "user_segment": "Discovery Seeker",
                "discovery_relevant": True,
                "severity": "high"
            }

        try:
            response = self.client.chat.completions.create(
                model="llama-3.3-70b-versatile",  # Best free model on Groq
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": USER_PROMPT_TEMPLATE.format(review_text=text[:800])}
                ],
                temperature=0.2,       # Low temperature = more consistent, structured output
                max_tokens=400,        # Reviews are short — 400 tokens is plenty
                response_format={"type": "json_object"}  # Force JSON output
            )
            raw = response.choices[0].message.content
            return json.loads(raw)

        except json.JSONDecodeError:
            # If Groq returns malformed JSON, gracefully return empty
            return {}
        except Exception as e:
            print(f"Groq API error: {e}")
            return {}
