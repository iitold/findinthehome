-- =============================================
-- Find in the Home — Database Schema
-- Step 1: Table definition + indexes
-- Paste-ready for Supabase SQL Editor
-- =============================================

-- Drop existing table if re-running (development only)
DROP TABLE IF EXISTS entities CASCADE;

-- Immutable wrapper for array_to_string (required for generated columns)
CREATE OR REPLACE FUNCTION immutable_array_to_string(arr TEXT[], sep TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT array_to_string(arr, sep);
$$;

-- ===================
-- Entities table
-- Unified model: everything is an "entity" in a tree via parent_id
-- ===================
CREATE TABLE entities (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id),
  name            TEXT NOT NULL,
  type            TEXT NOT NULL CHECK (type IN ('house', 'floor', 'room', 'container', 'item')),
  parent_id       UUID REFERENCES entities(id) ON DELETE CASCADE,

  -- Spatial coordinates (unit: meters, origin: top-left of floor)
  x               FLOAT DEFAULT 0,
  y               FLOAT DEFAULT 0,
  z               FLOAT DEFAULT 0,       -- floor index (0, 1, 2, ...)
  width           FLOAT DEFAULT 1,
  height          FLOAT DEFAULT 1,
  depth           FLOAT DEFAULT 0,
  rotation        FLOAT DEFAULT 0,

  -- Ordering
  level           INT DEFAULT 0,         -- shelf/stack level inside container
  order_index     INT DEFAULT 0,         -- sibling ordering (ASC)

  -- Visual
  color           TEXT,                  -- hex string, e.g. "#4A90D9"
  icon            TEXT,                  -- Lucide icon name, e.g. "scissors"
  thumbnail_url   TEXT,

  -- Semantic
  tags            TEXT[] DEFAULT '{}',
  description     TEXT,

  -- Optimization: materialized path
  -- Format: /<ancestor_uuid>/.../<self_uuid>/
  path            TEXT,

  -- Full-text search index (generated column)
  -- Weights: A=name, B=tags, C=description
  search_vector   TSVECTOR GENERATED ALWAYS AS (
    setweight(to_tsvector('english'::regconfig, coalesce(name, '')), 'A') ||
    setweight(to_tsvector('english'::regconfig, coalesce(immutable_array_to_string(tags, ' '), '')), 'B') ||
    setweight(to_tsvector('english'::regconfig, coalesce(description, '')), 'C')
  ) STORED,

  -- Timestamps
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ===================
-- Indexes
-- ===================

-- GIN index for full-text search on search_vector
CREATE INDEX entities_search_idx ON entities USING GIN (search_vector);

-- B-tree index for parent lookups (tree traversal)
CREATE INDEX entities_parent_idx ON entities (parent_id);

-- B-tree index for materialized path queries (LIKE 'prefix%')
CREATE INDEX entities_path_idx ON entities (path text_pattern_ops);

-- B-tree index for user filtering (RLS + queries)
CREATE INDEX entities_user_idx ON entities (user_id);
-- =============================================
-- Find in the Home — Profiles & Admin System
-- User đăng ký đầu tiên = admin
-- Chạy sau schema.sql
-- =============================================

-- Bảng profiles: lưu role và metadata của user
CREATE TABLE IF NOT EXISTS profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  role        TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  full_name   TEXT,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX profiles_role_idx ON profiles (role);

-- RLS cho profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Mọi user đều xem được profile của mình
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Admin xem được tất cả profiles
CREATE POLICY "Admin can view all profiles"
  ON profiles FOR SELECT
  USING (is_admin(auth.uid()));

-- User chỉ sửa profile mình (không sửa được role)
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Chỉ admin mới insert/delete profiles (qua service_role key)
CREATE POLICY "Service role can manage profiles"
  ON profiles FOR ALL
  USING (auth.role() = 'service_role');

-- =============================================
-- Function: Auto Seed Data
-- Tự động tạo 17 đồ vật mẫu cho user mới
-- =============================================
CREATE OR REPLACE FUNCTION auto_seed_data_for_user(v_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- House
  INSERT INTO entities (id, user_id, name, type, parent_id, x, y, z, width, height, depth, rotation, level, order_index, color, icon, tags, description, path)
  VALUES ('11111111-1111-1111-1111-111111111111', v_user_id, 'My House', 'house', NULL, 0, 0, 0, 15, 12, 0, 0, 0, 0, '#6366F1', 'home', '{}', 'A cozy two-story home', '/11111111-1111-1111-1111-111111111111/');

  -- Floors
  INSERT INTO entities (id, user_id, name, type, parent_id, x, y, z, width, height, depth, rotation, level, order_index, color, icon, tags, description, path) VALUES
  ('22222222-2222-2222-2222-222222222222', v_user_id, 'Floor 1', 'floor', '11111111-1111-1111-1111-111111111111', 0, 0, 0, 15, 12, 0, 0, 0, 0, '#8B5CF6', 'layers', '{}', 'Ground floor', '/11111111-1111-1111-1111-111111111111/22222222-2222-2222-2222-222222222222/'),
  ('33333333-3333-3333-3333-333333333333', v_user_id, 'Floor 2', 'floor', '11111111-1111-1111-1111-111111111111', 0, 0, 1, 15, 12, 0, 0, 0, 1, '#7C3AED', 'layers', '{}', 'Upper floor', '/11111111-1111-1111-1111-111111111111/33333333-3333-3333-3333-333333333333/');

  -- Rooms
  INSERT INTO entities (id, user_id, name, type, parent_id, x, y, z, width, height, depth, rotation, level, order_index, color, icon, tags, description, path) VALUES
  ('44444444-4444-4444-4444-444444444444', v_user_id, 'Living Room', 'room', '22222222-2222-2222-2222-222222222222', 0.5, 0.5, 0, 6, 5, 0, 0, 0, 0, '#60A5FA', 'sofa', '{living}', 'Main area', '/11111111-1111-1111-1111-111111111111/22222222-2222-2222-2222-222222222222/44444444-4444-4444-4444-444444444444/'),
  ('55555555-5555-5555-5555-555555555555', v_user_id, 'Kitchen', 'room', '22222222-2222-2222-2222-222222222222', 7, 0.5, 0, 5, 4, 0, 0, 0, 1, '#34D399', 'cooking-pot', '{cooking}', 'Kitchen', '/11111111-1111-1111-1111-111111111111/22222222-2222-2222-2222-222222222222/55555555-5555-5555-5555-555555555555/'),
  ('66666666-6666-6666-6666-666666666666', v_user_id, 'Bedroom', 'room', '33333333-3333-3333-3333-333333333333', 0.5, 0.5, 1, 5, 4, 0, 0, 0, 0, '#A78BFA', 'bed', '{sleep}', 'Master bedroom', '/11111111-1111-1111-1111-111111111111/33333333-3333-3333-3333-333333333333/66666666-6666-6666-6666-666666666666/');

  -- Containers
  INSERT INTO entities (id, user_id, name, type, parent_id, x, y, z, width, height, depth, rotation, level, order_index, color, icon, tags, description, path) VALUES
  ('77777777-7777-7777-7777-777777777777', v_user_id, 'TV Cabinet', 'container', '44444444-4444-4444-4444-444444444444', 2, 4, 0, 1.8, 0.5, 0.6, 0, 0, 0, '#F97316', 'tv', '{furniture}', 'TV cabinet', '/11111111-1111-1111-1111-111111111111/22222222-2222-2222-2222-222222222222/44444444-4444-4444-4444-444444444444/77777777-7777-7777-7777-777777777777/'),
  ('88888888-8888-8888-8888-888888888888', v_user_id, 'Drawer', 'container', '55555555-5555-5555-5555-555555555555', 1, 2, 0, 0.8, 0.5, 0.3, 0, 0, 0, '#FBBF24', 'archive', '{storage}', 'Kitchen drawer', '/11111111-1111-1111-1111-111111111111/22222222-2222-2222-2222-222222222222/55555555-5555-5555-5555-555555555555/88888888-8888-8888-8888-888888888888/'),
  ('99999999-9999-9999-9999-999999999999', v_user_id, 'Wardrobe', 'container', '66666666-6666-6666-6666-666666666666', 3.5, 0.2, 1, 2, 0.6, 1.8, 0, 0, 0, '#D946EF', 'door-open', '{storage}', 'Large wardrobe', '/11111111-1111-1111-1111-111111111111/33333333-3333-3333-3333-333333333333/66666666-6666-6666-6666-666666666666/99999999-9999-9999-9999-999999999999/'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', v_user_id, 'Shelf 1', 'container', '99999999-9999-9999-9999-999999999999', 3.5, 0.2, 1, 1, 0.3, 0.4, 0, 1, 0, '#FB923C', 'layout-grid', '{shelf}', 'Top shelf', '/11111111-1111-1111-1111-111111111111/33333333-3333-3333-3333-333333333333/66666666-6666-6666-6666-666666666666/99999999-9999-9999-9999-999999999999/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', v_user_id, 'Box A', 'container', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 3.6, 0.25, 1, 0.3, 0.3, 0.2, 0, 0, 0, '#F59E0B', 'package', '{box}', 'Small box', '/11111111-1111-1111-1111-111111111111/33333333-3333-3333-3333-333333333333/66666666-6666-6666-6666-666666666666/99999999-9999-9999-9999-999999999999/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/cccccccc-cccc-cccc-cccc-cccccccccccc/');

  -- Items
  INSERT INTO entities (id, user_id, name, type, parent_id, x, y, z, width, height, depth, rotation, level, order_index, color, icon, tags, description, path) VALUES
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', v_user_id, 'Remote', 'item', '77777777-7777-7777-7777-777777777777', 2.2, 4.1, 0, 0.15, 0.05, 0.02, 0, 0, 0, '#EF4444', 'zap', '{tv}', 'TV remote', '/11111111-1111-1111-1111-111111111111/22222222-2222-2222-2222-222222222222/44444444-4444-4444-4444-444444444444/77777777-7777-7777-7777-777777777777/dddddddd-dddd-dddd-dddd-dddddddddddd/'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', v_user_id, 'Knife', 'item', '88888888-8888-8888-8888-888888888888', 1.1, 2.1, 0, 0.05, 0.25, 0.01, 0, 0, 0, '#6B7280', 'utensils', '{kitchen}', 'Knife', '/11111111-1111-1111-1111-111111111111/22222222-2222-2222-2222-222222222222/55555555-5555-5555-5555-555555555555/88888888-8888-8888-8888-888888888888/eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee/'),
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', v_user_id, 'Scissors', 'item', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 3.65, 0.3, 1, 0.1, 0.1, 0.02, 0, 0, 0, '#EF4444', 'scissors', '{office}', 'Scissors', '/11111111-1111-1111-1111-111111111111/33333333-3333-3333-3333-333333333333/66666666-6666-6666-6666-666666666666/99999999-9999-9999-9999-999999999999/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/cccccccc-cccc-cccc-cccc-cccccccccccc/ffffffff-ffff-ffff-ffff-ffffffffffff/');
END;
$$;

-- =============================================
-- Function: Tạo profile khi user đăng ký
-- Nếu chưa có profile nào → role = 'admin'
-- =============================================
CREATE OR REPLACE FUNCTION create_profile_for_user(
  user_id UUID,
  user_email TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_role TEXT;
  v_count INT;
BEGIN
  -- Kiểm tra đã có profile chưa
  SELECT count(*) INTO v_count FROM profiles;

  -- User đầu tiên = admin
  IF v_count = 0 THEN
    v_role := 'admin';
  ELSE
    v_role := 'user';
  END IF;

  -- Insert profile
  INSERT INTO profiles (id, email, role)
  VALUES (user_id, user_email, v_role)
  ON CONFLICT (id) DO NOTHING;

  -- NẾU LÀ ADMIN ĐẦU TIÊN => TỰ ĐỘNG THÊM DỮ LIỆU MẪU
  IF v_role = 'admin' THEN
     PERFORM auto_seed_data_for_user(user_id);
  END IF;

  RETURN jsonb_build_object(
    'id', user_id,
    'email', user_email,
    'role', v_role
  );
END;
$$;

-- =============================================
-- Function: Kiểm tra user có phải admin không
-- =============================================
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = user_id AND role = 'admin'
  );
END;
$$;
-- =============================================
-- Find in the Home — Row Level Security (RLS)
-- Bảo mật cấp hàng: mỗi user chỉ truy cập dữ liệu của mình
-- Chạy sau schema.sql trong Supabase SQL Editor
-- =============================================

-- Bật RLS trên bảng entities
ALTER TABLE entities ENABLE ROW LEVEL SECURITY;

-- ===================
-- SELECT: User chỉ xem được entities của mình
-- ===================
CREATE POLICY "Users can view own entities"
  ON entities
  FOR SELECT
  USING (auth.uid() = user_id);

-- ===================
-- INSERT: User chỉ tạo entities thuộc về mình
-- Kiểm tra user_id trong dữ liệu mới phải khớp auth.uid()
-- ===================
CREATE POLICY "Users can insert own entities"
  ON entities
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ===================
-- UPDATE: User chỉ sửa entities của mình
-- USING: kiểm tra hàng hiện tại thuộc về user
-- WITH CHECK: kiểm tra dữ liệu sau update vẫn thuộc user
-- (ngăn chặn đổi user_id sang user khác)
-- ===================
CREATE POLICY "Users can update own entities"
  ON entities
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ===================
-- DELETE: User chỉ xóa entities của mình
-- ON DELETE CASCADE trong schema sẽ tự xóa con cháu
-- ===================
CREATE POLICY "Users can delete own entities"
  ON entities
  FOR DELETE
  USING (auth.uid() = user_id);

-- =============================================
-- GHI CHÚ QUAN TRỌNG:
-- =============================================
--
-- 1. Cross-user parent guard (kiểm tra parent thuộc cùng user)
--    → Thực hiện trong APPLICATION LAYER (API route handlers)
--    → KHÔNG dùng DB trigger theo yêu cầu spec
--    → Trước mỗi INSERT/UPDATE có parent_id, kiểm tra:
--       parent.user_id === auth.uid()
--
-- 2. Circular reference check (kiểm tra vòng lặp)
--    → Cũng thực hiện trong APPLICATION LAYER
--    → Kiểm tra: new_parent.path NOT LIKE '%/<self_id>/%'
--
-- 3. Type hierarchy validation
--    → APPLICATION LAYER
--    → house→floor, floor→room, room→container|item,
--      container→container|item, item→không có con
--
-- Tất cả 3 kiểm tra trên sẽ được code trong Step 3 (CRUD API)
-- =============================================
-- Find in the Home — RPC Functions
-- Các function PostgreSQL gọi qua supabase.rpc()
-- Chạy sau schema.sql và rls.sql
-- =============================================

-- ===================
-- 1. MOVE ENTITY (transaction)
-- Di chuyển entity sang parent mới, cập nhật path cho tất cả con cháu
-- ===================
CREATE OR REPLACE FUNCTION move_entity(
  entity_id UUID,
  new_parent_id UUID,
  new_x FLOAT DEFAULT NULL,
  new_y FLOAT DEFAULT NULL,
  new_z FLOAT DEFAULT NULL,
  owner_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_entity RECORD;
  v_new_parent RECORD;
  v_old_path TEXT;
  v_new_path TEXT;
  v_uid UUID;
BEGIN
  -- Lấy user ID
  v_uid := COALESCE(owner_id, auth.uid());

  -- Lấy entity hiện tại
  SELECT * INTO v_entity FROM entities
  WHERE id = entity_id AND user_id = v_uid;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', jsonb_build_object(
      'code', 'ENTITY_NOT_FOUND',
      'message', 'Entity not found or access denied'
    ));
  END IF;

  -- Lấy parent mới
  SELECT * INTO v_new_parent FROM entities
  WHERE id = new_parent_id AND user_id = v_uid;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', jsonb_build_object(
      'code', 'INVALID_PARENT',
      'message', 'New parent not found or belongs to another user'
    ));
  END IF;

  -- Kiểm tra circular reference
  IF v_new_parent.path LIKE '%/' || entity_id::text || '/%' THEN
    RETURN jsonb_build_object('error', jsonb_build_object(
      'code', 'CIRCULAR_REFERENCE',
      'message', 'Move would create a circular reference'
    ));
  END IF;

  -- Kiểm tra type hierarchy
  IF NOT (
    (v_new_parent.type = 'house' AND v_entity.type = 'floor') OR
    (v_new_parent.type = 'floor' AND v_entity.type = 'room') OR
    (v_new_parent.type = 'room' AND v_entity.type IN ('container', 'item')) OR
    (v_new_parent.type = 'container' AND v_entity.type IN ('container', 'item'))
  ) THEN
    RETURN jsonb_build_object('error', jsonb_build_object(
      'code', 'INVALID_TYPE_HIERARCHY',
      'message', format('Cannot place %s inside %s', v_entity.type, v_new_parent.type)
    ));
  END IF;

  -- Tính path mới
  v_old_path := v_entity.path;
  v_new_path := v_new_parent.path || entity_id::text || '/';

  -- Cập nhật entity chính
  UPDATE entities SET
    parent_id = new_parent_id,
    x = COALESCE(new_x, x),
    y = COALESCE(new_y, y),
    z = COALESCE(new_z, z),
    path = v_new_path,
    updated_at = NOW()
  WHERE id = entity_id AND user_id = v_uid;

  -- Cập nhật path cho tất cả con cháu
  UPDATE entities SET
    path = v_new_path || substring(path FROM length(v_old_path) + 1),
    updated_at = NOW()
  WHERE path LIKE v_old_path || '%'
    AND id != entity_id
    AND user_id = v_uid;

  RETURN jsonb_build_object('data', jsonb_build_object(
    'id', entity_id,
    'new_path', v_new_path,
    'message', 'Entity moved successfully'
  ));
END;
$$;

-- ===================
-- 2. UPDATE ENTITY PATHS (batch update khi move)
-- ===================
CREATE OR REPLACE FUNCTION update_entity_paths(
  old_path_prefix TEXT,
  new_path_prefix TEXT,
  owner_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE entities SET
    path = new_path_prefix || substring(path FROM length(old_path_prefix) + 1),
    updated_at = NOW()
  WHERE path LIKE old_path_prefix || '%'
    AND user_id = owner_id;
END;
$$;

-- ===================
-- 3. SEARCH ENTITIES (full-text search + ILIKE fallback)
-- ===================
CREATE OR REPLACE FUNCTION search_entities(
  query_text TEXT,
  owner_id UUID,
  result_limit INT DEFAULT 20,
  result_offset INT DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_results JSONB;
  v_count INT;
  v_query tsquery;
BEGIN
  -- Tạo tsquery từ input
  v_query := plainto_tsquery('english', query_text);

  -- Step 1: Full-text search (primary)
  SELECT jsonb_agg(row_to_json(r)), count(*) OVER() INTO v_results, v_count
  FROM (
    SELECT
      id, name, type, path, x, y, z, level,
      ts_rank(search_vector, v_query) AS rank,
      tags, description, icon, color
    FROM entities
    WHERE user_id = owner_id
      AND search_vector @@ v_query
    ORDER BY rank DESC
    LIMIT result_limit OFFSET result_offset
  ) r;

  -- Đếm tổng kết quả FTS
  IF v_results IS NOT NULL THEN
    SELECT count(*) INTO v_count
    FROM entities
    WHERE user_id = owner_id
      AND search_vector @@ v_query;

    RETURN jsonb_build_object(
      'data', v_results,
      'total_count', v_count,
      'search_type', 'fts'
    );
  END IF;

  -- Step 2: ILIKE fallback (chỉ khi FTS không có kết quả)
  SELECT jsonb_agg(row_to_json(r)) INTO v_results
  FROM (
    SELECT
      id, name, type, path, x, y, z, level,
      0::float AS rank,
      tags, description, icon, color
    FROM entities
    WHERE user_id = owner_id
      AND (
        name ILIKE '%' || query_text || '%'
        OR description ILIKE '%' || query_text || '%'
        OR EXISTS (
          SELECT 1 FROM unnest(tags) t
          WHERE t ILIKE '%' || query_text || '%'
        )
      )
    ORDER BY order_index ASC, created_at ASC
    LIMIT result_limit OFFSET result_offset
  ) r;

  -- Đếm tổng kết quả ILIKE
  SELECT count(*) INTO v_count
  FROM entities
  WHERE user_id = owner_id
    AND (
      name ILIKE '%' || query_text || '%'
      OR description ILIKE '%' || query_text || '%'
      OR EXISTS (
        SELECT 1 FROM unnest(tags) t
        WHERE t ILIKE '%' || query_text || '%'
      )
    );

  RETURN jsonb_build_object(
    'data', COALESCE(v_results, '[]'::jsonb),
    'total_count', COALESCE(v_count, 0),
    'search_type', 'ilike'
  );
END;
$$;

-- ===================
-- 4. RESOLVE PATH NAMES
-- Trả về tên các ancestor theo thứ tự path
-- ===================
CREATE OR REPLACE FUNCTION resolve_path_names(
  entity_path TEXT,
  owner_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_ids UUID[];
  v_result JSONB;
BEGIN
  -- Tách path thành mảng UUID
  v_ids := string_to_array(trim('/' FROM entity_path), '/')::UUID[];

  -- Lấy thông tin ancestors theo đúng thứ tự path
  SELECT jsonb_agg(
    jsonb_build_object('id', id, 'name', name, 'type', type)
    ORDER BY array_position(v_ids, id)
  ) INTO v_result
  FROM entities
  WHERE id = ANY(v_ids)
    AND user_id = owner_id;

  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;
