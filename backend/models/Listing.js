/**
 * models/Listing.js — Published Listing Schema
 *
 * A Listing is a verified, publicly visible hostel/flat on SikarNest.
 * Listings are created in two ways:
 *   1. Admin approves a Submission → Submission is copied here as a Listing
 *   2. Directly via seed.js (for initial/demo data)
 *
 * Fields:
 *   name         — Property name e.g. "Shri Ram Boys Hostel"
 *   type         — 'hostel' | 'flat'
 *   gender       — 'boys' | 'girls' | 'co-ed'
 *   location     — Short area name e.g. "Piprali Road" (used for search display)
 *   address      — Full postal address
 *   lat / lng    — GPS coordinates (shown on map in detail page)
 *   rent         — Monthly rent per bed/flat in ₹
 *   totalBeds    — Total beds/rooms in the property
 *   vacancy      — Currently available beds/rooms (0 = Full)
 *   amenities    — Array of strings e.g. ["WiFi", "Mess", "AC"]
 *   phone        — Owner's contact number (used for WhatsApp CTA)
 *   whatsapp     — WhatsApp number (defaults to phone if not set)
 *   ownerName    — Owner's full name
 *   ownerEmail   — Owner's email (used for vacancy ping emails)
 *   image        — Primary photo URL
 *   description  — Short description shown on detail page
 *   rating       — Average rating (0–5), updated when reviews are added
 *   isVerified   — true = admin-approved and visible; false = hidden
 *   vacancyUpdatedAt — Timestamp of last vacancy update (for weekly ping job)
 *
 * Text index on location, name, address → enables fast $text search
 */

const mongoose = require('mongoose')

const listingSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ['hostel', 'flat'], required: true },
    gender: { type: String, enum: ['boys', 'girls', 'co-ed', 'family'], required: true },
    location: { type: String, required: true, trim: true },  // short area name
    address: { type: String, required: true, trim: true },  // full address
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    rent: { type: Number, required: true, min: 0 },
    totalBeds: { type: Number, default: 0 },
    vacancy: { type: Number, default: 0, min: 0 },
    amenities: [{ type: String }],
    phone: { type: String, required: true },
    whatsapp: { type: String },                              // falls back to phone
    ownerName: { type: String, required: true },
    ownerEmail: { type: String, required: true, lowercase: true },
    image: { type: String, default: '' },
    description: { type: String, default: '' },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    isVerified: { type: Boolean, default: false },             // only true listings are shown
    vacancyUpdatedAt: { type: Date, default: Date.now },             // used by weekly ping job
  },
  { timestamps: true }  // auto-adds createdAt, updatedAt
)

// Full-text search index — enables /api/listings?q=... search
listingSchema.index({ location: 'text', name: 'text', address: 'text' })

module.exports = mongoose.model('Listing', listingSchema)
