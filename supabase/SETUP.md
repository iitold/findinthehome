# Hướng dẫn thiết lập Supabase siêu đơn giản (1 Phút)

Quên những file SQL rườm rà đi, bây giờ mọi thứ đã được gom lại và hoàn toàn tự động!

## BƯỚC 1: Lấy API Keys từ Supabase
1. Tạo project tại [supabase.com](https://supabase.com).
2. Vào **Settings → API**, copy `Project URL` và `Anon public key`.
3. Vào **Settings → API**, lướt xuống phần `service_role` secret và copy nó.
4. Copy file `.env.example` thành `.env.local` và dán 3 giá trị vừa lấy vào.

## BƯỚC 2: Khởi tạo Database (Chỉ 1 Click)
1. Mở **SQL Editor** trong Supabase Dashboard.
2. Mở file `supabase/00_init_database.sql` trong project của bạn, copy toàn bộ nội dung.
3. Dán vào SQL Editor và ấn **Run**.
*(Thao tác này sẽ tự động tạo bảng, cài đặt bảo mật RLS, phân quyền Admin và các hàm tìm kiếm)*

## BƯỚC 3: Tạo Tài Khoản (Và Tận Hưởng)
1. Chạy project: `npm run dev`
2. Mở web ở `http://localhost:3000`, nhập Email và Password để **Đăng ký** tài khoản mới.

*(Hệ thống sẽ TỰ ĐỘNG nhận diện bạn là người đầu tiên, nâng cấp quyền thành Admin, và TỰ ĐỘNG chèn sẵn 17 đồ vật phân cấp vào tài khoản của bạn để bạn có thể trải nghiệm và sử dụng ngay lập tức!)*

🎉 **XONG! Bạn không cần làm thêm bất kỳ thao tác cơ sở dữ liệu nào nữa.**
