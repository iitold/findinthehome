'use client';

import { Group, Rect, Arc, Line } from 'react-konva';
import { METERS_TO_PIXELS } from '@/lib/constants';

/**
 * DoorShape — Renders an architectural door with swing arc
 */
export default function DoorShape({
  entity,
  isSelected,
  onSelect,
  onDragStart,
  onDragMove,
  onDragEnd,
  editMode,
  theme = 'dark'
}) {
  const x = entity.x * METERS_TO_PIXELS;
  const y = entity.y * METERS_TO_PIXELS;
  const w = (entity.width || 0.9) * METERS_TO_PIXELS;
  const d = (entity.depth || 0.1) * METERS_TO_PIXELS;
  const rotation = entity.rotation || 0;

  const swingDir = entity.swing_direction || 'in'; // 'in' or 'out'
  const hingeSide = entity.hinge_side || 'left'; // 'left' or 'right'
  const swingAngle = entity.swing_angle || 90;

  const isDark = theme === 'dark';
  const canvasBg = isDark ? '#0a0e1a' : '#f1f5f9';
  const lineColor = isDark ? '#94A3B8' : '#475569'; // Slate colors for architectural lines

  // Hinge point calculation relative to Group
  let hingeX = 0;
  let hingeY = d / 2;
  
  if (hingeSide === 'right') {
    hingeX = w;
  }

  // Calculate arc and panel rotation
  let arcRotation = 0;
  let panelRotation = 0;
  
  // Standard architectural drawing logic for door swings
  if (swingDir === 'in') {
    if (hingeSide === 'left') {
      arcRotation = 0;
      panelRotation = swingAngle;
    } else {
      arcRotation = 180 - swingAngle;
      panelRotation = -swingAngle;
    }
  } else {
    if (hingeSide === 'left') {
      arcRotation = -swingAngle;
      panelRotation = -swingAngle;
    } else {
      arcRotation = 180;
      panelRotation = swingAngle;
    }
  }

  const strokeColor = isSelected ? '#2563eb' : lineColor;
  const strokeWidth = isSelected ? 2 : 1.5;

  return (
    <Group
      x={x}
      y={y}
      rotation={rotation}
      draggable={editMode && !entity.is_fixed}
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
      {/* Wall Cutout (masks the wall line underneath) */}
      <Rect
        x={0}
        y={0}
        width={w}
        height={d}
        fill={canvasBg}
      />
      
      {/* Door Jambs (Hai đố cửa nhỏ ở 2 bên) */}
      <Rect x={0} y={0} width={4} height={d} fill={strokeColor} />
      <Rect x={w - 4} y={0} width={4} height={d} fill={strokeColor} />
      
      {/* Door Panel (Cánh cửa) */}
      <Line
        points={[0, 0, w, 0]}
        x={hingeX}
        y={hingeY}
        rotation={panelRotation}
        stroke={strokeColor}
        strokeWidth={3}
        lineCap="round"
      />

      {/* Swing Arc (Đường mở cửa) */}
      <Arc
        x={hingeX}
        y={hingeY}
        innerRadius={w}
        outerRadius={w}
        angle={swingAngle}
        rotation={arcRotation}
        stroke={strokeColor}
        strokeWidth={1.5}
        dash={[5, 5]}
      />
      
      {/* Invisible hitbox for better selection */}
      <Rect
        x={0}
        y={-w} // Mở rộng hitbox ra khu vực mở cửa
        width={w}
        height={w * 2}
        fill="transparent"
      />
    </Group>
  );
}
