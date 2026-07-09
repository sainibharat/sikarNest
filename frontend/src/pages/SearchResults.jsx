/**
 * pages/SearchResults.jsx — Search & Browse Page
 *
 * Lets students filter and browse all verified listings.
 * URL query params drive the filter state (bookmarkable/shareable URLs):
 *   ?q=piprali    → text search across name, location, address
 *   ?type=hostel  → filter by property type
 *   ?gender=boys  → filter by gender
 *   ?maxRent=5000 → show only listings at or below this rent
 *   ?sort=price_asc|price_desc|vacancy → sort order
 *
 * Uses FilterBar component for the filter UI controls.
 * Fetches fresh from /api/listings whenever filters change.
 *
 * Props from App.jsx: user, savedIds, onToggleSave
 */
import { useState, useMemo, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { fetchListings } from '../lib/api'
import ListingCard from '../components/ListingCard'

const TYPE_OPTS = [
  { value: 'all', label: 'All Types' },
  { value: 'hostel', label: '🏢 Hostel' },
  { value: 'flat', label: '🏠 Flat' },
]

const GENDER_OPTS = [
  { value: 'all', label: 'All' },
  { value: 'boys', label: '👦 Boys' },
  { value: 'girls', label: '👧 Girls' },
  { value: 'co-ed', label: '👥 Co-Ed' },
]

const SORT_OPTS = [
  { value: 'default', label: 'Relevance' },
  { value: 'price_asc', label: 'Price: Low → High' },
  { value: 'price_desc', label: 'Price: High → Low' },
  { value: 'vacancy', label: 'Most Vacant' },
]

export default function SearchResults({ user, savedIds, onToggleSave }) {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const query = params.get('q') || ''

  const [typeFilter, setTypeFilter] = useState('all')
  const [genderFilter, setGenderFilter] = useState('all')
  const [maxRent, setMaxRent] = useState('')
  const [sortBy, setSortBy] = useState('default')
  const [showFilters, setShowFilters] = useState(false)
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)

  // Fetch from backend whenever query or filters change
  useEffect(() => {
    setLoading(true)
    fetchListings({ q: query, type: typeFilter, gender: genderFilter, maxRent, sort: sortBy })
      .then(setResults)
      .catch(() => setResults([]))
      .finally(() => setLoading(false))
  }, [query, typeFilter, genderFilter, maxRent, sortBy])

  const hasActiveFilters = typeFilter !== 'all' || genderFilter !== 'all' || maxRent
  const clearFilters = () => { setTypeFilter('all'); setGenderFilter('all'); setMaxRent('') }

  // Show empty state after loading if no results
  if (!loading && results.length === 0) {
    return (
      <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div style={{ textAlign: 'center', maxWidth: 400 }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>😔</div>
          <h2 style={{ fontFamily: 'Sora,sans-serif', fontWeight: 800, fontSize: '1.4rem', color: '#0F172A', marginBottom: '0.5rem' }}>
            No listings found
          </h2>
          <p style={{ fontFamily: 'DM Sans,sans-serif', color: '#64748B', marginBottom: '0.5rem' }}>
            We don't have listings for <strong>"{query}"</strong> yet.
          </p>
          <p style={{ fontFamily: 'DM Sans,sans-serif', fontSize: '0.82rem', color: '#94A3B8', marginBottom: '1.5rem' }}>
            Try: Piprali Road · Station Road · Fatehpur Road · Nehru Nagar · Bajaj Colony · Sudama Colony
          </p>
          <button className="btn btn-dark" onClick={() => navigate('/')}>← Back to Home</button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '80vh', background: '#F8FAFC', paddingBottom: '3rem' }}>

      {/* ── Top bar ── */}
      <div style={{ background: 'white', borderBottom: '1px solid #E2E8F0', padding: '0.85rem 0', position: 'sticky', top: 60, zIndex: 30 }}>
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.6rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', fontFamily: 'DM Sans,sans-serif', fontSize: '0.82rem' }}>
                ← Home
              </button>
              <div style={{ width: 1, height: 16, background: '#E2E8F0' }} />
              <h1 style={{ fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: '0.95rem', color: '#0F172A' }}>
                📍 {query}
              </h1>
              {!loading && (
                <span style={{ fontFamily: 'DM Sans,sans-serif', fontSize: '0.75rem', color: '#64748B', background: '#F1F5F9', padding: '2px 10px', borderRadius: '999px' }}>
                  {results.length} result{results.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {/* Sort dropdown */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{ fontFamily: 'DM Sans,sans-serif', fontSize: '0.8rem', color: '#0F172A', border: '1.5px solid #E2E8F0', borderRadius: '8px', padding: '0.35rem 0.6rem', background: 'white', cursor: 'pointer', outline: 'none' }}
              >
                {SORT_OPTS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>

              {/* Filter toggle */}
              <button
                onClick={() => setShowFilters((s) => !s)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '5px',
                  padding: '0.35rem 0.75rem', borderRadius: '8px',
                  border: `1.5px solid ${showFilters || hasActiveFilters ? '#F97316' : '#E2E8F0'}`,
                  background: showFilters || hasActiveFilters ? '#FFF7ED' : 'white',
                  color: showFilters || hasActiveFilters ? '#F97316' : '#64748B',
                  fontFamily: 'DM Sans,sans-serif', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer',
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="4" y1="6" x2="20" y2="6" /><line x1="8" y1="12" x2="16" y2="12" /><line x1="11" y1="18" x2="13" y2="18" />
                </svg>
                Filters {hasActiveFilters && '•'}
              </button>
            </div>
          </div>

          {/* ── Filter panel ── */}
          {showFilters && (
            <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid #F1F5F9', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-end' }}>

              {/* Type */}
              <div>
                <p style={{ fontFamily: 'DM Sans,sans-serif', fontSize: '0.72rem', fontWeight: 600, color: '#64748B', marginBottom: '0.35rem' }}>Type</p>
                <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                  {TYPE_OPTS.map((o) => (
                    <button key={o.value} onClick={() => setTypeFilter(o.value)}
                      style={{ padding: '0.25rem 0.75rem', borderRadius: '999px', border: `1.5px solid ${typeFilter === o.value ? '#F97316' : '#E2E8F0'}`, background: typeFilter === o.value ? '#FFF7ED' : 'white', color: typeFilter === o.value ? '#F97316' : '#64748B', fontFamily: 'DM Sans,sans-serif', fontWeight: 600, fontSize: '0.75rem', cursor: 'pointer' }}>
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Gender */}
              <div>
                <p style={{ fontFamily: 'DM Sans,sans-serif', fontSize: '0.72rem', fontWeight: 600, color: '#64748B', marginBottom: '0.35rem' }}>For</p>
                <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                  {GENDER_OPTS.map((o) => (
                    <button key={o.value} onClick={() => setGenderFilter(o.value)}
                      style={{ padding: '0.25rem 0.75rem', borderRadius: '999px', border: `1.5px solid ${genderFilter === o.value ? '#F97316' : '#E2E8F0'}`, background: genderFilter === o.value ? '#FFF7ED' : 'white', color: genderFilter === o.value ? '#F97316' : '#64748B', fontFamily: 'DM Sans,sans-serif', fontWeight: 600, fontSize: '0.75rem', cursor: 'pointer' }}>
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Max rent */}
              <div>
                <p style={{ fontFamily: 'DM Sans,sans-serif', fontSize: '0.72rem', fontWeight: 600, color: '#64748B', marginBottom: '0.35rem' }}>Max Rent (₹)</p>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', fontFamily: 'DM Sans', fontSize: '0.8rem', color: '#94A3B8' }}>₹</span>
                  <input
                    type="number" min="0" placeholder="e.g. 4000"
                    value={maxRent} onChange={(e) => setMaxRent(e.target.value)}
                    style={{ paddingLeft: '1.5rem', width: 110, padding: '0.3rem 0.6rem 0.3rem 1.5rem', border: '1.5px solid #E2E8F0', borderRadius: '8px', fontFamily: 'DM Sans,sans-serif', fontSize: '0.8rem', color: '#0F172A', outline: 'none' }}
                  />
                </div>
              </div>

              {/* Clear */}
              {hasActiveFilters && (
                <button onClick={clearFilters}
                  style={{ background: 'none', border: 'none', fontFamily: 'DM Sans,sans-serif', fontSize: '0.78rem', color: '#DC2626', cursor: 'pointer', fontWeight: 600 }}>
                  ✕ Clear filters
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Listing grid ── */}
      <div className="container" style={{ paddingTop: '1.5rem' }}>
        {loading ? (
          <div className="listing-grid">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{ height: 260, borderRadius: 12, background: '#F1F5F9', animation: 'pulse 1.5s ease infinite' }} />
            ))}
          </div>
        ) : results.length > 0 ? (
          <div className="listing-grid">
            {results.map((l) => (
              <ListingCard
                key={l._id}
                listing={{ ...l, id: l._id }}
                user={user}
                isSaved={savedIds?.includes(l._id)}
                onToggleSave={onToggleSave}
              />
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🔍</div>
            <p style={{ fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: '1rem', color: '#0F172A', marginBottom: '0.4rem' }}>No results match your filters</p>
            <p style={{ fontFamily: 'DM Sans,sans-serif', fontSize: '0.82rem', color: '#94A3B8', marginBottom: '1rem' }}>Try adjusting the type, gender, or price filter</p>
            <button className="btn btn-outline" onClick={clearFilters}>Clear all filters</button>
          </div>
        )}
      </div>
    </div>
  )
}
