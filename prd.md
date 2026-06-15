# Technical Design Document: KGP-ScholarScreen AI
**Project Title:** Distributed Agentic Pipeline for Campus Recruitment Intelligence  
**Version:** 1.0  
**Target Institution:** IIT Kharagpur (CDC/Placement Cell Context)  
**Scale:** 1,000+ Candidates per Job Description  

---

## 1. Executive Summary
**KGP-ScholarScreen AI** is a full-stack, agentic system designed to automate the evaluation of massive resume pools. It leverages **LangGraph** for multi-agent reasoning and a **Tiered Funnel Architecture** to process 1,000+ resumes cost-effectively. The system provides two-way value: **Individual Talent Reports** (for deep-dive interviews) and **Batch Market Intelligence** (for high-level recruitment strategy).

---

## 2. System Architecture
The system is built on a decoupled, asynchronous microservices architecture.

### 2.1 High-Level Component Diagram
1.  **Client Layer:** Next.js Dashboard (Recruiter/PlaceCom UI).
2.  **API Layer:** FastAPI Gateway (Request handling, Auth, File streaming).
3.  **Task Layer:** Celery + Redis (Asynchronous orchestration of 1,000+ parallel tasks).
4.  **Intelligence Layer:** LangGraph (Multi-agent orchestration).
5.  **Data Layer:** 
    *   **PostgreSQL:** Relational metadata and report storage.
    *   **ChromaDB:** Vector storage for semantic search and L0 filtering.
    *   **S3/MinIO:** Raw PDF storage.

---

## 3. The Processing Funnel (Scaling Strategy)
Processing 1,000 resumes through expensive LLMs is inefficient. We use a **Tiered Funnel**:

*   **Tier 0 (Semantic Filtering - 100% of Pool):** Uses Vector Embeddings (Cosine Similarity) to rank the 1,000 resumes against the JD. The bottom 30% are flagged as "Low Fit" instantly.
*   **Tier 1 (Fast Metadata Extraction - Top 700):** Uses `gpt-4o-mini` via the **OpenAI Batch API** to extract CGPA, Branch, and Skills.
*   **Tier 2 (Agentic Deep Reasoning - Top 200):** Resumes enter the full LangGraph workflow for specialized scoring (PORs, Math validation, Gap analysis).

---

## 4. Agentic Intelligence Layer (LangGraph Design)
The core logic follows a **Map-Reduce Pattern**.

### 4.1 Candidate Map Nodes (Individual Insights)
Each candidate in the Tier 2 pool is processed by a parallel DAG (Directed Acyclic Graph):

1.  **The CDC Parser Node:** Maps unstructured LaTeX/PDF text to KGP-specific fields (Education, Internships, Projects, PORs).
2.  **The KGP-Prestige Node:** 
    *   **POR Logic:** Evaluates Gymkhana/Fest hierarchy (e.g., G-Sec vs. Sub-section head).
    *   **Competition Logic:** Recognizes Inter-IIT Tech Meet, GSoC, and Departmental awards.
3.  **The Experience Math Node:** Validates professional months. It handles overlapping "Remote Internships" during semesters to provide a "True Experience" metric.
4.  **The Individual Gap Node:** Compares candidate skills against the JD to generate 3 targeted "Technical Interview Questions."

### 4.2 The Batch Reducer Node (Aggregate Insights)
Once all Map nodes finish, a **Summary Agent** consumes the collective data to generate:
*   **Skill Density Heatmap:** What skills are missing across the *entire* pool?
*   **Departmental Analytics:** Which KGP branches are most represented?
*   **Hidden Gem Identification:** Candidates with lower CGPA but exceptional project/leadership scores.

---

## 5. Backend Specification (Python/FastAPI)

### 5.1 Technology Stack
*   **Framework:** FastAPI (Asynchronous).
*   **Orchestration:** LangGraph / LangChain.
*   **Worker:** Celery (Distributed task execution).
*   **Broker:** Redis.

### 5.2 Core API Endpoints
*   `POST /api/v1/jobs/upload`: Accepts JD + ZIP of resumes. Returns `job_id`.
*   `GET /api/v1/jobs/{job_id}/status`: Real-time progress (e.g., "450/1000 processed").
*   `GET /api/v1/analytics/batch/{job_id}`: Returns JSON for dashboard charts.
*   `GET /api/v1/candidates/{candidate_id}`: Returns the full AI-generated individual profile.

---

## 6. Frontend Specification (Next.js/React)

### 6.1 UI Modules
*   **Ingestion Wizard:** Drag-and-drop interface for 1,000+ files with progress bars.
*   **Batch Intelligence Dashboard:**
    *   **Radar Charts:** Visualizing the "Batch Fit."
    *   **Interactive Table:** Sortable by CGPA, KGP-Rank, and AI Match Score.
*   **Candidate Profile View:**
    *   AI-generated summary.
    *   Skill match/gap visualization.
    *   Automated interview questions.

### 6.2 State Management
*   **TanStack Query:** For caching and syncing backend analytics.
*   **Zustand:** For managing UI states (filters, selection).

---

## 7. Database & Data Models

### 7.1 PostgreSQL Schema
```sql
CREATE TABLE candidate_reports (
    id UUID PRIMARY KEY,
    job_id UUID REFERENCES jobs(id),
    name TEXT,
    branch TEXT,
    cgpa FLOAT,
    match_score FLOAT,
    leadership_score FLOAT,
    individual_insights JSONB, -- Stores Strengths, Gaps, and Questions
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE batch_analytics (
    job_id UUID PRIMARY KEY,
    avg_cgpa FLOAT,
    top_missing_skills TEXT[],
    dept_distribution JSONB
);
```

---

## 8. Deployment & Infrastructure

### 8.1 Scalability Measures
*   **Concurrency Control:** Celery workers are configured with a `concurrency_limit` to prevent hitting LLM Rate Limits (RPM/TPM).
*   **Caching:** Redis stores intermediate extraction results so that if a batch job is interrupted, it resumes from the last processed candidate.
*   **OpenAI Batch API:** Used for non-critical Tier 1 processing to reduce costs by 50% and bypass real-time rate limits.

### 8.2 Security
*   **Data Residency:** Resumes are processed in an isolated environment.
*   **Compliance:** Post-placement data deletion script to comply with student privacy requirements.

---

## 9. Implementation Roadmap
1.  **Phase 1 (MVP):** Build the FastAPI/LangGraph core with 10-resume support.
2.  **Phase 2 (Scaling):** Integrate Celery/Redis and the Tiered Funnel (Vector Search + Batch API).
3.  **Phase 3 (Domain Logic):** Implement the "KGP-Prestige Node" for PORs and Academics.
4.  **Phase 4 (Frontend):** Build the Next.js Recruiter Dashboard and Batch Analytics view.
5.  **Phase 5 (UAT):** Test with 1,000+ historic KGP resumes to validate accuracy.