/**
 * routes/listings.js — Public Listing Endpoints
 *
 * These routes serve the publicly visible listings to tenants.
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
const router = express.Router()
const Listing = require('../models/Listing')
const { sendSubmissionReceived } = require('../utils/mailer')

// ─── GET /api/listings ─────────────────────────────────────────────────────
// Supports filtering & sorting; only returns isVerified: true listings
router.get('/', async (req, res, next) => {
  try {
    const { q, type, gender, maxRent, sort } = req.query

    // Always filter to approved-only
    const filter = { status: 'approved' }

    // Text search across name, location and address fields (case-insensitive)
    if (q) {
      filter.$or = [
        { location: { $regex: q, $options: 'i' } },
        { name: { $regex: q, $options: 'i' } },
        { address: { $regex: q, $options: 'i' } },
      ]
    }

    // Optional filters
    if (type && type !== 'all') filter.type = type
    if (gender && gender !== 'all') filter.gender = gender
    if (maxRent) filter.rent = { $lte: Number(maxRent) }

    // Sort options
    let sortOption = { createdAt: -1 }          // default: newest first
    if (sort === 'price_asc') sortOption = { rent: 1 }
    if (sort === 'price_desc') sortOption = { rent: -1 }
    if (sort === 'vacancy') sortOption = { vacancy: -1 }

    const listings = await Listing.find(filter).sort(sortOption).lean()
    res.json({ success: true, count: listings.length, data: listings })
  } catch (err) {
    next(err)
  }
})

// ─── GET /api/listings/mine?email=xyz ─────────────────────────────────────
// Returns all listings for a specific owner, filtered by their email.
// Used by OwnerDashboard to show the owner the status of their listings.
// NOTE: Route /mine must be BEFORE /:id to avoid MongoDB treating 'mine' as an _id
router.get('/mine', async (req, res, next) => {
  try {
    const { email } = req.query
    if (!email) return res.status(400).json({ error: 'Email query param is required' })

    const listings = await Listing
      .find({ ownerEmail: email.toLowerCase() })
      .sort({ createdAt: -1 })
      .lean()

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

// ─── PUT /api/listings/:id ────────────────────────────────────────────────
// Called by owner to edit their listing details (vacancy, rent, phone, amenities, description)
router.put('/:id', async (req, res, next) => {
  try {
    const { vacancy, rent, phone, amenities, description, ownerEmail } = req.body
    
    // Ensure the person updating it is the owner
    if (!ownerEmail) return res.status(400).json({ error: 'ownerEmail is required' })

    const listing = await Listing.findOne({ _id: req.params.id, ownerEmail: ownerEmail.toLowerCase() })
    if (!listing) return res.status(404).json({ error: 'Listing not found or unauthorized' })

    if (vacancy !== undefined) listing.vacancy = Number(vacancy)
    if (rent !== undefined) listing.rent = Number(rent)
    if (phone !== undefined) {
      listing.phone = phone
      listing.whatsapp = phone
    }
    if (amenities !== undefined) listing.amenities = Array.isArray(amenities) ? amenities : []
    if (description !== undefined) listing.description = description
    
    // Any edit resets the vacancy update reminder
    listing.vacancyUpdatedAt = new Date()

    await listing.save()

    res.json({ success: true, data: listing })
  } catch (err) {
    next(err)
  }
})

// ─── POST /api/listings/submit ─────────────────────────────────────────────
// Owner submits a new property listing for review
router.post('/submit', async (req, res, next) => {
  try {
    const {
      name, type, gender, bhk, address, lat, lng,
      rent, totalBeds, vacancy, amenities,
      phone, ownerName, ownerEmail, description, image,
    } = req.body

    // Validate required fields
    if (!name || !type || !gender || !address || !lat || !lng || !rent || !phone || !ownerName || !ownerEmail) {
      return res.status(400).json({ error: 'All required fields must be filled' })
    }

    const listing = await Listing.create({
      name, type, gender,
      bhk: bhk || '',
      location: address.split(',').slice(-3, -1).join(',').trim() || 'Sikar',
      address,
      lat: Number(lat),
      lng: Number(lng),
      rent: Number(rent),
      totalBeds: Number(totalBeds) || 0,
      vacancy: Number(vacancy) || 0,
      amenities: Array.isArray(amenities) ? amenities : [],
      phone,
      whatsapp: phone,
      ownerName,
      ownerEmail: ownerEmail.toLowerCase(),
      image: image || '',
      description: description || '',
      // status defaults to 'pending'
    })

    res.status(201).json({
      success: true,
      message: 'Submission received! We will review and list it within 24 hours.',
      id: listing._id,
    })

    // Send confirmation email to owner (fire & forget — don't block the response)
    sendSubmissionReceived(ownerEmail, ownerName, name).catch(() => {})
  } catch (err) {
    next(err)
  }
})

module.exports = router
