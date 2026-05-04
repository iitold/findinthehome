'use client';

import { Rect, Text, Group, Line, Circle } from 'react-konva';
import { METERS_TO_PIXELS, CONTAINER_PALETTE } from '@/lib/constants';

/**
 * ContainerShape — Game-style furniture rendering
 * Draws cute furniture based on entity.icon (bookshelf, drawer, cabinet, etc.)
 */

// Detect furniture style from entity icon/name
function getFurnitureStyle(entity) {
  const icon = (entity.icon || '').toLowerCase();
  const name = (entity.name || '').toLowerCase();
  
  // Match by icon first
  if (icon in CONTAINER_PALETTE) return icon;
  
  // Fuzzy match by name keywords
  if (name.includes('kệ sách') || name.includes('bookshelf') || name.includes('sách')) return 'bookshelf';
  if (name.includes('kệ') || name.includes('shelf')) return 'shelf_unit';
  if (name.includes('ngăn kéo') || name.includes('drawer')) return 'drawer';
  if (name.includes('tủ áo') || name.includes('tủ quần') || name.includes('wardrobe')) return 'wardrobe';
  if (name.includes('tủ') || name.includes('cabinet')) return 'cabinet';
  if (name.includes('hộp') || name.includes('thùng') || name.includes('box')) return 'box';
  if (name.includes('rương') || name.includes('chest')) return 'chest';
  if (name.includes('giỏ') || name.includes('rổ') || name.includes('basket')) return 'basket';
  if (name.includes('giá') || name.includes('rack')) return 'rack';
  if (name.includes('tủ lạnh') || name.includes('fridge')) return 'fridge';
  if (name.includes('túi') || name.includes('bag')) return 'storage_bag';
  
  return 'default';
}

// ============ Furniture Drawing Functions ============

function DrawBookshelf({ w, h, stroke }) {
  const shelfCount = Math.max(2, Math.floor(h / 14));
  const gap = h / (shelfCount + 1);
  const elements = [];
  
  for (let i = 1; i <= shelfCount; i++) {
    const sy = gap * i;
    elements.push(
      <Line key={`shelf-${i}`} points={[3, sy, w - 3, sy]} stroke={stroke} strokeWidth={1.5} listening={false} />
    );
    // Small book-like rects on each shelf
    const bookCount = Math.floor((w - 10) / 5);
    for (let b = 0; b < Math.min(bookCount, 6); b++) {
      const bx = 5 + b * 5 + (i % 2) * 2;
      const bh = gap * 0.5 + Math.random() * gap * 0.2;
      if (bx + 3 < w - 5) {
        elements.push(
          <Rect 
            key={`book-${i}-${b}`} x={bx} y={sy - bh} width={3} height={bh} 
            fill={stroke} opacity={0.3 + (b % 3) * 0.15} cornerRadius={0.5} listening={false}
          />
        );
      }
    }
  }
  
  // Side panels
  elements.push(<Line key="left" points={[2, 2, 2, h - 2]} stroke={stroke} strokeWidth={1.5} listening={false} />);
  elements.push(<Line key="right" points={[w - 2, 2, w - 2, h - 2]} stroke={stroke} strokeWidth={1.5} listening={false} />);
  
  return <>{elements}</>;
}

function DrawDrawer({ w, h, stroke }) {
  const drawerCount = Math.max(2, Math.floor(h / 12));
  const gap = (h - 4) / drawerCount;
  const elements = [];
  
  for (let i = 0; i < drawerCount; i++) {
    const dy = 2 + gap * i;
    // Drawer compartment
    elements.push(
      <Rect key={`d-${i}`} x={3} y={dy + 1} width={w - 6} height={gap - 2} 
        fill="transparent" stroke={stroke} strokeWidth={0.8} cornerRadius={1} listening={false}
      />
    );
    // Handle (small circle)
    elements.push(
      <Circle key={`h-${i}`} x={w / 2} y={dy + gap / 2} radius={1.5} fill={stroke} listening={false} />
    );
  }
  
  return <>{elements}</>;
}

function DrawWardrobe({ w, h, stroke }) {
  const elements = [];
  const midX = w / 2;
  
  // Two door panels
  elements.push(
    <Rect key="left-door" x={3} y={3} width={midX - 4} height={h - 6} 
      fill="transparent" stroke={stroke} strokeWidth={0.8} cornerRadius={1} listening={false}
    />
  );
  elements.push(
    <Rect key="right-door" x={midX + 1} y={3} width={midX - 4} height={h - 6} 
      fill="transparent" stroke={stroke} strokeWidth={0.8} cornerRadius={1} listening={false}
    />
  );
  // Door handles
  elements.push(<Circle key="lh" x={midX - 3} y={h / 2} radius={1.5} fill={stroke} listening={false} />);
  elements.push(<Circle key="rh" x={midX + 3} y={h / 2} radius={1.5} fill={stroke} listening={false} />);
  // Vertical center line
  elements.push(
    <Line key="center" points={[midX, 3, midX, h - 3]} stroke={stroke} strokeWidth={0.5} listening={false} />
  );
  
  return <>{elements}</>;
}

function DrawCabinet({ w, h, stroke }) {
  const elements = [];
  
  // Single door with handle
  elements.push(
    <Rect key="door" x={3} y={3} width={w - 6} height={h - 6} 
      fill="transparent" stroke={stroke} strokeWidth={0.8} cornerRadius={1} listening={false}
    />
  );
  // Handle
  elements.push(
    <Line key="handle" points={[w - 8, h * 0.35, w - 8, h * 0.65]} stroke={stroke} strokeWidth={2} lineCap="round" listening={false} />
  );
  
  return <>{elements}</>;
}

function DrawBox({ w, h, stroke }) {
  const elements = [];
  
  // Box flaps (top)
  const flapH = Math.min(h * 0.2, 6);
  elements.push(
    <Line key="flap-l" points={[3, flapH, w / 2, flapH + 2]} stroke={stroke} strokeWidth={0.8} listening={false} />
  );
  elements.push(
    <Line key="flap-r" points={[w - 3, flapH, w / 2, flapH + 2]} stroke={stroke} strokeWidth={0.8} listening={false} />
  );
  // Cross tape
  elements.push(
    <Line key="tape-v" points={[w / 2, 2, w / 2, flapH + 2]} stroke={stroke} strokeWidth={1} listening={false} />
  );
  
  return <>{elements}</>;
}

function DrawBasket({ w, h, stroke }) {
  const elements = [];
  
  // Cross-hatch pattern
  const spacing = 6;
  for (let i = spacing; i < w + h; i += spacing) {
    // Diagonal lines \
    const x1 = Math.max(3, i - h);
    const y1 = Math.max(3, h - (i - x1 + 3));
    const x2 = Math.min(w - 3, i);
    const y2 = Math.min(h - 3, h - 3 - (i - x2));
    if (x1 < w - 3 && y1 < h - 3) {
      elements.push(
        <Line key={`d1-${i}`} points={[x1, y2, x2, y1]} stroke={stroke} strokeWidth={0.5} opacity={0.4} listening={false} />
      );
    }
  }
  // Basket rim
  elements.push(
    <Line key="rim" points={[3, 4, w - 3, 4]} stroke={stroke} strokeWidth={1.5} listening={false} />
  );
  
  return <>{elements}</>;
}

function DrawFridge({ w, h, stroke }) {
  const elements = [];
  const splitY = h * 0.3;
  
  // Top compartment (freezer)
  elements.push(
    <Rect key="freezer" x={3} y={3} width={w - 6} height={splitY - 4} 
      fill="transparent" stroke={stroke} strokeWidth={0.8} cornerRadius={1} listening={false}
    />
  );
  // Bottom compartment (fridge)
  elements.push(
    <Rect key="fridge" x={3} y={splitY + 1} width={w - 6} height={h - splitY - 4} 
      fill="transparent" stroke={stroke} strokeWidth={0.8} cornerRadius={1} listening={false}
    />
  );
  // Handles
  elements.push(
    <Line key="h1" points={[w - 7, splitY * 0.3, w - 7, splitY * 0.7]} stroke={stroke} strokeWidth={1.5} lineCap="round" listening={false} />
  );
  elements.push(
    <Line key="h2" points={[w - 7, splitY + (h - splitY) * 0.2, w - 7, splitY + (h - splitY) * 0.5]} stroke={stroke} strokeWidth={1.5} lineCap="round" listening={false} />
  );
  
  return <>{elements}</>;
}

function DrawRack({ w, h, stroke }) {
  const elements = [];
  
  // Vertical poles
  elements.push(<Line key="pole-l" points={[4, 2, 4, h - 2]} stroke={stroke} strokeWidth={1.5} listening={false} />);
  elements.push(<Line key="pole-r" points={[w - 4, 2, w - 4, h - 2]} stroke={stroke} strokeWidth={1.5} listening={false} />);
  
  // Horizontal bars
  const barCount = Math.max(2, Math.floor(h / 12));
  const gap = h / (barCount + 1);
  for (let i = 1; i <= barCount; i++) {
    elements.push(
      <Line key={`bar-${i}`} points={[4, gap * i, w - 4, gap * i]} stroke={stroke} strokeWidth={1} listening={false} />
    );
  }
  
  return <>{elements}</>;
}

function DrawStorageBag({ w, h, stroke }) {
  const elements = [];
  
  // Bag opening (arc-like)
  elements.push(
    <Line key="opening" points={[4, 5, w / 2, 2, w - 4, 5]} stroke={stroke} strokeWidth={1} tension={0.5} listening={false} />
  );
  // Zipper line
  elements.push(
    <Line key="zipper" points={[w * 0.3, 5, w * 0.7, 5]} stroke={stroke} strokeWidth={1.5} listening={false} />
  );
  
  return <>{elements}</>;
}

// Mapping furniture style to draw function
const FURNITURE_RENDERERS = {
  bookshelf: DrawBookshelf,
  shelf_unit: DrawBookshelf,
  drawer: DrawDrawer,
  wardrobe: DrawWardrobe,
  cabinet: DrawCabinet,
  box: DrawBox,
  chest: DrawBox,
  basket: DrawBasket,
  rack: DrawRack,
  fridge: DrawFridge,
  fridge_interior: DrawFridge,
  storage_bag: DrawStorageBag,
};

export default function ContainerShape({
  entity,
  isSelected,
  isHighlighted,
  onSelect,
  onDragStart,
  onDragMove,
  onDragEnd,
  editMode,
  isDragged,
  dragLocked,
  isDropTarget,
  isValidDrop,
  theme = 'dark',
}) {
  const PADDING = 2;
  const x = (entity.x * METERS_TO_PIXELS) + PADDING;
  const y = (entity.y * METERS_TO_PIXELS) + PADDING;
  const w = (entity.width * METERS_TO_PIXELS) - (PADDING * 2);
  const h = (entity.height * METERS_TO_PIXELS) - (PADDING * 2);
  
  const isDark = theme === 'dark';
  
  // Determine furniture style
  const furnitureStyle = getFurnitureStyle(entity);
  const palette = CONTAINER_PALETTE[furnitureStyle] || CONTAINER_PALETTE.default;
  
  // Colors (respect dark mode)
  const fillColor = isDark 
    ? `rgba(${parseInt(palette.fill.slice(1,3),16)}, ${parseInt(palette.fill.slice(3,5),16)}, ${parseInt(palette.fill.slice(5,7),16)}, 0.15)`
    : palette.fill;
  const strokeColor = isDark
    ? `rgba(${parseInt(palette.stroke.slice(1,3),16)}, ${parseInt(palette.stroke.slice(3,5),16)}, ${parseInt(palette.stroke.slice(5,7),16)}, 0.6)`
    : palette.stroke;
  const detailColor = isDark
    ? `rgba(${parseInt(palette.stroke.slice(1,3),16)}, ${parseInt(palette.stroke.slice(3,5),16)}, ${parseInt(palette.stroke.slice(5,7),16)}, 0.4)`
    : palette.stroke;
  const textColor = isDark ? '#CBD5E1' : '#5c4a32';

  let currentStroke = strokeColor;
  let currentStrokeWidth = 1.5;
  let shadowBlur = 0;
  let shadowOpacity = 0;
  let shadowColor = 'transparent';
  let shadowOffsetY = 0;

  if (isSelected) {
    currentStroke = '#2563EB';
    currentStrokeWidth = 2;
    shadowBlur = 10;
    shadowOpacity = 0.3;
    shadowOffsetY = 2;
    shadowColor = isDark ? '#000' : '#64748B';
  } else if (isDropTarget) {
    currentStroke = isValidDrop ? '#10B981' : '#EF4444'; 
    currentStrokeWidth = 2;
  }

  if (isHighlighted) {
    shadowColor = '#FFD700';
    shadowBlur = 15;
    shadowOpacity = 0.5;
  }

  const opacity = isDragged ? 0.6 : 1;
  
  // Get the renderer for this furniture type
  const FurnitureRenderer = FURNITURE_RENDERERS[furnitureStyle];

  return (
    <Group
      id={entity.id}
      name="resizable"
      x={x}
      y={y}
      draggable={editMode && !dragLocked}
      opacity={opacity}
      onClick={() => onSelect?.(entity)}
      onTap={() => onSelect?.(entity)}
      onDragStart={(e) => {
        e.cancelBubble = true;
        if (!editMode) return;
        onDragStart?.(entity.id);
      }}
      onDragMove={(e) => {
        e.cancelBubble = true;
        if (!editMode) return;
        const newX = (e.target.x() - PADDING) / METERS_TO_PIXELS;
        const newY = (e.target.y() - PADDING) / METERS_TO_PIXELS;
        onDragMove?.(entity.id, newX, newY);
      }}
      onDragEnd={(e) => {
        e.cancelBubble = true;
        if (!editMode) return;
        const newX = (e.target.x() - PADDING) / METERS_TO_PIXELS;
        const newY = (e.target.y() - PADDING) / METERS_TO_PIXELS;
        onDragEnd?.(entity.id, newX, newY);
      }}
    >
      {/* Furniture body */}
      <Rect
        width={w}
        height={h}
        fill={fillColor}
        stroke={currentStroke}
        strokeWidth={currentStrokeWidth}
        cornerRadius={3}
        shadowColor={shadowColor}
        shadowBlur={shadowBlur}
        shadowOpacity={shadowOpacity}
        shadowOffsetY={shadowOffsetY}
      />

      {/* Furniture detail (style-specific) */}
      {FurnitureRenderer && (
        <FurnitureRenderer w={w} h={h} stroke={detailColor} />
      )}

      {/* Label at bottom */}
      <Text
        text={entity.name}
        x={2}
        y={h + 2}
        fontSize={9}
        fontFamily="Inter, sans-serif"
        fontStyle="500"
        fill={textColor}
        width={w - 4}
        align="center"
        ellipsis={true}
        wrap="none"
        listening={false}
      />
    </Group>
  );
}
