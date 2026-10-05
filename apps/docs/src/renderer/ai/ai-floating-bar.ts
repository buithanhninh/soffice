/**
 * In-Line Floating AI Assistant Engine for sOffice Docs.
 * Provides quick actions on selected text: Rewrite (4 tones), Polish/Grammar,
 * Summarize, Translate, Expand, and Shorten.
 *
 * Author: Bùi Thành Ninh <https://soffice.caqa.io.vn>
 */

export type AiTone = 'professional' | 'formal' | 'casual' | 'concise';

export interface AiActionRequest {
  action: 'rewrite' | 'grammar' | 'summarize' | 'translate' | 'expand' | 'shorten';
  text: string;
  tone?: AiTone;
  targetLang?: string;
}

export const AiFloatingAssistant = {
  buildSystemInstruction(request: AiActionRequest): string {
    switch (request.action) {
      case 'rewrite': {
        const toneDesc = {
          professional: 'chuyên nghiệp, chuẩn mực doanh nghiệp, từ ngữ gãy gọn',
          formal: 'trang trọng, văn phong hành chính, chuẩn mực nghị định',
          casual: 'tự nhiên, gần gũi, dễ hiểu, sinh động',
          concise: 'ngắn gọn, cô đọng, đi thẳng vào trọng tâm',
        }[request.tone || 'professional'];
        return `Bạn là trợ lý biên tập sOffice Docs. Hãy viết lại đoạn văn sau theo văn phong ${toneDesc}. Chỉ trả về nội dung đã viết lại, không giải thích thêm:`;
      }
      case 'grammar':
        return 'Bạn là chuyên gia hiệu đính văn bản sOffice Docs. Hãy sửa toàn bộ lỗi chính tả, dấu câu và ngữ pháp trong đoạn văn sau (hỗ trợ cả tiếng Việt và tiếng Anh). Giữ nguyên cấu trúc ý chính và chỉ trả về đoạn văn đã sửa:';
      case 'summarize':
        return 'Hãy tóm tắt đoạn văn sau thành các điểm chính ngắn gọn, súc tích:';
      case 'translate':
        return `Hãy dịch đoạn văn sau sang ${request.targetLang || 'tiếng Anh'}. Đảm bảo ngữ nghĩa chính xác, thuật ngữ văn phòng chuyên nghiệp:`;
      case 'expand':
        return 'Hãy mở rộng và phát triển thêm các luận điểm chi tiết, dẫn chứng cho đoạn văn sau nhưng vẫn giữ tính mạch lạc:';
      case 'shorten':
        return 'Hãy rút gọn đoạn văn sau thành phiên bản ngắn nhất có thể mà vẫn đầy đủ thông điệp cốt lõi:';
    }
  },

  /**
   * Deterministic local fallback generator for testing and offline scenarios.
   */
  simulateLocalExecution(request: AiActionRequest): string {
    const raw = request.text.trim();
    if (!raw) return '';

    switch (request.action) {
      case 'rewrite':
        return `[${(request.tone || 'professional').toUpperCase()}] ${raw}`;
      case 'grammar':
        return raw.replace(/\s+/g, ' ').replace(/\s+([.,;:!?])/g, '$1');
      case 'summarize':
        return `Tóm tắt: ${raw.slice(0, 80)}...`;
      case 'translate':
        return `[${(request.targetLang || 'EN').toUpperCase()}] ${raw}`;
      case 'expand':
        return `${raw} Hơn nữa, việc này còn mang lại nhiều giá trị thiết thực và lâu dài.`;
      case 'shorten':
        return raw.split('.')[0] || raw;
    }
  },
};