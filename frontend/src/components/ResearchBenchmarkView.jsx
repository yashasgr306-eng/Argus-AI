import React, { useState, useEffect } from 'react';
import { Database, RefreshCw, CheckCircle, AlertTriangle, Target, Activity, FileCheck, Layers } from 'lucide-react';
import { getResearchMetrics, runBenchmarkEvaluation } from '../api';

export default function ResearchBenchmarkView() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reEvaluating, setReEvaluating] = useState(false);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    setLoading(true);
    try {
      const data = await getResearchMetrics();
      setMetrics(data);
    } catch (err) {
      console.error('Failed to load metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRunEvaluation = async () => {
    setReEvaluating(true);
    try {
      const data = await runBenchmarkEvaluation();
      setMetrics(data);
    } catch (err) {
      alert(`Evaluation error: ${err.message}`);
    } finally {
      setReEvaluating(false);
    }
  };

  if (loading) {
    return (
      <div className="card" style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
        <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 0.75rem' }} />
        <p>Loading Research Benchmark Data...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Research Question Callout */}
      <div className="card" style={{ padding: '2rem', background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7), rgba(15, 23, 42, 0.9))', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span className="badge badge-scanner">AI Research Track R1</span>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>“Vibe-coded and vulnerable”</span>
          </div>

          <button
            onClick={handleRunEvaluation}
            disabled={reEvaluating}
            className="btn btn-primary"
            style={{ padding: '0.45rem 1rem', fontSize: '0.8rem' }}
          >
            <RefreshCw size={14} className={reEvaluating ? 'animate-spin' : ''} />
            {reEvaluating ? 'Evaluating 40 Samples...' : 'Re-run Benchmark Evaluation'}
          </button>
        </div>

        <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#f8fafc', marginBottom: '0.5rem' }}>
          Research Question:
        </h2>
        <p style={{ fontSize: '1.05rem', color: '#38bdf8', fontStyle: 'italic', lineHeight: '1.6' }}>
          “{metrics?.research_question}”
        </p>

        <p style={{ fontSize: '0.825rem', color: '#94a3b8', marginTop: '1rem' }}>
          {metrics?.agent_rubric_summary}
        </p>
      </div>

      {/* 5 Key Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
        
        {/* Precision */}
        <div className="card" style={{ padding: '1.5rem', textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700 }}>
            <Target size={15} color="#38bdf8" />
            Scanner Precision
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '800', color: '#38bdf8', marginTop: '0.5rem' }}>
            {((metrics?.precision || 0) * 100).toFixed(1)}%
          </div>
          <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
            Findings matching ground truth
          </p>
        </div>

        {/* Recall */}
        <div className="card" style={{ padding: '1.5rem', textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700 }}>
            <Activity size={15} color="#a855f7" />
            Vulnerability Recall
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '800', color: '#a855f7', marginTop: '0.5rem' }}>
            {((metrics?.recall || 0) * 100).toFixed(1)}%
          </div>
          <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
            Of seeded flaws detected
          </p>
        </div>

        {/* False Positives */}
        <div className="card" style={{ padding: '1.5rem', textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700 }}>
            <AlertTriangle size={15} color="#eab308" />
            False Positives
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '800', color: '#eab308', marginTop: '0.5rem' }}>
            {metrics?.false_positive_count}
          </div>
          <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
            Clean control files flagged
          </p>
        </div>

        {/* Actionability Rating */}
        <div className="card" style={{ padding: '1.5rem', textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700 }}>
            <FileCheck size={15} color="#10b981" />
            Agent Actionability
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '800', color: '#10b981', marginTop: '0.5rem' }}>
            {metrics?.actionability_rating} <span style={{ fontSize: '1rem', color: '#64748b' }}>/ 5.0</span>
          </div>
          <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
            Rubric score on fix usability
          </p>
        </div>

        {/* Fix Verification Rate */}
        <div className="card" style={{ padding: '1.5rem', textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700 }}>
            <CheckCircle size={15} color="#34d399" />
            Rescan Verification
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '800', color: '#34d399', marginTop: '0.5rem' }}>
            {((metrics?.fix_verification_rate || 0) * 100).toFixed(1)}%
          </div>
          <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
            Fixes verified clear on rescan
          </p>
        </div>

      </div>

      {/* 40-Sample Category Breakdown */}
      <div className="card" style={{ padding: '1.75rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.5rem' }}>
          Benchmark Category Breakdown (40 Seeded Code Samples)
        </h3>
        <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '1.25rem' }}>
          Ground truth dataset includes 10 hard-coded secrets, 10 injection patterns, 10 missing access checks, and 10 clean controls.
        </p>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Category</th>
                <th>Total Samples</th>
                <th>Detected</th>
                <th>Precision</th>
                <th>Recall</th>
                <th>False Positives</th>
              </tr>
            </thead>
            <tbody>
              {metrics?.categories?.map((cat, idx) => (
                <tr key={idx}>
                  <td style={{ fontWeight: 600, color: '#f8fafc' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Layers size={14} color="#38bdf8" />
                      {cat.category}
                    </div>
                  </td>
                  <td>{cat.total_samples}</td>
                  <td>
                    <span style={{ fontWeight: 700, color: '#38bdf8' }}>{cat.detected_count}</span> / {cat.total_samples}
                  </td>
                  <td>{(cat.precision * 100).toFixed(0)}%</td>
                  <td>{(cat.recall * 100).toFixed(0)}%</td>
                  <td>
                    <span style={{ color: cat.false_positives > 0 ? '#eab308' : '#10b981', fontWeight: 600 }}>
                      {cat.false_positives}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Limitations Notice */}
        <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#090d16', border: '1px solid #1e293b', borderRadius: '0.5rem', fontSize: '0.8rem', color: '#94a3b8' }}>
          <strong style={{ color: '#cbd5e1' }}>Research Limitations: </strong>
          {metrics?.limitations}
        </div>
      </div>

    </div>
  );
}
