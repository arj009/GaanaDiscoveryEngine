import os
import json
import time
import urllib.request
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
        # Load Groq keys
        self.groq_keys = []
        for i in range(1, 10):
            k = os.getenv(f"GROQ_API_KEY_{i}") or os.getenv(f"Groq_API_Key_{i}") or os.getenv(f"groq_api_key_{i}")
            if k:
                self.groq_keys.append(k)
        
        main_groq = os.getenv("GROQ_API_KEY") or os.getenv("Groq_API_Key") or os.getenv("groq_api_key")
        if main_groq and main_groq not in self.groq_keys:
            self.groq_keys.insert(0, main_groq)

        # Load Cerebras keys
        self.cerebras_keys = []
        for i in range(1, 10):
            k = os.getenv(f"CEREBRAS_API_KEY_{i}") or os.getenv(f"Cerebras_API_Key_{i}") or os.getenv(f"cerebras_api_key_{i}")
            if k:
                self.cerebras_keys.append(k)
                
        main_cerebras = os.getenv("CEREBRAS_API_KEY") or os.getenv("Cerebras_API_Key") or os.getenv("cerebras_api_key")
        if main_cerebras and main_cerebras not in self.cerebras_keys:
            self.cerebras_keys.insert(0, main_cerebras)

        self.clients = []
        for key in self.groq_keys:
            if len(key) > 10 and key != "your_groq_api_key_here":
                self.clients.append({"provider": "groq", "key": key, "model": "llama-3.3-70b-versatile"})
                
        for key in self.cerebras_keys:
            if len(key) > 10 and key != "your_cerebras_api_key_here":
                self.clients.append({"provider": "cerebras", "key": key, "model": "gpt-oss-120b"})
                
        print(f"✅ LLM Extraction clients initialized: {len(self.clients)} clients found ({len(self.groq_keys)} Groq, {len(self.cerebras_keys)} Cerebras)")

    def extract_insights(self, review: dict) -> dict:
        text = review.get("content", "")
        if not text or len(text.strip()) < 20:
            return None

        if not self.clients:
            print("⚠️ No valid LLM clients initialized")
            return None

        rating = review.get("rating")
        rating_str = str(rating) if rating is not None else "not available"
        source = review.get("source", "unknown")

        prompt = USER_PROMPT_TEMPLATE.format(review_text=text[:800], rating=rating_str, source=source)

        available_clients = list(self.clients)
        client_idx = 0
        
        while available_clients:
            current_client = available_clients[client_idx % len(available_clients)]
            try:
                if current_client["provider"] == "groq":
                    if not hasattr(self, "_groq_instances"):
                        self._groq_instances = {}
                    if current_client["key"] not in self._groq_instances:
                        self._groq_instances[current_client["key"]] = Groq(api_key=current_client["key"])
                    
                    groq_client = self._groq_instances[current_client["key"]]
                    response = groq_client.chat.completions.create(
                        model=current_client["model"],
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
                    
                elif current_client["provider"] == "cerebras":
                    url = "https://api.cerebras.ai/v1/chat/completions"
                    headers = {
                        "Content-Type": "application/json",
                        "Authorization": f"Bearer {current_client['key']}"
                    }
                    data = {
                        "model": current_client["model"],
                        "messages": [
                            {"role": "system", "content": SYSTEM_PROMPT},
                            {"role": "user", "content": prompt}
                        ],
                        "temperature": 0.1,
                        "max_tokens": 400,
                        "response_format": {"type": "json_object"}
                    }
                    req = urllib.request.Request(
                        url,
                        data=json.dumps(data).encode("utf-8"),
                        headers=headers,
                        method="POST"
                    )
                    with urllib.request.urlopen(req, timeout=30) as response:
                        res_data = response.read().decode("utf-8")
                        parsed = json.loads(res_data)
                        raw = parsed["choices"][0]["message"]["content"]
                        return json.loads(raw)
                        
            except Exception as e:
                err_msg = str(e).lower()
                print(f"Error on {current_client['provider']}: {e}")
                if "rate limit" in err_msg or "429" in err_msg or "resource_exhausted" in err_msg or "exhausted" in err_msg:
                    if "day" in err_msg or "limit exceeded" in err_msg or "exhausted" in err_msg:
                        print(f"Client {current_client['provider']} exhausted for day. Removing client.")
                        available_clients.remove(current_client)
                        if not available_clients:
                            break
                    else:
                        client_idx += 1
                        wait_time = 15 if current_client["provider"] == "cerebras" else 5
                        time.sleep(wait_time)
                else:
                    client_idx += 1
        return None
