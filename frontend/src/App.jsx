/**
 * App.jsx — Root Application Component
 *
 * This is the top-level component that:
 *   1. Manages global user session (login/logout via localStorage)
 *   2. Manages saved listing IDs (heart-saved by student)
 *   3. Defines all client-side routes
 *
 * Routes:
 *   /           → Home.jsx       (hero search + featured listings)
 *   /search     → SearchResults  (filtered listing browse)
 *   /listing/:id → ListingDetail (full detail page for one listing)
 *   /owner      → OwnerDashboard (owner sees their submissions & status)
 *   /admin      → AdminPanel     (approve/reject submissions — key protected)
 *
 * State:
 *   user     — logged-in user object { name, email, photo, role } or null
 *   savedIds — array of listing _ids the user has hearted
 *
 * All pages that need user/save context get it via sharedProps.
 */

import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { useState, useEffect, useCallback } from 'react'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import SearchResults from './pages/SearchResults'
import ListingDetail from './pages/ListingDetail'
import OwnerDashboard from './pages/OwnerDashboard'
import AdminPanel from './pages/AdminPanel'
import LoginModal from './components/LoginModal'

function NotFound() {
  const navigate = useNavigate()
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC', textAlign: 'center', padding: '2rem' }}>
      <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🕵️</div>
      <h1 style={{ fontFamily: 'Sora,sans-serif', fontWeight: 800, fontSize: '2rem', color: '#0F172A', marginBottom: '0.5rem' }}>
        We can't seem to find the page you're looking for.
      </h1>
      <p style={{ fontFamily: 'DM Sans,sans-serif', fontSize: '0.9rem', color: '#64748B', marginBottom: '2rem' }}>
        Oops! The page you're looking for doesn't exist or has been moved.
      </p>
      <button className="btn btn-primary" onClick={() => navigate('/')}>
        ← Back to Home
      </button>
    </div>
  )
}

function AppContent() {
  const navigate = useNavigate()
  const location = useLocation()
  const [user, setUser] = useState(null)
  const [savedIds, setSavedIds] = useState([])

  // Controls LoginModal visibility, initial mode, and post-login redirect
  const [loginConfig, setLoginConfig] = useState({ isOpen: false, mode: 'customer/tenant', redirect: null })

  // ── Restore session from localStorage on first load ──────────────────────
  useEffect(() => {
    try {
      const u = localStorage.getItem('sikarnest_user')
      const s = localStorage.getItem('sikarnest_saved')
      if (u) setUser(JSON.parse(u))
      if (s) setSavedIds(JSON.parse(s))
      
      // Sync fresh data from DB if token exists (cross-device sync)
      const token = localStorage.getItem('sikarnest_token')
      if (token) {
        fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
          .then(res => res.json())
          .then(data => {
            if (data.success && data.user) {
              const freshUser = { id: data.user._id, email: data.user.email, name: data.user.name, photo: data.user.photo, role: data.user.role, savedListings: data.user.savedListings || [] }
              setUser(freshUser)
              localStorage.setItem('sikarnest_user', JSON.stringify(freshUser))
              
              setSavedIds(prev => {
                const merged = [...new Set([...(freshUser.savedListings || []), ...prev])]
                localStorage.setItem('sikarnest_saved', JSON.stringify(merged))
                return merged
              })
            }
          })
          .catch(() => {})
      }
    } catch { /* ignore corrupted data */ }
  }, [])

  // ── Login — called by LoginModal after successful auth ───────────────────
  const handleLogin = (u) => {
    const dbSaves = u.savedListings || []
    const mergedSaves = [...new Set([...dbSaves, ...savedIds])]
    
    // Sync any local-only saves to the database
    const localOnly = savedIds.filter(id => !dbSaves.includes(id))
    localOnly.forEach(id => {
      fetch('/api/auth/toggle-save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('sikarnest_token')}`
        },
        body: JSON.stringify({ listingId: id })
      }).catch(() => {}) // ignore errors on background sync
    })

    setUser(u)
    setSavedIds(mergedSaves)
    localStorage.setItem('sikarnest_user', JSON.stringify(u))
    localStorage.setItem('sikarnest_saved', JSON.stringify(mergedSaves))
    setLoginConfig(prev => ({ ...prev, isOpen: false }))

    // Redirect after login if a redirect route was requested (e.g. List Property flow)
    if (loginConfig.redirect) {
      navigate(loginConfig.redirect)
    }
  }

  // Helper to open login modal with a specific mode and optional redirect
  const openLogin = (mode = 'customer/tenant', redirect = null) => {
    setLoginConfig({ isOpen: true, mode, redirect })
  }

  // ── Logout — clears user + saved list ────────────────────────────────────
  const handleLogout = () => {
    setUser(null)
    setSavedIds([])
    localStorage.removeItem('sikarnest_user')
    localStorage.removeItem('sikarnest_saved')
    navigate('/')
  }

  // ── Toggle save a listing (heart button) ─────────────────────────────────
  const handleToggleSave = useCallback((id) => {
    setSavedIds((prev) => {
      const next = prev.includes(id)
        ? prev.filter((x) => x !== id)   // remove if already saved
        : [...prev, id]                  // add if not saved
      localStorage.setItem('sikarnest_saved', JSON.stringify(next))
      return next
    })

    // If logged in, also sync to database immediately
    if (localStorage.getItem('sikarnest_token')) {
      fetch('/api/auth/toggle-save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('sikarnest_token')}`
        },
        body: JSON.stringify({ listingId: id })
      }).catch(console.error)
    }
  }, [])

  // Shared props passed to pages that show listings (home, search, detail)
  const sharedProps = { user, savedIds, onToggleSave: handleToggleSave, openLogin }

  const isValidPath = ['/', '/search', '/owner'].includes(location.pathname) || location.pathname.startsWith('/listing/')

  return (
    <>
      {isValidPath && (
        <Navbar
          user={user}
          onLogout={handleLogout}
          savedIds={savedIds}
          openLogin={openLogin}
        />
      )}
      <Routes>
        <Route path="/" element={<Home {...sharedProps} />} />
        <Route path="/search" element={<SearchResults {...sharedProps} />} />
        <Route path="/listing/:id" element={<ListingDetail {...sharedProps} />} />
        <Route path="/owner" element={<OwnerDashboard user={user} openLogin={openLogin} />} />
        <Route path="*" element={<NotFound />} />
      </Routes>

      {/* ── Login Modal — rendered here so it overlays everything ────────── */}
      {loginConfig.isOpen && (
        <LoginModal
          initialMode={loginConfig.mode}
          onClose={() => setLoginConfig(prev => ({ ...prev, isOpen: false }))}
          onSuccess={handleLogin}
        />
      )}
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Admin panel has no Navbar — standalone page (Secret Route) */}
        <Route path="/sikar-admin-secure-8x9q" element={<AdminPanel />} />
        {/* All public pages wrapped in AppContent to use router hooks */}
        <Route path="/*" element={<AppContent />} />
      </Routes>
    </BrowserRouter>
  )
}