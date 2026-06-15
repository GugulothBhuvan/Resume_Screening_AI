from typing import TypedDict, Dict, Any, List
from langgraph.graph import StateGraph, END
from app.services.agents.extraction import extract_node
from app.services.agents.validation import validation_node
from app.services.agents.scoring import scoring_node
from app.services.agents.strategy import strategy_node

# 1. Define the State
class KGPGraphState(TypedDict):
    resume_text: str             # Raw Input
    job_description: str         # The target JD
    structured_data: Dict[str, Any] # Written by Agent 1
    validated_data: Dict[str, Any]  # Corrected by Agent 2
    kgp_scores: Dict[str, float]    # Calculated by Agent 3
    final_report: Dict[str, Any]    # Synthesized by Agent 4

# 2. Define the Graph
def create_graph() -> StateGraph:
    workflow = StateGraph(KGPGraphState)
    
    # Add Nodes
    workflow.add_node("extraction", extract_node)
    workflow.add_node("validation", validation_node)
    workflow.add_node("scoring", scoring_node)
    workflow.add_node("strategy", strategy_node)
    
    # Add Edges (Simple Sequential for MVP. Add conditional routing later in Phase 2)
    workflow.set_entry_point("extraction")
    workflow.add_edge("extraction", "validation")
    workflow.add_edge("validation", "scoring")
    workflow.add_edge("scoring", "strategy")
    workflow.add_edge("strategy", END)
    
    return workflow.compile()

# Global compiled graph instance
app_workflow = create_graph()

def run_pipeline(resume_text: str, jd: str) -> Dict[str, Any]:
    """Runs the LangGraph pipeline synchronously."""
    initial_state = KGPGraphState(
        resume_text=resume_text,
        job_description=jd,
        structured_data={},
        validated_data={},
        kgp_scores={},
        final_report={}
    )
    
    # LangGraph execute
    final_state = app_workflow.invoke(initial_state)
    return final_state["final_report"]
