import { describe, it, expect } from 'vitest'
import { PivotFormulaEngine } from '../src/renderer/functions/pivot-calculated-fields'
import { ScriptSandbox } from '../src/renderer/functions/script-sandbox'
import { CsvParser } from '../src/renderer/functions/data-importer'

describe('Pivot Calculated Fields & Automation Sandbox (Milestones M4 & M5)', () => {
  describe('Pivot Table Calculated Fields Engine', () => {
    it('evaluates basic arithmetic formulas with field names', () => {
      const row = { Sales: 1000, TaxRate: 0.1 }
      const res = PivotFormulaEngine.evaluate("'Sales' * 'TaxRate'", row)
      expect(res).toBeCloseTo(100)
    })

    it('evaluates complex precedence with parentheses', () => {
      const row = { Revenue: 200, Cost: 50, Units: 5 }
      const res = PivotFormulaEngine.evaluate("('Revenue' - 'Cost') / 'Units'", row)
      expect(res).toBe(30)
    })

    it('returns #DIV/0! when dividing by zero', () => {
      const row = { Total: 100, Count: 0 }
      const res = PivotFormulaEngine.evaluate("'Total' / 'Count'", row)
      expect(res).toBe('#DIV/0!')
    })

    it('returns #NAME? when referencing undefined fields', () => {
      const row = { Sales: 100 }
      const res = PivotFormulaEngine.evaluate("'Sales' + 'NonExistent'", row)
      expect(res).toBe('#NAME?')
    })

    it('detects circular references in calculated field dependencies', () => {
      const allFields = {
        Margin: "'Profit' / 'Revenue'",
        Profit: "'Revenue' - 'Cost'",
        Cost: "'Margin' * 0.5", // Circular cycle
      }
      expect(PivotFormulaEngine.checkCircular('Margin', allFields.Margin, allFields)).toBe(true)
    })
  })

  describe('TypeScript Script Execution Sandbox', () => {
    it('executes safe spreadsheet operations via SpreadsheetApp', async () => {
      const sandbox = new ScriptSandbox(1000)
      const code = `
        const sheet = SpreadsheetApp.getActiveSheet();
        sheet.getRange('A1').setValue(42);
        console.log('Done!');
      `
      const result = await sandbox.execute(code)
      expect(result.ok).toBe(true)
      expect(result.operations).toHaveLength(1)
      expect(result.operations[0]).toEqual({ type: 'SET_VALUE', cell: 'A1', value: 42 })
      expect(result.logs).toContain('Done!')
    })

    it('terminates infinite loops with watchdog timeout', async () => {
      const sandbox = new ScriptSandbox(200) // 200ms timeout
      const code = `
        let i = 0;
        while(true) { i++; }
      `
      const result = await sandbox.execute(code)
      expect(result.ok).toBe(false)
      expect(result.error).toContain('Watchdog timeout')
    })
  })

  describe('Data Importer (CSV / TSV / JSON)', () => {
    it('sniffs delimiters correctly from sample text', () => {
      expect(CsvParser.sniffDelimiter('a,b,c\n1,2,3')).toBe(',')
      expect(CsvParser.sniffDelimiter('a\tb\tc\n1\t2\t3')).toBe('\t')
      expect(CsvParser.sniffDelimiter('a;b;c\n1;2;3')).toBe(';')
    })

    it('parses RFC 4180 CSV with quoted strings and embedded commas', () => {
      const csv = 'Name,Description,Amount\n"Widget, Super","Best tool ever",19.99'
      const rows = CsvParser.parse(csv, ',')
      expect(rows).toHaveLength(2)
      expect(rows[1]).toEqual(['Widget, Super', 'Best tool ever', '19.99'])
    })

    it('flattens heterogeneous JSON objects into unified schema table', () => {
      const json = [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob', email: 'bob@example.com' },
      ]
      const rows = CsvParser.flattenJson(json)
      expect(rows).toHaveLength(3) // 1 header + 2 data rows
      expect(rows[0]).toContain('id')
      expect(rows[0]).toContain('name')
      expect(rows[0]).toContain('email')
      expect(rows[1]).toContain(1)
      expect(rows[2]).toContain('bob@example.com')
    })
  })
})