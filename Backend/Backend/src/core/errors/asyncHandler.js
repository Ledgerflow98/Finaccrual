'use strict';

/**
 * asyncHandler
 * -----------------------------------------------------------------
 * Wraps an async Express route/middleware function so any rejected
 * promise (thrown AppError, awaited failure, whatever) is forwarded to
 * next(err) automatically instead of needing a try/catch in every
 * controller. That's what lets a single centralized error middleware
 * (see core/middleware/errorHandler.js) handle every route.
 *
 * Usage:
 *   const asyncHandler = require('../../core/errors/asyncHandler');
 *   router.get('/thing', asyncHandler(controller.getThing));
 *
 * Or inside a controller method body:
 *   getThing = asyncHandler(async (req, res) => {
 *       const thing = await Service.getThing();
 *       res.json({ success: true, thing });
 *   });
 * -----------------------------------------------------------------
 */
function asyncHandler(fn) {
    return function wrapped(req, res, next) {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}

module.exports = asyncHandler;
