from app.core.celery_app import celery_app
from app.services.langgraph_pipeline import run_pipeline
from app.services.vector_store import vector_store
from app.models.database import SessionLocal, DBReport
import traceback

@celery_app.task(name="process_candidate_resume")
def process_candidate_resume(job_id: str, candidate_id: str, jd_text: str, resume_text: str):
    """
    Background task to process the candidate's resume through the Tiered Funnel.
    """
    db = SessionLocal()
    try:
        # TIER 0: Vector Embeddings and Indexing
        vector_store.add_resume(job_id, candidate_id, resume_text)
        tier_0_score = vector_store.calculate_tier_0_score(jd_text, candidate_id)
        
        # In a real system, we'd skip LangGraph here if tier_0_score < Threshold.
        # For Phase 2, we log it and pass it to Phase 2.
        
        # TIER 2: LangGraph Orchestration
        report_data = run_pipeline(resume_text, jd_text)
        
        # Save to Database
        db_report = db.query(DBReport).filter(DBReport.id == candidate_id).first()
        if not db_report:
            db_report = DBReport(id=candidate_id, job_id=job_id)
            db.add(db_report)
            
        db_report.name = report_data.get("name", "Unknown")
        db_report.branch = report_data.get("branch", "Unknown")
        db_report.cgpa = report_data.get("cgpa", 0.0)
        db_report.match_score = report_data.get("match_score", 0.0)
        db_report.leadership_score = report_data.get("leadership_score", 0.0)
        db_report.tier_0_score = tier_0_score
        
        db_report.skills = report_data.get("skills", [])
        db_report.experience = report_data.get("experience", [])
        db_report.overall_analysis = report_data.get("overall_analysis", "")
        db_report.skill_gaps = report_data.get("skill_gaps", {})
        db_report.experience_analysis = report_data.get("experience_analysis", [])
        db_report.status = "completed"
        
        db.commit()
        return f"Candidate {candidate_id} processed successfully."
        
    except Exception as e:
        db.rollback()
        db_report = db.query(DBReport).filter(DBReport.id == candidate_id).first()
        if db_report:
            db_report.status = "failed"
            db.commit()
        print(f"Error processing candidate {candidate_id}: {e}")
        traceback.print_exc()
        return str(e)
    finally:
        db.close()
