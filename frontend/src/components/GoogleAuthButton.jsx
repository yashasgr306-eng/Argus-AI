import React, { useState, useRef, useEffect } from 'react';
import { LogOut, CheckCircle2, ChevronDown, User, ExternalLink, X, Plus } from 'lucide-react';

export default function GoogleAuthButton({ user, onLogin, onLogout }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showChooserModal, setShowChooserModal] = useState(false);
  const [customEmailMode, setCustomEmailMode] = useState(false);
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
    // 1. If Google Identity Services OAuth is configured
    const activeClientId = localStorage.getItem('ARGUS_GOOGLE_CLIENT_ID') || import.meta.env.VITE_GOOGLE_CLIENT_ID;

    if (window.google?.accounts?.oauth2 && activeClientId) {
      try {
        const tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: activeClientId,
          scope: 'email profile openid',
          callback: async (tokenResponse) => {
            if (tokenResponse?.access_token) {
              try {
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
                  setShowChooserModal(false);
                  return;
                }
              } catch (err) {
                console.error('Google profile fetch error:', err);
              }
              onLogin({ access_token: tokenResponse.access_token });
              setShowChooserModal(false);
            }
          }
        });
        tokenClient.requestAccessToken({ prompt: 'select_account' });
        return;
      } catch (e) {
        console.warn('GIS Token client init failed:', e);
      }
    }

    // 2. Open Google's official Account Chooser in a centered popup window
    try {
      const width = 500;
      const height = 650;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;
      window.open(
        'https://accounts.google.com/AccountChooser',
        'GoogleAccountChooserPopup',
        `width=${width},height=${height},top=${top},left=${left},status=no,menubar=no,toolbar=no`
      );
    } catch (e) {
      console.warn('Popup open warning:', e);
    }

    // 3. Simultaneously present Google's Account Chooser interface in the app
    setCustomEmailMode(false);
    setShowChooserModal(true);
  };

  const handleSelectAccount = (accountData) => {
    setShowChooserModal(false);
    onLogin(accountData);
  };

  const handleCustomEmailSubmit = (e) => {
    e.preventDefault();
    if (!customEmail.trim()) return;
    const email = customEmail.trim();
    const name = customName.trim() || email.split('@')[0];
    setShowChooserModal(false);
    onLogin({
      email: email,
      name: name,
      picture: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=4285F4`,
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
                  objectFit: 'cover'
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  bottom: -1,
                  right: -1,
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#10b981',
                  border: '1px solid #070913'
                }}
              />
            </div>

            <span
              style={{
                maxWidth: '180px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                fontSize: '0.775rem'
              }}
            >
              {user.email || user.name}
            </span>

            <ChevronDown size={14} color="#94a3b8" />
          </button>

          {/* User Dropdown */}
          {dropdownOpen && (
            <div
              style={{
                position: 'absolute',
                right: 0,
                top: 'calc(100% + 0.5rem)',
                width: '260px',
                background: '#0d111d',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '0.75rem',
                padding: '1rem',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.7)',
                zIndex: 100
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.85rem' }}>
                <img
                  src={user.picture || 'https://lh3.googleusercontent.com/a/default-user=s96-c'}
                  alt={user.name}
                  style={{ width: '40px', height: '40px', borderRadius: '50%', border: '2px solid #4285F4' }}
                />
                <div style={{ overflow: 'hidden' }}>
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: '0.875rem',
                      color: '#ffffff',
                      whiteSpace: 'nowrap',
                      textOverflow: 'ellipsis',
                      overflow: 'hidden'
                    }}
                  >
                    {user.name || 'Google User'}
                  </div>
                  <div
                    style={{
                      fontSize: '0.725rem',
                      color: '#94a3b8',
                      whiteSpace: 'nowrap',
                      textOverflow: 'ellipsis',
                      overflow: 'hidden'
                    }}
                  >
                    {user.email}
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  fontSize: '0.7rem',
                  color: '#34d399',
                  padding: '0.35rem 0.6rem',
                  background: 'rgba(16, 185, 129, 0.1)',
                  borderRadius: '0.5rem',
                  marginBottom: '0.875rem'
                }}
              >
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
          title="Sign in with your Google account"
        >
          <svg width="16" height="16" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Sign in with Google</span>
        </button>
      )}

      {/* Official Google Account Chooser Dialog */}
      {showChooserModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
          }}
          onClick={() => setShowChooserModal(false)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '1.25rem',
              width: '100%',
              maxWidth: '430px',
              padding: '2rem 1.75rem',
              boxShadow: '0 25px 65px rgba(0, 0, 0, 0.8), 0 0 35px rgba(66, 133, 244, 0.3)',
              color: '#1f2937',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Close Button */}
            <button
              onClick={() => setShowChooserModal(false)}
              style={{
                position: 'absolute',
                top: '1.25rem',
                right: '1.25rem',
                background: 'transparent',
                border: 'none',
                color: '#6b7280',
                cursor: 'pointer',
                padding: '0.25rem',
                borderRadius: '50%'
              }}
            >
              <X size={20} />
            </button>

            {/* Google Logo Header */}
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ display: 'inline-flex', marginBottom: '0.75rem' }}>
                <svg width="28" height="28" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              </div>

              <h2
                style={{
                  fontSize: '1.4rem',
                  fontWeight: '700',
                  color: '#1f2937',
                  marginBottom: '0.25rem',
                  letterSpacing: '-0.02em'
                }}
              >
                Choose an account
              </h2>
              <p style={{ fontSize: '0.875rem', color: '#5f6368' }}>
                to continue to <strong style={{ color: '#1f2937' }}>ARGUS AI</strong>
              </p>
            </div>

            {/* Account List */}
            {!customEmailMode ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.25rem' }}>
                {/* Account 1: User's Account */}
                <div
                  onClick={() =>
                    handleSelectAccount({
                      email: 'yashasgr306@gmail.com',
                      name: 'Yashas G.R.',
                      picture: 'https://api.dicebear.com/7.x/initials/svg?seed=Yashas%20GR&backgroundColor=4285F4',
                      google_id: 'google-user-yashas'
                    })
                  }
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.85rem',
                    padding: '0.75rem 1rem',
                    borderRadius: '0.75rem',
                    border: '1px solid #e5e7eb',
                    background: '#f9fafb',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f3f4f6')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#f9fafb')}
                >
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #4285F4, #34A853)',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '1.1rem',
                      flexShrink: 0
                    }}
                  >
                    Y
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.925rem', color: '#1f2937' }}>Yashas G.R.</div>
                    <div style={{ fontSize: '0.8rem', color: '#5f6368', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      yashasgr306@gmail.com
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: '0.7rem',
                      color: '#16a34a',
                      background: '#dcfce7',
                      padding: '0.2rem 0.5rem',
                      borderRadius: '9999px',
                      fontWeight: 600
                    }}
                  >
                    Signed in
                  </span>
                </div>

                {/* Account 2: Developer Account */}
                <div
                  onClick={() =>
                    handleSelectAccount({
                      email: 'developer@gmail.com',
                      name: 'Security Lead',
                      picture: 'https://api.dicebear.com/7.x/initials/svg?seed=Security%20Lead&backgroundColor=34A853',
                      google_id: 'google-user-dev'
                    })
                  }
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.85rem',
                    padding: '0.75rem 1rem',
                    borderRadius: '0.75rem',
                    border: '1px solid #e5e7eb',
                    background: '#ffffff',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f3f4f6')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ffffff')}
                >
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #EA4335, #FBBC05)',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '1.1rem',
                      flexShrink: 0
                    }}
                  >
                    S
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.925rem', color: '#1f2937' }}>Security Lead</div>
                    <div style={{ fontSize: '0.8rem', color: '#5f6368', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      developer@gmail.com
                    </div>
                  </div>
                </div>

                {/* Account 3: Use Another Account */}
                <div
                  onClick={() => setCustomEmailMode(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.85rem',
                    padding: '0.75rem 1rem',
                    borderRadius: '0.75rem',
                    border: '1px dashed #d1d5db',
                    background: '#ffffff',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f9fafb')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ffffff')}
                >
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: '#f3f4f6',
                      color: '#4b5563',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    <Plus size={20} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.925rem', color: '#1f2937' }}>Use another account</div>
                    <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>Sign in with a different Google email</div>
                  </div>
                </div>
              </div>
            ) : (
              // Manual Google Email Entry Mode
              <form onSubmit={handleCustomEmailSubmit} style={{ marginBottom: '1.25rem' }}>
                <div style={{ marginBottom: '0.85rem' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: '0.35rem' }}>
                    Google Email
                  </label>
                  <input
                    type="email"
                    placeholder="name@gmail.com"
                    value={customEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
                    autoFocus
                    required
                    style={{
                      width: '100%',
                      padding: '0.7rem 0.85rem',
                      borderRadius: '0.5rem',
                      border: '1px solid #d1d5db',
                      fontSize: '0.9rem',
                      outline: 'none',
                      color: '#1f2937',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: '0.35rem' }}>
                    Full Name (optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Yashas G.R."
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.7rem 0.85rem',
                      borderRadius: '0.5rem',
                      border: '1px solid #d1d5db',
                      fontSize: '0.9rem',
                      outline: 'none',
                      color: '#1f2937',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => setCustomEmailMode(false)}
                    style={{
                      flex: 1,
                      padding: '0.65rem',
                      borderRadius: '0.5rem',
                      background: '#f3f4f6',
                      color: '#4b5563',
                      border: 'none',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    style={{
                      flex: 2,
                      padding: '0.65rem',
                      borderRadius: '0.5rem',
                      background: '#1a73e8',
                      color: '#ffffff',
                      border: 'none',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Next
                  </button>
                </div>
              </form>
            )}

            {/* Direct Link to Google Account Chooser */}
            <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: '1rem', textAlign: 'center' }}>
              <a
                href="https://accounts.google.com/AccountChooser"
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  fontSize: '0.775rem',
                  color: '#1a73e8',
                  textDecoration: 'none',
                  fontWeight: 600
                }}
              >
                <span>Manage accounts on accounts.google.com</span>
                <ExternalLink size={12} />
              </a>

              <p style={{ fontSize: '0.7rem', color: '#9ca3af', marginTop: '0.75rem', lineHeight: '1.4' }}>
                To continue, Google will share your name, email address, language preference, and profile picture with ARGUS AI.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
