'use strict';

const axios = require('axios');
const CONSTANTS = require('../../../core/constants');
const XeroMapper = require('../mapper');
const XeroTokenManager = require('../oauth/XeroTokenManager');
const logger = require('../../../core/logger');

/** True if an axios error looks like an expired/revoked OAuth grant. */
function isAuthError(err) {
    if (!err) return false;
    if (err.response?.status === 401 || err.response?.status === 403) return true;
    const blob = JSON.stringify(err.response?.data || err.message || '').toLowerCase();
    return blob.includes('invalid_grant') || blob.includes('invalid_token') || blob.includes('unauthorized');
}

class XeroApiClient {
    static isAuthError = isAuthError;

    /**
     * Standard Xero request headers for one connected tenant. Always goes
     * through XeroTokenManager so an expiring access token is refreshed
     * (and a revoked connection surfaces as a reconnect) rather than being
     * used as-is.
     */
    static async _tenantHeaders(tenantId) {
        const accessToken = await XeroTokenManager.getValidToken(tenantId);
        return {
            Authorization:    `Bearer ${accessToken}`,
            'Xero-Tenant-Id': tenantId,
            Accept:           'application/json'
        };
    }

    /**
     * Resolves the display name for a tenant, preferring the live
     * Organisation record and falling back to the stored company name (and
     * then the tenant id). A failed lookup is non-fatal.
     */
    static async _resolveOrgName(token, tenantId, headers) {
        let orgName = token.companyName || tenantId;
        try {
            const orgRes = await axios.get(CONSTANTS.XERO.ORGANISATION_URL, { headers });
            const orgObj = XeroMapper.toOrganisation(orgRes.data);
            if (orgObj && orgObj.name) orgName = orgObj.name;
        } catch (_) {}
        return orgName;
    }

    /**
     * Execute a Xero API function with exponential backoff and jitter for
     * rate-limiting (429 / 503). Zero loops — pure async functional recursion.
     * Mirrors QuickBooksApiClient.executeWithRetryAndBackoff.
     */
    static async executeWithRetryAndBackoff(fn, retries = 5, delay = 500) {
        try {
            return await fn();
        } catch (err) {
            const isRateLimited =
                err.response?.status === 429 || err.status === 429 ||
                err.statusCode === 429 || err.code === 'THROTTLED';
            if (isRateLimited && retries > 0) {
                const jitter = Math.random() * 200;
                const backoffMs = delay * 2 + jitter;
                logger.warn(`[Xero Rate Limit 429] Backing off for ${Math.round(backoffMs)}ms. Retries left: ${retries}`);
                await new Promise(resolve => setTimeout(resolve, backoffMs));
                return XeroApiClient.executeWithRetryAndBackoff(fn, retries - 1, delay * 2);
            }
            throw err;
        }
    }

    /**
     * Fetches exactly ONE page of Contacts for a single tenant using Xero's
     * page-based pagination (?page=N&pageSize=P).
     * Only Contacts are paginated in Xero; Accounts / TrackingCategories are
     * returned in a single response and do not support page params.
     *
     * @param {object} token - token object with companyId / tenant_id
     * @param {number} page - 1-based page number
     * @param {number} pageSize - number of records per page (Xero max: 100)
     * @param {object} [extraHeaders] - optional headers (e.g. If-Modified-Since)
     * @returns {Promise<{ raw: object, records: object[], hasMore: boolean }>}
     */
    static async queryContactsPage(token, page, pageSize, extraHeaders = {}) {
        const tenantId = token.companyId || token.tenant_id;
        const headers  = await XeroApiClient._tenantHeaders(tenantId);
        const mergedHeaders = { ...headers, ...extraHeaders };

        const url = CONSTANTS.XERO.CONTACTS_URL;

        const response = await XeroApiClient.executeWithRetryAndBackoff(() =>
            axios.get(url, {
                headers: mergedHeaders,
                params:  { page, pageSize },
                validateStatus: (status) => (status >= 200 && status < 300) || status === 304
            })
        );

        const records = response.data?.Contacts || [];
        // Xero returns fewer than pageSize when on the last page
        return { raw: response.data, records, hasMore: records.length === pageSize };
    }

    /**
     * Fetches ALL Contacts for a tenant by auto-paging through pages until
     * Xero returns fewer than pageSize records.
     * Returns the combined response in the same shape as a single Xero response
     * so existing mappers (XeroMapper.toContactList) work unchanged.
     *
     * @param {object} token
     * @param {number} [pageSize=100] - Xero hard cap is 100
     * @param {object} [extraHeaders]
     * @param {Function|null} [onChunkCallback] - called with (chunkSize) after each page
     * @returns {Promise<{ Contacts: object[] }>}
     */
    static async queryAllContacts(token, pageSize = 100, extraHeaders = {}, onChunkCallback = null) {
        const fetchPage = async (page, accumulated) => {
            const { records, hasMore } = await XeroApiClient.queryContactsPage(token, page, pageSize, extraHeaders);

            if (typeof onChunkCallback === 'function' && records.length > 0) {
                onChunkCallback(records.length);
            }

            const next = accumulated.concat(records);
            if (!hasMore) return next;
            return fetchPage(page + 1, next);
        };

        const allContacts = await fetchPage(1, []);
        return { Contacts: allContacts };
    }
}

module.exports = XeroApiClient;
