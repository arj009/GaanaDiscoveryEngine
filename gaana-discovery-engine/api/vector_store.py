import os
from pinecone import Pinecone
from dotenv import load_dotenv
import uuid

load_dotenv()

class VectorDBManager:
    """Handles semantic search using Pinecone Vector Database."""
    def __init__(self):
        self.api_key = os.getenv("PINECONE_API_KEY")
        self.index_name = os.getenv("PINECONE_INDEX_NAME", "gaana-reviews-index")
        self.embedding_dim = 384  # all-MiniLM-L6-v2 produces 384-dimensional embeddings
        self.embedding_model = None  # Lazy load only when needed
        
        if self.api_key and self.api_key != "your_pinecone_api_key_here":
            self.pc = Pinecone(api_key=self.api_key)
            
            # Create index if it doesn't exist
            existing_indexes = [idx.name for idx in self.pc.list_indexes()]
            if self.index_name not in existing_indexes:
                print(f"Creating Pinecone index '{self.index_name}'...")
                self.pc.create_index(
                    name=self.index_name,
                    dimension=self.embedding_dim,
                    metric="cosine",
                    spec={"serverless": {"cloud": "aws", "region": "us-east-1"}}
                )
                print(f"✅ Index '{self.index_name}' created")
            
            self.index = self.pc.Index(self.index_name)
            print("✅ Pinecone vector database initialized")
        else:
            self.index = None
            print("⚠️  No PINECONE_API_KEY found — using simulated vector search")
    
    def _get_embedding_model(self):
        """Lazy load the embedding model only when needed."""
        if self.embedding_model is None:
            from sentence_transformers import SentenceTransformer
            print("Loading sentence-transformers model...")
            self.embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
            print("✅ Embedding model loaded")
        return self.embedding_model

    def upsert_reviews(self, reviews: list):
        """Upload review embeddings to Pinecone."""
        if not self.index:
            print("Skipping Pinecone upsert: No API key configured")
            return
        
        vectors_to_upsert = []
        for review in reviews:
            if review.get("embedding"):
                vectors_to_upsert.append({
                    "id": review.get("source_id", str(uuid.uuid4())),
                    "values": review["embedding"],
                    "metadata": {
                        "source": review.get("source"),
                        "content": review.get("content", "")[:500],  # Truncate for metadata
                        "sentiment": review.get("sentiment"),
                        "user_segment": review.get("user_segment")
                    }
                })
        
        if vectors_to_upsert:
            # Batch upsert in chunks of 100
            for i in range(0, len(vectors_to_upsert), 100):
                batch = vectors_to_upsert[i:i+100]
                self.index.upsert(vectors=batch)
            print(f"✅ Uploaded {len(vectors_to_upsert)} reviews to Pinecone")

    def search_similar(self, query_text: str, top_k: int = 5):
        if not self.index:
            # Simulated return if Pinecone API key is not provided yet
            return [
                {
                    "score": 0.95,
                    "text": "Simulated match: I am tired of the repetitive algorithm playing the same songs.",
                    "metadata": {"source": "play_store"}
                },
                {
                    "score": 0.88,
                    "text": "Simulated match: The app keeps looping my old playlists. Needs better discovery.",
                    "metadata": {"source": "reddit"}
                }
            ]
        
        # Get embedding model (lazy loaded)
        model = self._get_embedding_model()
        
        # Generate embedding for query
        query_embedding = model.encode(query_text, convert_to_numpy=True).tolist()
        
        # Search Pinecone
        results = self.index.query(
            vector=query_embedding,
            top_k=top_k,
            include_metadata=True
        )
        
        # Format results
        formatted_results = []
        for match in results.matches:
            formatted_results.append({
                "score": match.score,
                "text": match.metadata.get("content", ""),
                "metadata": {
                    "source": match.metadata.get("source"),
                    "sentiment": match.metadata.get("sentiment"),
                    "user_segment": match.metadata.get("user_segment")
                }
            })
        
        return formatted_results
