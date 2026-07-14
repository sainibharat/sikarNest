/**
 * components/OTPInput.jsx — 6-digit OTP entry widget
 *
 * Renders 6 individual digit boxes. Handles:
 *   - Auto-advance focus to next box on digit entry
 *   - Backspace focus-back to previous box
 *   - Numeric-only input
 *
 * Props:
 *   value    — current OTP string (e.g. '12' for partially filled)
 *   onChange — called with the updated full string on any change
 */
export default function OTPInput({ value, onChange }) {
  const digits = (value + '      ').slice(0, 6).split('')

  const handleChange = (e, i) => {
    const arr = (value + '      ').slice(0, 6).split('')
    arr[i] = e.target.value.replace(/\D/g, '').slice(-1)
    onChange(arr.join('').trimEnd())
    if (e.target.value && i < 5) document.getElementById(`otp-${i + 1}`)?.focus()
  }

  const handleKeyDown = (e, i) => {
    if (e.key === 'Backspace' && !digits[i].trim() && i > 0)
      document.getElementById(`otp-${i - 1}`)?.focus()
  }

  return (
    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
      {digits.map((d, i) => (
        <input
          key={i}
          id={`otp-${i}`}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={d.trim()}
          onChange={(e) => handleChange(e, i)}
          onKeyDown={(e) => handleKeyDown(e, i)}
          autoFocus={i === 0}
          style={{
            width: 44, height: 52, textAlign: 'center',
            fontSize: '1.3rem', fontFamily: 'Sora, sans-serif', fontWeight: 700,
            border: `2px solid ${d.trim() ? '#F97316' : '#E2E8F0'}`,
            borderRadius: '10px', color: '#0F172A',
            background: d.trim() ? '#FFF7ED' : 'white',
            outline: 'none', transition: 'border-color 0.15s, background 0.15s',
          }}
        />
      ))}
    </div>
  )
}
