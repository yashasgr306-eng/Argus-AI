import React, { useState } from 'react';
import { Shield, Sparkles, Filter, Search, Terminal, Key, Package, AlertCircle } from 'lucide-react';

export default function FindingsTable({ findings, onSelectFinding, selectedFindingId }) {
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [scannerFilter, setScannerFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = findings.filter(f => {
    if (severityFilter !== 'ALL' && f.severity !== severityFilter) return false;
    if (scannerFilter !== 'ALL' && f.scanner_name !== scannerFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchFile = f.file_path.toLowerCase().includes(q);
      const matchRule = f.rule_id.toLowerCase().includes(q);
      const matchMsg = f.message.toLowerCase().includes(q);
      if (!matchFile && !matchRule && !matchMsg) return false;
    }
    return true;
  });

  const getSeverityBadge = (sev) => {
    switch (sev) {
      case 'CRITICAL': return <span className="badge badge-critical">Critical</span>;
      case 'HIGH': return <span className="badge badge-high">High</span>;
      case 'MEDIUM': return <span className="badge badge-medium">Medium</span>;
      case 'LOW': return <span className="badge badge-low">Low</span>;
      default: return <span className="badge">{sev}</span>;
    }
  };

  const getScannerIcon = (scanner) => {
    switch (scanner) {
      case 'gitleaks': return <Key size={14} color="#f97316" />;
      case 'osv-scanner': return <Package size={14} color="#a855f7" />;
      default: return <Terminal size={14} color="#38bdf8" />;
    }
  };

  return (
    <div className="card" style={{ padding: '1.75rem' }}>
      
      {/* Header & Controls */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.25rem' }}>
        <div>
          <h3 style={{ fontSize: '1.125rem', fontWeight: '700', color: '#f8fafc' }}>
            Scanner Findings ({findings.length})
          </h3>
          <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
            Deterministic detection results from Semgrep, Gitleaks, and OSV-Scanner
          </p>
        </div>

        {/* Search */}
        <div style={{ position: 'relative', minWidth: '240px' }}>
          <Search size={16} color="#64748b" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search rules, files, keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              backgroundColor: '#0f172a',
              border: '1px solid #1e293b',
              borderRadius: '0.5rem',
              padding: '0.5rem 0.75rem 0.5rem 2.25rem',
              color: '#f8fafc',
              fontSize: '0.825rem',
              outline: 'none'
            }}
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', background: '#0f172a', padding: '0.25rem', borderRadius: '0.5rem', border: '1px solid #1e293b' }}>
          {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(sev => (
            <button
              key={sev}
              onClick={() => setSeverityFilter(sev)}
              style={{
                background: severityFilter === sev ? '#1e293b' : 'transparent',
                color: severityFilter === sev ? '#f8fafc' : '#94a3b8',
                border: 'none',
                borderRadius: '0.35rem',
                padding: '0.3rem 0.65rem',
                fontSize: '0.75rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              {sev}
            </button>
          ))}
        </div>

        {/* Scanner Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', background: '#0f172a', padding: '0.25rem', borderRadius: '0.5rem', border: '1px solid #1e293b' }}>
          {['ALL', 'semgrep', 'gitleaks', 'osv-scanner'].map(sc => (
            <button
              key={sc}
              onClick={() => setScannerFilter(sc)}
              style={{
                background: scannerFilter === sc ? '#1e293b' : 'transparent',
                color: scannerFilter === sc ? '#f8fafc' : '#94a3b8',
                border: 'none',
                borderRadius: '0.35rem',
                padding: '0.3rem 0.65rem',
                fontSize: '0.75rem',
                fontWeight: '600',
                cursor: 'pointer',
                textTransform: 'capitalize'
              }}
            >
              {sc === 'ALL' ? 'All Scanners' : sc}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
          <AlertCircle size={32} color="#64748b" style={{ margin: '0 auto 0.75rem' }} />
          <p style={{ fontWeight: 600 }}>No security findings match your criteria.</p>
          <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>The scanned files passed all active security checks.</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Severity</th>
                <th>Scanner</th>
                <th>Vulnerability / Rule</th>
                <th>File & Line</th>
                <th>Evidence Excerpt (Sanitized)</th>
                <th>AI Review</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(f => {
                const isSelected = selectedFindingId === f.id;
                return (
                  <tr
                    key={f.id}
                    onClick={() => onSelectFinding(f)}
                    style={{
                      cursor: 'pointer',
                      backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.1)' : undefined
                    }}
                  >
                    <td>{getSeverityBadge(f.severity)}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        {getScannerIcon(f.scanner_name)}
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#cbd5e1' }}>
                          {f.scanner_name}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#f8fafc' }}>
                        {f.message.split(':')[0]}
                      </div>
                      <div style={{ fontSize: '0.725rem', color: '#64748b', fontFamily: 'monospace', marginTop: '0.15rem' }}>
                        {f.rule_id}
                      </div>
                    </td>
                    <td>
                      <code style={{ fontSize: '0.75rem', color: '#38bdf8' }}>
                        {f.file_path}:{f.line_number}
                      </code>
                    </td>
                    <td style={{ maxWidth: '280px' }}>
                      <pre style={{
                        fontSize: '0.725rem',
                        background: '#090d16',
                        padding: '0.35rem 0.5rem',
                        borderRadius: '0.35rem',
                        overflowX: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        color: f.scanner_name === 'gitleaks' ? '#f87171' : '#cbd5e1',
                        border: '1px solid #1e293b'
                      }}>
                        {f.masked_evidence || f.code_snippet || 'Evidence masked'}
                      </pre>
                    </td>
                    <td>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectFinding(f);
                        }}
                        className={`btn ${f.review ? 'btn-success' : 'btn-primary'}`}
                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                      >
                        <Sparkles size={13} />
                        {f.review ? 'View Analysis' : 'Explain with AI'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
}
