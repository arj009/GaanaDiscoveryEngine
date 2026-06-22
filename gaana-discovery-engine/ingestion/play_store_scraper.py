from typing import List
from datetime import datetime
from google_play_scraper import Sort, reviews
from base_scraper import BaseScraper
from schema import ReviewModel, ReviewMetadata

class PlayStoreScraper(BaseScraper):
    def __init__(self, app_id: str = "com.gaana"):
        self.app_id = app_id

    def fetch_reviews(self, limit: int = 100) -> List[ReviewModel]:
        print(f"Fetching up to {limit} reviews from Google Play Store for {self.app_id}...")
        
        result, _ = reviews(
            self.app_id,
            lang='en', # Language filtering as per Phase 3 plan
            country='in', # Targeting Indian market for Gaana
            sort=Sort.NEWEST,
            count=limit
        )

        unified_reviews = []
        for r in result:
            # Map the raw dictionary to our Pydantic schema
            review_obj = ReviewModel(
                source="play_store",
                source_id=r.get("reviewId"),
                author=r.get("userName", "anonymous"),
                content=r.get("content", ""),
                rating=r.get("score"),
                timestamp=r.get("at", datetime.utcnow()),
                metadata=ReviewMetadata(
                    app_version=r.get("reviewCreatedVersion")
                )
            )
            unified_reviews.append(review_obj)
            
        print(f"Successfully fetched {len(unified_reviews)} reviews from Play Store.")
        return unified_reviews

if __name__ == "__main__":
    # Quick local test
    scraper = PlayStoreScraper()
    data = scraper.fetch_reviews(limit=5)
    for d in data:
        print(f"[{d.rating}/5] {d.content[:50]}...")
