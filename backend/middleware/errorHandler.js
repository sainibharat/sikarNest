/**
 * middleware/errorHandler.js — Global Express Error Handler
 *
 * Registered as the LAST middleware in server.js with app.use(errorHandler).
 * Express automatically passes errors to this when routes call next(err).
 *
 * What it does:
 *   - Logs the error message to console
 *   - Returns a JSON error response to the client
 *   - Uses err.status if set (e.g. 400, 404), defaults to 500
 *
 * To trigger this from a route:
 *   try { ... } catch (err) { next(err) }
 */
function errorHandler(err, req, res, next) {
  console.error(err.message)
  const status = err.status || 500
  res.status(status).json({
    error: err.message || 'Internal server error',
  })
}

module.exports = errorHandler
