const express = require('express')
const router = express.Router()
const jwt = require('jsonwebtoken')
const { OAuth2Client } = require('google-auth-library')
const OTP = require('../models/OTP')
const User = require('../models/User')
const { sendOTPEmail } = require('../utils/mailer')

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

// ─────────────────────────────────────────────────────────────────────────────
// Helper: find-or-create user + issue JWT
// ─────────────────────────────────────────────────────────────────────────────
async function upsertUser({ email, name, photo, googleId, authProvider, role }) {
  let user = await User.findOne({ email })

  if (!user) {
    // First time → create account
    // Normalise role: frontend sends 'customer/tenant' but DB stores 'tenant'
    const safeRole = (role === 'owner') ? 'owner' : 'tenant'
    user = await User.create({ email, name, photo, googleId, authProvider, role: safeRole })
  } else {
    // Returning user → update login time + fill any missing profile fields
    user.lastLoginAt = new Date()
    if (name && !user.name) user.name = name
    if (photo && !user.photo) user.photo = photo
    if (googleId && !user.googleId) user.googleId = googleId

    // Role upgrade: tenant signing in via "Become a host" → promote to owner.
    // We never downgrade: an owner signing in as tenant stays as owner.
    const safeRole = (role === 'owner') ? 'owner' : 'tenant'
    if (safeRole === 'owner' && user.role !== 'owner') {
      user.role = 'owner'
    }

    await user.save()
  }

  const token = jwt.sign(
    { id: user._id, email: user.email, name: user.name, photo: user.photo, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  )

  return { token, user }
}

// ─── POST /api/auth/google ────────────────────────────────────────────────
// Verify Google ID token from frontend (code flow), return JWT
router.post('/google', async (req, res, next) => {
  try {
    const { credential, role } = req.body
    if (!credential) return res.status(400).json({ error: 'No Google credential provided' })

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    })
    const payload = ticket.getPayload()
    const { email, name, picture: photo, sub: googleId } = payload
    if (!email) return res.status(400).json({ error: 'Could not get email from Google' })

    const { token, user } = await upsertUser({ email, name, photo, googleId, authProvider: 'google', role })
    res.json({ success: true, token, user: { id: user._id, email: user.email, name: user.name, photo: user.photo, role: user.role, savedListings: user.savedListings || [] } })
  } catch (err) {
    next(err)
  }
})

// ─── POST /api/auth/google-token ─────────────────────────────────────────
// Accepts Google userinfo already fetched by frontend (implicit flow)
router.post('/google-token', async (req, res, next) => {
  try {
    const { email, name, photo, googleId } = req.body
    if (!email) return res.status(400).json({ error: 'Email is required' })

    const { token, user } = await upsertUser({
      email: email.toLowerCase(),
      name: name || '',
      photo: photo || '',
      googleId: googleId || '',
      authProvider: 'google',
    })

    res.json({
      success: true,
      token,
      user: { id: user._id, email: user.email, name: user.name, photo: user.photo, role: user.role, savedListings: user.savedListings || [] },
    })
  } catch (err) {
    next(err)
  }
})

// ─── POST /api/auth/send-otp ─────────────────────────────────────────────
router.post('/send-otp', async (req, res, next) => {
  try {
    const { email } = req.body
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email required' })
    }

    const otp = String(Math.floor(100000 + Math.random() * 900000))
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 min

    await OTP.findOneAndUpdate(
      { email: email.toLowerCase() },
      { otp, expiresAt },
      { upsert: true, new: true }
    )

    await sendOTPEmail(email, otp)

    res.json({ success: true, message: `OTP sent to ${email}` })
  } catch (err) {
    next(err)
  }
})

// ─── POST /api/auth/verify-otp ───────────────────────────────────────────
router.post('/verify-otp', async (req, res, next) => {
  try {
    const { email, otp, name = '', role } = req.body
    if (!email || !otp) return res.status(400).json({ error: 'Email and OTP required' })

    const record = await OTP.findOne({ email: email.toLowerCase() })

    if (!record) return res.status(400).json({ error: 'No OTP found. Request a new one.' })
    if (record.otp !== String(otp)) return res.status(400).json({ error: 'Incorrect OTP' })
    if (record.expiresAt < new Date()) {
      await OTP.deleteOne({ email: email.toLowerCase() })
      return res.status(400).json({ error: 'OTP expired. Request a new one.' })
    }

    await OTP.deleteOne({ email: email.toLowerCase() })

    const displayName = name || email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

    const { token, user } = await upsertUser({
      email: email.toLowerCase(), name: displayName, photo: '', googleId: '', authProvider: 'otp', role,
    })

    res.json({
      success: true,
      token,
      user: { id: user._id, email: user.email, name: user.name, photo: user.photo, role: user.role, savedListings: user.savedListings || [] },
    })
  } catch (err) {
    next(err)
  }
})

// ─── GET /api/auth/me ─────────────────────────────────────────────────────
router.get('/me', async (req, res) => {
  const header = req.headers.authorization
  if (!header) return res.status(401).json({ error: 'No token' })
  try {
    const decoded = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET)
    // Refresh user data from DB
    const user = await User.findById(decoded.id).select('-__v')
    if (!user) return res.status(404).json({ error: 'User not found' })
    res.json({ success: true, user })
  } catch {
    res.status(401).json({ error: 'Invalid token' })
  }
})

// ─── POST /api/auth/toggle-save ───────────────────────────────────────────
router.post('/toggle-save', async (req, res, next) => {
  try {
    const header = req.headers.authorization
    if (!header) return res.status(401).json({ error: 'No token' })
    const decoded = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET)
    
    const { listingId } = req.body
    if (!listingId) return res.status(400).json({ error: 'listingId required' })
    
    const user = await User.findById(decoded.id)
    if (!user) return res.status(404).json({ error: 'User not found' })
    
    const isSaved = user.savedListings.includes(listingId)
    if (isSaved) {
      user.savedListings = user.savedListings.filter(id => id !== listingId)
    } else {
      user.savedListings.push(listingId)
    }
    
    await user.save()
    res.json({ success: true, savedListings: user.savedListings })
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Invalid token' })
    }
    next(err)
  }
})

module.exports = router
