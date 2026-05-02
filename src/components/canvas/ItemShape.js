'use client';

import { Circle, Text, Group, Image as KonvaImage } from 'react-konva';
import { METERS_TO_PIXELS } from '@/lib/constants';
import { useEffect, useRef, useState } from 'react';
import { getLucideIconImage } from '@/lib/iconUtils';

/**
 * ItemShape — Architectural Marker cho đồ vật
 * Trình bày dưới dạng vòng tròn trắng (marker) có viền màu accent và icon ở giữa.
 */
export default function ItemShape({
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
  const x = entity.x * METERS_TO_PIXELS;
  const y = entity.y * METERS_TO_PIXELS;
  const displayRadius = 10; // Fixed size marker (smaller for architectural scale)
  
  const isDark = theme === 'dark';
  const color = isDark ? '#2563EB' : '#3B82F6';
  const textColor = isDark ? '#E2E8F0' : '#1E293B';
  const circleRef = useRef(null);
  
  const [pulseRadius, setPulseRadius] = useState(0);
  const [iconImg, setIconImg] = useState(null);

  // Load Lucide Icon
  useEffect(() => {
    const iconName = entity.icon || 'package';
    const img = getLucideIconImage(iconName, entity.name, '#FFFFFF', 12); // Trắng trên nền màu
    if (img) {
      img.onload = () => setIconImg(img);
      setIconImg(img); 
    }
  }, [entity.icon, entity.name]);

  // Pulsing animation khi highlight
  useEffect(() => {
    if (!isHighlighted) {
      setPulseRadius(0);
      return;
    }

    let animFrame;
    let startTime = Date.now();

    const animate = () => {
      const elapsed = (Date.now() - startTime) / 1000;
      const pulse = Math.sin(elapsed * 3) * 6 + 6; // 0-12px oscillation
      setPulseRadius(pulse);
      animFrame = requestAnimationFrame(animate);
    };

    animFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrame);
  }, [isHighlighted]);

  let currentStroke = '#FFFFFF';
  let strokeWidth = 1.5;
  let shadowBlur = 4;
  let shadowOpacity = 0.3;
  let shadowColor = isDark ? '#000' : '#64748B';

  if (isSelected) {
    currentStroke = '#60A5FA';
    strokeWidth = 2.5;
    shadowBlur = 10;
    shadowOpacity = 0.5;
  }

  // Khi search
  if (isHighlighted) {
    shadowColor = '#FFD700';
    shadowBlur = 15;
    shadowOpacity = 0.6;
  }

  const opacity = isDragged ? 0.6 : 1;

  return (
    <Group
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
      {/* Pulse ring (chỉ khi highlight) */}
      {isHighlighted && (
        <Circle
          radius={displayRadius + pulseRadius}
          fill="transparent"
          stroke="#FFD700"
          strokeWidth={2}
          opacity={0.6}
        />
      )}

      {/* Marker */}
      <Circle
        ref={circleRef}
        radius={displayRadius}
        fill={color}
        stroke={currentStroke}
        strokeWidth={strokeWidth}
        shadowColor={shadowColor}
        shadowBlur={shadowBlur}
        shadowOpacity={shadowOpacity}
        shadowOffsetY={2}
      />

      {/* Lucide Icon */}
      {iconImg && (
        <KonvaImage
          image={iconImg}
          width={12}
          height={12}
          x={-6}
          y={-6}
          listening={false} 
        />
      )}

      {/* Tên đồ vật */}
      <Text
        text={entity.name}
        x={-40}
        y={displayRadius + 6}
        fontSize={10}
        fontFamily="Inter, sans-serif"
        fontStyle="500"
        fill={textColor}
        width={80}
        align="center"
        ellipsis={true}
        wrap="none"
      />
    </Group>
  );
}
