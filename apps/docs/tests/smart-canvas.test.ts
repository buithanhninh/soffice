import { describe, it, expect } from 'vitest'
import { SmartChips, DEFAULT_PROJECT_STATUSES, DEFAULT_PRIORITIES } from '../src/renderer/smart-canvas/smart-chips'
import { CodeBlockEngine } from '../src/renderer/smart-canvas/code-block'
import { BuildingBlocks } from '../src/renderer/smart-canvas/building-blocks'

describe('Smart Canvas & Interactive Chips (Milestone D1)', () => {
  describe('Smart Chips: Date, Dropdown, People & Checklist', () => {
    it('creates date chip with ISO string and relative shortcuts', () => {
      const chip = SmartChips.createDateChip('2026-10-05')
      expect(chip.type).toBe('date')
      expect(chip.date).toBe('2026-10-05')
      expect(SmartChips.formatDate(chip.date, 'DD/MM/YYYY')).toBe('05/10/2026')

      const todayChip = SmartChips.createDateChip('@today')
      expect(todayChip.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })

    it('creates dropdown status and allows switching states', () => {
      let dropdown = SmartChips.createDropdownStatus('not_started', DEFAULT_PROJECT_STATUSES)
      expect(dropdown.currentKey).toBe('not_started')

      dropdown = SmartChips.switchStatus(dropdown, 'in_progress')
      expect(dropdown.currentKey).toBe('in_progress')
      const opt = SmartChips.getCurrentStatusOption(dropdown)
      expect(opt.label).toBe('Đang thực hiện')
      expect(opt.color).toBe('#0d6efd')
    })

    it('creates people chips and handles checklists', () => {
      const person = SmartChips.createPeopleChip('@Bùi Thành Ninh', 'ninh@soffice.caqa.io.vn')
      expect(person.name).toBe('Bùi Thành Ninh')
      expect(person.email).toBe('ninh@soffice.caqa.io.vn')

      let item = SmartChips.createChecklistItem('Viết báo cáo kỹ thuật', false)
      expect(item.checked).toBe(false)
      item = SmartChips.toggleChecklist(item)
      expect(item.checked).toBe(true)
    })

    it('renders clean HTML markup for smart chips', () => {
      const dateChip = SmartChips.createDateChip('2026-10-05')
      const html = SmartChips.renderHtml(dateChip)
      expect(html).toContain('doc-chip-date')
      expect(html).toContain('05/10/2026')
    })
  })

  describe('Code Block Engine with Syntax Highlighting', () => {
    it('tokenizes JavaScript and TypeScript keywords, strings, and comments', () => {
      const code = `
        // Khởi tạo ứng dụng sOffice
        const appName = "sOffice Docs";
        function init(count) {
          return count * 2;
        }
      `
      const tokens = CodeBlockEngine.tokenize(code, 'javascript')
      expect(tokens.some((t) => t.type === 'comment')).toBe(true)
      expect(tokens.some((t) => t.type === 'keyword' && t.text === 'const')).toBe(true)
      expect(tokens.some((t) => t.type === 'string')).toBe(true)
      expect(tokens.some((t) => t.type === 'function' && t.text === 'init')).toBe(true)
    })

    it('tokenizes Python comments and keywords', () => {
      const code = '# Python script\ndef run():\n    return 42'
      const tokens = CodeBlockEngine.tokenize(code, 'python')
      expect(tokens[0]?.type).toBe('comment')
      expect(tokens.some((t) => t.type === 'keyword' && t.text === 'def')).toBe(true)
    })

    it('renders code block container with header and line numbers', () => {
      const html = CodeBlockEngine.renderHtml({
        language: 'typescript',
        code: 'const x: number = 100;',
      })
      expect(html).toContain('doc-code-block')
      expect(html).toContain('TYPESCRIPT')
      expect(html).toContain('line-number')
      expect(html).toContain('line-content')
    })
  })

  describe('Interactive Building Blocks', () => {
    it('generates Meeting Notes template with Date and Checklist', () => {
      const tmpl = BuildingBlocks.getMeetingNotesTemplate('Bùi Thành Ninh')
      expect(tmpl.id).toBe('meeting-notes')
      expect(tmpl.contentHtml).toContain('Biên Bản Cuộc Họp')
      expect(tmpl.contentHtml).toContain('Bùi Thành Ninh')
      expect(tmpl.contentHtml).toContain('doc-chip-date')
      expect(tmpl.contentHtml).toContain('doc-chip-dropdown')
    })

    it('generates Project Roadmap template with Priority & Status pills', () => {
      const tmpl = BuildingBlocks.getProjectRoadmapTemplate()
      expect(tmpl.id).toBe('project-roadmap')
      expect(tmpl.contentHtml).toContain('Kế Hoạch & Lộ Trình Phát Triển Dự Án')
      expect(tmpl.contentHtml).toContain('Smart Canvas')
    })
  })
})