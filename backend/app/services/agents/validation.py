from typing import Any, Dict

def validation_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """Agent 2: Fact-checks the extracted data against the raw text."""
    print("--- NODE 2: FACT CHECKING / VALIDATION ---")
    data = state["structured_data"]
    
    # Mock logic: Check if dates overlap. We'll assume it's valid for MVP.
    data["is_valid"] = True
    data["flags"] = []
    
    return {"validated_data": data}
