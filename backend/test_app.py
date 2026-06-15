import os
import time
import requests
from fpdf import FPDF
import threading
import uvicorn
from app.main import app

def generate_dummy_pdf(filename="dummy_resume.pdf"):
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Arial", size=12)
    pdf.cell(200, 10, txt="John Doe - Software Engineer", ln=1, align="C")
    pdf.cell(200, 10, txt="CGPA: 8.5", ln=2, align="L")
    pdf.cell(200, 10, txt="Skills: Python, FastAPI, React", ln=3, align="L")
    pdf.output(filename)
    return filename

def run_server():
    uvicorn.run(app, host="127.0.0.1", port=8000, log_level="info")

if __name__ == "__main__":
    print("Generating PDF...")
    pdf_path = generate_dummy_pdf()
    
    print("Starting server in background thread...")
    server_thread = threading.Thread(target=run_server, daemon=True)
    server_thread.start()
    
    # Wait for server to start
    time.sleep(3)
    
    print("\nExecuting test upload request...")
    url = "http://127.0.0.1:8000/api/v1/jobs/upload"
    data = {"job_description": "Looking for a Python developer with LangChain experience."}
    
    with open(pdf_path, "rb") as f:
        files = {"resume_file": (pdf_path, f, "application/pdf")}
        response = requests.post(url, data=data, files=files)
        
    print("\n--- Response ---")
    print(f"Status Code: {response.status_code}")
    print(response.json())
    
    if response.status_code == 200:
        job_id = response.json().get("job_id")
        print("\nNow testing GET candidate report...")
        # In our mock endpoints.py, the final report is just keyed by job_id instead of candidate_id directly 
        # Wait, the endpoint is MOCK_REPORTS[job_id], but the route is /candidates/{candidate_id}
        # Let's see if we get the report.
        res2 = requests.get(f"http://127.0.0.1:8000/api/v1/candidates/{job_id}")
        print(f"Status Code: {res2.status_code}")
        print(res2.json())
    
    # Cleanup
    if os.path.exists(pdf_path):
        os.remove(pdf_path)
    
    print("\nTest completed.")
