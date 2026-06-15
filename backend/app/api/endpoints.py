from fastapi import APIRouter, File, UploadFile, Form, HTTPException
from fastapi.responses import FileResponse, HTMLResponse
from typing import Optional
import uuid
import shutil
import os
import csv
import io
from collections import Counter
from fastapi import Depends
from sqlalchemy.orm import Session
from app.models.schemas import JobUploadResponse, CandidateReport
from app.utils.pdf_parser import extract_text_from_pdf
from app.models.database import SessionLocal, DBReport
from app.worker import process_candidate_resume

router = APIRouter()

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# In-memory store for MVP (since we are postponing full DB integration)
MOCK_REPORTS = {}

@router.post("/jobs/upload", response_model=JobUploadResponse)
async def upload_job(
    job_description: str = Form(...),
    resume_file: UploadFile = File(...)
):
    """
    Accepts a Job Description and a PDF Resume.
    For MVP, we process synchronously.
    """
    if not resume_file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
    
    job_id = str(uuid.uuid4())
    candidate_id = str(uuid.uuid4())
    
    # Save the file temporarily
    temp_dir = f"./temp"
    os.makedirs(temp_dir, exist_ok=True)
    file_path = f"{temp_dir}/{candidate_id}.pdf"
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(resume_file.file, buffer)
        
    # Extract text from the PDF
    resume_text = extract_text_from_pdf(file_path)
    if not resume_text.strip():
        raise HTTPException(status_code=400, detail="Could not extract text from PDF.")
    
    # Pre-create candidate record
    db = next(get_db())
    new_report = DBReport(id=candidate_id, job_id=job_id, status="processing")
    db.add(new_report)
    db.commit()
    
    # Dispatch Async Celery Task
    process_candidate_resume.delay(job_id, candidate_id, job_description, resume_text)
    
    return JobUploadResponse(job_id=job_id, message=f"Upload successful. Candidate ID: {candidate_id} added to processing queue.")

@router.get("/candidates/{candidate_id}")
async def get_candidate(candidate_id: str, db: Session = Depends(get_db)):
    """
    Retrieves the generated candidate report from DB.
    """
    report = db.query(DBReport).filter(DBReport.id == candidate_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Candidate not found.")
        
    if report.status == "processing":
        return {"status": "processing", "message": "Candidate evaluation is still in progress."}
    
    if report.status == "failed":
        return {"status": "failed", "message": "An error occurred during processing."}
        
    return report

@router.get("/candidates/{candidate_id}/resume")
async def get_candidate_resume(candidate_id: str):
    """
    Returns the raw PDF resume for the given candidate side-by-side view.
    """
    file_path = f"./temp/{candidate_id}.pdf"
    if os.path.exists(file_path):
        return FileResponse(file_path, media_type="application/pdf")
        
    return HTMLResponse(
        content="""
        <div style="display:flex; justify-content:center; align-items:center; height:100%; font-family:sans-serif; color:#666; background:#f9fafb; padding: 20px; text-align: center;">
            <div>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-bottom:16px;">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
                <h3>No PDF Document Available</h3>
                <p>This candidate was uploaded sequentially via CSV batch text. Original PDF formatting is unavailable.</p>
            </div>
        </div>
        """,
        status_code=200
    )

@router.post("/jobs/upload-csv")
async def upload_csv(
    job_description: str = Form(...),
    csv_file: UploadFile = File(...)
):
    """
    Accepts a single CSV file with candidates and queues batch processing.
    Assumed CSV format: name, branch, cgpa, resume_text
    """
    if not csv_file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Must be a .csv file")
        
    job_id = str(uuid.uuid4())
    content = await csv_file.read()
    decoded = content.decode('utf-8')
    reader = csv.DictReader(io.StringIO(decoded))
    
    db = next(get_db())
    count = 0
    
    for row in reader:
        # Require resume_text at bare minimum
        if 'resume_text' not in row or not row['resume_text'].strip():
            continue
            
        candidate_id = str(uuid.uuid4())
        new_report = DBReport(
            id=candidate_id, 
            job_id=job_id, 
            name=row.get('name', 'Unknown'),
            branch=row.get('branch', 'Unknown'),
            cgpa=float(row.get('cgpa', 0.0)) if row.get('cgpa') else 0.0,
            status="processing"
        )
        db.add(new_report)
        
        # Dispatch Celery task
        # We pass the row's resume_text to run through the AI
        process_candidate_resume.delay(job_id, candidate_id, job_description, row['resume_text'])
        count += 1
        
    db.commit()
    
    if count == 0:
        raise HTTPException(status_code=400, detail="The uploaded CSV must contain a valid 'resume_text' column, and it cannot be empty.")
    
    return {"job_id": job_id, "message": f"Successfully queued {count} candidates for batch processing."}

@router.get("/analytics/batch/{job_id}")
async def get_batch_analytics(job_id: str, db: Session = Depends(get_db)):
    """
    Aggregates batch analytics for a given Job ID.
    """
    candidates = db.query(DBReport).filter(DBReport.job_id == job_id).all()
    if not candidates:
        raise HTTPException(status_code=404, detail="No candidates found for this Job ID.")
        
    completed = [c for c in candidates if c.status == "completed"]
    total = len(candidates)
    
    if len(completed) == 0:
        return {
            "status": "processing", 
            "progress": f"0/{total}",
            "message": "All candidates are still processing."
        }
        
    # Aggregate stats
    avg_cgpa = sum(c.cgpa for c in completed if c.cgpa) / len(completed)
    avg_match = sum(c.match_score for c in completed if c.match_score) / len(completed)
    
    # Missing Skills Frequency map
    missing_skills_counter = Counter()
    branch_counter = Counter()
    
    for c in completed:
        branch_counter[c.branch] += 1
        if c.skill_gaps and isinstance(c.skill_gaps, dict):
            missing = c.skill_gaps.get("missing_skills", [])
            for skill in missing:
                missing_skills_counter[skill] += 1
                
    top_missing_skills = [{"skill": k, "count": v} for k, v in missing_skills_counter.most_common(5)]
    branch_distribution = [{"branch": k, "count": v} for k, v in branch_counter.items()]
    
    return {
        "status": "completed" if len(completed) == total else "processing",
        "progress": f"{len(completed)}/{total}",
        "avg_cgpa": round(avg_cgpa, 2),
        "avg_match_score": round(avg_match, 2),
        "top_missing_skills": top_missing_skills,
        "branch_distribution": branch_distribution,
        "candidates": completed
    }
