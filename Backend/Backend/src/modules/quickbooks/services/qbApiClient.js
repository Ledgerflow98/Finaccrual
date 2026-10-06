'use strict';

const axios = require('axios');
const CONSTANTS = require('../../../core/constants');
const logger = require('../../../core/logger');
const QuickBooksTokenRepository = require('../repository');
const QuickBooksTokenManager = require('../oauth/QuickBooksTokenManager');
const { ErpSessionExpiredError } = require('../../../core/errors/AppError');

class QuickBooksApiClient {
    /**
     * Execute a raw QBQL query against the QuickBooks API.
     * @param {string} query - QuickBooks SQL-like query string
     * @param {object} [token] - Specific QuickBooks Token record to use
     * @returns {object} raw API response
     */
    static async executeQuery(query, token) {
        let realmId;
        let accessToken;

        if (token) {
            realmId = token.companyId || token.realm_id;
            accessToken = await QuickBooksTokenManager.getValidToken(realmId);
        } else {
            const connections = await QuickBooksTokenRepository.getActiveTokens();
            const activeToken = connections[0];
            if (!activeToken) {
                throw new ErpSessionExpiredError('QuickBooks', 'No active QuickBooks connection found.');
            }
            realmId = activeToken.companyId || activeToken.realm_id;
            accessToken = await QuickBooksTokenManager.getValidToken(realmId);
        }

        const url = `${CONSTANTS.QUICKBOOKS.BASE_URL}/v3/company/${realmId}/query`;

        try {
            const response = await axios.get(url, {
                headers: {
                    Authorization:  `Bearer ${accessToken}`,
                    Accept:         'application/json',
                    'Content-Type': 'application/text'
                },
                params: { query }
            });
            return response.data;
        } catch (error) {
            logger.error(`Error executing QB query for realm ${realmId}:`, error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * Fetches every record of `entityName` for a token, paging through
     * STARTPOSITION/MAXRESULTS until QuickBooks returns fewer than
     * `batchSize` records.
     *
     * @param {string} entityName - QBQL entity name, e.g. "Customer".
     * @param {object} token
     * @param {number} [batchSize=1000] - QuickBooks' MAXRESULTS hard cap.
     * @returns {Promise<{ QueryResponse: Object }>}
     */
    static async queryAll(entityName, token, batchSize = 1000) {
        const fetchBatch = async (startPosition) => {
            const query = `SELECT * FROM ${entityName} STARTPOSITION ${startPosition} MAXRESULTS ${batchSize}`;
            const raw = await QuickBooksApiClient.executeQuery(query, token);
            const batch = raw?.QueryResponse?.[entityName] || [];

            if (batch.length < batchSize) {
                return batch;
            }
            const nextBatch = await fetchBatch(startPosition + batchSize);
            return batch.concat(nextBatch);
        };

        const allRecords = await fetchBatch(1);
        return { QueryResponse: { [entityName]: allRecords } };
    }

    /**
     * Executes an API function call with exponential backoff and jitter for rate-limiting (429 / 503).
     * Zero loops used — relies on pure async functional recursion.
     */
    static async executeWithRetryAndBackoff(fn, retries = 5, delay = 500) {
        try {
            return await fn();
        } catch (err) {
            const isRateLimited = err.response?.status === 429 || err.status === 429 || err.statusCode === 429 || err.code === 'THROTTLED';
            const isTransientNetwork = err.code === 'ECONNRESET' || err.code === 'ETIMEDOUT' || err.code === 'EAI_AGAIN' || err.code === 'ECONNABORTED';

            if ((isRateLimited || isTransientNetwork) && retries > 0) {
                const jitter = Math.random() * 200;
                const backoffMs = delay * 2 + jitter;
                const reason = isRateLimited ? 'QB Rate Limit 429' : `QB Network Blip ${err.code}`;
                logger.warn(`[${reason}] Backing off for ${Math.round(backoffMs)}ms. Retries left: ${retries}`);
                await new Promise(resolve => setTimeout(resolve, backoffMs));
                return QuickBooksApiClient.executeWithRetryAndBackoff(fn, retries - 1, delay * 2);
            }
            throw err;
        }
    }

    /**
     * Fetches exactly ONE page of `entityName` for a single token via STARTPOSITION/MAXRESULTS.
     * @param {string} entityName - QBQL entity name, e.g. "Customer".
     * @param {object} token
     * @param {number} startPosition - 1-based, QuickBooks STARTPOSITION.
     * @param {number} pageSize - QuickBooks MAXRESULTS for this page.
     * @returns {Promise<{ raw: object, records: object[], hasMore: boolean }>}
     */
    static async queryPage(entityName, token, startPosition, pageSize) {
        const query = `SELECT * FROM ${entityName} STARTPOSITION ${startPosition} MAXRESULTS ${pageSize}`;
        const raw = await QuickBooksApiClient.executeQuery(query, token);
        const records = raw?.QueryResponse?.[entityName] || [];
        return { raw, records, hasMore: records.length === pageSize };
    }
}

module.exports = QuickBooksApiClient;
