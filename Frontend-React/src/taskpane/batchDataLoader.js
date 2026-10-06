const DEFAULT_BATCH_SIZE = 100;
const DEFAULT_WRITE_BATCH_SIZE = 20;

export const MANUAL_REFRESH_BATCH_SIZE = 100;
const NEW_RECORD_FILL_COLOR = "#D9D9D9";

function applyNewRecordHighlighting(sheet, startColumn, endColumn, batchStartRow, flags) {
  let i = 0;
  while (i < flags.length) {
    const flagValue = !!flags[i];
    let j = i;
    while (j < flags.length && !!flags[j] === flagValue) j++;

    const rangeStartRow = batchStartRow + i;
    const rangeEndRow = batchStartRow + j - 1;
    const range = sheet.getRange(`${startColumn}${rangeStartRow}:${endColumn}${rangeEndRow}`);

    if (flagValue) {
      range.format.fill.color = NEW_RECORD_FILL_COLOR;
    } else {
      range.format.fill.clear();
    }

    i = j;
  }
}

export async function writeRowsInBatches(
  context,
  sheet,
  startColumn,
  endColumn,
  startRow,
  rows,
  isNewFlags = null,
  batchSize = DEFAULT_WRITE_BATCH_SIZE
) {
  if (!rows || rows.length === 0) return;

  let offset = 0;
  while (offset < rows.length) {
    const batchData = rows.slice(offset, offset + batchSize);
    const batchStartRow = startRow + offset;
    const batchEndRow = batchStartRow + batchData.length - 1;

    try {
      const range = sheet.getRange(`${startColumn}${batchStartRow}:${endColumn}${batchEndRow}`);
      range.values = batchData;

      if (Array.isArray(isNewFlags)) {
        applyNewRecordHighlighting(
          sheet,
          startColumn,
          endColumn,
          batchStartRow,
          isNewFlags.slice(offset, offset + batchData.length)
        );
      }

      await context.sync();
    } catch (error) {
      throw new Error(
        `writeRowsInBatches: failed writing rows ${batchStartRow}-${batchEndRow} to ${startColumn}:${endColumn}: ${error.message || error}`
      );
    }

    offset += batchSize;
  }
}

export async function fetchAllInBatches(fetchBatch, options = {}) {
  const { batchSize = DEFAULT_BATCH_SIZE } = options;

  if (typeof fetchBatch !== "function") {
    throw new Error("fetchAllInBatches: fetchBatch must be a function.");
  }
  if (!Number.isInteger(batchSize) || batchSize <= 0) {
    throw new Error("fetchAllInBatches: batchSize must be a positive integer.");
  }

  const allData = [];
  let offset = 0;

  while (true) {
    let batchData;
    try {
      batchData = await fetchBatch(offset, batchSize);
    } catch (error) {
      throw new Error(`fetchAllInBatches: failed fetching batch at offset ${offset}: ${error.message || error}`);
    }

    if (!Array.isArray(batchData)) {
      throw new Error("fetchAllInBatches: fetchBatch must resolve to an array.");
    }

    if (batchData.length === 0) {
      break;
    }

    allData.push(...batchData);
    offset += batchData.length;
  }

  return allData;
}

export async function readNextBatchFromWorksheet(context, sheet, offset, batchSize, config = {}) {
  const { startRow = 1, startColumn = 0 } = config;
  let { columnCount } = config;

  if (columnCount === undefined) {
    const usedRange = sheet.getUsedRangeOrNullObject();
    usedRange.load("columnCount");
    await context.sync();
    columnCount = usedRange.isNullObject ? 1 : usedRange.columnCount;
  }

  const absoluteRow = startRow + offset;

  let range;
  try {
    range = sheet.getRangeByIndexes(absoluteRow, startColumn, batchSize, columnCount);
    range.load("values");
    await context.sync();
  } catch (error) {
    throw new Error(
      `readNextBatchFromWorksheet: failed reading rows at offset ${offset}: ${error.message || error}`
    );
  }

  return trimTrailingEmptyRows(range.values);
}

function isRowEmpty(row) {
  return row.every((cell) => cell === "" || cell === null || cell === undefined);
}

function trimTrailingEmptyRows(rows) {
  let end = rows.length;
  while (end > 0 && isRowEmpty(rows[end - 1])) {
    end -= 1;
  }
  return rows.slice(0, end);
}

export async function loadAllWorksheetDataInBatches(options = {}) {
  const { sheetName, batchSize = DEFAULT_BATCH_SIZE, startRow = 1, onComplete } = options;

  if (typeof onComplete !== "function") {
    throw new Error("loadAllWorksheetDataInBatches: options.onComplete must be a function.");
  }

  let allData = [];

  try {
    await Excel.run(async (context) => {
      const sheet = sheetName
        ? context.workbook.worksheets.getItem(sheetName)
        : context.workbook.worksheets.getActiveWorksheet();

      allData = await fetchAllInBatches(
        (offset, size) => readNextBatchFromWorksheet(context, sheet, offset, size, { startRow }),
        { batchSize }
      );
    });
  } catch (error) {
    if (typeof OfficeExtension !== "undefined" && error instanceof OfficeExtension.Error) {
      console.error("Excel API error:", error.code, error.message, error.debugInfo);
    } else {
      console.error("loadAllWorksheetDataInBatches failed:", error);
    }
    throw error;
  }

  await onComplete(allData);

  return allData.length;
}

export async function writeAllDataToExcelOnce(context, sheet, allData, config = {}) {
  if (!allData || allData.length === 0) return;

  const { startRow = 1, startColumn = 0 } = config;
  const columnCount = allData[0].length;

  try {
    const range = sheet.getRangeByIndexes(startRow, startColumn, allData.length, columnCount);
    range.values = allData;
    await context.sync();
  } catch (error) {
    throw new Error(`writeAllDataToExcelOnce: failed writing ${allData.length} row(s): ${error.message || error}`);
  }
}

export async function fetchAllRecordsAndWriteToExcel(options = {}) {
  const { fetchBatch, sheetName, batchSize = DEFAULT_BATCH_SIZE, startRow = 1, startColumn = 0 } = options;

  if (typeof fetchBatch !== "function") {
    throw new Error("fetchAllRecordsAndWriteToExcel: options.fetchBatch must be a function.");
  }

  const allData = await fetchAllInBatches(fetchBatch, { batchSize });

  try {
    await Excel.run(async (context) => {
      const sheet = sheetName
        ? context.workbook.worksheets.getItem(sheetName)
        : context.workbook.worksheets.getActiveWorksheet();

      await writeAllDataToExcelOnce(context, sheet, allData, { startRow, startColumn });
    });
  } catch (error) {
    if (typeof OfficeExtension !== "undefined" && error instanceof OfficeExtension.Error) {
      console.error("Excel API error:", error.code, error.message, error.debugInfo);
    } else {
      console.error("fetchAllRecordsAndWriteToExcel failed:", error);
    }
    throw error;
  }

  return allData.length;
}

const MANUAL_QUEUE_STORAGE_KEY = "fa_manual_batch_queue";

function manualQueueKey(provider, companyId) {
  return `${provider || "unknown"}::${companyId || "unknown"}`;
}

function loadAllManualQueues() {
  try {
    const raw = localStorage.getItem(MANUAL_QUEUE_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch (_) {
    return {};
  }
}

function saveAllManualQueues(all) {
  try {
    localStorage.setItem(MANUAL_QUEUE_STORAGE_KEY, JSON.stringify(all));
  } catch (_) {}
}

export function getManualBatchQueue(provider, companyId) {
  const all = loadAllManualQueues();
  return all[manualQueueKey(provider, companyId)] || null;
}

export function setManualBatchQueue(provider, companyId, queue) {
  const all = loadAllManualQueues();
  all[manualQueueKey(provider, companyId)] = queue;
  saveAllManualQueues(all);
}

export function clearManualBatchQueue(provider, companyId) {
  const all = loadAllManualQueues();
  delete all[manualQueueKey(provider, companyId)];
  saveAllManualQueues(all);
}

export function takeNextManualBatchByCategory(dataByCategory, cursors, batchSize = MANUAL_REFRESH_BATCH_SIZE) {
  const source = dataByCategory && typeof dataByCategory === "object" ? dataByCategory : {};
  const priorCursors = cursors && typeof cursors === "object" ? cursors : {};
  const nextCursors = { ...priorCursors };
  const batch = [];
  let isDone = true;

  for (const category of Object.keys(source)) {
    const list = Array.isArray(source[category]) ? source[category] : [];
    const start = Math.max(0, Number.isInteger(priorCursors[category]) ? priorCursors[category] : 0);
    const slice = list.slice(start, start + batchSize);

    slice.forEach(record => batch.push({ category, record }));
    nextCursors[category] = start + slice.length;

    if (nextCursors[category] < list.length) isDone = false;
  }

  return { batch, cursors: nextCursors, isDone };
}

export function isManualBatchByCategoryExhausted(dataByCategory, cursors) {
  if (!dataByCategory || typeof dataByCategory !== "object") return true;
  const safeCursors = cursors && typeof cursors === "object" ? cursors : {};
  return Object.keys(dataByCategory).every(category => {
    const list = Array.isArray(dataByCategory[category]) ? dataByCategory[category] : [];
    const cur = Number.isInteger(safeCursors[category]) ? safeCursors[category] : 0;
    return cur >= list.length;
  });
}

export function takeNextManualBatch(records, nextIndex, batchSize = MANUAL_REFRESH_BATCH_SIZE) {
  const list = Array.isArray(records) ? records : [];
  const start = Math.max(0, Number.isInteger(nextIndex) ? nextIndex : 0);
  const batch = list.slice(start, start + batchSize);

  return {
    batch,
    nextIndex: start + batch.length,
    isDone: start + batch.length >= list.length,
    total: list.length,
    batchStart: list.length === 0 ? 0 : start + 1,
    batchEnd: start + batch.length
  };
}

const MANUAL_QUEUE_COMPLETED_KEY = "fa_manual_batch_completed_once";

function loadCompletedOnceMap() {
  try {
    const raw = localStorage.getItem(MANUAL_QUEUE_COMPLETED_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch (_) {
    return {};
  }
}

function saveCompletedOnceMap(all) {
  try {
    localStorage.setItem(MANUAL_QUEUE_COMPLETED_KEY, JSON.stringify(all));
  } catch (_) {}
}

export function hasManualCycleCompletedBefore(provider, companyId) {
  const all = loadCompletedOnceMap();
  return !!all[manualQueueKey(provider, companyId)];
}

export function markManualCycleCompleted(provider, companyId) {
  const all = loadCompletedOnceMap();
  all[manualQueueKey(provider, companyId)] = true;
  saveCompletedOnceMap(all);
}

export function resetManualCycleCompleted(provider, companyId) {
  const all = loadCompletedOnceMap();
  delete all[manualQueueKey(provider, companyId)];
  saveCompletedOnceMap(all);
}

const PULL_PAGE_CURSOR_STORAGE_KEY = "fa_pull_page_cursor";

function loadAllPullPageCursors() {
  try {
    const raw = localStorage.getItem(PULL_PAGE_CURSOR_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch (_) {
    return {};
  }
}

function saveAllPullPageCursors(all) {
  try {
    localStorage.setItem(PULL_PAGE_CURSOR_STORAGE_KEY, JSON.stringify(all));
  } catch (_) {}
}

export function getPullPageCursor(provider, companyId) {
  const all = loadAllPullPageCursors();
  return all[manualQueueKey(provider, companyId)] || null;
}

export function setPullPageCursor(provider, companyId, cursor) {
  const all = loadAllPullPageCursors();
  all[manualQueueKey(provider, companyId)] = cursor;
  saveAllPullPageCursors(all);
}

export function clearPullPageCursor(provider, companyId) {
  const all = loadAllPullPageCursors();
  delete all[manualQueueKey(provider, companyId)];
  saveAllPullPageCursors(all);
}
