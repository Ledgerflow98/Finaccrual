const TokenManager = require('../../../core/oauth/TokenManager');
const QuickBooksOAuthClient = require('./QuickBooksOAuthClient');
const QuickBooksTokenRepository = require('./QuickBooksTokenRepository');
const localLockManager = require('../../../core/oauth/locking/LocalLockManager');

class QuickBooksTokenManager extends TokenManager {
    constructor() {
        super(
            'quickbooks',
            new QuickBooksOAuthClient(),
            new QuickBooksTokenRepository(),
            localLockManager
        );
    }
}

// Export a singleton
module.exports = new QuickBooksTokenManager();
