import hashlib
from typing import List
from schema import ReviewModel
from play_store_scraper import PlayStoreScraper
from apple_store_scraper import AppleStoreScraper
from reddit_scraper import RedditScraper
from forum_scraper import ForumScraper
from twitter_scraper import TwitterScraper

class IngestionPipeline:
    def __init__(self):
        self.scrapers_with_limits = {
            PlayStoreScraper(app_id="com.gaana"): 400,
            AppleStoreScraper(app_name="gaana", app_id="585270521"): 400,
            RedditScraper(subreddits=["gaana", "indianmusic"]): 150,
            ForumScraper(): 150,
            TwitterScraper(): 150
        }
        self.seen_hashes = set()

    def _generate_content_hash(self, source: str, source_id: str) -> str:
        unique_string = f"{source}_{source_id}"
        return hashlib.sha256(unique_string.encode('utf-8')).hexdigest()

    def run(self):
        print("=== Starting FULL Ingestion Pipeline ===")
        all_new_reviews: List[ReviewModel] = []
        
        for scraper, limit in self.scrapers_with_limits.items():
            source_reviews = scraper.fetch_reviews(limit=limit)
            
            for review in source_reviews:
                review_hash = self._generate_content_hash(review.source, review.source_id)
                
                if review_hash not in self.seen_hashes:
                    self.seen_hashes.add(review_hash)
                    all_new_reviews.append(review)

        print(f"=== Pipeline Complete. Ingested {len(all_new_reviews)} new unique reviews. ===")
        
        import json
        with open("raw_reviews_dump.json", "w") as f:
            json.dump([r.model_dump(mode='json') for r in all_new_reviews], f, indent=2)
        print("Data successfully dumped to raw_reviews_dump.json")

if __name__ == "__main__":
    pipeline = IngestionPipeline()
    pipeline.run()
