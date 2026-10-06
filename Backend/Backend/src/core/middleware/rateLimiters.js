'use strict';

const rateLimit = require('express-rate-limit');
const { LimitReachedError } = require('../errors/AppError');

/**
 * Rate Limiters
 * ----------------------------------------------------------------
 * Security Validation.
 *
 * FinAccrual previously had no rate limiting at all — /api/auth/login
 * and the OAuth connect/callback endpoints could be hit an unlimited
 * number of times per second, which is exactly the surface brute-force
 * password guessing and OAuth-state-guessing attacks target.
 *
 * Every limiter routes through `next(new LimitReachedError(...))`
 * instead of writing its own res.json(), so a 429 from here comes back
 * in the exact same `{ success, code, message, details }` shape as
 * every other FinAccrual error (core/middleware/errorHandler.js).
 * ----------------------------------------------------------------
 */

function buildLimiter({ windowMs, max, message, skip }) {
    return rateLimit({
        windowMs,
        max,
        standardHeaders: true, // RateLimit-* response headers
        legacyHeaders:    false,
        skip: skip || (() => false),
        // Keyed by IP by default (express-rate-limit's default keyGenerator),
        // which is what we want here — these limits exist to slow down a
        // single abusive client, not to cap total traffic for the app.
        handler: (req, res, next) => next(new LimitReachedError(message)),
    });
}

/** General safety net for every /api/* route. Generous — this is not the
 *  primary defense, just a backstop against runaway/looping clients.
 *
 *  In development every client (the Excel task pane's own background
 *  polling, manual browser testing, the OAuth popups, curl/Postman, …)
 *  shares one IP — localhost — so they all count against the SAME
 *  bucket. That made 300/min trip during ordinary manual QA (see the
 *  ERR_LIMIT_REACHED hit on /api/payments/checkout), not just runaway
 *  loops. Raised well above normal traffic for non-production so it
 *  still catches an actual infinite-request bug without punishing a
 *  single developer's machine acting as every client at once; the
 *  production limit is untouched. */
const generalLimiter = buildLimiter({
    windowMs: 60 * 1000,     // 1 minute
    max:      process.env.NODE_ENV === 'production' ? 300 : 10000,
    skip:     (req) => {
        if (process.env.NODE_ENV !== 'production') return true;
        const p = req.path || '';
        const orig = req.originalUrl || '';
        return p === '/health' || p === '/health/' ||
               p.startsWith('/payments') ||
               p.startsWith('/quickbooks') ||
               p.startsWith('/xero') ||
               p.startsWith('/subscription/upgrade') ||
               p.startsWith('/auth/refresh-token') ||
               orig.includes('/api/health') ||
               orig.includes('/api/quickbooks') ||
               orig.includes('/api/xero') ||
               orig.includes('/api/payments') ||
               orig.includes('/api/subscription/upgrade') ||
               orig.includes('/api/auth/refresh-token');
    },
    message:  'Too many requests. Please slow down and try again shortly.'
});

/** Tighter limit on login/signup — the classic brute-force target. */
const authLimiter = buildLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max:      process.env.NODE_ENV === 'production' ? 20 : 1000,
    skip:     () => process.env.NODE_ENV !== 'production',
    message:  'Too many login/signup attempts. Please wait a few minutes and try again.'
});

/** Tighter limit on the QuickBooks/Xero connect + OAuth callback routes. */
const oauthLimiter = buildLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max:      process.env.NODE_ENV === 'production' ? 50 : 1000,
    skip:     () => process.env.NODE_ENV !== 'production',
    message:  'Too many connection attempts. Please wait a few minutes and try again.'
});

module.exports = { generalLimiter, authLimiter, oauthLimiter };
