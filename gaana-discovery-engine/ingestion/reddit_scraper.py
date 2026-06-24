import requests
import time
from typing import List
from datetime import datetime
from base_scraper import BaseScraper
from schema import ReviewModel, ReviewMetadata

class RedditScraper(BaseScraper):
    def __init__(self, subreddits: List[str]):
        self.subreddits = subreddits

    def fetch_reviews(self, limit: int = 150) -> List[ReviewModel]:
        print(f"Fetching up to {limit} reviews from Reddit ({self.subreddits})...")
        unified_reviews = []
        queries = ['gaana recommendations', 'gaana discovery', 'gaana same songs', 'gaana repeat']
        
        headers = {'User-Agent': 'GaanaResearch/1.0'}
        
        for sub in self.subreddits:
            for q in queries:
                if len(unified_reviews) >= limit:
                    break
                url = f"https://www.reddit.com/r/{sub}/search.json?q={q}&limit=25&sort=relevance"
                try:
                    res = requests.get(url, headers=headers)
                    if res.status_code == 200:
                        data = res.json()
                        posts = data.get('data', {}).get('children', [])
                        for p in posts:
                            post_data = p['data']
                            unified_reviews.append(ReviewModel(
                                source="reddit",
                                source_id=f"reddit_{post_data['id']}",
                                author=post_data['author'],
                                content=f"{post_data['title']} {post_data.get('selftext', '')}".strip(),
                                rating=None,
                                timestamp=datetime.utcfromtimestamp(post_data['created_utc']),
                                metadata=ReviewMetadata(subreddit=sub)
                            ))
                except Exception as e:
                    print(f"Error fetching from Reddit {sub}: {e}")
                time.sleep(1) # Polite delay
                
        print(f"Successfully fetched {len(unified_reviews)} reviews from Reddit.")
        return unified_reviews[:limit]
