'use strict';

const axios = require('axios');
const querystring = require('querystring');
const config = require('../../../core/config');
const CONSTANTS = require('../../../core/constants');
const { encodeBasicAuth } = require('../../../core/helpers');
const XeroTokenRepository = require('../repository');
const XeroTokenManager = require('../oauth/XeroTokenManager');

class XeroAuthService {
    /**
     * Exchange OAuth authorization code for tokens and persist them for all returned tenants.
     */
    static async exchangeAndSaveToken(code, sessionInfo, userId) {
        const credentials = encodeBasicAuth(config.XERO.CLIENT_ID, config.XERO.CLIENT_SECRET);

        const tokenResponse = await axios.post(
            CONSTANTS.XERO.TOKEN_URL,
            querystring.stringify({
                grant_type:   'authorization_code',
                code,
                redirect_uri: config.XERO.REDIRECT_URI
            }),
            {
                headers: {
                    Authorization:  `Basic ${credentials}`,
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }
        );

        const tokens = tokenResponse.data;

        const tenantResponse = await axios.get(CONSTANTS.XERO.CONNECTIONS_URL, {
            headers: { Authorization: `Bearer ${tokens.access_token}` }
        });

        const tenants = tenantResponse.data || [];
        if (tenants.length === 0) throw new Error('No Xero organisation connected.');

        await Promise.all(tenants.map(tenant => 
            XeroTokenRepository.upsertToken({
                tenant_id:    tenant.tenantId,
                access_token: tokens.access_token || '',
                refresh_token: tokens.refresh_token || '',
                expires_in:   Math.floor(Date.now() / 1000) + (tokens.expires_in || 0),
                token_type:   tokens.token_type || '',
                scope:        tokens.scope || '',
                session_info: sessionInfo,
                user_id:      userId,
                company_name: tenant.tenantName || 'Xero Organisation',
                status:       'Not Synced'
            })
        ));

        return tenants[0];
    }

    /**
     * Exchange the OAuth code for tokens and fetch all available tenants without persisting yet.
     */
    static async exchangeTokensOnly(code) {
        const credentials = encodeBasicAuth(config.XERO.CLIENT_ID, config.XERO.CLIENT_SECRET);

        const tokenResponse = await axios.post(
            CONSTANTS.XERO.TOKEN_URL,
            querystring.stringify({
                grant_type:   'authorization_code',
                code,
                redirect_uri: config.XERO.REDIRECT_URI
            }),
            {
                headers: {
                    Authorization:  `Basic ${credentials}`,
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }
        );

        const tokens = tokenResponse.data;

        const tenantResponse = await axios.get(CONSTANTS.XERO.CONNECTIONS_URL, {
            headers: { Authorization: `Bearer ${tokens.access_token}` }
        });

        const tenants = tenantResponse.data || [];
        return { tokens, tenants };
    }

    /**
     * Persist tokens only for tenant IDs selected by user.
     */
    static async saveSelectedTenants(selectedTenantIds, tokens, allTenants, userId, sessionInfo) {
        const selectedSet = new Set(selectedTenantIds);
        const toSave = allTenants.filter(t => selectedSet.has(t.tenantId));

        if (toSave.length === 0) throw new Error('No valid tenants selected.');

        await Promise.all(toSave.map(tenant =>
            XeroTokenRepository.upsertToken({
                tenant_id:     tenant.tenantId,
                access_token:  tokens.access_token  || '',
                refresh_token: tokens.refresh_token || '',
                expires_in:    Math.floor(Date.now() / 1000) + (tokens.expires_in || 0),
                token_type:    tokens.token_type    || '',
                scope:         tokens.scope         || '',
                session_info:  sessionInfo,
                user_id:       userId,
                company_name:  tenant.tenantName || 'Xero Organisation',
                status:        'Not Synced'
            })
        ));

        return toSave;
    }

    /**
     * Use stored refresh token to get a new access token.
     */
    static async refreshAccessToken() {
        const connections = await XeroTokenRepository.getActiveTokens();
        if (!connections || connections.length === 0) throw new Error('Xero is not connected.');

        const token = connections[0];
        const tenantId = token.companyId || token.tenant_id;
        await XeroTokenManager.getValidToken(tenantId);
        return token;
    }

    /**
     * Helper to get list of active tokens for the calling user's connected tenants.
     */
    static async getAllTokens(userId) {
        const tokens = await XeroTokenRepository.getActiveTokens(userId);
        if (!tokens || tokens.length === 0) throw new Error('Xero account is not connected.');
        return tokens;
    }
}

module.exports = XeroAuthService;
