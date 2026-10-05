import { describe, it, expect } from 'vitest'
import { SparklineEngine, parseSparklineOptions } from '../src/renderer/functions/sparkline-function'
import { ChartEngine } from '../src/renderer/functions/chart-engine'

describe('Sparklines & Advanced Charts (Milestone M3)', () => {
  describe('In-Cell Sparkline Engine (=SPARKLINE)', () => {
    it('generates clean SVG line charts from numeric sequences', () => {
      const values = [10, 20, 15, 35, 25]
      const svg = SparklineEngine.generateSvg(values, { charttype: 'line', color: '#107c41' })
      expect(svg).toContain('<svg')
      expect(svg).toContain('<path')
      expect(svg).toContain('stroke="#107c41"')
    })

    it('generates SVG column charts with proportional bar heights', () => {
      const values = [5, 10, 15]
      const svg = SparklineEngine.generateSvg(values, { charttype: 'column', color: '#0078d4' })
      expect(svg).toContain('<svg')
      expect(svg).toContain('<rect')
      expect(svg).toContain('fill="#0078d4"')
    })

    it('generates winloss / bar charts with distinct positive and negative fills', () => {
      const values = [1, -1, 1, -1]
      const svg = SparklineEngine.generateSvg(values, { charttype: 'winloss' })
      expect(svg).toContain('fill="#107c41"') // positive
      expect(svg).toContain('fill="#d83b01"') // negative
    })

    it('handles empty, null, and non-numeric values safely', () => {
      expect(SparklineEngine.generateSvg([])).toBe('<svg width="0" height="0"></svg>')
      const svg = SparklineEngine.generateSvg([null, undefined, 'abc', 10, 20])
      expect(svg).toContain('<path')
    })

    it('handles all-identical values without division by zero', () => {
      const values = [10, 10, 10]
      const svg = SparklineEngine.generateSvg(values)
      expect(svg).toContain('<svg')
      expect(svg).not.toContain('NaN')
    })
  })

  describe('Waterfall Chart Calculation', () => {
    it('computes floating bar base, delta, and totals correctly', () => {
      const items = [
        { name: 'Revenue', value: 100 },
        { name: 'COGS', value: -40 },
        { name: 'Operating Expenses', value: -20 },
        { name: 'Net Income', value: 0, isTotal: true },
      ]
      const bars = ChartEngine.calculateWaterfall(items)
      expect(bars).toHaveLength(4)
      expect(bars[0]).toEqual({ name: 'Revenue', base: 0, delta: 100, isTotal: false, end: 100 })
      expect(bars[1]).toEqual({ name: 'COGS', base: 60, delta: -40, isTotal: false, end: 60 })
      expect(bars[2]).toEqual({ name: 'Operating Expenses', base: 40, delta: -20, isTotal: false, end: 40 })
      expect(bars[3]).toEqual({ name: 'Net Income', base: 0, delta: 40, isTotal: true, end: 40 })
    })
  })

  describe('Squarified Treemap Layout', () => {
    it('partitions space proportionally to item weights', () => {
      const weights = [50, 30, 20]
      const rects = ChartEngine.squarifyTreemap(weights, 100, 100)
      expect(rects).toHaveLength(3)
      expect(rects[0]?.width).toBeCloseTo(50)
      expect(rects[1]?.width).toBeCloseTo(30)
      expect(rects[2]?.width).toBeCloseTo(20)
    })

    it('handles empty weights and zero dimensions safely', () => {
      expect(ChartEngine.squarifyTreemap([], 100, 100)).toEqual([])
      expect(ChartEngine.squarifyTreemap([10], 0, 100)).toEqual([])
    })
  })
})