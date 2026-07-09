/**
 * routes/submissions.js — Owner Listing Submission Endpoints
 *
 * Handles the "List Your Property" form submissions.
 * New submissions go to MongoDB as status='pending' until admin approves them.
 *
 * Endpoints:
 *   POST /api/submissions
 *     - Owner submits their hostel/flat for listing
 *     - Creates a Submission document with status='pending'
 *     - Body: { name, type, gender, bhk, address, lat, lng, rent, totalBeds,
 *               vacancy, amenities[], phone, ownerName, ownerEmail, image, description }
 *     - Used by: ListPropertyModal.jsx → submitListing() in api.js
 *
 *   GET /api/submissions
 *     - Returns all submissions (admin use)
 *     - No auth protection in dev — add adminOnly middleware in production
 *
 *   GET /api/submissions/mine?email=owner@email.com
 *     - Returns all submissions made by a specific owner (identified by email)
 *     - Used by: OwnerDashboard.jsx to show listing status to the owner
 */

const express    = require('express')
const router     = express.Router()
const Submission = require('../models/Submission')

// ─── POST /api/submissions ─────────────────────────────────────────────────
// Owner submits a new property listing for review
router.post('/', async (req, res, next) => {
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

    const submission = await Submission.create({
      name, type, gender,
      bhk:         bhk || '',                                           // flat size (1BHK etc.)
      address,
      lat:         Number(lat),
      lng:         Number(lng),
      rent:        Number(rent),
      totalBeds:   Number(totalBeds) || 0,
      vacancy:     Number(vacancy) || 0,
      amenities:   Array.isArray(amenities) ? amenities : [],           // tags like WiFi, Mess etc.
      phone,
      ownerName,
      ownerEmail:  ownerEmail.toLowerCase(),
      image:       image || '',
      description: description || '',
      // status defaults to 'pending' (set in schema)
    })

    res.status(201).json({
      success: true,
      message: 'Submission received! We will review and list it within 24 hours.',
      id:      submission._id,
    })
  } catch (err) {
    next(err)
  }
})

// ─── GET /api/submissions ─────────────────────────────────────────────────
// Returns all submissions sorted newest first (used by admin panel)
// TODO: Add adminOnly middleware before going to production
router.get('/', async (req, res, next) => {
  try {
    const submissions = await Submission.find().sort({ createdAt: -1 }).lean()
    res.json({ success: true, count: submissions.length, data: submissions })
  } catch (err) {
    next(err)
  }
})

// ─── GET /api/submissions/mine?email=xxx ──────────────────────────────────
// Returns all submissions for a specific owner, filtered by their email.
// Used by OwnerDashboard to show the owner the status of their listings.
// NOTE: Route /mine must be BEFORE /:id to avoid MongoDB treating 'mine' as an _id
router.get('/mine', async (req, res, next) => {
  try {
    const { email } = req.query
    if (!email) return res.status(400).json({ error: 'Email query param is required' })

    const submissions = await Submission
      .find({ ownerEmail: email.toLowerCase() })
      .sort({ createdAt: -1 })
      .lean()

    res.json({ success: true, count: submissions.length, data: submissions })
  } catch (err) {
    next(err)
  }
})

module.exports = router
