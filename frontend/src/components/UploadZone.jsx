import React, { useState } from 'react';
import { UploadCloud, FileArchive, FileCode, CheckCircle2, AlertTriangle, ShieldCheck, RefreshCw, ArrowRight } from 'lucide-react';

export default function UploadZone({ onFileUpload, scanning }) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      processFile(file);
    }
  };

  const handleChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      processFile(file);
    }
  };

  const processFile = (file) => {
    const validExtensions = ['.zip', '.py', '.js', '.ts', '.json', '.txt'];
    const isAllowed = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
    if (!isAllowed) {
      alert('Please upload a valid project archive (.zip) or source file (.py, .js, .ts).');
      return;
    }
    setSelectedFile(file);
    onFileUpload(file);
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="card" style={{ padding: '2rem', marginBottom: '2rem', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
      
      {/* Upload Drag & Drop Area */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        style={{
          border: `2px dashed ${dragActive ? '#6366f1' : scanning ? '#475569' : '#334155'}`,
          borderRadius: '1rem',
          padding: '2.5rem 1.5rem',
          textAlign: 'center',
          backgroundColor: dragActive ? 'rgba(99, 102, 241, 0.08)' : 'rgba(15, 23, 42, 0.65)',
          cursor: scanning ? 'not-allowed' : 'pointer',
          transition: 'all 0.25s ease',
          position: 'relative'
        }}
      >
        <input
          type="file"
          accept=".zip,.py,.js,.ts,.json"
          disabled={scanning}
          onChange={handleChange}
          style={{
            position: 'absolute',
            inset: 0,
            opacity: 0,
            cursor: scanning ? 'not-allowed' : 'pointer',
            width: '100%',
            height: '100%'
          }}
        />

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{
            background: scanning ? 'rgba(99, 102, 241, 0.2)' : 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(168, 85, 247, 0.2))',
            padding: '1.1rem',
            borderRadius: '50%',
            color: '#818cf8',
            boxShadow: scanning ? '0 0 20px rgba(99, 102, 241, 0.4)' : 'none'
          }}>
            {scanning ? (
              <RefreshCw size={36} className="animate-spin" />
            ) : (
              <UploadCloud size={36} />
            )}
          </div>

          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#f8fafc', letterSpacing: '-0.01em' }}>
              {scanning ? 'Multi-Scanner Engine Running...' : 'Upload AI-Generated Code to Audit'}
            </h3>
            <p style={{ fontSize: '0.875rem', color: '#94a3b8', marginTop: '0.35rem', maxWidth: '520px', margin: '0.35rem auto 0' }}>
              {scanning
                ? 'Extracting to isolated sandbox and executing Semgrep AST, Gitleaks secrets, and OSV dependency analysis.'
                : 'Drag and drop a project archive (.zip) or source code file (.py, .js). Max size 25MB.'}
            </p>
          </div>

          {selectedFile && !scanning && (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: '#38bdf8',
              fontSize: '0.825rem',
              marginTop: '0.5rem',
              background: 'rgba(56, 189, 248, 0.1)',
              padding: '0.35rem 0.85rem',
              borderRadius: '9999px',
              border: '1px solid rgba(56, 189, 248, 0.25)'
            }}>
              {selectedFile.name.endsWith('.zip') ? <FileArchive size={15} /> : <FileCode size={15} />}
              <span>{selectedFile.name} ({formatFileSize(selectedFile.size)})</span>
            </div>
          )}
        </div>
      </div>

      {/* Scanning Stage Progress Indicator */}
      {scanning && (
        <div style={{
          marginTop: '1.5rem',
          padding: '1.25rem',
          background: 'rgba(99, 102, 241, 0.08)',
          border: '1px solid rgba(99, 102, 241, 0.25)',
          borderRadius: '0.75rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
            <span style={{ fontSize: '0.825rem', fontWeight: '700', color: '#c7d2fe' }}>
              Deterministic Multi-Scanner Pipeline
            </span>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
              In Progress...
            </span>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '0.75rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.775rem', color: '#cbd5e1' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#38bdf8', boxShadow: '0 0 8px #38bdf8' }} />
              <span>Semgrep (AST & Injections)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.775rem', color: '#cbd5e1' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f97316', boxShadow: '0 0 8px #f97316' }} />
              <span>Gitleaks (Secret & Token Entropy)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.775rem', color: '#cbd5e1' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#a855f7', boxShadow: '0 0 8px #a855f7' }} />
              <span>OSV-Scanner (Known CVEs)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.775rem', color: '#cbd5e1' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
              <span>Granite Guardian (Remediation)</span>
            </div>
          </div>
        </div>
      )}

      {/* Safety Notice */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.775rem', color: '#64748b', marginTop: '1.25rem' }}>
        <AlertTriangle size={14} color="#eab308" />
        <span>Safety Boundary: Static inspection only. Uploaded code is analyzed in an isolated sandbox and <strong>never executed</strong>.</span>
      </div>

    </div>
  );
}
