'use client';

import { Rect, Text, Group } from 'react-konva';
import { METERS_TO_PIXELS } from '@/lib/constants';

/**
 * ContainerShape — Hình chữ nhật outlined cho container
 * Hỗ trợ light/dark theme
 */
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
  isDropTarget,
  isValidDrop,
  theme = 'dark',
}) {
  const PADDING = 2;
  const x = (entity.x * METERS_TO_PIXELS) + PADDING;
  const y = (entity.y * METERS_TO_PIXELS) + PADDING;
  const w = (entity.width * METERS_TO_PIXELS) - (PADDING * 2);
  const h = (entity.height * METERS_TO_PIXELS) - (PADDING * 2);
  
  const depth = entity.path ? entity.path.split('/').filter(Boolean).length : 4;
  const isNested = depth > 4;

  // Màu theo theme
  const isDark = theme === 'dark';
  const fillColor = isNested
    ? (isDark ? 'rgba(59, 130, 246, 0.05)' : 'rgba(59, 130, 246, 0.08)')
    : (isDark ? 'rgba(30, 58, 138, 0.4)' : 'rgba(37, 99, 235, 0.1)');
  const borderColor = isDark ? '#3B82F6' : '#2563EB';
  const textColor = isDark ? '#93C5FD' : '#1E40AF';

  let currentStroke = borderColor;
  let strokeWidth = isNested ? 1 : 1.5;
  let dash = isNested ? [4, 4] : [];
  
  let shadowBlur = 0;
  let shadowOpacity = 0;
  let shadowColor = 'transparent';
  let shadowOffsetY = 0;

  if (isSelected) {
    currentStroke = '#2563EB';
    strokeWidth = 2;
    dash = [];
    shadowBlur = 10;
    shadowOpacity = 0.3;
    shadowOffsetY = 2;
    shadowColor = isDark ? '#000' : '#64748B';
  } else if (isDropTarget) {
    currentStroke = isValidDrop ? '#10B981' : '#EF4444'; 
    strokeWidth = 2;
    dash = []; 
  }

  if (isHighlighted) {
    shadowColor = '#FFD700';
    shadowBlur = 15;
    shadowOpacity = 0.5;
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
        const newX = (e.target.x() - PADDING) / METERS_TO_PIXELS;
        const newY = (e.target.y() - PADDING) / METERS_TO_PIXELS;
        onDragMove?.(entity.id, newX, newY);
      }}
      onDragEnd={(e) => {
        if (!editMode) return;
        const newX = (e.target.x() - PADDING) / METERS_TO_PIXELS;
        const newY = (e.target.y() - PADDING) / METERS_TO_PIXELS;
        onDragEnd?.(entity.id, newX, newY);
      }}
    >
      {/* Viền container */}
      <Rect
        width={w}
        height={h}
        fill={fillColor}
        stroke={currentStroke}
        strokeWidth={strokeWidth}
        dash={dash}
        cornerRadius={2}
        shadowColor={shadowColor}
        shadowBlur={shadowBlur}
        shadowOpacity={shadowOpacity}
        shadowOffsetY={shadowOffsetY}
      />

      {/* Tên */}
      <Text
        text={entity.name}
        x={0}
        y={Math.max(2, h / 2 - 6)}
        fontSize={11}
        fontFamily="Inter, sans-serif"
        fill={textColor}
        width={w}
        align="center"
        ellipsis={true}
        wrap="none"
      />
    </Group>
  );
}
