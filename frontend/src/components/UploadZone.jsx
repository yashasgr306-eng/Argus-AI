import React, { useState } from 'react';
import { UploadCloud, FileArchive, Play, CheckCircle2, AlertTriangle, ShieldAlert } from 'lucide-react';

export default function UploadZone({ onFileUpload, onSampleLoad, scanning }) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState('');

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
      if (file.name.endsWith('.zip')) {
        setSelectedFileName(file.name);
        onFileUpload(file);
      } else {
        alert('Please upload a valid .zip archive.');
      }
    }
  };

  const handleChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.name.endsWith('.zip')) {
        setSelectedFileName(file.name);
        onFileUpload(file);
      } else {
        alert('Please upload a valid .zip archive.');
      }
    }
  };

  return (
    <div className="card" style={{ padding: '2rem', marginBottom: '2rem' }}>
      
      {/* Upload Drag & Drop Area */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        style={{
          border: `2px dashed ${dragActive ? '#38bdf8' : '#334155'}`,
          borderRadius: '0.75rem',
          padding: '2.5rem 1.5rem',
          textAlign: 'center',
          backgroundColor: dragActive ? 'rgba(56, 189, 248, 0.05)' : 'rgba(15, 23, 42, 0.6)',
          cursor: scanning ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s',
          position: 'relative'
        }}
      >
        <input
          type="file"
          accept=".zip"
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

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            background: 'rgba(56, 189, 248, 0.1)',
            padding: '1rem',
            borderRadius: '50%',
            color: '#38bdf8'
          }}>
            <UploadCloud size={36} />
          </div>

          <div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '700', color: '#f8fafc' }}>
              {scanning ? 'Analyzing Codebase with Multi-Scanner Layer...' : 'Upload Project ZIP to Scan'}
            </h3>
            <p style={{ fontSize: '0.875rem', color: '#94a3b8', marginTop: '0.25rem' }}>
              Drag and drop an archive or click to browse. Max size 25MB. Safe sandbox validation enforced.
            </p>
          </div>

          {selectedFileName && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#38bdf8', fontSize: '0.875rem', marginTop: '0.5rem' }}>
              <FileArchive size={16} />
              <span>Selected: {selectedFileName}</span>
            </div>
          )}
        </div>
      </div>

      {/* Safety Notice & 1-Click Demo Buttons */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginTop: '1.5rem' }}>
        
        {/* Safety Boundary Tag */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#94a3b8' }}>
          <AlertTriangle size={15} color="#eab308" />
          <span>Safety Boundary: Static inspection only. Uploaded code is <strong>never executed</strong>.</span>
        </div>

        {/* 1-Click Demo Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '600' }}>Quick Test:</span>
          
          <button
            onClick={() => onSampleLoad('vulnerable')}
            disabled={scanning}
            className="btn btn-danger"
            style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem' }}
          >
            <ShieldAlert size={14} />
            Scan Vulnerable Sample
          </button>

          <button
            onClick={() => onSampleLoad('clean')}
            disabled={scanning}
            className="btn btn-success"
            style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem' }}
          >
            <CheckCircle2 size={14} />
            Scan Clean Sample
          </button>
        </div>

      </div>

    </div>
  );
}
