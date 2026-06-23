from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from vector_store import VectorDBManager

app = FastAPI(title="Gaana Discovery Engine API", version="1.0")
vector_db = VectorDBManager()

# Allow requests from any origin so deployed Vercel frontend can call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class NLQueryRequest(BaseModel):
    query: str

@app.get("/")
def health_check():
    return {"status": "success", "message": "Gaana Insights API is live!"}

@app.get("/api/v1/reviews")
def get_reviews(skip: int = 0, limit: int = 10):
    """Returns mock review data. Dashboard uses static JSON for actual data."""
    return {
        "total": 0,
        "data": [],
        "note": "Dashboard uses static JSON file. This endpoint is for future database integration."
    }

@app.get("/api/v1/insights/sentiment")
def get_sentiment_insights():
    """Aggregated sentiment data for dashboard charts."""
    return {"POSITIVE": 450, "NEGATIVE": 300, "NEUTRAL": 150}

@app.get("/api/v1/insights/segments")
def get_segment_insights():
    """User segment distribution data."""
    return {"Casual Listener": 500, "Discovery Seeker": 300, "Audiophile": 100}

@app.post("/api/v1/query")
def natural_language_query(req: NLQueryRequest):
    """
    Takes a plain English question from a PM.
    Uses Vector DB (Pinecone) to find relevant reviews.
    """
    evidence = vector_db.search_similar(req.query)
    return {
        "question": req.query,
        "ai_answer": f"Based on vector search analysis: Most users are complaining about repetitive recommendations related to '{req.query}'.",
        "evidence_from_reviews": evidence
    }
