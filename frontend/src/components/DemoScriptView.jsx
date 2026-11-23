import React from 'react';
import { Clock, CheckCircle2, Shield, Sparkles, RefreshCw, Database } from 'lucide-react';

export default function DemoScriptView({ onTriggerStep }) {
  const steps = [
    {
      time: "0:00 – 0:30",
      title: "Problem Pitch: AI-Generated Code is Vulnerable",
      action: "Explain problem context",
      speaker: (
        "“AI coding tools help developers ship 10x faster, but vibe-coded projects often contain subtle, critical vulnerabilities: unescaped SQL queries, command execution, hardcoded keys, and missing auth checks. Developers need deterministic scanners and an evidence-grounded AI agent to audit and remediate safely before production.”"
      ),
      icon: <Shield size={18} color="#ef4444" />
    },
    {
      time: "0:30 – 1:00",
      title: "Upload Intentionally Vulnerable Sample",
      action: "Click 'Scan Vulnerable Sample' on Dashboard",
      speaker: (
        "“We upload an archive containing AI-generated code. ARGUS AI enforces strict safety boundaries: zip path traversal is blocked, decompression ratios prevent zip bombs, and uploaded code is never executed.”"
      ),
      icon: <Shield size={18} color="#38bdf8" />,
      trigger: "vulnerable"
    },
    {
      time: "1:00 – 1:40",
      title: "Multi-Scanner Deterministic Findings",
      action: "Review findings table with masked secrets",
      speaker: (
        "“Deterministic scanners are our source of truth. Semgrep caught SQL Injection and shell execution; Gitleaks flagged an exposed AWS key and JWT secret—automatically masking the secret in logs, UI, and payloads; OSV-Scanner detected known CVEs in requirements.txt.”"
      ),
      icon: <Shield size={18} color="#fb923c" />
    },
    {
      time: "1:40 – 2:15",
      title: "IBM Security Review Agent Explanation",
      action: "Click 'Explain with AI' on a finding",
      speaker: (
        "“We ask our IBM watsonx / Granite Security Review Agent to analyze the finding. Notice it only receives sanitized evidence—never raw secrets. It explains the vulnerability in plain language, calculates real-world impact, and provides a safer parameterized code pattern with verification steps.”"
      ),
      icon: <Sparkles size={18} color="#a855f7" />
    },
    {
      time: "2:15 – 2:45",
      title: "Human Approval & Rescan Verification",
      action: "Click 'Apply Fix & Verify with Rescan'",
      speaker: (
        "“A patch is never verified just because an AI suggested it. ARGUS enforces human review and a fresh rescan. On rescan, the before-and-after view shows the finding resolved and the prototype security score updated from 0 to 100.”"
      ),
      icon: <RefreshCw size={18} color="#10b981" />
    },
    {
      time: "2:45 – 3:00",
      title: "Research Benchmark Results (Track R1)",
      action: "Switch to 'Research Benchmark' Tab",
      speaker: (
        "“For our research track, we evaluated 40 seeded micro-benchmarks. We achieved high precision, zero hallucinated scanner rules, and an actionability rating of 4.8/5.0 with 100% secret redaction compliance.”"
      ),
      icon: <Database size={18} color="#38bdf8" />
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="card" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <Clock size={24} color="#38bdf8" />
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#f8fafc' }}>
            3-Minute Hackathon Demo Script
          </h2>
        </div>
        <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
          Exact script and timing guide aligned with the Zero-to-Hackathon Roadmap (Page 6).
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {steps.map((s, idx) => (
          <div key={idx} className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span className="badge badge-scanner" style={{ fontSize: '0.75rem' }}>
                  {s.time}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, color: '#f8fafc' }}>
                  {s.icon}
                  {s.title}
                </div>
              </div>

              {s.trigger && (
                <button
                  onClick={() => onTriggerStep(s.trigger)}
                  className="btn btn-primary"
                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                >
                  Run Step in Auditor
                </button>
              )}
            </div>

            <div style={{ background: '#090d16', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #1e293b', marginBottom: '0.5rem' }}>
              <div style={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                Recommended Pitch Line:
              </div>
              <p style={{ fontSize: '0.875rem', color: '#cbd5e1', fontStyle: 'italic', lineHeight: '1.6' }}>
                {s.speaker}
              </p>
            </div>

            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
              <strong>Demo Action:</strong> {s.action}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
