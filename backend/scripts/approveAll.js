/**
 * Admin script — approves all pending listings
 * Run: node scripts/approveAll.js
 */
require('dotenv').config()
const mongoose = require('mongoose')
const Listing = require('../models/Listing')

async function approveAll() {
  await mongoose.connect(process.env.MONGO_URI)
  console.log('✅ Connected to MongoDB\n')

  const pending = await Listing.find({ status: 'pending' })

  if (pending.length === 0) {
    console.log('📭 No pending listings found.')
    return
  }

  console.log(`📋 Found ${pending.length} pending listing(s):\n`)

  for (const listing of pending) {
    console.log(`  → "${listing.name}" by ${listing.ownerName} (${listing.ownerEmail})`)
    console.log(`     Type: ${listing.type} | Gender: ${listing.gender} | Rent: ₹${listing.rent}`)

    listing.status = 'approved'
    await listing.save()

    console.log(`✅ Published! Listing ID: ${listing._id}\n`)
  }

  console.log(`🎉 Done — ${pending.length} listing(s) published.`)
}

approveAll()
  .catch((err) => console.error('❌', err.message))
  .finally(() => mongoose.disconnect())
