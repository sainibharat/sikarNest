/**
 * jobs/vacancyPing.js — Weekly Vacancy Reminder Cron Job
 *
 * Runs automatically every Monday at 9 AM once the server starts.
 * Finds all listings whose vacancyUpdatedAt is more than 7 days ago,
 * then emails each owner a reminder to update their vacancy count.
 *
 * This keeps listings fresh — students see accurate vacancy info.
 * If the owner doesn't update for 7+ days, the listing may show stale data.
 *
 * Triggered by: startVacancyPingJob() called in server.js on startup.
 * Email sent via: utils/mailer.js → sendVacancyPing(owner, listing)
 *
 * Vacancy is updated via: PUT /api/listings/:id/vacancy
 * Each update resets vacancyUpdatedAt → prevents repeated pings.
 */
const cron    = require('node-cron')
const Listing = require('../models/Listing')
const { sendVacancyPing } = require('../utils/mailer')

/**
 * Every Monday at 9 AM — email owners whose vacancy hasn't been updated in 7+ days
 */
function startVacancyPingJob() {
  cron.schedule('0 9 * * 1', async () => {
    console.log('Running weekly vacancy ping job...')
    try {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

      const staleListings = await Listing.find({
        status: 'approved',
        vacancyUpdatedAt: { $lt: sevenDaysAgo },
      }).lean()

      console.log(`📬 Sending vacancy ping to ${staleListings.length} owners`)

      for (const listing of staleListings) {
        try {
          await sendVacancyPing(listing.ownerEmail, listing.ownerName, listing.name)
          console.log(`Sent to ${listing.ownerEmail} for "${listing.name}"`)
        } catch (err) {
          console.error(`Failed for ${listing.ownerEmail}:`, err.message)
        }
      }
    } catch (err) {
      console.error('Vacancy ping job error:', err.message)
    }
  })

  console.log('✅ Vacancy ping cron scheduled (every Monday 9 AM)')
}

module.exports = { startVacancyPingJob }
