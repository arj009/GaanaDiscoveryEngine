import json
import os
import sys
from dotenv import load_dotenv

# Add parent directory to path to import from api
sys.path.append(os.path.join(os.path.dirname(__file__), "..", "api"))
from vector_store import VectorDBManager

load_dotenv(dotenv_path="../.env")

def index_reviews_to_pinecone():
    """Load enriched reviews and upload embeddings to Pinecone."""
    print("=== Indexing Reviews to Pinecone ===")
    
    # Load enriched reviews
    enriched_file = os.path.join(os.path.dirname(__file__), "enriched_reviews.json")
    if not os.path.exists(enriched_file):
        print(f"Error: {enriched_file} not found. Run processing pipeline first.")
        return
    
    with open(enriched_file, 'r', encoding='utf-8') as f:
        reviews = json.load(f)
    
    print(f"Loaded {len(reviews)} enriched reviews")
    
    # Initialize Pinecone
    vector_db = VectorDBManager()
    
    # Upload to Pinecone
    vector_db.upsert_reviews(reviews)
    
    print("=== Indexing Complete ===")

if __name__ == "__main__":
    index_reviews_to_pinecone()
