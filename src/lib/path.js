/**
 * Materialized Path utilities (Section 5)
 * Format: /<ancestor_uuid>/.../<self_uuid>/
 */

/**
 * Tính path cho entity mới
 * Root (house): /<self_uuid>/
 * Child: <parent.path><self_uuid>/
 */
export function computePath(parentPath, entityId) {
  if (!parentPath) {
    // Root entity
    return `/${entityId}/`;
  }
  return `${parentPath}${entityId}/`;
}

/**
 * Cập nhật path cho entity + tất cả con cháu khi di chuyển (MOVE)
 * Chạy trong transaction qua RPC
 *
 * @param {object} supabase - Supabase client
 * @param {string} oldPath - Path cũ của entity
 * @param {string} newPath - Path mới của entity
 * @param {string} userId - ID user hiện tại
 */
export async function updateDescendantPaths(supabase, oldPath, newPath, userId) {
  // Batch update: thay thế prefix oldPath bằng newPath cho tất cả descendants
  const { error } = await supabase.rpc('update_entity_paths', {
    old_path_prefix: oldPath,
    new_path_prefix: newPath,
    owner_id: userId,
  });

  if (error) {
    throw new Error(`Failed to update descendant paths: ${error.message}`);
  }
}

/**
 * Trích xuất danh sách ancestor UUIDs từ path
 * "/aaa/bbb/ccc/" → ["aaa", "bbb", "ccc"]
 */
export function extractPathIds(path) {
  if (!path) return [];
  return path.split('/').filter(Boolean);
}
