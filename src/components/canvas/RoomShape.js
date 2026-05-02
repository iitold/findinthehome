'use client';

import { Rect, Text, Group } from 'react-konva';
import { METERS_TO_PIXELS } from '@/lib/constants';

/**
 * RoomShape — Hình chữ nhật filled cho phòng
 * Hỗ trợ light/dark theme
 */
export default function RoomShape({
  entity,
  isSelected,
  isHighlighted,
  onSelect,
  onDragStart,
  onDragMove,
  onDragEnd,
  editMode,
  isDragged,
  isDropTarget,
  isValidDrop,
  theme = 'dark',
  isSearchHighlighted,
}) {
  const x = entity.x * METERS_TO_PIXELS;
  const y = entity.y * METERS_TO_PIXELS;
  const w = entity.width * METERS_TO_PIXELS;
  const h = entity.height * METERS_TO_PIXELS;
  
  // Màu sắc theo theme
  const isDark = theme === 'dark';
  const fillColor = isDark ? '#1E293B' : '#E2E8F0';
  const borderColor = isDark ? '#475569' : '#94A3B8';
  const textColor = isDark ? '#F1F5F9' : '#0F172A';
  const dimTextColor = isDark ? '#94A3B8' : '#64748B';

  // State-based styles
  let currentStroke = borderColor;
  let strokeWidth = 6;
  let shadowBlur = 8;
  let shadowOpacity = isDark ? 0.2 : 0.1;
  let shadowColor = isDark ? '#000' : '#64748B';
  let shadowOffsetY = 4;
  
  if (isSelected) {
    currentStroke = '#2563EB';
    strokeWidth = 8;
    shadowBlur = 15;
    shadowOpacity = 0.4;
    shadowOffsetY = 6;
  } else if (isDropTarget) {
    currentStroke = isValidDrop ? '#10B981' : '#EF4444';
    strokeWidth = 3;
  }

  if (isHighlighted) {
    shadowColor = '#FFD700';
    shadowBlur = 20;
    shadowOpacity = 0.5;
    shadowOffsetY = 0;
  }
  
  if (isSearchHighlighted) {
    currentStroke = '#e07a5f'; // Accent color for light theme search highlight
    strokeWidth = 10;
    shadowColor = '#e07a5f';
    shadowBlur = 25;
    shadowOpacity = 0.6;
    shadowOffsetY = 0;
  }

  const opacity = isDragged ? 0.6 : 1;

  return (
    <Group
      id={entity.id}
      name="resizable"
      x={x}
      y={y}
      draggable={editMode}
      opacity={opacity}
      onClick={() => onSelect?.(entity)}
      onTap={() => onSelect?.(entity)}
      onDragStart={() => {
        if (!editMode) return;
        onDragStart?.(entity.id);
      }}
      onDragMove={(e) => {
        if (!editMode) return;
        const newX = e.target.x() / METERS_TO_PIXELS;
        const newY = e.target.y() / METERS_TO_PIXELS;
        onDragMove?.(entity.id, newX, newY);
      }}
      onDragEnd={(e) => {
        if (!editMode) return;
        const newX = e.target.x() / METERS_TO_PIXELS;
        const newY = e.target.y() / METERS_TO_PIXELS;
        onDragEnd?.(entity.id, newX, newY);
      }}
    >
      {/* Nền phòng */}
      <Rect
        width={w}
        height={h}
        fill={fillColor}
        stroke={currentStroke}
        strokeWidth={strokeWidth}
        cornerRadius={8}
        shadowColor={shadowColor}
        shadowBlur={shadowBlur}
        shadowOpacity={shadowOpacity}
        shadowOffsetY={shadowOffsetY}
      />

      {/* Tên phòng */}
      <Text
        text={entity.name}
        x={12}
        y={12}
        fontSize={14}
        fontFamily="Inter, sans-serif"
        fontStyle="600"
        fill={textColor}
        width={w - 24}
        ellipsis={true}
        wrap="none"
      />

      {/* Kích thước m2 */}
      <Text
        text={`${entity.width}m × ${entity.height}m`}
        x={12}
        y={30}
        fontSize={11}
        fontFamily="Inter, sans-serif"
        fill={dimTextColor}
      />
    </Group>
  );
}
