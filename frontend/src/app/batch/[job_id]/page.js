"use client";

import { useEffect, useState } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Target, Search, GraduationCap, Users, Hash, ArrowRight, Star } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const COLORS = ['#8b5cf6', '#10B981', '#F59E0B', '#EF4444', '#3B82F6'];

export default function BatchAnalytics() {
  const { job_id } = useParams();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let interval;
    async function fetchStats() {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/v1/analytics/batch/${job_id}`);
        setData(res.data);
        if (res.data.status === "completed") {
            clearInterval(interval);
        }
      } catch (err) {
        setError('Failed to load batch analytics.');
        clearInterval(interval);
      }
    }
    
    if (job_id) {
        fetchStats();
        interval = setInterval(fetchStats, 3000);
    }
    return () => clearInterval(interval);
  }, [job_id]);

  if (error) return <div className="container" style={{ paddingTop: '100px', textAlign: 'center', color: 'var(--error)' }}>{error}</div>;
  if (!data) return <div className="container" style={{ paddingTop: '100px', textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }}></div></div>;

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Users color="var(--brand-solid)"/> Batch Intelligence
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>Job Processing Status: <span style={{ color: data.status === 'completed' ? 'var(--success)' : 'var(--warning)', fontWeight: 600 }}>{data.status.toUpperCase()} ({data.progress})</span></p>
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <div className="glass-panel" style={{ padding: '12px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Avg Match Score</div>
            <div className="heading-gradient" style={{ fontSize: '1.8rem', fontWeight: 800 }}>{data.avg_match_score || 0}</div>
          </div>
          <div className="glass-panel" style={{ padding: '12px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Avg CGPA</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{data.avg_cgpa || 0}</div>
          </div>
        </div>
      </div>

      {(() => {
        const sortedCandidates = [...(data.candidates || [])].sort((a, b) => (b.match_score || 0) - (a.match_score || 0));
        const topCandidate = sortedCandidates[0];

        return (
          <>
            {/* Top Recommended Candidate Spotlight */}
            {topCandidate && data.status === 'completed' && (
              <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px', background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, rgba(139, 92, 246, 0.15) 100%)', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--brand-solid)', fontWeight: 700, marginBottom: '8px' }}>
                              <Star size={18} fill="currentColor" /> Top Recommended Candidate
                          </div>
                          <h2 style={{ fontSize: '2rem', margin: '0 0 8px 0' }}>{topCandidate.name}</h2>
                          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
                              {topCandidate.branch} • CGPA: {topCandidate.cgpa}
                          </p>
                      </div>
                      <div style={{ textAlign: 'right', display: 'flex', gap: '24px', alignItems: 'center' }}>
                          <div>
                              <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Overall AI Match</div>
                              <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--success)' }}>{topCandidate.match_score}%</div>
                          </div>
                          <button onClick={() => router.push(`/candidate/${topCandidate.id}`)} className="badge" style={{ background: 'var(--brand-solid)', color: 'white', border: 'none', cursor: 'pointer', padding: '12px 24px', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                              View Report <ArrowRight size={16} />
                          </button>
                      </div>
                  </div>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
        <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <GraduationCap size={20} color="var(--brand-solid)" /> Department Distribution
            </h3>
            <div style={{ height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.branch_distribution || []}>
                        <XAxis dataKey="branch" stroke="var(--text-secondary)" fontSize={12} />
                        <YAxis stroke="var(--text-secondary)" fontSize={12} allowDecimals={false} />
                        <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ background: 'var(--bg-accent)', border: 'none', borderRadius: '8px' }} />
                        <Bar dataKey="count" fill="var(--brand-solid)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>

        <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Search size={20} color="var(--brand-solid)" /> Top Missing Skills
            </h3>
            <div style={{ height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data.top_missing_skills || []}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={5}
                            dataKey="count"
                            nameKey="skill"
                            label={({name, percent}) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        >
                            {(data.top_missing_skills || []).map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip contentStyle={{ background: 'var(--bg-accent)', border: 'none', borderRadius: '8px' }} />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '24px', overflowX: 'auto' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Hash size={20} color="var(--brand-solid)" /> Processed Candidates ({data.candidates?.length || 0})
          </h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-light)', color: 'var(--text-secondary)' }}>
                      <th style={{ padding: '12px' }}>Name</th>
                      <th style={{ padding: '12px' }}>Branch</th>
                      <th style={{ padding: '12px' }}>CGPA</th>
                      <th style={{ padding: '12px' }}>Match Score</th>
                      <th style={{ padding: '12px' }}>Tier 0 Fit</th>
                      <th style={{ padding: '12px' }}>Action</th>
                  </tr>
              </thead>
              <tbody>
                  {sortedCandidates.map((c, index) => (
                      <tr key={c.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                          <td style={{ padding: '16px 12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {index === 0 && <Star size={16} color="var(--brand-solid)" fill="var(--brand-solid)" />}
                            {c.name}
                          </td>
                          <td style={{ padding: '16px 12px', color: 'var(--text-secondary)' }}>{c.branch}</td>
                          <td style={{ padding: '16px 12px' }}>{c.cgpa}</td>
                          <td style={{ padding: '16px 12px' }}>
                              <div className="badge" style={{ background: c.match_score >= 80 ? 'var(--success-bg)' : c.match_score >= 50 ? 'var(--warning-bg)' : 'var(--error-bg)', color: c.match_score >= 80 ? 'var(--success)' : c.match_score >= 50 ? 'var(--warning)' : 'white', borderColor: 'transparent' }}>
                                  {c.match_score}%
                              </div>
                          </td>
                          <td style={{ padding: '16px 12px' }}>{Math.round(c.tier_0_score || 0)}</td>
                          <td style={{ padding: '16px 12px' }}>
                              <button onClick={() => router.push(`/candidate/${c.id}`)} className="badge" style={{ background: 'var(--brand-gradient)', color: 'white', border: 'none', cursor: 'pointer' }}>
                                  View <ArrowRight size={14} />
                              </button>
                          </td>
                      </tr>
                  ))}
                  {sortedCandidates.length === 0 && (
                      <tr>
                          <td colSpan="6" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>No candidates completed processing yet.</td>
                      </tr>
                  )}
              </tbody>
          </table>
      </div>
      </>
        );
      })()}
    </div>
  );
}
