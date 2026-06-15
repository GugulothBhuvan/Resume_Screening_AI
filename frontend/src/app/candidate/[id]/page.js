"use client";

import { useEffect, useState } from 'react';
import axios from 'axios';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { Target, Search, GraduationCap, ShieldAlert, Award, FileText, Briefcase, Activity, CheckCircle, FileQuestion } from 'lucide-react';
import { useParams } from 'next/navigation';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function CandidateProfile() {
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    async function fetchReport() {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/v1/candidates/${id}`);
        setReport(res.data);
      } catch (err) {
        setError('Failed to load candidate report.');
      }
    }
    if (id) fetchReport();
  }, [id]);

  if (error) return <div className="container" style={{ paddingTop: '100px', textAlign: 'center', color: 'var(--error)' }}>{error}</div>;
  if (!report) return <div className="container" style={{ paddingTop: '100px', textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }}></div></div>;

  const getScoreColor = (score) => {
    if (score >= 80) return 'var(--success)';
    if (score >= 60) return 'var(--warning)';
    return 'var(--error)';
  };

  const chartData = [
    { subject: 'Tier 0 Match', A: report.tier_0_score || 0, fullMark: 100 },
    { subject: 'JD AI Match', A: report.match_score || 0, fullMark: 100 },
    { subject: 'Leadership', A: report.leadership_score || 0, fullMark: 100 },
    { subject: 'Academics', A: Math.min(((report.cgpa || 0) / 10) * 100, 100), fullMark: 100 }
  ];

  return (
    <div className="animate-fade-in" style={{ padding: '20px 48px', height: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column' }}>
      
      {/* Premium Header */}
      <div className="glass-panel" style={{ padding: '24px 32px', marginBottom: '24px', flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
            <h1 style={{ fontSize: '2.4rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>{report.name || 'Candidate'}</h1>
            {report.match_score >= 80 && (
              <div className="badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--success)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '6px 12px', fontSize: '0.9rem', fontWeight: 700 }}>
                Top Recommendation
              </div>
            )}
            {report.match_score < 80 && report.match_score >= 50 && (
              <div className="badge" style={{ background: 'rgba(245, 158, 11, 0.15)', color: 'var(--warning)', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '6px 12px', fontSize: '0.9rem', fontWeight: 700 }}>
                Good Fit
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: '24px', color: 'var(--text-secondary)', fontSize: '1rem', fontWeight: 500 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><GraduationCap size={18} color="var(--brand-solid)"/> B.Tech {report.branch || 'Unknown'}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Award size={18} color="var(--brand-solid)"/> CGPA: {report.cgpa || 'N/A'}</span>
          </div>
        </div>
        <div style={{ textAlign: 'right', display: 'flex', gap: '32px', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px', fontWeight: 600 }}>KGP Leadership</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>{Math.round(report.leadership_score || 0)}</div>
          </div>
          <div style={{ width: '1px', height: '40px', background: 'var(--border-light)' }}></div>
          <div>
            <div style={{ fontSize: '0.9rem', color: 'var(--brand-solid)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px', fontWeight: 700 }}>Overall AI Fit</div>
            <div className="heading-gradient" style={{ fontSize: '3.5rem', fontWeight: 900, lineHeight: 1 }}>
              {Math.round(report.match_score || 0)}<span style={{ fontSize: '1.5rem' }}>%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Split Layout: Fixed Height for Perfect Scroll alignment */}
      <div style={{ display: 'grid', gridTemplateColumns: '5fr 7fr', gap: '24px', flex: 1, minHeight: 0, paddingBottom: '24px' }}>
        
        {/* Left Pane: PDF Viewer */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(0,0,0,0.2)' }}>
            <FileText size={18} color="var(--brand-solid)" /> 
            <span style={{ fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '0.5px' }}>DOCUMENT VIEWER</span>
          </div>
          <div style={{ flex: 1, overflow: 'hidden', background: '#f3f4f6' }}>
             <iframe 
               src={`${API_BASE_URL}/api/v1/candidates/${id}/resume`} 
               style={{ width: '100%', height: '100%', border: 'none' }} 
               title="Resume PDF"
             />
          </div>
        </div>

        {/* Right Pane: Analysis & Tabs */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
          
          {/* Tabs Navigation */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border-light)', background: 'rgba(0,0,0,0.2)' }}>
            <button 
              onClick={() => setActiveTab('overview')}
              style={{ 
                flex: 1, background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1rem', fontWeight: 600, padding: '20px 0',
                color: activeTab === 'overview' ? 'var(--brand-solid)' : 'var(--text-secondary)',
                borderBottom: activeTab === 'overview' ? '3px solid var(--brand-solid)' : '3px solid transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s', textTransform: 'uppercase', letterSpacing: '1px'
              }}
            >
              <Target size={18} /> Executive Overview
            </button>
            <button 
              onClick={() => setActiveTab('experience')}
              style={{ 
                flex: 1, background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1rem', fontWeight: 600, padding: '20px 0',
                color: activeTab === 'experience' ? 'var(--brand-solid)' : 'var(--text-secondary)',
                borderBottom: activeTab === 'experience' ? '3px solid var(--brand-solid)' : '3px solid transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s', textTransform: 'uppercase', letterSpacing: '1px'
              }}
            >
              <Briefcase size={18} /> Deep Experience Analysis
            </button>
          </div>

          {/* Scrollable Tab Content Wrapper */}
          <div style={{ padding: '32px', overflowY: 'auto', flex: 1 }}>

          {/* Tab Content: OVERVIEW */}
          {activeTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              
              {/* Overall Agentic Summary */}
              <div>
                <h3 style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>
                  <CheckCircle size={18} color="var(--brand-solid)" /> Agentic Synthesis
                </h3>
                <div style={{ 
                  padding: '24px', background: 'rgba(139, 92, 246, 0.05)', borderRadius: 'var(--radius-md)', 
                  borderLeft: '4px solid var(--brand-solid)', border: '1px solid rgba(139, 92, 246, 0.1)',
                  lineHeight: '1.8', fontSize: '1.05rem', color: 'var(--text-primary)'
                }}>
                  {report.overall_analysis || "No overall analysis generated yet."}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                {/* Radar Chart */}
                <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-lg)', padding: '24px', border: '1px solid var(--border-light)' }}>
                  <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', letterSpacing: '0.5px' }}>
                    <Activity size={16} color="var(--brand-solid)" /> Dimensional Fit
                  </h3>
                  <div style={{ height: '280px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="75%" data={chartData}>
                        <PolarGrid stroke="var(--border-light)" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text-primary)', fontSize: 13, fontWeight: 500 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                        <Radar name="Candidate" dataKey="A" stroke="var(--brand-solid)" fill="var(--brand-gradient)" fillOpacity={0.6} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Skills Block */}
                <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-lg)', padding: '24px', border: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div>
                    <h3 style={{ fontSize: '1rem', color: 'var(--brand-solid)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', letterSpacing: '0.5px' }}>
                      <Search size={16} /> Verified Skills (JD Match)
                    </h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {report.skills?.map(skill => (
                        <div key={skill} className="badge" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '6px 12px', fontSize: '0.9rem' }}>
                          {skill}
                        </div>
                      ))}
                      {!report.skills?.length && <span style={{ color: 'var(--text-secondary)' }}>None found</span>}
                    </div>
                  </div>

                  <div style={{ padding: '16px', background: 'var(--error-bg)', borderRadius: 'var(--radius-md)', border: '1px dashed rgba(239, 68, 68, 0.4)' }}>
                    <h3 style={{ fontSize: '1rem', color: 'var(--error)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', letterSpacing: '0.5px' }}>
                      <ShieldAlert size={16} /> Critical Skill Gaps
                    </h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {report.skill_gaps?.missing_skills?.map(skill => (
                        <div key={skill} className="badge" style={{ background: 'rgba(0,0,0,0.2)', color: 'var(--text-primary)', border: '1px solid rgba(255,255,255,0.1)', padding: '6px 12px', fontSize: '0.9rem' }}>
                          {skill}
                        </div>
                      ))}
                      {!report.skill_gaps?.missing_skills?.length && <span style={{ color: 'var(--text-secondary)' }}>No critical gaps detected by AI.</span>}
                    </div>
                  </div>
                </div>
              </div>
              
            </div>
          )}

          {/* Tab Content: EXPERIENCE ANALYSIS */}
          {activeTab === 'experience' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ padding: '16px', background: 'rgba(139, 92, 246, 0.05)', border: '1px solid rgba(139, 92, 246, 0.1)', borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: '1.5' }}>
                <Target size={18} color="var(--brand-solid)" style={{ float: 'left', marginRight: '12px', marginTop: '2px' }} />
                Below is the rigorous analysis of each specific internship and project executed directly against the context of the requested Job Description.
              </div>
              
              {!report.experience_analysis || report.experience_analysis.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 40px', background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-lg)', border: '1px dashed var(--border-light)' }}>
                  <Briefcase size={48} color="var(--border-light)" style={{ marginBottom: '16px' }} />
                  <div style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>No extractable experience identified for this candidate.</div>
                </div>
              ) : (
                report.experience_analysis.map((exp, idx) => (
                  <div key={idx} style={{ 
                    border: '1px solid var(--border-light)', 
                    borderRadius: 'var(--radius-lg)', 
                    background: 'rgba(0,0,0,0.3)',
                    overflow: 'hidden'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-light)' }}>
                      <div>
                        <h4 style={{ fontSize: '1.3rem', margin: '0 0 4px 0', color: 'var(--text-primary)', fontWeight: 700 }}>{exp.role}</h4>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Briefcase size={14} /> {exp.company}
                        </div>
                      </div>
                      <div className="badge" style={{ 
                        background: getScoreColor(exp.fit_score), 
                        color: 'white', 
                        padding: '8px 16px',
                        fontSize: '1.1rem', fontWeight: 800,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                      }}>
                        {exp.fit_score}% Fit
                      </div>
                    </div>
                    
                    <div style={{ 
                      padding: '24px', 
                      fontSize: '1.05rem',
                      lineHeight: '1.7',
                      color: 'var(--text-primary)'
                    }}>
                      <div style={{ fontWeight: 700, marginBottom: '12px', color: 'var(--brand-solid)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Search size={14} /> AI Evaluator Reasoning
                      </div>
                      {exp.analysis}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          </div>
        </div>
      </div>
    </div>
  );
}
