from sqlalchemy import Column, String, Integer, Float, DateTime, JSON, Text
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime
from database import Base

class Review(Base):
    __tablename__ = "reviews"

    # For SQLite compatibility in testing, we use String for UUID
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    source = Column(String(20), nullable=False)
    source_id = Column(String(255), unique=True)
    author = Column(String(255))
    content = Column(Text, nullable=False)
    rating = Column(Integer, nullable=True)
    language = Column(String(5))
    timestamp = Column(DateTime)
    ingested_at = Column(DateTime, default=datetime.utcnow)
    
    # AI-enriched fields
    sentiment = Column(String(10))
    sentiment_score = Column(Float)
    user_segment = Column(String(50))
    
    # LLM extraction
    llm_insights = Column(JSON, nullable=True)
