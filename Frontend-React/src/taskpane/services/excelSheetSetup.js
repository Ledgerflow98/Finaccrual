/**
 * Excel sheet setup, scaffolding, header styling, and cleanup operations.
 */

export const ExcelSheetSetup = {
  /**
   * Scaffolds required sheets (1.Master_Data and 2.Input) and styles the header rows across 5 colored sections.
   * @param {string} provider - Active ERP provider
   */
  async setupWorkbookSheets(provider) {
    if (typeof Excel === "undefined") {
      throw new Error("Excel API is not available in this environment.");
    }
    await Excel.run(async (context) => {
      let masterSheet = context.workbook.worksheets.getItemOrNullObject("1.Master_Data");
      let inputSheet = context.workbook.worksheets.getItemOrNullObject("2.Input");
      masterSheet.load("isNullObject");
      inputSheet.load("isNullObject");
      await context.sync();

      if (masterSheet.isNullObject) masterSheet = context.workbook.worksheets.add("1.Master_Data");
      if (inputSheet.isNullObject) inputSheet = context.workbook.worksheets.add("2.Input");

      masterSheet.activate();
      await context.sync();

      const idLabel = (provider || "").toLowerCase() === "quickbooks" ? "QBO" : "Xero";

      const headerRange = masterSheet.getRange("A1:AB1");
      const headers = [
        [
          "Client ID", "Client Name", "",
          "Client ID", "Account Code", "Account Name", "Account Type", "Account Sub-Type", "Classification", "Fully Qualified Name", "Status", `${idLabel} Account Id`, "",
          "Client ID", "Class Name", `${idLabel} Class Id`, "Status", "",
          "Client ID", "Location Name", `${idLabel} Location Id`, "Status", "",
          "Client ID", "Entity Name", "Entity Type", `${idLabel} Entity Id`, "Status"
        ]
      ];

      headerRange.clear();
      headerRange.values = headers;

      // Format Navy Blue Section 1 Header Range (A1:B1)
      const purpleRange1 = masterSheet.getRange("A1:B1");
      purpleRange1.format.fill.color = "#1B224C";
      purpleRange1.format.font.color = "white";
      purpleRange1.format.font.bold = true;
      purpleRange1.format.horizontalAlignment = "Center";
      purpleRange1.format.verticalAlignment = "Center";
      purpleRange1.format.borders.getItem("EdgeBottom").style = Excel.BorderLineStyle.Continuous;

      // Format Navy Blue Section 2 Header Range (D1:L1)
      const blueRange2 = masterSheet.getRange("D1:L1");
      blueRange2.format.fill.color = "#1F4E79";
      blueRange2.format.font.color = "white";
      blueRange2.format.font.bold = true;
      blueRange2.format.horizontalAlignment = "Center";
      blueRange2.format.verticalAlignment = "Center";
      blueRange2.format.borders.getItem("EdgeBottom").style = Excel.BorderLineStyle.Continuous;

      // Format Green Section 3 & 4 Header Ranges (N1:Q1, S1:V1)
      const greenRanges = ["N1:Q1", "S1:V1"];
      for (const range of greenRanges) {
        const r = masterSheet.getRange(range);
        r.format.fill.color = "#0F7546";
        r.format.font.color = "white";
        r.format.font.bold = true;
        r.format.horizontalAlignment = "Center";
        r.format.verticalAlignment = "Center";
        r.format.borders.getItem("EdgeBottom").style = Excel.BorderLineStyle.Continuous;
      }

      // Format Dark Blue Section 5 Header Range (X1:AB1)
      const purpleRange5 = masterSheet.getRange("X1:AB1");
      purpleRange5.format.fill.color = "#1B224C";
      purpleRange5.format.font.color = "white";
      purpleRange5.format.font.bold = true;
      purpleRange5.format.horizontalAlignment = "Center";
      purpleRange5.format.verticalAlignment = "Center";
      purpleRange5.format.borders.getItem("EdgeBottom").style = Excel.BorderLineStyle.Continuous;

      // Configure spacer columns - clear formats
      const spacers = ["C:C", "M:M", "R:R", "W:W"];
      for (const spacer of spacers) {
        const col = masterSheet.getRange(spacer);
        col.clear("Formats");
      }

      headerRange.format.rowHeight = 28;
      headerRange.format.font.size = 11;
      headerRange.format.wrapText = true;
      masterSheet.getRange("A1:AB1").format.columnWidth = 115;

      masterSheet.freezePanes.unfreeze();
      masterSheet.getRange("A2").select();

      await context.sync();
    });
  },

  async clearMasterData() {
    if (typeof Excel === "undefined") return;
    await Excel.run(async (context) => {
      const masterSheet = context.workbook.worksheets.getItemOrNullObject("1.Master_Data");
      const inputSheet = context.workbook.worksheets.getItemOrNullObject("2.Input");
      masterSheet.load("isNullObject");
      inputSheet.load("isNullObject");
      const sheets = context.workbook.worksheets;
      sheets.load("items/name");
      await context.sync();

      if (!masterSheet.isNullObject) {
        try { masterSheet.getRange().clear("All"); } catch (_) {}
      }
      if (!inputSheet.isNullObject) {
        try { inputSheet.getRange().clear("All"); } catch (_) {}
      }
      await context.sync();

      const existingNames = new Set(sheets.items.map((s) => s.name));
      let fallbackSheet = sheets.items.find((s) => s.name !== "1.Master_Data" && s.name !== "2.Input");

      if (!fallbackSheet) {
        let newName = "Sheet1";
        let counter = 1;
        while (existingNames.has(newName)) {
          newName = `Sheet${++counter}`;
        }
        fallbackSheet = context.workbook.worksheets.add(newName);
      }

      fallbackSheet.activate();
      await context.sync();

      if (!masterSheet.isNullObject) {
        try { masterSheet.delete(); } catch (_) {}
      }
      if (!inputSheet.isNullObject) {
        try { inputSheet.delete(); } catch (_) {}
      }
      await context.sync();
    });
  },

  async stampLastRefreshed(timestamp) {
    if (typeof Excel === "undefined") return;
    await Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getItemOrNullObject("1.Master_Data");
      sheet.load("isNullObject");
      await context.sync();
      if (sheet.isNullObject) return;

      const cell = sheet.getRange("AC1");
      cell.values = [[`Last Refreshed: ${timestamp}`]];
      cell.format.font.bold = true;
      cell.format.font.size = 10;
      cell.format.font.color = "#475569";
      cell.format.fill.color = "#F1F5F9";
      cell.format.horizontalAlignment = "Center";
      cell.format.verticalAlignment = "Center";
      sheet.getRange("AC:AC").format.columnWidth = 140;
      await context.sync();
    });
  },

  async checkWorkbookStatus() {
    if (typeof Excel === "undefined") {
      return { isExcelAvailable: false, hasSheets: false, hasData: false };
    }
    try {
      return await Excel.run(async (context) => {
        const masterSheet = context.workbook.worksheets.getItemOrNullObject("1.Master_Data");
        const inputSheet = context.workbook.worksheets.getItemOrNullObject("2.Input");
        masterSheet.load("isNullObject");
        inputSheet.load("isNullObject");
        await context.sync();

        if (masterSheet.isNullObject || inputSheet.isNullObject) {
          return { isExcelAvailable: true, hasSheets: false, hasData: false };
        }

        const usedRange = masterSheet.getUsedRangeOrNullObject();
        usedRange.load("isNullObject, rowCount");
        await context.sync();

        const hasData = !usedRange.isNullObject && usedRange.rowCount > 1;
        return { isExcelAvailable: true, hasSheets: true, hasData };
      });
    } catch (_) {
      return { isExcelAvailable: false, hasSheets: false, hasData: false };
    }
  }
};
