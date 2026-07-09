import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import ListPropertyModal from '../components/ListPropertyModal'

const STATUS_CONFIG = {
  pending:  { color: '#F59E0B', bg: '#FFFBEB', label: '⏳ Under Review', desc: 'Being reviewed by SikarNest team' },
  approved: { color: '#10B981', bg: '#F0FDF4', label: '✅ Live',          desc: 'Visible to all students' },
  rejected: { color: '#EF4444', bg: '#FEF2F2', label: '❌ Rejected',      desc: 'Contact support for details' },
}

const AMENITY_ICONS = {
  WiFi: '📶', Mess: '🍽️', AC: '❄️', CCTV: '📷', Laundry: '👕',
  'RO Water': '💧', Gym: '🏋️', Parking: '🅿️', 'Study Room': '📚',
  'TV Room': '📺', Geyser: '🚿', Furnished: '🛋️', Water: '💧',
  'Power Backup': '🔋', Lift: '🛗',
}

export default function OwnerDashboard({ user, onLogin }) {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading]         = useState(true)
  const [showModal, setShowModal]     = useState(false)
  const [toast, setToast]             = useState('')

  // Auto-open modal if directed from Homepage CTA
  useEffect(() => {
    if (searchParams.get('action') === 'list') {
      setShowModal(true)
      setSearchParams({}, { replace: true })
    }
  }, [searchParams, setSearchParams])

  const showToastMsg = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  // Load this owner's submissions by email
  const loadSubmissions = async () => {
    if (!user?.email) return
    setLoading(true)
    try {
      const res = await fetch(`/api/submissions/mine?email=${encodeURIComponent(user.email)}`)
      const data = await res.json()
      setSubmissions(data.data || [])
    } catch {
      setSubmissions([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadSubmissions() }, [user])

  const stats = {
    total:    submissions.length,
    pending:  submissions.filter((s) => s.status === 'pending').length,
    live:     submissions.filter((s) => s.status === 'approved').length,
    rejected: submissions.filter((s) => s.status === 'rejected').length,
  }

  // Not logged in
  if (!user) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div style={{ textAlign: 'center', maxWidth: 380 }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🏠</div>
          <h2 style={{ fontFamily: 'Sora,sans-serif', fontWeight: 800, fontSize: '1.4rem', color: '#0F172A', marginBottom: '0.5rem' }}>
            Owner Dashboard
          </h2>
          <p style={{ fontFamily: 'DM Sans,sans-serif', color: '#64748B', marginBottom: '1.5rem', lineHeight: 1.6 }}>
            Sign in to manage your listings, track review status, and reach students directly.
          </p>
          <button
            className="btn btn-dark"
            style={{ justifyContent: 'center', padding: '0.65rem 1.5rem' }}
            onClick={() => onLogin('owner')}
          >
            Sign in to continue →
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ background: '#F8FAFC', minHeight: '80vh', paddingBottom: '3rem' }}>

      {/* Owner banner */}
      <div style={{ background: 'linear-gradient(135deg,#0F172A,#1E293B)', padding: '1.5rem 0', marginBottom: '1.75rem' }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{
              width: 46, height: 46, borderRadius: '50%',
              background: user.photo ? 'transparent' : 'linear-gradient(135deg,#F97316,#EA6A0A)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: '1.1rem', color: 'white', flexShrink: 0,
              overflow: 'hidden',
            }}>
              {user.photo
                ? <img src={user.photo} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : (user.name?.[0] || 'O').toUpperCase()}
            </div>
            <div>
              <p style={{ fontFamily: 'DM Sans,sans-serif', fontSize: '0.75rem', color: '#64748B' }}>👋 Welcome back</p>
              <p style={{ fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: '1rem', color: 'white' }}>{user.name || user.email}</p>
              <p style={{ fontFamily: 'DM Sans,sans-serif', fontSize: '0.72rem', color: '#94A3B8' }}>{user.email}</p>
            </div>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => setShowModal(true)}
            style={{ gap: '0.4rem' }}
          >
            + List New Property
          </button>
        </div>
      </div>

      <div className="container">

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))', gap: '0.75rem', marginBottom: '1.75rem' }}>
          {[
            { label: 'Total Listed', value: stats.total,    icon: '🏠', color: '#F97316' },
            { label: 'Under Review', value: stats.pending,  icon: '⏳', color: '#F59E0B' },
            { label: 'Live Now',     value: stats.live,     icon: '✅', color: '#10B981' },
            { label: 'Rejected',     value: stats.rejected, icon: '❌', color: '#EF4444' },
          ].map((s) => (
            <div key={s.label} style={{ background: 'white', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '1rem', textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
              <div style={{ fontSize: '1.4rem', marginBottom: '0.2rem' }}>{s.icon}</div>
              <div style={{ fontFamily: 'Sora,sans-serif', fontWeight: 800, fontSize: '1.5rem', color: s.color }}>{s.value}</div>
              <div style={{ fontFamily: 'DM Sans,sans-serif', fontSize: '0.7rem', color: '#94A3B8', marginTop: '2px' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Submissions list */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h2 style={{ fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: '1.05rem', color: '#0F172A' }}>
            Your Listings & Submissions
          </h2>
          <button
            onClick={loadSubmissions}
            style={{ background: 'none', border: 'none', fontFamily: 'DM Sans,sans-serif', fontSize: '0.78rem', color: '#64748B', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            🔄 Refresh
          </button>
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid #F97316', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
            <p style={{ fontFamily: 'DM Sans,sans-serif', color: '#94A3B8', marginTop: '1rem', fontSize: '0.85rem' }}>Loading your listings…</p>
          </div>
        )}

        {!loading && submissions.length === 0 && (
          <div style={{ background: 'white', borderRadius: '16px', border: '1.5px dashed #E2E8F0', padding: '3rem', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🏠</div>
            <h3 style={{ fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: '1rem', color: '#0F172A', marginBottom: '0.4rem' }}>
              No listings yet
            </h3>
            <p style={{ fontFamily: 'DM Sans,sans-serif', fontSize: '0.83rem', color: '#64748B', marginBottom: '1.25rem' }}>
              List your hostel or flat and reach hundreds of students searching in Sikar
            </p>
            <button className="btn btn-primary" style={{ margin: '0 auto', justifyContent: 'center' }} onClick={() => setShowModal(true)}>
              + List Your First Property
            </button>
          </div>
        )}

        {!loading && submissions.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {submissions.map((sub) => {
              const st = STATUS_CONFIG[sub.status] || STATUS_CONFIG.pending
              return (
                <div key={sub._id} style={{ background: 'white', borderRadius: '14px', border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>

                  {/* Status banner */}
                  <div style={{ background: st.bg, borderBottom: `1px solid ${st.color}20`, padding: '0.6rem 1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontFamily: 'DM Sans,sans-serif', fontWeight: 700, fontSize: '0.78rem', color: st.color }}>{st.label}</span>
                    <span style={{ fontFamily: 'DM Sans,sans-serif', fontSize: '0.72rem', color: st.color + 'CC' }}>— {st.desc}</span>
                  </div>

                  {/* Main content */}
                  <div style={{ padding: '1rem 1.1rem', display: 'flex', gap: '0.85rem', alignItems: 'flex-start' }}>
                    {/* Cover image */}
                    {sub.image ? (
                      <img src={sub.image} alt={sub.name}
                        style={{ width: 72, height: 60, objectFit: 'cover', borderRadius: '8px', flexShrink: 0, border: '1px solid #E2E8F0' }} />
                    ) : (
                      <div style={{ width: 72, height: 60, borderRadius: '8px', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0 }}>
                        {sub.type === 'hostel' ? '🏢' : '🏠'}
                      </div>
                    )}

                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
                        <div>
                          <h3 style={{ fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: '0.95rem', color: '#0F172A', marginBottom: '0.2rem' }}>
                            {sub.name} {sub.bhk && <span style={{ fontFamily: 'DM Sans,sans-serif', fontWeight: 500, fontSize: '0.78rem', color: '#64748B' }}>({sub.bhk})</span>}
                          </h3>
                          <p style={{ fontFamily: 'DM Sans,sans-serif', fontSize: '0.75rem', color: '#94A3B8' }}>
                            📍 {sub.address}
                          </p>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <p style={{ fontFamily: 'Sora,sans-serif', fontWeight: 800, fontSize: '1rem', color: '#0F172A' }}>₹{sub.rent.toLocaleString()}</p>
                          <p style={{ fontFamily: 'DM Sans,sans-serif', fontSize: '0.68rem', color: '#94A3B8' }}>/month</p>
                        </div>
                      </div>

                      {/* Info chips */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.6rem' }}>
                        <span style={{ background: '#F1F5F9', color: '#475569', fontFamily: 'DM Sans,sans-serif', fontSize: '0.7rem', fontWeight: 600, padding: '2px 8px', borderRadius: '999px' }}>
                          {sub.type === 'hostel' ? '🏢' : '🏠'} {sub.type}
                        </span>
                        {sub.gender && (
                          <span style={{ background: '#F1F5F9', color: '#475569', fontFamily: 'DM Sans,sans-serif', fontSize: '0.7rem', fontWeight: 600, padding: '2px 8px', borderRadius: '999px' }}>
                            {sub.gender === 'boys' ? '👦' : sub.gender === 'girls' ? '👧' : '👥'} {sub.gender}
                          </span>
                        )}
                        {sub.totalBeds > 0 && (
                          <span style={{ background: '#F1F5F9', color: '#475569', fontFamily: 'DM Sans,sans-serif', fontSize: '0.7rem', fontWeight: 600, padding: '2px 8px', borderRadius: '999px' }}>
                            🛏️ {sub.vacancy || 0}/{sub.totalBeds} vacant
                          </span>
                        )}
                        <span style={{ background: '#F1F5F9', color: '#475569', fontFamily: 'DM Sans,sans-serif', fontSize: '0.7rem', fontWeight: 600, padding: '2px 8px', borderRadius: '999px' }}>
                          📅 {new Date(sub.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>

                      {/* Amenities */}
                      {sub.amenities?.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginTop: '0.5rem' }}>
                          {sub.amenities.slice(0, 6).map((a) => (
                            <span key={a} style={{ fontFamily: 'DM Sans,sans-serif', fontSize: '0.68rem', color: '#64748B' }}>
                              {AMENITY_ICONS[a] || '•'} {a}
                            </span>
                          ))}
                          {sub.amenities.length > 6 && (
                            <span style={{ fontFamily: 'DM Sans,sans-serif', fontSize: '0.68rem', color: '#94A3B8' }}>
                              +{sub.amenities.length - 6} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Pending message */}
                  {sub.status === 'pending' && (
                    <div style={{ margin: '0 1.1rem 1rem', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '8px', padding: '0.6rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span>⏳</span>
                      <p style={{ fontFamily: 'DM Sans,sans-serif', fontSize: '0.76rem', color: '#92400E', margin: 0 }}>
                        Your listing is under review. It will go live within <strong>24 hours</strong>.
                        A confirmation will be sent to <strong>{sub.ownerEmail}</strong>.
                      </p>
                    </div>
                  )}

                  {/* Live — show view link */}
                  {sub.status === 'approved' && (
                    <div style={{ padding: '0 1.1rem 1rem' }}>
                      <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '8px', padding: '0.6rem 0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                        <p style={{ fontFamily: 'DM Sans,sans-serif', fontSize: '0.76rem', color: '#14532D', margin: 0 }}>
                          🎉 Your listing is <strong>live</strong> — students can find and contact you!
                        </p>
                        <button
                          onClick={() => navigate(`/search?q=${encodeURIComponent(sub.name)}`)}
                          style={{ background: 'none', border: '1px solid #86EFAC', borderRadius: '6px', fontFamily: 'DM Sans,sans-serif', fontSize: '0.72rem', fontWeight: 700, color: '#16A34A', cursor: 'pointer', padding: '3px 10px', flexShrink: 0 }}
                        >
                          View →
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Email reminder info */}
        <div style={{ marginTop: '1.5rem', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '12px', padding: '1rem 1.25rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
          <span style={{ fontSize: '1.4rem' }}>📧</span>
          <div>
            <p style={{ fontFamily: 'DM Sans,sans-serif', fontWeight: 700, fontSize: '0.85rem', color: '#14532D', marginBottom: '0.2rem' }}>
              Weekly Vacancy Reminders
            </p>
            <p style={{ fontFamily: 'DM Sans,sans-serif', fontSize: '0.78rem', color: '#166534', lineHeight: 1.5 }}>
              SikarNest sends you a reminder every Monday if your vacancy hasn't been updated in 5+ days. Keeping it fresh helps students find you first!
            </p>
          </div>
        </div>
      </div>

      {/* List property modal */}
      {showModal && (
        <ListPropertyModal
          onClose={() => { setShowModal(false); loadSubmissions() }}
        />
      )}

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: '1.5rem', left: '50%', transform: 'translateX(-50%)', background: '#0F172A', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '10px', fontFamily: 'DM Sans,sans-serif', fontWeight: 600, fontSize: '0.85rem', boxShadow: '0 8px 24px rgba(0,0,0,0.3)', zIndex: 9999, animation: 'slideUp 0.2s ease' }}>
          {toast}
        </div>
      )}
    </div>
  )
}
