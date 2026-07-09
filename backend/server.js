/**
 * server.js — SikarNest Backend Entry Point
 *
 * This is the main Express server for the SikarNest app.
 * It connects to MongoDB, registers all API routes, starts the
 * weekly vacancy-ping cron job, and handles global errors.
 *
 * Routes registered:
 *   GET/POST  /api/listings     → listings.js (browse, search, detail)
 *   POST      /api/submissions  → submissions.js (owner submits new listing)
 *   GET       /api/submissions/mine → submissions.js (owner views own submissions)
 *   POST      /api/auth/...     → auth.js (Google login, OTP send/verify)
 *   GET/POST  /api/admin/...    → admin.js (approve/reject/delete — key-protected)
 *
 * To run:  npm run dev  (uses nodemon for auto-restart)
 * Port:    5000 (set in .env)
 */

require('dotenv').config()          // Load .env variables first
const express    = require('express')
const mongoose   = require('mongoose')
const cors       = require('cors')

// ─── Route modules ─────────────────────────────────────────────────────────
const listingsRouter    = require('./routes/listings')
const submissionsRouter = require('./routes/submissions')
const authRouter        = require('./routes/auth')
const adminRouter       = require('./routes/admin')
const errorHandler      = require('./middleware/errorHandler')
const { startVacancyPingJob } = require('./jobs/vacancyPing')

const app = express()

// ─── Middleware ─────────────────────────────────────────────────────────────
// Allow requests from localhost (dev) AND production frontend (set CLIENT_URL in env)
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:4173',
  process.env.CLIENT_URL,         // e.g. https://sikarnest.vercel.app
].filter(Boolean)

app.use(cors({
  origin: (origin, cb) => {
    // Allow no-origin requests (curl, Postman, same-origin) and whitelisted origins
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true)
    cb(new Error(`CORS: origin ${origin} not allowed`))
  },
  credentials: true,
}))
app.use(express.json({ limit: '10mb' }))   // parse JSON request bodies

// ─── Health check ───────────────────────────────────────────────────────────
app.get('/', (req, res) => res.json({ message: '🏠 SikarNest API is running' }))

// ─── API Routes ─────────────────────────────────────────────────────────────
app.use('/api/listings',    listingsRouter)     // Public: browse & search listings
app.use('/api/submissions', submissionsRouter)  // Owner: submit & track listings
app.use('/api/auth',        authRouter)         // Auth: Google + OTP login
app.use('/api/admin',       adminRouter)        // Admin: approve/reject (key-protected)

// ─── Global error handler ───────────────────────────────────────────────────
app.use(errorHandler)

// ─── Connect to MongoDB, then start server ──────────────────────────────────
const PORT = process.env.PORT || 5000

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected')
    app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`))
    startVacancyPingJob()   // Start weekly email reminders to owners
  })
  .catch((err) => {
    console.error('❌ MongoDB connection failed:', err.message)
    process.exit(1)
  })
