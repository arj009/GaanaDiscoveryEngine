import json
import os
import sys
from datetime import datetime
from dotenv import load_dotenv

# Add parent directory to path to import from api
sys.path.append(os.path.join(os.path.dirname(__file__), "..", "api"))
from database import SessionLocal, engine
import models

load_dotenv(dotenv_path="../.env")

def store_reviews_to_postgres():
    """Load enriched reviews and store them in PostgreSQL."""
    print("=== Storing Reviews to PostgreSQL ===")
    
    # Load enriched reviews
    enriched_file = os.path.join(os.path.dirname(__file__), "enriched_reviews.json")
    if not os.path.exists(enriched_file):
        print(f"Error: {enriched_file} not found. Run processing pipeline first.")
        return
    
    with open(enriched_file, 'r', encoding='utf-8') as f:
        reviews = json.load(f)
    
    print(f"Loaded {len(reviews)} enriched reviews")
    
    # Create database tables
    models.Base.metadata.create_all(bind=engine)
    
    # Store reviews in PostgreSQL
    db = SessionLocal()
    try:
        stored_count = 0
        for review in reviews:
            # Check if review already exists
            existing = db.query(models.Review).filter(
                models.Review.source_id == review.get("source_id")
            ).first()
            
            if existing:
                continue
            
            # Create new review record
            db_review = models.Review(
                source=review.get("source"),
                source_id=review.get("source_id"),
                author_hash=review.get("author")[:64] if review.get("author") else None,
                content=review.get("content"),
                rating=review.get("rating"),
                language="en",  # We only process English reviews
                review_timestamp=datetime.utcnow(),
                ingested_at=datetime.utcnow(),
                sentiment=review.get("sentiment"),
                sentiment_score=review.get("sentiment_score"),
                primary_topic=review.get("user_segment"),
                user_segment=review.get("user_segment"),
                discovery_relevant=review.get("user_segment") == "Discovery Seeker",
                user_intent=json.dumps(review.get("llm_insights", {})),
                frustration_points=json.dumps(review.get("llm_insights", {}).get("frustration_points", [])),
                unmet_needs=json.dumps(review.get("llm_insights", {}).get("unmet_needs", [])),
                discovery_insights=json.dumps(review.get("llm_insights", {}))
            )
            
            db.add(db_review)
            stored_count += 1
        
        db.commit()
        print(f"✅ Stored {stored_count} reviews in PostgreSQL")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error storing reviews: {e}")
    finally:
        db.close()
    
    print("=== Storage Complete ===")

if __name__ == "__main__":
    store_reviews_to_postgres()
