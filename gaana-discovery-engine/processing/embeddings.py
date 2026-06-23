from sentence_transformers import SentenceTransformer
import os
from dotenv import load_dotenv

load_dotenv(dotenv_path="../.env")

class EmbeddingGenerator:
    """Generates embeddings for reviews using sentence-transformers."""
    
    def __init__(self):
        # Use all-MiniLM-L6-v2 for fast, efficient embeddings (384 dimensions)
        print("Loading sentence-transformers model (all-MiniLM-L6-v2)...")
        self.model = SentenceTransformer('all-MiniLM-L6-v2')
        print("✅ Embedding model loaded")
    
    def generate_embedding(self, text: str) -> list:
        """Generate embedding vector for a single text."""
        if not text or len(text.strip()) < 10:
            return None
        return self.model.encode(text, convert_to_numpy=True).tolist()
    
    def generate_batch_embeddings(self, texts: list) -> list:
        """Generate embeddings for multiple texts efficiently."""
        if not texts:
            return []
        return self.model.encode(texts, convert_to_numpy=True).tolist()
