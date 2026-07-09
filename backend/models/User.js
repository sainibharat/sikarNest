const mongoose = require('mongoose')

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, default: '' },
    photo: { type: String, default: '' },      // Google profile photo URL
    role: { type: String, enum: ['tenant', 'owner'], default: 'tenant' },
    googleId: { type: String, default: '' },   // Google sub ID (from token)
    authProvider: { type: String, enum: ['google', 'otp'], default: 'otp' },
    savedListings: [{ type: String }],         // saved listing IDs
    lastLoginAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
)

module.exports = mongoose.model('User', userSchema)
