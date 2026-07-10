/**
 * Admin script — approves all pending submissions and moves them to Listings
 * Run: node scripts/approveAll.js
 */
require('dotenv').config()
const mongoose = require('mongoose')
const Submission = require('../models/Submission')
const Listing = require('../models/Listing')

async function approveAll() {
  await mongoose.connect(process.env.MONGO_URI)
  console.log('✅ Connected to MongoDB\n')

  const pending = await Submission.find({ status: 'pending' }).lean()

  if (pending.length === 0) {
    console.log('📭 No pending submissions found.')
    return
  }

  console.log(`📋 Found ${pending.length} pending submission(s):\n`)

  for (const sub of pending) {
    console.log(`  → "${sub.name}" by ${sub.ownerName} (${sub.ownerEmail})`)
    console.log(`     Type: ${sub.type} | Gender: ${sub.gender} | Rent: ₹${sub.rent}`)

    // Create verified listing from submission
    const listing = await Listing.create({
      name: sub.name,
      type: sub.type,
      gender: sub.gender,
      location: sub.address.split(',').slice(-3, -1).join(',').trim() || 'Sikar',
      address: sub.address,
      lat: sub.lat,
      lng: sub.lng,
      rent: sub.rent,
      totalBeds: sub.totalBeds || 0,
      vacancy: sub.vacancy || 0,
      amenities: sub.amenities || [],
      phone: sub.phone,
      whatsapp: sub.phone,
      ownerName: sub.ownerName,
      ownerEmail: sub.ownerEmail,
      image: sub.image || '',
      description: sub.description || '',
      isVerified: true,
    })

    // Mark submission as approved
    await Submission.findByIdAndUpdate(sub._id, { status: 'approved' })

    console.log(`✅ Published! Listing ID: ${listing._id}\n`)
  }

  console.log(`🎉 Done — ${pending.length} listing(s) published.`)
}

approveAll()
  .catch((err) => console.error('❌', err.message))
  .finally(() => mongoose.disconnect())
