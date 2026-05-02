'use client';

import { useState, useCallback } from 'react';
import { METERS_TO_PIXELS } from '@/lib/constants';

export function useCanvas() {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [mode, setMode] = useState('search'); // 'edit' | 'search'
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [highlightedEntity, setHighlightedEntity] = useState(null);
  const [highlightedRoomId, setHighlightedRoomId] = useState(null);
  const [selectedFloorZ, setSelectedFloorZ] = useState(0);

  // Zoom in/out
  const zoomIn = useCallback(() => {
    setScale(prev => Math.min(prev * 1.2, 5));
  }, []);

  const zoomOut = useCallback(() => {
    setScale(prev => Math.max(prev / 1.2, 0.2));
  }, []);

  const fitView = useCallback((stageWidth, stageHeight, contentWidth, contentHeight) => {
    const scaleX = stageWidth / (contentWidth * METERS_TO_PIXELS + 100);
    const scaleY = stageHeight / (contentHeight * METERS_TO_PIXELS + 100);
    const newScale = Math.min(scaleX, scaleY, 2);
    setScale(newScale);
    setPosition({ x: 50, y: 50 });
  }, []);

  const fitBounds = useCallback((minX, minY, maxX, maxY, stageWidth, stageHeight) => {
    const padding = 40; // pixels
    const contentW = (maxX - minX) * METERS_TO_PIXELS;
    const contentH = (maxY - minY) * METERS_TO_PIXELS;

    if (contentW <= 0 || contentH <= 0) return;

    const scaleX = (stageWidth - padding * 2) / contentW;
    const scaleY = (stageHeight - padding * 2) / contentH;
    const newScale = Math.min(scaleX, scaleY, 2); // Max zoom in = 2

    // Center point of content
    const cx = (minX + maxX) / 2 * METERS_TO_PIXELS;
    const cy = (minY + maxY) / 2 * METERS_TO_PIXELS;

    setScale(newScale);
    setPosition({
      x: stageWidth / 2 - cx * newScale,
      y: stageHeight / 2 - cy * newScale,
    });
  }, []);

  // Zoom đến vị trí entity cụ thể (khi search)
  const zoomToEntity = useCallback((entity, stageWidth, stageHeight, customScale = 2) => {
    if (!entity || typeof entity.x !== 'number' || typeof entity.y !== 'number') return;
    
    const targetX = entity.x * METERS_TO_PIXELS;
    const targetY = entity.y * METERS_TO_PIXELS;
    
    setScale(customScale);
    setPosition({
      x: stageWidth / 2 - targetX * customScale,
      y: stageHeight / 2 - targetY * customScale,
    });
    setHighlightedEntity(entity.id || entity.entity_id);
    setMode('search');

    // Chuyển tầng
    if (entity.z !== undefined || entity.position?.z !== undefined) {
      setSelectedFloorZ(entity.z ?? entity.position?.z ?? 0);
    }
  }, []);

  const clearHighlight = useCallback(() => {
    setHighlightedEntity(null);
    setHighlightedRoomId(null);
  }, []);

  return {
    scale, setScale,
    position, setPosition,
    mode, setMode,
    selectedEntity, setSelectedEntity,
    highlightedEntity, setHighlightedEntity,
    highlightedRoomId, setHighlightedRoomId,
    selectedFloorZ, setSelectedFloorZ,
    zoomIn, zoomOut, fitView, fitBounds,
    zoomToEntity, clearHighlight,
  };
}
