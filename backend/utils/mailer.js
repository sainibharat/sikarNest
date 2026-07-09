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

module.exports = { sendOTPEmail, sendVacancyPing }
