<p align="center">
  <a href="https://soffice.caqa.io.vn/">
    <img src="https://soffice.caqa.io.vn/logo.jpg" alt="sOffice Logo" width="120" style="border-radius: 20px;">
  </a>
</p>

<h1 align="center">sOffice — Bộ Ứng Dụng Văn Phòng AI Thế Hệ Mới</h1>

<p align="center"><b>Phiên bản chính thức do tác giả Bùi Thành Ninh phát triển.</b><br>
Bộ ứng dụng văn phòng AI thông minh cho Docs, Sheets, Slides, PDF, Markdown và HTML, đồng bộ hoàn toàn với nền tảng trực tuyến <a href="https://soffice.caqa.io.vn">soffice.caqa.io.vn</a>.</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-Apache--2.0-blue.svg" alt="License: Apache-2.0"></a>
  <a href="https://github.com/buithanhninh/soffice/releases/latest"><img src="https://img.shields.io/github/v/release/buithanhninh/soffice" alt="Bản phát hành mới nhất"></a>
  <a href="https://github.com/buithanhninh/soffice/releases"><img src="https://img.shields.io/github/downloads/buithanhninh/soffice/total" alt="Tổng lượt tải"></a>
  <a href="https://soffice.caqa.io.vn"><img src="https://img.shields.io/badge/Website-soffice.caqa.io.vn-teal" alt="Website chính thức"></a>
  <a href="https://github.com/buithanhninh/soffice"><img src="https://img.shields.io/badge/Tác_giả-Bùi_Thành_Ninh-green" alt="Tác giả"></a>
</p>

---

## 🌟 Giới thiệu

**sOffice** là bộ ứng dụng văn phòng AI thông minh thế hệ mới, chạy trên máy tính (Desktop App) và hỗ trợ đa nền tảng **Windows**, **macOS**, và **Linux**. Ứng dụng hỗ trợ mở, chỉnh sửa và lưu trực tiếp các định dạng chuẩn quốc tế `.docx` (Word), `.xlsx` (Excel), `.pptx` (PowerPoint), cùng môi trường làm việc mạnh mẽ với PDF, Markdown và HTML.

Mỗi tài liệu trong **sOffice** đều được tích hợp một trợ lý AI thông minh bên cạnh — không chỉ là khung chat đơn thuần mà là một công cụ hiểu sâu nội dung, thực hiện các thao tác chỉnh sửa trực tiếp, hỗ trợ lập công thức, tạo biểu đồ và sinh bản trình chiếu tự động.

---

## ✨ Điểm nổi bật & Tính năng cốt lõi

- **Bảo toàn nguyên bản định dạng (Byte-Preserving)**: Mở và lưu các tệp Microsoft Word, Excel, PowerPoint với độ chính xác cao. Chỉ phần nội dung được chỉnh sửa mới được ghi nhận thay đổi, giữ nguyên vẹn bố cục tài liệu.
- **Hệ thống AI Provider tiên tiến**:
  - Tích hợp chuẩn **OpenAI** (ChatGPT: GPT-4o, GPT-4o-mini) làm AI mặc định cho toàn hệ thống.
  - Hỗ trợ linh hoạt **Google Gemini** (Gemini 1.5 Pro, Gemini 1.5 Flash).
  - Cơ chế **BYOK (Bring Your Own Key)**: Lưu trữ và mã hóa khóa API cục bộ trên máy tính của bạn (On-Device Security), không qua máy chủ trung gian.
  - Dễ dàng cấu hình và kiểm tra kết nối API Key trực tiếp trong menu **Cài đặt (Settings > Integrations)**.
- **Bộ công cụ văn phòng toàn diện**:
  - **sOffice Docs**: Soạn thảo văn bản chuyên nghiệp, quản lý mục lục, ngắt trang, kiểm tra chính tả & ngữ pháp, tóm tắt nội dung và dịch thuật tự động.
  - **sOffice Sheets**: Bảng tính chuẩn Excel, hỗ trợ đầy đủ công thức (SUM, AVERAGE, VLOOKUP, IF,...), vẽ biểu đồ động và phân tích tài chính chuyên sâu với sAI Studio.
  - **sOffice Slides**: Thiết kế bản trình chiếu, hỗ trợ AI sinh silde tự động theo yêu cầu, hiệu ứng chuyển trang và bố cục đa dạng.
  - **sOffice PDF**: Đọc, đánh dấu, ghi chú và chuyển đổi PDF sang các định dạng văn phòng trực tiếp trên thiết bị.
  - **sOffice Markdown & HTML**: Soạn thảo văn bản kỹ thuật và trang web trực quan.
- **Hoạt động cục bộ & Tối ưu hiệu năng (Local by Design)**:
  - Ứng dụng khởi động nhanh, mượt mà, tiêu tốn ít tài nguyên bộ nhớ.
  - Mọi thao tác xử lý dữ liệu tài liệu đều diễn ra tại thiết bị cá nhân.

---

## 📥 Tải về & Cài đặt

Truy cập trang [GitHub Releases](https://github.com/buithanhninh/soffice/releases/latest) hoặc website [soffice.caqa.io.vn](https://soffice.caqa.io.vn) để tải bộ cài đặt phù hợp với hệ điều hành của bạn:

| Hệ điều hành | Định dạng gói cài đặt | Mô tả |
| :--- | :--- | :--- |
| **Windows** | `sOffice-Setup-0.10.0.exe` | Bộ cài đặt chuẩn NSIS cho Windows 10/11 (64-bit) |
| **Linux (AppImage)** | `sOffice-0.10.0.AppImage` | Chạy ngay lập tức trên mọi distro Linux không cần cài đặt |
| **Linux (Ubuntu/Debian)** | `soffice_0.10.0_amd64.deb` | Gói cài đặt chuẩn `.deb` cho Debian, Ubuntu, Mint |
| **Linux (Fedora/RHEL)** | `soffice-0.10.0.x86_64.rpm` | Gói cài đặt chuẩn `.rpm` cho Fedora, CentOS, RHEL |
| **macOS** | DMG (Apple Silicon / Intel) | Đóng gói tự động qua CI/CD đa kiến trúc |

---

## ⚙️ Cấu hình AI

1. Mở ứng dụng **sOffice**.
2. Nhấn biểu tượng bánh răng **Cài đặt (Settings)** ở góc dưới cùng bên trái (hoặc nhấn `Ctrl + ,`).
3. Chọn mục **Integrations** (hoặc AI Models).
4. Nhập khóa API của bạn:
   - **OpenAI API Key**: `sk-...`
   - **Google Gemini API Key**: `AIza...`
5. Nhấn **Test Connection** để kiểm tra tính hợp lệ của khóa. Hệ thống sẽ tự động lưu trữ an toàn.

---

## 🛠️ Hướng dẫn phát triển từ mã nguồn (Development)

### Yêu cầu hệ thống
- **Node.js**: `>= 22.12.0`
- **npm**: `>= 10.0.0`

### Cài đặt dependencies
```bash
git clone https://github.com/buithanhninh/soffice.git
cd soffice
npm install
```

### Chạy ở chế độ phát triển (Development)
```bash
npm run dev
```

### Kiểm tra chất lượng mã nguồn (Typecheck & Test)
```bash
# Kiểm tra TypeScript toàn bộ 25 workspaces
npm run typecheck

# Chạy toàn bộ các bài kiểm thử tự động
npm run test
```

### Đóng gói ứng dụng (Build & Package)
```bash
# Đóng gói cho Linux (.deb, .AppImage, .rpm)
npm run dist:linux

# Đóng gói cho Windows (.exe NSIS)
npm run dist:win

# Đóng gói cho macOS
npm run dist:mac
```

---

## 📄 Bản quyền & Tác giả

- **Tác giả phát triển**: **Bùi Thành Ninh**
- **Website chính thức**: [https://soffice.caqa.io.vn](https://soffice.caqa.io.vn)
- **Email hỗ trợ**: [support@soffice.caqa.io.vn](mailto:support@soffice.caqa.io.vn)
- **Giấy phép**: Phát hành theo giấy phép [Apache License 2.0](LICENSE).
