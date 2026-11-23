import React, { useState, useEffect, useRef } from 'react';
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
  ArrowRight,
  Play,
  Terminal,
  Lock,
  Cpu,
  Sparkles,
  UserCheck,
  RefreshCw,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('auditor');
  const [agentStatus, setAgentStatus] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  const [currentScan, setCurrentScan] = useState(null);
  const [previousScan, setPreviousScan] = useState(null);
  const [showRescanDiff, setShowRescanDiff] = useState(false);
  const [activeScenario, setActiveScenario] = useState('vulnerable');

  const [selectedFinding, setSelectedFinding] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const dashboardRef = useRef(null);

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

    // Pre-populate with initial scenario state
    setCurrentScan(FALLBACK_VULNERABLE_SCAN);
    setActiveScenario('vulnerable');
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

    // Scroll into dashboard
    setTimeout(() => {
      dashboardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);

    try {
      const scanData = await uploadAndScan(file);
      setPreviousScan(null);
      setCurrentScan(scanData);
      setActiveScenario('custom');
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

    // Smoothly scroll down to dashboard immediately so user sees it in action!
    setTimeout(() => {
      dashboardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);

    try {
      const scanData = await scanDemoSample(sampleType);
      setPreviousScan(null);
      setCurrentScan(scanData);
      setActiveScenario(sampleType);
    } catch (err) {
      console.warn('Sample scan API fallback:', err);
      setPreviousScan(null);
      setCurrentScan(sampleType === 'vulnerable' ? FALLBACK_VULNERABLE_SCAN : FALLBACK_CLEAN_SCAN);
      setActiveScenario(sampleType);
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
      setActiveScenario('clean');
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
    : '#ef4444';

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

        {/* Tab 1: Security Auditor (The Landing & Live Interactive Window) */}
        {activeTab === 'auditor' && (
          <div>
            {/* HERO SECTION */}
            <section style={{ textAlign: 'center', paddingTop: '4rem', paddingBottom: '3rem' }}>
              <div className="container" style={{ maxWidth: '900px' }}>
                {/* Pill Chip */}
                <div style={{ display: 'inline-flex', marginBottom: '1.75rem' }}>
                  <div
                    className="badge badge-pill-aura"
                    style={{
                      padding: '0.45rem 1.15rem',
                      fontSize: '0.8rem',
                      letterSpacing: '0.02em',
                      textTransform: 'none'
                    }}
                  >
                    <span>✦ AI-Powered Security Auditor</span>
                    <span style={{ opacity: 0.5, margin: '0 0.5rem' }}>|</span>
                    <span style={{ color: '#a5b4fc' }}>IBM Research Track R1</span>
                  </div>
                </div>

                {/* Giant Headline */}
                <h1
                  style={{
                    fontSize: 'clamp(2.5rem, 5.5vw, 4.25rem)',
                    fontWeight: '800',
                    lineHeight: '1.1',
                    letterSpacing: '-0.035em',
                    color: '#ffffff',
                    marginBottom: '1.5rem'
                  }}
                >
                  AI-Powered Security Auditor
                  <br />
                  for <span className="hero-brand-script">AI-Generated Code</span>
                </h1>

                {/* Subtitle */}
                <p
                  style={{
                    fontSize: '1.1rem',
                    color: '#94a3b8',
                    lineHeight: '1.6',
                    maxWidth: '680px',
                    margin: '0 auto 2.25rem'
                  }}
                >
                  Unlock the power of deterministic security scanners (Semgrep, Gitleaks, OSV) paired with IBM watsonx &
                  Granite Guardian to audit, explain, and verify AI-generated code.
                </p>

                {/* Hero Action Buttons */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '1rem',
                    flexWrap: 'wrap'
                  }}
                >
                  <button
                    onClick={() => handleSampleLoad('vulnerable')}
                    disabled={scanning}
                    className="btn btn-white-pill"
                    style={{ padding: '0.75rem 1.75rem', fontSize: '0.925rem' }}
                  >
                    {scanning && activeScenario === 'vulnerable' ? (
                      <RefreshCw size={16} className="animate-spin" />
                    ) : (
                      <>
                        <span>Test Vulnerable Prototype</span>
                        <ArrowRight size={16} />
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleSampleLoad('clean')}
                    disabled={scanning}
                    className="btn btn-secondary"
                    style={{ padding: '0.75rem 1.75rem', fontSize: '0.925rem' }}
                  >
                    {scanning && activeScenario === 'clean' ? (
                      <RefreshCw size={16} className="animate-spin" />
                    ) : (
                      <span>✨ Test Remediated Clean</span>
                    )}
                  </button>
                </div>
              </div>
            </section>

            {/* HERO CENTERPIECE: MAC WINDOW DASHBOARD */}
            <section className="container" style={{ marginBottom: '5rem' }} ref={dashboardRef}>
              <div className="mac-window">
                {/* Window Title Bar */}
                <div className="mac-titlebar">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <span className="mac-dot" style={{ backgroundColor: '#ef4444' }} />
                    <span className="mac-dot" style={{ backgroundColor: '#eab308' }} />
                    <span className="mac-dot" style={{ backgroundColor: '#22c55e' }} />
                  </div>

                  <div
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      padding: '0.25rem 1rem',
                      borderRadius: '9999px',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      fontSize: '0.75rem',
                      color: '#94a3b8',
                      fontFamily: 'monospace'
                    }}
                  >
                    argus.ai/audit-dashboard
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontSize: '0.725rem',
                      color: '#10b981'
                    }}
                  >
                    <span
                      style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: '#10b981',
                        display: 'inline-block'
                      }}
                    />
                    <span>IBM Granite Active</span>
                  </div>
                </div>

                {/* Inner Window Dashboard */}
                <div style={{ padding: '2rem' }}>
                  {/* Dashboard Header */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '1.75rem',
                      flexWrap: 'wrap',
                      gap: '1rem'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div
                          style={{
                            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                            width: '36px',
                            height: '36px',
                            borderRadius: '0.6rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <Shield size={20} color="#ffffff" />
                        </div>
                        <h2
                          style={{
                            fontSize: '1.5rem',
                            fontWeight: '800',
                            color: '#ffffff',
                            letterSpacing: '-0.02em'
                          }}
                        >
                          Dashboard
                        </h2>
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.65rem',
                          marginTop: '0.2rem',
                          flexWrap: 'wrap'
                        }}
                      >
                        <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                          Live Security Review Agent
                        </span>
                        {currentUser && (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              padding: '0.15rem 0.55rem',
                              borderRadius: '9999px',
                              background: 'rgba(99, 102, 241, 0.15)',
                              border: '1px solid rgba(99, 102, 241, 0.35)',
                              color: '#c7d2fe',
                              fontSize: '0.725rem',
                              fontWeight: '500'
                            }}
                          >
                            <UserCheck size={12} color="#818cf8" />
                            <span>
                              Signed in as <strong>{currentUser.email}</strong>
                            </span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Active Scenario Indicator */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Loaded Target:</span>
                      <span
                        style={{
                          padding: '0.35rem 0.85rem',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          fontWeight: '700',
                          background:
                            activeScenario === 'vulnerable'
                              ? 'rgba(239, 68, 68, 0.15)'
                              : activeScenario === 'clean'
                              ? 'rgba(16, 185, 129, 0.15)'
                              : 'rgba(56, 189, 248, 0.15)',
                          color:
                            activeScenario === 'vulnerable'
                              ? '#f87171'
                              : activeScenario === 'clean'
                              ? '#34d399'
                              : '#38bdf8',
                          border: `1px solid ${
                            activeScenario === 'vulnerable'
                              ? 'rgba(239, 68, 68, 0.3)'
                              : activeScenario === 'clean'
                              ? 'rgba(16, 185, 129, 0.3)'
                              : 'rgba(56, 189, 248, 0.3)'
                          }`
                        }}
                      >
                        {activeScenario === 'vulnerable'
                          ? '⚠️ vulnerable_project.zip (8 Flaws)'
                          : activeScenario === 'clean'
                          ? '✨ clean_project.zip (Score 85)'
                          : `📂 ${currentScan?.filename || 'custom_upload.zip'}`}
                      </span>
                    </div>
                  </div>

                  {/* 3 Metric Cards Row */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                      gap: '1.25rem',
                      marginBottom: '2rem'
                    }}
                  >
                    {/* Card 1: Security Score */}
                    <div className="card-stat">
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          marginBottom: '0.75rem'
                        }}
                      >
                        <div>
                          <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: '600' }}>
                            Security Score & Audits
                          </div>
                          <div
                            style={{
                              fontSize: '1.75rem',
                              fontWeight: '800',
                              color: scoreColor,
                              marginTop: '0.25rem'
                            }}
                          >
                            {currentScan ? Math.round(currentScan.score) : 0}{' '}
                            <span style={{ fontSize: '0.9rem', color: '#64748b' }}>/ 100</span>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Posture Status</div>
                          <div
                            style={{
                              fontSize: '0.85rem',
                              fontWeight: '700',
                              color: currentScan?.score >= 80 ? '#34d399' : '#f87171',
                              marginTop: '0.25rem'
                            }}
                          >
                            {currentScan?.score >= 80 ? '✓ Verified Secure' : '⚠️ Action Required'}
                          </div>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div
                        style={{
                          width: '100%',
                          height: '6px',
                          background: 'rgba(255, 255, 255, 0.08)',
                          borderRadius: '9999px',
                          overflow: 'hidden',
                          marginTop: '1.25rem'
                        }}
                      >
                        <div
                          style={{
                            width: `${currentScan ? Math.max(5, currentScan.score) : 5}%`,
                            height: '100%',
                            background: `linear-gradient(90deg, ${scoreColor}, #6366f1)`,
                            borderRadius: '9999px',
                            boxShadow: `0 0 10px ${scoreColor}`
                          }}
                        />
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontSize: '0.725rem',
                          color: '#64748b',
                          marginTop: '0.5rem'
                        }}
                      >
                        <span>Target: {currentScan?.filename || 'codebase'}</span>
                        <span>{currentScan?.total_findings || 0} Flaws Detected</span>
                      </div>
                    </div>

                    {/* Card 2: Vulnerability Summary */}
                    <div className="card-stat">
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '0.75rem'
                        }}
                      >
                        <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: '600' }}>
                          Vulnerability Summary
                        </div>
                        <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Deterministic AST</span>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ color: '#cbd5e1' }}>Command Injections (Semgrep)</span>
                          <strong style={{ color: currentScan?.critical_count > 0 ? '#f87171' : '#34d399' }}>
                            {currentScan?.critical_count || 0} Critical
                          </strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ color: '#cbd5e1' }}>Exposed Secrets (Gitleaks)</span>
                          <strong
                            style={{
                              color:
                                currentScan?.findings?.filter((f) => f.scanner_name === 'gitleaks').length > 0
                                  ? '#fb923c'
                                  : '#34d399'
                            }}
                          >
                            {currentScan?.findings?.filter((f) => f.scanner_name === 'gitleaks').length || 0} Leaked
                          </strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ color: '#cbd5e1' }}>Vulnerable Dependencies (OSV)</span>
                          <strong
                            style={{
                              color:
                                currentScan?.findings?.filter((f) => f.scanner_name === 'osv-scanner').length > 0
                                  ? '#c084fc'
                                  : '#34d399'
                            }}
                          >
                            {currentScan?.findings?.filter((f) => f.scanner_name === 'osv-scanner').length || 0} CVEs
                          </strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ color: '#cbd5e1' }}>Access Control Checks</span>
                          <strong style={{ color: '#38bdf8' }}>Grounded Analysis</strong>
                        </div>
                      </div>
                    </div>

                    {/* Card 3: Real-Time Threats */}
                    <div
                      className="card-stat"
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        paddingBottom: '0.5rem'
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: '600' }}>
                          Real-time Threats
                        </div>
                        <div
                          style={{
                            fontSize: '2.5rem',
                            fontWeight: '800',
                            color: '#ffffff',
                            marginTop: '0.2rem',
                            lineHeight: '1'
                          }}
                        >
                          {currentScan ? currentScan.total_findings : 0}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
                          active flaws in analyzed code
                        </div>
                      </div>

                      {/* Sparkline wave */}
                      <div style={{ marginTop: '0.5rem' }}>
                        <svg
                          viewBox="0 0 200 45"
                          style={{ width: '100%', height: '40px', overflow: 'visible' }}
                        >
                          <defs>
                            <linearGradient id="waveGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                              <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.4" />
                              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
                            </linearGradient>
                          </defs>
                          <path
                            d="M 0 35 Q 35 15, 70 30 T 140 10 T 200 25 L 200 45 L 0 45 Z"
                            fill="url(#waveGrad)"
                          />
                          <path
                            d="M 0 35 Q 35 15, 70 30 T 140 10 T 200 25"
                            fill="none"
                            stroke="#8b5cf6"
                            strokeWidth="2.5"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Rescan Comparison (when triggered) */}
                  {showRescanDiff && previousScan && currentScan && (
                    <div style={{ marginBottom: '2rem' }}>
                      <RescanComparison
                        originalScan={previousScan}
                        rescanScan={currentScan}
                        onDismiss={() => setShowRescanDiff(false)}
                      />
                    </div>
                  )}

                  {/* Upload Dropzone */}
                  <div style={{ marginBottom: '2rem' }}>
                    <UploadZone onFileUpload={handleFileUpload} scanning={scanning} />
                  </div>

                  {/* Findings Table */}
                  {currentScan && (
                    <FindingsTable
                      findings={currentScan.findings || []}
                      onSelectFinding={setSelectedFinding}
                      selectedFindingId={selectedFinding?.id}
                    />
                  )}
                </div>
              </div>
            </section>

            {/* TRUSTED BY TEAMS & ENGINES */}
            <section
              style={{
                textAlign: 'center',
                paddingBottom: '5rem',
                borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
              }}
            >
              <div className="container">
                <p
                  style={{
                    fontSize: '0.8rem',
                    color: '#64748b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    fontWeight: '600',
                    marginBottom: '1.75rem'
                  }}
                >
                  Powered by Multi-Engine Deterministic Scanners & IBM watsonx
                </p>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '2.5rem',
                    flexWrap: 'wrap',
                    opacity: 0.8
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      color: '#94a3b8',
                      fontWeight: '700',
                      fontSize: '0.95rem'
                    }}
                  >
                    <Terminal size={18} color="#38bdf8" />
                    <span>SEMGREP</span>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      color: '#94a3b8',
                      fontWeight: '700',
                      fontSize: '0.95rem'
                    }}
                  >
                    <Lock size={18} color="#f97316" />
                    <span>GITLEAKS</span>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      color: '#94a3b8',
                      fontWeight: '700',
                      fontSize: '0.95rem'
                    }}
                  >
                    <Shield size={18} color="#a855f7" />
                    <span>OSV-SCANNER</span>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      color: '#94a3b8',
                      fontWeight: '700',
                      fontSize: '0.95rem'
                    }}
                  >
                    <Cpu size={18} color="#10b981" />
                    <span>IBM watsonx</span>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      color: '#94a3b8',
                      fontWeight: '700',
                      fontSize: '0.95rem'
                    }}
                  >
                    <Sparkles size={18} color="#6366f1" />
                    <span>GRANITE GUARDIAN</span>
                  </div>
                </div>
              </div>
            </section>

            {/* EVIDENCE-GROUNDED AI REVIEWS SECTION */}
            <section style={{ paddingTop: '5rem', paddingBottom: '5rem' }}>
              <div className="container">
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
                    gap: '3rem',
                    alignItems: 'center'
                  }}
                >
                  {/* Left: Mini macOS App Mockup */}
                  <div className="mac-window" style={{ boxShadow: '0 20px 50px rgba(0,0,0,0.6)' }}>
                    <div className="mac-titlebar">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span className="mac-dot" style={{ backgroundColor: '#ef4444' }} />
                        <span className="mac-dot" style={{ backgroundColor: '#eab308' }} />
                        <span className="mac-dot" style={{ backgroundColor: '#22c55e' }} />
                      </div>
                      <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontFamily: 'monospace' }}>
                        Remediation Verification · app.py
                      </span>
                      <span style={{ fontSize: '0.7rem', color: '#818cf8', fontWeight: '600' }}>
                        Granite Guardian
                      </span>
                    </div>

                    <div style={{ padding: '1.5rem', background: '#0a0e1a' }}>
                      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.5rem' }}>
                            Command Injection (CWE-78) Remediation Diff
                          </div>

                          {/* Code Diff Simulation */}
                          <div
                            style={{
                              background: '#070a12',
                              border: '1px solid rgba(255,255,255,0.06)',
                              borderRadius: '0.5rem',
                              padding: '0.75rem',
                              fontSize: '0.725rem',
                              fontFamily: 'monospace',
                              lineHeight: '1.6'
                            }}
                          >
                            <div style={{ color: '#f87171' }}>- os.system("ping -c 1 " + host)</div>
                            <div style={{ color: '#34d399' }}>
                              + subprocess.run(["ping", "-c", "1", host], check=True)
                            </div>
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => {
                            if (currentScan?.findings?.[0]) {
                              setSelectedFinding(currentScan.findings[0]);
                            }
                          }}
                          className="btn btn-primary"
                          style={{ padding: '0.45rem 1rem', fontSize: '0.75rem' }}
                        >
                          <Play size={12} fill="#ffffff" />
                          <span>Review with IBM Agent</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Right: Research Summary */}
                  <div>
                    <h2
                      style={{
                        fontSize: 'clamp(2rem, 3.5vw, 2.75rem)',
                        fontWeight: '800',
                        letterSpacing: '-0.03em',
                        color: '#ffffff',
                        lineHeight: '1.2',
                        marginBottom: '1.25rem'
                      }}
                    >
                      Evidence-Grounded AI Reviews
                      <br />
                      <span className="hero-brand-script" style={{ fontSize: 'clamp(2.4rem, 4vw, 3.25rem)' }}>
                        Built on Empirical Research
                      </span>
                    </h2>

                    <p style={{ fontSize: '1rem', color: '#94a3b8', lineHeight: '1.65', marginBottom: '2rem' }}>
                      ARGUS evaluates AI-generated code against 40 real-world benchmark samples. Every finding pairs
                      deterministic static rules with grounded IBM Granite remediation guidance and automated rescan
                      verification.
                    </p>

                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => setActiveTab('research')}
                        className="btn btn-white-pill"
                        style={{ padding: '0.65rem 1.5rem', fontSize: '0.85rem' }}
                      >
                        <span>Inspect 40 Benchmarks</span>
                        <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </section>
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
