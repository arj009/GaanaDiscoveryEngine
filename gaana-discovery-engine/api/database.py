import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

load_dotenv(dotenv_path="../.env")

POSTGRES_USER = os.getenv("POSTGRES_USER", "gaana_user")
POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD", "gaana_pass")
POSTGRES_DB = os.getenv("POSTGRES_DB", "gaana_discovery")
POSTGRES_HOST = os.getenv("POSTGRES_HOST", "localhost")
POSTGRES_PORT = os.getenv("POSTGRES_PORT", "5432")

SQLALCHEMY_DATABASE_URL = f"postgresql://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_HOST}:{POSTGRES_PORT}/{POSTGRES_DB}"

# To avoid crashes during testing if Docker Postgres isn't running yet, we use a fallback SQLite DB for rapid development testing.
try:
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
    # Test connection
    with engine.connect() as conn:
        pass
except Exception:
    print("WARNING: PostgreSQL not reachable. Falling back to local SQLite database for Phase 4 testing.")
    SQLALCHEMY_DATABASE_URL = "sqlite:///./gaana_test.db"
    engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
