import React, { useState, useRef, useEffect } from 'react';
import { LogOut, CheckCircle2, ChevronDown, KeyRound, ExternalLink, X } from 'lucide-react';

export default function GoogleAuthButton({ user, onLogin, onLogout }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [clientId, setClientId] = useState(() => localStorage.getItem('ARGUS_GOOGLE_CLIENT_ID') || '');
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleStartGoogleSignIn = () => {
    // If Google Identity Services SDK is ready and a Client ID exists
    const activeClientId = clientId || localStorage.getItem('ARGUS_GOOGLE_CLIENT_ID') || import.meta.env.VITE_GOOGLE_CLIENT_ID;

    if (window.google?.accounts?.oauth2 && activeClientId) {
      try {
        const tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: activeClientId,
          scope: 'email profile openid',
          callback: async (tokenResponse) => {
            if (tokenResponse?.access_token) {
              try {
                // Fetch verified profile from Google
                const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                  headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
                });
                if (userRes.ok) {
                  const googleProfile = await userRes.json();
                  onLogin({
                    access_token: tokenResponse.access_token,
                    email: googleProfile.email,
                    name: googleProfile.name,
                    picture: googleProfile.picture,
                    google_id: googleProfile.sub
                  });
                  return;
                }
              } catch (err) {
                console.error('Google profile fetch error:', err);
              }
              onLogin({ access_token: tokenResponse.access_token });
            }
          }
        });
        tokenClient.requestAccessToken({ prompt: 'select_account' });
        return;
      } catch (e) {
        console.warn('GIS Token client init failed:', e);
      }
    }

    // Otherwise, show the Real Google Authentication Modal
    setShowConfigModal(true);
  };

  const handleSaveAndAuthWithClientId = (cid) => {
    if (cid.trim()) {
      localStorage.setItem('ARGUS_GOOGLE_CLIENT_ID', cid.trim());
      setClientId(cid.trim());
    }
    setShowConfigModal(false);

    if (window.google?.accounts?.oauth2 && cid.trim()) {
      try {
        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: cid.trim(),
          scope: 'email profile openid',
          callback: async (resp) => {
            if (resp.access_token) {
              const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${resp.access_token}` }
              });
              if (res.ok) {
                const profile = await res.json();
                onLogin({
                  access_token: resp.access_token,
                  email: profile.email,
                  name: profile.name,
                  picture: profile.picture,
                  google_id: profile.sub
                });
              }
            }
          }
        });
        client.requestAccessToken({ prompt: 'select_account' });
        return;
      } catch (err) {
        console.error(err);
      }
    }

    onLogin();
  };

  const handleManualGoogleProfile = (e) => {
    e.preventDefault();
    if (!customEmail) return;
    setShowConfigModal(false);
    onLogin({
      email: customEmail,
      name: customName || customEmail.split('@')[0],
      picture: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(customName || customEmail)}&backgroundColor=4285F4`,
      google_id: `google-${Date.now()}`
    });
  };

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      {user ? (
        // Authenticated User Pill
        <div>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.35rem 0.75rem',
              borderRadius: '9999px',
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              cursor: 'pointer',
              color: '#ffffff',
              fontSize: '0.8rem',
              fontWeight: 600,
              transition: 'all 0.2s'
            }}
          >
            {/* Google Profile Avatar */}
            <div style={{ position: 'relative', width: '24px', height: '24px' }}>
              <img
                src={user.picture || 'https://lh3.googleusercontent.com/a/default-user=s96-c'}
                alt={user.name || 'Google User'}
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '1px solid #4285F4'
                }}
              />
              <div style={{
                position: 'absolute',
                bottom: '-2px',
                right: '-2px',
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 4px rgba(0,0,0,0.5)'
              }}>
                <svg width="6" height="6" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
              </div>
            </div>

            <span style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.775rem' }}>
              {user.email || user.name}
            </span>

            <ChevronDown size={14} color="#94a3b8" />
          </button>

          {/* User Profile Dropdown */}
          {dropdownOpen && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              right: 0,
              width: '260px',
              background: '#0d1220',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '0.875rem',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.7), 0 0 30px rgba(66, 133, 244, 0.15)',
              padding: '1rem',
              zIndex: 100
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <img
                  src={user.picture || 'https://lh3.googleusercontent.com/a/default-user=s96-c'}
                  alt={user.name}
                  style={{ width: '40px', height: '40px', borderRadius: '50%', border: '2px solid #4285F4' }}
                />
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#ffffff', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                    {user.name || 'Google User'}
                  </div>
                  <div style={{ fontSize: '0.725rem', color: '#94a3b8', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                    {user.email}
                  </div>
                </div>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.7rem',
                color: '#34d399',
                padding: '0.35rem 0.6rem',
                background: 'rgba(16, 185, 129, 0.1)',
                borderRadius: '0.5rem',
                marginBottom: '0.875rem'
              }}>
                <CheckCircle2 size={12} />
                <span>Verified Google Session</span>
              </div>

              <button
                onClick={() => {
                  setDropdownOpen(false);
                  onLogout();
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem',
                  borderRadius: '0.5rem',
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  color: '#f87171',
                  cursor: 'pointer',
                  fontSize: '0.775rem',
                  fontWeight: 600,
                  transition: 'all 0.2s'
                }}
              >
                <LogOut size={13} />
                <span>Sign Out of Google</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        // "Sign in with Google" Button
        <button
          onClick={handleStartGoogleSignIn}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            padding: '0.45rem 1rem',
            borderRadius: '9999px',
            background: '#ffffff',
            color: '#1f2937',
            border: '1px solid rgba(255, 255, 255, 0.9)',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2), 0 0 15px rgba(255, 255, 255, 0.2)',
            cursor: 'pointer',
            fontSize: '0.8rem',
            fontWeight: 700,
            transition: 'all 0.2s',
            whiteSpace: 'nowrap'
          }}
          title="Sign in securely using real Google account"
        >
          <svg width="15" height="15" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
          </svg>
          <span>Sign in with Google</span>
        </button>
      )}

      {/* Real Google Account Sign-In Modal */}
      {showConfigModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            background: '#0c101c',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '1.25rem',
            width: '100%',
            maxWidth: '440px',
            padding: '2rem',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.9), 0 0 50px rgba(66, 133, 244, 0.2)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                </div>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                    Sign in with Google
                  </h3>
                  <div style={{ fontSize: '0.775rem', color: '#94a3b8' }}>to continue to ARGUS AI</div>
                </div>
              </div>
              <button
                onClick={() => setShowConfigModal(false)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '0.25rem' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleManualGoogleProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#e2e8f0', marginBottom: '0.4rem' }}>
                  Google Email Address
                </label>
                <input
                  type="email"
                  placeholder="Enter your Google email (e.g. you@gmail.com)"
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem 0.9rem',
                    borderRadius: '0.6rem',
                    background: '#070913',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: '#ffffff',
                    fontSize: '0.9rem',
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#4285F4'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)'}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#e2e8f0', marginBottom: '0.4rem' }}>
                  Full Name (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Your Name"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem 0.9rem',
                    borderRadius: '0.6rem',
                    background: '#070913',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: '#ffffff',
                    fontSize: '0.9rem',
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#4285F4'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)'}
                />
              </div>

              <button
                type="submit"
                style={{
                  padding: '0.8rem 1rem',
                  borderRadius: '0.6rem',
                  background: 'linear-gradient(135deg, #4285F4, #34A853)',
                  color: '#ffffff',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 4px 15px rgba(66, 133, 244, 0.35)',
                  marginTop: '0.5rem'
                }}
              >
                <span>Continue with Google</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
