import React from 'react';
import { Shield, Database, FileText, ArrowRight } from 'lucide-react';
import GoogleAuthButton from './GoogleAuthButton';

export default function Navbar({ activeTab, setActiveTab, agentStatus, user, onLogin, onLogout }) {
  return (
    <header style={{
      position: 'sticky',
      top: '0',
      zIndex: 50,
      background: 'rgba(7, 9, 19, 0.75)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
    }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '4.75rem' }}>
        
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }} onClick={() => setActiveTab('auditor')}>
          <div style={{
            background: 'linear-gradient(135deg, #6366f1, #a855f7)',
            padding: '0.55rem',
            borderRadius: '0.75rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 25px rgba(99, 102, 241, 0.5)'
          }}>
            <Shield size={20} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ fontSize: '1.25rem', fontWeight: '800', letterSpacing: '-0.02em', color: '#ffffff' }}>
                ARGUS <span className="hero-brand-script" style={{ fontSize: '1.4rem' }}>AI</span>
              </span>
            </div>
          </div>
        </div>

        {/* Center Navigation Links (Pill Style) */}
        <nav style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.25rem',
          background: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '9999px',
          padding: '0.3rem 0.5rem'
        }}>
          <button
            onClick={() => setActiveTab('auditor')}
            style={{
              padding: '0.45rem 1rem',
              fontSize: '0.825rem',
              fontWeight: '600',
              borderRadius: '9999px',
              border: 'none',
              cursor: 'pointer',
              background: activeTab === 'auditor' ? 'rgba(99, 102, 241, 0.25)' : 'transparent',
              color: activeTab === 'auditor' ? '#c7d2fe' : '#94a3b8',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}
          >
            <Shield size={14} />
            Auditor
          </button>

          <button
            onClick={() => setActiveTab('research')}
            style={{
              padding: '0.45rem 1rem',
              fontSize: '0.825rem',
              fontWeight: '600',
              borderRadius: '9999px',
              border: 'none',
              cursor: 'pointer',
              background: activeTab === 'research' ? 'rgba(99, 102, 241, 0.25)' : 'transparent',
              color: activeTab === 'research' ? '#c7d2fe' : '#94a3b8',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}
          >
            <Database size={14} />
            Benchmark (40)
          </button>
        </nav>

        {/* Right Actions: Status + Google Auth */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          
          {/* IBM Agent Status Badge */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.35rem 0.8rem',
            borderRadius: '9999px',
            background: agentStatus?.live_ibm_configured ? 'rgba(16, 185, 129, 0.1)' : 'rgba(99, 102, 241, 0.1)',
            border: `1px solid ${agentStatus?.live_ibm_configured ? 'rgba(16, 185, 129, 0.25)' : 'rgba(99, 102, 241, 0.25)'}`,
            fontSize: '0.725rem',
            color: agentStatus?.live_ibm_configured ? '#34d399' : '#a5b4fc',
            fontWeight: '600'
          }}>
            <span style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              backgroundColor: agentStatus?.live_ibm_configured ? '#10b981' : '#6366f1',
              boxShadow: `0 0 8px ${agentStatus?.live_ibm_configured ? '#10b981' : '#6366f1'}`
            }} />
            <span>{agentStatus?.live_ibm_configured ? 'IBM watsonx Active' : 'IBM Granite Guardian'}</span>
          </div>

          {/* Google Authentication Button */}
          <GoogleAuthButton
            user={user}
            onLogin={onLogin}
            onLogout={onLogout}
          />

        </div>

      </div>
    </header>
  );
}
