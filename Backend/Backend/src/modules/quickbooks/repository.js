const { QuickBooksToken, XeroToken } = require('../../core/database');

/**
 * Every read/write here is scoped to the owning user's FIN ID (userId) wherever one
 * is supplied. ERP connections must never leak across accounts — a
 * connection belongs exclusively to the user ID that created it, so callers
 * (the service/controller layers) are expected to always pass the
 * authenticated user's `userId` through to these methods.
 */
class QuickBooksTokenRepository {
    static async getLatestToken(userId) {
        return await QuickBooksToken.findOne({
            where: userId ? { user_id: userId } : {},
            order: [['updated_at', 'DESC']]
        });
    }

    /**
     * @param {string} [userId] - Scopes to this user's connections only. Pass
     *   nothing only for genuinely account-agnostic internal use — every
     *   user-facing caller must supply it.
     */
    static async getActiveTokens(userId) {
        return await QuickBooksToken.findAll({
            where: { status: 'Active', ...(userId ? { user_id: userId } : {}) },
            order: [['updated_at', 'DESC']]
        });
    }

    /** @param {string} [userId] - Scopes to this user's connections only. */
    static async getAllTokens(userId) {
        return await QuickBooksToken.findAll({
            where: userId ? { user_id: userId } : {},
            order: [['created_at', 'DESC']]
        });
    }

    static async upsertToken(tokenData) {
        return await QuickBooksToken.upsert(tokenData);
    }

    /**
     * Disconnects every one of the given user's QuickBooks connections and
     * wipes their credentials. `userId` is required — without it this used to
     * `truncate` the entire table (every user's connections), which is
     * exactly the cross-account data loss this scoping exists to prevent,
     * so a missing `userId` is now a no-op rather than a footgun.
     *
     * The rows are deliberately kept rather than destroyed. Plan limits are
     * counted per company ever connected (see quickbooksCallback), so
     * deleting the rows here would hand the user a fresh allowance every
     * time they disconnected — the exact loophole the lifetime count
     * closes. Keeping them also preserves the "Reconnect" affordance for
     * each company in the task pane, matching per-connection disconnect
     * (QuickBooksService.disconnectConnection).
     * @param {string} userId
     */
    static async clearTokens(userId) {
        if (!userId) return 0;
        const [updated] = await QuickBooksToken.update({
            status: 'Disconnected',
            access_token: '',
            refresh_token: '',
            expires_in: 0,
            x_refresh_token_expires_in: 0,
            session_info: null
        }, { where: { user_id: userId } });
        return updated;
    }

    /**
     * Disconnects every one of the given user's Xero connections. Same
     * `userId`-required safety rule, and the same keep-the-row reasoning, as
     * clearTokens() above.
     * @param {string} userId
     */
    static async clearXeroTokens(userId) {
        if (!userId) return 0;
        const [updated] = await XeroToken.update({
            status: 'Disconnected',
            access_token: '',
            refresh_token: '',
            expires_in: 0,
            session_info: null
        }, { where: { user_id: userId } });
        return updated;
    }
}

module.exports = QuickBooksTokenRepository;
