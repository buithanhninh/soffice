import { describe, it, expect } from 'vitest'
import { AiFloatingAssistant } from '../src/renderer/ai/ai-floating-bar'
import { PromptToDocument } from '../src/renderer/ai/prompt-to-document'
import { DocConsistencyChecker } from '../src/renderer/ai/doc-consistency-checker'
import { MailMergeEngine } from '../src/renderer/mail-merge/mail-merge-engine'

describe('In-Line AI Assistant & Mail Merge Engine (Milestones D5 & D6)', () => {
  describe('In-Line AI Assistant & Tone Rewriter', () => {
    it('constructs tailored system prompts for 4 tone rewrites', () => {
      const pProf = AiFloatingAssistant.buildSystemInstruction({
        action: 'rewrite',
        text: 'Nội dung',
        tone: 'professional',
      })
      expect(pProf).toContain('chuyên nghiệp')

      const pFormal = AiFloatingAssistant.buildSystemInstruction({
        action: 'rewrite',
        text: 'Nội dung',
        tone: 'formal',
      })
      expect(pFormal).toContain('trang trọng')

      const pConcise = AiFloatingAssistant.buildSystemInstruction({
        action: 'rewrite',
        text: 'Nội dung',
        tone: 'concise',
      })
      expect(pConcise).toContain('ngắn gọn')
    })

    it('handles grammar polish, summarize, and translation instructions', () => {
      const pGrammar = AiFloatingAssistant.buildSystemInstruction({ action: 'grammar', text: 'Sai loi' })
      expect(pGrammar).toContain('hiệu đính')

      const pTranslate = AiFloatingAssistant.buildSystemInstruction({
        action: 'translate',
        text: 'Hello',
        targetLang: 'tiếng Việt',
      })
      expect(pTranslate).toContain('tiếng Việt')
    })

    it('simulates local deterministic fallback execution', () => {
      const res = AiFloatingAssistant.simulateLocalExecution({
        action: 'rewrite',
        text: 'Thông báo nội bộ',
        tone: 'formal',
      })
      expect(res).toContain('[FORMAL]')
    })
  })

  describe('Prompt-to-Document Blueprint Generator', () => {
    it('generates contract blueprint with standard legal clauses', () => {
      const doc = PromptToDocument.createBlueprint('Hợp đồng phát triển phần mềm sOffice', 'Bùi Thành Ninh')
      expect(doc.title).toContain('HỢP ĐỒNG')
      expect(doc.author).toBe('Bùi Thành Ninh')
      expect(doc.sections.length).toBeGreaterThanOrEqual(3)
      expect(doc.sections[0]?.heading).toContain('Điều 1')
    })

    it('generates business strategy report blueprint', () => {
      const doc = PromptToDocument.createBlueprint('Chiến Lược Chuyển Đổi Số')
      expect(doc.title).toContain('CHIẾN LƯỢC')
      expect(doc.sections[0]?.heading).toContain('Tổng Quan')
    })
  })

  describe('Document Typographical Consistency Checker', () => {
    it('detects multiple spaces and hanging punctuation', () => {
      const text = 'Đây là  văn bản có lỗi , cần sửa .'
      const issues = DocConsistencyChecker.scanText(text)
      expect(issues.some((i) => i.type === 'double_space')).toBe(true)
      expect(issues.some((i) => i.type === 'hanging_punctuation')).toBe(true)
    })
  })

  describe('Mail Merge Engine', () => {
    const template = 'Kính gửi ông/bà {{FullName}}, công ty {{Company}} thông báo mã hợp đồng: «ContractId».'
    const records = [
      { FullName: 'Nguyễn Văn An', Company: 'Công ty ABC', ContractId: 'HD-001' },
      { FullName: 'Trần Thị Bình', Company: 'Công ty XYZ', ContractId: 'HD-002' },
    ]

    it('extracts merge tokens from both {{...}} and «...» notations', () => {
      const engine = new MailMergeEngine(template, records)
      const tokens = engine.extractFieldTokens()
      expect(tokens).toContain('FullName')
      expect(tokens).toContain('Company')
      expect(tokens).toContain('ContractId')
    })

    it('merges single record substituting placeholder tokens', () => {
      const engine = new MailMergeEngine(template, records)
      const merged = engine.mergeSingle(records[0]!)
      expect(merged).toBe('Kính gửi ông/bà Nguyễn Văn An, công ty Công ty ABC thông báo mã hợp đồng: HD-001.')
    })

    it('navigates through records for interactive live preview', () => {
      const engine = new MailMergeEngine(template, records)
      expect(engine.getCurrentIndex()).toBe(0)
      expect(engine.getCurrentPreview()).toContain('Nguyễn Văn An')

      engine.nextRecord()
      expect(engine.getCurrentIndex()).toBe(1)
      expect(engine.getCurrentPreview()).toContain('Trần Thị Bình')

      engine.prevRecord()
      expect(engine.getCurrentIndex()).toBe(0)
    })

    it('merges all records into individual documents and combined output', () => {
      const engine = new MailMergeEngine(template, records)
      const all = engine.mergeAll('FullName')
      expect(all).toHaveLength(2)
      expect(all[0]?.filename).toBe('Document_Nguy_n_V_n_An.docx')

      const combined = engine.mergeCombined()
      expect(combined).toContain('Nguyễn Văn An')
      expect(combined).toContain('Trần Thị Bình')
      expect(combined).toContain('---PAGE-BREAK---')
    })
  })
})