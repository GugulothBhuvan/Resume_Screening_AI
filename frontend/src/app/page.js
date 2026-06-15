"use client";

import { useState, useRef } from 'react';
import { UploadCloud, FileText, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function Home() {
  const router = useRouter();
  const [jobDesc, setJobDesc] = useState('Looking for a Python developer with LangChain experience.');
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const [uploadMode, setUploadMode] = useState('pdf'); // 'pdf' or 'csv'

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const pollStatus = async (candidateId) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/v1/candidates/${candidateId}`);
      if (res.data.status === 'completed') {
        setStatus('Analysis Complete! Redirecting...');
        setTimeout(() => {
          router.push(`/candidate/${candidateId}`);
        }, 1000);
      } else if (res.data.status === 'failed') {
        setIsUploading(false);
        setError('Agentic processing failed. Please check backend logs.');
      } else {
        // Still processing, poll again
        setTimeout(() => pollStatus(candidateId), 2000);
      }
    } catch (err) {
      setIsUploading(false);
      setError('Error checking status.');
    }
  };

  const pollBatchStatus = async (jobId) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/v1/analytics/batch/${jobId}`);
      if (res.data.status === 'completed') {
        setStatus('Batch Processing Complete! Redirecting...');
        setTimeout(() => {
          router.push(`/batch/${jobId}`);
        }, 1000);
      } else {
        setStatus(`Processing batch: ${res.data.progress}`);
        setTimeout(() => pollBatchStatus(jobId), 3000);
      }
    } catch (err) {
      setIsUploading(false);
      setError('Error checking batch status.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError(`Please select a ${uploadMode.toUpperCase()} file.`);
      return;
    }
    
    setIsUploading(true);
    setError('');
    setStatus('Uploading and initializing AI agents...');

    const formData = new FormData();
    formData.append('job_description', jobDesc);
    
    if (uploadMode === 'pdf') {
        formData.append('resume_file', file);
        try {
          const res = await axios.post(`${API_BASE_URL}/api/v1/jobs/upload`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          const candidateIdMatch = res.data.message.match(/Candidate ID: ([0-9a-fA-F-]+)/);
          if (candidateIdMatch && candidateIdMatch[1]) {
             setStatus('File uploaded. Agents analyzing...');
             pollStatus(candidateIdMatch[1]);
          } else {
             setError('Failed to parse Candidate ID from response.');
             setIsUploading(false);
          }
        } catch (err) {
          setError(err.response?.data?.detail || 'Upload failed.');
          setIsUploading(false);
        }
    } else {
        formData.append('csv_file', file);
        try {
          const res = await axios.post(`${API_BASE_URL}/api/v1/jobs/upload-csv`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          setStatus(`CSV uploaded. ${res.data.message}`);
          pollBatchStatus(res.data.job_id);
        } catch (err) {
          setError(err.response?.data?.detail || 'Batch upload failed.');
          setIsUploading(false);
        }
    }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto', paddingTop: '40px' }}>
      <div style={{ textAlign: 'center', marginBottom: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <h2 style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '16px', lineHeight: 1.2 }}>
          Welcome to <br />
          <span className="heading-gradient">Screening Agent</span>
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem', maxWidth: '600px', lineHeight: 1.6 }}>
          Upload a Job Description and Candidate Resumes to autonomously generate comprehensive, data-driven agentic profiles.
        </p>
      </div>

      <div className="glass-panel" style={{ padding: '40px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.3)' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
              1. Job Description (Target Profile)
            </label>
            <textarea 
              value={jobDesc}
              onChange={(e) => setJobDesc(e.target.value)}
              style={{ width: '100%', minHeight: '120px', resize: 'vertical', padding: '16px', background: 'var(--bg-secondary)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '1rem', fontFamily: 'inherit', transition: 'border-color 0.2s', outline: 'none' }}
              onFocus={(e) => e.target.style.borderColor = 'var(--brand-solid)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--border-light)'}
              placeholder="Paste the Job Description here..."
              disabled={isUploading}
            />
          </div>

          <div style={{ height: '1px', background: 'var(--border-light)', width: '100%' }}></div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <label style={{ fontWeight: 600, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                2. Candidate Integration
              </label>
              <div style={{ display: 'flex', gap: '4px', background: 'rgba(0,0,0,0.2)', padding: '4px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                <button 
                  type="button" 
                  onClick={() => { setUploadMode('pdf'); setFile(null); }}
                  style={{ background: uploadMode === 'pdf' ? 'var(--brand-solid)' : 'transparent', color: uploadMode === 'pdf' ? 'white' : 'var(--text-secondary)', border: 'none', cursor: 'pointer', padding: '8px 16px', borderRadius: '6px', fontWeight: 600, fontSize: '0.9rem', transition: 'all 0.2s' }}>
                  Single PDF
                </button>
                <button 
                  type="button" 
                  onClick={() => { setUploadMode('csv'); setFile(null); }}
                  style={{ background: uploadMode === 'csv' ? 'var(--brand-solid)' : 'transparent', color: uploadMode === 'csv' ? 'white' : 'var(--text-secondary)', border: 'none', cursor: 'pointer', padding: '8px 16px', borderRadius: '6px', fontWeight: 600, fontSize: '0.9rem', transition: 'all 0.2s' }}>
                  Bulk CSV
                </button>
              </div>
            </div>
            
            <div 
              onClick={() => !isUploading && fileInputRef.current.click()}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              style={{
                border: `2px dashed ${file ? 'var(--brand-solid)' : 'var(--border-light)'}`,
                borderRadius: 'var(--radius-md)',
                padding: '48px 20px',
                textAlign: 'center',
                cursor: isUploading ? 'not-allowed' : 'pointer',
                background: file ? 'rgba(139, 92, 246, 0.05)' : 'var(--bg-secondary)',
                transition: 'all 0.3s ease',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center'
              }}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept={uploadMode === 'pdf' ? '.pdf' : '.csv'} 
                style={{ display: 'none' }} 
              />
              {file ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                  <FileText size={48} color="var(--brand-solid)" />
                  <div style={{ fontWeight: 600 }}>{file.name}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', color: 'var(--text-secondary)' }}>
                  <UploadCloud size={48} />
                  <div><span style={{ color: 'var(--brand-solid)', fontWeight: 600 }}>Click to upload</span> or drag and drop</div>
                  <div style={{ fontSize: '0.85rem' }}>{uploadMode === 'pdf' ? 'PDF up to 10MB' : 'CSV with columns: name, branch, cgpa, resume_text'}</div>
                </div>
              )}
            </div>
          </div>

          {error && (
            <div style={{ padding: '16px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--error)', color: 'var(--error)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '12px', fontWeight: 500 }}>
              <AlertCircle size={24} /> {error}
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '16px' }}>
            <div style={{ flex: 1 }}>
              {isUploading && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--brand-solid)', fontWeight: 600 }}>
                  <div className="spinner"></div>
                  {status}
                </div>
              )}
            </div>
            <button 
              type="submit" 
              className="primary-btn" 
              disabled={!file || isUploading}
              style={{ minWidth: '220px', padding: '16px 32px', fontSize: '1.1rem', borderRadius: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: (!file || isUploading) ? 0.6 : 1 }}
            >
              {isUploading ? 'Processing...' : 'Run Agentic Match'} 
              {!isUploading && <ArrowRight size={20} />}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
