'use client';

import { Rect, Text, Group, Line } from 'react-konva';
import { METERS_TO_PIXELS } from '@/lib/constants';

/**
 * RoomShape — Game-style room with wood plank floor
 * Top-down cute room rendering with inner wall shadows
 */

// Generate wood plank floor pattern elements
function WoodFloor({ w, h, isDark }) {
  const planks = [];
  const plankH = 8; // plank height in pixels
  const baseColor = isDark ? '#2a2520' : '#e8d5b8';
  const altColor = isDark ? '#322d27' : '#dcc9a8';
  const gapColor = isDark ? '#1a1714' : '#c4a882';

  for (let py = 0; py < h; py += plankH) {
    const isAlt = Math.floor(py / plankH) % 2 === 1;
    // Plank background
    planks.push(
      <Rect
        key={`plank-${py}`}
        x={4} y={py + 4}
        width={w - 8} height={Math.min(plankH, h - py - 8)}
        fill={isAlt ? altColor : baseColor}
        listening={false}
      />
    );
    // Gap line between planks
    if (py > 0 && py + 4 < h - 4) {
      planks.push(
        <Line
          key={`gap-${py}`}
          points={[4, py + 4, w - 4, py + 4]}
          stroke={gapColor}
          strokeWidth={0.5}
          listening={false}
        />
      );
    }
  }

  // Stagger lines (vertical joints offset per row)
  const staggerX = w * 0.4;
  for (let py = 0; py < h; py += plankH) {
    const offset = Math.floor(py / plankH) % 2 === 0 ? staggerX : staggerX * 1.6;
    for (let sx = offset; sx < w - 8; sx += w * 0.5) {
      if (sx > 8 && sx < w - 8 && py + 4 < h - 4) {
        planks.push(
          <Line
            key={`stagger-${py}-${sx}`}
            points={[sx, py + 4, sx, Math.min(py + 4 + plankH, h - 4)]}
            stroke={gapColor}
            strokeWidth={0.5}
            listening={false}
          />
        );
      }
    }
  }

  return <>{planks}</>;
}

// Inner wall shadow effect (4 edges)
function InnerWallShadow({ w, h, isDark }) {
  const shadowDepth = 6;
  const shadowColor = isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.08)';
  const shadowMid = isDark ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.03)';
  
  return (
    <>
      {/* Top shadow */}
      <Rect x={0} y={0} width={w} height={shadowDepth} fill={shadowColor} listening={false} />
      <Rect x={0} y={shadowDepth} width={w} height={shadowDepth} fill={shadowMid} listening={false} />
      {/* Left shadow */}
      <Rect x={0} y={0} width={shadowDepth} height={h} fill={shadowColor} listening={false} />
      <Rect x={shadowDepth} y={0} width={shadowDepth/2} height={h} fill={shadowMid} listening={false} />
    </>
  );
}

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
  dragLocked,
  isDropTarget,
  isValidDrop,
  theme = 'dark',
  isSearchHighlighted,
}) {
  const x = entity.x * METERS_TO_PIXELS;
  const y = entity.y * METERS_TO_PIXELS;
  const w = entity.width * METERS_TO_PIXELS;
  const h = entity.height * METERS_TO_PIXELS;
  
  const isDark = theme === 'dark';
  
  // Wall colors
  const wallColor = isDark ? '#475569' : '#94A3B8';
  const wallThickness = 4;

  // State-based wall styles
  let currentStroke = wallColor;
  let strokeWidth = wallThickness;
  let shadowBlur = 4;
  let shadowOpacity = isDark ? 0.2 : 0.08;
  let shadowColor = isDark ? '#000' : '#64748B';
  let shadowOffsetY = 2;
  
  if (isSelected) {
    currentStroke = '#2563EB';
    strokeWidth = wallThickness + 2;
    shadowBlur = 12;
    shadowOpacity = 0.3;
    shadowOffsetY = 4;
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
    currentStroke = '#e07a5f';
    strokeWidth = 6;
    shadowColor = '#e07a5f';
    shadowBlur = 20;
    shadowOpacity = 0.5;
    shadowOffsetY = 0;
  }

  const opacity = isDragged ? 0.6 : 1;
  
  // Room label colors
  const labelBg = isDark ? 'rgba(30,41,59,0.85)' : 'rgba(255,255,255,0.9)';
  const labelText = isDark ? '#F1F5F9' : '#1E293B';
  const dimText = isDark ? '#64748B' : '#94A3B8';

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
        const newX = e.target.x() / METERS_TO_PIXELS;
        const newY = e.target.y() / METERS_TO_PIXELS;
        onDragMove?.(entity.id, newX, newY);
      }}
      onDragEnd={(e) => {
        e.cancelBubble = true;
        if (!editMode) return;
        const newX = e.target.x() / METERS_TO_PIXELS;
        const newY = e.target.y() / METERS_TO_PIXELS;
        onDragEnd?.(entity.id, newX, newY);
      }}
    >
      {/* Clip container for floor */}
      <Rect
        width={w}
        height={h}
        cornerRadius={4}
        fill={isDark ? '#1E293B' : '#d4c4a8'}
        listening={false}
      />

      {/* Wood plank floor */}
      <WoodFloor w={w} h={h} isDark={isDark} />
      
      {/* Inner wall shadow for 3D depth effect */}
      <InnerWallShadow w={w} h={h} isDark={isDark} />

      {/* Wall border */}
      <Rect
        width={w}
        height={h}
        fill="transparent"
        stroke={currentStroke}
        strokeWidth={strokeWidth}
        cornerRadius={4}
        shadowColor={shadowColor}
        shadowBlur={shadowBlur}
        shadowOpacity={shadowOpacity}
        shadowOffsetY={shadowOffsetY}
      />

      {/* Room name label (cute tag style) */}
      <Rect
        x={8}
        y={6}
        width={Math.min(w - 16, entity.name.length * 7.5 + 16)}
        height={20}
        fill={labelBg}
        cornerRadius={4}
        listening={false}
      />
      <Text
        text={entity.name}
        x={16}
        y={10}
        fontSize={11}
        fontFamily="Inter, sans-serif"
        fontStyle="600"
        fill={labelText}
        width={w - 32}
        ellipsis={true}
        wrap="none"
        listening={false}
      />

      {/* Dimensions at bottom-right */}
      <Text
        text={`${entity.width}×${entity.height}m`}
        x={0}
        y={h - 16}
        fontSize={9}
        fontFamily="Inter, sans-serif"
        fill={dimText}
        width={w - 8}
        align="right"
        listening={false}
      />
    </Group>
  );
}
