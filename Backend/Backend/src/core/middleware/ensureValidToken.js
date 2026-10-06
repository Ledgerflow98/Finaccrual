const quickbooksTokenManager = require('../../modules/quickbooks/oauth/QuickBooksTokenManager');
const xeroTokenManager = require('../../modules/xero/oauth/XeroTokenManager');
const { ValidationError } = require('../errors/AppError');
const logger = require('../logger');

/**
 * Express middleware to ensure a valid token exists before reaching route handlers.
 * Any OAuth failure (expired/revoked refresh token, transient provider
 * outage) is already thrown as an AppError subclass by TokenManager
 * (see core/oauth/errors/OAuthErrors.js) — this just forwards it to
 * next(err) so the centralized error middleware formats the standard
 * { success, code, message, details } response.
 * @param {'quickbooks'|'xero'} provider
 */
function ensureValidToken(provider) {
    return async (req, res, next) => {
        // Resolve company identifier from request parameter, query, or body
        const accountId = req.params.realmId || req.query.realmId || req.params.tenantId || req.query.tenantId || req.body.accountId;

        if (!accountId) {
            return next(new ValidationError(`Missing company account identifier (realmId/tenantId) for ${provider}.`));
        }

        try {
            let accessToken;
            if (provider === 'quickbooks') {
                accessToken = await quickbooksTokenManager.getValidToken(accountId);
            } else if (provider === 'xero') {
                accessToken = await xeroTokenManager.getValidToken(accountId);
            } else {
                return next(new ValidationError(`Unsupported OAuth provider: ${provider}.`));
            }

            // Attach valid token to request object for route/service consumption
            req.oauth = {
                provider,
                accountId,
                accessToken
            };

            next();
        } catch (error) {
            logger.error(`Error resolving valid token for ${provider} (${accountId}):`, error.message);
            next(error);
        }
    };
}

module.exports = ensureValidToken;
