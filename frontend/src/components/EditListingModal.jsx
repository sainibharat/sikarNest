import { useState } from 'react'
import { updateListing } from '../lib/api'

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

function PillBtn({ label, icon, selected, onClick }) {
  return (
    <button type="button" onClick={onClick} style={{
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

function Spinner() {
  return <div style={{ width: 15, height: 15, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.35)', borderTopColor: 'white', animation: 'spin 0.7s linear infinite' }} />
}

export default function EditListingModal({ listing, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const isFlat = listing.type === 'flat'
  const amenitiesList = isFlat ? FLAT_AMENITIES : HOSTEL_AMENITIES

  const [form, setForm] = useState({
    vacancy: listing.vacancy || 0,
    rent: listing.rent || '',
    phone: listing.phone || '',
    amenities: listing.amenities || [],
    description: listing.description || '',
  })

  const upd = (k, v) => {
    setForm((prev) => ({ ...prev, [k]: v }))
    setError('')
  }

  const toggleAmenity = (key) => {
    setForm((f) => ({
      ...f,
      amenities: f.amenities.includes(key)
        ? f.amenities.filter((a) => a !== key)
        : [...f.amenities, key],
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (form.vacancy < 0) throw new Error("Vacancy cannot be negative")
      if (form.rent <= 0) throw new Error("Rent must be a valid positive number")
      if (!form.phone.match(/^[6-9]\d{9}$/)) throw new Error("Enter a valid 10-digit phone number")

      await updateListing(listing._id, {
        vacancy: Number(form.vacancy),
        rent: Number(form.rent),
        phone: form.phone,
        amenities: form.amenities,
        description: form.description,
        ownerEmail: listing.ownerEmail
      })
      onSuccess()
    } catch (err) {
      setError(err.message || 'Failed to update listing. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 500, maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        
        {/* Header */}
        <div style={{ padding: '1.25rem 1.4rem', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: '1.1rem', color: '#0F172A' }}>
              Edit Listing
            </h2>
            <p style={{ fontFamily: 'DM Sans,sans-serif', fontSize: '0.8rem', color: '#64748B', marginTop: '2px' }}>
              {listing.name}
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5rem', color: '#94A3B8', cursor: 'pointer', padding: '4px' }}>×</button>
        </div>

        {/* Form Body */}
        <div style={{ padding: '1.4rem', overflowY: 'auto', flex: 1 }}>
          <form id="edit-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <Field label={`Available ${isFlat ? 'Flats' : 'Beds'}`} required>
                <input 
                  type="number" className="input" 
                  value={form.vacancy} 
                  onChange={(e) => upd('vacancy', e.target.value)} 
                  min="0" max={listing.totalBeds}
                />
              </Field>
              
              <Field label="Monthly Rent" required>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}>₹</span>
                  <input 
                    type="number" className="input" style={{ paddingLeft: '1.8rem' }}
                    value={form.rent} 
                    onChange={(e) => upd('rent', e.target.value)} 
                  />
                </div>
              </Field>
            </div>

            <Field label="WhatsApp / Phone" required>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontFamily: 'DM Sans', fontSize: '0.82rem', color: '#94A3B8' }}>+91</span>
                <input 
                  className="input" style={{ paddingLeft: '2.5rem' }}
                  value={form.phone}
                  onChange={(e) => upd('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                />
              </div>
            </Field>

            <Field label="Facilities Provided">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {amenitiesList.map((a) => (
                  <PillBtn key={a.key} label={a.label} icon={a.icon}
                    selected={form.amenities.includes(a.key)}
                    onClick={() => toggleAmenity(a.key)} />
                ))}
              </div>
            </Field>

            <Field label="Description">
              <textarea 
                className="input" rows={4} style={{ resize: 'vertical' }}
                value={form.description} 
                onChange={(e) => upd('description', e.target.value)} 
              />
            </Field>

            {error && (
              <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', padding: '0.75rem' }}>
                <p style={{ fontFamily: 'DM Sans,sans-serif', fontSize: '0.8rem', color: '#DC2626', margin: 0 }}>⚠️ {error}</p>
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div style={{ padding: '1rem 1.4rem', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <button type="button" className="btn btn-outline" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" form="edit-form" className="btn btn-primary" disabled={loading} style={{ width: '120px', justifyContent: 'center' }}>
            {loading ? <Spinner /> : 'Save Changes'}
          </button>
        </div>

      </div>
    </div>
  )
}
