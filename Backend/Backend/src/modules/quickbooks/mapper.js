'use strict';

/**
 * QuickBooksMapper
 * -----------------------------------------------------------------
 * Transforms raw QuickBooks API payloads into clean, flat DTOs that
 * the rest of the application (Service, Controller, Frontend) can
 * consume without knowing anything about the external API shape.
 * -----------------------------------------------------------------
 */
class QuickBooksMapper {

    /**
     * Determine whether a QB record was created after the last successful
     * sync, using the standard QuickBooks MetaData.CreateTime timestamp.
     *
     * Returns false (never highlighted) when there is no prior sync to
     * compare against, or when either timestamp can't be parsed — a
     * first-ever pull has nothing to be "new" relative to.
     *
     * @param {object} raw - raw QB entity, expected to carry MetaData.CreateTime
     * @param {Date|string|null} [lastSyncedAt]
     * @returns {boolean}
     */
    static isNewRecord(raw, lastSyncedAt) {
        if (!lastSyncedAt) return false;

        const createTime = raw?.MetaData?.CreateTime;
        if (!createTime) return false;

        const created = new Date(createTime);
        const lastSync = new Date(lastSyncedAt);
        if (isNaN(created.getTime()) || isNaN(lastSync.getTime())) return false;

        return created.getTime() > lastSync.getTime();
    }

    /**
     * Determine whether a QB record already existed before the last sync
     * but was modified since, using MetaData.LastUpdatedTime.
     *
     * Records reported as "new" by isNewRecord are never also reported as
     * "updated" here — a record can't simultaneously be brand new and a
     * pre-existing one that changed.
     *
     * @param {object} raw - raw QB entity, expected to carry MetaData.LastUpdatedTime
     * @param {Date|string|null} [lastSyncedAt]
     * @returns {boolean}
     */
    static isUpdatedRecord(raw, lastSyncedAt) {
        if (!lastSyncedAt) return false;
        if (QuickBooksMapper.isNewRecord(raw, lastSyncedAt)) return false;

        const lastUpdatedTime = raw?.MetaData?.LastUpdatedTime;
        if (!lastUpdatedTime) return false;

        const updated = new Date(lastUpdatedTime);
        const lastSync = new Date(lastSyncedAt);
        if (isNaN(updated.getTime()) || isNaN(lastSync.getTime())) return false;

        return updated.getTime() > lastSync.getTime();
    }

    /**
     * Map a single raw QB Customer object -> clean CustomerDTO
     * @param {object} raw
     * @param {Date|string|null} [lastSyncedAt] - timestamp of the previous successful sync
     * @returns {{ id, name, companyName, email, balance, active, isNew, isUpdated }}
     */
    static toCustomerDTO(raw, lastSyncedAt) {
        return {
            id:          raw.Id          || '',
            name:        raw.DisplayName || raw.CompanyName || (raw.GivenName ? (raw.GivenName + ' ' + (raw.FamilyName || '')) : ''),
            companyName: raw.CompanyName || raw.DisplayName || '',
            email:       raw.PrimaryEmailAddr?.Address || '',
            balance:     raw.Balance     || 0,
            active:      raw.Active !== undefined ? (raw.Active ? "Active" : "Inactive") : "Active",
            isNew:       QuickBooksMapper.isNewRecord(raw, lastSyncedAt),
            isUpdated:   QuickBooksMapper.isUpdatedRecord(raw, lastSyncedAt)
        };
    }

    /**
     * Map a single raw QB Vendor object -> clean VendorDTO
     * @param {object} raw
     * @param {Date|string|null} [lastSyncedAt] - timestamp of the previous successful sync
     * @returns {{ id, name, companyName, email, balance, active, isNew, isUpdated }}
     */
    static toVendorDTO(raw, lastSyncedAt) {
        return {
            id:          raw.Id          || '',
            name:        raw.DisplayName || raw.CompanyName || (raw.GivenName ? (raw.GivenName + ' ' + (raw.FamilyName || '')) : ''),
            companyName: raw.CompanyName || raw.DisplayName || '',
            email:       raw.PrimaryEmailAddr?.Address || '',
            balance:     raw.Balance     || 0,
            active:      raw.Active !== undefined ? (raw.Active ? "Active" : "Inactive") : "Active",
            isNew:       QuickBooksMapper.isNewRecord(raw, lastSyncedAt),
            isUpdated:   QuickBooksMapper.isUpdatedRecord(raw, lastSyncedAt)
        };
    }

    /**
     * Map a single raw QB Account object -> clean AccountDTO
     * @param {object} raw
     * @returns {{ id, acctNum, name, accountType, accountSubType, classification, fullyQualifiedName, active, currentBalance }}
     */
    static toAccountDTO(raw, lastSyncedAt) {
        let classification = raw.Classification || '';
        if (!classification) {
            const type = (raw.AccountType || '').toUpperCase();
            if (['BANK', 'OTHER CURRENT ASSET', 'FIXED ASSET', 'OTHER ASSET', 'ACCOUNTS RECEIVABLE', 'ASSET'].some(t => type.includes(t))) {
                classification = 'Asset';
            } else if (['ACCOUNTS PAYABLE', 'CREDIT CARD', 'OTHER CURRENT LIABILITY', 'LONG TERM LIABILITY', 'LIABILITY'].some(t => type.includes(t))) {
                classification = 'Liability';
            } else if (['EQUITY'].some(t => type.includes(t))) {
                classification = 'Equity';
            } else if (['INCOME', 'OTHER INCOME', 'REVENUE'].some(t => type.includes(t))) {
                classification = 'Revenue';
            } else if (['EXPENSE', 'OTHER EXPENSE', 'COST OF GOODS SOLD'].some(t => type.includes(t))) {
                classification = 'Expense';
            } else {
                classification = raw.AccountType || '';
            }
        }

        return {
            id:                 raw.Id                 || '',
            acctNum:            raw.AcctNum            || '',
            name:               raw.Name               || '',
            accountType:        raw.AccountType        || '',
            accountSubType:     raw.AccountSubType     || '',
            classification:     classification,
            fullyQualifiedName: raw.FullyQualifiedName || raw.Name        || '',
            active:             raw.Active !== undefined ? (raw.Active ? "Active" : "Inactive") : "Active",
            currentBalance:     raw.CurrentBalance     || 0,
            isNew:              QuickBooksMapper.isNewRecord(raw, lastSyncedAt),
            isUpdated:          QuickBooksMapper.isUpdatedRecord(raw, lastSyncedAt)
        };
    }

    /**
     * Map a single raw QB Class object -> clean ClassDTO
     * @param {object} raw
     * @param {Date|string|null} [lastSyncedAt] - timestamp of the previous successful sync
     * @returns {{ id, name, active, isNew, isUpdated }}
     */
    static toClassDTO(raw, lastSyncedAt) {
        return {
            id:        raw.Id     || '',
            name:      raw.FullyQualifiedName || raw.Name || '',
            active:    raw.Active !== undefined ? (raw.Active ? "Active" : "Inactive") : "Active",
            isNew:     QuickBooksMapper.isNewRecord(raw, lastSyncedAt),
            isUpdated: QuickBooksMapper.isUpdatedRecord(raw, lastSyncedAt)
        };
    }

    /**
     * Map a single raw QB Department (Location) object -> clean LocationDTO
     * @param {object} raw
     * @param {Date|string|null} [lastSyncedAt] - timestamp of the previous successful sync
     * @returns {{ id, name, active, isNew, isUpdated }}
     */
    static toLocationDTO(raw, lastSyncedAt) {
        return {
            id:        raw.Id     || '',
            name:      raw.FullyQualifiedName || raw.Name || '',
            active:    raw.Active !== undefined ? (raw.Active ? "Active" : "Inactive") : "Active",
            isNew:     QuickBooksMapper.isNewRecord(raw, lastSyncedAt),
            isUpdated: QuickBooksMapper.isUpdatedRecord(raw, lastSyncedAt)
        };
    }

    /**
     * Map a single raw QB CompanyInfo object -> clean CompanyDTO
     * @param {object} raw
     * @returns {{ id, name, legalName }}
     */
    static toCompanyDTO(raw) {
        return {
            id:        raw.Id          || '',
            name:      raw.CompanyName || raw.LegalName || '',
            legalName: raw.LegalName   || raw.CompanyName || ''
        };
    }

    /**
     * Extract and map an array of customers from a QB QueryResponse
     * @param {object} apiResponse
     * @param {Date|string|null} [lastSyncedAt] - timestamp of the previous successful sync
     * @returns {CustomerDTO[]}
     */
    static toCustomerList(apiResponse, lastSyncedAt) {
        const raw = apiResponse?.QueryResponse?.Customer || [];
        return raw.map(item => QuickBooksMapper.toCustomerDTO(item, lastSyncedAt));
    }

    /**
     * Extract and map an array of vendors from a QB QueryResponse
     * @param {object} apiResponse
     * @param {Date|string|null} [lastSyncedAt] - timestamp of the previous successful sync
     * @returns {VendorDTO[]}
     */
    static toVendorList(apiResponse, lastSyncedAt) {
        const raw = apiResponse?.QueryResponse?.Vendor || [];
        return raw.map(item => QuickBooksMapper.toVendorDTO(item, lastSyncedAt));
    }

    /**
     * Extract and map an array of accounts from a QB QueryResponse
     * @param {object} apiResponse
     * @param {Date|string|null} [lastSyncedAt] - timestamp of the previous successful sync
     * @returns {AccountDTO[]}
     */
    static toAccountList(apiResponse, lastSyncedAt) {
        const raw = apiResponse?.QueryResponse?.Account || [];
        return raw.map(item => QuickBooksMapper.toAccountDTO(item, lastSyncedAt));
    }

    /**
     * Extract and map an array of classes from a QB QueryResponse
     * @param {object} apiResponse
     * @param {Date|string|null} [lastSyncedAt] - timestamp of the previous successful sync
     * @returns {ClassDTO[]}
     */
    static toClassList(apiResponse, lastSyncedAt) {
        const raw = apiResponse?.QueryResponse?.Class || apiResponse?.Class || [];
        const arr = Array.isArray(raw) ? raw : [raw];
        return arr.map(item => QuickBooksMapper.toClassDTO(item, lastSyncedAt));
    }

    /**
     * Extract and map an array of locations (departments) from a QB QueryResponse
     * @param {object} apiResponse
     * @param {Date|string|null} [lastSyncedAt] - timestamp of the previous successful sync
     * @returns {LocationDTO[]}
     */
    static toLocationList(apiResponse, lastSyncedAt) {
        const raw = apiResponse?.QueryResponse?.Department || apiResponse?.QueryResponse?.Location || apiResponse?.Department || apiResponse?.Location || [];
        const arr = Array.isArray(raw) ? raw : [raw];
        return arr.map(item => QuickBooksMapper.toLocationDTO(item, lastSyncedAt));
    }

    /**
     * Extract and map company info from a QB QueryResponse
     * @param {object} apiResponse
     * @returns {CompanyDTO|null}
     */
    static toCompanyInfo(apiResponse) {
        const raw = apiResponse?.QueryResponse?.CompanyInfo?.[0];
        return raw ? QuickBooksMapper.toCompanyDTO(raw) : null;
    }
}

module.exports = QuickBooksMapper;
