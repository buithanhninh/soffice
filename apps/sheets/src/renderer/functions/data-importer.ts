/**
 * Data Ingestion & Importer Engine for sOffice Sheets.
 * Supports RFC 4180 CSV/TSV parsing with delimiter sniffing,
 * JSON schema flattening, and REST API data streaming.
 *
 * Author: Bùi Thành Ninh <https://soffice.caqa.io.vn>
 */

export interface ApiFetchResult {
  ok: boolean;
  status?: number;
  data?: unknown;
  error?: string;
}

export const CsvParser = {
  /**
   * Sniffs the most likely delimiter (comma, tab, semicolon, pipe) from sample text.
   */
  sniffDelimiter(sample: string): string {
    const counts: Record<string, number> = { ',': 0, '\t': 0, ';': 0, '|': 0 };
    for (let i = 0; i < sample.length; i++) {
      const char = sample[i]!;
      if (char in counts) {
        counts[char] = (counts[char] ?? 0) + 1;
      }
    }

    let best = ',';
    let max = -1;
    for (const [delim, count] of Object.entries(counts)) {
      if (count > max) {
        max = count;
        best = delim;
      }
    }
    return best;
  },

  /**
   * Parses RFC 4180 compliant delimited text into a 2D string matrix.
   */
  parse(text: string, delimiter = ','): string[][] {
    if (!text || text.trim() === '') return [];
    const rows: string[][] = [];
    let currentRow: string[] = [];
    let currentCell = '';
    let insideQuote = false;
    let i = 0;

    while (i < text.length) {
      const char = text[i]!;

      if (char === '"') {
        if (insideQuote && text[i + 1] === '"') {
          currentCell += '"';
          i += 2;
          continue;
        }
        insideQuote = !insideQuote;
        i++;
        continue;
      }

      if (char === delimiter && !insideQuote) {
        currentRow.push(currentCell);
        currentCell = '';
        i++;
        continue;
      }

      if ((char === '\n' || char === '\r') && !insideQuote) {
        if (char === '\r' && text[i + 1] === '\n') {
          i++;
        }
        currentRow.push(currentCell);
        rows.push(currentRow);
        currentRow = [];
        currentCell = '';
        i++;
        continue;
      }

      currentCell += char;
      i++;
    }

    if (currentCell || currentRow.length > 0) {
      currentRow.push(currentCell);
      rows.push(currentRow);
    }

    return rows;
  },

  /**
   * Flattens polymorphic array of JSON objects into tabular columns and rows.
   */
  flattenJson(jsonArray: readonly Record<string, unknown>[]): unknown[][] {
    if (!Array.isArray(jsonArray) || jsonArray.length === 0) return [];
    const keys = new Set<string>();
    for (const obj of jsonArray) {
      if (obj && typeof obj === 'object') {
        for (const k of Object.keys(obj)) {
          keys.add(k);
        }
      }
    }

    const headers = [...keys];
    const rows: unknown[][] = [headers];

    for (const obj of jsonArray) {
      if (obj && typeof obj === 'object') {
        rows.push(headers.map((k) => obj[k] ?? null));
      }
    }

    return rows;
  },

  /**
   * Safe fetch for external REST API endpoints with status code handling.
   */
  async fetchApi(url: string): Promise<ApiFetchResult> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        return {
          ok: false,
          status: response.status,
          error: `HTTP ${response.status}: ${response.statusText}`,
        };
      }
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await response.json();
        return { ok: true, status: response.status, data };
      }
      const text = await response.text();
      return { ok: true, status: response.status, data: text };
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      return { ok: false, error: errMsg };
    }
  },
};