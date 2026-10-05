/**
 * Prompt-to-Document Blueprint Generator for sOffice Docs.
 * Transforms user prompts into fully-structured professional document layouts.
 *
 * Author: Bùi Thành Ninh <https://soffice.caqa.io.vn>
 */

export interface GeneratedSection {
  heading: string;
  level: number;
  paragraphs: string[];
}

export interface GeneratedDocumentBlueprint {
  title: string;
  subtitle?: string;
  author: string;
  date: string;
  sections: GeneratedSection[];
}

export const PromptToDocument = {
  createBlueprint(
    prompt: string,
    author = 'Bùi Thành Ninh'
  ): GeneratedDocumentBlueprint {
    const today = new Date().toISOString().slice(0, 10);
    const p = prompt.trim();

    if (p.toLowerCase().includes('hợp đồng') || p.toLowerCase().includes('contract')) {
      return {
        title: 'HỢP ĐỒNG CUNG CẤP DỊCH VỤ CÔNG NGHỆ',
        subtitle: 'Căn cứ Bộ luật Dân sự và nhu cầu thực tế của các bên',
        author,
        date: today,
        sections: [
          {
            heading: 'Điều 1: Mục Đích & Phạm Vi Hợp Đồng',
            level: 1,
            paragraphs: [
              'Bên A đồng ý thuê và Bên B đồng ý cung cấp dịch vụ phát triển phần mềm sOffice theo các tiêu chí kỹ thuật đã cam kết.',
              'Chi tiết các hạng mục và tiến độ bàn giao được quy định tại Phụ lục đính kèm hợp đồng này.',
            ],
          },
          {
            heading: 'Điều 2: Giá Trị Hợp Đồng & Phương Thức Thanh Toán',
            level: 1,
            paragraphs: [
              'Tổng giá trị hợp đồng được xác định theo dự toán thỏa thuận giữa hai bên.',
              'Phương thức thanh toán: Chuyển khoản ngân hàng trong vòng 15 ngày kể từ ngày nghiệm thu từng giai đoạn.',
            ],
          },
          {
            heading: 'Điều 3: Trách Nhiệm Của Các Bên',
            level: 1,
            paragraphs: [
              'Bên B cam kết bảo đảm chất lượng kỹ thuật, tính bảo mật và bàn giao mã nguồn sạch đạt chuẩn 100% không lỗi.',
            ],
          },
        ],
      };
    }

    // Default business report blueprint
    return {
      title: p.toUpperCase(),
      subtitle: 'Tài liệu báo cáo chiến lược sOffice Docs',
      author,
      date: today,
      sections: [
        {
          heading: '1. Tổng Quan & Mục Tiêu',
          level: 1,
          paragraphs: [
            `Tài liệu này được lập nhằm phân tích và triển khai các giải pháp nâng cao hiệu quả cho: ${p}.`,
          ],
        },
        {
          heading: '2. Đánh Giá Hiện Trạng & Giải Pháp',
          level: 1,
          paragraphs: [
            'Hệ thống đang hoạt động ổn định với các module cốt lõi được tối ưu hóa toàn diện.',
            'Áp dụng kiến trúc module hiện đại giúp nâng cao năng suất soạn thảo và tính tương thích.',
          ],
        },
        {
          heading: '3. Kế Hoạch Thực Hiện & Phân Công',
          level: 1,
          paragraphs: [
            'Tiến hành kiểm thử nhiều vòng và nghiệm thu theo đúng tiêu chuẩn chất lượng cao nhất.',
          ],
        },
      ],
    };
  },
};