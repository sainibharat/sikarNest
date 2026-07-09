/**
 * components/ListPropertyModal.jsx — 6-Step "List Your Property" Wizard
 *
 * Opens as a modal overlay when owner clicks "List Your Property" button.
 * Walks the owner through 6 steps and submits to POST /api/submissions.
 *
 * Steps:
 *   1. Property Type
 *      - Hostel → shows gender selector (Boys / Girls / Both)
 *      - Flat   → shows flat size selector (1BHK / 2BHK / 3BHK)
 *
 *   2. Contact Info — owner name, WhatsApp number, email
 *
 *   3. Property Details
 *      - Hostel: name, rent/bed, total beds, vacant beds
 *      - Flat:   name, rent/flat, total flats, vacant flats
 *      - Hostel facilities: WiFi, Mess, AC, CCTV, Laundry, RO, Gym, Parking, Study Room, TV, Geyser
 *      - Flat facilities:   Parking, Fully Furnished, Water Supply, Power Backup, Lift
 *
 *   4. Photos — upload up to 5 images (local preview; first stored as cover)
 *
 *   5. Description + full address (text fields)
 *
 *   6. Location — tap on Leaflet map to drop a pin (lat/lng captured)
 *      Reverse geocoding via Nominatim API fills address hint.
 *
 *   7. Success screen — shows submitted listing summary
 *
 * On submit:
 *   Calls submitListing() from lib/api.js → POST /api/submissions
 *   Submission appears in owner's /owner dashboard as "Under Review"
 *   Admin approves it at /admin → listing goes live for students
 *
 * Props:
 *   onClose — called when modal is dismissed or submission succeeds
 */
import { useState, useRef } from 'react'
import { submitListing } from '../lib/api'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import L from 'leaflet'

// Fix Leaflet icons for Vite
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})
const orangePin = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`<svg xmlns="http://www.w3.org/2000/svg" width="28" height="38" viewBox="0 0 28 38"><path d="M14 0C6.268 0 0 6.268 0 14c0 9.8 14 24 14 24S28 23.8 28 14C28 6.268 21.732 0 14 0z" fill="#F97316"/><circle cx="14" cy="14" r="6" fill="white"/><circle cx="14" cy="14" r="3.5" fill="#F97316"/></svg>`),
  iconSize: [28, 38], iconAnchor: [14, 38], popupAnchor: [0, -38],
})
const SIKAR = [27.6094, 75.1396]

function MapClicker({ onPick }) {
  useMapEvents({ click: (e) => onPick(e.latlng.lat, e.latlng.lng) })
  return null
}
async function reverseGeocode(lat, lng) {
  try {
    const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`)
    const d = await r.json()
    return d.display_name || ''
  } catch { return '' }
}

// ─── Amenities per type ────────────────────────────────────────────────────
const HOSTEL_AMENITIES = [
  { key: 'WiFi', label: 'Wi-Fi', icon: '📶' },
  { key: 'Mess', label: 'Mess / Food', icon: '🍽️' },
  { key: 'AC', label: 'AC Rooms', icon: '❄️' },
  { key: 'CCTV', label: 'CCTV', icon: '📷' },
  { key: 'Laundry', label: 'Laundry', icon: '👕' },
  { key: 'RO Water', label: 'RO Water', icon: '💧' },
  { key: 'Gym', label: 'Gym', icon: '🏋️' },
  { key: 'Parking', label: 'Parking', icon: '🅿️' },
  { key: 'Study Room', label: 'Study Room', icon: '📚' },
  { key: 'TV Room', label: 'TV / Common Room', icon: '📺' },
  { key: 'Geyser', label: 'Geyser', icon: '🚿' },
]
const FLAT_AMENITIES = [
  { key: 'Parking', label: 'Parking', icon: '🅿️' },
  { key: 'Furnished', label: 'Fully Furnished', icon: '🛋️' },
  { key: 'Water', label: 'Water Supply', icon: '💧' },
  { key: 'Power Backup', label: 'Power Backup', icon: '🔋' },
  { key: 'Lift', label: 'Elevator / Lift', icon: '🛗' },
]

// ─── Step definitions ──────────────────────────────────────────────────────
const STEPS = [
  { id: 1, label: 'Type', icon: '🏠' },
  { id: 2, label: 'Contact', icon: '👤' },
  { id: 3, label: 'Details', icon: '📋' },
  { id: 4, label: 'Photos', icon: '📸' },
  { id: 5, label: 'Address', icon: '📝' },
  { id: 6, label: 'Location', icon: '📍' },
]

// ─── Small helpers ──────────────────────────────────────────────────────────
function Field({ label, required, hint, children }) {
  return (
    <div>
      <label style={{ fontFamily: 'DM Sans,sans-serif', fontWeight: 600, fontSize: '0.78rem', color: '#475569', display: 'block', marginBottom: '0.4rem' }}>
        {label}{required && <span style={{ color: '#F97316' }}> *</span>}
      </label>
      {children}
      {hint && <p style={{ fontFamily: 'DM Sans,sans-serif', fontSize: '0.68rem', color: '#94A3B8', marginTop: '4px' }}>{hint}</p>}
    </div>
  )
}

function TypeCard({ value, emoji, label, sub, selected, onClick }) {
  return (
    <button onClick={onClick} style={{
      padding: '1rem 0.5rem', border: `2px solid ${selected ? '#F97316' : '#E2E8F0'}`,
      borderRadius: '12px', background: selected ? '#FFF7ED' : 'white',
      cursor: 'pointer', transition: 'all 0.15s', textAlign: 'center', flex: 1,
    }}>
      <div style={{ fontSize: '2rem', marginBottom: '0.3rem' }}>{emoji}</div>
      <p style={{ fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: '0.85rem', color: selected ? '#F97316' : '#0F172A' }}>{label}</p>
      <p style={{ fontFamily: 'DM Sans,sans-serif', fontSize: '0.67rem', color: '#94A3B8', marginTop: '2px' }}>{sub}</p>
    </button>
  )
}

function PillBtn({ label, icon, selected, onClick }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: '5px',
      padding: '0.38rem 0.8rem', borderRadius: '999px',
      border: `1.5px solid ${selected ? '#F97316' : '#E2E8F0'}`,
      background: selected ? '#FFF7ED' : 'white',
      fontFamily: 'DM Sans,sans-serif', fontWeight: 500, fontSize: '0.76rem',
      color: selected ? '#C2410C' : '#475569', cursor: 'pointer', transition: 'all 0.15s',
    }}>
      <span>{icon}</span>{label}
      {selected && <span style={{ color: '#F97316', fontWeight: 700, fontSize: '0.65rem', marginLeft: 2 }}>✓</span>}
    </button>
  )
}

function ChoiceBtn({ label, selected, onClick }) {
  return (
    <button onClick={onClick} style={{
      flex: 1, padding: '0.6rem 0.5rem', textAlign: 'center',
      border: `2px solid ${selected ? '#F97316' : '#E2E8F0'}`,
      borderRadius: '10px', background: selected ? '#FFF7ED' : 'white',
      fontFamily: 'DM Sans,sans-serif', fontWeight: 600, fontSize: '0.8rem',
      color: selected ? '#F97316' : '#334155', cursor: 'pointer', transition: 'all 0.15s',
    }}>
      {label}
    </button>
  )
}

function Spinner() {
  return <div style={{ width: 15, height: 15, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.35)', borderTopColor: 'white', animation: 'spin 0.7s linear infinite' }} />
}

// ─── Main Component ────────────────────────────────────────────────────────
export default function ListPropertyModal({ onClose }) {
  const [step, setStep] = useState(1)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const fileRef = useRef(null)

  // ── Form state ────────────────────────────────────────────────────────
  const [form, setForm] = useState({
    // Step 1
    type: '',       // 'hostel' | 'flat'
    gender: '',     // 'boys' | 'girls' | 'co-ed'  — hostel only
    bhk: '',        // '1BHK' | '2BHK' | '3BHK'    — flat only
    // Step 2
    ownerName: '', phone: '', email: '',
    // Step 3
    name: '', rent: '',
    totalBeds: '', vacantBeds: '',   // hostel
    totalFlats: '', vacantFlats: '', // flat
    amenities: [],
    // Step 4 — photos (object URLs for preview, max 5)
    photos: [],       // [{ url, name }]
    // Step 5
    description: '', address: '',
  })
  // Step 6 — map
  const [pin, setPin] = useState(null)
  const [geocoded, setGeocoded] = useState('')
  const [geocoding, setGeocoding] = useState(false)

  const upd = (k, v) => { setForm((f) => ({ ...f, [k]: v })); setError('') }

  const toggleAmenity = (key) => {
    setForm((f) => ({
      ...f,
      amenities: f.amenities.includes(key)
        ? f.amenities.filter((a) => a !== key)
        : [...f.amenities, key],
    }))
  }

  const handlePick = async (lat, lng) => {
    setPin({ lat, lng })
    setGeocoding(true)
    const addr = await reverseGeocode(lat, lng)
    setGeocoded(addr)
    if (addr && !form.address) upd('address', addr.split(',').slice(0, 4).join(', '))
    setGeocoding(false)
  }

  // ── Photo file picker ────────────────────────────────────────────────
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files)
    const remaining = 5 - form.photos.length
    const toAdd = files.slice(0, remaining).map((f) => ({
      url: URL.createObjectURL(f),
      name: f.name,
    }))
    upd('photos', [...form.photos, ...toAdd])
    e.target.value = ''
  }

  const removePhoto = (i) => {
    const next = form.photos.filter((_, idx) => idx !== i)
    setForm((f) => ({ ...f, photos: next }))
  }

  // ── Validation ────────────────────────────────────────────────────────
  const validate = () => {
    setError('')
    if (step === 1) {
      if (!form.type) return setError('Select a property type') || false
      if (form.type === 'hostel' && !form.gender) return setError('Select who this hostel is for') || false
      if (form.type === 'flat' && !form.bhk) return setError('Select flat size (1BHK / 2BHK / 3BHK)') || false
    }
    if (step === 2) {
      if (!form.ownerName.trim()) return setError('Your name is required') || false
      if (!form.phone.match(/^[6-9]\d{9}$/)) return setError('Enter a valid 10-digit phone number') || false
      if (!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) return setError('Enter a valid email address') || false
    }
    if (step === 3) {
      if (!form.name.trim()) return setError('Property name is required') || false
      if (!form.rent || isNaN(form.rent)) return setError('Enter the monthly rent amount') || false
      if (form.type === 'hostel' && !form.totalBeds) return setError('Enter total number of beds') || false
      if (form.type === 'flat' && !form.totalFlats) return setError('Enter number of flats / rooms') || false
    }
    if (step === 5) {
      if (!form.address.trim()) return setError('Enter the full property address') || false
    }
    if (step === 6) {
      if (!pin) return setError('Tap on the map to pin your exact location') || false
    }
    return true
  }

  const handleNext = () => {
    if (validate()) {
      if (step < 6) setStep(step + 1)
      else handleSubmit()
    }
  }

  // ── Submit ────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setLoading(true)
    setError('')
    try {
      const isFlat = form.type === 'flat'
      await submitListing({
        name: form.name,
        type: form.type,
        gender: isFlat ? 'co-ed' : form.gender,
        address: form.address,
        lat: pin.lat,
        lng: pin.lng,
        rent: Number(form.rent),
        totalBeds: isFlat ? Number(form.totalFlats) || 0 : Number(form.totalBeds) || 0,
        vacancy: isFlat ? Number(form.vacantFlats) || 0 : Number(form.vacantBeds) || 0,
        amenities: form.amenities,
        phone: form.phone,
        ownerName: form.ownerName,
        ownerEmail: form.email,
        description: form.description,
        image: form.photos[0]?.url || '',
        bhk: form.bhk || '',
      })
      setStep(7) // success
    } catch (err) {
      setError(err.message || 'Submission failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const isFlat = form.type === 'flat'
  const amenitiesList = isFlat ? FLAT_AMENITIES : HOSTEL_AMENITIES

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{
        maxWidth: step === 6 ? 560 : 480,
        maxHeight: '94vh',
        display: 'flex', flexDirection: 'column',
        transition: 'max-width 0.3s ease',
      }}>

        {/* ── Header ── */}
        <div style={{ padding: '1rem 1.4rem 0', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
            <div>
              <h2 style={{ fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: '1rem', color: '#0F172A' }}>
                {step === 7 ? '🎉 Listing Submitted!' : '🏠 List Your Property'}
              </h2>
              {step < 7 && (
                <p style={{ fontFamily: 'DM Sans,sans-serif', fontSize: '0.71rem', color: '#94A3B8', marginTop: '2px' }}>
                  Step {step} of 6 — {STEPS[step - 1].label}
                </p>
              )}
            </div>
            <button onClick={onClose}
              style={{ background: 'none', border: 'none', fontSize: '1.4rem', color: '#94A3B8', lineHeight: 1, cursor: 'pointer', padding: '4px 8px', borderRadius: '6px' }}
              onMouseOver={(e) => (e.currentTarget.style.background = '#F1F5F9')}
              onMouseOut={(e) => (e.currentTarget.style.background = 'none')}
            >×</button>
          </div>

          {/* Step tracker */}
          {step < 7 && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 0 }}>
              {STEPS.map((s, i) => {
                const done = s.id < step
                const active = s.id === step
                return (
                  <div key={s.id} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                    {i > 0 && (
                      <div style={{
                        position: 'absolute', top: 11, right: '50%', left: '-50%', height: 2,
                        background: done ? '#F97316' : '#E2E8F0', transition: 'background 0.3s',
                      }} />
                    )}
                    <div style={{
                      width: 24, height: 24, borderRadius: '50%', zIndex: 1,
                      background: done ? '#F97316' : active ? '#FFF7ED' : '#F1F5F9',
                      border: `2px solid ${done ? '#F97316' : active ? '#F97316' : '#E2E8F0'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: '0.6rem',
                      color: done ? 'white' : active ? '#F97316' : '#94A3B8',
                      transition: 'all 0.25s',
                    }}>
                      {done ? '✓' : s.id}
                    </div>
                    <span style={{
                      fontFamily: 'DM Sans,sans-serif', fontSize: '0.57rem',
                      fontWeight: active ? 600 : 400,
                      color: active ? '#F97316' : done ? '#64748B' : '#CBD5E1',
                      marginTop: '3px', textAlign: 'center',
                    }}>{s.label}</span>
                  </div>
                )
              })}
            </div>
          )}

          {/* Progress bar */}
          {step < 7 && (
            <div style={{ height: 2, background: '#F1F5F9', marginTop: '0.7rem' }}>
              <div style={{ height: '100%', width: `${(step / 6) * 100}%`, background: 'linear-gradient(90deg,#F97316,#FB923C)', transition: 'width 0.4s ease', borderRadius: 2 }} />
            </div>
          )}
        </div>

        {/* ── Body ── */}
        <div style={{ padding: '1.1rem 1.4rem', overflowY: 'auto', flex: 1 }}>

          {/* ══════ STEP 1: Property Type ══════ */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <p style={{ fontFamily: 'DM Sans,sans-serif', fontSize: '0.82rem', color: '#64748B', textAlign: 'center' }}>
                What type of property are you listing?
              </p>

              {/* Hostel / Flat — NO PG */}
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <TypeCard
                  value="hostel" emoji="🏢" label="Hostel"
                  sub="Boys / Girls / Co-Ed"
                  selected={form.type === 'hostel'}
                  onClick={() => { upd('type', 'hostel'); upd('gender', ''); upd('bhk', '') }}
                />
                <TypeCard
                  value="flat" emoji="🏠" label="Flat / Room"
                  sub="1BHK / 2BHK / 3BHK"
                  selected={form.type === 'flat'}
                  onClick={() => { upd('type', 'flat'); upd('gender', ''); upd('bhk', '') }}
                />
              </div>

              {/* ── Hostel → Gender ── */}
              {form.type === 'hostel' && (
                <div style={{ animation: 'slideUp 0.2s ease' }}>
                  <p style={{ fontFamily: 'DM Sans,sans-serif', fontWeight: 600, fontSize: '0.78rem', color: '#475569', marginBottom: '0.5rem' }}>
                    This hostel is for <span style={{ color: '#F97316' }}>*</span>
                  </p>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <ChoiceBtn label="👦 Only Boys" selected={form.gender === 'boys'} onClick={() => upd('gender', 'boys')} />
                    <ChoiceBtn label="👧 Only Girls" selected={form.gender === 'girls'} onClick={() => upd('gender', 'girls')} />
                    <ChoiceBtn label="👥 Both Boys & Girls" selected={form.gender === 'co-ed'} onClick={() => upd('gender', 'co-ed')} />
                  </div>
                </div>
              )}

              {/* ── Flat → BHK ── */}
              {form.type === 'flat' && (
                <div style={{ animation: 'slideUp 0.2s ease' }}>
                  <p style={{ fontFamily: 'DM Sans,sans-serif', fontWeight: 600, fontSize: '0.78rem', color: '#475569', marginBottom: '0.5rem' }}>
                    Flat size <span style={{ color: '#F97316' }}>*</span>
                  </p>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {['1BHK', '2BHK', '3BHK'].map((b) => (
                      <ChoiceBtn key={b} label={b} selected={form.bhk === b} onClick={() => upd('bhk', b)} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ══════ STEP 2: Contact Info ══════ */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <p style={{ fontFamily: 'DM Sans,sans-serif', fontSize: '0.82rem', color: '#64748B', textAlign: 'center' }}>
                Students will contact you directly — no broker needed
              </p>

              <Field label="Your Full Name" required>
                <input className="input" placeholder="e.g. Ramesh Sharma" value={form.ownerName}
                  onChange={(e) => upd('ownerName', e.target.value)} />
              </Field>

              <Field label="WhatsApp / Phone" required hint="📱 Students can WhatsApp or call this number">
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontFamily: 'DM Sans', fontSize: '0.82rem', color: '#94A3B8', zIndex: 1 }}>+91</span>
                  <input className="input" placeholder="10-digit number" value={form.phone}
                    onChange={(e) => upd('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                    style={{ paddingLeft: '2.5rem' }} />
                </div>
              </Field>

              <Field label="Email Address" required hint="🔒 Used only to send listing confirmation">
                <input className="input" type="email" placeholder="yourname@gmail.com" value={form.email}
                  onChange={(e) => upd('email', e.target.value)} />
              </Field>
            </div>
          )}

          {/* ══════ STEP 3: Property Details + Facilities ══════ */}
          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>

              <Field label={isFlat ? 'Flat / Apartment Name' : 'Hostel Name'} required>
                <input className="input"
                  placeholder={isFlat ? 'e.g. Green View Apartment' : 'e.g. Shri Ram Boys Hostel'}
                  value={form.name} onChange={(e) => upd('name', e.target.value)} />
              </Field>

              <Field label={`Monthly Rent per ${isFlat ? 'Flat' : 'Bed'}`} required>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', fontSize: '0.9rem' }}>₹</span>
                  <input className="input" placeholder={isFlat ? 'e.g. 6000' : 'e.g. 3500'} value={form.rent}
                    onChange={(e) => upd('rent', e.target.value.replace(/\D/g, ''))}
                    style={{ paddingLeft: '1.75rem' }} />
                </div>
              </Field>

              {/* Hostel: beds */}
              {!isFlat && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                  <Field label="Total Beds" required>
                    <input className="input" placeholder="e.g. 20" value={form.totalBeds}
                      onChange={(e) => upd('totalBeds', e.target.value.replace(/\D/g, ''))} />
                  </Field>
                  <Field label="Currently Vacant Beds">
                    <input className="input" placeholder="e.g. 5" value={form.vacantBeds}
                      onChange={(e) => upd('vacantBeds', e.target.value.replace(/\D/g, ''))} />
                  </Field>
                </div>
              )}

              {/* Flat: rooms */}
              {isFlat && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                  <Field label="Total Flats / Rooms" required>
                    <input className="input" placeholder="e.g. 4" value={form.totalFlats}
                      onChange={(e) => upd('totalFlats', e.target.value.replace(/\D/g, ''))} />
                  </Field>
                  <Field label="Currently Vacant">
                    <input className="input" placeholder="e.g. 1" value={form.vacantFlats}
                      onChange={(e) => upd('vacantFlats', e.target.value.replace(/\D/g, ''))} />
                  </Field>
                </div>
              )}

              {/* Facilities */}
              <Field label="Facilities Provided">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {amenitiesList.map((a) => (
                    <PillBtn key={a.key} label={a.label} icon={a.icon}
                      selected={form.amenities.includes(a.key)}
                      onClick={() => toggleAmenity(a.key)} />
                  ))}
                </div>
                {form.amenities.length > 0 && (
                  <p style={{ fontFamily: 'DM Sans,sans-serif', fontSize: '0.7rem', color: '#16A34A', marginTop: '6px' }}>
                    ✓ {form.amenities.length} facilit{form.amenities.length === 1 ? 'y' : 'ies'} selected
                  </p>
                )}
              </Field>
            </div>
          )}

          {/* ══════ STEP 4: Upload Photos ══════ */}
          {step === 4 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              <p style={{ fontFamily: 'DM Sans,sans-serif', fontSize: '0.82rem', color: '#64748B', textAlign: 'center' }}>
                Add up to <strong>5 photos</strong> — listings with photos get 3× more inquiries
              </p>

              {/* Upload area */}
              {form.photos.length < 5 && (
                <div
                  onClick={() => fileRef.current?.click()}
                  style={{
                    border: '2px dashed #E2E8F0', borderRadius: '12px',
                    padding: '1.75rem 1rem', textAlign: 'center', cursor: 'pointer',
                    transition: 'all 0.15s', background: '#FAFAFA',
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.borderColor = '#F97316'; e.currentTarget.style.background = '#FFF7ED' }}
                  onMouseOut={(e) => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.background = '#FAFAFA' }}
                >
                  <div style={{ fontSize: '2rem', marginBottom: '0.4rem' }}>📸</div>
                  <p style={{ fontFamily: 'Sora,sans-serif', fontWeight: 600, fontSize: '0.85rem', color: '#0F172A' }}>
                    Click to add photos
                  </p>
                  <p style={{ fontFamily: 'DM Sans,sans-serif', fontSize: '0.72rem', color: '#94A3B8', marginTop: '4px' }}>
                    JPG, PNG, WEBP · {5 - form.photos.length} remaining
                  </p>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    multiple
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                  />
                </div>
              )}

              {/* Photo grid preview */}
              {form.photos.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0.5rem' }}>
                  {form.photos.map((p, i) => (
                    <div key={i} style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', aspectRatio: '1', border: '1.5px solid #E2E8F0' }}>
                      <img src={p.url} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      {i === 0 && (
                        <span style={{ position: 'absolute', top: 4, left: 4, background: '#F97316', color: 'white', fontFamily: 'DM Sans,sans-serif', fontSize: '0.6rem', fontWeight: 700, padding: '2px 7px', borderRadius: '999px' }}>
                          Cover
                        </span>
                      )}
                      <button onClick={() => removePhoto(i)} style={{
                        position: 'absolute', top: 4, right: 4, background: 'rgba(15,23,42,0.65)',
                        border: 'none', color: 'white', borderRadius: '50%', width: 20, height: 20,
                        fontSize: '0.7rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>✕</button>
                    </div>
                  ))}
                  {form.photos.length < 5 && (
                    <div
                      onClick={() => fileRef.current?.click()}
                      style={{ aspectRatio: '1', border: '2px dashed #E2E8F0', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: '#FAFAFA', gap: '4px', transition: 'border-color 0.15s' }}
                      onMouseOver={(e) => (e.currentTarget.style.borderColor = '#F97316')}
                      onMouseOut={(e) => (e.currentTarget.style.borderColor = '#E2E8F0')}
                    >
                      <span style={{ fontSize: '1.3rem', color: '#94A3B8' }}>＋</span>
                      <span style={{ fontFamily: 'DM Sans,sans-serif', fontSize: '0.62rem', color: '#94A3B8' }}>Add more</span>
                    </div>
                  )}
                </div>
              )}

              <p style={{ fontFamily: 'DM Sans,sans-serif', fontSize: '0.7rem', color: '#94A3B8', textAlign: 'center' }}>
                💡 You can skip this step and add photos later
              </p>
            </div>
          )}

          {/* ══════ STEP 5: Description + Address ══════ */}
          {step === 5 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>

              <Field label="Full Property Address" required>
                <textarea className="input" rows={3}
                  placeholder="Building/House No., Street Name, Area/Locality, Sikar, Rajasthan 332001"
                  value={form.address} onChange={(e) => upd('address', e.target.value)}
                  style={{ resize: 'vertical' }}
                />
                <p style={{ fontFamily: 'DM Sans,sans-serif', fontSize: '0.68rem', color: '#94A3B8', marginTop: '4px' }}>
                  📍 Be as specific as possible so students can find you easily
                </p>
              </Field>

              <Field label="Description (optional)">
                <textarea className="input" rows={4}
                  placeholder={isFlat
                    ? 'e.g. Fully furnished 2BHK flat near Station Road. Includes sofa, beds, kitchen with gas connection. Ideal for working professionals or families.'
                    : 'e.g. Well-maintained boys hostel near Allen Institute. Home-cooked meals available. 24/7 security with CCTV. Walking distance from coaching centres.'}
                  value={form.description} onChange={(e) => upd('description', e.target.value)}
                  style={{ resize: 'vertical' }}
                />
              </Field>
            </div>
          )}

          {/* ══════ STEP 6: Map Location ══════ */}
          {step === 6 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <p style={{ fontFamily: 'DM Sans,sans-serif', fontSize: '0.82rem', color: '#64748B', textAlign: 'center' }}>
                Tap on the map to pin your exact property location
              </p>

              {/* Pin status */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                background: pin ? '#F0FDF4' : '#FFFBEB',
                border: `1px solid ${pin ? '#86EFAC' : '#FDE68A'}`,
                borderRadius: '8px', padding: '0.55rem 0.75rem',
              }}>
                <span style={{ fontSize: '1rem', flexShrink: 0 }}>{pin ? '📌' : '👆'}</span>
                <p style={{ fontFamily: 'DM Sans,sans-serif', fontSize: '0.77rem', color: pin ? '#14532D' : '#92400E', margin: 0, flex: 1 }}>
                  {pin
                    ? geocoding
                      ? 'Getting address…'
                      : `Pinned: ${geocoded.split(',').slice(0, 2).join(',') || `${pin.lat.toFixed(4)}, ${pin.lng.toFixed(4)}`}`
                    : 'Tap anywhere on the map to drop a pin'}
                </p>
                {pin && (
                  <button onClick={() => { setPin(null); setGeocoded('') }}
                    style={{ background: 'none', border: 'none', fontFamily: 'DM Sans,sans-serif', fontSize: '0.7rem', color: '#DC2626', cursor: 'pointer', flexShrink: 0 }}>
                    Clear
                  </button>
                )}
              </div>

              {/* Map */}
              <div style={{ borderRadius: '12px', overflow: 'hidden', border: `2px solid ${pin ? '#F97316' : '#E2E8F0'}`, cursor: 'crosshair', transition: 'border-color 0.25s' }}>
                <MapContainer center={SIKAR} zoom={13} style={{ height: 270, width: '100%' }} scrollWheelZoom={false}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="© OSM" />
                  <MapClicker onPick={handlePick} />
                  {pin && <Marker position={[pin.lat, pin.lng]} icon={orangePin} />}
                </MapContainer>
              </div>

              {pin && (
                <p style={{ fontFamily: 'DM Sans,sans-serif', fontSize: '0.68rem', color: '#94A3B8', textAlign: 'center' }}>
                  📍 {pin.lat.toFixed(5)}, {pin.lng.toFixed(5)}
                </p>
              )}
            </div>
          )}

          {/* ══════ STEP 7: Success ══════ */}
          {step === 7 && (
            <div style={{ textAlign: 'center', padding: '1.5rem 0', animation: 'slideUp 0.35s ease' }}>
              <div style={{
                width: 72, height: 72, borderRadius: '50%',
                background: 'linear-gradient(135deg,#F0FDF4,#DCFCE7)',
                border: '3px solid #86EFAC',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '2rem', margin: '0 auto 1rem',
              }}>✅</div>
              <h3 style={{ fontFamily: 'Sora,sans-serif', fontWeight: 800, fontSize: '1.2rem', color: '#0F172A', marginBottom: '0.5rem' }}>
                Listing Submitted!
              </h3>
              <div style={{ background: '#F8FAFC', borderRadius: '12px', padding: '0.85rem 1rem', marginBottom: '1rem', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                <p style={{ fontFamily: 'DM Sans,sans-serif', fontSize: '0.8rem', color: '#334155' }}>
                  🏠 <strong>{form.name}</strong> {form.bhk && `(${form.bhk})`}
                </p>
                <p style={{ fontFamily: 'DM Sans,sans-serif', fontSize: '0.8rem', color: '#334155' }}>
                  💰 ₹{Number(form.rent).toLocaleString()}/month
                </p>
                {form.photos.length > 0 && (
                  <p style={{ fontFamily: 'DM Sans,sans-serif', fontSize: '0.8rem', color: '#334155' }}>
                    📸 {form.photos.length} photo{form.photos.length > 1 ? 's' : ''} attached
                  </p>
                )}
                <p style={{ fontFamily: 'DM Sans,sans-serif', fontSize: '0.8rem', color: '#334155' }}>
                  📧 Confirmation to: <strong>{form.email}</strong>
                </p>
              </div>
              <p style={{ fontFamily: 'DM Sans,sans-serif', fontSize: '0.82rem', color: '#64748B', lineHeight: 1.6, marginBottom: '1.25rem' }}>
                We'll review and publish your listing within <strong>24 hours</strong>.
                Students will contact you directly at <strong>+91 {form.phone}</strong>.
              </p>
              <button className="btn btn-primary" style={{ margin: '0 auto', justifyContent: 'center' }} onClick={onClose}>
                Done 🎉
              </button>
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{ marginTop: '0.75rem', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', padding: '0.55rem 0.75rem' }}>
              <p style={{ fontFamily: 'DM Sans,sans-serif', fontSize: '0.78rem', color: '#DC2626', margin: 0 }}>⚠️ {error}</p>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        {step < 7 && (
          <div style={{ padding: '0.9rem 1.4rem', borderTop: '1px solid #E2E8F0', display: 'flex', gap: '0.6rem', flexShrink: 0 }}>
            {step > 1 && (
              <button className="btn btn-outline" onClick={() => { setStep(step - 1); setError('') }} style={{ flex: 1 }}>
                ← Back
              </button>
            )}
            <button
              className="btn btn-dark"
              style={{ flex: 2, justifyContent: 'center', gap: '0.4rem' }}
              onClick={handleNext}
              disabled={loading}
            >
              {loading
                ? <><Spinner /> Submitting…</>
                : step === 6
                  ? 'Submit Listing →'
                  : step === 4
                    ? form.photos.length > 0 ? `Next: Address → (${form.photos.length} photo${form.photos.length > 1 ? 's' : ''})` : 'Skip Photos →'
                    : `Next: ${STEPS[step].label} →`}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
