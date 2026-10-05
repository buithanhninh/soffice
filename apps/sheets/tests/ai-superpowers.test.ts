import { describe, it, expect, beforeEach } from 'vitest'
import {
  AiFormulaCache,
  extractEntityPattern,
  translateTextMock,
  AiFunction,
  AiExtractFunction,
  AiTranslateFunction,
} from '../src/renderer/functions/ai-functions'
import { AnomalyDetector } from '../src/renderer/ai/anomaly-detector'
import { SmartSummarizer } from '../src/renderer/ai/smart-summarizer'
import { StringValueObject } from '@univerjs/engine-formula'

describe('In-Cell AI Superpowers & sAI Studio (Milestone M2)', () => {
  let cache: AiFormulaCache

  beforeEach(() => {
    cache = new AiFormulaCache(5)
  })

  describe('AiFormulaCache Engine', () => {
    it('creates stable deterministic cache keys based on canonical formula and args', () => {
      const k1 = cache.createKey('doc1', 'sheet1', 2, 3, 'AI', 'summarize')
      const k2 = cache.createKey('doc1', 'sheet1', 2, 3, 'AI', 'summarize')
      const k3 = cache.createKey('doc1', 'sheet1', 2, 3, 'AI', 'translate')
      expect(k1).toBe(k2)
      expect(k1).not.toBe(k3)
    })

    it('stores and retrieves cached formula evaluations', () => {
      const key = 'test-key'
      cache.set(key, 'Calculated AI Result')
      expect(cache.get(key)).toBe('Calculated AI Result')
    })

    it('enforces LRU eviction when exceeding maxSize', () => {
      for (let i = 1; i <= 6; i++) {
        cache.set(`k${i}`, `v${i}`)
      }
      expect(cache.size()).toBe(5)
      expect(cache.get('k1')).toBeUndefined()
      expect(cache.get('k6')).toBe('v6')
    })

    it('deduplicates in-flight promises to prevent recalculation storms', async () => {
      let callCount = 0
      const fetcher = async () => {
        callCount++
        return 'Fetched from AI'
      }

      const p1 = cache.executeWithDedup('concurrent-key', fetcher)
      const p2 = cache.executeWithDedup('concurrent-key', fetcher)
      const [r1, r2] = await Promise.all([p1, p2])

      expect(r1).toBe('Fetched from AI')
      expect(r2).toBe('Fetched from AI')
      expect(callCount).toBe(1)
    })
  })

  describe('AI Entity Extraction (=AI_EXTRACT)', () => {
    it('extracts emails from unstructured text', () => {
      const text = 'Contact us at support@soffice.caqa.io.vn for help.'
      expect(extractEntityPattern('email', text)).toBe('support@soffice.caqa.io.vn')
    })

    it('extracts phone numbers from unstructured text', () => {
      const text = 'Call office at (123) 456-7890 today.'
      expect(extractEntityPattern('phone', text)).toBe('(123) 456-7890')
    })

    it('extracts dates formatted as YYYY-MM-DD or DD/MM/YYYY', () => {
      const text = 'The release was signed on 2026-10-05.'
      expect(extractEntityPattern('date', text)).toBe('2026-10-05')
    })

    it('supports custom regex patterns', () => {
      const text = 'Order INV-99881 was approved.'
      expect(extractEntityPattern('INV-\\d+', text)).toBe('INV-99881')
    })
  })

  describe('AI Translation (=AI_TRANSLATE)', () => {
    it('translates common financial and business terms', () => {
      expect(translateTextMock('revenue', 'vi')).toBe('Doanh thu')
      expect(translateTextMock('profit', 'vi')).toBe('Lợi nhuận')
      expect(translateTextMock('sales', 'ja')).toBe('売上')
      expect(translateTextMock('revenue', 'fr')).toBe('Revenu')
    })

    it('falls back to tagged string for untranslated terms', () => {
      expect(translateTextMock('custom phrase', 'es')).toBe('[ES] custom phrase')
    })
  })

  describe('sAI Studio Anomaly Detection', () => {
    it('detects outliers using IQR fence and Z-Score', () => {
      const values = [10, 11, 12, 10, 11, 12, 10, 100] // 100 is outlier
      const res = AnomalyDetector.detect(values)
      expect(res.outliers.length).toBeGreaterThan(0)
      const o = res.outliers.find((item) => item.value === 100)
      expect(o).toBeDefined()
      expect(o?.severity).toBe('red')
    })

    it('handles small sample size gracefully', () => {
      const res = AnomalyDetector.detect([1, 2])
      expect(res.note).toBe('Insufficient data for IQR')
      expect(res.outliers).toEqual([])
    })

    it('filters out non-numeric values and NaNs', () => {
      const res = AnomalyDetector.detect(['text', null, undefined, NaN, 10, 12, 11, 13, 10])
      expect(res.numericCount).toBe(5)
    })
  })

  describe('sAI Studio Smart Summarizer', () => {
    it('profiles tabular metrics accurately', () => {
      const data = [
        [10, 20],
        [30, null],
        ['text', 40],
      ]
      const prof = SmartSummarizer.profile(data)
      expect(prof.ok).toBe(true)
      expect(prof.numericCount).toBe(4)
      expect(prof.sum).toBe(100)
      expect(prof.mean).toBe(25)
      expect(prof.min).toBe(10)
      expect(prof.max).toBe(40)
    })

    it('generates executive report plan with non-colliding sheet name', () => {
      const prof = SmartSummarizer.profile([[100, 200]])
      const plan = SmartSummarizer.buildExecutiveReportPlan(prof, 'Executive Summary', ['Executive Summary'])
      expect(plan.sheetName).toBe('Executive Summary 2')
      expect(plan.operations.length).toBeGreaterThan(0)
    })
  })
})