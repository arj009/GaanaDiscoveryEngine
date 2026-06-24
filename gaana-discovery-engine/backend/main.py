from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import json
import os
from groq import Groq
from dotenv import load_dotenv

# Load environment variables from the parent directory
load_dotenv(dotenv_path='../.env')

app = FastAPI(title="Gaana AI Discovery Engine API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Groq client
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

class NLQRequest(BaseModel):
    query: str

@app.get("/api/insights")
def get_insights():
    try:
        with open('../data/aggregated_insights.json', 'r', encoding='utf-8') as f:
            aggregated = json.load(f)
        with open('../data/unmet_needs.json', 'r', encoding='utf-8') as f:
            needs = json.load(f)
        with open('../data/reviews_classified.json', 'r', encoding='utf-8') as f:
            classified = json.load(f)
            
        return {
            "aggregated": aggregated,
            "unmetNeeds": needs,
            "classifiedReviews": classified
        }
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Data files not found. Run the classification pipeline first.")

@app.post("/api/nlq")
def ask_question(request: NLQRequest):
    try:
        with open('../data/aggregated_insights.json', 'r', encoding='utf-8') as f:
            context = f.read()
            
        prompt = f"""
You are the AI assistant for Gaana's Discovery Engine dashboard.
Using ONLY the following pre-calculated JSON insights data:
{context}

Answer the user's question concisely and professionally. Do not use markdown blocks or preamble.

User Question: {request.query}
"""
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2
        )
        return {"answer": response.choices[0].message.content.strip()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
