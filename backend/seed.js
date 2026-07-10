/**
 * seed.js — Database Seeder Script
 *
 * Populates MongoDB with initial demo listings so the site has
 * content from day one (students see listings immediately).
 *
 * Usage:
 *   node seed.js
 *
 * What it does:
 *   1. Connects to MongoDB (uses MONGO_URI from .env)
 *   2. Clears all existing listings (fresh start)
 *   3. Inserts 9 demo hostels/flats in Sikar with isVerified: true
 *   4. Disconnects and exits
 *
 * Run this ONCE when setting up the project for the first time.
 * Do NOT run in production if real listings already exist (it clears the collection).
 */
require('dotenv').config()
const mongoose = require('mongoose')
const Listing = require('./models/Listing')

const SEED_DATA = [
  {
    name: 'Shri Ram Boys Hostel',
    type: 'hostel', gender: 'boys',
    location: 'Piprali Road',
    address: 'Near Allen Institute, Piprali Road, Sikar, Rajasthan 332001',
    lat: 27.6121, lng: 75.1405,
    rent: 3500, totalBeds: 20, vacancy: 5,
    amenities: ['WiFi', 'Mess', 'CCTV', 'RO Water'],
    phone: '9876543210', whatsapp: '9876543210',
    ownerName: 'Ramesh Sharma', ownerEmail: 'ramesh@example.com',
    rating: 4.3,
    image: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=600&q=80',
    description: 'Well-maintained boys hostel near Allen Institute with all basic facilities.',
    isVerified: true,
  },
  {
    name: 'Green View Flat',
    type: 'flat', gender: 'family',
    location: 'Station Road',
    address: 'Near Railway Station, Station Road, Sikar 332001',
    lat: 27.6055, lng: 75.1421,
    rent: 6000, totalBeds: 3, vacancy: 1,
    amenities: ['WiFi', 'Parking', 'RO Water', 'CCTV'],
    phone: '9123456780', whatsapp: '9123456780',
    ownerName: 'Vijay Gupta', ownerEmail: 'vijay@example.com',
    rating: 4.1,
    image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&q=80',
    description: '2BHK fully furnished flat, ideal for working professionals or groups.',
    isVerified: true,
  },
  {
    name: 'Raj Boys Hostel',
    type: 'hostel', gender: 'boys',
    location: 'Station Road',
    address: 'Station Road, Sikar, Rajasthan 332001',
    lat: 27.6062, lng: 75.1435,
    rent: 3200, totalBeds: 15, vacancy: 8,
    amenities: ['WiFi', 'Mess', 'Study Room', 'RO Water'],
    phone: '9654321087', whatsapp: '9654321087',
    ownerName: 'Rajesh Kumar', ownerEmail: 'rajesh@example.com',
    rating: 3.9,
    image: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600&q=80',
    description: 'Budget-friendly hostel for students with separate study room.',
    isVerified: true,
  },
  {
    name: 'Fatehpur Hostel',
    type: 'hostel', gender: 'boys',
    location: 'Fatehpur Road',
    address: 'Fatehpur Road, Near Bus Stand, Sikar 332001',
    lat: 27.6201, lng: 75.1312,
    rent: 2800, totalBeds: 30, vacancy: 12,
    amenities: ['Mess', 'RO Water', 'CCTV'],
    phone: '9000012345', whatsapp: '9000012345',
    ownerName: 'Mohan Lal', ownerEmail: 'mohan@example.com',
    rating: 3.7,
    image: 'https://images.unsplash.com/photo-1565182999561-18d7dc61c393?w=600&q=80',
    description: 'Affordable hostel with mess facility near bus stand.',
    isVerified: true,
  },
  {
    name: 'Devi Girls Hostel',
    type: 'hostel', gender: 'girls',
    location: 'Fatehpur Road',
    address: 'Fatehpur Road, Sikar, Rajasthan 332001',
    lat: 27.6185, lng: 75.1298,
    rent: 3000, totalBeds: 18, vacancy: 4,
    amenities: ['WiFi', 'Mess', 'Laundry', 'CCTV'],
    phone: '9111122233', whatsapp: '9111122233',
    ownerName: 'Kavita Sharma', ownerEmail: 'kavita@example.com',
    rating: 4.2,
    image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&q=80',
    description: 'Safe and secure girls hostel with 24/7 CCTV.',
    isVerified: true,
  },
  {
    name: 'Nehru Nagar Flat',
    type: 'flat', gender: 'family',
    location: 'Nehru Nagar',
    address: 'Sector 5, Nehru Nagar, Sikar 332001',
    lat: 27.6144, lng: 75.1502,
    rent: 5500, totalBeds: 2, vacancy: 1,
    amenities: ['WiFi', 'Parking', 'AC', 'RO Water'],
    phone: '9876501234', whatsapp: '9876501234',
    ownerName: 'Ankit Jain', ownerEmail: 'ankit@example.com',
    rating: 4.4,
    image: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=600&q=80',
    description: 'Modern 1BHK flat in prime Nehru Nagar location.',
    isVerified: true,
  },
  {
    name: 'Bajaj Colony Hostel',
    type: 'hostel', gender: 'co-ed',
    location: 'Bajaj Colony',
    address: 'Bajaj Colony, Near Market, Sikar 332001',
    lat: 27.6078, lng: 75.1530,
    rent: 3800, totalBeds: 10, vacancy: 3,
    amenities: ['WiFi', 'Mess', 'AC', 'Gym'],
    phone: '9345612378', whatsapp: '9345612378',
    ownerName: 'Priya Meena', ownerEmail: 'priya@example.com',
    rating: 4.5,
    image: 'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=600&q=80',
    description: 'Premium co-ed hostel with gym and homemade food.',
    isVerified: true,
  },
  {
    name: 'Sudama Boys Hostel',
    type: 'hostel', gender: 'boys',
    location: 'Sudama Colony',
    address: 'Sudama Colony, Sikar, Rajasthan 332001',
    lat: 27.6033, lng: 75.1558,
    rent: 2600, totalBeds: 25, vacancy: 10,
    amenities: ['Mess', 'RO Water', 'Study Room'],
    phone: '9812345670', whatsapp: '9812345670',
    ownerName: 'Deepak Singh', ownerEmail: 'deepak@example.com',
    rating: 3.8,
    image: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=600&q=80',
    description: 'Budget hostel for students appearing for competitive exams.',
    isVerified: true,
  },
]

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI)
    console.log('✅ Connected to MongoDB')

    // Clear existing listings
    const deleted = await Listing.deleteMany({})
    console.log(`🗑️  Cleared ${deleted.deletedCount} existing listings`)

    // Insert seed data
    const inserted = await Listing.insertMany(SEED_DATA)
    console.log(`🌱 Inserted ${inserted.length} listings successfully`)

    inserted.forEach((l) => console.log(`  ✓ ${l.name} [${l._id}]`))
  } catch (err) {
    console.error('❌ Seed failed:', err.message)
  } finally {
    await mongoose.disconnect()
    console.log('🔌 Disconnected')
    process.exit(0)
  }
}

seed()
