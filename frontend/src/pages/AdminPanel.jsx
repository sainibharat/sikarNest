/**
 * pages/AdminPanel.jsx — Admin Dashboard (Secret Page)
 *
 * Accessible at: /admin  (no Navbar, standalone page)
 * Protected by: ADMIN_KEY header sent with every API request
 *               (key defined in backend/.env as ADMIN_KEY)
 *
 * Tabs:
 *   ⏳ Pending Review — new submissions awaiting approval
 *   ✅ Approved       — submissions that were approved
 *   ❌ Rejected       — submissions that were rejected
 *   🌐 Live Listings  — all currently published listings (can remove)
 *
 * Actions on pending submissions:
 *   "Approve & Publish" → calls POST /api/admin/approve/:id
 *     Creates a verified Listing, marks submission approved.
 *     Listing immediately appears in search results for students.
 *   "Reject" → calls POST /api/admin/reject/:id
 *     Marks submission rejected. Owner sees "Rejected" in /owner.
 *
 * LiveListings tab:
 *   "Remove" → calls DELETE /api/admin/listing/:id
 *     Permanently removes a live listing from the site.
 */
import { useState, useEffect, useCallback } from 'react'
import { useNavigate }                      from 'react-router-dom'

const BASE = '/api/admin'

function adminFetch(path, opts = {}) {
  const key = sessionStorage.getItem('adminKey') || ''
  return fetch(`${BASE}${path}`, {
    ...opts,
    headers: { 'Content-Type': 'application/json', 'x-admin-key': key, ...opts.headers },
  }).then(async (r) => {
    if (r.status === 403) {
      sessionStorage.removeItem('adminKey')
      window.dispatchEvent(new Event('admin-logout'))
      throw new Error('Forbidden: Invalid Admin Key')
    }
    return r.json()
  })
}

const TYPE_COLORS = { hostel: '#3B82F6', flat: '#8B5CF6', pg: '#F97316' }
const STATUS_COLORS = { pending: '#F59E0B', approved: '#10B981', rejected: '#EF4444' }

export default function AdminPanel() {
  const navigate = useNavigate()
  const [isAuthenticated, setIsAuthenticated] = useState(!!sessionStorage.getItem('adminKey'))
  const [tab, setTab]           = useState('pending') // pending | approved | rejected
  const [submissions, setSubmissions] = useState([])
  const [listings, setListings]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [actionId, setActionId]   = useState(null)
  const [toast, setToast]         = useState('')

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [subRes, listRes] = await Promise.all([
        adminFetch(`/listings?status=${tab}`),
        tab === 'approved' ? adminFetch('/listings?status=approved') : Promise.resolve({ data: [] }),
      ])
      setSubmissions(subRes.data || [])
      // Also load live listings for the listings tab
      if (tab === 'live') {
        const lr = await fetch('/api/listings').then((r) => r.json())
        setListings(lr.data || [])
      }
    } catch { /* ignore */ }
    setLoading(false)
  }, [tab])

  useEffect(() => {
    if (isAuthenticated) loadData()
  }, [loadData, isAuthenticated])

  useEffect(() => {
    const handleLogout = () => setIsAuthenticated(false)
    window.addEventListener('admin-logout', handleLogout)
    return () => window.removeEventListener('admin-logout', handleLogout)
  }, [])

  if (!isAuthenticated) {
    return <AdminLogin onLogin={(key) => {
      sessionStorage.setItem('adminKey', key)
      setIsAuthenticated(true)
    }} />
  }

  const handleApprove = async (id) => {
    setActionId(id)
    const res = await adminFetch(`/approve/${id}`, { method: 'POST' })
    setActionId(null)
    if (res.success) {
      showToast('✅ Listing published successfully!')
      loadData()
    } else {
      showToast('❌ ' + res.error)
    }
  }

  const handleReject = async (id) => {
    if (!window.confirm('Reject this submission?')) return
    setActionId(id)
    const res = await adminFetch(`/reject/${id}`, { method: 'POST' })
    setActionId(null)
    if (res.success) {
      showToast('🚫 Submission rejected')
      loadData()
    }
  }

  const handleDeleteListing = async (id) => {
    if (!window.confirm('Remove this listing from the site?')) return
    setActionId(id)
    const res = await adminFetch(`/listing/${id}`, { method: 'DELETE' })
    setActionId(null)
    if (res.success) {
      showToast('🗑️ Listing removed')
      loadData()
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', paddingBottom: '3rem' }}>

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg,#0F172A,#1E293B)', padding: '1rem 0', marginBottom: '1.5rem' }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontFamily: 'Sora,sans-serif', fontWeight: 800, fontSize: '1.2rem', color: 'white' }}>
              🛡️ SikarNest Admin
            </h1>
            <p style={{ fontFamily: 'DM Sans,sans-serif', fontSize: '0.75rem', color: '#94A3B8', marginTop: '2px' }}>
              Review and manage listing submissions
            </p>
          </div>
          <button
            onClick={() => navigate('/')}
            style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', padding: '0.4rem 0.9rem', borderRadius: '8px', fontFamily: 'DM Sans,sans-serif', fontSize: '0.78rem', cursor: 'pointer' }}
          >
            ← Back to Site
          </button>
        </div>
      </div>

      <div className="container">

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1.25rem', background: 'white', borderRadius: '10px', padding: '4px', border: '1px solid #E2E8F0', width: 'fit-content' }}>
          {[
            { key: 'pending',  label: '⏳ Pending Review' },
            { key: 'approved', label: '✅ Approved' },
            { key: 'rejected', label: '❌ Rejected' },
            { key: 'live',     label: '🌐 Live Listings' },
          ].map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              style={{
                padding: '0.45rem 1rem', borderRadius: '7px', border: 'none', cursor: 'pointer',
                fontFamily: 'DM Sans,sans-serif', fontWeight: tab === t.key ? 700 : 500, fontSize: '0.8rem',
                background: tab === t.key ? '#0F172A' : 'transparent',
                color: tab === t.key ? 'white' : '#64748B',
                transition: 'all 0.15s',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid #F97316', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
            <p style={{ fontFamily: 'DM Sans,sans-serif', color: '#94A3B8', marginTop: '1rem', fontSize: '0.85rem' }}>Loading…</p>
          </div>
        )}

        {/* Submissions list */}
        {!loading && tab !== 'live' && (
          <>
            {submissions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', background: 'white', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📭</div>
                <p style={{ fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: '1rem', color: '#0F172A' }}>
                  No {tab} submissions
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {submissions.map((sub) => (
                  <div key={sub._id} style={{ background: 'white', borderRadius: '14px', border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>

                    {/* Card header */}
                    <div style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.3rem' }}>
                          <span style={{ background: TYPE_COLORS[sub.type] + '1A', color: TYPE_COLORS[sub.type], fontFamily: 'DM Sans,sans-serif', fontWeight: 700, fontSize: '0.7rem', padding: '2px 8px', borderRadius: '999px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            {sub.type}
                          </span>
                          <span style={{ background: STATUS_COLORS[sub.status] + '1A', color: STATUS_COLORS[sub.status], fontFamily: 'DM Sans,sans-serif', fontWeight: 700, fontSize: '0.7rem', padding: '2px 8px', borderRadius: '999px' }}>
                            {sub.status}
                          </span>
                        </div>
                        <h3 style={{ fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: '1rem', color: '#0F172A', marginBottom: '0.25rem' }}>
                          {sub.name}
                        </h3>
                        <p style={{ fontFamily: 'DM Sans,sans-serif', fontSize: '0.78rem', color: '#64748B' }}>
                          📍 {sub.address}
                        </p>
                      </div>

                      {/* Cover image */}
                      {sub.image && (
                        <img src={sub.image} alt={sub.name}
                          style={{ width: 80, height: 60, objectFit: 'cover', borderRadius: '8px', flexShrink: 0 }} />
                      )}
                    </div>

                    {/* Details grid */}
                    <div style={{ padding: '0 1.25rem 0.85rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: '0.5rem' }}>
                      {[
                        { label: 'Owner', value: sub.ownerName },
                        { label: 'Phone', value: '+91 ' + sub.phone },
                        { label: 'Email', value: sub.ownerEmail },
                        { label: 'Rent', value: '₹' + sub.rent.toLocaleString() + '/mo' },
                        { label: 'Beds / Vacancy', value: `${sub.totalBeds || 0} total · ${sub.vacancy || 0} vacant` },
                        { label: 'Gender', value: sub.gender },
                        { label: 'Submitted', value: new Date(sub.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) },
                      ].map((d) => (
                        <div key={d.label} style={{ background: '#F8FAFC', borderRadius: '8px', padding: '0.5rem 0.75rem' }}>
                          <p style={{ fontFamily: 'DM Sans,sans-serif', fontSize: '0.65rem', fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{d.label}</p>
                          <p style={{ fontFamily: 'DM Sans,sans-serif', fontSize: '0.8rem', fontWeight: 500, color: '#0F172A', marginTop: '2px', wordBreak: 'break-all' }}>{d.value}</p>
                        </div>
                      ))}
                    </div>

                    {/* Amenities */}
                    {sub.amenities?.length > 0 && (
                      <div style={{ padding: '0 1.25rem 0.85rem', display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                        {sub.amenities.map((a) => (
                          <span key={a} style={{ background: '#EFF6FF', color: '#1D4ED8', fontFamily: 'DM Sans,sans-serif', fontSize: '0.7rem', padding: '2px 8px', borderRadius: '999px' }}>
                            {a}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Description */}
                    {sub.description && (
                      <div style={{ padding: '0 1.25rem 0.85rem' }}>
                        <p style={{ fontFamily: 'DM Sans,sans-serif', fontSize: '0.78rem', color: '#64748B', lineHeight: 1.5 }}>
                          {sub.description}
                        </p>
                      </div>
                    )}

                    {/* Map preview link */}
                    <div style={{ padding: '0 1.25rem 0.85rem' }}>
                      <a href={`https://www.openstreetmap.org/?mlat=${sub.lat}&mlon=${sub.lng}#map=17/${sub.lat}/${sub.lng}`}
                        target="_blank" rel="noreferrer"
                        style={{ fontFamily: 'DM Sans,sans-serif', fontSize: '0.75rem', color: '#F97316', textDecoration: 'none', fontWeight: 600 }}>
                        📍 View on Map → ({sub.lat?.toFixed(4)}, {sub.lng?.toFixed(4)})
                      </a>
                    </div>

                    {/* Action buttons — only for pending */}
                    {sub.status === 'pending' && (
                      <div style={{ padding: '0.85rem 1.25rem', borderTop: '1px solid #F1F5F9', display: 'flex', gap: '0.6rem' }}>
                        <button
                          onClick={() => handleApprove(sub._id)}
                          disabled={actionId === sub._id}
                          style={{
                            flex: 2, padding: '0.6rem', borderRadius: '8px', border: 'none',
                            background: actionId === sub._id ? '#D1FAE5' : '#10B981',
                            color: 'white', fontFamily: 'DM Sans,sans-serif', fontWeight: 700,
                            fontSize: '0.85rem', cursor: actionId === sub._id ? 'default' : 'pointer',
                            transition: 'background 0.15s',
                          }}
                          onMouseOver={(e) => { if (actionId !== sub._id) e.currentTarget.style.background = '#059669' }}
                          onMouseOut={(e) => { if (actionId !== sub._id) e.currentTarget.style.background = '#10B981' }}
                        >
                          {actionId === sub._id ? 'Publishing…' : '✅ Approve & Publish'}
                        </button>
                        <button
                          onClick={() => handleReject(sub._id)}
                          disabled={actionId === sub._id}
                          style={{
                            flex: 1, padding: '0.6rem', borderRadius: '8px',
                            border: '1.5px solid #FECACA', background: 'white',
                            color: '#EF4444', fontFamily: 'DM Sans,sans-serif', fontWeight: 600,
                            fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.15s',
                          }}
                          onMouseOver={(e) => { e.currentTarget.style.background = '#FEF2F2' }}
                          onMouseOut={(e) => { e.currentTarget.style.background = 'white' }}
                        >
                          ❌ Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Live listings tab */}
        {!loading && tab === 'live' && (
          <LiveListings onDelete={handleDeleteListing} actionId={actionId} />
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: '1.5rem', left: '50%', transform: 'translateX(-50%)',
          background: '#0F172A', color: 'white', padding: '0.75rem 1.5rem',
          borderRadius: '10px', fontFamily: 'DM Sans,sans-serif', fontWeight: 600, fontSize: '0.85rem',
          boxShadow: '0 8px 24px rgba(0,0,0,0.3)', zIndex: 9999, animation: 'slideUp 0.2s ease',
        }}>
          {toast}
        </div>
      )}
    </div>
  )
}

// ─── Live Listings Sub-component ──────────────────────────────────────────
function LiveListings({ onDelete, actionId }) {
  const [listings, setListings] = useState([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    fetch('/api/listings').then((r) => r.json()).then((d) => setListings(d.data || [])).finally(() => setLoading(false))
  }, [actionId])

  if (loading) return <div style={{ textAlign: 'center', padding: '3rem', color: '#94A3B8', fontFamily: 'DM Sans,sans-serif' }}>Loading listings…</div>

  if (listings.length === 0) return (
    <div style={{ textAlign: 'center', padding: '3rem', background: 'white', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
      <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📭</div>
      <p style={{ fontFamily: 'DM Sans,sans-serif', color: '#64748B' }}>No live listings</p>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
      <p style={{ fontFamily: 'DM Sans,sans-serif', fontSize: '0.8rem', color: '#64748B' }}>
        {listings.length} live listing{listings.length !== 1 ? 's' : ''} — visible to tenants
      </p>
      {listings.map((l) => (
        <div key={l._id} style={{ background: 'white', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '0.85rem 1.1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {l.image && <img src={l.image} alt={l.name} style={{ width: 60, height: 48, objectFit: 'cover', borderRadius: '6px', flexShrink: 0 }} />}
          <div style={{ flex: 1 }}>
            <p style={{ fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: '0.88rem', color: '#0F172A' }}>{l.name}</p>
            <p style={{ fontFamily: 'DM Sans,sans-serif', fontSize: '0.73rem', color: '#64748B' }}>₹{l.rent.toLocaleString()}/mo · {l.vacancy} vacant · {l.location}</p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
            <a href={`/listing/${l._id}`} target="_blank" rel="noreferrer"
              style={{ padding: '0.35rem 0.7rem', borderRadius: '6px', border: '1px solid #E2E8F0', color: '#64748B', fontFamily: 'DM Sans,sans-serif', fontSize: '0.75rem', textDecoration: 'none', fontWeight: 600 }}>
              View →
            </a>
            <button onClick={() => onDelete(l._id)} disabled={actionId === l._id}
              style={{ padding: '0.35rem 0.7rem', borderRadius: '6px', border: '1px solid #FECACA', color: '#EF4444', background: 'white', fontFamily: 'DM Sans,sans-serif', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}>
              {actionId === l._id ? '…' : 'Remove'}
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Admin Login Component ────────────────────────────────────────────────
function AdminLogin({ onLogin }) {
  const navigate = useNavigate()
  const [key, setKey] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    if (!key.trim()) return setError('Enter the admin key')
    
    setLoading(true)
    setError('')
    try {
      // Test the key against the backend
      const res = await fetch('/api/admin/listings?status=pending', {
        headers: { 'x-admin-key': key }
      })
      if (res.status === 403) {
        setError('Invalid admin key')
      } else if (res.ok) {
        onLogin(key)
      } else {
        setError('Server error. Try again.')
      }
    } catch {
      setError('Network error. Check connection.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '2.5rem', width: '100%', maxWidth: 420, boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🛡️</div>
          <h1 style={{ fontFamily: 'Sora,sans-serif', fontWeight: 800, fontSize: '1.4rem', color: '#0F172A' }}>Admin Access</h1>
          <p style={{ fontFamily: 'DM Sans,sans-serif', fontSize: '0.85rem', color: '#64748B', marginTop: '0.2rem' }}>Enter the secret key to continue</p>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ fontFamily: 'DM Sans,sans-serif', fontWeight: 600, fontSize: '0.8rem', color: '#475569', display: 'block', marginBottom: '0.4rem' }}>
              Secret Key
            </label>
            <input 
              type="password" 
              className="input" 
              placeholder="••••••••"
              value={key}
              onChange={(e) => { setKey(e.target.value); setError('') }}
              autoFocus
            />
          </div>

          {error && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', padding: '0.6rem 0.8rem' }}>
              <p style={{ fontFamily: 'DM Sans,sans-serif', fontSize: '0.78rem', color: '#DC2626', margin: 0 }}>⚠️ {error}</p>
            </div>
          )}

          <button type="submit" className="btn btn-dark" disabled={loading} style={{ justifyContent: 'center', marginTop: '0.5rem' }}>
            {loading ? 'Verifying…' : 'Access Dashboard →'}
          </button>
        </form>

        <button onClick={() => navigate('/')} type="button" style={{ background: 'none', border: 'none', fontFamily: 'DM Sans,sans-serif', fontSize: '0.75rem', color: '#94A3B8', marginTop: '1.5rem', width: '100%', cursor: 'pointer' }}>
          ← Back to Website
        </button>
      </div>
    </div>
  )
}
