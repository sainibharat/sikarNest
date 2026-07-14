/**
 * pages/Home.jsx — Homepage
 *
 * The main landing page.
 * Contains:
 *   - Hero section with animated search bar (searches by area/name)
 *   - "List Your Property" CTA button → opens ListPropertyModal
 *   - Featured listings grid: latest 6 verified listings from the API
 *   - Saved tab: shows listings the user has hearted (from localStorage)
 *
 * Data flow:
 *   fetchListings() called on mount → displays first 6 results as featured.
 *   Search input → navigates to /search?q=<term>
 *
 * Props from App.jsx: user, savedIds, onToggleSave
 */
import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchListings } from '../lib/api'
import ListingCard from '../components/ListingCard'

const LOCATIONS = ['Piprali Road', 'Station Road', 'Fatehpur Road', 'Nehru Nagar', 'Bajaj Colony', 'Sudama Colony']

export default function Home({ user, savedIds = [], onToggleSave, openLogin }) {
  const navigate = useNavigate()

  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState({ areas: [], properties: [] })
  const [notAvailable, setNotAvailable] = useState('')
  const carouselRef = useRef(null)
  const [listings, setListings] = useState([])
  const [loadingListings, setLoadingListings] = useState(true)

  // Load all listings for carousel on mount
  useEffect(() => {
    fetchListings()
      .then(setListings)
      .catch(() => setListings([]))
      .finally(() => setLoadingListings(false))
  }, [])

  const handleInputChange = (v) => {
    setQuery(v)
    setNotAvailable('')
    if (v.trim().length > 0) {
      const lower = v.toLowerCase()
      // Area suggestions from hardcoded list
      const areas = LOCATIONS.filter((l) => l.toLowerCase().includes(lower))
      // Real listing name/address suggestions from DB data (already fetched)
      const properties = listings
        .filter((l) =>
          l.name?.toLowerCase().includes(lower) ||
          l.address?.toLowerCase().includes(lower)
        )
        .slice(0, 4) // cap at 4 property results
      setSuggestions({ areas, properties })
    } else {
      setSuggestions({ areas: [], properties: [] })
    }
  }

  const handleSearch = (searchQuery) => {
    const q = (searchQuery || query).trim()
    setSuggestions({ areas: [], properties: [] })
    // Empty query → browse all listings; otherwise search by term
    if (!q) {
      navigate('/search')
    } else {
      navigate(`/search?q=${encodeURIComponent(q)}`)
    }
  }

  const hasSuggestions = suggestions.areas.length > 0 || suggestions.properties.length > 0

  const scroll = (dir) => {
    carouselRef.current?.scrollBy({ left: dir * 240, behavior: 'smooth' })
  }

  const handleListProperty = () => {
    if (user) {
      navigate('/owner?action=list')
    } else {
      openLogin('/owner?action=list')
    }
  }

  return (
    <>
      {/* ── HERO ── */}
      <section style={{
        background: 'linear-gradient(145deg, #0F172A 0%, #1E293B 60%, #0F172A 100%)',
        padding: '3.5rem 0 4rem',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Decorative blobs */}
        <div style={{ position: 'absolute', top: -60, right: -60, width: 240, height: 240, borderRadius: '50%', background: 'rgba(249,115,22,0.08)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -40, left: -40, width: 180, height: 180, borderRadius: '50%', background: 'rgba(249,115,22,0.05)', pointerEvents: 'none' }} />

        <div className="container" style={{ textAlign: 'center', position: 'relative' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(249,115,22,0.15)', border: '1px solid rgba(249,115,22,0.3)', borderRadius: '999px', padding: '4px 14px', marginBottom: '1.25rem' }}>
            <span style={{ fontSize: '0.75rem' }}>📍</span>
            <span style={{ fontFamily: 'DM Sans,sans-serif', fontSize: '0.75rem', color: '#F97316', fontWeight: 600 }}>Sikar, Rajasthan</span>
          </div>

          <h1 style={{ fontFamily: 'Sora,sans-serif', fontWeight: 800, fontSize: 'clamp(1.6rem,4vw,2.6rem)', color: 'white', lineHeight: 1.2, marginBottom: '0.75rem' }}>
            Find Your Perfect
            <span style={{ color: '#F97316', display: 'block' }}>Hostel or Flat</span>
          </h1>
          <p style={{ fontFamily: 'DM Sans,sans-serif', fontSize: '0.95rem', color: '#94A3B8', marginBottom: '2rem', maxWidth: 420, margin: '0 auto 2rem' }}>
            Verified listings near coaching institutes in Sikar. Real vacancies, no broker fees.
          </p>

          {/* ─── Search Bar ─── */}
          <div style={{ maxWidth: 520, margin: '0 auto', position: 'relative' }}>
            <div style={{
              display: 'flex', alignItems: 'center',
              background: 'white', borderRadius: '14px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
              overflow: 'visible',
              position: 'relative',
            }}>
              <div style={{ padding: '0 0.75rem 0 1rem', color: '#94A3B8', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                  <circle cx="12" cy="9" r="2.5" />
                </svg>
              </div>
              <input
                type="text"
                value={query}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search by area or property name - e.g. Piprali Road"
                style={{
                  flex: 1, padding: '0.9rem 0.5rem', border: 'none', outline: 'none',
                  fontFamily: 'DM Sans,sans-serif', fontSize: '0.95rem', color: '#0F172A',
                  background: 'transparent',
                }}
              />
              <button
                onClick={() => handleSearch()}
                className="btn btn-primary"
                style={{ margin: '5px', borderRadius: '10px', padding: '0.55rem 1.25rem', flexShrink: 0 }}
              >
                Search
              </button>
            </div>

            {/* Smarter Autocomplete Dropdown */}
            {hasSuggestions && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '6px',
                background: 'white', borderRadius: '14px',
                boxShadow: '0 12px 32px rgba(0,0,0,0.18)',
                overflow: 'hidden', zIndex: 20,
                border: '1px solid #F1F5F9',
              }}>
                {/* Area suggestions */}
                {suggestions.areas.length > 0 && (
                  <div>
                    <p style={{ fontFamily: 'DM Sans,sans-serif', fontSize: '0.65rem', fontWeight: 700, color: '#94A3B8', letterSpacing: '0.08em', textTransform: 'uppercase', padding: '0.55rem 1rem 0.2rem' }}>
                      📍 Areas
                    </p>
                    {suggestions.areas.map((s) => (
                      <button
                        key={s}
                        onClick={() => { setQuery(s); handleSearch(s) }}
                        style={{
                          width: '100%', padding: '0.6rem 1rem', border: 'none', background: 'none',
                          textAlign: 'left', fontFamily: 'DM Sans,sans-serif', fontSize: '0.875rem', color: '#0F172A',
                          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.6rem',
                        }}
                        onMouseOver={(e) => (e.currentTarget.style.background = '#FFF7ED')}
                        onMouseOut={(e) => (e.currentTarget.style.background = 'none')}
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="2.5">
                          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                        </svg>
                        {s}
                      </button>
                    ))}
                  </div>
                )}

                {/* Divider if both sections visible */}
                {suggestions.areas.length > 0 && suggestions.properties.length > 0 && (
                  <div style={{ height: 1, background: '#F1F5F9', margin: '0.25rem 0' }} />
                )}

                {/* Real listing name suggestions */}
                {suggestions.properties.length > 0 && (
                  <div>
                    <p style={{ fontFamily: 'DM Sans,sans-serif', fontSize: '0.65rem', fontWeight: 700, color: '#94A3B8', letterSpacing: '0.08em', textTransform: 'uppercase', padding: '0.55rem 1rem 0.2rem' }}>
                      🏠 Properties
                    </p>
                    {suggestions.properties.map((l) => (
                      <button
                        key={l._id}
                        onClick={() => { setQuery(l.name); handleSearch(l.name) }}
                        style={{
                          width: '100%', padding: '0.6rem 1rem', border: 'none', background: 'none',
                          textAlign: 'left', fontFamily: 'DM Sans,sans-serif', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', gap: '0.75rem',
                        }}
                        onMouseOver={(e) => (e.currentTarget.style.background = '#FFF7ED')}
                        onMouseOut={(e) => (e.currentTarget.style.background = 'none')}
                      >
                        {/* Mini thumbnail */}
                        <div style={{
                          width: 34, height: 34, borderRadius: '8px', flexShrink: 0,
                          background: l.image ? `url(${l.image}) center/cover` : '#F1F5F9',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '0.9rem', overflow: 'hidden',
                        }}>
                          {!l.image && (l.type === 'hostel' ? '🏢' : '🏠')}
                        </div>
                        <div style={{ overflow: 'hidden' }}>
                          <p style={{ fontFamily: 'DM Sans,sans-serif', fontWeight: 600, fontSize: '0.84rem', color: '#0F172A', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {l.name}
                          </p>
                          <p style={{ fontFamily: 'DM Sans,sans-serif', fontSize: '0.72rem', color: '#94A3B8', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {l.address}
                          </p>
                        </div>
                        <span style={{ marginLeft: 'auto', flexShrink: 0, fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: '0.78rem', color: '#F97316' }}>
                          ₹{l.rent?.toLocaleString()}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Not available message */}
            {notAvailable && (
              <div style={{ marginTop: '0.75rem', background: 'rgba(220,38,38,0.12)', border: '1px solid rgba(220,38,38,0.3)', borderRadius: '10px', padding: '0.75rem 1rem', textAlign: 'center' }}>
                <p style={{ fontFamily: 'DM Sans,sans-serif', fontSize: '0.85rem', color: '#FCA5A5' }}>
                  😔 Service is not available in <strong style={{ color: 'white' }}>"{notAvailable}"</strong> yet.
                </p>
                <p style={{ fontFamily: 'DM Sans,sans-serif', fontSize: '0.75rem', color: '#94A3B8', marginTop: '4px' }}>
                  Try: Piprali Road, Station Road, Fatehpur Road, Nehru Nagar
                </p>
              </div>
            )}
          </div>

          {/* Quick location pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center', marginTop: '1.5rem' }}>
            {LOCATIONS.map((loc) => (
              <button
                key={loc}
                onClick={() => { setQuery(loc); handleSearch(loc) }}
                style={{
                  padding: '0.3rem 0.85rem', borderRadius: '999px',
                  background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
                  color: '#CBD5E1', fontFamily: 'DM Sans,sans-serif', fontSize: '0.75rem', fontWeight: 500,
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
                onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(249,115,22,0.2)'; e.currentTarget.style.color = '#F97316'; e.currentTarget.style.borderColor = 'rgba(249,115,22,0.4)' }}
                onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#CBD5E1'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)' }}
              >
                📍 {loc}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── POPULAR CAROUSEL ── */}
      <section style={{ padding: '2.5rem 0', background: 'white' }}>
        <div className="container">
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <div>
              <h2 style={{ fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: '1.15rem', color: '#0F172A' }}>
                Popular in Sikar
              </h2>
              <p style={{ fontFamily: 'DM Sans,sans-serif', fontSize: '0.8rem', color: '#94A3B8', marginTop: '2px' }}>
                Hostels & Flats — updated daily
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              {/* View All button */}
              <button
                onClick={() => navigate('/search')}
                style={{
                  display: 'flex', alignItems: 'center', gap: '4px',
                  padding: '0.35rem 0.85rem', borderRadius: '999px',
                  border: '1.5px solid #F97316', background: '#FFF7ED',
                  color: '#F97316', fontFamily: 'DM Sans,sans-serif',
                  fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
                onMouseOver={(e) => { e.currentTarget.style.background = '#F97316'; e.currentTarget.style.color = 'white' }}
                onMouseOut={(e) => { e.currentTarget.style.background = '#FFF7ED'; e.currentTarget.style.color = '#F97316' }}
              >
                View All →
              </button>
              {/* Scroll arrows */}
              {[-1, 1].map((dir) => (
                <button
                  key={dir}
                  onClick={() => scroll(dir)}
                  style={{
                    width: 36, height: 36, borderRadius: '50%', border: '1.5px solid #E2E8F0',
                    background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.borderColor = '#F97316'; e.currentTarget.style.color = '#F97316' }}
                  onMouseOut={(e) => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.color = 'inherit' }}
                >
                  {dir === -1 ? '←' : '→'}
                </button>
              ))}
            </div>
          </div>

          {/* Scroll container */}
          <div
            ref={carouselRef}
            style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '0.5rem', scrollbarWidth: 'none' }}
          >
            {loadingListings
              ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} style={{ width: 220, height: 230, flexShrink: 0, borderRadius: 12, background: '#F1F5F9', animation: 'pulse 1.5s ease infinite' }} />
              ))
              : listings.slice(0, 8).map((l) => (
                <ListingCard key={l._id} listing={{ ...l, id: l._id }} compact
                  user={user}
                  isSaved={savedIds.includes(l._id)}
                  onToggleSave={onToggleSave}
                />
              ))
            }
          </div>
        </div>
      </section>

      {/* ── STATS STRIP ── */}
      <section style={{ background: '#F8FAFC', borderTop: '1px solid #E2E8F0', borderBottom: '1px solid #E2E8F0', padding: '1.25rem 0' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'center', gap: '3rem', flexWrap: 'wrap' }}>
          {[
            { value: '200+', label: 'Listed Properties' },
            { value: '6', label: 'Areas Covered' },
            { value: '₹0', label: 'Broker Fee' },
            { value: '24h', label: 'Vacancy Updates' },
          ].map((s) => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <p style={{ fontFamily: 'Sora,sans-serif', fontWeight: 800, fontSize: '1.3rem', color: '#F97316' }}>{s.value}</p>
              <p style={{ fontFamily: 'DM Sans,sans-serif', fontSize: '0.75rem', color: '#64748B' }}>{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── LIST YOUR PROPERTY BANNER ── */}
      <section style={{ padding: '2.5rem 0' }}>
        <div className="container">
          <button
            id="list-property-btn"
            onClick={handleListProperty}
            style={{
              width: '100%', padding: '1.5rem 2rem',
              background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
              border: '2px dashed rgba(249,115,22,0.4)',
              borderRadius: '14px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              gap: '1rem', flexWrap: 'wrap',
              transition: 'all 0.2s ease',
            }}
            onMouseOver={(e) => { e.currentTarget.style.borderColor = '#F97316'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(249,115,22,0.15)' }}
            onMouseOut={(e) => { e.currentTarget.style.borderColor = 'rgba(249,115,22,0.4)'; e.currentTarget.style.boxShadow = 'none' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: 48, height: 48, borderRadius: '12px', background: 'rgba(249,115,22,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0 }}>
                🏠
              </div>
              <div style={{ textAlign: 'left' }}>
                <p style={{ fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: '1rem', color: 'white', marginBottom: '3px' }}>
                  List Your Hostel / Flat
                </p>
                <p style={{ fontFamily: 'DM Sans,sans-serif', fontSize: '0.8rem', color: '#94A3B8', lineHeight: 1.4 }}>
                  Register with your name, contact info & exact map location — free, takes 2 minutes
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#F97316', color: 'white', borderRadius: '10px', padding: '0.55rem 1.1rem', flexShrink: 0, fontFamily: 'DM Sans,sans-serif', fontWeight: 600, fontSize: '0.875rem' }}>
              Get Listed →
            </div>
          </button>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: '#0F172A', padding: '1.5rem 0', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <p style={{ fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: '0.9rem', color: 'white', marginBottom: '4px' }}>
            Sikar<span style={{ color: '#F97316' }}>Nest</span>
          </p>
          <p style={{ fontFamily: 'DM Sans,sans-serif', fontSize: '0.75rem', color: '#475569' }}>
            © 2026 SikarNest · Built for tenants in Sikar, Rajasthan · Free · No broker fees
          </p>
        </div>
      </footer>
    </>
  )
}
