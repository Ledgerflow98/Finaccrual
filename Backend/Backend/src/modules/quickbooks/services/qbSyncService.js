'use strict';

const QuickBooksApiClient = require('./qbApiClient');
const QuickBooksEntityService = require('./qbEntityService');
const QuickBooksMapper = require('../mapper');
const logger = require('../../../core/logger');

class QuickBooksSyncService {
    static SEQUENTIAL_ENTITY_ORDER = ['Account', 'Class', 'Department', 'Customer', 'Vendor'];
    static PULL_PAGE_SIZE = 100;

    static _db() {
        return {
            QuickBooksToken: require('../../../core/database').QuickBooksToken,
            Op: require('sequelize').Op
        };
    }

    static PLAN_LIMITS = { trial: 1, basic: 1, standard: 3, pro: 10 };

    static getMaxConnections(plan) {
        return QuickBooksSyncService.PLAN_LIMITS[(plan || 'pro').toLowerCase()] ?? 10;
    }

    /**
     * Pre-flight query to count total records for all entity types of a token.
     */
    static async getTotalRecordCountsForToken(token) {
        const entityNames = ['Customer', 'Vendor', 'Account', 'Class', 'Department'];
        const countResults = await Promise.all(entityNames.map(async (entityName) => {
            try {
                const raw = await QuickBooksApiClient.executeQuery(`SELECT COUNT(*) FROM ${entityName}`, token);
                const count = raw?.QueryResponse?.totalCount || raw?.QueryResponse?.[entityName]?.length || 0;
                return { entityName, count };
            } catch (err) {
                return { entityName, count: 0 };
            }
        }));

        return countResults.reduce((acc, curr) => {
            acc[curr.entityName] = curr.count;
            acc.total += curr.count;
            return acc;
        }, { Customer: 0, Vendor: 0, Account: 0, Class: 0, Department: 0, total: 0 });
    }

    /**
     * Pure loopless async functional recursion to page through an entity with dynamic auto-tuned batch sizing.
     */
    static async fetchEntityPagesRecursiveAutoTuned(entityName, token, startPosition = 1, currentBatchSize = 1000, accumulatedRecords = [], onChunkCallback = null, updatedSince = null) {
        const startTime = Date.now();
        
        let query = `SELECT * FROM ${entityName} STARTPOSITION ${startPosition} MAXRESULTS ${currentBatchSize}`;
        if (updatedSince) {
            query = `SELECT * FROM ${entityName} WHERE MetaData.LastUpdatedTime >= '${updatedSince}' STARTPOSITION ${startPosition} MAXRESULTS ${currentBatchSize}`;
        }

        const pageResult = await QuickBooksApiClient.executeWithRetryAndBackoff(() => 
            QuickBooksApiClient.executeQuery(query, token)
        );

        const elapsedTime = Date.now() - startTime;
        const records = pageResult?.QueryResponse?.[entityName] || [];
        const updatedAccumulated = accumulatedRecords.concat(records);

        if (typeof onChunkCallback === 'function' && records.length > 0) {
            onChunkCallback(entityName, records.length);
        }

        if (records.length < currentBatchSize) {
            return updatedAccumulated;
        }

        const targetMs = 800;
        const scaleFactor = elapsedTime > 0 ? targetMs / elapsedTime : 1.0;
        const nextBatchSize = Math.max(50, Math.min(1000, Math.floor(currentBatchSize * Math.min(Math.max(scaleFactor, 0.5), 2.0))));
        const nextPosition = startPosition + records.length;

        return QuickBooksSyncService.fetchEntityPagesRecursiveAutoTuned(
            entityName,
            token,
            nextPosition,
            nextBatchSize,
            updatedAccumulated,
            onChunkCallback,
            updatedSince
        );
    }

    /**
     * Single-Click Master Data Sync Engine.
     */
    static async pullMasterDataMultithreaded(companyId, tier, userId, onProgress = null, isIncremental = false) {
        if (!userId) return null;
        const customLogger = require('../../../config/logger');
        const { QuickBooksToken, Op } = QuickBooksSyncService._db();
        const maxAllowed = QuickBooksSyncService.getMaxConnections(tier);

        const rawTokens = companyId
            ? await QuickBooksToken.findAll({ where: { realm_id: companyId, user_id: userId } })
            : await QuickBooksToken.findAll({ where: { user_id: userId, status: { [Op.ne]: 'Disconnected' } }, order: [['updated_at', 'DESC']] });

        const tokens = rawTokens.slice(0, maxAllowed).map(t => ({
            platform:     'quickbooks',
            companyId:    t.realm_id,
            companyName:  t.company_name || 'QuickBooks Company',
            realm_id:     t.realm_id,
            lastSyncedAt: t.last_synced_at
        }));

        if (!tokens || tokens.length === 0) return null;

        const results = await tokens.reduce(async (companyAccPromise, token) => {
            const companyAcc = await companyAccPromise;
            
            const rawComp = await QuickBooksApiClient.executeQuery('SELECT * FROM CompanyInfo', token).catch(() => null);
            const comp = QuickBooksMapper.toCompanyInfo(rawComp);
            const companyList = comp ? [{ ...comp, id: token.companyId }] : [];
            const orgName = comp?.name || comp?.legalName || token.companyName;

            let totalFetchedSoFar = 0;
            customLogger.info({ realmId: token.companyId, orgName, isIncremental }, 'Starting Master Data Sync');

            if (typeof onProgress === 'function') {
                onProgress({ type: 'start', companyName: orgName, companyId: token.companyId });
            }

            const onChunk = (entityName, chunkSize) => {
                totalFetchedSoFar += chunkSize;
                customLogger.debug({ entityName, chunkSize, totalFetchedSoFar, realmId: token.companyId }, 'Fetched entity page chunk');
                if (typeof onProgress === 'function') {
                    onProgress({ type: 'progress', fetchedRecords: totalFetchedSoFar, currentEntity: entityName });
                }
            };

            const updatedSinceFilter = (isIncremental && token.lastSyncedAt)
                ? new Date(token.lastSyncedAt).toISOString()
                : null;

            const entityList = ['Account', 'Class', 'Department', 'Customer', 'Vendor'];
            
            const entityMap = await entityList.reduce(async (entityAccPromise, entityName) => {
                const entityAcc = await entityAccPromise;
                const records = await QuickBooksSyncService.fetchEntityPagesRecursiveAutoTuned(
                    entityName,
                    token,
                    1,
                    1000,
                    [],
                    onChunk,
                    updatedSinceFilter
                );
                entityAcc[entityName] = records;
                return entityAcc;
            }, Promise.resolve({}));

            const rawCust  = { QueryResponse: { Customer:   entityMap.Customer } };
            const rawVend  = { QueryResponse: { Vendor:     entityMap.Vendor } };
            const rawAcc   = { QueryResponse: { Account:    entityMap.Account } };
            const rawClass = { QueryResponse: { Class:      entityMap.Class } };
            const rawLoc   = { QueryResponse: { Department: entityMap.Department } };

            const tag = (list) => list.map(i => ({ ...i, clientId: orgName, clientName: orgName }));
            const isFirstSync = !token.lastSyncedAt;

            await QuickBooksToken.update(
                { last_synced_at: new Date(), status: 'Active' },
                { where: { realm_id: token.companyId } }
            );

            customLogger.info({ realmId: token.companyId, totalRecords: totalFetchedSoFar }, 'Master Data Sync Complete');

            companyAcc.push({
                company: companyList,
                customers: tag(QuickBooksMapper.toCustomerList(rawCust, token.lastSyncedAt)),
                vendors: tag(QuickBooksMapper.toVendorList(rawVend, token.lastSyncedAt)),
                accounts: tag(QuickBooksMapper.toAccountList(rawAcc, token.lastSyncedAt)),
                classes: tag(QuickBooksMapper.toClassList(rawClass, token.lastSyncedAt)),
                locations: tag(QuickBooksMapper.toLocationList(rawLoc, token.lastSyncedAt)),
                isFirstSync,
                isDone: true
            });

            return companyAcc;
        }, Promise.resolve([]));

        const aggregated = results.reduce((acc, curr) => ({
            company: [...acc.company, ...curr.company],
            customers: [...acc.customers, ...curr.customers],
            vendors: [...acc.vendors, ...curr.vendors],
            accounts: [...acc.accounts, ...curr.accounts],
            classes: [...acc.classes, ...curr.classes],
            locations: [...acc.locations, ...curr.locations],
            isFirstSync: acc.isFirstSync && curr.isFirstSync,
            isDone: true
        }), { company: [], customers: [], vendors: [], accounts: [], classes: [], locations: [], isFirstSync: true, isDone: true });

        return aggregated;
    }

    /**
     * Fetches every page of the 5 paginated entities for a SINGLE token.
     */
    static async _fetchAllPaginatedEntitiesForToken(token, pageSize = 10) {
        const entities = ['Customer', 'Vendor', 'Account', 'Class', 'Department'];
        const entityLabel = { Customer: 'Customers', Vendor: 'Vendors', Account: 'Accounts', Class: 'Classes', Department: 'Locations' };
        const recordsByEntity = { Customer: [], Vendor: [], Account: [], Class: [], Department: [] };
        let active = entities.slice();
        let startPosition = 1;
        let batchNumber = 0;

        while (active.length > 0) {
            batchNumber += 1;

            const pages = await Promise.all(active.map(entityName =>
                QuickBooksApiClient.queryPage(entityName, token, startPosition, pageSize)
            ));

            const stillActive = [];
            active.forEach((entityName, i) => {
                const { records, hasMore } = pages[i];
                recordsByEntity[entityName].push(...records);
                if (hasMore) stillActive.push(entityName);
            });
            active = stillActive;

            startPosition += pageSize;
        }

        return recordsByEntity;
    }

    /**
     * Fetches exactly ONE page for exactly ONE entity per call, walking SEQUENTIAL_ENTITY_ORDER.
     */
    static async _fetchOnePageForToken(token, priorCursor, pageSize = QuickBooksSyncService.PULL_PAGE_SIZE) {
        const entities = QuickBooksSyncService.SEQUENTIAL_ENTITY_ORDER;
        const safePriorCursor = priorCursor && typeof priorCursor === 'object' ? priorCursor : {};

        const recordsByEntity = { Customer: [], Vendor: [], Account: [], Class: [], Department: [] };
        const nextCursor = { ...safePriorCursor };

        const isEntityDone = (entityName) => !!(nextCursor[entityName] && nextCursor[entityName].done);

        for (const entityName of entities) {
            if (isEntityDone(entityName)) continue;

            const startPosition = (safePriorCursor[entityName] && safePriorCursor[entityName].position) || 1;

            const { records, hasMore } = await QuickBooksApiClient.queryPage(entityName, token, startPosition, pageSize);

            nextCursor[entityName] = {
                position: startPosition + pageSize,
                done: !hasMore
            };

            if (records.length === 0) {
                continue;
            }

            recordsByEntity[entityName] = records;

            return {
                recordsByEntity,
                cursor: nextCursor,
                isDone: entities.every(isEntityDone)
            };
        }

        return { recordsByEntity, cursor: nextCursor, isDone: true };
    }

    /**
     * Batched export engine extracted from controller.
     */
    static async exportMasterDataBatch(userId) {
        const BATCH_SIZE = 1000;
        const { tokens: allTokens, company, orgNameByTokenId } =
            await QuickBooksEntityService.getCompanyInfoAndOrgNames(userId)
                .catch(() => ({ tokens: [], company: null, orgNameByTokenId: new Map() }));

        let customersTokens = allTokens.slice();
        let vendorsTokens   = allTokens.slice();
        let accountsTokens  = allTokens.slice();
        let classesTokens   = allTokens.slice();
        let locationsTokens = allTokens.slice();

        const customers = [];
        const vendors   = [];
        const accounts  = [];
        const classes   = [];
        const locations = [];

        const dropExhausted = (list, exhaustedIds) =>
            list.filter(t => !exhaustedIds.has(t.companyId || t.realm_id));
        const allTokenIds = (list) => new Set(list.map(t => t.companyId || t.realm_id));
        const emptyPage = () => ({ records: [], exhaustedTokenIds: new Set() });

        let startPosition = 1;
        let batchCount = 0;
        const MAX_BATCHES = 100000;

        while (
            (customersTokens.length || vendorsTokens.length || accountsTokens.length ||
             classesTokens.length || locationsTokens.length) &&
            batchCount < MAX_BATCHES
        ) {
            batchCount += 1;

            const [customersResult, vendorsResult, accountsResult, classesResult, locationsResult] = await Promise.all([
                customersTokens.length
                    ? QuickBooksEntityService.getCustomersPage(customersTokens, startPosition, BATCH_SIZE, orgNameByTokenId)
                        .catch(() => ({ records: [], exhaustedTokenIds: allTokenIds(customersTokens) }))
                    : Promise.resolve(emptyPage()),
                vendorsTokens.length
                    ? QuickBooksEntityService.getVendorsPage(vendorsTokens, startPosition, BATCH_SIZE, orgNameByTokenId)
                        .catch(() => ({ records: [], exhaustedTokenIds: allTokenIds(vendorsTokens) }))
                    : Promise.resolve(emptyPage()),
                accountsTokens.length
                    ? QuickBooksEntityService.getAccountsPage(accountsTokens, startPosition, BATCH_SIZE, orgNameByTokenId)
                        .catch(() => ({ records: [], exhaustedTokenIds: allTokenIds(accountsTokens) }))
                    : Promise.resolve(emptyPage()),
                classesTokens.length
                    ? QuickBooksEntityService.getClassesPage(classesTokens, startPosition, BATCH_SIZE, orgNameByTokenId)
                        .catch(() => ({ records: [], exhaustedTokenIds: allTokenIds(classesTokens) }))
                    : Promise.resolve(emptyPage()),
                locationsTokens.length
                    ? QuickBooksEntityService.getLocationsPage(locationsTokens, startPosition, BATCH_SIZE, orgNameByTokenId)
                        .catch(() => ({ records: [], exhaustedTokenIds: allTokenIds(locationsTokens) }))
                    : Promise.resolve(emptyPage())
            ]);

            customers.push(...customersResult.records);
            vendors.push(...vendorsResult.records);
            accounts.push(...accountsResult.records);
            classes.push(...classesResult.records);
            locations.push(...locationsResult.records);

            customersTokens = dropExhausted(customersTokens, customersResult.exhaustedTokenIds);
            vendorsTokens   = dropExhausted(vendorsTokens, vendorsResult.exhaustedTokenIds);
            accountsTokens  = dropExhausted(accountsTokens, accountsResult.exhaustedTokenIds);
            classesTokens   = dropExhausted(classesTokens, classesResult.exhaustedTokenIds);
            locationsTokens = dropExhausted(locationsTokens, locationsResult.exhaustedTokenIds);

            startPosition += BATCH_SIZE;
        }

        return { company, customers, vendors, accounts, classes, locations };
    }
}

module.exports = QuickBooksSyncService;
