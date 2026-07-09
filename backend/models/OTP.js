const mongoose = require('mongoose')

// Temporary OTP storage — expires after 10 minutes
const otpSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, lowercase: true },
    otp: { type: String, required: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
)

// Auto-delete expired OTPs using MongoDB TTL index
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

module.exports = mongoose.model('OTP', otpSchema)
