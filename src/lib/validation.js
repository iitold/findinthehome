import { VALID_CHILDREN, ENTITY_TYPES, VALID_SUBTYPES } from './constants';

/**
 * Kiểm tra type hierarchy hợp lệ (Section 7)
 * @returns {boolean} true nếu parentType → childType hợp lệ
 */
export function validateTypeHierarchy(parentType, childType) {
  if (!parentType) {
    // Root entity (house) không có parent
    return childType === 'house';
  }
  const allowed = VALID_CHILDREN[parentType];
  return allowed && allowed.includes(childType);
}

/**
 * Kiểm tra vòng lặp (circular reference) - Section 6
 * Nếu new_parent.path chứa self_id → tạo vòng lặp
 * @returns {boolean} true nếu phát hiện vòng lặp (lỗi!)
 */
export function checkCircularReference(entityId, newParentPath) {
  // Kiểm tra chính xác UUID segment, không phải substring
  return newParentPath.includes(`/${entityId}/`);
}

/**
 * Kiểm tra parent thuộc cùng user (cross-user guard - Section 3)
 * @returns {boolean} true nếu hợp lệ (cùng user)
 */
export function validateParentOwnership(parent, userId) {
  return parent.user_id === userId;
}

/**
 * Validate dữ liệu entity trước khi tạo/sửa
 * @returns {{ valid: boolean, error?: { message: string, code: string } }}
 */
export function validateEntityData(data) {
  if (!data.name || data.name.trim() === '') {
    return {
      valid: false,
      error: { message: 'Name is required', code: 'VALIDATION_ERROR' },
    };
  }

  if (!data.type || !ENTITY_TYPES.includes(data.type)) {
    return {
      valid: false,
      error: { message: `Invalid entity type: ${data.type}`, code: 'VALIDATION_ERROR' },
    };
  }

  // Validate subtype if applicable
  if (data.subtype && VALID_SUBTYPES[data.type]) {
    if (!VALID_SUBTYPES[data.type].includes(data.subtype)) {
      return {
        valid: false,
        error: { message: `Invalid subtype ${data.subtype} for type ${data.type}`, code: 'VALIDATION_ERROR' },
      };
    }
  }

  // house không cần parent, tất cả loại khác cần
  if (data.type !== 'house' && !data.parent_id) {
    return {
      valid: false,
      error: { message: 'parent_id is required for non-house entities', code: 'VALIDATION_ERROR' },
    };
  }

  return { valid: true };
}
