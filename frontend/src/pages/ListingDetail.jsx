/**
 * pages/ListingDetail.jsx — Full Listing Detail Page
 *
 * Shows complete information for a single listing.
 * Route: /listing/:id  (where id = MongoDB _id)
 *
 * Contains:
 *   - Cover photo, type badge, gender tag, verified badge
 *   - Owner contact: phone + WhatsApp CTA button
 *   - Key stats: rent, vacancy, total beds/rooms
 *   - Amenities grid with emoji icons
 *   - Full description
 *   - Interactive Leaflet map pinned to listing coordinates
 *   - Heart (save) toggle button
 *
 * Data: fetchListingById(id) called on mount via URL :id param.
 * Props from App.jsx: user, savedIds, onToggleSave
 */
import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { fetchListingById } from '../lib/api'
import { MapContainer, TileLayer, Marker } from 'react-leaflet'
import L from 'leaflet'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const orangePin = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`<svg xmlns="http://www.w3.org/2000/svg" width="28" height="38" viewBox="0 0 28 38"><path d="M14 0C6.268 0 0 6.268 0 14c0 9.8 14 24 14 24S28 23.8 28 14C28 6.268 21.732 0 14 0z" fill="#F97316"/><circle cx="14" cy="14" r="6" fill="white"/><circle cx="14" cy="14" r="3.5" fill="#F97316"/></svg>`),
  iconSize: [28, 38], iconAnchor: [14, 38],
})

const TYPE_LABELS = { hostel: '🏢 Hostel', flat: '🏠 Flat' }
const GENDER_LABELS = { boys: '👦 Boys Only', girls: '👧 Girls Only', 'co-ed': '👥 Co-Ed' }
const AMENITY_ICONS = { WiFi: '📶', Mess: '🍽️', AC: '❄️', CCTV: '📷', Laundry: '👕', 'RO Water': '💧', Gym: '🏋️', Parking: '🅿️', 'Study Room': '📚' }

export default function ListingDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [listing, setListing] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchListingById(id)
      .then(setListing)
      .catch(() => setError('Listing not found'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid #F97316', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
          <p style={{ fontFamily: 'DM Sans,sans-serif', color: '#94A3B8', marginTop: '1rem', fontSize: '0.85rem' }}>Loading listing...</p>
        </div>
      </div>
    )
  }

  if (error || !listing) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🔍</div>
          <p style={{ fontFamily: 'DM Sans,sans-serif', color: '#64748B', marginBottom: '1rem' }}>Listing not found.</p>
          <button className="btn btn-dark" onClick={() => navigate('/')}>← Home</button>
        </div>
      </div>
    )
  }

  const isFull = listing.vacancy === 0

  return (
    <div style={{ background: '#F8FAFC', minHeight: '80vh', paddingBottom: '4rem' }}>
      {/* Back bar */}
      <div style={{ background: 'white', borderBottom: '1px solid #E2E8F0', padding: '0.75rem 0' }}>
        <div className="container">
          <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', fontFamily: 'DM Sans,sans-serif', fontSize: '0.85rem', color: '#64748B', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
            ← Back
          </button>
        </div>
      </div>

      <div className="container" style={{ paddingTop: '1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 320px', gap: '1.5rem', alignItems: 'start' }}>

          {/* ── Left column ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Photo */}
            <div style={{ borderRadius: '14px', overflow: 'hidden', height: 280 }}>
              <img src={listing.image} alt={listing.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>

            {/* Name & badges */}
            <div style={{ background: 'white', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '0.5rem' }}>
                <h1 style={{ fontFamily: 'Sora,sans-serif', fontWeight: 800, fontSize: '1.3rem', color: '#0F172A', lineHeight: 1.2 }}>
                  {listing.name}
                </h1>
                <span className={isFull ? 'pill-full' : 'pill-vacant'} style={{ flexShrink: 0 }}>
                  {isFull ? '🔒 Full' : `${listing.vacancy} Vacant`}
                </span>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.75rem' }}>
                <span style={{ background: '#FFF7ED', color: '#C2410C', fontFamily: 'DM Sans,sans-serif', fontSize: '0.75rem', fontWeight: 600, padding: '3px 10px', borderRadius: '999px' }}>
                  {TYPE_LABELS[listing.type]}
                </span>
                <span style={{ background: '#F1F5F9', color: '#475569', fontFamily: 'DM Sans,sans-serif', fontSize: '0.75rem', fontWeight: 600, padding: '3px 10px', borderRadius: '999px' }}>
                  {GENDER_LABELS[listing.gender]}
                </span>
                {listing.rating && (
                  <span style={{ background: '#FFF7ED', color: '#F97316', fontFamily: 'DM Sans,sans-serif', fontSize: '0.75rem', fontWeight: 700, padding: '3px 10px', borderRadius: '999px' }}>
                    ⭐ {listing.rating}
                  </span>
                )}
              </div>

              <p style={{ fontFamily: 'DM Sans,sans-serif', fontSize: '0.82rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '0.75rem' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="2">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                  <circle cx="12" cy="9" r="2.5" />
                </svg>
                {listing.address}
              </p>

              {listing.description && (
                <p style={{ fontFamily: 'DM Sans,sans-serif', fontSize: '0.85rem', color: '#334155', lineHeight: 1.6 }}>
                  {listing.description}
                </p>
              )}
            </div>

            {/* Amenities */}
            <div style={{ background: 'white', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '1.25rem' }}>
              <h3 style={{ fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: '0.95rem', color: '#0F172A', marginBottom: '0.75rem' }}>Amenities</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {listing.amenities.map((a) => (
                  <span key={a} style={{ display: 'flex', alignItems: 'center', gap: '5px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '0.35rem 0.75rem', fontFamily: 'DM Sans,sans-serif', fontSize: '0.8rem', color: '#334155', fontWeight: 500 }}>
                    {AMENITY_ICONS[a] || '•'} {a}
                  </span>
                ))}
              </div>
            </div>

            {/* Map */}
            <div style={{ background: 'white', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '1.25rem' }}>
              <h3 style={{ fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: '0.95rem', color: '#0F172A', marginBottom: '0.75rem' }}>Location on Map</h3>
              <div style={{ borderRadius: '10px', overflow: 'hidden' }}>
                <MapContainer center={[listing.lat, listing.lng]} zoom={15} style={{ height: 220, width: '100%' }} scrollWheelZoom={false}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='© OSM' />
                  <Marker position={[listing.lat, listing.lng]} icon={orangePin} />
                </MapContainer>
              </div>
              <p style={{ fontFamily: 'DM Sans,sans-serif', fontSize: '0.72rem', color: '#94A3B8', marginTop: '6px' }}>
                📍 {listing.lat.toFixed(5)}, {listing.lng.toFixed(5)}
              </p>
            </div>
          </div>

          {/* ── Right sidebar (sticky) ── */}
          <div style={{ position: 'sticky', top: 76, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ background: 'white', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '1.25rem' }}>
              <div style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid #F1F5F9' }}>
                <span style={{ fontFamily: 'Sora,sans-serif', fontWeight: 800, fontSize: '1.6rem', color: '#0F172A' }}>
                  ₹{listing.rent.toLocaleString()}
                </span>
                <span style={{ fontFamily: 'DM Sans,sans-serif', fontSize: '0.8rem', color: '#94A3B8' }}>/month</span>
                <p style={{ fontFamily: 'DM Sans,sans-serif', fontSize: '0.78rem', color: '#64748B', marginTop: '4px' }}>
                  {listing.totalBeds} beds total · {listing.vacancy} vacant
                </p>
              </div>

              {/* WhatsApp CTA */}
              <a
                href={`https://wa.me/91${listing.whatsapp}?text=${encodeURIComponent(`Hi, I found your listing "${listing.name}" on SikarNest. Is it currently vacant?`)}`}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                  width: '100%', padding: '0.75rem', borderRadius: '10px',
                  background: '#16A34A', color: 'white',
                  fontFamily: 'DM Sans,sans-serif', fontWeight: 700, fontSize: '0.9rem',
                  textDecoration: 'none', marginBottom: '0.6rem',
                  transition: 'background 0.15s',
                }}
                onMouseOver={(e) => (e.currentTarget.style.background = '#15803D')}
                onMouseOut={(e) => (e.currentTarget.style.background = '#16A34A')}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                Ask on WhatsApp
              </a>

              <a
                href={`tel:+91${listing.phone}`}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', width: '100%', padding: '0.65rem', borderRadius: '10px', border: '1.5px solid #E2E8F0', background: 'white', color: '#0F172A', fontFamily: 'DM Sans,sans-serif', fontWeight: 600, fontSize: '0.875rem', textDecoration: 'none' }}
              >
                📞 Call: +91 {listing.phone}
              </a>
            </div>

            <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '12px', padding: '0.875rem 1rem' }}>
              <p style={{ fontFamily: 'DM Sans,sans-serif', fontSize: '0.78rem', color: '#14532D', lineHeight: 1.5 }}>
                ✅ <strong>No broker fees</strong> — contact the owner directly. Always verify in person before paying.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Responsive styles */}
      <style>{`
        @media (max-width: 768px) {
          .container > div { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
