# 🏠 Find in the Home 

[![🇻🇳 Tiếng Việt](#tiếng-việt-vietnamese)]() | [![🇬🇧 English](#english)]()

---

<h2 id="english">🇬🇧 English</h2>

**Find in the Home** is a smart web application that helps you digitize your house layout, pinpoint the exact location of furniture, and keep track of where you store your belongings. Say goodbye to tearing your house apart just to find a pair of scissors!

Designed as a modern Family Assistant, the application focuses on the core experience: **Lightning-fast search with precise room-level navigation**.

### ✨ Key Features
- 🗺️ **Drag & Drop Canvas Mapping**: Design your floor plan with Walls, Doors, Windows, Rooms, and Containers directly in the browser using Konva.js.
- 🔍 **Hero Search & Zoom-to-Room**: An intelligent search bar. Upon finding an item, the map automatically flies (zooms) to the containing room and highlights it for instant orientation.
- 📱 **Mobile-First Optimization**: Highly responsive UI. The Location Card slides up smoothly from the bottom, enabling easy one-handed operation.
- 🌓 **Light / Dark Mode**: Seamless theme switching to reduce eye strain.
- 🌐 **Internationalization (i18n)**: Supports both English and Vietnamese natively.
- 🔒 **Auth & Permissions**: Robust User and Admin management system.

### 🛠️ Tech Stack
- **Frontend**: Next.js 14+ (App Router), React, Konva.js (Canvas), Vanilla CSS (Glassmorphism).
- **Backend & Database**: Supabase (PostgreSQL, Authentication, Row Level Security).
- **Hosting**: Vercel.

### 🚀 Local Setup Guide

#### 1. Database Setup (Supabase)
1. Go to [Supabase](https://supabase.com/) and create a new project.
2. Navigate to the **SQL Editor** -> Create a new query.
3. Open `supabase/01_master_schema.sql` from this repository, copy its contents, and paste it into the SQL Editor.
4. Click **Run** to generate all necessary Tables, Functions, and RLS Policies.
5. (Optional) Run `profiles.sql` or `rls.sql` if you need advanced custom security configurations.

#### 2. Environment Variables
1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
2. In Supabase, go to **Project Settings** -> **API**.
3. Fill in the values in `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://[YOUR_PROJECT_ID].supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=[YOUR_ANON_KEY]
   SUPABASE_SERVICE_ROLE_KEY=[YOUR_SERVICE_ROLE_KEY]
   ```

#### 3. Run the application
```bash
npm install
npm run dev
```
Access the app at: `http://localhost:3000`

### ☁️ Vercel Deployment Guide

Since this app is built with Next.js, deploying it to Vercel is the optimal and **free** solution.

1. Push this repository to your **GitHub** account.
2. Log in to [Vercel](https://vercel.com/), select **Add New...** -> **Project**.
3. Select the `findinthehome` repository from your GitHub and click **Import**.
4. In the **Environment Variables** section, add your 3 Supabase keys:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (Required for Admin functionalities like managing users)
5. Click **Deploy** and wait a few minutes.
6. 🎉 **Done!** Vercel will provide you with a `.vercel.app` URL to access your app from anywhere.

---

<br/>

<h2 id="tiếng-việt-vietnamese">🇻🇳 Tiếng Việt</h2>

**Find in the Home** là một ứng dụng web thông minh giúp bạn số hóa sơ đồ ngôi nhà, đánh dấu vị trí các kệ tủ và ghi chú chính xác nơi bạn cất giữ đồ đạc. Không bao giờ còn tình trạng "bới tung cả nhà để tìm một chiếc kéo" nữa!

Được thiết kế với phong cách hiện đại, trực quan như một trợ lý gia đình (Family Assistant), ứng dụng tập trung vào trải nghiệm cốt lõi: **Tìm kiếm cực nhanh và dẫn đường chính xác đến tận phòng**.

### ✨ Tính Năng Nổi Bật
- 🗺️ **Bản Đồ Canvas Kéo Thả (Drag & Drop)**: Tự thiết kế sơ đồ nhà với Tường, Cửa, Cửa Sổ, Phòng, và Kệ/Tủ trực tiếp trên trình duyệt bằng Konva.js.
- 🔍 **Hero Search & Zoom-to-Room**: Thanh tìm kiếm thông minh. Khi tìm thấy đồ, bản đồ sẽ tự động bay (zoom) tới đúng căn phòng đó và làm sáng căn phòng lên để bạn định hướng ngay lập tức.
- 📱 **Tối Ưu Hóa Di Động (Mobile-First)**: Giao diện cực kỳ thân thiện với điện thoại. Thẻ chỉ đường (Location Card) trượt lên mượt mà từ đáy màn hình giúp thao tác 1 tay dễ dàng.
- 🌓 **Light / Dark Mode**: Hỗ trợ chuyển đổi Sáng/Tối mượt mà bảo vệ mắt.
- 🌐 **Đa Ngôn Ngữ (i18n)**: Hỗ trợ tiếng Việt và tiếng Anh.
- 🔒 **Đăng Nhập / Phân Quyền**: Hệ thống quản lý User và Admin mạnh mẽ.

### 🛠️ Công Nghệ Sử Dụng
- **Frontend**: Next.js 14+ (App Router), React, Konva.js (Canvas), CSS Vanilla (Glassmorphism).
- **Backend & Database**: Supabase (PostgreSQL, Authentication, Row Level Security).
- **Hosting**: Vercel.

### 🚀 Hướng Dẫn Cài Đặt & Chạy Cục Bộ (Local)

#### 1. Chuẩn bị Cơ sở dữ liệu (Supabase)
1. Truy cập [Supabase](https://supabase.com/) và tạo một Project mới.
2. Tại thanh menu bên trái, vào **SQL Editor** -> Tạo một Query mới.
3. Mở file `supabase/01_master_schema.sql` trong mã nguồn này, copy toàn bộ nội dung và dán vào SQL Editor trên Supabase.
4. Bấm **Run** để Supabase tự động tạo tất cả Bảng (Tables), Hàm (Functions), và Chính sách bảo mật (RLS).
5. (Tuỳ chọn) Chạy thêm các file `profiles.sql` hoặc `rls.sql` nếu bạn muốn tuỳ chỉnh sâu hơn về bảo mật.

#### 2. Thiết lập Biến Môi Trường
1. Copy file `.env.example` thành `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
2. Vào Supabase -> **Project Settings** -> **API**.
3. Điền thông tin vào `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://[YOUR_PROJECT_ID].supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=[YOUR_ANON_KEY]
   SUPABASE_SERVICE_ROLE_KEY=[YOUR_SERVICE_ROLE_KEY]
   ```

#### 3. Chạy ứng dụng
```bash
npm install
npm run dev
```
Truy cập: `http://localhost:3000`

### ☁️ Hướng Dẫn Triển Khai Lên Vercel (Deployment)

Vì ứng dụng được xây dựng bằng Next.js, việc đưa nó lên mạng với Vercel là phương án hoàn hảo và hoàn toàn **miễn phí**.

1. Đẩy mã nguồn này lên kho lưu trữ **GitHub** của bạn.
2. Đăng nhập vào [Vercel](https://vercel.com/), chọn **Add New...** -> **Project**.
3. Chọn kho lưu trữ `findinthehome` từ GitHub của bạn và bấm **Import**.
4. Ở phần **Environment Variables**, hãy thêm đúng 3 biến môi trường bạn đã lấy từ Supabase:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (Bắt buộc để tính năng Admin Panel như thêm/xoá/đổi mật khẩu User hoạt động)
5. Bấm **Deploy** và đợi vài phút.
6. 🎉 **Hoàn tất!** Vercel sẽ cung cấp cho bạn một đường link `.vercel.app` để truy cập ứng dụng từ bất cứ đâu.

---

## 👨‍💻 Author / Tác giả

Developed with ♥ by [**itold**](https://github.com/iitold/findinthehome).
If you find this project useful, please give it a ⭐!
*(Nếu bạn thấy hữu ích, hãy cho kho lưu trữ một ⭐ nhé!)*
