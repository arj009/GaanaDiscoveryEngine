import uuid
from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field

class ReviewMetadata(BaseModel):
    app_version: Optional[str] = None
    device: Optional[str] = None
    os_version: Optional[str] = None
    subreddit: Optional[str] = None
    thread_id: Optional[str] = None

class ReviewModel(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    source: str # "play_store", "app_store", "reddit", "forum", "twitter"
    source_id: str
    author: str
    content: str
    rating: Optional[int] = None # 1 to 5, None if not applicable (like Reddit)
    language: str = "en"
    timestamp: datetime
    metadata: ReviewMetadata = Field(default_factory=ReviewMetadata)
    ingested_at: datetime = Field(default_factory=datetime.utcnow)
    processing_status: str = "pending"

    class Config:
        json_schema_extra = {
            "example": {
                "source": "play_store",
                "source_id": "gp-123456",
                "author": "anon_user1",
                "content": "Love the app but the recommendations are repetitive.",
                "rating": 4,
                "timestamp": "2026-06-20T14:30:00Z"
            }
        }
