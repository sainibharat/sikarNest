/**
 * components/LoginModal.jsx — Real Authentication Modal
 *
 * Two fixed modes (no switching inside the modal):
 *
 *  'customer/tenant'  → Title: "Login or Sign in to SikarNest"
 *                       DB role: 'tenant'
 *
 *  'owner'            → Title: "Become a host on SikarNest"
 *                       DB role: 'owner'
 *
 * Auth options:
 *   1. Google Sign-In  — Official Google button (GSI renderButton → popup)
 *   2. Email OTP       — Real 6-digit code sent via nodemailer → JWT
 */
import { useState, useEffect, useRef } from 'react'
import { sendOTP, verifyOTP, googleLogin } from '../lib/api'

// ─── Google Client ID from Vite env ───────────────────────────────────────────
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

// ─── Module-level flags so GSI is only loaded/initialized ONCE ───────────────
// Multiple modal opens would cause "initialize called multiple times" error otherwise
let _gsiScriptLoading = false   // true while <script> tag is being loaded
let _gsiInitialized   = false   // true after google.accounts.id.initialize() is called

// Module-level slot for the active modal's credential handler.
// Updated on every modal mount so we never pass a stale closure into GSI.
let _activeCredentialHandler = null

// ─── Per-mode UI text ─────────────────────────────────────────────────────────
const MODE_CONFIG = {
  'customer/tenant': {
    title:    'Login or Sign in to SikarNest',
    subtitle: 'Find new hostels/flats easily',
  },
  owner: {
    title:    'Become a host on SikarNest',
    subtitle: 'List your property for rent, get vacancy alerts and many more.',
  },
}

// ─── Spinner ───────────────────────────────────────────────────────────────────
function Spinner({ color = 'white' }) {
  return (
    <div style={{
      width: 16, height: 16, borderRadius: '50%',
      border: `2px solid ${color === 'white' ? 'rgba(255,255,255,0.3)' : '#E2E8F0'}`,
      borderTopColor: color === 'white' ? 'white' : '#F97316',
      animation: 'spin 0.7s linear infinite', flexShrink: 0,
    }} />
  )
}

// ─── OTP digit inputs ──────────────────────────────────────────────────────────
function OTPInput({ value, onChange }) {
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

// ─── Main Component ────────────────────────────────────────────────────────────
export default function LoginModal({ initialMode = 'customer/tenant', onClose, onSuccess }) {
  const [mode]              = useState(initialMode)   // locked — no switching
  const [step, setStep]     = useState('main')        // 'main' | 'otp'
  const [email, setEmail]   = useState('')
  const [otp, setOtp]       = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')
  const [timer, setTimer]   = useState(0)
  const [gsiReady, setGsiReady] = useState(false)     // true once GSI is ready to render

  // Div where Google's official button iframe will be rendered
  const googleDivRef = useRef(null)

  // Refs for values needed inside module-level callback (avoids stale closures)
  const modeRef      = useRef(mode)
  const onSuccessRef = useRef(onSuccess)
  const setLoadRef   = useRef(setLoading)
  const setErrRef    = useRef(setError)

  // Keep refs in sync with latest props/state
  useEffect(() => { modeRef.current      = mode      }, [mode])
  useEffect(() => { onSuccessRef.current = onSuccess }, [onSuccess])

  const cfg = MODE_CONFIG[mode] || MODE_CONFIG['customer/tenant']

  // ── OTP countdown ────────────────────────────────────────────────────────
  useEffect(() => {
    if (timer <= 0) return
    const t = setTimeout(() => setTimer(s => s - 1), 1000)
    return () => clearTimeout(t)
  }, [timer])

  // ── Register this modal's Google credential handler ───────────────────────
  // Uses module-level slot so GSI (initialized once) always calls the latest handler.
  useEffect(() => {
    _activeCredentialHandler = async ({ credential }) => {
      setLoadRef.current(true)
      setErrRef.current('')
      try {
        const { user } = await googleLogin(credential, modeRef.current)
        onSuccessRef.current({
          name:  user.name,
          email: user.email,
          photo: user.photo,
          role:  user.role,
        })
      } catch (err) {
        setErrRef.current(err.message || 'Google sign-in failed. Please try again.')
        setLoadRef.current(false)
      }
    }
    // Clear when modal unmounts
    return () => { _activeCredentialHandler = null }
  }, []) // Run only once on mount — refs keep values fresh

  // ── Load GSI script and initialize (both happen only once ever) ───────────
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return

    function initGSI() {
      // Guard: google.accounts.id.initialize() must only be called once per page load.
      // Calling it multiple times causes the "initialize() is called multiple times" warning
      // and the FedCM / prompt-suppression errors.
      if (!_gsiInitialized) {
        window.google.accounts.id.initialize({
          client_id:            GOOGLE_CLIENT_ID,
          // Route credential through module-level slot, not a stale closure
          callback:             (response) => _activeCredentialHandler?.(response),
          ux_mode:              'popup',   // opens Google picker as a popup, not a redirect
          auto_select:          false,     // don't auto-sign-in silently
          cancel_on_tap_outside: false,
        })
        _gsiInitialized = true
      }
      setGsiReady(true)
    }

    if (window.google?.accounts?.id) {
      // GSI script already loaded from a previous modal open
      initGSI()
    } else if (!_gsiScriptLoading) {
      // First time — inject the script tag
      _gsiScriptLoading = true
      const script = document.createElement('script')
      script.id    = 'gsi-script'
      script.src   = 'https://accounts.google.com/gsi/client'
      script.async = true
      script.onload = initGSI
      document.head.appendChild(script)
    } else {
      // Script tag already in DOM but still loading — poll until ready
      const interval = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(interval)
          initGSI()
        }
      }, 100)
      return () => clearInterval(interval)
    }
  }, []) // Empty deps — only run on first mount

  // ── Render official Google Sign-In button into the div ────────────────────
  // Called whenever gsiReady becomes true OR we return to 'main' step.
  // renderButton() draws Google's own iframe button — this bypasses all the
  // browser-level prompt-suppression that affects prompt().
  useEffect(() => {
    if (!gsiReady || step !== 'main') return
    if (!googleDivRef.current || !window.google?.accounts?.id) return
    // Clear previous render before re-rendering (e.g. after returning from OTP step)
    googleDivRef.current.innerHTML = ''
    window.google.accounts.id.renderButton(googleDivRef.current, {
      theme:          'outline',
      size:           'large',
      width:          350,        // px — matches modal width
      text:           'continue_with',
      logo_alignment: 'left',
    })
  }, [gsiReady, step])

  // ── Send real OTP via backend → nodemailer ────────────────────────────────
  const handleSendOTP = async () => {
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setError('Please enter a valid email address')
      return
    }
    setLoading(true)
    setError('')
    try {
      await sendOTP(email)     // POST /api/auth/send-otp
      setStep('otp')
      setTimer(60)
      setOtp('')
    } catch (err) {
      setError(err.message || 'Could not send OTP. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ── Verify OTP entered by user ────────────────────────────────────────────
  const handleVerifyOTP = async () => {
    if (otp.length < 6) { setError('Enter all 6 digits'); return }
    setLoading(true)
    setError('')
    try {
      // mode is sent as role so backend assigns 'tenant' or 'owner' correctly
      const { user } = await verifyOTP(email, otp, mode)
      onSuccess({ name: user.name, email: user.email, photo: user.photo, role: user.role })
    } catch (err) {
      setError(err.message || 'Incorrect OTP or it has expired.')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = () => { setOtp(''); setError(''); handleSendOTP() }

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 420 }}>

        {/* ── Header ── */}
        <div style={{ padding: '1.1rem 1.5rem 0' }}>
          <div style={{
            display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
            paddingBottom: '1rem', borderBottom: '1px solid #E2E8F0',
          }}>
            <div>
              <h2 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '1rem', color: '#0F172A', lineHeight: 1.35 }}>
                {step === 'otp' ? '📧 Check your Gmail' : cfg.title}
              </h2>
              {step === 'main' && (
                <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.78rem', color: '#64748B', marginTop: '3px', lineHeight: 1.5 }}>
                  {cfg.subtitle}
                </p>
              )}
              {step === 'otp' && (
                <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.72rem', color: '#94A3B8', marginTop: '2px' }}>
                  6-digit code sent to <strong style={{ color: '#0F172A' }}>{email}</strong>
                </p>
              )}
            </div>
            {/* Close button */}
            <button
              onClick={onClose}
              style={{ background: 'none', border: 'none', fontSize: '1.4rem', color: '#94A3B8', lineHeight: 1, cursor: 'pointer', padding: '2px 6px', borderRadius: '6px', flexShrink: 0, marginLeft: '0.5rem' }}
              onMouseOver={(e) => (e.currentTarget.style.background = '#F1F5F9')}
              onMouseOut={(e)  => (e.currentTarget.style.background = 'none')}
            >×</button>
          </div>
        </div>

        {/* ── Body ── */}
        <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>

          {/* ── MAIN STEP ── */}
          {step === 'main' && (
            <>
              {/* Google Sign-In button rendered by GSI into this div */}
              {GOOGLE_CLIENT_ID ? (
                <div style={{ position: 'relative', minHeight: 44 }}>
                  {/* GSI injects an <iframe> into this div — do NOT put anything else here */}
                  <div
                    ref={googleDivRef}
                    style={{ display: 'flex', justifyContent: 'center', width: '100%' }}
                  />
                  {/* Loading overlay while GSI hasn't rendered yet */}
                  {!gsiReady && (
                    <div style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                      padding: '0.75rem', border: '1.5px solid #E2E8F0', borderRadius: '10px',
                      background: '#F8FAFC', color: '#94A3B8',
                      fontFamily: 'DM Sans, sans-serif', fontSize: '0.85rem',
                    }}>
                      <Spinner color="gray" /> Loading Google Sign-In…
                    </div>
                  )}
                  {/* Spinner overlay while signing in */}
                  {loading && (
                    <div style={{
                      position: 'absolute', inset: 0, borderRadius: '10px',
                      background: 'rgba(255,255,255,0.85)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                      fontFamily: 'DM Sans, sans-serif', fontSize: '0.85rem', color: '#64748B',
                    }}>
                      <Spinner color="gray" /> Signing in…
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ padding: '0.75rem', border: '1.5px dashed #E2E8F0', borderRadius: '10px', textAlign: 'center', fontFamily: 'DM Sans,sans-serif', fontSize: '0.8rem', color: '#94A3B8' }}>
                  ⚠️ Set <code>VITE_GOOGLE_CLIENT_ID</code> in frontend/.env to enable Google login
                </div>
              )}

              {/* Divider */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ flex: 1, height: 1, background: '#E2E8F0' }} />
                <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.72rem', color: '#94A3B8', flexShrink: 0 }}>
                  or continue with email
                </span>
                <div style={{ flex: 1, height: 1, background: '#E2E8F0' }} />
              </div>

              {/* Email + OTP */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <input
                  className="input"
                  type="email"
                  placeholder="Your email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError('') }}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendOTP()}
                  autoComplete="email"
                  disabled={loading}
                />
                <button
                  className="btn btn-primary"
                  style={{ width: '100%', justifyContent: 'center', gap: '0.4rem' }}
                  onClick={handleSendOTP}
                  disabled={loading || !email}
                >
                  {loading ? <><Spinner /> Sending OTP…</> : 'Send OTP →'}
                </button>
              </div>
            </>
          )}

          {/* ── OTP STEP ── */}
          {step === 'otp' && (
            <>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: 64, height: 64, borderRadius: '50%',
                  background: 'linear-gradient(135deg,#FFF7ED,#FFEDD5)',
                  border: '2px solid rgba(249,115,22,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.8rem', margin: '0 auto 0.75rem',
                }}>📬</div>
                <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.85rem', color: '#334155', lineHeight: 1.6 }}>
                  We sent a 6-digit code to<br />
                  <strong style={{ color: '#0F172A' }}>{email}</strong>
                </p>
                <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.72rem', color: '#94A3B8', marginTop: '4px' }}>
                  Check inbox + spam · Expires in 10 min
                </p>
              </div>

              <OTPInput value={otp} onChange={setOtp} />

              <button
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center', gap: '0.4rem', opacity: otp.length < 6 ? 0.6 : 1 }}
                onClick={handleVerifyOTP}
                disabled={loading || otp.length < 6}
              >
                {loading ? <><Spinner /> Verifying…</> : 'Verify & Sign In →'}
              </button>

              <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                {timer > 0 ? (
                  <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.78rem', color: '#94A3B8' }}>
                    Resend OTP in <strong>{timer}s</strong>
                  </p>
                ) : (
                  <button
                    onClick={handleResend}
                    style={{ background: 'none', border: 'none', fontFamily: 'DM Sans, sans-serif', fontSize: '0.8rem', color: '#F97316', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Resend OTP
                  </button>
                )}
                <button
                  onClick={() => { setStep('main'); setOtp(''); setError('') }}
                  style={{ background: 'none', border: 'none', fontFamily: 'DM Sans, sans-serif', fontSize: '0.78rem', color: '#64748B', cursor: 'pointer' }}
                >
                  ← Use different email
                </button>
              </div>
            </>
          )}

          {/* Error */}
          {error && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', padding: '0.55rem 0.75rem' }}>
              <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.78rem', color: '#DC2626', margin: 0 }}>
                ⚠️ {error}
              </p>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div style={{ padding: '0.75rem 1.5rem', background: '#F8FAFC', borderTop: '1px solid #E2E8F0', borderRadius: '0 0 16px 16px' }}>
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.7rem', color: '#94A3B8', textAlign: 'center' }}>
            🔒 Free · No broker fees · Your data stays private
          </p>
        </div>
      </div>
    </div>
  )
}
