import requests
from typing import List
from datetime import datetime
from base_scraper import BaseScraper
from schema import ReviewModel, ReviewMetadata

class AppleStoreScraper(BaseScraper):
    def __init__(self, app_name: str = "gaana", app_id: str = "585270521"):
        self.app_name = app_name
        self.app_id = app_id

    def fetch_reviews(self, limit: int = 100) -> List[ReviewModel]:
        print(f"Fetching up to {limit} reviews from Apple App Store for {self.app_name}...")
        unified_reviews = []
        
        # We use the public iTunes RSS feed to bypass the broken app-store-scraper library
        url = f"https://itunes.apple.com/in/rss/customerreviews/page=1/id={self.app_id}/sortby=mostrecent/json"
        
        try:
            response = requests.get(url)
            if response.status_code == 200:
                data = response.json()
                entries = data.get("feed", {}).get("entry", [])
                
                # The first entry in RSS is usually metadata, skip it if there's no author
                for entry in entries:
                    if "author" not in entry: continue
                    
                    review_obj = ReviewModel(
                        source="app_store",
                        source_id=entry.get("id", {}).get("label", ""),
                        author=entry.get("author", {}).get("name", {}).get("label", "anonymous"),
                        content=entry.get("content", {}).get("label", ""),
                        rating=int(entry.get("im:rating", {}).get("label", "0")),
                        timestamp=datetime.utcnow(), # RSS doesn't give exact timestamp easily, using fetch time
                        metadata=ReviewMetadata(
                            app_version=entry.get("im:version", {}).get("label", "")
                        )
                    )
                    unified_reviews.append(review_obj)
                    if len(unified_reviews) >= limit:
                        break
        except Exception as e:
            print(f"Error fetching Apple reviews: {e}")
            
        print(f"Successfully fetched {len(unified_reviews)} reviews from App Store.")
        return unified_reviews
