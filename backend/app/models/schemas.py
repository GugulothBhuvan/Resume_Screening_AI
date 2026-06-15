from pydantic import BaseModel
from typing import List, Optional, Dict

class JobUploadResponse(BaseModel):
    job_id: str
    message: str

class ExperienceItem(BaseModel):
    company: str
    role: str
    duration: str
    description: str

class ExperienceAnalysisItem(BaseModel):
    company: str
    role: str
    fit_score: float
    analysis: str

class SkillGap(BaseModel):
    missing_skills: List[str]
    transferable_skills: List[str]

class CandidateReport(BaseModel):
    id: str
    name: str
    branch: str
    cgpa: float
    match_score: float
    leadership_score: float
    skills: List[str]
    experience: Optional[List[ExperienceItem]] = []
    overall_analysis: str = ""
    skill_gaps: SkillGap
    experience_analysis: Optional[List[ExperienceAnalysisItem]] = []
