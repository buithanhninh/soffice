import { describe, it, expect } from 'vitest'
import { MarkdownShortcuts } from '../src/renderer/editor/markdown-shortcuts'
import { ClearFormatting } from '../src/renderer/editor/clear-formatting'
import { pagelessManager, PAGELESS_WIDTH_MAP } from '../src/renderer/pageless-mode'

describe('Markdown Speed Shortcuts & Pageless View (Milestones D2 & D4)', () => {
  describe('Markdown Keyboard Shortcuts', () => {
    it('matches heading prefixes # through ######', () => {
      expect(MarkdownShortcuts.matchBlockPrefix('# ')).toEqual({
        type: 'heading',
        level: 1,
        consumedText: '# ',
      })
      expect(MarkdownShortcuts.matchBlockPrefix('### ')).toEqual({
        type: 'heading',
        level: 3,
        consumedText: '### ',
      })
    })

    it('matches blockquote, list, and checklist prefixes', () => {
      expect(MarkdownShortcuts.matchBlockPrefix('> ')).toEqual({
        type: 'blockquote',
        consumedText: '> ',
      })
      expect(MarkdownShortcuts.matchBlockPrefix('- ')).toEqual({
        type: 'bullet_list',
        consumedText: '- ',
      })
      expect(MarkdownShortcuts.matchBlockPrefix('1. ')).toEqual({
        type: 'ordered_list',
        consumedText: '1. ',
      })
      expect(MarkdownShortcuts.matchBlockPrefix('[] ')).toEqual({
        type: 'checklist',
        consumedText: '[] ',
      })
      expect(MarkdownShortcuts.matchBlockPrefix('---')).toEqual({
        type: 'hr',
        consumedText: '---',
      })
    })

    it('parses inline markdown syntax (**bold**, *italic*, ~strike~, `code`)', () => {
      expect(MarkdownShortcuts.parseInlineMarkdown('**in đậm**')).toEqual({
        type: 'bold',
        innerText: 'in đậm',
      })
      expect(MarkdownShortcuts.parseInlineMarkdown('*in nghiêng*')).toEqual({
        type: 'italic',
        innerText: 'in nghiêng',
      })
      expect(MarkdownShortcuts.parseInlineMarkdown('~gạch ngang~')).toEqual({
        type: 'strike',
        innerText: 'gạch ngang',
      })
      expect(MarkdownShortcuts.parseInlineMarkdown('`const x = 1`')).toEqual({
        type: 'code',
        innerText: 'const x = 1',
      })
    })
  })

  describe('Clear All Formatting Plan', () => {
    it('returns exhaustive list of formatting marks to strip', () => {
      const plan = ClearFormatting.getDefaultClearPlan()
      expect(plan.removeMarks).toContain('bold')
      expect(plan.removeMarks).toContain('italic')
      expect(plan.removeMarks).toContain('underline')
      expect(plan.removeMarks).toContain('textColor')
      expect(plan.removeMarks).toContain('fontSize')
      expect(plan.resetParagraphAttrs.align).toBe('left')
    })
  })

  describe('Pageless View Mode State Manager', () => {
    it('toggles seamlessly between pages and pageless mode', () => {
      pagelessManager.setMode('pages')
      expect(pagelessManager.isPageless()).toBe(false)

      const next = pagelessManager.toggleMode()
      expect(next).toBe('pageless')
      expect(pagelessManager.isPageless()).toBe(true)

      pagelessManager.setMode('pages')
      expect(pagelessManager.isPageless()).toBe(false)
    })

    it('configures pageless canvas widths (narrow, medium, wide, full)', () => {
      pagelessManager.setWidth('narrow')
      expect(pagelessManager.getSettings().width).toBe('narrow')
      expect(PAGELESS_WIDTH_MAP.narrow).toBe('680px')

      pagelessManager.setWidth('full')
      expect(PAGELESS_WIDTH_MAP.full).toBe('100%')
    })

    it('notifies subscribers on view mode changes', () => {
      let notified = false
      const unsub = pagelessManager.subscribe((s) => {
        if (s.mode === 'pageless') notified = true
      })
      pagelessManager.setMode('pageless')
      expect(notified).toBe(true)
      unsub()
      pagelessManager.setMode('pages')
    })
  })
})