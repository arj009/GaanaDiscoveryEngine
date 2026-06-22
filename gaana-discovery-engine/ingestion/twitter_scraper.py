from typing import List
from datetime import datetime
from base_scraper import BaseScraper
from schema import ReviewModel
import os

class TwitterScraper(BaseScraper):
    def __init__(self):
        self.has_keys = bool(os.getenv("TWITTER_BEARER_TOKEN"))

    def fetch_reviews(self, limit: int = 150) -> List[ReviewModel]:
        print(f"Fetching up to {limit} reviews from Twitter (X)...")
        unified_reviews = []
        
        if self.has_keys:
            # Here we would use tweepy to fetch real Twitter data
            pass
        else:
            print("No Twitter API keys found. Generating simulated tweets for testing Phase 2...")
            for i in range(limit):
                unified_reviews.append(ReviewModel(
                    source="twitter",
                    source_id=f"tweet_{i}",
                    author=f"@gaana_user_{i}",
                    content=f"Trying to find new indie artists but the app keeps suggesting mainstream pop. Fix your discovery @gaana! (Simulated tweet {i})",
                    rating=None,
                    timestamp=datetime.utcnow()
                ))
                
        print(f"Successfully fetched {len(unified_reviews)} reviews from Twitter.")
        return unified_reviews
