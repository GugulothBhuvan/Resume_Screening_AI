from typing import Any, Dict
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from pydantic import BaseModel, Field
from app.core.config import settings

class ScoringOutput(BaseModel):
    match_score: float = Field(description="Score from 0.0 to 100.0 representing technical and academic fit")
    leadership_score: float = Field(description="Score from 0.0 to 100.0 representing leadership prestige or POR impact")
    reasoning: str = Field(description="Brief 1 sentence reasoning for the scored points")

def scoring_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """Agent 3: Applies KGP-specific heuristic scoring via LLM."""
    print("--- NODE 3: KGP SCORING ---")
    data = state["validated_data"]
    
    if not settings.GEMINI_API_KEY or settings.GEMINI_API_KEY in ["your-gemini-key-here", "mock-key"]:
        match_score = min(data.get("cgpa", 0.0) * 10, 100) # Mock
        leadership_score = 75.0 # Mock standard
        return {"kgp_scores": {"match_score": match_score, "leadership_score": leadership_score}}
        
    llm = ChatGoogleGenerativeAI(model="gemini-2.5-pro", temperature=0, google_api_key=settings.GEMINI_API_KEY)
    parser = JsonOutputParser(pydantic_object=ScoringOutput)
    
    prompt = PromptTemplate(
        template=(
            "You are an expert technical recruiter analyzing an IIT Kharagpur (KGP) student profile.\n"
            "Evaluate their profile to output a match_score and a leadership_score.\n"
            "Academic CGPA (out of 10): {cgpa}\n"
            "Skills: {skills}\n"
            "Positions of Responsibility (PORs): {pors}\n\n"
            "Guidelines for leadership_score:\n"
            "- High Prestige (85-100): Inter-IIT Medals, Gymkhana Core (G-Sec, VP), TechFest core heads.\n"
            "- Medium Prestige (60-84): Departmental Society heads, Hall Council members, sub-heads.\n"
            "- Low/Standard (0-59): General participation or no major PORs.\n\n"
            "Guidelines for match_score:\n"
            "- Base it heavily on their CGPA normalized to 100, bumped slightly if they have many strong skills.\n\n"
            "{format_instructions}"
        ),
        input_variables=["cgpa", "skills", "pors"],
        partial_variables={"format_instructions": parser.get_format_instructions()}
    )
    
    chain = prompt | llm | parser
    
    try:
        response = chain.invoke({
            "cgpa": data.get("cgpa", 0.0),
            "skills": ", ".join(data.get("skills", [])),
            "pors": ", ".join(data.get("pors", [])) if data.get("pors") else "None"
        })
        return {"kgp_scores": {
            "match_score": response["match_score"],
            "leadership_score": response["leadership_score"]
        }}
    except Exception as e:
        print(f"Scoring Error: {e}")
        return {"kgp_scores": {"match_score": 50.0, "leadership_score": 50.0}}

