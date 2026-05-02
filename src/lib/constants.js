// Màu hệ thống kiến trúc (Light theme optimized)
export const TYPE_COLORS = {
  house: '#ffffff',
  floor: '#faf9f7',
  room: '#fdfdfc',        // Nền phòng sáng
  roomBorder: '#dcd9d2',  // Viền phòng nhẹ
  roomText: '#3d405b',    // Chữ phòng tối
  container: '#fdf8e9',   // Nền hộp/tủ màu vàng nhạt
  containerBorder: '#f2cc8f', 
  containerText: '#b07f2e',
  item: '#e07a5f',        // Accent color (Warm coral)
  itemText: '#ffffff',
};

export const TYPE_ICONS = {
  house: 'home',
  floor: 'layers',
  room: 'square',
  container: 'box',
  item: 'circle',
};

// Các icon khả dụng cho vật dụng (item)
export const ITEM_ICONS = [
  'circle', 'scissors', 'tv', 'laptop', 'key', 'tablet', 'smartphone', 
  'shirt', 'wrench', 'hammer', 'book', 'umbrella', 'camera', 
  'headphones', 'glasses', 'coffee', 'apple', 'battery', 'watch', 
  'pill', 'gift', 'shopping-bag', 'briefcase', 'wallet', 'credit-card'
];

// Quy tắc parent→child hợp lệ (Section 7)
export const VALID_CHILDREN = {
  house: ['floor'],
  floor: ['room'],
  room: ['wall', 'door', 'window', 'furniture', 'container', 'item'],
  wall: ['door', 'window'],
  door: [],
  window: [],
  furniture: [],
  container: ['container', 'item'],
  item: [], // item không có con
};

// Entity types (Section 4)
export const ENTITY_TYPES = [
  'house', 'floor', 'room', 
  'wall', 'door', 'window', 
  'furniture', 'container', 'item'
];

// Valid subtypes per type (Section 5)
export const VALID_SUBTYPES = {
  door: ['single', 'double', 'sliding', 'folding'],
  window: ['standard', 'bay', 'skylight', 'sliding'],
  furniture: [
    'bed', 'sofa', 'desk', 'table', 'chair', 
    'bathtub', 'toilet', 'sink', 'stove', 'fridge', 
    'tv', 'bookshelf_open'
  ],
  container: [
    'wardrobe', 'cabinet', 'drawer', 'box', 
    'shelf_unit', 'chest', 'rack', 'basket', 
    'fridge_interior', 'storage_bag'
  ]
};

// Tỉ lệ canvas: 1 mét = bao nhiêu pixel
export const METERS_TO_PIXELS = 50;

// Giới hạn API
export const MAX_TREE_DEPTH = 5;
export const DEFAULT_TREE_DEPTH = 2;
export const DEFAULT_SEARCH_LIMIT = 20;
