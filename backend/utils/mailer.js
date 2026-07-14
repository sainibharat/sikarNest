const nodemailer = require('nodemailer')

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,       // true for port 465 (SSL)
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,   // Gmail App Password — no spaces
  },
})

/**
 * Send an OTP email
 * @param {string} to  - recipient email
 * @param {string} otp - 6-digit code
 */
async function sendOTPEmail(to, otp) {
  await transporter.sendMail({
    from: `"SikarNest" <${process.env.GMAIL_USER}>`,
    to,
    subject: `${otp} is your SikarNest verification code`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="color:#0F172A;font-size:20px">🏠 SikarNest</h2>
        <p style="color:#334155;font-size:15px">Your one-time verification code is:</p>
        <div style="background:#FFF7ED;border:2px solid #F97316;border-radius:12px;padding:20px;text-align:center;margin:20px 0">
          <span style="font-size:36px;font-weight:800;letter-spacing:8px;color:#F97316">${otp}</span>
        </div>
        <p style="color:#64748B;font-size:13px">This code expires in <strong>10 minutes</strong>. Do not share it with anyone.</p>
        <hr style="border:none;border-top:1px solid #E2E8F0;margin:20px 0"/>
        <p style="color:#94A3B8;font-size:12px">SikarNest — Find Hostel/Flat in Sikar, Rajasthan</p>
      </div>
    `,
  })
}

/**
 * Send a vacancy ping reminder to an owner
 */
async function sendVacancyPing(to, ownerName, pgName) {
  await transporter.sendMail({
    from: `"SikarNest" <${process.env.GMAIL_USER}>`,
    to,
    subject: `Update vacancy for "${pgName}" on SikarNest`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="color:#0F172A;font-size:20px">🏠 SikarNest — Vacancy Update</h2>
        <p style="color:#334155;font-size:15px">Hi <strong>${ownerName}</strong>,</p>
        <p style="color:#334155;font-size:15px">It's been a while since you updated the vacancy for <strong>${pgName}</strong>. customer/tenants are searching and relying on accurate info!</p>
        <p style="color:#334155;font-size:15px">Please log in and update the current vacancy count:</p>
        <a href="${process.env.CLIENT_URL}" style="display:inline-block;background:#F97316;color:white;padding:12px 24px;border-radius:8px;font-weight:700;text-decoration:none;margin:12px 0">
          Update Vacancy →
        </a>
        <p style="color:#94A3B8;font-size:12px;margin-top:20px">SikarNest · Sikar, Rajasthan</p>
      </div>
    `,
  })
}

/**
 * Send confirmation to owner when their listing is submitted for review
 */
async function sendSubmissionReceived(to, ownerName, propertyName) {
  await transporter.sendMail({
    from: `"SikarNest" <${process.env.GMAIL_USER}>`,
    to,
    subject: `We received your listing: "${propertyName}" — SikarNest`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#0F172A">
        <h2 style="font-size:20px;margin-bottom:4px">🏠 SikarNest</h2>
        <p style="color:#64748B;font-size:13px;margin-top:0">Hostel & Flat Listings in Sikar, Rajasthan</p>
        <hr style="border:none;border-top:1px solid #E2E8F0;margin:16px 0"/>
        <p style="font-size:15px">Hi <strong>${ownerName}</strong>,</p>
        <p style="font-size:15px;color:#334155">Thank you for submitting <strong>"${propertyName}"</strong> on SikarNest. We have received your listing and our team will review it shortly.</p>
        <div style="background:#FFF7ED;border:1px solid #FDE68A;border-radius:12px;padding:16px;margin:20px 0">
          <p style="margin:0;font-size:14px;color:#92400E">⏳ <strong>Review time:</strong> Your listing will go live within <strong>24 hours</strong> once verified.</p>
        </div>
        <p style="font-size:14px;color:#334155">Once approved, tenants searching in Sikar will be able to find and contact you directly — for free.</p>
        <hr style="border:none;border-top:1px solid #E2E8F0;margin:20px 0"/>
        <p style="color:#94A3B8;font-size:12px">SikarNest · Sikar, Rajasthan · Free · No broker fees</p>
      </div>
    `,
  })
}

/**
 * Send approval notification to owner when admin approves their listing
 */
async function sendListingApproved(to, ownerName, propertyName, listingUrl) {
  await transporter.sendMail({
    from: `"SikarNest" <${process.env.GMAIL_USER}>`,
    to,
    subject: `🎉 Your listing "${propertyName}" is now live on SikarNest!`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#0F172A">
        <h2 style="font-size:20px;margin-bottom:4px">🏠 SikarNest</h2>
        <p style="color:#64748B;font-size:13px;margin-top:0">Hostel & Flat Listings in Sikar, Rajasthan</p>
        <hr style="border:none;border-top:1px solid #E2E8F0;margin:16px 0"/>
        <p style="font-size:15px">Hi <strong>${ownerName}</strong>,</p>
        <p style="font-size:15px;color:#334155">Great news! Your property <strong>"${propertyName}"</strong> has been reviewed and is now <strong style="color:#10B981">live</strong> on SikarNest. Tenants in Sikar can now find and contact you directly.</p>
        <div style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:12px;padding:16px;margin:20px 0">
          <p style="margin:0 0 10px;font-size:14px;color:#14532D">✅ <strong>Your listing is live!</strong></p>
          <a href="${listingUrl}" style="display:inline-block;background:#10B981;color:white;padding:10px 20px;border-radius:8px;font-weight:700;text-decoration:none;font-size:14px">View Your Listing →</a>
        </div>
        <p style="font-size:14px;color:#64748B">Keep your vacancy count up to date from your dashboard so tenants see accurate information.</p>
        <hr style="border:none;border-top:1px solid #E2E8F0;margin:20px 0"/>
        <p style="color:#94A3B8;font-size:12px">SikarNest · Sikar, Rajasthan · Free · No broker fees</p>
      </div>
    `,
  })
}

module.exports = { sendOTPEmail, sendVacancyPing, sendSubmissionReceived, sendListingApproved }
