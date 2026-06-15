from typing import Any, Dict, List
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from pydantic import BaseModel, Field
from app.core.config import settings

class ExperienceItem(BaseModel):
    company: str = Field(description="Company name, or Project Name if it's a project")
    role: str = Field(description="Job title, or your role in the project")
    duration: str
    description: str

class ExtractionOutput(BaseModel):
    name: str = Field(description="Candidate's full name")
    cgpa: float = Field(description="Cumulative Grade Point Average out of 10.0")
    skills: List[str] = Field(description="Top 5-10 technical skills")
    pors: List[str] = Field(description="Positions of Responsibility, leadership roles, or society titles")
    experience: List[ExperienceItem] = Field(description="List of past internships, work experience, AND major academic/personal projects")

def extract_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """Agent 1: Extracts structured data from raw resume text."""
    print("--- NODE 1: EXTRACTION ---")
    resume_text = state["resume_text"]
    
    if not settings.GEMINI_API_KEY or settings.GEMINI_API_KEY == "your-gemini-key-here" or settings.GEMINI_API_KEY == "mock-key":
        print("WARN: No GEMINI_API_KEY. Using mock extraction.")
        return {"structured_data": {"name": "Mock Student", "cgpa": 8.5, "skills": ["Python", "React"], "pors": ["Gymkhana", "Tech Club"], "experience": [{"company": "Tech Corp", "role": "Intern", "duration": "2 months", "description": "Developed things"}]}}
        
    llm = ChatGoogleGenerativeAI(model="gemini-2.5-pro", temperature=0, google_api_key=settings.GEMINI_API_KEY)
    parser = JsonOutputParser(pydantic_object=ExtractionOutput)
    
    prompt = PromptTemplate(
        template="Extract the candidate's Name, CGPA, Technical Skills, Positions of Responsibility (PORs), and detailed Experience (Internships, Work, and Major Projects) from this resume text:\n{text}\n\n{format_instructions}",
        input_variables=["text"],
        partial_variables={"format_instructions": parser.get_format_instructions()}
    )
    
    chain = prompt | llm | parser
    
    try:
        response = chain.invoke({"text": resume_text})
        return {"structured_data": response}
    except Exception as e:
        print(f"Extraction Error: {e}")
        # Fallback to prevent pipeline crash
        return {"structured_data": {"name": "Unknown [Fallback]", "cgpa": 0.0, "skills": [], "pors": [], "experience": []}}
