from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
import models
from database import engine, get_db
from vector_store import VectorDBManager

# Create database tables
models.Base.metadata.create_all(bind=engine)

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
def get_reviews(skip: int = 0, limit: int = 10, db: Session = Depends(get_db)):
    """Fetch structured reviews directly from PostgreSQL."""
    reviews = db.query(models.Review).offset(skip).limit(limit).all()
    return {"total": len(reviews), "data": reviews}

@app.get("/api/v1/insights/sentiment")
def get_sentiment_insights(db: Session = Depends(get_db)):
    """Aggregated sentiment data for dashboard charts."""
    # In production, this runs a SQL GROUP BY query. Mocked for phase 4 baseline.
    return {"POSITIVE": 450, "NEGATIVE": 300, "NEUTRAL": 150}

@app.get("/api/v1/insights/segments")
def get_segment_insights(db: Session = Depends(get_db)):
    """User segment distribution data."""
    return {"Casual Listener": 500, "Discovery Seeker": 300, "Audiophile": 100}

@app.post("/api/v1/query")
def natural_language_query(req: NLQueryRequest):
    """
    Takes a plain English question from a PM.
    Uses Vector DB to find relevant reviews, and LLM to synthesize an answer.
    """
    evidence = vector_db.search_similar(req.query)
    return {
        "question": req.query,
        "ai_answer": f"Simulated Insights based on Vector search: Most users are complaining about repetitive recommendations related to '{req.query}'.",
        "evidence_from_reviews": evidence
    }
