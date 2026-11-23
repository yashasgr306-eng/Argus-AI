import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import UploadZone from './components/UploadZone';
import FindingsTable from './components/FindingsTable';
import FindingDetailModal from './components/FindingDetailModal';
import RescanComparison from './components/RescanComparison';
import ResearchBenchmarkView from './components/ResearchBenchmarkView';
import {
  uploadAndScan,
  scanDemoSample,
  rescanProject,
  getAgentStatus,
  loginWithGoogle,
  getCurrentUser,
  logoutUser,
  FALLBACK_VULNERABLE_SCAN,
  FALLBACK_CLEAN_SCAN
} from './api';
import {
  Shield,
  AlertTriangle,
  CheckCircle2,
  Terminal,
  Key,
  Package,
  Sparkles,
  UserCheck,
  RefreshCw,
  FileCode,
  Layers
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('auditor');
  const [agentStatus, setAgentStatus] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  const [currentScan, setCurrentScan] = useState(null);
  const [previousScan, setPreviousScan] = useState(null);
  const [showRescanDiff, setShowRescanDiff] = useState(false);

  const [selectedFinding, setSelectedFinding] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    // 1. Fetch live IBM agent status
    getAgentStatus().then(setAgentStatus).catch(console.error);

    // 2. Restore cached user session if available
    const savedUser = localStorage.getItem('ARGUS_AUTH_USER');
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch (e) {}
    }

    // 3. Verify server-side auth status
    getCurrentUser()
      .then((user) => {
        if (user) {
          setCurrentUser(user);
          localStorage.setItem('ARGUS_AUTH_USER', JSON.stringify(user));
        }
      })
      .catch(console.warn);
  }, []);

  const handleGoogleLogin = async (credentialResponse) => {
    try {
      const user = await loginWithGoogle(credentialResponse || null);
      if (user) {
        setCurrentUser(user);
        localStorage.setItem('ARGUS_AUTH_USER', JSON.stringify(user));
      }
    } catch (err) {
      console.error('Google Sign-In failed:', err);
      setErrorMsg(`Google Sign-In error: ${err.message || 'Verification failed'}`);
    }
  };

  const handleGoogleLogout = async () => {
    try {
      await logoutUser();
    } catch (err) {
      console.warn('Logout API error:', err);
    }
    localStorage.removeItem('ARGUS_AUTH_USER');
    setCurrentUser(null);
  };

  const handleFileUpload = async (file) => {
    setScanning(true);
    setErrorMsg('');
    setShowRescanDiff(false);
    try {
      const scanData = await uploadAndScan(file);
      setPreviousScan(null);
      setCurrentScan(scanData);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to scan uploaded code archive.');
    } finally {
      setScanning(false);
    }
  };

  const handleSampleLoad = async (sampleType) => {
    setScanning(true);
    setErrorMsg('');
    setShowRescanDiff(false);
    try {
      const scanData = await scanDemoSample(sampleType);
      setPreviousScan(null);
      setCurrentScan(scanData);
    } catch (err) {
      console.warn('Sample scan API fallback:', err);
      setPreviousScan(null);
      setCurrentScan(sampleType === 'vulnerable' ? FALLBACK_VULNERABLE_SCAN : FALLBACK_CLEAN_SCAN);
    } finally {
      setScanning(false);
    }
  };

  const handleRescan = async (finding, fixCode) => {
    if (!currentScan) return;
    setScanning(true);
    try {
      const rescanData = await rescanProject(currentScan.id, {
        [finding.file_path]: fixCode
      });
      setPreviousScan(currentScan);
      setCurrentScan(rescanData);
      setShowRescanDiff(true);
    } catch (err) {
      setErrorMsg(`Rescan verification error: ${err.message}`);
    } finally {
      setScanning(false);
    }
  };

  const handleUpdateFindingReview = (findingId, reviewData) => {
    if (!currentScan) return;
    setCurrentScan((prev) => ({
      ...prev,
      findings: prev.findings.map((f) => (f.id === findingId ? { ...f, review: reviewData } : f))
    }));
  };

  const scoreColor = currentScan
    ? currentScan.score >= 80
      ? '#10b981'
      : currentScan.score >= 50
      ? '#eab308'
      : '#ef4444'
    : '#94a3b8';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {/* Background Ambient Glow */}
      <div className="ambient-glow" />

      {/* Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        agentStatus={agentStatus}
        user={currentUser}
        onLogin={handleGoogleLogin}
        onLogout={handleGoogleLogout}
      />

      {/* Main Content Area */}
      <main style={{ flex: 1, paddingBottom: '5rem', position: 'relative', zIndex: 10 }}>
        {/* Error Notification */}
        {errorMsg && (
          <div className="container" style={{ paddingTop: '1.5rem' }}>
            <div
              style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                color: '#fca5a5',
                padding: '1rem',
                borderRadius: '0.75rem',
                fontSize: '0.875rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem'
              }}
            >
              <div>
                <strong>Error: </strong> {errorMsg}
              </div>
              <button
                onClick={() => setErrorMsg('')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#fca5a5',
                  cursor: 'pointer',
                  fontWeight: 700
                }}
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Tab 1: Security Auditor */}
        {activeTab === 'auditor' && (
          <div className="container" style={{ paddingTop: '2.5rem' }}>
            {/* Page Header */}
            <div style={{ marginBottom: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <span className="badge badge-scanner">AI Security Auditor</span>
                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>IBM Research Track R1</span>
                  </div>
                  <h1 style={{ fontSize: '2rem', fontWeight: '800', color: '#ffffff', letterSpacing: '-0.025em' }}>
                    Codebase Security Auditor
                  </h1>
                  <p style={{ fontSize: '0.95rem', color: '#94a3b8', marginTop: '0.35rem', maxWidth: '720px' }}>
                    Deterministic multi-scanner layer (Semgrep AST, Gitleaks secrets, OSV dependencies) paired with IBM watsonx & Granite Guardian for verified remediation of AI-generated code.
                  </p>
                </div>

                {currentUser && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.45rem 0.85rem',
                      borderRadius: '0.75rem',
                      background: 'rgba(99, 102, 241, 0.1)',
                      border: '1px solid rgba(99, 102, 241, 0.25)',
                      fontSize: '0.8rem',
                      color: '#c7d2fe'
                    }}
                  >
                    <UserCheck size={14} color="#818cf8" />
                    <span>
                      Auditing as <strong>{currentUser.email}</strong>
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Direct Code Upload Zone */}
            <UploadZone onFileUpload={handleFileUpload} scanning={scanning} />

            {/* If No Scan Loaded: Show Scanner Capabilities Grid */}
            {!currentScan && !scanning && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                  gap: '1.25rem',
                  marginBottom: '2rem'
                }}
              >
                <div className="card" style={{ padding: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.75rem' }}>
                    <div
                      style={{
                        background: 'rgba(56, 189, 248, 0.15)',
                        padding: '0.5rem',
                        borderRadius: '0.5rem',
                        color: '#38bdf8'
                      }}
                    >
                      <Terminal size={18} />
                    </div>
                    <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#f8fafc' }}>Semgrep SAST</h3>
                  </div>
                  <p style={{ fontSize: '0.825rem', color: '#94a3b8', lineHeight: '1.55' }}>
                    Static Abstract Syntax Tree analysis targeting command injections, SQLi, SSRF, and broken access controls in AI-generated code.
                  </p>
                </div>

                <div className="card" style={{ padding: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.75rem' }}>
                    <div
                      style={{
                        background: 'rgba(249, 115, 22, 0.15)',
                        padding: '0.5rem',
                        borderRadius: '0.5rem',
                        color: '#f97316'
                      }}
                    >
                      <Key size={18} />
                    </div>
                    <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#f8fafc' }}>Gitleaks Entropy</h3>
                  </div>
                  <p style={{ fontSize: '0.825rem', color: '#94a3b8', lineHeight: '1.55' }}>
                    Regex and Shannon entropy scanner detecting hardcoded API keys, AWS credentials, JWT tokens, and private secrets.
                  </p>
                </div>

                <div className="card" style={{ padding: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.75rem' }}>
                    <div
                      style={{
                        background: 'rgba(168, 85, 247, 0.15)',
                        padding: '0.5rem',
                        borderRadius: '0.5rem',
                        color: '#a855f7'
                      }}
                    >
                      <Package size={18} />
                    </div>
                    <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#f8fafc' }}>OSV-Scanner</h3>
                  </div>
                  <p style={{ fontSize: '0.825rem', color: '#94a3b8', lineHeight: '1.55' }}>
                    Audits project dependencies (e.g. requirements.txt) against the Open Source Vulnerabilities database for known CVEs.
                  </p>
                </div>

                <div className="card" style={{ padding: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.75rem' }}>
                    <div
                      style={{
                        background: 'rgba(16, 185, 129, 0.15)',
                        padding: '0.5rem',
                        borderRadius: '0.5rem',
                        color: '#10b981'
                      }}
                    >
                      <Sparkles size={18} />
                    </div>
                    <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#f8fafc' }}>IBM Granite Guardian</h3>
                  </div>
                  <p style={{ fontSize: '0.825rem', color: '#94a3b8', lineHeight: '1.55' }}>
                    Contextual remediation reasoning with interactive code diffs and automated rescan verification.
                  </p>
                </div>
              </div>
            )}

            {/* If Scan Loaded: Display Posture Summary and Findings */}
            {currentScan && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {/* 3 Metric Summary Cards */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: '1.25rem'
                  }}
                >
                  {/* Card 1: Security Posture Score */}
                  <div className="card-stat">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                      <div>
                        <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: '600' }}>
                          Security Posture Score
                        </div>
                        <div style={{ fontSize: '2.25rem', fontWeight: '800', color: scoreColor, marginTop: '0.2rem' }}>
                          {Math.round(currentScan.score)} <span style={{ fontSize: '1rem', color: '#64748b' }}>/ 100</span>
                        </div>
                      </div>
                      <span
                        style={{
                          padding: '0.3rem 0.75rem',
                          borderRadius: '9999px',
                          fontSize: '0.725rem',
                          fontWeight: 700,
                          background: currentScan.score >= 80 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                          color: currentScan.score >= 80 ? '#34d399' : '#f87171',
                          border: `1px solid ${currentScan.score >= 80 ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
                        }}
                      >
                        {currentScan.score >= 80 ? '✓ Verified Secure' : '⚠️ Flaws Detected'}
                      </span>
                    </div>

                    {/* Score Bar */}
                    <div
                      style={{
                        width: '100%',
                        height: '6px',
                        background: 'rgba(255, 255, 255, 0.08)',
                        borderRadius: '9999px',
                        overflow: 'hidden',
                        marginTop: '0.75rem'
                      }}
                    >
                      <div
                        style={{
                          width: `${Math.max(5, currentScan.score)}%`,
                          height: '100%',
                          background: `linear-gradient(90deg, ${scoreColor}, #6366f1)`,
                          borderRadius: '9999px'
                        }}
                      />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b', marginTop: '0.5rem' }}>
                      <span>Target: {currentScan.filename}</span>
                      <span>Total Findings: {currentScan.total_findings}</span>
                    </div>
                  </div>

                  {/* Card 2: Severity Breakdown */}
                  <div className="card-stat">
                    <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: '600', marginBottom: '0.75rem' }}>
                      Severity Breakdown
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.825rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#cbd5e1' }}>Critical Severity</span>
                        <strong style={{ color: currentScan.critical_count > 0 ? '#f87171' : '#10b981' }}>
                          {currentScan.critical_count}
                        </strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#cbd5e1' }}>High Severity</span>
                        <strong style={{ color: currentScan.high_count > 0 ? '#fb923c' : '#10b981' }}>
                          {currentScan.high_count}
                        </strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#cbd5e1' }}>Medium Severity</span>
                        <strong style={{ color: currentScan.medium_count > 0 ? '#eab308' : '#10b981' }}>
                          {currentScan.medium_count}
                        </strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#cbd5e1' }}>Low / Informational</span>
                        <strong style={{ color: '#94a3b8' }}>{currentScan.low_count}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Card 3: Multi-Engine Coverage */}
                  <div className="card-stat" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: '600', marginBottom: '0.75rem' }}>
                        Scanner Engine Breakdown
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.825rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ color: '#38bdf8' }}>Semgrep AST Rules</span>
                          <strong style={{ color: '#f8fafc' }}>
                            {currentScan.findings?.filter((f) => f.scanner_name === 'semgrep').length || 0}
                          </strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ color: '#f97316' }}>Gitleaks Secrets</span>
                          <strong style={{ color: '#f8fafc' }}>
                            {currentScan.findings?.filter((f) => f.scanner_name === 'gitleaks').length || 0}
                          </strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ color: '#a855f7' }}>OSV-Scanner CVEs</span>
                          <strong style={{ color: '#f8fafc' }}>
                            {currentScan.findings?.filter((f) => f.scanner_name === 'osv-scanner').length || 0}
                          </strong>
                        </div>
                      </div>
                    </div>

                    <div style={{ marginTop: '0.85rem', display: 'flex', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => setCurrentScan(null)}
                        style={{
                          background: 'transparent',
                          border: '1px solid rgba(255, 255, 255, 0.12)',
                          color: '#94a3b8',
                          padding: '0.35rem 0.75rem',
                          borderRadius: '0.5rem',
                          fontSize: '0.75rem',
                          cursor: 'pointer'
                        }}
                      >
                        Scan Another Codebase
                      </button>
                    </div>
                  </div>
                </div>

                {/* Rescan Comparison (when rescan verification has executed) */}
                {showRescanDiff && previousScan && currentScan && (
                  <RescanComparison
                    originalScan={previousScan}
                    rescanScan={currentScan}
                    onDismiss={() => setShowRescanDiff(false)}
                  />
                )}

                {/* Findings Table */}
                <FindingsTable
                  findings={currentScan.findings || []}
                  onSelectFinding={setSelectedFinding}
                  selectedFindingId={selectedFinding?.id}
                />
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Research Benchmark View */}
        {activeTab === 'research' && (
          <div className="container" style={{ paddingTop: '2.5rem' }}>
            <ResearchBenchmarkView />
          </div>
        )}

        {/* Finding Detail / IBM Granite Guardian Modal */}
        {selectedFinding && (
          <FindingDetailModal
            finding={selectedFinding}
            onClose={() => setSelectedFinding(null)}
            onRescan={handleRescan}
            onUpdateFindingReview={handleUpdateFindingReview}
          />
        )}
      </main>

      {/* Footer */}
      <footer
        style={{
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '2rem 0',
          background: '#070913',
          textAlign: 'center',
          fontSize: '0.8rem',
          color: '#64748b',
          position: 'relative',
          zIndex: 10
        }}
      >
        <div className="container">
          <p>
            ARGUS AI · IBM watsonx Orchestrate & Granite Guardian Security Review Agent · Built for Hackathon Track R1
          </p>
        </div>
      </footer>
    </div>
  );
}
