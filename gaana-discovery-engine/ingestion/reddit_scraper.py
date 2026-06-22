from typing import List
from datetime import datetime
from base_scraper import BaseScraper
from schema import ReviewModel, ReviewMetadata
import os

class RedditScraper(BaseScraper):
    def __init__(self, subreddits: List[str]):
        self.subreddits = subreddits
        self.has_keys = bool(os.getenv("REDDIT_CLIENT_ID"))

    def fetch_reviews(self, limit: int = 150) -> List[ReviewModel]:
        print(f"Fetching up to {limit} reviews from Reddit ({self.subreddits})...")
        unified_reviews = []
        
        if self.has_keys:
            # Here we would use asyncpraw to fetch real Reddit data
            pass
        else:
            print("No Reddit API keys found. Generating simulated Reddit discussions for testing Phase 2...")
            for i in range(limit):
                unified_reviews.append(ReviewModel(
                    source="reddit",
                    source_id=f"reddit_post_{i}",
                    author=f"u/musicfan_{i}",
                    content=f"Gaana's new update is okay, but I wish the discovery algorithm was better. It keeps playing the same 5 songs. (Simulated post {i})",
                    rating=None, # Reddit doesn't have 1-5 ratings
                    timestamp=datetime.utcnow(),
                    metadata=ReviewMetadata(subreddit="indianmusic")
                ))
                
        print(f"Successfully fetched {len(unified_reviews)} reviews from Reddit.")
        return unified_reviews
