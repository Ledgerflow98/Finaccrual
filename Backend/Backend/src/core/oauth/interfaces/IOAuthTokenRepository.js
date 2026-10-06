/**
 * Interface representing Database operations for Token Storage.
 * @interface
 */
class IOAuthTokenRepository {
    /**
     * Retrieve the stored token details by company/account ID.
     * @param {string} accountId 
     * @returns {Promise<{accessToken: string, refreshToken: string, expiresAt: Date, rawToken: object}>}
     */
    async getToken(accountId) {
        throw new Error('Method not implemented.');
    }

    /**
     * Save the newly acquired tokens back to the database.
     * @param {string} accountId 
     * @param {{accessToken: string, refreshToken: string, expiresAt: Date}} tokenData 
     * @returns {Promise<void>}
     */
    async saveToken(accountId, tokenData) {
        throw new Error('Method not implemented.');
    }

    /**
     * Mark token status as disconnected or inactive.
     * @param {string} accountId 
     * @returns {Promise<void>}
     */
    async markDisconnected(accountId) {
        throw new Error('Method not implemented.');
    }
}

module.exports = IOAuthTokenRepository;
