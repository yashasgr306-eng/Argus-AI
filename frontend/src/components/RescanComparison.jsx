import React from 'react';
import { ArrowRight, CheckCircle2, AlertTriangle, ShieldCheck, RefreshCw, XCircle } from 'lucide-react';

export default function RescanComparison({ originalScan, rescanScan, onDismiss }) {
  if (!originalScan || !rescanScan) return null;

  // Determine fixed findings
  const origFindings = originalScan.findings || [];
  const rescanFindings = rescanScan.findings || [];

  const rescanRuleKeys = new Set(rescanFindings.map(f => `${f.rule_id}:${f.file_path}`));
  const fixedFindings = origFindings.filter(f => !rescanRuleKeys.has(`${f.rule_id}:${f.file_path}`));

  const scoreDiff = Math.round(rescanScan.score - originalScan.score);

  return (
    <div className="card" style={{ padding: '1.75rem', marginBottom: '2rem', border: '1px solid rgba(16, 185, 129, 0.4)', background: 'rgba(16, 185, 129, 0.03)' }}>
      
      {/* Title & Score Progression */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span className="badge badge-success">
              <CheckCircle2 size={13} /> Rescan Verification Complete
            </span>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
              Only a fresh rescan can verify remediation
            </span>
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#f8fafc' }}>
            Before-and-After Remediation Report
          </h3>
        </div>

        {/* Score comparison pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: '#0f172a', padding: '0.6rem 1.2rem', borderRadius: '0.75rem', border: '1px solid #1e293b' }}>
          <div>
            <span style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase' }}>Before</span>
            <div style={{ fontSize: '1.1rem', fontWeight: '800', color: originalScan.score < 50 ? '#ef4444' : '#eab308' }}>
              {Math.round(originalScan.score)}
            </div>
          </div>

          <ArrowRight size={18} color="#64748b" />

          <div>
            <span style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase' }}>After Rescan</span>
            <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#10b981' }}>
              {Math.round(rescanScan.score)}
            </div>
          </div>

          <div style={{ borderLeft: '1px solid #1e293b', paddingLeft: '0.75rem' }}>
            <span style={{ fontSize: '0.75rem', color: scoreDiff >= 0 ? '#34d399' : '#f87171', fontWeight: '700' }}>
              {scoreDiff >= 0 ? `+${scoreDiff}` : scoreDiff} pts
            </span>
          </div>
        </div>
      </div>

      {/* Findings Comparison Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
        
        {/* Verified Resolved Findings */}
        <div style={{ background: '#0f172a', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: '0.5rem', padding: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <ShieldCheck size={18} color="#10b981" />
            <h4 style={{ fontSize: '0.875rem', fontWeight: '700', color: '#34d399' }}>
              Verified Eliminated ({fixedFindings.length})
            </h4>
          </div>

          {fixedFindings.length === 0 ? (
            <p style={{ fontSize: '0.8rem', color: '#64748b' }}>No findings resolved in this rescan.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {fixedFindings.map(f => (
                <div key={f.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem', background: '#090d16', borderRadius: '0.35rem', border: '1px solid #1e293b' }}>
                  <div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#f8fafc' }}>{f.message.split(':')[0]}</div>
                    <code style={{ fontSize: '0.7rem', color: '#64748b' }}>{f.file_path}:{f.line_number}</code>
                  </div>
                  <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>RESOLVED</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Remaining Findings */}
        <div style={{ background: '#0f172a', border: '1px solid rgba(234, 179, 8, 0.25)', borderRadius: '0.5rem', padding: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <AlertTriangle size={18} color="#eab308" />
            <h4 style={{ fontSize: '0.875rem', fontWeight: '700', color: '#fde047' }}>
              Remaining Issues ({rescanFindings.length})
            </h4>
          </div>

          {rescanFindings.length === 0 ? (
            <p style={{ fontSize: '0.8rem', color: '#34d399', fontWeight: 600 }}>Zero remaining findings! Clean code verified.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {rescanFindings.map(f => (
                <div key={f.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem', background: '#090d16', borderRadius: '0.35rem', border: '1px solid #1e293b' }}>
                  <div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#f8fafc' }}>{f.message.split(':')[0]}</div>
                    <code style={{ fontSize: '0.7rem', color: '#64748b' }}>{f.file_path}:{f.line_number}</code>
                  </div>
                  <span className={`badge ${f.severity === 'CRITICAL' ? 'badge-critical' : 'badge-high'}`} style={{ fontSize: '0.65rem' }}>
                    {f.severity}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {onDismiss && (
        <div style={{ marginTop: '1rem', textAlign: 'right' }}>
          <button onClick={onDismiss} className="btn btn-secondary" style={{ padding: '0.35rem 0.85rem', fontSize: '0.75rem' }}>
            Dismiss Rescan Comparison
          </button>
        </div>
      )}

    </div>
  );
}
