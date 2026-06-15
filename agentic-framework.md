In the technical document provided, the **Agentic Framework** is the core of the **Intelligence Layer (Section 4)** and is orchestrated by **LangGraph**. 

To make it explicitly clear, an "Agentic Framework" differs from a standard script because it uses LLMs as **autonomous decision-makers** that maintain memory (State), use tools, reflect on their own work, and collaborate with other specialized agents.

Here is exactly where and how the Agentic Framework operates in this project:

---

### 1. The Multi-Agent Orchestration (LangGraph)
Instead of passing the entire resume to ChatGPT and asking for a score, we create a **Directed Acyclic Graph (DAG)** where specialized LLM "Agents" handle specific tasks, pass their findings to the next agent, and even check each other's work.

Here are the specific agents in the framework:

#### Agent 1: The Extraction Agent (Perception)
*   **Role:** To read unstructured PDF/LaTeX text and convert it into a structured psychological map of the candidate.
*   **Agentic Behavior:** It doesn't just copy-paste; it infers context. If a student says "Led a team of 50 to raise 5 Lakhs for Spring Fest," the agent understands this as high-tier leadership, not just a line of text.

#### Agent 2: The Fact-Checker Agent (Reflection)
*   **Role:** To look at the output of Agent 1 and the original resume to find hallucinations or errors.
*   **Agentic Behavior (Self-Reflection):** This agent is prompted to be critical. It looks for overlapping dates (e.g., a student claiming to do a full-time in-person internship in Bangalore while also attending classes in Kharagpur) and flags it. 

#### Agent 3: The Domain Specialist Agent (Scoring)
*   **Role:** This agent possesses specialized "knowledge" about IIT KGP.
*   **Agentic Behavior (Heuristic Decision Making):** It acts like a human Placement Coordinator. It looks at a student's branch, CGPA, and PORs, and applies weightage. It decides whether a specific achievement is "Gold standard" or just average.

#### Agent 4: The Strategy Agent (Comparison)
*   **Role:** To compare Candidate A's extracted profile against the Job Description.
*   **Agentic Behavior (Gap Analysis):** It deduces what the student *didn't* say. If the JD requires "Docker" and the student lists "AWS and Kubernetes," the agent infers that while they haven't listed Docker, they understand containerization, and lists it as a "Probable Match."

---

### 2. The Shared State (Memory)
An agentic framework requires a **State Object** (Short-term memory). In this project, the state flows through the graph like this:

```python
class KGPGraphState(TypedDict):
    resume_text: str             # Raw Input
    structured_data: dict        # Written by Agent 1
    validated_data: dict         # Corrected by Agent 2
    kgp_scores: dict             # Calculated by Agent 3
    final_report: dict           # Synthesized by Agent 4
```
Each agent reads from the state, performs its autonomous task, and writes its findings back to the state for the next agent to use.

---

### 3. Agentic Routing (Conditional Edges)
A standard program goes from Step A to Step B. An agentic framework uses LLMs to decide where to go next based on the data.

**Example of Agentic Routing in this project:**
1.  **Agent 1** extracts the CGPA.
2.  A **Conditional Router** checks: Is the CGPA < 6.0?
    *   **If Yes:** Route to `Rejection_Node` (Saves cost by stopping the graph early).
    *   **If No:** Route to `Agent 2 (Fact-Checker)` for deep analysis.

### Summary
The **Agentic Framework** is the combination of **LangGraph's state graph** and **specialized LLM prompts** acting as autonomous workers (Extraction, Validation, KGP-Scoring, and Comparison). It is what allows the system to analyze 1,000 resumes with the nuance of a human recruiter instead of a rigid keyword scanner.