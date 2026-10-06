const jwt = require('jsonwebtoken');
const config = require('../config');
const { SessionExpiredError } = require('../errors/AppError');

/**
 * Middleware to protect routes with JWT authentication (used by the
 * admin module, whose token payload/shape differs from the main
 * user `authenticate` middleware in modules/auth/auth.middleware.js).
 *
 * On any failure this forwards a SessionExpiredError (401,
 * ERR_SESSION_EXPIRED) to the centralized error middleware, same as the
 * main auth middleware, so the frontend handles both consistently.
 */
const authenticateJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return next(new SessionExpiredError('Missing authorization header.'));
    }

    // Bearer Token
    const token = authHeader.split(' ')[1];

    jwt.verify(token, config.JWT_SECRET, (err, user) => {
        if (err) {
            return next(new SessionExpiredError(err.message || 'Invalid or expired token.'));
        }

        req.user = user;
        next();
    });
};

module.exports = authenticateJWT;
