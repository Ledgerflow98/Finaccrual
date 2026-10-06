const { XeroToken, QuickBooksToken } = require('../../core/database');

/**
 * Every read/write here is scoped to the owning user's FIN ID (userId) wherever one
 * is supplied. ERP connections must never leak across accounts — a
 * connection belongs exclusively to the user ID that created it, so callers
 * (the service/controller layers) are expected to always pass the
 * authenticated user's `userId` through to these methods.
 */
class XeroTokenRepository {
    static async getLatestToken(userId) {
        return await XeroToken.findOne({
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
        return await XeroToken.findAll({
            where: { status: 'Active', ...(userId ? { user_id: userId } : {}) },
            order: [['updated_at', 'DESC']]
        });
    }

    /** @param {string} [userId] - Scopes to this user's connections only. */
    static async getAllTokens(userId) {
        return await XeroToken.findAll({
            where: userId ? { user_id: userId } : {},
            order: [['created_at', 'DESC']]
        });
    }

    static async upsertToken(tokenData) {
        if (!tokenData.tenant_id) return null;

        return await XeroToken.upsert({
            tenant_id:     tokenData.tenant_id,
            access_token:  tokenData.access_token,
            refresh_token: tokenData.refresh_token,
            expires_in:    tokenData.expires_in,
            token_type:    tokenData.token_type,
            scope:         tokenData.scope,
            session_info:  tokenData.session_info,
            user_id:       tokenData.user_id || tokenData.userId,
            company_name:  tokenData.company_name,
            status:        tokenData.status || 'Active'
        });
    }

    /**
     * Disconnects every one of the given user's Xero connections and wipes
     * their credentials. `userId` is required — without it this used to
     * `truncate` the entire table (every user's connections), which is
     * exactly the cross-account data loss this scoping exists to prevent,
     * so a missing `userId` is now a no-op rather than a footgun.
     *
     * The rows are deliberately kept rather than destroyed. Plan limits are
     * counted per organisation ever connected (see xeroCallback /
     * selectCompanies), so deleting the rows here would hand the user a
     * fresh allowance every time they disconnected — the exact loophole
     * that lifetime count closes. Keeping them also preserves the
     * "Reconnect" affordance in the task pane, matching the per-connection
     * disconnect path (XeroTokenRepository.markDisconnected).
     * @param {string} userId
     */
    static async clearTokens(userId) {
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

module.exports = XeroTokenRepository;
