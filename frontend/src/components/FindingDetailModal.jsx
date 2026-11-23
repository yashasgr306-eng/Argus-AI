import React, { useState } from 'react';
import { X, Sparkles, CheckCircle2, ShieldAlert, Cpu, Copy, Check, RefreshCw, AlertCircle, ArrowRight } from 'lucide-react';
import { reviewFindingWithAgent } from '../api';

export default function FindingDetailModal({ finding, onClose, onRescan, onUpdateFindingReview }) {
  const [loading, setLoading] = useState(false);
  const [review, setReview] = useState(finding.review || null);
  const [copied, setCopied] = useState(false);
  const [applyingFix, setApplyingFix] = useState(false);

  const handleRequestReview = async () => {
    setLoading(true);
    try {
      const data = await reviewFindingWithAgent(finding);
      setReview(data);
      if (onUpdateFindingReview) {
        onUpdateFindingReview(finding.id, data);
      }
    } catch (err) {
      alert(`Agent review error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const copyCode = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApplyAndRescan = async () => {
    setApplyingFix(true);
    try {
      // Pass the remediated fix to trigger verification rescan
      await onRescan(finding, review?.recommended_fix);
      onClose();
    } catch (err) {
      alert(`Rescan error: ${err.message}`);
    } finally {
      setApplyingFix(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ padding: '2rem' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', borderBottom: '1px solid #1e293b', paddingBottom: '1.25rem', marginBottom: '1.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
              <span className={`badge ${finding.severity === 'CRITICAL' ? 'badge-critical' : finding.severity === 'HIGH' ? 'badge-high' : 'badge-medium'}`}>
                {finding.severity}
              </span>
              <span className="badge badge-scanner">
                {finding.scanner_name}
              </span>
              <code style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{finding.rule_id}</code>
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#f8fafc' }}>
              {finding.message}
            </h2>
            <p style={{ fontSize: '0.825rem', color: '#38bdf8', fontFamily: 'monospace', marginTop: '0.25rem' }}>
              {finding.file_path} : line {finding.line_number}
            </p>
          </div>

          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '0.5rem' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Sanitized Code Evidence */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h4 style={{ fontSize: '0.85rem', fontWeight: '700', color: '#cbd5e1', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Scanner Evidence (Sanitized & Redacted)
          </h4>
          <pre style={{
            background: '#090d16',
            border: '1px solid #1e293b',
            borderRadius: '0.5rem',
            padding: '1rem',
            fontSize: '0.85rem',
            color: '#f87171',
            overflowX: 'auto'
          }}>
            <code>{finding.code_snippet || finding.masked_evidence || 'No snippet available'}</code>
          </pre>
        </div>

        {/* IBM Review Section */}
        {!review ? (
          <div style={{
            background: 'rgba(30, 41, 59, 0.4)',
            border: '1px solid #1e293b',
            borderRadius: '0.75rem',
            padding: '2rem',
            textAlign: 'center'
          }}>
            <Cpu size={36} color="#38bdf8" style={{ margin: '0 auto 0.75rem' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#f8fafc' }}>
              Request IBM Security Review Agent
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8', maxWidth: '520px', margin: '0.5rem auto 1.25rem' }}>
              The agent will synthesize evidence, explain impact, assess priority, and propose a safe remediation pattern.
            </p>
            <button
              onClick={handleRequestReview}
              disabled={loading}
              className="btn btn-primary"
              style={{ padding: '0.65rem 1.5rem' }}
            >
              <Sparkles size={16} />
              {loading ? 'Synthesizing with IBM Agent...' : 'Analyze Finding with IBM Agent'}
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            {/* Agent Metadata Card */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'rgba(56, 189, 248, 0.08)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              borderRadius: '0.5rem',
              padding: '0.75rem 1rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sparkles size={16} color="#38bdf8" />
                <span style={{ fontSize: '0.825rem', fontWeight: 700, color: '#f8fafc' }}>
                  {review.agent_name}
                </span>
                <span className="badge badge-scanner" style={{ fontSize: '0.65rem' }}>
                  {review.model_provider}
                </span>
              </div>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                Evidence Grounded · No Hallucinated Rules
              </span>
            </div>

            {/* Plain Language Explanation */}
            <div style={{ background: '#0f172a', padding: '1.25rem', borderRadius: '0.5rem', border: '1px solid #1e293b' }}>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#38bdf8', marginBottom: '0.35rem' }}>
                Plain Language Explanation
              </h4>
              <p style={{ fontSize: '0.875rem', color: '#cbd5e1', lineHeight: '1.6' }}>
                {review.plain_language_explanation}
              </p>
            </div>

            {/* Impact & Priority Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{ background: '#0f172a', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #1e293b' }}>
                <h4 style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fb923c', marginBottom: '0.25rem' }}>
                  Potential Impact
                </h4>
                <p style={{ fontSize: '0.825rem', color: '#94a3b8' }}>
                  {review.potential_impact}
                </p>
              </div>

              <div style={{ background: '#0f172a', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #1e293b' }}>
                <h4 style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fde047', marginBottom: '0.25rem' }}>
                  Priority Rationale
                </h4>
                <p style={{ fontSize: '0.825rem', color: '#94a3b8' }}>
                  {review.priority_reason}
                </p>
              </div>
            </div>

            {/* Recommended Fix */}
            <div style={{ background: '#0f172a', padding: '1.25rem', borderRadius: '0.5rem', border: '1px solid #1e293b' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#34d399' }}>
                  Recommended Safer Code Pattern
                </h4>
                <button
                  onClick={() => copyCode(review.recommended_fix)}
                  className="btn btn-secondary"
                  style={{ padding: '0.25rem 0.6rem', fontSize: '0.725rem' }}
                >
                  {copied ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                  {copied ? 'Copied' : 'Copy Pattern'}
                </button>
              </div>
              <pre style={{
                background: '#090d16',
                border: '1px solid #1e293b',
                borderRadius: '0.35rem',
                padding: '0.85rem',
                fontSize: '0.8rem',
                color: '#6ee7b7',
                overflowX: 'auto'
              }}>
                <code>{review.recommended_fix}</code>
              </pre>
            </div>

            {/* Verification Checklist */}
            <div style={{ background: '#0f172a', padding: '1rem 1.25rem', borderRadius: '0.5rem', border: '1px solid #1e293b' }}>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.35rem' }}>
                Verification Checklist
              </h4>
              <p style={{ fontSize: '0.825rem', color: '#94a3b8', whiteSpace: 'pre-line' }}>
                {review.verification_steps}
              </p>
            </div>

            {/* Safety Limitation Notice */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: '#64748b' }}>
              <AlertCircle size={14} />
              <span>{review.limitations}</span>
            </div>

            {/* Action Bar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem', paddingTop: '1rem', borderTop: '1px solid #1e293b' }}>
              <button
                onClick={onClose}
                className="btn btn-secondary"
              >
                Close
              </button>

              <button
                onClick={handleApplyAndRescan}
                disabled={applyingFix}
                className="btn btn-success"
              >
                <RefreshCw size={14} className={applyingFix ? 'animate-spin' : ''} />
                {applyingFix ? 'Applying & Rescanning...' : 'Apply Fix & Verify with Rescan'}
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
