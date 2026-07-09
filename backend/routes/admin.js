/**
 * routes/admin.js — Admin-Only Management Endpoints
 *
 * These routes are protected by a secret ADMIN_KEY (set in .env).
 * To call any of these, send the header:  x-admin-key: <your key>
 *
 * The admin panel at /admin in the frontend uses these endpoints.
 *
 * Endpoints:
 *   GET  /api/admin/submissions?status=pending|approved|rejected|all
 *     - List all submissions, filtered by status
 *     - Used by: AdminPanel.jsx tabs
 *
 *   POST /api/admin/approve/:id
 *     - Approves a pending submission
 *     - Creates a verified Listing from the submission data
 *     - Sets submission status → 'approved'
 *     - The listing becomes immediately visible to students
 *
 *   POST /api/admin/reject/:id
 *     - Sets submission status → 'rejected'
 *     - Owner will see "Rejected" in their dashboard
 *
 *   DELETE /api/admin/listing/:id
 *     - Permanently removes a live listing from the site
 *     - Used in the "Live Listings" tab to take down a listing
 */

const express = require('express')
const router  = express.Router()
const Submission = require('../models/Submission')
const Listing    = require('../models/Listing')

// ─── Middleware: Admin key check ────────────────────────────────────────────
// Checks for x-admin-key header or ?key= query param against ADMIN_KEY in .env
function adminOnly(req, res, next) {
  const key = req.headers['x-admin-key'] || req.query.key
  if (key !== process.env.ADMIN_KEY) {
    return res.status(403).json({ error: 'Forbidden — invalid admin key' })
  }
  next()
}

// Apply admin check to ALL routes in this router
router.use(adminOnly)

// ─── GET /api/admin/submissions ───────────────────────────────────────────
// List submissions filtered by status (default: pending)
router.get('/submissions', async (req, res, next) => {
  try {
    const { status = 'pending' } = req.query
    const filter = status === 'all' ? {} : { status }   // 'all' returns everything
    const subs = await Submission.find(filter).sort({ createdAt: -1 }).lean()
    res.json({ success: true, count: subs.length, data: subs })
  } catch (err) { next(err) }
})

// ─── POST /api/admin/approve/:id ──────────────────────────────────────────
// Approve a submission → create a verified Listing → mark submission approved
router.post('/approve/:id', async (req, res, next) => {
  try {
    const sub = await Submission.findById(req.params.id)
    if (!sub) return res.status(404).json({ error: 'Submission not found' })
    if (sub.status === 'approved') return res.status(400).json({ error: 'Already approved' })

    // Create the public Listing from submission data
    const listing = await Listing.create({
      name:        sub.name,
      type:        sub.type,
      gender:      sub.gender,
      // Extract area from address (last 3–4 parts of comma-separated address)
      location:    sub.address.split(',').slice(-3, -1).join(',').trim() || 'Sikar',
      address:     sub.address,
      lat:         sub.lat,
      lng:         sub.lng,
      rent:        sub.rent,
      totalBeds:   sub.totalBeds || 0,
      vacancy:     sub.vacancy   || 0,
      amenities:   sub.amenities || [],
      phone:       sub.phone,
      whatsapp:    sub.phone,    // use same number for WhatsApp CTA
      ownerName:   sub.ownerName,
      ownerEmail:  sub.ownerEmail,
      image:       sub.image || '',
      description: sub.description || '',
      isVerified:  true,         // ← this makes it visible to students
    })

    // Mark submission as approved so owner sees updated status
    sub.status = 'approved'
    await sub.save()

    res.json({
      success:   true,
      message:   'Listing published!',
      listingId: listing._id,
    })
  } catch (err) { next(err) }
})

// ─── POST /api/admin/reject/:id ───────────────────────────────────────────
// Reject a submission — owner sees "Rejected" status in their dashboard
router.post('/reject/:id', async (req, res, next) => {
  try {
    const sub = await Submission.findByIdAndUpdate(
      req.params.id,
      { status: 'rejected' },
      { new: true }
    )
    if (!sub) return res.status(404).json({ error: 'Submission not found' })
    res.json({ success: true, message: 'Submission rejected' })
  } catch (err) { next(err) }
})

// ─── DELETE /api/admin/listing/:id ────────────────────────────────────────
// Permanently remove a live listing from the site
router.delete('/listing/:id', async (req, res, next) => {
  try {
    await Listing.findByIdAndDelete(req.params.id)
    res.json({ success: true, message: 'Listing removed' })
  } catch (err) { next(err) }
})

module.exports = router
