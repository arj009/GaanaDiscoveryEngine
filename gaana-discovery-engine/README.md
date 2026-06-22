# Gaana Discovery Engine

This repository contains the AI-Powered Review Discovery Engine for Gaana.

## Monorepo Structure

- `/ingestion`: Scrapers and API connectors for App Store, Play Store, Reddit, etc.
- `/processing`: NLP and LLM pipelines (sentiment, topic modeling, intent extraction).
- `/api`: FastAPI backend and database layer.
- `/dashboard`: React frontend dashboard.
- `/infra`: Infrastructure and deployment configurations.

## Getting Started

1. Copy `.env.example` to `.env` and fill in your API keys.
2. Run databases locally using Docker:
   ```bash
   docker-compose up -d
   ```
