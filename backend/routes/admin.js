/**
 * routes/admin.js — Admin-Only Management Endpoints
 *
 * These routes are protected by a secret ADMIN_KEY (set in .env).
 * To call any of these, send the header:  x-admin-key: <your key>
 *
 * The admin panel at /admin in the frontend uses these endpoints.
 *
 * Endpoints:
 *   GET  /api/admin/listings?status=pending|approved|rejected|all
 *     - List all listings, filtered by status
 *     - Used by: AdminPanel.jsx tabs
 *
 *   POST /api/admin/approve/:id
 *     - Approves a pending listing
 *     - Sets status → 'approved'
 *     - The listing becomes immediately visible to tenants
 *
 *   POST /api/admin/reject/:id
 *     - Sets status → 'rejected'
 *     - Owner will see "Rejected" in their dashboard
 *
 *   DELETE /api/admin/listing/:id
 *     - Permanently removes a live listing from the site
 *     - Used in the "Live Listings" tab to take down a listing
 */

const express = require('express')
const router = express.Router()
const Listing = require('../models/Listing')
const { sendListingApproved } = require('../utils/mailer')

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

// ─── GET /api/admin/listings ───────────────────────────────────────────
// List listings filtered by status (default: pending)
router.get('/listings', async (req, res, next) => {
  try {
    const { status = 'pending' } = req.query
    const filter = status === 'all' ? {} : { status }   // 'all' returns everything
    const listings = await Listing.find(filter).sort({ createdAt: -1 }).lean()
    res.json({ success: true, count: listings.length, data: listings })
  } catch (err) { next(err) }
})

// ─── POST /api/admin/approve/:id ──────────────────────────────────────────
// Approve a listing → mark approved
router.post('/approve/:id', async (req, res, next) => {
  try {
    const listing = await Listing.findById(req.params.id)
    if (!listing) return res.status(404).json({ error: 'Listing not found' })
    if (listing.status === 'approved') return res.status(400).json({ error: 'Already approved' })

    // Mark listing as approved so owner sees updated status and it becomes public
    listing.status = 'approved'
    await listing.save()

    res.json({
      success: true,
      message: 'Listing published!',
      listingId: listing._id,
    })

    // Email the owner — fire & forget so it doesn't block the admin response
    const listingUrl = `${process.env.CLIENT_URL}/listing/${listing._id}`
    sendListingApproved(listing.ownerEmail, listing.ownerName, listing.name, listingUrl).catch(() => { })
  } catch (err) { next(err) }
})

// ─── POST /api/admin/reject/:id ───────────────────────────────────────────
// Reject a listing — owner sees "Rejected" status in their dashboard
router.post('/reject/:id', async (req, res, next) => {
  try {
    const listing = await Listing.findByIdAndUpdate(
      req.params.id,
      { status: 'rejected' },
      { new: true }
    )
    if (!listing) return res.status(404).json({ error: 'Listing not found' })
    res.json({ success: true, message: 'Listing rejected' })
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
