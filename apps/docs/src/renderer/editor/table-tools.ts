/**
 * Advanced Table Tools for sOffice Docs.
 * Implements Table Row Sorting and Two-Way Table <-> Text Conversion.
 *
 * Author: Bùi Thành Ninh <https://soffice.caqa.io.vn>
 */

export const TableTools = {
  /**
   * Sorts 2D table rows by a given column index.
   */
  sortRows(
    rows: readonly (readonly string[])[],
    colIndex: number,
    order: 'asc' | 'desc' = 'asc',
    hasHeader = true
  ): string[][] {
    if (!rows || rows.length === 0) return [];
    const headerRow = hasHeader ? rows[0] : null;
    const bodyRows = hasHeader ? rows.slice(1) : [...rows];

    const sorted = [...bodyRows].sort((a, b) => {
      const valA = (a[colIndex] || '').trim();
      const valB = (b[colIndex] || '').trim();

      const numA = parseFloat(valA.replace(/[,$\s]/g, ''));
      const numB = parseFloat(valB.replace(/[,$\s]/g, ''));

      if (!isNaN(numA) && !isNaN(numB)) {
        return order === 'asc' ? numA - numB : numB - numA;
      }
      return order === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
    });

    return headerRow ? [[...headerRow], ...sorted.map((r) => [...r])] : sorted.map((r) => [...r]);
  },

  /**
   * Converts a 2D table grid into delimited text.
   */
  tableToText(rows: readonly (readonly string[])[], delimiter = '\t'): string {
    return rows.map((r) => r.join(delimiter)).join('\n');
  },

  /**
   * Converts delimited text (CSV, TSV) into a 2D table grid.
   */
  textToTable(text: string, delimiter?: string): string[][] {
    if (!text || !text.trim()) return [];
    let delim = delimiter;
    if (!delim) {
      delim = text.includes('\t') ? '\t' : ',';
    }

    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    return lines.map((line) => line.split(delim!).map((cell) => cell.trim()));
  },
};