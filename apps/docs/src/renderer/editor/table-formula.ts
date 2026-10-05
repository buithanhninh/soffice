/**
 * Microsoft Word Table Formula Calculation Engine for sOffice Docs.
 * Supports Word standard table formulas: =SUM(ABOVE), =SUM(LEFT), =AVERAGE(ABOVE),
 * =COUNT(ABOVE), =MIN(ABOVE), =MAX(ABOVE), =PRODUCT(LEFT).
 *
 * Compatible with OpenXML field definitions: w:fldSimple w:instr="=SUM(ABOVE)".
 *
 * Author: Bùi Thành Ninh <https://soffice.caqa.io.vn>
 */

export interface FormulaResult {
  ok: boolean;
  value: number;
  formattedText: string;
  error?: string;
}

export const TableFormulaEngine = {
  /**
   * Sanitizes cell text into a floating-point number.
   * Handles currency symbols, commas, percent, and parenthesized negatives: (100) -> -100.
   */
  parseCellNumber(text: unknown): number | null {
    if (text === null || text === undefined) return null;
    let s = String(text).trim();
    if (!s) return null;

    // Handle (123.45) accounting negative format
    const isParenNeg = /^\(.*\)$/.test(s);
    if (isParenNeg) {
      s = s.slice(1, -1).trim();
    }

    // Strip common currency symbols, commas, and percentage
    s = s.replace(/[$€£₫¥\s,]/g, '');
    const isPercent = s.endsWith('%');
    if (isPercent) {
      s = s.slice(0, -1).trim();
    }

    const num = parseFloat(s);
    if (isNaN(num)) return null;

    let res = isParenNeg ? -num : num;
    if (isPercent) res /= 100;
    return res;
  },

  /**
   * Extracts number values from the table matrix based on direction: ABOVE or LEFT.
   */
  extractDirectionValues(
    grid: readonly (readonly unknown[])[],
    currentRow: number,
    currentCol: number,
    direction: 'ABOVE' | 'LEFT'
  ): number[] {
    const nums: number[] = [];

    if (direction === 'ABOVE') {
      for (let r = 0; r < currentRow; r++) {
        const row = grid[r];
        if (!row) continue;
        const val = this.parseCellNumber(row[currentCol]);
        if (val !== null) nums.push(val);
      }
    } else if (direction === 'LEFT') {
      const row = grid[currentRow];
      if (row) {
        for (let c = 0; c < currentCol; c++) {
          const val = this.parseCellNumber(row[c]);
          if (val !== null) nums.push(val);
        }
      }
    }

    return nums;
  },

  /**
   * Evaluates a Word table formula string (e.g. "=SUM(ABOVE)", "=AVERAGE(LEFT)").
   */
  evaluate(
    formula: string,
    grid: readonly (readonly unknown[])[],
    currentRow: number,
    currentCol: number
  ): FormulaResult {
    const raw = formula.trim().replace(/^=/, '').toUpperCase();
    const match = raw.match(/^(SUM|AVERAGE|COUNT|MIN|MAX|PRODUCT)\s*\(\s*(ABOVE|LEFT)\s*\)$/i);

    if (!match) {
      return {
        ok: false,
        value: 0,
        formattedText: '!SYNTAX ERROR!',
        error: `Unsupported formula syntax: ${formula}`,
      };
    }

    const func = match[1]!.toUpperCase();
    const dir = match[2]!.toUpperCase() as 'ABOVE' | 'LEFT';
    const nums = this.extractDirectionValues(grid, currentRow, currentCol, dir);

    let val = 0;
    switch (func) {
      case 'SUM':
        val = nums.reduce((a, b) => a + b, 0);
        break;
      case 'AVERAGE':
        val = nums.length > 0 ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
        break;
      case 'COUNT':
        val = nums.length;
        break;
      case 'MIN':
        val = nums.length > 0 ? Math.min(...nums) : 0;
        break;
      case 'MAX':
        val = nums.length > 0 ? Math.max(...nums) : 0;
        break;
      case 'PRODUCT':
        val = nums.length > 0 ? nums.reduce((a, b) => a * b, 1) : 0;
        break;
    }

    // Format with commas if needed
    const formattedText = Number.isInteger(val) ? String(val) : val.toFixed(2);
    return {
      ok: true,
      value: val,
      formattedText,
    };
  },
};