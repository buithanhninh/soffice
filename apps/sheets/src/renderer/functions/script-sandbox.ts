/**
 * TypeScript / JavaScript Automation Script Sandbox for sOffice Sheets.
 * Safely executes automation scripts with restricted globals and a 5000ms watchdog timeout.
 *
 * Author: Bùi Thành Ninh <https://soffice.caqa.io.vn>
 */

export interface CellOperation {
  type: 'SET_VALUE' | 'SET_VALUES';
  cell?: string;
  range?: string;
  value?: unknown;
  values?: unknown[][];
}

export interface ScriptExecutionResult {
  ok: boolean;
  error?: string;
  operations: CellOperation[];
  logs: string[];
}

export interface SandboxRange {
  getValue(): unknown;
  setValue(val: unknown): void;
  getValues(): unknown[][];
  setValues(matrix: unknown[][]): void;
}

export interface SandboxSheet {
  getRange(a1Notation: string): SandboxRange;
}

export class ScriptSandbox {
  private timeoutMs: number;

  constructor(timeoutMs = 5000) {
    this.timeoutMs = timeoutMs;
  }

  public async execute(
    code: string,
    initialData: Record<string, unknown> = {}
  ): Promise<ScriptExecutionResult> {
    if (!code || !code.trim()) {
      return { ok: true, operations: [], logs: [] };
    }

    const operations: CellOperation[] = [];
    const logs: string[] = [];
    const grid = new Map<string, unknown>(Object.entries(initialData));

    const sheet: SandboxSheet = {
      getRange(a1Notation: string): SandboxRange {
        const upper = a1Notation.toUpperCase();
        return {
          getValue(): unknown {
            return grid.get(upper);
          },
          setValue(val: unknown): void {
            grid.set(upper, val);
            operations.push({ type: 'SET_VALUE', cell: upper, value: val });
          },
          getValues(): unknown[][] {
            return [[grid.get(upper)]];
          },
          setValues(matrix: unknown[][]): void {
            operations.push({ type: 'SET_VALUES', range: upper, values: matrix });
          },
        };
      },
    };

    const SpreadsheetApp = {
      getActiveSheet(): SandboxSheet {
        return sheet;
      },
    };

    const safeConsole = {
      log(...args: unknown[]): void {
        logs.push(args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' '));
      },
    };

    // Instrument code with loop watchdog counter to prevent runaway while/for loops
    let instrumented = code
      .replace(/while\s*\((.*?)\)\s*\{/g, 'while ($1) { __watchdogCheck(); ')
      .replace(/for\s*\((.*?)\)\s*\{/g, 'for ($1) { __watchdogCheck(); ');

    const startTime = Date.now();
    const timeoutLimit = this.timeoutMs;
    let stepCount = 0;

    const watchdogCheck = () => {
      stepCount++;
      if (stepCount % 1000 === 0) {
        if (Date.now() - startTime > timeoutLimit) {
          throw new Error(`Watchdog timeout: script execution exceeded ${timeoutLimit}ms limit`);
        }
      }
    };

    try {
      // Safe sandbox function excluding browser DOM globals
      const sandboxFn = new Function(
        'SpreadsheetApp',
        'console',
        '__watchdogCheck',
        'window',
        'document',
        'fetch',
        'localStorage',
        'sessionStorage',
        'location',
        'XMLHttpRequest',
        `"use strict";
        return (async () => {
          ${instrumented}
        })();`
      );

      await sandboxFn(
        SpreadsheetApp,
        safeConsole,
        watchdogCheck,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined
      );

      return { ok: true, operations, logs };
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      return {
        ok: false,
        error: errMsg.includes('Watchdog timeout') ? errMsg : errMsg,
        operations,
        logs,
      };
    }
  }
}