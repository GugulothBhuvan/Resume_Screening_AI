from sqlalchemy import create_engine, Column, String, Float, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

engine = create_engine(
    settings.DATABASE_URL, connect_args={"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

class DBReport(Base):
    __tablename__ = "candidate_reports"
    
    id = Column(String, primary_key=True, index=True)
    job_id = Column(String, index=True)
    name = Column(String)
    branch = Column(String)
    cgpa = Column(Float)
    match_score = Column(Float)
    leadership_score = Column(Float)
    tier_0_score = Column(Float, nullable=True) # Added for Phase 2
    skills = Column(JSON)
    experience = Column(JSON)
    overall_analysis = Column(String)
    skill_gaps = Column(JSON)
    experience_analysis = Column(JSON)
    status = Column(String, default="processing")

# Create tables for MVP
Base.metadata.create_all(bind=engine)
