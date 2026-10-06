const axios = require('axios');
const querystring = require('querystring');
const IOAuthClient = require('../../../core/oauth/interfaces/IOAuthClient');
const config = require('../../../core/config');
const CONSTANTS = require('../../../core/constants');
const { encodeBasicAuth } = require('../../../core/helpers');

class QuickBooksOAuthClient extends IOAuthClient {
    async refreshTokens(refreshToken) {
        const credentials = encodeBasicAuth(config.QB.CLIENT_ID, config.QB.CLIENT_SECRET);
        
        const response = await axios.post(
            CONSTANTS.QUICKBOOKS.TOKEN_URL,
            querystring.stringify({
                grant_type: 'refresh_token',
                refresh_token: refreshToken
            }),
            {
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/x-www-form-urlencoded',
                    Authorization: `Basic ${credentials}`
                }
            }
        );

        return {
            accessToken:           response.data.access_token,
            refreshToken:          response.data.refresh_token,
            expiresIn:             response.data.expires_in,
            // QuickBooks returns x_refresh_token_expires_in (seconds) — persist it
            refreshTokenExpiresIn: response.data.x_refresh_token_expires_in || null
        };
    }
}

module.exports = QuickBooksOAuthClient;
