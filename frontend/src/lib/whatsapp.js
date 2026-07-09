/**
 * lib/whatsapp.js — WhatsApp Deep Link Utility
 *
 * Used by ListingDetail.jsx to create a "Contact on WhatsApp" button.
 * Builds a wa.me deep link with a pre-filled message so students can
 * reach the owner with one click.
 *
 * Functions:
 *   buildVacancyCheckUrl(phone, pgName, area) → returns wa.me URL string
 *   openWhatsAppChat(phone, pgName, area)     → opens WhatsApp in new tab
 *
 * @param {string} ownerPhone - owner WhatsApp number (with country code, no + e.g. "919876543210")
 * @param {string} pgName     - name of the hostel/flat
 * @param {string} area       - area/locality
 */
export function buildVacancyCheckUrl(ownerPhone, pgName, area) {
  const message = encodeURIComponent(
    `Hello! I found your PG *${pgName}* (${area}) on SikarNest. Is it currently vacant? If yes, please share the details. Thank you! 🙏`
  )
  return `https://wa.me/${ownerPhone}?text=${message}`
}

//Opens the WhatsApp chat in a new tab.
export function openWhatsAppChat(ownerPhone, pgName, area) {
  const url = buildVacancyCheckUrl(ownerPhone, pgName, area)
  window.open(url, '_blank', 'noopener,noreferrer')
}
