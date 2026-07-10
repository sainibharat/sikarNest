/**
 * components/ListingCard.jsx — Listing Summary Card
 *
 * Displays a single listing in the search results / home page grid.
 * Shows: cover photo, type badge, gender tag, name, address, rent,
 *        amenity chips, vacancy count, and a heart (save) button.
 *
 * Clicking the card → navigates to /listing/:id (full detail page).
 * Heart button → toggles save without navigating (event.stopPropagation).
 *
 * Props:
 *   listing      — full listing object from the API
 *   isSaved      — boolean: is this listing saved by the user?
 *   onToggleSave — function(id): toggles saved state in App.jsx
 */
import { useNavigate } from 'react-router-dom'

const TYPE_COLORS = { hostel: 'badge-hostel', pg: 'badge-pg', flat: 'badge-flat' }
const GENDER_LABELS = { boys: '👦 Boys', girls: '👧 Girls', 'co-ed': '👥 Co-Ed', family: '👨‍👩‍👧‍👦 Family' }

function HeartIcon({ filled }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24"
      fill={filled ? '#F97316' : 'none'}
      stroke={filled ? '#F97316' : 'white'}
      strokeWidth="2.5"
    >
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
    </svg>
  )
}

export default function ListingCard({ listing, compact = false, user, isSaved = false, onToggleSave }) {
  const navigate = useNavigate()
  const isFull = listing.vacancy === 0

  const handleSave = (e) => {
    e.stopPropagation()
    if (!user) return // silently ignore if not logged in
    onToggleSave?.(listing.id)
  }

  return (
    <article
      className="card"
      onClick={() => navigate(`/listing/${listing.id}`)}
      style={{ width: compact ? 220 : '100%', flexShrink: 0, cursor: 'pointer', display: 'flex', flexDirection: 'column' }}
    >
      {/* Image */}
      <div style={{ position: 'relative', height: compact ? 130 : 170, overflow: 'hidden' }}>
        <img
          src={listing.image}
          alt={listing.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s ease' }}
          onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
          onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        />

        {/* Type badge */}
        <div style={{ position: 'absolute', top: 8, left: 8 }}>
          <span className={`badge ${TYPE_COLORS[listing.type]}`} style={{ textTransform: 'capitalize' }}>
            {listing.type}
          </span>
        </div>

        {/* Vacancy pill */}
        <div style={{ position: 'absolute', top: 8, right: user ? 38 : 8 }}>
          <span className={isFull ? 'pill-full' : 'pill-vacant'}>
            {isFull ? '🔒 Full' : `${listing.vacancy} Free`}
          </span>
        </div>

        {/* Heart/Save button — only when logged in */}
        {user && (
          <button
            onClick={handleSave}
            title={isSaved ? 'Remove from saved' : 'Save listing'}
            style={{
              position: 'absolute', top: 8, right: 8,
              width: 28, height: 28, borderRadius: '50%',
              background: isSaved ? 'white' : 'rgba(15,23,42,0.45)',
              border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.15s',
              backdropFilter: 'blur(4px)',
            }}
            onMouseOver={(e) => { e.currentTarget.style.background = isSaved ? '#FFF7ED' : 'rgba(15,23,42,0.7)'; e.currentTarget.style.transform = 'scale(1.12)' }}
            onMouseOut={(e) => { e.currentTarget.style.background = isSaved ? 'white' : 'rgba(15,23,42,0.45)'; e.currentTarget.style.transform = 'scale(1)' }}
          >
            <HeartIcon filled={isSaved} />
          </button>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: '0.85rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
        <h3 style={{ fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: compact ? '0.82rem' : '0.95rem', color: '#0F172A', lineHeight: 1.3 }}>
          {listing.name}
        </h3>
        <p style={{ fontFamily: 'DM Sans,sans-serif', fontSize: '0.75rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '3px' }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
            <circle cx="12" cy="9" r="2.5" />
          </svg>
          {listing.location}
        </p>

        {!compact && (
          <p style={{ fontFamily: 'DM Sans,sans-serif', fontSize: '0.72rem', color: '#94A3B8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {listing.address}
          </p>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: '0.5rem', borderTop: '1px solid #F1F5F9' }}>
          <div>
            <span style={{ fontFamily: 'Sora,sans-serif', fontWeight: 800, fontSize: compact ? '0.9rem' : '1rem', color: '#0F172A' }}>
              ₹{listing.rent.toLocaleString()}
            </span>
            <span style={{ fontFamily: 'DM Sans,sans-serif', fontSize: '0.7rem', color: '#94A3B8' }}>/mo</span>
          </div>
          <span style={{ fontFamily: 'DM Sans,sans-serif', fontSize: '0.7rem', color: '#64748B' }}>
            {GENDER_LABELS[listing.gender]}
          </span>
        </div>
      </div>
    </article>
  )
}
