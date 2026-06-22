import os
from pinecone import Pinecone
from dotenv import load_dotenv

load_dotenv(dotenv_path="../.env")

class VectorDBManager:
    """Handles semantic search using Pinecone Vector Database."""
    def __init__(self):
        self.api_key = os.getenv("PINECONE_API_KEY")
        self.index_name = os.getenv("PINECONE_INDEX_NAME", "gaana-reviews-index")
        
        if self.api_key and self.api_key != "your_pinecone_api_key_here":
            self.pc = Pinecone(api_key=self.api_key)
            self.index = self.pc.Index(self.index_name)
        else:
            self.index = None

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
        
        # Real implementation would embed the query_text here and call self.index.query()
        return []
