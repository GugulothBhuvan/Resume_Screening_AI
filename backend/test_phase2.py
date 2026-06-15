import os
import time
import requests
import subprocess
import threading
import uvicorn
from fpdf import FPDF
from app.main import app

def generate_dummy_pdf(filename="dummy_resume.pdf"):
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Arial", size=12)
    pdf.cell(200, 10, txt="Jane Doe - Data Scientist", ln=1, align="C")
    pdf.cell(200, 10, txt="CGPA: 9.1", ln=2, align="L")
    pdf.cell(200, 10, txt="Skills: Python, Machine Learning, TensorFlow", ln=3, align="L")
    pdf.output(filename)
    return filename

def run_server():
    uvicorn.run(app, host="127.0.0.1", port=8001, log_level="error")

if __name__ == "__main__":
    print("Generating PDF...")
    pdf_path = generate_dummy_pdf()
    
    print("Starting API server...")
    server_thread = threading.Thread(target=run_server, daemon=True)
    server_thread.start()
    
    print("Starting Celery Worker...")
    celery_cmd = [r".\venv\Scripts\celery.exe", "-A", "app.worker", "worker", "--loglevel=info", "--pool=solo"] # solo pool for windows
    env = os.environ.copy()
    env["PYTHONPATH"] = os.getcwd()
    worker_proc = subprocess.Popen(celery_cmd, env=env)
    
    time.sleep(5)
    
    try:
        print("\nExecuting test POST /upload...")
        url = "http://127.0.0.1:8001/api/v1/jobs/upload"
        data = {"job_description": "Need a Data Scientist for Machine Learning."}
        
        with open(pdf_path, "rb") as f:
            files = {"resume_file": (pdf_path, f, "application/pdf")}
            response = requests.post(url, data=data, files=files)
            
        print(f"Status Code: {response.status_code}")
        res_json = response.json()
        print(res_json)
        
        if response.status_code == 200:
            candidate_id = res_json['message'].split('Candidate ID: ')[1].split(' add')[0]
            print(f"Got Candidate ID: {candidate_id}")
            
            print("\nPolling GET candidate report...")
            max_retries = 10
            for i in range(max_retries):
                res2 = requests.get(f"http://127.0.0.1:8001/api/v1/candidates/{candidate_id}")
                data2 = res2.json()
                print(f"Poll {i+1}: Status -> {data2.get('status', 'completed?')}")
                if data2.get('status') not in ["processing", "failed"]:
                    print("\n--- Final Report from DB ---")
                    print(data2)
                    break
                time.sleep(2)
    except Exception as e:
        print(f"Test failed: {e}")
    finally:
        print("\nCleaning up...")
        worker_proc.terminate()
        if os.path.exists(pdf_path):
            os.remove(pdf_path)
