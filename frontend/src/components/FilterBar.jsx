/**
 * components/FilterBar.jsx — Search Filter Controls
 *
 * Rendered inside SearchResults.jsx to let students narrow down listings.
 * Filters are reflected in URL query params (shareable/bookmarkable).
 *
 * Controls:
 *   - Area dropdown (Piprali Road, Station Road, etc.)
 *   - Gender filter (Boys / Girls / Co-Ed)
 *   - Max Rent slider (₹1000 – ₹10,000)
 *   - Amenity chips (WiFi, Mess, AC, etc.)
 *   - Sort order (Newest / Price Low-High / Most Vacant)
 *   - "Clear Filters" button
 *
 * Props:
 *   filters   — current active filter values (from URL params)
 *   onChange  — called with updated filter object when any filter changes
 */
const AREAS     = ['All Areas', 'Piprali Road', 'Station Road', 'Fatehpur Road', 'Bajaj Colony', 'Nehru Nagar']
const TYPES     = ['All Types', 'boys', 'girls', 'co-ed']
const AMENITIES = ['WiFi', 'Mess', 'AC', 'CCTV', 'Study Room', 'Gym', 'Parking', 'Laundry']
const PRICE_RANGES = [
  { label: 'All Budgets', min: 0, max: 99999 },
  { label: 'Under ₹3,500', min: 0, max: 3500 },
  { label: '₹3,500–5,000', min: 3500, max: 5000 },
  { label: 'Above ₹5,000', min: 5000, max: 99999 },
]

export default function FilterBar({ filters, onChange }) {
  const updateFilter = (key, value) => onChange({ ...filters, [key]: value })
  const toggleAmenity = (a) => updateFilter('amenity', filters.amenity === a ? '' : a)

  return (
    <div
      style={{
        background: 'white',
        border: '1px solid #E2E8F0',
        borderRadius: '12px',
        padding: '1.1rem 1.25rem',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '1rem',
        alignItems: 'flex-start',
      }}
    >
      {/* Type */}
      <div>
        <p style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 600, fontSize: '0.75rem', color: '#64748B', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Type
        </p>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {TYPES.map((t) => {
            const val = t === 'All Types' ? '' : t
            return (
              <button
                key={t}
                className={`chip ${filters.type === val ? 'active' : ''}`}
                onClick={() => updateFilter('type', val)}
              >
                {t === 'boys' ? '👦' : t === 'girls' ? '👧' : t === 'co-ed' ? '👥' : '🏠'} {t === 'All Types' ? 'All' : t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            )
          })}
        </div>
      </div>

      {/* Area */}
      <div>
        <p style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 600, fontSize: '0.75rem', color: '#64748B', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Area
        </p>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {AREAS.map((a) => {
            const val = a === 'All Areas' ? '' : a
            return (
              <button
                key={a}
                className={`chip ${filters.area === val ? 'active' : ''}`}
                onClick={() => updateFilter('area', val)}
              >
                {a === 'All Areas' ? 'All' : a}
              </button>
            )
          })}
        </div>
      </div>

      {/* Budget */}
      <div>
        <p style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 600, fontSize: '0.75rem', color: '#64748B', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Budget
        </p>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {PRICE_RANGES.map((pr) => {
            const isActive = filters.minRent === pr.min && filters.maxRent === pr.max
            return (
              <button
                key={pr.label}
                className={`chip ${isActive ? 'active' : ''}`}
                onClick={() => onChange({ ...filters, minRent: pr.min, maxRent: pr.max })}
              >
                {pr.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Amenities */}
      <div>
        <p style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 600, fontSize: '0.75rem', color: '#64748B', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Amenities
        </p>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {AMENITIES.map((a) => (
            <button
              key={a}
              className={`chip ${filters.amenity === a ? 'active' : ''}`}
              onClick={() => toggleAmenity(a)}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      {/* Vacant only toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: 'auto' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <div
            onClick={() => updateFilter('vacantOnly', !filters.vacantOnly)}
            style={{
              width: 40,
              height: 22,
              borderRadius: '999px',
              background: filters.vacantOnly ? '#F97316' : '#E2E8F0',
              position: 'relative',
              transition: 'background 0.2s',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 2,
                left: filters.vacantOnly ? 20 : 2,
                width: 18,
                height: 18,
                borderRadius: '50%',
                background: 'white',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                transition: 'left 0.2s',
              }}
            />
          </div>
          <span style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 600, fontSize: '0.82rem', color: '#0F172A' }}>
            Vacant only
          </span>
        </label>

        {/* Reset */}
        {(filters.type || filters.area || filters.amenity || filters.vacantOnly || (filters.maxRent && filters.maxRent < 99999)) && (
          <button
            onClick={() => onChange({ type: '', area: '', minRent: 0, maxRent: 99999, amenity: '', vacantOnly: false, search: filters.search })}
            style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '0.78rem',
              color: '#DC2626',
              background: '#FEE2E2',
              border: 'none',
              padding: '4px 10px',
              borderRadius: '999px',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            ✕ Reset
          </button>
        )}
      </div>
    </div>
  )
}
