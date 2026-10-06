const TokenManager = require('../../../core/oauth/TokenManager');
const XeroOAuthClient = require('./XeroOAuthClient');
const XeroTokenRepository = require('./XeroTokenRepository');
const localLockManager = require('../../../core/oauth/locking/LocalLockManager');

class XeroTokenManager extends TokenManager {
    constructor() {
        super(
            'xero',
            new XeroOAuthClient(),
            new XeroTokenRepository(),
            localLockManager
        );
    }
}

module.exports = new XeroTokenManager();
