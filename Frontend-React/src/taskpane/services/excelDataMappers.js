/**
 * Pure helpers that turn a master-data API response into flat Excel rows.
 *
 * No Excel API and no DOM access — shared by ExcelService (writing) and the
 * pull/refresh handlers (counting and flattening a fetched batch).
 */

/**
 * A record counts as "changed since the last sync" if it's either
 * newly added (isNew) or a pre-existing record that was modified
 * (isUpdated). Both are treated identically for display purposes:
 * moved to the bottom of the sheet and highlighted.
 * @param {{isNew?: boolean, isUpdated?: boolean}} item
 * @returns {boolean}
 */
function isChangedRecord(item) {
    return !!(item.isNew || item.isUpdated);
}

/**
 * Reorders a list so unchanged existing records keep their original
 * relative order and are written first (default background, same
 * position), with new-or-updated records appended after them —
 * also preserving their own relative order. Array.prototype.filter
 * preserves order, so changed records are never interleaved among
 * the unchanged ones.
 *
 * When nothing has changed, this is a no-op: the list comes back in
 * its original order and every row keeps the default background.
 *
 * @param {Array<{isNew?: boolean, isUpdated?: boolean}>} list
 * @returns {Array}
 */
function partitionExistingThenNew(list) {
    const unchanged = list.filter(item => !isChangedRecord(item));
    const changed = list.filter(item => isChangedRecord(item));
    return unchanged.concat(changed);
}

/**
 * Counts new-or-updated records across an entire Master Data Pull
 * response, used to enrich the "pull succeeded" status/notification
 * message with e.g. "3 new/updated records found".
 * @param {object} data - Master data payload (accounts/classes/locations/customers/vendors)
 * @returns {number}
 */
function countChangedMasterDataRecords(data) {
    if (!data) return 0;
    const sections = [data.accounts, data.classes, data.locations, data.customers, data.vendors];
    return sections.reduce((total, list) => {
        return Array.isArray(list) ? total + list.filter(isChangedRecord).length : total;
    }, 0);
}

/**
 * Counts strictly-new records (isNew only, not isUpdated) across a
 * Master Data Pull response. Used by the Refresh Schedule flow —
 * see ExcelService.appendNewMasterData — which only ever appends
 * brand-new records to the sheet and never touches previously
 * imported rows, so "new" here deliberately excludes "updated".
 * @param {object} data - Master data payload (accounts/classes/locations/customers/vendors)
 * @returns {number}
 */
function countNewMasterDataRecords(data) {
    if (!data) return 0;
    const sections = [data.accounts, data.classes, data.locations, data.customers, data.vendors];
    return sections.reduce((total, list) => {
        return Array.isArray(list) ? total + list.filter(item => !!item.isNew).length : total;
    }, 0);
}

/**
 * Total record count across a Master Data Pull response, regardless
 * of isNew/isUpdated. Used only for messaging on a first-sync
 * Refresh Schedule call (see ExcelService.appendNewMasterData) —
 * every record written there is "new" only in the trivial sense
 * that the sheet was empty before, so "N new records" would be a
 * confusing way to describe it; "N records imported" is clearer.
 * @param {object} data
 * @returns {number}
 */
function countAllMasterDataRecords(data) {
    if (!data) return 0;
    const sections = [data.accounts, data.classes, data.locations, data.customers, data.vendors];
    return sections.reduce((total, list) => (Array.isArray(list) ? total + list.length : total), 0);
}

/**
 * Flattens a Master Data Pull response into a single ordered queue of
 * strictly-new (isNew) records, each tagged with which section it
 * belongs to (account/class/location/customer/vendor) so a later
 * slice of this list can still be grouped and written to the right
 * columns — see ExcelService.appendManualBatch.
 *
 * @param {object} data - Master Data Pull response
 * @returns {{category: "account"|"class"|"location"|"customer"|"vendor", record: object}[]}
 */
function flattenChangedMasterDataRecords(data) {
    if (!data) return [];
    const tag = (list, category) =>
        Array.isArray(list) ? list.filter(r => r && r.isNew).map(record => ({ category, record })) : [];

    return [
        ...tag(data.accounts, "account"),
        ...tag(data.classes, "class"),
        ...tag(data.locations, "location"),
        ...tag(data.customers, "customer"),
        ...tag(data.vendors, "vendor")
    ];
}

/**
 * Flattens a Master Data Pull response into a single ordered queue of
 * EVERY record (not just isNew ones) — company/org entries first,
 * then accounts, classes, locations, customers, and vendors.
 *
 * @param {object} data - Master Data Pull response
 * @param {Object} [options]
 * @param {boolean} [options.includeCompany=true]
 * @returns {{category: "company"|"account"|"class"|"location"|"customer"|"vendor", record: object}[]}
 */
function flattenAllMasterDataRecords(data, options = {}) {
    if (!data) return [];
    const { includeCompany = true } = options;
    const tag = (list, category) =>
        Array.isArray(list) ? list.filter(Boolean).map(record => ({ category, record })) : [];
    const rawCompanies = Array.isArray(data.company) ? data.company : (data.company ? [data.company] : []);

    return [
        ...(includeCompany ? tag(rawCompanies, "company") : []),
        ...tag(data.accounts, "account"),
        ...tag(data.classes, "class"),
        ...tag(data.locations, "location"),
        ...tag(data.customers, "customer"),
        ...tag(data.vendors, "vendor")
    ];
}

export {
    isChangedRecord,
    partitionExistingThenNew,
    countChangedMasterDataRecords,
    countNewMasterDataRecords,
    countAllMasterDataRecords,
    flattenChangedMasterDataRecords,
    flattenAllMasterDataRecords
};
