import React from 'react';
import { Shield, AlertCircle, AlertTriangle, Info, Clock, CheckCircle } from 'lucide-react';

export default function SecurityScoreCard({ scan }) {
  if (!scan) return null;

  const getScoreColor = (score) => {
    if (score >= 80) return '#10b981';
    if (score >= 50) return '#eab308';
    return '#ef4444';
  };

  const scoreColor = getScoreColor(scan.score);

  return (
    <div className="card" style={{ padding: '1.75rem', marginBottom: '2rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', alignItems: 'center' }}>
        
        {/* Prototype Security Score */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', borderRight: '1px solid #1f293d', paddingRight: '1.5rem' }}>
          <div style={{
            position: 'relative',
            width: '88px',
            height: '88px',
            borderRadius: '50%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: `conic-gradient(${scoreColor} ${scan.score * 3.6}deg, #1f293d 0deg)`,
            boxShadow: `0 0 25px ${scoreColor}33`
          }}>
            <div style={{
              position: 'absolute',
              inset: '6px',
              borderRadius: '50%',
              backgroundColor: '#111827',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <span style={{ fontSize: '1.5rem', fontWeight: '800', color: scoreColor }}>
                {Math.round(scan.score)}
              </span>
              <span style={{ fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase' }}>/ 100</span>
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h4 style={{ fontSize: '1rem', fontWeight: '700', color: '#f8fafc' }}>
                Security Score
              </h4>
              <span className="badge badge-scanner" style={{ fontSize: '0.65rem' }}>Prototype</span>
            </div>
            <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.2rem', maxWidth: '180px' }}>
              Formula: <code>100 - (C*25 + H*15 + M*8 + L*3)</code>
            </p>
          </div>
        </div>

        {/* Severity Metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
          
          <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '0.5rem', padding: '0.75rem', textAlign: 'center' }}>
            <span style={{ fontSize: '0.7rem', color: '#f87171', fontWeight: '700', textTransform: 'uppercase' }}>Critical</span>
            <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#ef4444', marginTop: '0.15rem' }}>
              {scan.critical_count}
            </div>
          </div>

          <div style={{ background: 'rgba(249, 115, 22, 0.08)', border: '1px solid rgba(249, 115, 22, 0.2)', borderRadius: '0.5rem', padding: '0.75rem', textAlign: 'center' }}>
            <span style={{ fontSize: '0.7rem', color: '#fb923c', fontWeight: '700', textTransform: 'uppercase' }}>High</span>
            <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#f97316', marginTop: '0.15rem' }}>
              {scan.high_count}
            </div>
          </div>

          <div style={{ background: 'rgba(234, 179, 8, 0.08)', border: '1px solid rgba(234, 179, 8, 0.2)', borderRadius: '0.5rem', padding: '0.75rem', textAlign: 'center' }}>
            <span style={{ fontSize: '0.7rem', color: '#fde047', fontWeight: '700', textTransform: 'uppercase' }}>Medium</span>
            <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#eab308', marginTop: '0.15rem' }}>
              {scan.medium_count}
            </div>
          </div>

          <div style={{ background: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.2)', borderRadius: '0.5rem', padding: '0.75rem', textAlign: 'center' }}>
            <span style={{ fontSize: '0.7rem', color: '#7dd3fc', fontWeight: '700', textTransform: 'uppercase' }}>Low</span>
            <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#38bdf8', marginTop: '0.15rem' }}>
              {scan.low_count}
            </div>
          </div>

        </div>

        {/* Scan Details & Rescan Badge */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', borderLeft: '1px solid #1f293d', paddingLeft: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#cbd5e1' }}>
            <Shield size={14} color="#38bdf8" />
            <span>Target: <strong>{scan.filename}</strong></span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#94a3b8' }}>
            <Clock size={14} />
            <span>Scan Time: <strong>{scan.scan_duration_ms} ms</strong></span>
          </div>

          {scan.is_rescan_of && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.25rem' }}>
              <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>
                <CheckCircle size={12} /> Rescan Verified
              </span>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
