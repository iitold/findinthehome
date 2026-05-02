import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import * as LucideIcons from 'lucide-react';

const iconCache = new Map();

// Mapping từ khóa thông dụng sang Lucide Icon
const ICON_MAP = {
  // Tiếng Việt
  'kéo': 'Scissors',
  'dao': 'Utensils',
  'điều khiển': 'Gamepad2',
  'remote': 'Gamepad2',
  'tv': 'Tv',
  'tivi': 'Tv',
  'sách': 'Book',
  'thuốc': 'Pill',
  'quần': 'Shirt',
  'áo': 'Shirt',
  'chìa khoá': 'Key',
  'chìa khóa': 'Key',
  'điện thoại': 'Smartphone',
  'máy tính': 'Laptop',
  'laptop': 'Laptop',
  'xe': 'Car',
  'balo': 'Backpack',
  'ví': 'Wallet',
  'giày': 'Footprints',
  'dép': 'Footprints',
  'mũ': 'HardHat',
  'nón': 'HardHat',
  'kính': 'Glasses',
  'đồng hồ': 'Watch',
  'quạt': 'Fan',
  'bút': 'Pen',
  // English
  'scissors': 'Scissors',
  'knife': 'Utensils',
  'book': 'Book',
  'pill': 'Pill',
  'shirt': 'Shirt',
  'key': 'Key',
  'phone': 'Smartphone',
  'car': 'Car',
  'wallet': 'Wallet',
  'shoe': 'Footprints',
  'glass': 'Glasses',
  'watch': 'Watch',
  'pen': 'Pen',
};

function autoDetectIcon(name) {
  if (!name) return 'Package';
  const lowerName = name.toLowerCase();
  for (const [key, icon] of Object.entries(ICON_MAP)) {
    if (lowerName.includes(key)) {
      return icon;
    }
  }
  return 'Package'; // Fallback
}

/**
 * Tạo một Image object từ Lucide icon để render trong react-konva
 * Dùng cache để tái sử dụng Image object, giữ hiệu năng cao
 */
export function getLucideIconImage(iconName, entityName = '', color = '#6366F1', size = 24) {
  // Tự động nhận diện icon dựa trên tên nếu không có iconName
  let finalIconName = iconName;
  if (!finalIconName || finalIconName === 'package') {
    finalIconName = autoDetectIcon(entityName);
  }

  const cacheKey = `${finalIconName}-${color}-${size}`;
  if (iconCache.has(cacheKey)) {
    return iconCache.get(cacheKey);
  }

  // Fallback icon
  let IconComponent = LucideIcons[finalIconName];
  if (!IconComponent) {
    // Thử convert snake_case hoặc kebab-case sang PascalCase
    const pascalName = finalIconName
      .split('-')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join('');
    IconComponent = LucideIcons[pascalName] || LucideIcons.Package;
  }

  try {
    // Render React component thành chuỗi HTML (SVG)
    const svgString = renderToStaticMarkup(
      createElement(IconComponent, { size, color, strokeWidth: 1.5 })
    );

    // Chuyển thành Data URI
    const svgDataUri = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgString)));

    // Tạo Image object để Konva sử dụng
    const img = new window.Image();
    img.src = svgDataUri;
    
    iconCache.set(cacheKey, img);
    return img;
  } catch (error) {
    console.error('Lỗi khi render Lucide icon sang Image:', error);
    return null;
  }
}
