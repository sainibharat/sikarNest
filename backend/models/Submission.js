/**
 * models/Submission.js — Owner Submission Schema
 *
 * When an owner fills out the "List Your Property" form, their data
 * is saved here as a Submission with status = 'pending'.
 *
 * Lifecycle:
 *   Owner submits form  →  Submission created (status: 'pending')
 *   Admin reviews       →  status changes to 'approved' OR 'rejected'
 *   On approval         →  A new Listing document is created from this data
 *
 * Owner can view all their submissions at /owner dashboard (filtered by ownerEmail).
 *
 * Fields match Listing fields, but:
 *   - No rating/isVerified (those are only on approved Listings)
 *   - Has status field: 'pending' | 'approved' | 'rejected'
 *   - bhk field added for flat type (1BHK / 2BHK / 3BHK)
 */

const mongoose = require('mongoose')

const submissionSchema = new mongoose.Schema(
  {
    // ── Property info ──────────────────────────────────────────────────────
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ['hostel', 'flat'], required: true },
    gender: { type: String, enum: ['boys', 'girls', 'co-ed', 'family'], required: true },
    bhk: { type: String, default: '' },          // for flat: '1BHK' | '2BHK' | '3BHK'
    address: { type: String, required: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    rent: { type: Number, required: true },
    totalBeds: { type: Number, default: 0 },           // hostel: total beds; flat: total flats
    vacancy: { type: Number, default: 0 },           // currently available
    amenities: [{ type: String }],                     // selected facility tags
    image: { type: String, default: '' },          // first photo URL
    description: { type: String, default: '' },

    // ── Owner contact ──────────────────────────────────────────────────────
    phone: { type: String, required: true },
    ownerName: { type: String, required: true },
    ownerEmail: { type: String, required: true, lowercase: true },  // used to find /mine

    // ── Review status ──────────────────────────────────────────────────────
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',  // all new submissions start as pending
    },
  },
  { timestamps: true }  // createdAt shown in owner dashboard
)

module.exports = mongoose.model('Submission', submissionSchema)
