/**
 * Excel JS API layer — workbook, worksheet, range and formatting operations.
 *
 * Delegates sheet setup and formatting to excelSheetSetup.js
 * and batch appending/clearing to excelBatchAppender.js.
 */
import { writeRowsInBatches } from "../batchDataLoader.js";
import {
  isChangedRecord,
  partitionExistingThenNew,
  countAllMasterDataRecords,
  flattenChangedMasterDataRecords
} from "./excelDataMappers.js";
import { ExcelSheetSetup } from "./excelSheetSetup.js";
import { ExcelBatchAppender } from "./excelBatchAppender.js";

const ExcelService = {
  /**
   * Populates Excel workbook sheet "1.Master_Data" with ERP payload.
   * @param {string} provider - Active ERP provider
   * @param {object} data - Master data payload
   */
  async writeMasterData(provider, data) {
    if (typeof Excel === "undefined") {
      throw new Error("Excel API is not available in this environment.");
    }
    await Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getItem("1.Master_Data");
      const usedRange = sheet.getUsedRangeOrNullObject();
      usedRange.load("isNullObject");
      await context.sync();

      if (!usedRange.isNullObject) {
        usedRange.load("rowCount");
        await context.sync();
        if (usedRange.rowCount > 1) {
          const clearRowCount = Math.max(usedRange.rowCount, 500);
          sheet.getRange(`A2:AB${clearRowCount + 50}`).clear("All");
        } else {
          sheet.getRange("A2:AB100").clear("All");
        }
      } else {
        sheet.getRange("A2:AB100").clear("All");
      }

      const orgGroupsMap = new Map();
      const fallbackOrgName = provider === "quickbooks" ? "QuickBooks Company" : "Xero Organisation";

      const getOrCreateGroup = (id, name) => {
        const cleanName = (name && name !== "Default" && name !== "Default Organization") ? name : fallbackOrgName;
        const key = cleanName.trim();

        if (!orgGroupsMap.has(key)) {
          orgGroupsMap.set(key, {
            id: cleanName,
            name: cleanName,
            accounts: [],
            classes: [],
            locations: [],
            entities: []
          });
        }
        return orgGroupsMap.get(key);
      };

      const rawCompanies = Array.isArray(data.company)
        ? data.company
        : (data.company ? [data.company] : []);

      for (const c of rawCompanies) {
        if (c) getOrCreateGroup(c.name || c.id, c.name);
      }

      if (data.accounts) {
        for (const a of data.accounts) {
          const nameKey = a.clientName || a.clientId || fallbackOrgName;
          const group = getOrCreateGroup(a.clientId, nameKey);
          group.accounts.push(a);
        }
      }

      if (data.classes) {
        for (const c of data.classes) {
          const nameKey = c.clientName || c.clientId || fallbackOrgName;
          const group = getOrCreateGroup(c.clientId, nameKey);
          group.classes.push(c);
        }
      }

      if (data.locations) {
        for (const l of data.locations) {
          const nameKey = l.clientName || l.clientId || fallbackOrgName;
          const group = getOrCreateGroup(l.clientId, nameKey);
          group.locations.push(l);
        }
      }

      if (data.customers) {
        for (const cust of data.customers) {
          const nameKey = cust.clientName || cust.clientId || fallbackOrgName;
          const group = getOrCreateGroup(cust.clientId, nameKey);
          group.entities.push({
            clientId: nameKey,
            name: cust.name || cust.DisplayName || cust.Name || "",
            type: "Customer",
            id: cust.id || cust.Id || cust.ContactID || "",
            status: cust.active !== undefined ? (cust.active ? "Active" : "Inactive") : "Active",
            isNew: !!cust.isNew,
            isUpdated: !!cust.isUpdated
          });
        }
      }

      if (data.vendors) {
        for (const vend of data.vendors) {
          const nameKey = vend.clientName || vend.clientId || fallbackOrgName;
          const group = getOrCreateGroup(vend.clientId, nameKey);
          group.entities.push({
            clientId: nameKey,
            name: vend.name || vend.DisplayName || vend.Name || "",
            type: "Vendor",
            id: vend.id || vend.Id || vend.ContactID || "",
            status: vend.active !== undefined ? (vend.active ? "Active" : "Inactive") : "Active",
            isNew: !!vend.isNew,
            isUpdated: !!vend.isUpdated
          });
        }
      }

      let currentRow = 2;

      for (const [key, group] of orgGroupsMap) {
        const orgName = group.name;
        const accCount = group.accounts.length;
        const classCount = group.classes.length;
        const locCount = group.locations.length;
        const entityCount = group.entities.length;
        const maxRows = Math.max(1, accCount, classCount, locCount, entityCount);

        sheet.getRange(`A${currentRow}:B${currentRow}`).values = [[orgName, orgName]];

        if (accCount > 0) {
          const orderedAccounts = partitionExistingThenNew(group.accounts);
          const accValues = orderedAccounts.map((a) => [
            orgName,
            a.acctNum || a.code || a.AcctNum || a.Code || "",
            a.name || a.Name || "",
            a.accountType || a.type || a.AccountType || a.Type || "",
            a.accountSubType || a.description || a.AccountSubType || "",
            a.classification || a.Classification || "",
            a.fullyQualifiedName || a.name || a.Name || "",
            a.active !== undefined ? (a.active ? "Active" : "Inactive") : "Active",
            a.id || a.Id || a.AccountID || ""
          ]);
          const accHighlightFlags = orderedAccounts.map(isChangedRecord);
          await writeRowsInBatches(context, sheet, "D", "L", currentRow, accValues, accHighlightFlags);
        }

        if (classCount > 0) {
          const orderedClasses = partitionExistingThenNew(group.classes);
          const classValues = orderedClasses.map((c) => [
            orgName,
            c.name || c.Name || "",
            c.id || c.Id || "",
            c.active !== undefined ? (c.active ? "Active" : "Inactive") : "Active"
          ]);
          const classHighlightFlags = orderedClasses.map(isChangedRecord);
          await writeRowsInBatches(context, sheet, "N", "Q", currentRow, classValues, classHighlightFlags);
        }

        if (locCount > 0) {
          const orderedLocations = partitionExistingThenNew(group.locations);
          const locValues = orderedLocations.map((l) => [
            orgName,
            l.name || l.Name || "",
            l.id || l.Id || "",
            l.active !== undefined ? (l.active ? "Active" : "Inactive") : "Active"
          ]);
          const locHighlightFlags = orderedLocations.map(isChangedRecord);
          await writeRowsInBatches(context, sheet, "S", "V", currentRow, locValues, locHighlightFlags);
        }

        if (entityCount > 0) {
          const orderedEntities = partitionExistingThenNew(group.entities);
          const entityValues = orderedEntities.map((e) => [
            orgName,
            e.name,
            e.type,
            e.id,
            e.status
          ]);
          const entityHighlightFlags = orderedEntities.map(isChangedRecord);
          await writeRowsInBatches(context, sheet, "X", "AB", currentRow, entityValues, entityHighlightFlags);
        }

        currentRow += maxRows + 2;
      }

      const formatEndRow = Math.max(currentRow, 50);
      const dataRange = sheet.getRange(`A2:AB${formatEndRow}`);
      dataRange.format.font.size = 11;
      dataRange.format.wrapText = true;
      sheet.getRange("A1:AB1").format.columnWidth = 115;

      await context.sync();
    });
  },

  async appendNewMasterData(provider, data) {
    if (!data) return 0;
    if (data.isFirstSync) {
      await ExcelService.writeMasterData(provider, data);
      return countAllMasterDataRecords(data);
    }
    const flatQueue = flattenChangedMasterDataRecords(data);
    if (flatQueue.length === 0) return 0;
    await ExcelService.appendManualBatch(provider, flatQueue);
    return flatQueue.length;
  },

  // Delegates to ExcelBatchAppender
  async appendManualBatch(provider, batch) {
    return ExcelBatchAppender.appendManualBatch(provider, batch);
  },

  async clearMasterDataRange() {
    return ExcelBatchAppender.clearMasterDataRange();
  },

  // Delegates to ExcelSheetSetup
  async clearMasterData() {
    return ExcelSheetSetup.clearMasterData();
  },

  async stampLastRefreshed(timestamp) {
    return ExcelSheetSetup.stampLastRefreshed(timestamp);
  },

  async setupWorkbookSheets(provider) {
    return ExcelSheetSetup.setupWorkbookSheets(provider);
  },

  async checkWorkbookStatus() {
    return ExcelSheetSetup.checkWorkbookStatus();
  }
};

export { ExcelService };
