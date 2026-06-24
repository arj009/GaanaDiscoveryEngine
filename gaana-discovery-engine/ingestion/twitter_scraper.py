import requests
from typing import List
from datetime import datetime
from base_scraper import BaseScraper
from schema import ReviewModel, ReviewMetadata
import os

class TwitterScraper(BaseScraper):
    def __init__(self):
        # Clean up the token just in case it has surrounding spaces in .env
        token = os.getenv("TWITTER_BEARER_TOKEN", "").strip()
        self.bearer_token = token if len(token) > 20 else None

    def fetch_reviews(self, limit: int = 50) -> List[ReviewModel]:
        print(f"Fetching up to {limit} reviews from Twitter (X)...")
        unified_reviews = []
        
        if self.bearer_token:
            url = "https://api.twitter.com/2/tweets/search/recent"
            params = {
                'query': 'gaana (recommendation OR recommendations OR discovery OR playlist OR algorithm) -is:retweet',
                'max_results': min(limit, 100), # Twitter API max per page is 100
                'tweet.fields': 'created_at,author_id'
            }
            headers = {"Authorization": f"Bearer {self.bearer_token}"}
            
            try:
                response = requests.get(url, headers=headers, params=params)
                if response.status_code == 200:
                    data = response.json()
                    tweets = data.get('data', [])
                    for i, tweet in enumerate(tweets):
                        if len(unified_reviews) >= limit:
                            break
                        unified_reviews.append(ReviewModel(
                            source="twitter",
                            source_id=f"tweet_{tweet['id']}",
                            author=f"twitter_user_{tweet.get('author_id', i)}",
                            content=tweet['text'],
                            rating=None,
                            timestamp=datetime.fromisoformat(tweet['created_at'].replace('Z', '+00:00')),
                            metadata=ReviewMetadata()
                        ))
                else:
                    print(f"Twitter API Error {response.status_code}: {response.text}")
            except Exception as e:
                print(f"Failed to fetch from Twitter: {e}")
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

