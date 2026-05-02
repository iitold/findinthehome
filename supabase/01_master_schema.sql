-- =============================================
-- Find in the Home — Master Database Schema (STEP 1)
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
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  type            TEXT NOT NULL CHECK (type IN (
                    'house','floor','room',
                    'wall','door','window',
                    'furniture','container','item'
                  )),
  subtype         TEXT,
  parent_id       UUID REFERENCES entities(id) ON DELETE CASCADE,

  -- spatial (unit: meters, origin: top-left of parent)
  x               FLOAT DEFAULT 0,
  y               FLOAT DEFAULT 0,
  z               FLOAT DEFAULT 0,       -- floor index (0, 1, 2, ...)
  width           FLOAT DEFAULT 1,
  height          FLOAT DEFAULT 1,
  depth           FLOAT DEFAULT 0,
  rotation        FLOAT DEFAULT 0,

  -- structural flags
  is_structural   BOOLEAN DEFAULT false,
  is_passable     BOOLEAN DEFAULT false,
  is_fixed        BOOLEAN DEFAULT true,
  mount_type      TEXT CHECK (mount_type IN ('floor','wall','ceiling','built-in')) DEFAULT 'floor',
  wall_side       TEXT CHECK (wall_side IN ('north','south','east','west')),

  -- door/window geometry
  swing_direction TEXT CHECK (swing_direction IN ('inward','outward','sliding','double')),
  hinge_side      TEXT CHECK (hinge_side IN ('left','right')),
  swing_angle     FLOAT DEFAULT 90,

  -- stacking / ordering
  level           INT DEFAULT 0,         -- shelf/stack level inside container
  order_index     INT DEFAULT 0,         -- sibling ordering (ASC)

  -- visual
  color           TEXT,
  icon            TEXT,
  thumbnail_url   TEXT,

  -- semantic
  tags            TEXT[] DEFAULT '{}',
  description     TEXT,

  -- usage tracking
  last_accessed_at TIMESTAMPTZ,
  access_count    INT DEFAULT 0,

  -- optimization: materialized path
  path            TEXT,

  -- Full-text search index (generated column)
  search_vector   TSVECTOR GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(immutable_array_to_string(tags, ' '), '')), 'B') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'C')
  ) STORED,

  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ===================
-- Indexes
-- ===================
CREATE INDEX entities_search_idx ON entities USING GIN (search_vector);
CREATE INDEX entities_parent_idx ON entities (parent_id);
CREATE INDEX entities_path_idx   ON entities (path text_pattern_ops);
CREATE INDEX entities_user_idx   ON entities (user_id);
CREATE INDEX entities_type_idx   ON entities (type);
CREATE INDEX entities_z_idx      ON entities (z, user_id);

-- =============================================
-- Find in the Home — Row Level Security (RLS)
-- =============================================
ALTER TABLE entities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own entities" ON entities FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own entities" ON entities FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own entities" ON entities FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own entities" ON entities FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- Function: Auto Seed Data matching Section 18
-- =============================================
CREATE OR REPLACE FUNCTION auto_seed_data_for_user(v_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_house UUID := gen_random_uuid();
  v_floor1 UUID := gen_random_uuid();
  v_floor2 UUID := gen_random_uuid();
  v_living UUID := gen_random_uuid();
  v_kitchen UUID := gen_random_uuid();
  v_bedroom UUID := gen_random_uuid();
  
  -- UUIDs for Living Room walls
  v_lr_wn UUID := gen_random_uuid();
  v_lr_ws UUID := gen_random_uuid();
  v_lr_we UUID := gen_random_uuid();
  v_lr_ww UUID := gen_random_uuid();

  -- UUIDs for Kitchen walls
  v_ki_wn UUID := gen_random_uuid();
  v_ki_ws UUID := gen_random_uuid();
  v_ki_we UUID := gen_random_uuid();
  v_ki_ww UUID := gen_random_uuid();

  -- UUIDs for Bedroom walls
  v_bd_wn UUID := gen_random_uuid();
  v_bd_ws UUID := gen_random_uuid();
  v_bd_we UUID := gen_random_uuid();
  v_bd_ww UUID := gen_random_uuid();

  v_tv_cabinet UUID := gen_random_uuid();
  v_drawer UUID := gen_random_uuid();
  v_wardrobe UUID := gen_random_uuid();
  v_shelf1 UUID := gen_random_uuid();
  v_shelf2 UUID := gen_random_uuid();
  v_box_a UUID := gen_random_uuid();
BEGIN
  -- House
  INSERT INTO entities (id, user_id, name, type, parent_id, x, y, width, height, path) VALUES
  (v_house, v_user_id, 'Nhà của tôi', 'house', null, 0, 0, 1, 1, '/' || v_house || '/');

  -- Floors
  INSERT INTO entities (id, user_id, name, type, parent_id, x, y, z, width, height, order_index, path) VALUES
  (v_floor1, v_user_id, 'Tầng 1', 'floor', v_house, 0, 0, 0, 15, 12, 0, '/' || v_house || '/' || v_floor1 || '/'),
  (v_floor2, v_user_id, 'Tầng 2', 'floor', v_house, 0, 0, 1, 15, 12, 1, '/' || v_house || '/' || v_floor2 || '/');

  -- Rooms
  INSERT INTO entities (id, user_id, name, type, parent_id, x, y, z, width, height, order_index, path) VALUES
  (v_living, v_user_id, 'Phòng Khách', 'room', v_floor1, 0, 0, 0, 6, 5, 0, '/' || v_house || '/' || v_floor1 || '/' || v_living || '/'),
  (v_kitchen, v_user_id, 'Phòng Bếp', 'room', v_floor1, 7, 0, 0, 4, 3, 1, '/' || v_house || '/' || v_floor1 || '/' || v_kitchen || '/'),
  (v_bedroom, v_user_id, 'Phòng Ngủ', 'room', v_floor2, 0, 0, 1, 5, 4, 0, '/' || v_house || '/' || v_floor2 || '/' || v_bedroom || '/');

  -- Living Room Walls (depth = 0.15)
  INSERT INTO entities (id, user_id, name, type, parent_id, x, y, width, height, depth, is_structural, is_fixed, wall_side, path) VALUES
  (v_lr_wn, v_user_id, 'Tường Bắc', 'wall', v_living, 0, 0, 6, 0.15, 0.15, true, true, 'north', '/' || v_house || '/' || v_floor1 || '/' || v_living || '/' || v_lr_wn || '/'),
  (v_lr_ws, v_user_id, 'Tường Nam', 'wall', v_living, 0, 4.85, 6, 0.15, 0.15, true, true, 'south', '/' || v_house || '/' || v_floor1 || '/' || v_living || '/' || v_lr_ws || '/'),
  (v_lr_we, v_user_id, 'Tường Đông', 'wall', v_living, 5.85, 0, 0.15, 5, 0.15, true, true, 'east', '/' || v_house || '/' || v_floor1 || '/' || v_living || '/' || v_lr_we || '/'),
  (v_lr_ww, v_user_id, 'Tường Tây', 'wall', v_living, 0, 0, 0.15, 5, 0.15, true, true, 'west', '/' || v_house || '/' || v_floor1 || '/' || v_living || '/' || v_lr_ww || '/');

  -- Living Room Door (south wall)
  INSERT INTO entities (id, user_id, name, type, subtype, parent_id, x, y, width, height, is_structural, is_passable, swing_direction, hinge_side, swing_angle, path) VALUES
  ('00000000-0000-0000-1100-000000000001', v_user_id, 'Cửa Chính', 'door', 'single', v_lr_ws, 1, 0, 0.9, 0.15, true, true, 'inward', 'left', 90, '/' || v_house || '/' || v_floor1 || '/' || v_living || '/' || v_lr_ws || '/00000000-0000-0000-1100-000000000001/');

  -- Living Room Window (east wall)
  INSERT INTO entities (id, user_id, name, type, subtype, parent_id, x, y, width, height, is_structural, path) VALUES
  ('00000000-0000-0000-1200-000000000001', v_user_id, 'Cửa Sổ', 'window', 'standard', v_lr_we, 0, 1.5, 0.15, 1.2, true, '/' || v_house || '/' || v_floor1 || '/' || v_living || '/' || v_lr_we || '/00000000-0000-0000-1200-000000000001/');

  -- Living Room Furniture & Containers
  INSERT INTO entities (id, user_id, name, type, subtype, parent_id, x, y, width, height, icon, is_fixed, path) VALUES
  ('00000000-0000-0000-1300-000000000001', v_user_id, 'Ghế Sofa', 'furniture', 'sofa', v_living, 1.5, 1, 3, 1, 'sofa', false, '/' || v_house || '/' || v_floor1 || '/' || v_living || '/00000000-0000-0000-1300-000000000001/'),
  ('00000000-0000-0000-1300-000000000002', v_user_id, 'Kệ TV', 'furniture', 'tv', v_living, 2.25, 4.3, 1.5, 0.4, 'tv', false, '/' || v_house || '/' || v_floor1 || '/' || v_living || '/00000000-0000-0000-1300-000000000002/');
  
  INSERT INTO entities (id, user_id, name, type, subtype, parent_id, x, y, width, height, icon, is_fixed, path) VALUES
  (v_tv_cabinet, v_user_id, 'Tủ TV', 'container', 'cabinet', v_living, 2.25, 4.3, 1.5, 0.4, 'box', false, '/' || v_house || '/' || v_floor1 || '/' || v_living || '/' || v_tv_cabinet || '/');

  -- Remote Control
  INSERT INTO entities (id, user_id, name, type, parent_id, tags, path) VALUES
  ('00000000-0000-0000-1400-000000000001', v_user_id, 'Điều Khiển TV', 'item', v_tv_cabinet, '{remote,electronics}', '/' || v_house || '/' || v_floor1 || '/' || v_living || '/' || v_tv_cabinet || '/00000000-0000-0000-1400-000000000001/');

  -- Kitchen Walls
  INSERT INTO entities (id, user_id, name, type, parent_id, x, y, width, height, depth, is_structural, is_fixed, wall_side, path) VALUES
  (v_ki_wn, v_user_id, 'Tường Bắc', 'wall', v_kitchen, 0, 0, 4, 0.15, 0.15, true, true, 'north', '/' || v_house || '/' || v_floor1 || '/' || v_kitchen || '/' || v_ki_wn || '/'),
  (v_ki_ws, v_user_id, 'Tường Nam', 'wall', v_kitchen, 0, 2.85, 4, 0.15, 0.15, true, true, 'south', '/' || v_house || '/' || v_floor1 || '/' || v_kitchen || '/' || v_ki_ws || '/'),
  (v_ki_we, v_user_id, 'Tường Đông', 'wall', v_kitchen, 3.85, 0, 0.15, 3, 0.15, true, true, 'east', '/' || v_house || '/' || v_floor1 || '/' || v_kitchen || '/' || v_ki_we || '/'),
  (v_ki_ww, v_user_id, 'Tường Tây', 'wall', v_kitchen, 0, 0, 0.15, 3, 0.15, true, true, 'west', '/' || v_house || '/' || v_floor1 || '/' || v_kitchen || '/' || v_ki_ww || '/');

  -- Kitchen Door (west wall)
  INSERT INTO entities (id, user_id, name, type, subtype, parent_id, x, y, width, height, is_structural, is_passable, swing_direction, hinge_side, swing_angle, path) VALUES
  ('00000000-0000-0000-2100-000000000001', v_user_id, 'Cửa', 'door', 'single', v_ki_ww, 0, 1, 0.15, 0.9, true, true, 'outward', 'right', 90, '/' || v_house || '/' || v_floor1 || '/' || v_kitchen || '/' || v_ki_ww || '/00000000-0000-0000-2100-000000000001/');

  -- Kitchen Window (north wall)
  INSERT INTO entities (id, user_id, name, type, subtype, parent_id, x, y, width, height, is_structural, path) VALUES
  ('00000000-0000-0000-2200-000000000001', v_user_id, 'Cửa Sổ', 'window', 'standard', v_ki_wn, 1.5, 0, 1.0, 0.15, true, '/' || v_house || '/' || v_floor1 || '/' || v_kitchen || '/' || v_ki_wn || '/00000000-0000-0000-2200-000000000001/');

  -- Kitchen Furniture
  INSERT INTO entities (id, user_id, name, type, subtype, parent_id, x, y, width, height, icon, is_fixed, path) VALUES
  ('00000000-0000-0000-2300-000000000001', v_user_id, 'Tủ Lạnh', 'furniture', 'fridge', v_kitchen, 0.5, 0.5, 0.8, 0.8, 'refrigerator', false, '/' || v_house || '/' || v_floor1 || '/' || v_kitchen || '/00000000-0000-0000-2300-000000000001/'),
  ('00000000-0000-0000-2300-000000000002', v_user_id, 'Bếp Lò', 'furniture', 'stove', v_kitchen, 1.5, 0.5, 0.8, 0.6, 'flame', false, '/' || v_house || '/' || v_floor1 || '/' || v_kitchen || '/00000000-0000-0000-2300-000000000002/'),
  ('00000000-0000-0000-2300-000000000003', v_user_id, 'Bồn Rửa', 'furniture', 'sink', v_kitchen, 2.5, 0.5, 0.8, 0.6, 'droplet', false, '/' || v_house || '/' || v_floor1 || '/' || v_kitchen || '/00000000-0000-0000-2300-000000000003/');

  -- Kitchen Drawer
  INSERT INTO entities (id, user_id, name, type, subtype, parent_id, x, y, width, height, icon, is_fixed, path) VALUES
  (v_drawer, v_user_id, 'Ngăn Kéo', 'container', 'drawer', v_kitchen, 2, 2, 0.8, 0.5, 'archive', false, '/' || v_house || '/' || v_floor1 || '/' || v_kitchen || '/' || v_drawer || '/');

  -- Knife
  INSERT INTO entities (id, user_id, name, type, parent_id, tags, path) VALUES
  ('00000000-0000-0000-2400-000000000001', v_user_id, 'Dao', 'item', v_drawer, '{sharp,kitchen,tool}', '/' || v_house || '/' || v_floor1 || '/' || v_kitchen || '/' || v_drawer || '/00000000-0000-0000-2400-000000000001/');

  -- Bedroom Walls
  INSERT INTO entities (id, user_id, name, type, parent_id, x, y, width, height, depth, is_structural, is_fixed, wall_side, path) VALUES
  (v_bd_wn, v_user_id, 'Tường Bắc', 'wall', v_bedroom, 0, 0, 5, 0.15, 0.15, true, true, 'north', '/' || v_house || '/' || v_floor2 || '/' || v_bedroom || '/' || v_bd_wn || '/'),
  (v_bd_ws, v_user_id, 'Tường Nam', 'wall', v_bedroom, 0, 3.85, 5, 0.15, 0.15, true, true, 'south', '/' || v_house || '/' || v_floor2 || '/' || v_bedroom || '/' || v_bd_ws || '/'),
  (v_bd_we, v_user_id, 'Tường Đông', 'wall', v_bedroom, 4.85, 0, 0.15, 4, 0.15, true, true, 'east', '/' || v_house || '/' || v_floor2 || '/' || v_bedroom || '/' || v_bd_we || '/'),
  (v_bd_ww, v_user_id, 'Tường Tây', 'wall', v_bedroom, 0, 0, 0.15, 4, 0.15, true, true, 'west', '/' || v_house || '/' || v_floor2 || '/' || v_bedroom || '/' || v_bd_ww || '/');

  -- Bedroom Door
  INSERT INTO entities (id, user_id, name, type, subtype, parent_id, x, y, width, height, is_structural, is_passable, swing_direction, hinge_side, swing_angle, path) VALUES
  ('00000000-0000-0000-3100-000000000001', v_user_id, 'Cửa', 'door', 'single', v_bd_ws, 1, 0, 0.9, 0.15, true, true, 'inward', 'right', 90, '/' || v_house || '/' || v_floor2 || '/' || v_bedroom || '/' || v_bd_ws || '/00000000-0000-0000-3100-000000000001/');

  -- Bedroom Window
  INSERT INTO entities (id, user_id, name, type, subtype, parent_id, x, y, width, height, is_structural, path) VALUES
  ('00000000-0000-0000-3200-000000000001', v_user_id, 'Cửa Sổ', 'window', 'standard', v_bd_we, 0, 1.5, 0.15, 1.0, true, '/' || v_house || '/' || v_floor2 || '/' || v_bedroom || '/' || v_bd_we || '/00000000-0000-0000-3200-000000000001/');

  -- Bedroom Furniture
  INSERT INTO entities (id, user_id, name, type, subtype, parent_id, x, y, width, height, icon, is_fixed, path) VALUES
  ('00000000-0000-0000-3300-000000000001', v_user_id, 'Giường', 'furniture', 'bed', v_bedroom, 2, 0.5, 2, 1.8, 'bed', false, '/' || v_house || '/' || v_floor2 || '/' || v_bedroom || '/00000000-0000-0000-3300-000000000001/'),
  ('00000000-0000-0000-3300-000000000002', v_user_id, 'Bàn Làm Việc', 'furniture', 'desk', v_bedroom, 0.5, 2.5, 1.2, 0.6, 'laptop', false, '/' || v_house || '/' || v_floor2 || '/' || v_bedroom || '/00000000-0000-0000-3300-000000000002/');

  -- Bedroom Wardrobe
  INSERT INTO entities (id, user_id, name, type, subtype, parent_id, x, y, width, height, icon, is_fixed, path) VALUES
  (v_wardrobe, v_user_id, 'Tủ Quần Áo', 'container', 'wardrobe', v_bedroom, 0.5, 0.5, 1.2, 0.6, 'door-open', false, '/' || v_house || '/' || v_floor2 || '/' || v_bedroom || '/' || v_wardrobe || '/');

  -- Shelves (Level 1 and 2)
  INSERT INTO entities (id, user_id, name, type, subtype, parent_id, level, icon, path) VALUES
  (v_shelf1, v_user_id, 'Kệ 1', 'container', 'shelf_unit', v_wardrobe, 1, 'layout-grid', '/' || v_house || '/' || v_floor2 || '/' || v_bedroom || '/' || v_wardrobe || '/' || v_shelf1 || '/'),
  (v_shelf2, v_user_id, 'Kệ 2', 'container', 'shelf_unit', v_wardrobe, 2, 'layout-grid', '/' || v_house || '/' || v_floor2 || '/' || v_bedroom || '/' || v_wardrobe || '/' || v_shelf2 || '/');

  -- Box A (on Shelf 1)
  INSERT INTO entities (id, user_id, name, type, subtype, parent_id, description, icon, path) VALUES
  (v_box_a, v_user_id, 'Hộp A', 'container', 'box', v_shelf1, 'Small cardboard box on first shelf', 'package', '/' || v_house || '/' || v_floor2 || '/' || v_bedroom || '/' || v_wardrobe || '/' || v_shelf1 || '/' || v_box_a || '/');

  -- Items inside Box A and Shelves
  INSERT INTO entities (id, user_id, name, type, parent_id, tags, path) VALUES
  ('00000000-0000-0000-3400-000000000001', v_user_id, 'Cái Kéo', 'item', v_box_a, '{sharp,tool,office}', '/' || v_house || '/' || v_floor2 || '/' || v_bedroom || '/' || v_wardrobe || '/' || v_shelf1 || '/' || v_box_a || '/00000000-0000-0000-3400-000000000001/'),
  ('00000000-0000-0000-3400-000000000002', v_user_id, 'Đồng Hồ', 'item', v_shelf1, '{accessory,valuables}', '/' || v_house || '/' || v_floor2 || '/' || v_bedroom || '/' || v_wardrobe || '/' || v_shelf1 || '/00000000-0000-0000-3400-000000000002/'),
  ('00000000-0000-0000-3400-000000000003', v_user_id, 'Kính Mắt', 'item', v_shelf2, '{accessory,optical}', '/' || v_house || '/' || v_floor2 || '/' || v_bedroom || '/' || v_wardrobe || '/' || v_shelf2 || '/00000000-0000-0000-3400-000000000003/');

END;
$$;

-- =============================================
-- Profile Functions (Keep existing logic)
-- =============================================
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM profiles WHERE id = user_id AND role = 'admin');
END;
$$;

CREATE OR REPLACE FUNCTION create_profile_for_user(user_id UUID, user_email TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_role TEXT;
  v_count INT;
BEGIN
  SELECT count(*) INTO v_count FROM profiles;
  IF v_count = 0 THEN v_role := 'admin'; ELSE v_role := 'user'; END IF;
  
  INSERT INTO profiles (id, email, role) VALUES (user_id, user_email, v_role) ON CONFLICT (id) DO NOTHING;
  
  IF v_role = 'admin' THEN
     PERFORM auto_seed_data_for_user(user_id);
  END IF;

  RETURN jsonb_build_object('id', user_id, 'email', user_email, 'role', v_role);
END;
$$;

-- =============================================
-- RPC Functions
-- =============================================

-- ===================
-- 1. MOVE ENTITY (transaction)
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
  v_uid := COALESCE(owner_id, auth.uid());

  SELECT * INTO v_entity FROM entities WHERE id = entity_id AND user_id = v_uid;
  IF NOT FOUND THEN RETURN jsonb_build_object('error', jsonb_build_object('code', 'ENTITY_NOT_FOUND', 'message', 'Entity not found')); END IF;

  SELECT * INTO v_new_parent FROM entities WHERE id = new_parent_id AND user_id = v_uid;
  IF NOT FOUND THEN RETURN jsonb_build_object('error', jsonb_build_object('code', 'INVALID_PARENT', 'message', 'New parent not found')); END IF;

  IF v_new_parent.path LIKE '%/' || entity_id::text || '/%' THEN
    RETURN jsonb_build_object('error', jsonb_build_object('code', 'CIRCULAR_REFERENCE', 'message', 'Move would create a circular reference'));
  END IF;

  -- Type hierarchy check using standard valid rules
  IF NOT (
    (v_new_parent.type = 'house' AND v_entity.type = 'floor') OR
    (v_new_parent.type = 'floor' AND v_entity.type = 'room') OR
    (v_new_parent.type = 'room' AND v_entity.type IN ('wall', 'door', 'window', 'furniture', 'container', 'item')) OR
    (v_new_parent.type = 'wall' AND v_entity.type IN ('door', 'window')) OR
    (v_new_parent.type = 'container' AND v_entity.type IN ('container', 'item'))
  ) THEN
    RETURN jsonb_build_object('error', jsonb_build_object('code', 'INVALID_TYPE_HIERARCHY', 'message', 'Invalid hierarchy'));
  END IF;

  v_old_path := v_entity.path;
  v_new_path := v_new_parent.path || entity_id::text || '/';

  UPDATE entities SET parent_id = new_parent_id, x = COALESCE(new_x, x), y = COALESCE(new_y, y), z = COALESCE(new_z, z), path = v_new_path, updated_at = NOW() WHERE id = entity_id AND user_id = v_uid;
  UPDATE entities SET path = v_new_path || substring(path FROM length(v_old_path) + 1), updated_at = NOW() WHERE path LIKE v_old_path || '%' AND id != entity_id AND user_id = v_uid;

  RETURN jsonb_build_object('data', jsonb_build_object('id', entity_id, 'new_path', v_new_path));
END;
$$;

-- ===================
-- 2. SEARCH ENTITIES
-- ===================
CREATE OR REPLACE FUNCTION search_entities(
  query_text TEXT, owner_id UUID, result_limit INT DEFAULT 20, result_offset INT DEFAULT 0
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_results JSONB;
  v_count INT;
  v_query tsquery;
BEGIN
  v_query := plainto_tsquery('english', query_text);

  SELECT jsonb_agg(row_to_json(r)), count(*) OVER() INTO v_results, v_count
  FROM (
    SELECT id, name, type, subtype, path, x, y, z, level, ts_rank(search_vector, v_query) AS rank, tags, description, icon, color
    FROM entities WHERE user_id = owner_id AND search_vector @@ v_query ORDER BY rank DESC LIMIT result_limit OFFSET result_offset
  ) r;

  IF v_results IS NOT NULL THEN
    SELECT count(*) INTO v_count FROM entities WHERE user_id = owner_id AND search_vector @@ v_query;
    RETURN jsonb_build_object('data', v_results, 'total_count', v_count, 'search_type', 'fts');
  END IF;

  SELECT jsonb_agg(row_to_json(r)) INTO v_results FROM (
    SELECT id, name, type, subtype, path, x, y, z, level, 0::float AS rank, tags, description, icon, color
    FROM entities WHERE user_id = owner_id AND (name ILIKE '%' || query_text || '%' OR description ILIKE '%' || query_text || '%' OR EXISTS (SELECT 1 FROM unnest(tags) t WHERE t ILIKE '%' || query_text || '%'))
    ORDER BY order_index ASC, created_at ASC LIMIT result_limit OFFSET result_offset
  ) r;

  SELECT count(*) INTO v_count FROM entities WHERE user_id = owner_id AND (name ILIKE '%' || query_text || '%' OR description ILIKE '%' || query_text || '%' OR EXISTS (SELECT 1 FROM unnest(tags) t WHERE t ILIKE '%' || query_text || '%'));
  RETURN jsonb_build_object('data', COALESCE(v_results, '[]'::jsonb), 'total_count', COALESCE(v_count, 0), 'search_type', 'ilike');
END;
$$;

-- ===================
-- 3. RESOLVE PATH NAMES
-- ===================
CREATE OR REPLACE FUNCTION resolve_path_names(entity_path TEXT, owner_id UUID) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_ids UUID[];
  v_result JSONB;
BEGIN
  v_ids := string_to_array(trim('/' FROM entity_path), '/')::UUID[];
  SELECT jsonb_agg(jsonb_build_object('id', id, 'name', name, 'type', type) ORDER BY array_position(v_ids, id)) INTO v_result
  FROM entities WHERE id = ANY(v_ids) AND user_id = owner_id;
  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;
