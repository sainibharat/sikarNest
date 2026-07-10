/**
 * components/Navbar.jsx — Sticky Top Navigation Bar
 *
 * Always visible at the top of every page (except /admin).
 *
 * LOGGED OUT state:
 *   Shows a hamburger (≡) button. Clicking opens a dropdown:
 *     • "Login or signup"  → LoginModal in customer/tenant mode (normal account)
 *     • "Become a host"    → LoginModal in owner mode (host account, lands on /owner)
 *
 * LOGGED IN as customer/tenant (role: 'customer/tenant'):
 *   Pill: light background, [avatar] "abc"
 *   Dropdown:
 *     • "Signed in as" / name
 *     • ❤️ Saved (with count badge) — if any saved
 *     • 🚪 Sign Out
 *
 * LOGGED IN as HOST/OWNER (role: 'owner'):
 *   Pill: dark (#0F172A) background, [avatar] "abc"
 *   Dropdown:
 *     • "Signed in as host" / name  (dark header)
 *     • 🏠 My Listings → /owner
 *     • 🚪 Sign Out
 *
 * Props:
 *   user      — current user object (null if not logged in)
 *   onLogout  — called when user clicks Sign Out
 *   savedIds  — array of saved listing IDs (shows badge count, customer/tenant only)
 *   openLogin — fn(mode, redirect?) — triggers login modal in App.jsx
 */

import { useNavigate } from 'react-router-dom'
import { useState } from 'react'

export default function Navbar({
  user,
  onLogout,
  savedIds = [],
  openLogin = () => { },
}) {
  const navigate = useNavigate()
  const [dropOpen, setDropOpen] = useState(false)

  const closeDrop = () => setDropOpen(false)
  const isOwner = user?.role === 'owner'

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 40,
      background: 'white',
      borderBottom: '1px solid #E2E8F0',
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    }}>
      <div
        className="container"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60 }}
      >
        {/* ── Logo ────────────────────────────────────────────────────── */}
        <button
          onClick={() => { navigate('/'); closeDrop() }}
          style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          <div style={{
            width: 34, height: 34, borderRadius: '9px',
            background: 'linear-gradient(135deg,#F97316,#EA6A0A)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontSize: '1rem' }}>🏠</span>
          </div>
          <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: '1.15rem', color: '#0F172A', letterSpacing: '-0.4px' }}>
            Sikar<span style={{ color: '#F97316' }}>Nest</span>
          </span>
        </button>

        {/* ── Right side ──────────────────────────────────────────────── */}
        {user ? (
          // ── Logged in ───────────────────────────────────────────────
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setDropOpen((o) => !o)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                background: isOwner ? '#172a5cff' : '#4be0c0ff',
                border: `1.5px solid ${isOwner ? '#172a5cff' : '#2cd0bbff'}`,
                borderRadius: '999px', padding: '5px 12px 5px 5px',
                cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              {/* Avatar circle */}
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: isOwner
                  ? 'linear-gradient(135deg,#172a5cff,#213978ff)'
                  : 'linear-gradient(135deg,#38BDF8,#0EA5E9)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: '0.75rem', color: 'white',
                position: 'relative',
                overflow: user.photo ? 'hidden' : 'visible',
                flexShrink: 0,
              }}>
                {user.photo
                  ? <img src={user.photo} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                  : (user.name || user.email || 'U')[0].toUpperCase()
                }
                {/* Saved count badge — students only */}
                {!isOwner && savedIds.length > 0 && (
                  <span style={{
                    position: 'absolute', top: -4, right: -4,
                    width: 14, height: 14, borderRadius: '50%',
                    background: '#F97316', border: '2px solid white',
                    fontSize: '0.6rem', fontWeight: 800, color: 'white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'Sora,sans-serif',
                  }}>
                    {savedIds.length}
                  </span>
                )}
              </div>

              {/* First name */}
              <span style={{
                fontFamily: 'DM Sans,sans-serif', fontWeight: 600, fontSize: '0.82rem',
                color: isOwner ? 'white' : '#0F172A',
              }}>
                {(user.name || user.email || 'Me').split(' ')[0]}
              </span>

              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={isOwner ? 'white' : '#64748B'} strokeWidth="2.5">
                <path d={dropOpen ? 'M18 15l-6-6-6 6' : 'M6 9l6 6 6-6'} />
              </svg>
            </button>

            {dropOpen && (
              <div
                style={{
                  position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                  background: 'white', border: '1px solid #E2E8F0',
                  borderRadius: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                  minWidth: 190, overflow: 'hidden', zIndex: 60,
                  animation: 'slideUp 0.15s ease',
                }}
              >
                {/* User info header — dark for owner, white for customer/tenant */}
                <div style={{
                  padding: '0.65rem 1rem', borderBottom: '1px solid #E2E8F0',
                  background: isOwner ? '#0F172A' : 'white',
                }}>
                  <p style={{
                    fontFamily: 'DM Sans,sans-serif', fontSize: '0.72rem',
                    color: isOwner ? '#94A3B8' : '#64748B',
                  }}>
                    {isOwner ? 'Signed in as host' : 'Signed in as'}
                  </p>
                  <p style={{
                    fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: '0.82rem',
                    color: isOwner ? 'white' : '#0F172A',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 155,
                  }}>
                    {user.name || user.email}
                  </p>
                </div>



                {/* Tenant: Saved listings (only if any saved) */}
                {!isOwner && savedIds.length > 0 && (
                  <button
                    onClick={() => { closeDrop(); navigate('/?tab=saved') }}
                    style={{ width: '100%', padding: '0.65rem 1rem', border: 'none', background: 'none', textAlign: 'left', fontFamily: 'DM Sans,sans-serif', fontSize: '0.85rem', color: '#0F172A', fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                    onMouseOver={(e) => (e.currentTarget.style.background = '#F8FAFC')}
                    onMouseOut={(e) => (e.currentTarget.style.background = 'none')}
                  >
                    <span>❤️ Saved</span>
                    <span style={{ background: '#FFF7ED', color: '#F97316', fontSize: '0.72rem', fontWeight: 700, padding: '1px 7px', borderRadius: '999px' }}>
                      {savedIds.length}
                    </span>
                  </button>
                )}

                {/* Sign Out */}
                <button
                  onClick={() => { closeDrop(); onLogout() }}
                  style={{
                    width: '100%', padding: '0.65rem 1rem', border: 'none', background: 'none',
                    textAlign: 'left', fontFamily: 'DM Sans,sans-serif', fontSize: '0.85rem',
                    color: '#DC2626', fontWeight: 600, borderTop: '1px solid #E2E8F0', cursor: 'pointer',
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.background = '#FEF2F2')}
                  onMouseOut={(e) => (e.currentTarget.style.background = 'none')}
                >
                  🚪 Sign Out
                </button>
              </div>
            )}
          </div>
        ) : (
          // ── Not logged in: Hamburger menu ────────────────────────────
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setDropOpen((o) => !o)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'white', border: '1.5px solid #E2E8F0',
                borderRadius: '10px', width: '42px', height: '42px',
                cursor: 'pointer', color: '#0F172A',
                transition: 'all 0.15s ease',
              }}
              onMouseOver={(e) => (e.currentTarget.style.background = '#F8FAFC')}
              onMouseOut={(e) => (e.currentTarget.style.background = 'white')}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>
            {dropOpen && (
              <div
                style={{
                  position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                  background: 'white', border: '1px solid #E2E8F0',
                  borderRadius: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                  minWidth: 170, overflow: 'hidden', zIndex: 60,
                  animation: 'slideUp 0.15s ease',
                }}
              >
                {/* Login or signup → customer/tenant */}
                <button
                  onClick={() => { closeDrop(); openLogin('customer/tenant') }}
                  style={{ width: '100%', padding: '0.8rem 1rem', border: 'none', background: 'none', textAlign: 'left', fontFamily: 'DM Sans,sans-serif', fontSize: '0.85rem', color: '#0F172A', fontWeight: 500, cursor: 'pointer', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                  onMouseOver={(e) => (e.currentTarget.style.background = '#F8FAFC')}
                  onMouseOut={(e) => (e.currentTarget.style.background = 'none')}
                >
                  Login or signup
                </button>
                {/* Become a host → owner modal, redirect to /owner after login */}
                <button
                  onClick={() => { closeDrop(); openLogin('owner', '/owner') }}
                  style={{ width: '100%', padding: '0.8rem 1rem', border: 'none', background: 'none', textAlign: 'left', fontFamily: 'DM Sans,sans-serif', fontSize: '0.85rem', color: '#0F172A', fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                  onMouseOver={(e) => (e.currentTarget.style.background = '#F8FAFC')}
                  onMouseOut={(e) => (e.currentTarget.style.background = 'none')}
                >
                  Become a host
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  )
}
