# 🏠 Find in the Home (Bản Đồ Tìm Đồ Trong Nhà)

**Find in the Home** là một ứng dụng web thông minh giúp bạn số hóa sơ đồ ngôi nhà, đánh dấu vị trí các kệ tủ và ghi chú chính xác nơi bạn cất giữ đồ đạc. Không bao giờ còn tình trạng "bới tung cả nhà để tìm một chiếc kéo" nữa!

Được thiết kế với phong cách hiện đại, trực quan như một trợ lý gia đình (Family Assistant), ứng dụng tập trung vào trải nghiệm cốt lõi: **Tìm kiếm cực nhanh và dẫn đường chính xác đến tận phòng**.

---

## ✨ Tính Năng Nổi Bật

- 🗺️ **Bản Đồ Canvas Kéo Thả (Drag & Drop)**: Tự thiết kế sơ đồ nhà với Tường, Cửa, Cửa Sổ, Phòng, và Kệ/Tủ trực tiếp trên trình duyệt bằng Konva.js.
- 🔍 **Hero Search & Zoom-to-Room**: Thanh tìm kiếm thông minh. Khi tìm thấy đồ, bản đồ sẽ tự động bay (zoom) tới đúng căn phòng đó và làm sáng căn phòng lên để bạn định hướng ngay lập tức.
- 📱 **Tối Ưu Hóa Di Động (Mobile-First)**: Giao diện cực kỳ thân thiện với điện thoại. Thẻ chỉ đường (Location Card) trượt lên mượt mà từ đáy màn hình giúp thao tác 1 tay dễ dàng.
- 🌓 **Light / Dark Mode**: Hỗ trợ chuyển đổi Sáng/Tối mượt mà bảo vệ mắt.
- 🌐 **Đa Ngôn Ngữ (i18n)**: Hỗ trợ tiếng Việt và tiếng Anh.
- 🔒 **Đăng Nhập / Phân Quyền**: Hệ thống quản lý User và Admin mạnh mẽ.

---

## 🛠️ Công Nghệ Sử Dụng

- **Frontend**: Next.js 14+ (App Router), React, Konva.js (Canvas), CSS Vanilla (Glassmorphism).
- **Backend & Database**: Supabase (PostgreSQL, Authentication, Row Level Security).
- **Hosting**: Vercel.

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Cục Bộ (Local)

### 1. Chuẩn bị Cơ sở dữ liệu (Supabase)
1. Truy cập [Supabase](https://supabase.com/) và tạo một Project mới.
2. Tại thanh menu bên trái, vào **SQL Editor** -> Tạo một Query mới.
3. Mở file `supabase/01_master_schema.sql` trong mã nguồn này, copy toàn bộ nội dung và dán vào SQL Editor trên Supabase.
4. Bấm **Run** để Supabase tự động tạo tất cả Bảng (Tables), Hàm (Functions), và Chính sách bảo mật (RLS).
5. (Tuỳ chọn) Chạy thêm các file `profiles.sql` hoặc `rls.sql` nếu bạn muốn tuỳ chỉnh sâu hơn về bảo mật.

### 2. Thiết lập Biến Môi Trường
1. Copy file `.env.example` thành `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
2. Vào Supabase -> **Project Settings** -> **API**.
3. Điền thông tin vào `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://[YOUR_PROJECT_ID].supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=[YOUR_ANON_KEY]
   ```

### 3. Chạy ứng dụng
```bash
npm install
npm run dev
```
Truy cập: `http://localhost:3000`

---

## ☁️ Hướng Dẫn Triển Khai Lên Vercel (Deployment)

Vì ứng dụng được xây dựng bằng Next.js, việc đưa nó lên mạng với Vercel là phương án hoàn hảo và hoàn toàn **miễn phí**.

1. Đẩy mã nguồn này lên kho lưu trữ **GitHub** của bạn.
2. Đăng nhập vào [Vercel](https://vercel.com/), chọn **Add New...** -> **Project**.
3. Chọn kho lưu trữ `findinthehome` từ GitHub của bạn và bấm **Import**.
4. Ở phần **Environment Variables**, hãy thêm đúng 2 biến môi trường bạn đã lấy từ Supabase:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Bấm **Deploy** và đợi vài phút.
6. 🎉 **Hoàn tất!** Vercel sẽ cung cấp cho bạn một đường link `.vercel.app` để truy cập ứng dụng từ bất cứ đâu.

---

## 👨‍💻 Tác giả

Dự án được khởi tạo và phát triển bởi [**itold**](https://github.com/iitold/findinthehome).
Nếu bạn thấy hữu ích, hãy cho kho lưu trữ một ⭐ nhé!
