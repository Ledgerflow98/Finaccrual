const { AppError, ErpSessionExpiredError } = require('../../errors/AppError');

/** Capitalizes a provider key ('quickbooks' -> 'QuickBooks', 'xero' -> 'Xero') for user-facing text. */
function displayName(provider) {
    if (!provider) return 'ERP';
    const p = String(provider).toLowerCase();
    if (p === 'quickbooks') return 'QuickBooks';
    if (p === 'xero') return 'Xero';
    return provider;
}

/**
 * Thrown when the refresh token is invalid, expired, or has been revoked
 * (or the connection was explicitly disconnected). Maps to the app-wide
 * ErpSessionExpiredError (401, ERR_ERP_SESSION_EXPIRED) so it flows
 * through the same centralized error middleware/response envelope as
 * every other error in the app, while keeping the `provider` field and
 * `(message, provider)` constructor shape the rest of the OAuth code
 * already depends on.
 */
class OAuthTokenRevokedError extends ErpSessionExpiredError {
    constructor(message = 'OAuth integration disconnected. Re-authentication required.', provider) {
        super(displayName(provider), message);
        this.provider = provider;
    }
}

/**
 * Thrown for network failures, provider outages, or transient errors during
 * refresh — NOT a revoked connection, so the user isn't asked to reconnect.
 * 502, ERR_ERP_REFRESH_FAILED.
 */
class OAuthTokenRefreshError extends AppError {
    constructor(message = 'Failed to refresh OAuth token.', provider, originalError = null) {
        const name = displayName(provider);
        super(`Could not reach ${name}. Please try again shortly.`, 502, 'ERR_ERP_REFRESH_FAILED', message);
        this.provider = provider;
        this.originalError = originalError;
    }
}

// Kept for backwards compatibility with any code importing the old base class.
const OAuthError = ErpSessionExpiredError;

module.exports = {
    OAuthError,
    OAuthTokenRevokedError,
    OAuthTokenRefreshError
};
