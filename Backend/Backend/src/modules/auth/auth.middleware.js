'use strict';

const JwtService     = require('./jwt.service');
const UserRepository = require('./user.repository');
const { SessionExpiredError } = require('../../core/errors/AppError');

/**
 * authenticate middleware
 * ----------------------------------------------------------------
 * Verifies the Bearer JWT on protected routes.
 * On success: populates req.user with the decoded payload.
 * On failure: forwards a SessionExpiredError (401, ERR_SESSION_EXPIRED)
 * to the centralized error middleware — every failure mode here (missing
 * token, malformed token, expired token, deactivated user) is the same
 * "please sign in again" scenario from the frontend's point of view.
 *
 * Usage:
 *   const { authenticate } = require('./auth.middleware');
 *   router.get('/me', authenticate, controller.getMe);
 * ----------------------------------------------------------------
 */
const authenticate = async (req, res, next) => {
    try {
        let token = null;

        // 1. Check Authorization header
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.split(' ')[1];
        }

        // 2. Check query parameters (for GET popups/iframes)
        if (!token && req.query && req.query.token) {
            token = req.query.token;
        }

        // 3. Check request body (as fallback)
        if (!token && req.body && req.body.token) {
            token = req.body.token;
        }

        if (!token) {
            return next(new SessionExpiredError('Missing or malformed authentication token.'));
        }

        const decoded = JwtService.verifyToken(token);

        // Optionally load the full user record so downstream handlers have it
        const user = await UserRepository.findById(decoded.userId);
        if (!user || !user.is_active) {
            return next(new SessionExpiredError('User not found or deactivated.'));
        }

        req.user = {
            userId: user.id,
            email:  user.email,
            role:   user.role,
            name:   user.name
        };

        next();
    } catch (err) {
        return next(new SessionExpiredError(err.message || 'JWT verification failed.'));
    }
};

module.exports = { authenticate };
