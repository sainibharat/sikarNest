/**
 * lib/api.js — Frontend API Abstraction Layer
 *
 * All HTTP calls to the backend go through this file.
 * This keeps fetch logic in one place — if the API URL changes, only this file changes.
 *
 * Base URL:
 *   - In development: Vite proxy routes /api → http://localhost:5000/api (see vite.config.js)
 *   - In production:  Set VITE_API_URL env var to your deployed backend URL
 *
 * Auth:
 *   - JWT token is stored in localStorage as 'sikarnest_token'
 *   - The internal request() helper automatically sends it as Authorization: Bearer <token>
 *
 * Exported functions:
 *   fetchListings(params)        — GET /api/listings with optional filters
 *   fetchListingById(id)         — GET /api/listings/:id
 *   updateVacancy(id, vacancy)   — PUT /api/listings/:id/vacancy
 *   submitListing(form)          — POST /api/submissions (owner lists a property)
 *   sendOTP(email)               — POST /api/auth/send-otp
 *   verifyOTP(email, otp, ...)   — POST /api/auth/verify-otp (returns JWT token)
 *   clearToken()                 — Removes JWT from localStorage on logout
 */

// Base URL — in dev, Vite proxy handles /api → localhost:5000
const BASE = import.meta.env.VITE_API_URL || '/api'

// ─── Internal helper — sends all requests with auth header ─────────────────
async function request(path, options = {}) {
  // Attach JWT token if logged in (used for protected routes)
  const token = localStorage.getItem('sikarnest_token')

  const res = await fetch(`${BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  })

  // Safe JSON parse — prevents "Unexpected end of JSON input" if server returns
  // an empty body, HTML error page, or crashes before sending a response
  let data
  try {
    data = await res.json()
  } catch {
    // Body was empty or not valid JSON — surface a readable error
    throw new Error(res.ok ? 'Empty response from server' : `Server error (${res.status})`)
  }

  if (!res.ok) throw new Error(data?.error || 'Request failed')
  return data
}

// ─── Listings ──────────────────────────────────────────────────────────────

/**
 * Fetch all verified listings, with optional filters.
 * @param {Object} params — { q, type, gender, maxRent, sort }
 * q       = search text (name/location/address)
 * type    = 'hostel' | 'flat'
 * gender  = 'boys' | 'girls' | 'co-ed'
 * maxRent = number (max monthly rent)
 * sort    = 'price_asc' | 'price_desc' | 'vacancy'
 */
export async function fetchListings(params = {}) {
  // Filter out empty / 'all' values before building query string
  const qs = new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([, v]) => v && v !== 'all'))
  ).toString()
  const { data } = await request(`/listings${qs ? '?' + qs : ''}`)
  return data
}

/** Fetch full details of a single listing by its MongoDB _id */
export async function fetchListingById(id) {
  const { data } = await request(`/listings/${id}`)
  return data
}

/** Owner updates vacancy count for one of their listings */
export async function updateVacancy(id, vacancy) {
  const { data } = await request(`/listings/${id}/vacancy`, {
    method: 'PUT',
    body:   JSON.stringify({ vacancy }),
  })
  return data
}

// ─── Owner Submission ──────────────────────────────────────────────────────

/**
 * Submit a new property listing for admin review.
 * Called from ListPropertyModal.jsx on the final step.
 * @param {Object} form — all form fields from the 6-step wizard
 */
export async function submitListing(form) {
  return request('/submissions', {
    method: 'POST',
    body:   JSON.stringify(form),
  })
}

// ─── Auth (OTP Login) ──────────────────────────────────────────────────────

/** Send a 6-digit OTP to the given email address */
export async function sendOTP(email) {
  return request('/auth/send-otp', {
    method: 'POST',
    body:   JSON.stringify({ email }),
  })
}

/**
 * Verify the OTP code entered by user.
 * On success, backend returns a JWT token which is stored in localStorage.
 * @param {string} email
 * @param {string} otp    — 6-digit code
 * @param {string} role   — 'tenant' | 'owner'
 * @param {string} name   — user's display name (optional)
 */
export async function verifyOTP(email, otp, role = 'tenant', name = '') {
  const data = await request('/auth/verify-otp', {
    method: 'POST',
    body:   JSON.stringify({ email, otp, role, name }),
  })
  // Persist JWT so future requests are authenticated
  if (data.token) localStorage.setItem('sikarnest_token', data.token)
  return data
}

/**
 * Verify a Google ID token (credential) from Google Identity Services.
 * Backend validates the token and returns a JWT.
 * @param {string} credential — Google ID token from the GSI button
 * @param {string} role       — 'tenant' | 'owner'
 */
export async function googleLogin(credential, role = 'tenant') {
  const data = await request('/auth/google', {
    method: 'POST',
    body:   JSON.stringify({ credential, role }),
  })
  if (data.token) localStorage.setItem('sikarnest_token', data.token)
  return data
}

/** Remove JWT token on logout */
export function clearToken() {
  localStorage.removeItem('sikarnest_token')
}
