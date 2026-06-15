import chromadb
from app.core.config import settings

class VectorStore:
    def __init__(self):
        self.client = chromadb.PersistentClient(path=settings.CHROMA_DB_DIR)
        self.collection = self.client.get_or_create_collection(name="resumes")

    def embed_text(self, text: str) -> list:
        # Mock embedding using a deterministic hash for Phase 2 MVP testing
        # Avoids 2GB local PyTorch installation.
        import hashlib
        num = int(hashlib.md5(text.encode()).hexdigest()[:8], 16)
        # return a 384-dimensional vector like all-MiniLM-L6-v2 normally would
        return [(num % i)/100.0 for i in range(1, 385)]

    def add_resume(self, job_id: str, candidate_id: str, resume_text: str):
        embedding = self.embed_text(resume_text)
        self.collection.upsert(
            embeddings=[embedding],
            documents=[resume_text],
            metadatas=[{"job_id": job_id, "candidate_id": candidate_id}],
            ids=[candidate_id]
        )

    def calculate_tier_0_score(self, jd_text: str, candidate_id: str) -> float:
        """
        Queries Chroma for the similarity of the specific candidate to the JD.
        In this naive MVP, we embed the JD and use it as a query against Chroma 
        to find the candidate's distance. (Realistically, you query the JD against the pool).
        """
        jd_embedding = self.embed_text(jd_text)
        
        # Get Candidate Embedding
        res = self.collection.get(ids=[candidate_id], include=["embeddings"])
        if not res or len(res.get('embeddings', [])) == 0 or res['embeddings'][0] is None:
            return 0.0
            
        candidate_emb = res['embeddings'][0]
        
        # Cosine similarity (simplified dot product since MiniLM embeddings are normalized)
        score = sum(x * y for x, y in zip(jd_embedding, candidate_emb))
        return float(max(0, score) * 100) # Normalize 0-100

vector_store = VectorStore()
