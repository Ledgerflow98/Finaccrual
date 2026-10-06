'use strict';

const QuickBooksTokenRepository = require('../repository');
const QuickBooksMapper = require('../mapper');
const QuickBooksApiClient = require('./qbApiClient');
const logger = require('../../../core/logger');

class QuickBooksEntityService {
    /**
     * Fetch company info and return clean CompanyDTO for a specific token or
     * all of the calling user's tokens.
     * @param {object} [token]
     * @param {string} [userId] - Owning user's FIN ID; scopes which companies are queried when `token` isn't given.
     * @returns {CompanyDTO|CompanyDTO[]|null}
     */
    static async getCompanyInfo(token, userId) {
        if (token) {
            try {
                const raw = await QuickBooksApiClient.executeQuery('SELECT * FROM CompanyInfo', token);
                return QuickBooksMapper.toCompanyInfo(raw);
            } catch (err) {
                return null;
            }
        }

        const tokens = await QuickBooksTokenRepository.getActiveTokens(userId);
        if (!tokens || tokens.length === 0) return null;

        const companyResults = await Promise.all(tokens.map(async (t) => {
            try {
                const raw = await QuickBooksApiClient.executeQuery('SELECT * FROM CompanyInfo', t);
                const info = QuickBooksMapper.toCompanyInfo(raw);
                if (info) {
                    info.id = t.companyId;
                    return info;
                }
            } catch (err) {}
            return null;
        }));

        const companies = companyResults.filter(Boolean);
        return companies.length === 1 ? companies[0] : companies;
    }

    /**
     * Helper to get company name and ID for tagging records of a specific token.
     * @param {object} token
     * @returns {Promise<{ orgId: string, orgName: string }>}
     */
    static async getCompanyMetadata(token) {
        const company = await QuickBooksEntityService.getCompanyInfo(token).catch(() => null);
        const realmId = token.companyId || token.realm_id;
        const orgId   = company ? (company.id || company.name || realmId) : realmId;
        const orgName = company ? (company.name || company.legalName || company.id || "QuickBooks Company") : "QuickBooks Company";
        return { orgId, orgName };
    }

    /**
     * Fetches every active token's CompanyInfo ONCE and returns both the
     * "Company" worksheet data and a token→orgName lookup in a single pass.
     * @param {string} userId - Owning user's FIN ID; scopes which companies are queried.
     * @returns {Promise<{ tokens: object[], company: CompanyDTO|CompanyDTO[]|null, orgNameByTokenId: Map<string, string> }>}
     */
    static async getCompanyInfoAndOrgNames(userId) {
        const tokens = await QuickBooksTokenRepository.getActiveTokens(userId);
        const orgNameByTokenId = new Map();

        if (!tokens || tokens.length === 0) {
            return { tokens: [], company: null, orgNameByTokenId };
        }

        const companies = (await Promise.all(tokens.map(async (token) => {
            const tokenId = token.companyId || token.realm_id;
            const info = await QuickBooksEntityService.getCompanyInfo(token).catch(() => null);
            if (info) info.id = token.companyId;
            const orgName = info ? (info.name || info.legalName || info.id || "QuickBooks Company") : "QuickBooks Company";
            orgNameByTokenId.set(tokenId, orgName);
            return info;
        }))).filter(Boolean);

        const company = companies.length === 1 ? companies[0] : companies;
        return { tokens, company, orgNameByTokenId };
    }

    /**
     * Shared implementation behind getCustomers/getVendors/getAccounts/getClasses/getLocations.
     * @param {string} entityName - QBQL entity, e.g. "Customer".
     * @param {Function} mapperFn - QuickBooksMapper.toXList, e.g. toCustomerList.
     * @param {string} logLabel - Plural label used in the per-token error log.
     * @param {string} userId - Owning user's FIN ID; scopes which companies are queried.
     * @returns {Promise<object[]>}
     */
    static async _getEntityList(entityName, mapperFn, logLabel, userId) {
        const tokens = await QuickBooksTokenRepository.getActiveTokens(userId);
        const results = await Promise.all(tokens.map(async (token) => {
            try {
                const raw = await QuickBooksApiClient.queryAll(entityName, token);
                const list = mapperFn(raw);
                const { orgName } = await QuickBooksEntityService.getCompanyMetadata(token);
                return list.map(item => ({
                    ...item,
                    clientId: orgName,
                    clientName: orgName
                }));
            } catch (err) {
                const realmId = token.companyId || token.realm_id;
                logger.error(`Error getting ${logLabel} for realm ${realmId}:`, err.message);
                return [];
            }
        }));
        return results.flat();
    }

    static async getCustomers(userId) {
        return QuickBooksEntityService._getEntityList('Customer', QuickBooksMapper.toCustomerList, 'customers', userId);
    }

    static async getVendors(userId) {
        return QuickBooksEntityService._getEntityList('Vendor', QuickBooksMapper.toVendorList, 'vendors', userId);
    }

    static async getAccounts(userId) {
        return QuickBooksEntityService._getEntityList('Account', QuickBooksMapper.toAccountList, 'accounts', userId);
    }

    static async getClasses(userId) {
        return QuickBooksEntityService._getEntityList('Class', QuickBooksMapper.toClassList, 'classes', userId);
    }

    static async getLocations(userId) {
        return QuickBooksEntityService._getEntityList('Department', QuickBooksMapper.toLocationList, 'departments', userId);
    }

    /**
     * Shared implementation behind getCustomersPage/getVendorsPage/etc.
     */
    static async _queryEntityPage(entityName, mapperFn, activeTokens, startPosition, pageSize, orgNameByTokenId) {
        const exhaustedTokenIds = new Set();
        const perToken = await Promise.all(activeTokens.map(async (token) => {
            const tokenId = token.companyId || token.realm_id;
            try {
                const { raw, records, hasMore } = await QuickBooksApiClient.queryPage(entityName, token, startPosition, pageSize);
                if (!hasMore) exhaustedTokenIds.add(tokenId);
                const list = mapperFn(raw);
                const orgName = (orgNameByTokenId && orgNameByTokenId.get(tokenId)) || "QuickBooks Company";
                return list.map(item => ({ ...item, clientId: orgName, clientName: orgName }));
            } catch (err) {
                logger.error(`Error getting ${entityName} page (start ${startPosition}) for realm ${tokenId}:`, err.message);
                exhaustedTokenIds.add(tokenId);
                return [];
            }
        }));
        return { records: perToken.flat(), exhaustedTokenIds };
    }

    static async getCustomersPage(activeTokens, startPosition, pageSize, orgNameByTokenId) {
        return QuickBooksEntityService._queryEntityPage('Customer', QuickBooksMapper.toCustomerList, activeTokens, startPosition, pageSize, orgNameByTokenId);
    }

    static async getVendorsPage(activeTokens, startPosition, pageSize, orgNameByTokenId) {
        return QuickBooksEntityService._queryEntityPage('Vendor', QuickBooksMapper.toVendorList, activeTokens, startPosition, pageSize, orgNameByTokenId);
    }

    static async getAccountsPage(activeTokens, startPosition, pageSize, orgNameByTokenId) {
        return QuickBooksEntityService._queryEntityPage('Account', QuickBooksMapper.toAccountList, activeTokens, startPosition, pageSize, orgNameByTokenId);
    }

    static async getClassesPage(activeTokens, startPosition, pageSize, orgNameByTokenId) {
        return QuickBooksEntityService._queryEntityPage('Class', QuickBooksMapper.toClassList, activeTokens, startPosition, pageSize, orgNameByTokenId);
    }

    static async getLocationsPage(activeTokens, startPosition, pageSize, orgNameByTokenId) {
        return QuickBooksEntityService._queryEntityPage('Department', QuickBooksMapper.toLocationList, activeTokens, startPosition, pageSize, orgNameByTokenId);
    }
}

module.exports = QuickBooksEntityService;
