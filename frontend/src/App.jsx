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

import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom'
import { useState, useEffect, useCallback } from 'react'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import SearchResults from './pages/SearchResults'
import ListingDetail from './pages/ListingDetail'
import OwnerDashboard from './pages/OwnerDashboard'
import AdminPanel from './pages/AdminPanel'
import LoginModal from './components/LoginModal'

function AppContent() {
  const navigate = useNavigate()
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
    } catch { /* ignore corrupted data */ }
  }, [])

  // ── Login — called by LoginModal after successful auth ───────────────────
  const handleLogin = (u) => {
    setUser(u)
    localStorage.setItem('sikarnest_user', JSON.stringify(u))
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
  }, [])

  // Shared props passed to pages that show listings (home, search, detail)
  const sharedProps = { user, savedIds, onToggleSave: handleToggleSave, openLogin }

  return (
    <>
      <Navbar
        user={user}
        onLogout={handleLogout}
        savedIds={savedIds}
        openLogin={openLogin}
      />
      <Routes>
        <Route path="/" element={<Home {...sharedProps} />} />
        <Route path="/search" element={<SearchResults {...sharedProps} />} />
        <Route path="/listing/:id" element={<ListingDetail {...sharedProps} />} />
        <Route path="/owner" element={<OwnerDashboard user={user} openLogin={openLogin} />} />
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
        {/* Admin panel has no Navbar — standalone page */}
        <Route path="/admin" element={<AdminPanel />} />
        {/* All public pages wrapped in AppContent to use router hooks */}
        <Route path="/*" element={<AppContent />} />
      </Routes>
    </BrowserRouter>
  )
}