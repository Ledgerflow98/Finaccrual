/**
 * Interface representing OAuth Server endpoints interaction.
 * @interface
 */
class IOAuthClient {
    /**
     * Call OAuth provider server to refresh the tokens.
     * @param {string} refreshToken 
     * @returns {Promise<{accessToken: string, refreshToken: string, expiresIn: number}>}
     */
    async refreshTokens(refreshToken) {
        throw new Error('Method not implemented.');
    }
}

module.exports = IOAuthClient;
