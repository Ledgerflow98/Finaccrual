/**
 * Excel batch appender — delta appending and dynamic data range clearing.
 */
import { writeRowsInBatches } from "../batchDataLoader.js";

export const ExcelBatchAppender = {
  async clearMasterDataRange() {
    if (typeof Excel === "undefined") return;
    await Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getItemOrNullObject("1.Master_Data");
      sheet.load("isNullObject");
      await context.sync();
      if (sheet.isNullObject) return;

      const used = sheet.getUsedRangeOrNullObject();
      used.load("isNullObject");
      await context.sync();

      if (!used.isNullObject) {
        used.load("rowCount");
        await context.sync();
        if (used.rowCount > 1) {
          const clearRowCount = Math.max(used.rowCount, 500);
          sheet.getRange(`A2:AB${clearRowCount + 50}`).clear("All");
        } else {
          sheet.getRange("A2:AB100").clear("All");
        }
      } else {
        sheet.getRange("A2:AB100").clear("All");
      }
      await context.sync();
    });
  },

  async appendManualBatch(provider, batch) {
    if (!batch || batch.length === 0) return 0;
    if (typeof Excel === "undefined") {
      throw new Error("Excel API is not available in this environment.");
    }

    const fallbackOrgName = provider === "quickbooks" ? "QuickBooks Company" : "Xero Organisation";
    const orgGroupsMap = new Map();
    const getOrCreateGroup = (name) => {
      const cleanName = (name && name !== "Default" && name !== "Default Organization") ? name : fallbackOrgName;
      const key = cleanName.trim();
      if (!orgGroupsMap.has(key)) {
        orgGroupsMap.set(key, { name: cleanName, accounts: [], classes: [], locations: [], entities: [] });
      }
      return orgGroupsMap.get(key);
    };

    for (const { category, record } of batch) {
      if (!record) continue;
      if (category === "company") {
        getOrCreateGroup(record.name || fallbackOrgName);
        continue;
      }
      const orgKey = record.clientName || record.clientId || fallbackOrgName;
      if (category === "account") {
        getOrCreateGroup(orgKey).accounts.push(record);
      } else if (category === "class") {
        getOrCreateGroup(orgKey).classes.push(record);
      } else if (category === "location") {
        getOrCreateGroup(orgKey).locations.push(record);
      } else if (category === "customer") {
        getOrCreateGroup(orgKey).entities.push({
          name: record.name || record.DisplayName || record.Name || "",
          type: "Customer",
          id: record.id || record.Id || record.ContactID || "",
          status: record.active !== undefined ? (record.active ? "Active" : "Inactive") : "Active"
        });
      } else if (category === "vendor") {
        getOrCreateGroup(orgKey).entities.push({
          name: record.name || record.DisplayName || record.Name || "",
          type: "Vendor",
          id: record.id || record.Id || record.ContactID || "",
          status: record.active !== undefined ? (record.active ? "Active" : "Inactive") : "Active"
        });
      }
    }

    let actualWrittenCount = 0;

    await Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getItem("1.Master_Data");
      const BLOCKS = {
        company:   { first: "A", last: "B" },
        accounts:  { first: "D", last: "L" },
        classes:   { first: "N", last: "Q" },
        locations: { first: "S", last: "V" },
        entities:  { first: "X", last: "AB" }
      };

      const overallUsed = sheet.getUsedRangeOrNullObject();
      overallUsed.load("isNullObject");
      await context.sync();
      let scanLimit = 2000;
      if (!overallUsed.isNullObject) {
        overallUsed.load("rowCount");
        await context.sync();
        if (overallUsed.rowCount > 1) {
          scanLimit = Math.max(overallUsed.rowCount + 500, 2000);
        }
      }

      const existingOrgColumn = sheet.getRange(`A2:A${scanLimit}`);
      existingOrgColumn.load("values");

      const existingAccountsIdRange = sheet.getRange(`L2:L${scanLimit}`);
      const existingClassesIdRange = sheet.getRange(`P2:P${scanLimit}`);
      const existingLocationsIdRange = sheet.getRange(`U2:U${scanLimit}`);
      const existingEntitiesIdRange = sheet.getRange(`AA2:AA${scanLimit}`);

      existingAccountsIdRange.load("values");
      existingClassesIdRange.load("values");
      existingLocationsIdRange.load("values");
      existingEntitiesIdRange.load("values");

      await context.sync();

      const extractIds = (range) => new Set(
        (range.values || [])
          .map((row) => (row && row[0] != null ? String(row[0]).trim() : ""))
          .filter(Boolean)
      );

      const seenAccountIds = extractIds(existingAccountsIdRange);
      const seenClassIds = extractIds(existingClassesIdRange);
      const seenLocationIds = extractIds(existingLocationsIdRange);
      const seenEntityIds = extractIds(existingEntitiesIdRange);

      const findNextRow = (range) => {
        const rows = range.values || [];
        for (let i = rows.length - 1; i >= 0; i--) {
          const val = rows[i] ? rows[i][0] : null;
          if (val !== null && val !== undefined && String(val).trim() !== "") {
            return i + 2 + 1;
          }
        }
        return 2;
      };

      const rowFor = {
        company: findNextRow(existingOrgColumn),
        accounts: findNextRow(existingAccountsIdRange),
        classes: findNextRow(existingClassesIdRange),
        locations: findNextRow(existingLocationsIdRange),
        entities: findNextRow(existingEntitiesIdRange)
      };

      const seenOrgNames = new Set(
        (existingOrgColumn.values || [])
          .map((row) => (row && row[0] != null ? String(row[0]).trim() : ""))
          .filter(Boolean)
      );

      let totalWrittenRecords = 0;

      const writeBlock = async (key, values) => {
        if (!values.length) return;
        const { first, last } = BLOCKS[key];
        const startRow = rowFor[key];

        const sanitized = values.map((row) =>
          row.map((cell) => (cell == null ? "" : cell))
        );

        await writeRowsInBatches(context, sheet, first, last, startRow, sanitized, sanitized.map(() => false));

        const written = sheet.getRange(`${first}${startRow}:${last}${startRow + values.length - 1}`);
        written.format.font.size = 11;
        written.format.wrapText = true;

        rowFor[key] = startRow + values.length;
        if (key !== "company") {
          totalWrittenRecords += values.length;
        }
      };

      for (const [, group] of orgGroupsMap) {
        const orgName = group.name;

        if (!seenOrgNames.has(orgName.trim())) {
          await writeBlock("company", [[orgName, orgName]]);
          seenOrgNames.add(orgName.trim());
        }

        const newAccounts = group.accounts.filter((a) => {
          const id = String(a.id || a.Id || a.AccountID || "").trim();
          if (!id) return true;
          if (seenAccountIds.has(id)) return false;
          seenAccountIds.add(id);
          return true;
        });

        await writeBlock("accounts", newAccounts.map((a) => [
          orgName,
          a.acctNum || a.code || a.AcctNum || a.Code || "",
          a.name || a.Name || "",
          a.accountType || a.type || a.AccountType || a.Type || "",
          a.accountSubType || a.description || a.AccountSubType || "",
          a.classification || a.Classification || "",
          a.fullyQualifiedName || a.name || a.Name || "",
          a.active !== undefined ? (a.active ? "Active" : "Inactive") : "Active",
          a.id || a.Id || a.AccountID || ""
        ]));

        const newClasses = group.classes.filter((c) => {
          const id = String(c.id || c.Id || "").trim();
          if (!id) return true;
          if (seenClassIds.has(id)) return false;
          seenClassIds.add(id);
          return true;
        });

        await writeBlock("classes", newClasses.map((c) => [
          orgName,
          c.name || c.Name || "",
          c.id || c.Id || "",
          c.active !== undefined ? (c.active ? "Active" : "Inactive") : "Active"
        ]));

        const newLocations = group.locations.filter((l) => {
          const id = String(l.id || l.Id || "").trim();
          if (!id) return true;
          if (seenLocationIds.has(id)) return false;
          seenLocationIds.add(id);
          return true;
        });

        await writeBlock("locations", newLocations.map((l) => [
          orgName,
          l.name || l.Name || "",
          l.id || l.Id || "",
          l.active !== undefined ? (l.active ? "Active" : "Inactive") : "Active"
        ]));

        const newEntities = group.entities.filter((e) => {
          const id = String(e.id || "").trim();
          if (!id) return true;
          if (seenEntityIds.has(id)) return false;
          seenEntityIds.add(id);
          return true;
        });

        await writeBlock("entities", newEntities.map((e) => [
          orgName, e.name, e.type, e.id, e.status
        ]));
      }

      sheet.getRange("A1:AB1").format.columnWidth = 115;
      await context.sync();

      // Capture the actual count written before Excel.run context closes
      actualWrittenCount = totalWrittenRecords;
    });

    return actualWrittenCount;
  }
};
