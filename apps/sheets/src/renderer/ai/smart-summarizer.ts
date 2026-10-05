/**
 * Smart Summarization & Executive Report Planner for sAI Studio in sOffice Sheets.
 * Profiles tabular data distributions and constructs executive summary reports.
 *
 * Author: Bùi Thành Ninh <https://soffice.caqa.io.vn>
 */

export interface SheetProfile {
  ok: boolean;
  error?: string;
  rows?: number;
  cols?: number;
  numericCount?: number;
  nullCount?: number;
  sum?: number;
  mean?: number;
  min?: number;
  max?: number;
}

export interface SummaryOperation {
  type: 'ADD_SHEET' | 'SET_CELL';
  name?: string;
  cell?: string;
  value?: unknown;
  style?: { bold?: boolean; fontSize?: number };
}

export interface ExecutiveReportPlan {
  ok: boolean;
  sheetName: string;
  operations: SummaryOperation[];
}

export const SmartSummarizer = {
  profile(data: readonly (readonly unknown[])[]): SheetProfile {
    if (!data || data.length === 0) {
      return { ok: false, error: 'Selection range contains no data' };
    }

    const rows = data.length;
    const cols = data[0] ? data[0].length : 0;
    let numericCount = 0;
    let nullCount = 0;
    let sum = 0;
    let min = Infinity;
    let max = -Infinity;

    for (let r = 0; r < rows; r++) {
      const row = data[r];
      if (!row) continue;
      for (let c = 0; c < cols; c++) {
        const cell = row[c];
        if (cell === null || cell === undefined || cell === '') {
          nullCount++;
        } else if (typeof cell === 'number' && !isNaN(cell) && isFinite(cell)) {
          numericCount++;
          sum += cell;
          if (cell < min) min = cell;
          if (cell > max) max = cell;
        }
      }
    }

    const mean = numericCount > 0 ? sum / numericCount : 0;
    return {
      ok: true,
      rows,
      cols,
      numericCount,
      nullCount,
      sum,
      mean,
      min: min === Infinity ? 0 : min,
      max: max === -Infinity ? 0 : max,
    };
  },

  buildExecutiveReportPlan(
    profile: SheetProfile,
    baseName = 'Executive Summary',
    existingSheets: readonly string[] = []
  ): ExecutiveReportPlan {
    let name = baseName;
    let counter = 2;
    while (existingSheets.includes(name)) {
      name = `${baseName} ${counter++}`;
    }

    return {
      ok: true,
      sheetName: name,
      operations: [
        { type: 'ADD_SHEET', name },
        {
          type: 'SET_CELL',
          cell: 'A1',
          value: 'sOffice Executive Summary Report',
          style: { bold: true, fontSize: 16 },
        },
        { type: 'SET_CELL', cell: 'A3', value: 'Total Volume', style: { bold: true } },
        { type: 'SET_CELL', cell: 'B3', value: profile.sum ?? 0 },
        { type: 'SET_CELL', cell: 'A4', value: 'Average Metric', style: { bold: true } },
        { type: 'SET_CELL', cell: 'B4', value: profile.mean ?? 0 },
      ],
    };
  },
};