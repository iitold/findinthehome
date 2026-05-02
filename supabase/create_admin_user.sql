-- Xóa user cũ nếu đã tồn tại (để tránh lỗi trùng lặp)
DELETE FROM auth.users WHERE email = 'itold@demo.com';

-- Tạo user mới trong bảng auth.users
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'itold@demo.com',
  crypt('Itold@2026', gen_salt('bf')),
  current_timestamp,
  current_timestamp,
  current_timestamp,
  '{"provider":"email","providers":["email"]}',
  '{}',
  current_timestamp,
  current_timestamp,
  '',
  '',
  '',
  ''
);

-- Xóa profile cũ nếu có (Trigger của auth.users có thể đã tự tạo profile, nhưng ta sẽ cập nhật lại)
DELETE FROM public.profiles WHERE email = 'itold@demo.com';

-- Tạo profile và set quyền admin
INSERT INTO public.profiles (id, email, role, created_at, updated_at)
SELECT 
  id,
  'itold@demo.com',
  'admin',
  current_timestamp,
  current_timestamp
FROM auth.users 
WHERE email = 'itold@demo.com';
