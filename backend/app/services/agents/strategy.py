from typing import Any, Dict, List
import uuid
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from pydantic import BaseModel, Field
from app.core.config import settings

class SkillGaps(BaseModel):
    missing_skills: List[str] = Field(description="List of exact technical skills missing from candidate's profile but required in JD")
    transferable_skills: List[str] = Field(description="Skills the candidate possesses that are similar to missing skills")

class ExperienceAnalysisItem(BaseModel):
    company: str
    role: str
    fit_score: float = Field(description="Score from 0 to 100 on how well this specific role matches the JD")
    analysis: str = Field(description="Brief 2-sentence analysis of this experience against the context of the job description.")

class StrategyOutput(BaseModel):
    skill_gaps: SkillGaps
    experience_analysis: List[ExperienceAnalysisItem]
    overall_analysis: str = Field(
        description="A comprehensive 3-4 sentence overall summary of the candidate's projects, experiences, and general fit for the role."
    )

def strategy_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """Agent 4: Compares profile with JD to generate questions and gap analysis."""
    print("--- NODE 4: STRATEGY & GAP ANALYSIS ---")
    data = state["validated_data"]
    scores = state["kgp_scores"]
    job_desc = state["job_description"]
    
    report_base = {
        "id": str(uuid.uuid4()),
        "name": data.get("name", "Unknown"),
        "branch": data.get("branch", "Unknown"),
        "cgpa": data.get("cgpa", 0.0),
        "match_score": scores.get("match_score", 0.0),
        "leadership_score": scores.get("leadership_score", 0.0),
        "skills": data.get("skills", []),
        "experience": data.get("experience", [])
    }

    if not settings.GEMINI_API_KEY or settings.GEMINI_API_KEY in ["your-gemini-key-here", "mock-key"]:
        report_base["overall_analysis"] = "Candidate possesses strong software engineering fundamentals but lacks specific cloud deployment experience. Previous internships highlight good collaboration and analytical skills."
        report_base["skill_gaps"] = {
            "missing_skills": ["Docker", "Kubernetes"],
            "transferable_skills": ["Linux Admin"]
        }
        report_base["experience_analysis"] = [{"company": "Tech Corp", "role": "Intern", "fit_score": 85.0, "analysis": "Relevant software development."}]
        return {"final_report": report_base}
        
    llm = ChatGoogleGenerativeAI(model="gemini-2.5-pro", temperature=0, google_api_key=settings.GEMINI_API_KEY)
    parser = JsonOutputParser(pydantic_object=StrategyOutput)
    
    prompt = PromptTemplate(
        template=(
            "You are a Senior Technical Recruiter. Compare the Candidate's Profile with the Job Description.\n"
            "Job Description: {jd}\n"
            "Candidate Skills: {skills}\n"
            "Candidate Experience: {experience}\n\n"
            "Identify missing critical skills. Then write a 3-4 sentence comprehensive overall analysis "
            "summarizing their projects, experience and how well they would fit the targeted role.\n"
            "Also, evaluate each of the Candidate's past experiences AND projects from the list, and provide a fit score (0-100) and analysis for each.\n\n"
            "{format_instructions}"
        ),
        input_variables=["jd", "skills", "experience"],
        partial_variables={"format_instructions": parser.get_format_instructions()}
    )
    
    chain = prompt | llm | parser
    
    try:
        response = chain.invoke({
            "jd": job_desc,
            "skills": ", ".join(data.get("skills", [])),
            "experience": data.get("experience", [])
        })
        report_base["skill_gaps"] = response["skill_gaps"]
        report_base["overall_analysis"] = response.get("overall_analysis", "")
        report_base["experience_analysis"] = response.get("experience_analysis", [])
    except Exception as e:
        print(f"Strategy Error: {e}")
        report_base["skill_gaps"] = {"missing_skills": [], "transferable_skills": []}
        report_base["overall_analysis"] = "Unable to generate overall analysis."
        report_base["experience_analysis"] = []
        
    return {"final_report": report_base}
