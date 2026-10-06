'use strict';

/**
 * XeroMapper
 * -----------------------------------------------------------------
 * Transforms raw Xero API payloads into clean, flat DTOs that
 * the rest of the application (Service, Controller, Frontend) can
 * consume without knowing anything about the external API shape.
 * -----------------------------------------------------------------
 */
class XeroMapper {

    /**
     * Parse a Xero timestamp into a JS Date.
     *
     * Xero's REST API returns UpdatedDateUTC either as a plain ISO string
     * (e.g. "2020-02-06T12:17:43.973Z") or, depending on endpoint/version,
     * the legacy .NET JSON date format (e.g. "/Date(1436315243123+0000)/").
     * This handles both.
     *
     * @param {string|null|undefined} value
     * @returns {Date|null}
     */
    static parseXeroDate(value) {
        if (!value) return null;

        const netMatch = /\/Date\((\d+)([+-]\d{4})?\)\//.exec(value);
        if (netMatch) {
            const parsed = new Date(parseInt(netMatch[1], 10));
            return isNaN(parsed.getTime()) ? null : parsed;
        }

        const parsed = new Date(value);
        return isNaN(parsed.getTime()) ? null : parsed;
    }

    /**
     * Determine whether a Xero record changed (was created or modified)
     * after the last successful sync, using the record's UpdatedDateUTC
     * timestamp.
     *
     * Xero's Contacts/Accounts endpoints don't expose a separate creation
     * timestamp, only UpdatedDateUTC — so unlike QuickBooks, we can't tell
     * whether a changed Xero record is brand-new or a pre-existing one
     * that was modified. Every record flagged here is reported via isNew;
     * isUpdated is always false for Xero DTOs (see toContactDTO/toAccountDTO).
     * Either way the caller treats "new or updated" identically (moved to
     * the bottom of the sheet, highlighted), so this doesn't change behavior.
     *
     * Returns false (never highlighted) when there is no prior sync to
     * compare against, or when either timestamp can't be parsed — a
     * first-ever pull has nothing to be "new" relative to.
     *
     * @param {object} raw - raw Xero entity, expected to carry UpdatedDateUTC
     * @param {Date|string|null} [lastSyncedAt]
     * @returns {boolean}
     */
    static isNewRecord(raw, lastSyncedAt) {
        if (!lastSyncedAt) return false;

        const updated = XeroMapper.parseXeroDate(raw?.UpdatedDateUTC);
        if (!updated) return false;

        const lastSync = new Date(lastSyncedAt);
        if (isNaN(lastSync.getTime())) return false;

        return updated.getTime() > lastSync.getTime();
    }

    /**
     * Map a single raw Xero Contact object -> clean ContactDTO
     * @param {object} raw - raw object from Xero Contacts array
     * @param {Date|string|null} [lastSyncedAt] - timestamp of the previous successful sync
     * @returns {{ id, name, email, phone, isCustomer, isSupplier, isNew, isUpdated }}
     */
    static toContactDTO(raw, lastSyncedAt) {
        const email = raw.EmailAddress || '';
        const phone = raw.Phones?.find(p => p.PhoneType === 'DEFAULT')?.PhoneNumber || '';
        return {
            id:         raw.ContactID    || '',
            name:       raw.Name         || '',
            email:      email,
            phone:      phone,
            isCustomer: raw.IsCustomer   || false,
            isSupplier: raw.IsSupplier   || false,
            isNew:      XeroMapper.isNewRecord(raw, lastSyncedAt),
            isUpdated:  false
        };
    }

    /**
     * Map a single raw Xero Account object -> clean AccountDTO
     * @param {object} raw - raw object from Xero Accounts array
     * @param {Date|string|null} [lastSyncedAt] - timestamp of the previous successful sync
     * @returns {{ id, code, name, type, status, active, description, classification, fullyQualifiedName, isNew, isUpdated }}
     */
    static toAccountDTO(raw, lastSyncedAt) {
        let classification = '';
        const type = (raw.Type || '').toUpperCase();
        if (['BANK', 'CURRENT', 'CURRLIAB', 'FIXED', 'INVENTORY', 'NONCURRENT', 'PREPAYMENT', 'TERMDIST'].some(t => type.includes(t)) || type.includes('ASSET')) {
            classification = 'Asset';
        } else if (['PAYABLE', 'LIABILITY', 'NONCURRENTLIAB'].some(t => type.includes(t)) || type.includes('LIAB')) {
            classification = 'Liability';
        } else if (['EQUITY'].some(t => type.includes(t))) {
            classification = 'Equity';
        } else if (['REVENUE', 'SALES', 'OTHERINCOME'].some(t => type.includes(t)) || type.includes('REV') || type.includes('INC')) {
            classification = 'Revenue';
        } else if (['EXPENSE', 'DIRECTCOSTS', 'OVERHEADS'].some(t => type.includes(t)) || type.includes('EXP') || type.includes('COST')) {
            classification = 'Expense';
        }

        return {
            id:                 raw.AccountID          || '',
            code:               raw.Code               || '',
            name:               raw.Name               || '',
            type:               raw.Type               || '',
            status:             raw.Status === 'ACTIVE' || raw.Status !== 'DELETED' ? 'Active' : 'Inactive',
            active:             raw.Status === 'ACTIVE' || raw.Status !== 'DELETED' ? 'Active' : 'Inactive',
            description:        raw.Description        || '',
            classification:     classification         || raw.Class || raw.Type || '',
            fullyQualifiedName: raw.Name                || '',
            isNew:              XeroMapper.isNewRecord(raw, lastSyncedAt),
            isUpdated:          false
        };
    }

    /**
     * Map a single raw Xero Tracking Category option -> clean ClassDTO / LocationDTO
     *
     * Tracking category options don't carry an UpdatedDateUTC (or any other
     * timestamp) in Xero's API, so there's no reliable way to tell whether
     * one was added or changed since the last sync — isNew/isUpdated are
     * always false here.
     *
     * @param {object} raw
     * @returns {{ id, name, active, isNew, isUpdated }}
     */
    static toTrackingOptionDTO(raw) {
        return {
            id:        raw.TrackingOptionID || raw.OptionID || '',
            name:      raw.Name             || '',
            active:    raw.Status === 'ACTIVE' || raw.Status !== 'DELETED' ? "Active" : "Inactive",
            isNew:     false,
            isUpdated: false
        };
    }

    /**
     * Map a single raw Xero Organisation object -> clean OrganisationDTO
     * @param {object} raw
     * @returns {{ id, name, legalName }}
     */
    static toOrganisationDTO(raw) {
        return {
            id:        raw.OrganisationID || '',
            name:      raw.Name           || raw.LegalName || '',
            legalName: raw.LegalName      || ''
        };
    }

    /**
     * Extract and map an array of contacts from a Xero API response
     * @param {object} apiResponse
     * @param {Date|string|null} [lastSyncedAt] - timestamp of the previous successful sync
     * @returns {ContactDTO[]}
     */
    static toContactList(apiResponse, lastSyncedAt) {
        const raw = apiResponse?.Contacts || [];
        return raw.map(item => XeroMapper.toContactDTO(item, lastSyncedAt));
    }

    /**
     * Extract and map an array of accounts from a Xero API response
     * @param {object} apiResponse
     * @param {Date|string|null} [lastSyncedAt] - timestamp of the previous successful sync
     * @returns {AccountDTO[]}
     */
    static toAccountList(apiResponse, lastSyncedAt) {
        const raw = apiResponse?.Accounts || [];
        return raw.map(item => XeroMapper.toAccountDTO(item, lastSyncedAt));
    }

    /**
     * Extract and map tracking categories into class or location lists
     * @param {object} apiResponse
     * @param {"class"|"location"} type
     * @param {Date|string|null} [lastSyncedAt] - timestamp of the previous successful sync (unused — see toTrackingOptionDTO)
     * @returns {Array}
     */
    static toTrackingList(apiResponse, type = "class", lastSyncedAt) {
        const categories = apiResponse?.TrackingCategories || [];
        return categories
            .filter(cat => {
                const catName = (cat.Name || '').toLowerCase();
                return type === 'location'
                    ? (catName.includes('location') || catName.includes('region') || catName.includes('department'))
                    : (!catName.includes('location') && !catName.includes('region'));
            })
            .flatMap(cat => (cat.Options || []).map(opt => XeroMapper.toTrackingOptionDTO(opt)));
    }

    /**
     * Extract and map organisation info from a Xero API response
     * @param {object} apiResponse
     * @returns {OrganisationDTO|null}
     */
    static toOrganisation(apiResponse) {
        const raw = apiResponse?.Organisations?.[0];
        return raw ? XeroMapper.toOrganisationDTO(raw) : null;
    }
}

module.exports = XeroMapper;
