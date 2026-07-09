/**
 * routes/listings.js — Public Listing Endpoints
 *
 * These routes serve the publicly visible listings to students.
 * Only listings with isVerified: true are returned (admin-approved ones).
 *
 * Endpoints:
 *   GET /api/listings
 *     - Returns all verified listings
 *     - Supports query params:
 *         ?q=<search text>      → searches name, location, address
 *         ?type=hostel|flat     → filter by property type
 *         ?gender=boys|girls|co-ed → filter by gender
 *         ?maxRent=5000         → filter listings at or below this rent
 *         ?sort=price_asc|price_desc|vacancy → sort results
 *     - Used by: Home.jsx (featured listings) + SearchResults.jsx
 *
 *   GET /api/listings/:id
 *     - Returns a single listing by MongoDB _id
 *     - Used by: ListingDetail.jsx
 *
 *   PUT /api/listings/:id/vacancy
 *     - Owner updates how many beds/rooms are currently available
 *     - Body: { vacancy: Number }
 *     - Updates vacancyUpdatedAt timestamp (used by weekly ping job)
 */

const express = require('express')
const router  = express.Router()
const Listing = require('../models/Listing')

// ─── GET /api/listings ─────────────────────────────────────────────────────
// Supports filtering & sorting; only returns isVerified: true listings
router.get('/', async (req, res, next) => {
  try {
    const { q, type, gender, maxRent, sort } = req.query

    // Always filter to verified-only (admin approved)
    const filter = { isVerified: true }

    // Text search across name, location and address fields (case-insensitive)
    if (q) {
      filter.$or = [
        { location: { $regex: q, $options: 'i' } },
        { name:     { $regex: q, $options: 'i' } },
        { address:  { $regex: q, $options: 'i' } },
      ]
    }

    // Optional filters
    if (type   && type   !== 'all') filter.type   = type
    if (gender && gender !== 'all') filter.gender = gender
    if (maxRent) filter.rent = { $lte: Number(maxRent) }

    // Sort options
    let sortOption = { createdAt: -1 }          // default: newest first
    if (sort === 'price_asc')  sortOption = { rent:    1 }
    if (sort === 'price_desc') sortOption = { rent:   -1 }
    if (sort === 'vacancy')    sortOption = { vacancy: -1 }

    const listings = await Listing.find(filter).sort(sortOption).lean()
    res.json({ success: true, count: listings.length, data: listings })
  } catch (err) {
    next(err)
  }
})

// ─── GET /api/listings/:id ─────────────────────────────────────────────────
// Returns full detail of a single listing (shown on /listing/:id page)
router.get('/:id', async (req, res, next) => {
  try {
    const listing = await Listing.findById(req.params.id).lean()
    if (!listing) return res.status(404).json({ error: 'Listing not found' })
    res.json({ success: true, data: listing })
  } catch (err) {
    next(err)
  }
})

// ─── PUT /api/listings/:id/vacancy ────────────────────────────────────────
// Called by owner to update current vacancy count
// Also updates vacancyUpdatedAt — if this isn't updated for 5+ days,
// the weekly cron job (vacancyPing.js) sends an email reminder to the owner
router.put('/:id/vacancy', async (req, res, next) => {
  try {
    const { vacancy } = req.body
    if (vacancy === undefined || vacancy < 0) {
      return res.status(400).json({ error: 'Valid vacancy count required' })
    }
    const listing = await Listing.findByIdAndUpdate(
      req.params.id,
      { vacancy, vacancyUpdatedAt: new Date() },
      { new: true }
    )
    if (!listing) return res.status(404).json({ error: 'Listing not found' })
    res.json({ success: true, data: listing })
  } catch (err) {
    next(err)
  }
})

module.exports = router
