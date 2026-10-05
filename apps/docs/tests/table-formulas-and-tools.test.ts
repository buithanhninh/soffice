import { describe, it, expect } from 'vitest'
import { TableFormulaEngine } from '../src/renderer/editor/table-formula'
import { TableTools } from '../src/renderer/editor/table-tools'

describe('Word Table Formulas & Advanced Tools (Milestone D3)', () => {
  describe('TableFormulaEngine: Number Parsing & Sanitization', () => {
    it('parses integers and floating point values', () => {
      expect(TableFormulaEngine.parseCellNumber('123')).toBe(123)
      expect(TableFormulaEngine.parseCellNumber('45.67')).toBe(45.67)
    })

    it('strips commas and currency symbols ($ € £ ₫)', () => {
      expect(TableFormulaEngine.parseCellNumber('$1,250.00')).toBe(1250)
      expect(TableFormulaEngine.parseCellNumber('500,000₫')).toBe(500000)
      expect(TableFormulaEngine.parseCellNumber('€ 99.50')).toBe(99.5)
    })

    it('parses accounting negatives (100) and percentages', () => {
      expect(TableFormulaEngine.parseCellNumber('(250)')).toBe(-250)
      expect(TableFormulaEngine.parseCellNumber('15%')).toBe(0.15)
    })

    it('returns null for empty or non-numeric strings', () => {
      expect(TableFormulaEngine.parseCellNumber('')).toBeNull()
      expect(TableFormulaEngine.parseCellNumber('N/A')).toBeNull()
    })
  })

  describe('TableFormulaEngine: Word Directional Formulas', () => {
    const sampleGrid = [
      ['Item', 'Quantity', 'Price', 'Subtotal'],
      ['Keyboard', '2', '$50', '$100'],
      ['Mouse', '3', '$20', '$60'],
      ['Monitor', '1', '$200', '$200'],
      ['Total', '', '', ''], // Row index 4
    ]

    it('evaluates =SUM(ABOVE) summing vertical numbers above current cell', () => {
      const res = TableFormulaEngine.evaluate('=SUM(ABOVE)', sampleGrid, 4, 3)
      expect(res.ok).toBe(true)
      expect(res.value).toBe(360) // 100 + 60 + 200
      expect(res.formattedText).toBe('360')
    })

    it('evaluates =AVERAGE(ABOVE) computing the mean of column values', () => {
      const res = TableFormulaEngine.evaluate('=AVERAGE(ABOVE)', sampleGrid, 4, 3)
      expect(res.ok).toBe(true)
      expect(res.value).toBe(120) // 360 / 3
    })

    it('evaluates =COUNT(ABOVE) counting numeric cells above', () => {
      const res = TableFormulaEngine.evaluate('=COUNT(ABOVE)', sampleGrid, 4, 3)
      expect(res.ok).toBe(true)
      expect(res.value).toBe(3)
    })

    it('evaluates =MIN(ABOVE) and =MAX(ABOVE)', () => {
      const minRes = TableFormulaEngine.evaluate('=MIN(ABOVE)', sampleGrid, 4, 3)
      expect(minRes.value).toBe(60)

      const maxRes = TableFormulaEngine.evaluate('=MAX(ABOVE)', sampleGrid, 4, 3)
      expect(maxRes.value).toBe(200)
    })

    it('evaluates =PRODUCT(LEFT) multiplying numbers in the row to the left', () => {
      // Row 1: ['Keyboard', '2', '$50', ''] -> 2 * 50 = 100
      const res = TableFormulaEngine.evaluate('=PRODUCT(LEFT)', sampleGrid, 1, 3)
      expect(res.ok).toBe(true)
      expect(res.value).toBe(100)
    })

    it('returns syntax error for invalid formulas', () => {
      const res = TableFormulaEngine.evaluate('=UNKNOWN(ABOVE)', sampleGrid, 4, 3)
      expect(res.ok).toBe(false)
      expect(res.formattedText).toBe('!SYNTAX ERROR!')
    })
  })

  describe('TableTools: Row Sorting & Table/Text Conversion', () => {
    const unsorted = [
      ['Name', 'Score'],
      ['Charlie', '85'],
      ['Alice', '95'],
      ['Bob', '70'],
    ]

    it('sorts table rows ascending by text column', () => {
      const sorted = TableTools.sortRows(unsorted, 0, 'asc', true)
      expect(sorted[1]![0]).toBe('Alice')
      expect(sorted[2]![0]).toBe('Bob')
      expect(sorted[3]![0]).toBe('Charlie')
    })

    it('sorts table rows descending by numeric column', () => {
      const sorted = TableTools.sortRows(unsorted, 1, 'desc', true)
      expect(sorted[1]![0]).toBe('Alice') // 95
      expect(sorted[2]![0]).toBe('Charlie') // 85
      expect(sorted[3]![0]).toBe('Bob') // 70
    })

    it('converts 2D table grid to CSV/TSV text and back', () => {
      const text = TableTools.tableToText(unsorted, '\t')
      expect(text).toContain('Charlie\t85')

      const reconverted = TableTools.textToTable(text, '\t')
      expect(reconverted).toEqual(unsorted)
    })
  })
})