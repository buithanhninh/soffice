/**
 * Interactive Building Blocks & Modular Templates for sOffice Docs.
 * Injects pre-structured templates such as Meeting Notes, Project Roadmaps, and Review Trackers.
 *
 * Author: Bùi Thành Ninh <https://soffice.caqa.io.vn>
 */

export interface BuildingBlockTemplate {
  id: string;
  title: string;
  description: string;
  icon: string;
  contentHtml: string;
}

export const BuildingBlocks = {
  getMeetingNotesTemplate(author = 'Bùi Thành Ninh'): BuildingBlockTemplate {
    const today = new Date().toISOString().slice(0, 10);
    return {
      id: 'meeting-notes',
      title: 'Biên Bản Cuộc Họp (Meeting Notes)',
      description: 'Mẫu biên bản họp chuyên nghiệp kèm thẻ ngày, danh sách người dự và bảng hành động.',
      icon: '📋',
      contentHtml: `
<h2>Biên Bản Cuộc Họp</h2>
<p><strong>Ngày họp:</strong> <span class="doc-smart-chip doc-chip-date" data-date="${today}"><span class="chip-icon">📅</span> ${today}</span></p>
<p><strong>Người tham gia:</strong> <span class="doc-smart-chip doc-chip-people"><span class="chip-avatar">👤</span> ${author}</span>, <span class="doc-smart-chip doc-chip-people"><span class="chip-avatar">👤</span> Khách mời / Đối tác</span></p>
<h3>1. Mục Tiêu & Chương Trình</h3>
<ul>
  <li>Tổng kết tiến độ các hạng mục tuần vừa qua.</li>
  <li>Thống nhất phương án nâng cấp sản phẩm và kế hoạch phân công.</li>
</ul>
<h3>2. Nội Dung Thảo Luận</h3>
<p>Các bên đã thảo luận chi tiết và đồng thuận các tiêu chí kỹ thuật đề ra.</p>
<h3>3. Kế Hoạch Hành Động (Action Items)</h3>
<table border="1" cellpadding="6" style="border-collapse: collapse; width: 100%;">
  <thead>
    <tr style="background-color: #f1f3f5;">
      <th>Nhiệm Vụ</th>
      <th>Người Phụ Trách</th>
      <th>Trạng Thái</th>
      <th>Hạn Hoàn Thành</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Hoàn thiện module tính năng sOffice</td>
      <td>${author}</td>
      <td><span class="doc-smart-chip doc-chip-dropdown" data-key="in_progress" style="color:#0d6efd;background-color:#e7f1ff">● Đang thực hiện</span></td>
      <td>${today}</td>
    </tr>
    <tr>
      <td>Kiểm thử nghiệm thu và báo cáo</td>
      <td>QA Team</td>
      <td><span class="doc-smart-chip doc-chip-dropdown" data-key="not_started" style="color:#6c757d;background-color:#f1f3f5">● Chưa bắt đầu</span></td>
      <td>${today}</td>
    </tr>
  </tbody>
</table>
<p></p>
`.trim(),
    };
  },

  getProjectRoadmapTemplate(): BuildingBlockTemplate {
    return {
      id: 'project-roadmap',
      title: 'Lộ Trình Dự Án (Project Roadmap)',
      description: 'Bảng theo dõi kế hoạch phát triển với mức độ ưu tiên và trạng thái màu sắc trực quan.',
      icon: '🚀',
      contentHtml: `
<h2>Kế Hoạch & Lộ Trình Phát Triển Dự Án</h2>
<p>Bảng tổng hợp các giai đoạn phát triển và phân công công việc.</p>
<table border="1" cellpadding="6" style="border-collapse: collapse; width: 100%;">
  <thead>
    <tr style="background-color: #f8f9fa;">
      <th>Hạng Mục Tính Năng</th>
      <th>Ưu Tiên</th>
      <th>Trạng Thái</th>
      <th>Tiến Độ (%)</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Smart Canvas & Thẻ Thông Minh (@ Chips)</td>
      <td><span class="doc-smart-chip doc-chip-dropdown" data-key="urgent" style="color:#721c24;background-color:#f5c6cb">● Khẩn cấp (P0)</span></td>
      <td><span class="doc-smart-chip doc-chip-dropdown" data-key="approved" style="color:#198754;background-color:#d1e7dd">● Đã hoàn thành</span></td>
      <td>100%</td>
    </tr>
    <tr>
      <td>Chế Độ Xem Không Phân Trang (Pageless)</td>
      <td><span class="doc-smart-chip doc-chip-dropdown" data-key="high" style="color:#dc3545;background-color:#f8d7da">● Cao (P1)</span></td>
      <td><span class="doc-smart-chip doc-chip-dropdown" data-key="in_progress" style="color:#0d6efd;background-color:#e7f1ff">● Đang thực hiện</span></td>
      <td>80%</td>
    </tr>
    <tr>
      <td>Công Thức Bảng Biểu Word (=SUM/AVG)</td>
      <td><span class="doc-smart-chip doc-chip-dropdown" data-key="high" style="color:#dc3545;background-color:#f8d7da">● Cao (P1)</span></td>
      <td><span class="doc-smart-chip doc-chip-dropdown" data-key="not_started" style="color:#6c757d;background-color:#f1f3f5">● Chưa bắt đầu</span></td>
      <td>0%</td>
    </tr>
  </tbody>
</table>
<p></p>
`.trim(),
    };
  },

  getAllTemplates(author = 'Bùi Thành Ninh'): BuildingBlockTemplate[] {
    return [
      this.getMeetingNotesTemplate(author),
      this.getProjectRoadmapTemplate(),
    ];
  },
};