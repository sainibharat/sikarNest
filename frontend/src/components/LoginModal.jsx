/**
 * components/LoginModal.jsx — Authentication Modal
 *
 * Single unified login/signup for all users.
 *
 * Steps:
 *   'main' — Shows two auth options:
 *              1. Google Sign-In  (GSI renderButton → popup)
 *              2. Email OTP       (6-digit code via nodemailer → JWT)
 *   'otp'  — Shows the OTP entry screen after email is submitted.
 *
 * Key design decisions:
 *   - GSI (Google Identity Services) is initialized once per page load using
 *     module-level flags (_gsiInitialized, _gsiScriptLoading). Re-init causes
 *     "initialize() called multiple times" warnings + FedCM suppression errors.
 *   - The Google credential callback routes through a module-level slot
 *     (_activeCredentialHandler) so it always calls the current modal's handler
 *     even though GSI itself is initialized only once.
 *   - OTP digit input is extracted into <OTPInput> (see OTPInput.jsx).
 *
 * Props:
 *   onClose   — called when user dismisses the modal
 *   onSuccess — called with { name, email, photo } after successful auth
 */
import { useState, useEffect, useRef } from 'react'
import { sendOTP, verifyOTP, googleLogin } from '../lib/api'
import OTPInput from './OTPInput'

// ─── Google Client ID from Vite env ──────────────────────────────────────────
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

// ─── Module-level GSI state (must stay here — not in a hook) ─────────────────
let _gsiScriptLoading = false  // true while <script> is being fetched
let _gsiInitialized = false  // true after initialize() has been called
let _activeCredentialHandler = null  // set on mount, cleared on unmount

// ─── Spinner ──────────────────────────────────────────────────────────────────
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

// ─── Main Component ───────────────────────────────────────────────────────────
export default function LoginModal({ onClose, onSuccess }) {
  const [step, setStep] = useState('main')  // 'main' | 'otp'
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [timer, setTimer] = useState(0)
  const [gsiReady, setGsiReady] = useState(false)

  const googleDivRef = useRef(null)
  const onSuccessRef = useRef(onSuccess)
  const setLoadRef = useRef(setLoading)
  const setErrRef = useRef(setError)

  useEffect(() => { onSuccessRef.current = onSuccess }, [onSuccess])

  // ── OTP resend countdown ──────────────────────────────────────────────────
  useEffect(() => {
    if (timer <= 0) return
    const t = setTimeout(() => setTimer(s => s - 1), 1000)
    return () => clearTimeout(t)
  }, [timer])

  // ── Register Google credential handler (runs on mount only) ───────────────
  useEffect(() => {
    _activeCredentialHandler = async ({ credential }) => {
      setLoadRef.current(true)
      setErrRef.current('')
      try {
        const { user } = await googleLogin(credential)
        onSuccessRef.current({ name: user.name, email: user.email, photo: user.photo })
      } catch (err) {
        setErrRef.current(err.message || 'Google sign-in failed. Please try again.')
        setLoadRef.current(false)
      }
    }
    return () => { _activeCredentialHandler = null }
  }, [])

  // ── Load GSI script + initialize (both happen only once ever) ─────────────
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return

    function initGSI() {
      if (!_gsiInitialized) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (res) => _activeCredentialHandler?.(res),
          ux_mode: 'popup',
          auto_select: false,
          cancel_on_tap_outside: false,
        })
        _gsiInitialized = true
      }
      setGsiReady(true)
    }

    if (window.google?.accounts?.id) {
      initGSI()
    } else if (!_gsiScriptLoading) {
      _gsiScriptLoading = true
      const script = document.createElement('script')
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true
      script.onload = initGSI
      document.head.appendChild(script)
    } else {
      // Script already injected but still loading — poll
      const iv = setInterval(() => {
        if (window.google?.accounts?.id) { clearInterval(iv); initGSI() }
      }, 100)
      return () => clearInterval(iv)
    }
  }, [])

  // ── Render Google button whenever GSI is ready or we return to main step ──
  useEffect(() => {
    if (!gsiReady || step !== 'main') return
    if (!googleDivRef.current || !window.google?.accounts?.id) return
    googleDivRef.current.innerHTML = ''
    window.google.accounts.id.renderButton(googleDivRef.current, {
      theme: 'outline', size: 'large', width: 350,
      text: 'continue_with', logo_alignment: 'left',
    })
  }, [gsiReady, step])

  // ── Email OTP handlers ────────────────────────────────────────────────────
  const handleSendOTP = async () => {
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setError('Please enter a valid email address'); return
    }
    setLoading(true); setError('')
    try {
      await sendOTP(email)
      setStep('otp'); setTimer(60); setOtp('')
    } catch (err) {
      setError(err.message || 'Could not send OTP. Please try again.')
    } finally { setLoading(false) }
  }

  const handleVerifyOTP = async () => {
    if (otp.length < 6) { setError('Enter all 6 digits'); return }
    setLoading(true); setError('')
    try {
      const { user } = await verifyOTP(email, otp)
      onSuccess({ name: user.name, email: user.email, photo: user.photo })
    } catch (err) {
      setError(err.message || 'Incorrect OTP or it has expired.')
    } finally { setLoading(false) }
  }

  const handleResend = () => { setOtp(''); setError(''); handleSendOTP() }
  const backToMain = () => { setStep('main'); setOtp(''); setError('') }

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 420 }}>

        {/* Header */}
        <div style={{ padding: '1.1rem 1.5rem 0' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', paddingBottom: '1rem', borderBottom: '1px solid #E2E8F0' }}>
            <div>
              <h2 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '1rem', color: '#0F172A', lineHeight: 1.35 }}>
                {step === 'otp' ? '📧 Check your Gmail' : 'Log in or sign up to SikarNest'}
              </h2>
              {step === 'main' && (
                <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.78rem', color: '#64748B', marginTop: '3px', lineHeight: 1.5 }}>
                  Find flats, list properties, and manage everything in one place.
                </p>
              )}
              {step === 'otp' && (
                <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.72rem', color: '#94A3B8', marginTop: '2px' }}>
                  6-digit code sent to <strong style={{ color: '#0F172A' }}>{email}</strong>
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              style={{ background: 'none', border: 'none', fontSize: '1.4rem', color: '#94A3B8', lineHeight: 1, cursor: 'pointer', padding: '2px 6px', borderRadius: '6px', flexShrink: 0, marginLeft: '0.5rem' }}
              onMouseOver={(e) => (e.currentTarget.style.background = '#F1F5F9')}
              onMouseOut={(e) => (e.currentTarget.style.background = 'none')}
            >×</button>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>

          {/* ── MAIN: Google + Email OTP ── */}
          {step === 'main' && (
            <>
              {GOOGLE_CLIENT_ID ? (
                <div style={{ position: 'relative', minHeight: 44 }}>
                  {/* GSI renders its button iframe into this div */}
                  <div ref={googleDivRef} style={{ display: 'flex', justifyContent: 'center', width: '100%' }} />
                  {!gsiReady && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.75rem', border: '1.5px solid #E2E8F0', borderRadius: '10px', background: '#F8FAFC', color: '#94A3B8', fontFamily: 'DM Sans, sans-serif', fontSize: '0.85rem' }}>
                      <Spinner color="gray" /> Loading Google Sign-In…
                    </div>
                  )}
                  {loading && (
                    <div style={{ position: 'absolute', inset: 0, borderRadius: '10px', background: 'rgba(255,255,255,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontFamily: 'DM Sans, sans-serif', fontSize: '0.85rem', color: '#64748B' }}>
                      <Spinner color="gray" /> Signing in…
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ padding: '0.75rem', border: '1.5px dashed #E2E8F0', borderRadius: '10px', textAlign: 'center', fontFamily: 'DM Sans,sans-serif', fontSize: '0.8rem', color: '#94A3B8' }}>
                  ⚠️ Set <code>VITE_GOOGLE_CLIENT_ID</code> in frontend/.env to enable Google login
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ flex: 1, height: 1, background: '#E2E8F0' }} />
                <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.72rem', color: '#94A3B8', flexShrink: 0 }}>or continue with email</span>
                <div style={{ flex: 1, height: 1, background: '#E2E8F0' }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <input
                  className="input" type="email" placeholder="Your email"
                  value={email} autoComplete="email" disabled={loading}
                  onChange={(e) => { setEmail(e.target.value); setError('') }}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendOTP()}
                />
                <button
                  className="btn btn-primary"
                  style={{ width: '100%', justifyContent: 'center', gap: '0.4rem' }}
                  onClick={handleSendOTP} disabled={loading || !email}
                >
                  {loading ? <><Spinner /> Sending OTP…</> : 'Send OTP →'}
                </button>
              </div>
            </>
          )}

          {/* ── OTP: Enter 6-digit code ── */}
          {step === 'otp' && (
            <>
              <div style={{ textAlign: 'center' }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg,#FFF7ED,#FFEDD5)', border: '2px solid rgba(249,115,22,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', margin: '0 auto 0.75rem' }}>📬</div>
                <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.85rem', color: '#334155', lineHeight: 1.6 }}>
                  We sent a 6-digit code to<br /><strong style={{ color: '#0F172A' }}>{email}</strong>
                </p>
                <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.72rem', color: '#94A3B8', marginTop: '4px' }}>
                  Check inbox + spam · Expires in 10 min
                </p>
              </div>

              <OTPInput value={otp} onChange={setOtp} />

              <button
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center', gap: '0.4rem', opacity: otp.length < 6 ? 0.6 : 1 }}
                onClick={handleVerifyOTP} disabled={loading || otp.length < 6}
              >
                {loading ? <><Spinner /> Verifying…</> : 'Verify & Sign In →'}
              </button>

              <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                {timer > 0
                  ? <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.78rem', color: '#94A3B8' }}>Resend OTP in <strong>{timer}s</strong></p>
                  : <button onClick={handleResend} style={{ background: 'none', border: 'none', fontFamily: 'DM Sans, sans-serif', fontSize: '0.8rem', color: '#F97316', fontWeight: 600, cursor: 'pointer' }}>Resend OTP</button>
                }
                <button onClick={backToMain} style={{ background: 'none', border: 'none', fontFamily: 'DM Sans, sans-serif', fontSize: '0.78rem', color: '#64748B', cursor: 'pointer' }}>
                  ← Use different email
                </button>
              </div>
            </>
          )}

          {/* Error banner */}
          {error && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', padding: '0.55rem 0.75rem' }}>
              <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.78rem', color: '#DC2626', margin: 0 }}>⚠️ {error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '0.75rem 1.5rem', background: '#F8FAFC', borderTop: '1px solid #E2E8F0', borderRadius: '0 0 16px 16px' }}>
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.7rem', color: '#94A3B8', textAlign: 'center' }}>
            🔒 Free · No broker fees · Your data stays private
          </p>
        </div>
      </div>
    </div>
  )
}
