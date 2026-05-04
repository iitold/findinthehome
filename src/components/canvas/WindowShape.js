'use client';

import { Group, Rect, Line } from 'react-konva';
import { METERS_TO_PIXELS } from '@/lib/constants';

/**
 * WindowShape — Renders an architectural window
 */
export default function WindowShape({
  entity,
  isSelected,
  onSelect,
  onDragStart,
  onDragMove,
  onDragEnd,
  editMode,
  dragLocked,
  theme = 'dark'
}) {
  const x = entity.x * METERS_TO_PIXELS;
  const y = entity.y * METERS_TO_PIXELS;
  const w = (entity.width || 1.2) * METERS_TO_PIXELS;
  const d = (entity.depth || 0.1) * METERS_TO_PIXELS;
  const rotation = entity.rotation || 0;

  const isDark = theme === 'dark';
  const canvasBg = isDark ? '#0a0e1a' : '#f1f5f9';
  const lineColor = isDark ? '#94A3B8' : '#475569';
  const glassColor = isDark ? '#3B82F6' : '#60A5FA';

  const strokeColor = isSelected ? '#2563eb' : lineColor;
  const strokeWidth = isSelected ? 2 : 1.5;

  return (
    <Group
      x={x}
      y={y}
      rotation={rotation}
      draggable={editMode && !entity.is_fixed && !dragLocked}
      id={entity.id}
      onClick={(e) => {
        e.cancelBubble = true;
        onSelect?.(entity);
      }}
      onTap={(e) => {
        e.cancelBubble = true;
        onSelect?.(entity);
      }}
      onDragStart={() => {
        if (!editMode || entity.is_fixed) return;
        onDragStart?.(entity.id);
      }}
      onDragMove={(e) => {
        if (!editMode || entity.is_fixed) return;
        onDragMove?.(entity.id, e.target.x() / METERS_TO_PIXELS, e.target.y() / METERS_TO_PIXELS);
      }}
      onDragEnd={(e) => {
        if (!editMode || entity.is_fixed) return;
        onDragEnd?.(entity.id, e.target.x() / METERS_TO_PIXELS, e.target.y() / METERS_TO_PIXELS);
      }}
    >
      {/* Wall Cutout (Masks the wall beneath) */}
      <Rect
        x={0}
        y={0}
        width={w}
        height={d}
        fill={canvasBg}
      />
      
      {/* Outer Window Frame (Sill) */}
      <Rect
        x={0}
        y={0}
        width={w}
        height={d}
        stroke={strokeColor}
        strokeWidth={1}
      />
      
      {/* Glass Pane (Thick line in the middle) */}
      <Line
        points={[0, d / 2, w, d / 2]}
        stroke={glassColor}
        strokeWidth={3}
      />
      <Line
        points={[0, d / 2 - 2, w, d / 2 - 2]}
        stroke={glassColor}
        strokeWidth={1}
        opacity={0.5}
      />
      <Line
        points={[0, d / 2 + 2, w, d / 2 + 2]}
        stroke={glassColor}
        strokeWidth={1}
        opacity={0.5}
      />
    </Group>
  );
}
