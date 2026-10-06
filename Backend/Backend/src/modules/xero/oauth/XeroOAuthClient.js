const axios = require('axios');
const IOAuthClient = require('../../../core/oauth/interfaces/IOAuthClient');
const config = require('../../../core/config');
const CONSTANTS = require('../../../core/constants');
const { encodeBasicAuth } = require('../../../core/helpers');

class XeroOAuthClient extends IOAuthClient {
    async refreshTokens(refreshToken) {
        const credentials = encodeBasicAuth(config.XERO.CLIENT_ID, config.XERO.CLIENT_SECRET);

        const response = await axios.post(
            CONSTANTS.XERO.TOKEN_URL,
            new URLSearchParams({
                grant_type: 'refresh_token',
                refresh_token: refreshToken
            }),
            {
                headers: {
                    Authorization: `Basic ${credentials}`,
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }
        );

        return {
            accessToken: response.data.access_token,
            refreshToken: response.data.refresh_token,
            expiresIn: response.data.expires_in
        };
    }
}

module.exports = XeroOAuthClient;
