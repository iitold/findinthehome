'use client';

import { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { Stage, Layer, Rect, Text, Transformer } from 'react-konva';
import RoomShape from './RoomShape';
import ContainerShape from './ContainerShape';
import ItemShape from './ItemShape';
import DoorShape from './DoorShape';
import WindowShape from './WindowShape';
import { METERS_TO_PIXELS } from '@/lib/constants';
import { useTheme } from '@/lib/theme/ThemeContext';

/**
 * FloorCanvas — Canvas 2D chính sử dụng React-Konva v8
 * Render entities theo tầng (z filter)
 * Hỗ trợ zoom, pan, edit mode, search highlight, và parent-child drag
 */
export default function FloorCanvas({
  entities,
  selectedFloorZ,
  scale,
  position,
  setScale,
  setPosition,
  mode,
  selectedEntity,
  highlightedEntity,
  highlightedRoomId,
  onSelectEntity,
  onDragStart,
  onDragMove,
  onDragEnd,
  onResizeEnd,
  draggedEntityId,
  dropTargetId,
  isValidDrop,
}) {
  const containerRef = useRef(null);
  const stageRef = useRef(null);
  const trRef = useRef(null);
  const dragInfoRef = useRef(null); // Track descendants during drag
  const [stageSize, setStageSize] = useState({ width: 800, height: 600 });
  const isEditMode = mode === 'edit';
  const { theme } = useTheme();

  // Canvas colors theo theme
  const canvasBg = theme === 'dark' ? '#0a0e1a' : '#f1f5f9';
  const gridColor = theme === 'dark' ? '#94A3B8' : '#94A3B8';
  const gridOpacity = theme === 'dark' ? 0.12 : 0.2;

  // Gắn Transformer vào entity đang được chọn (chỉ phòng/hộp và trong editMode)
  useEffect(() => {
    if (isEditMode && selectedEntity && (selectedEntity.type === 'room' || selectedEntity.type === 'container')) {
      const stage = trRef.current?.getStage();
      const selectedNode = stage?.findOne(`#${selectedEntity.id}`);
      
      if (selectedNode && trRef.current) {
        trRef.current.nodes([selectedNode]);
        trRef.current.getLayer().batchDraw();
      } else if (trRef.current) {
        trRef.current.nodes([]);
        trRef.current.getLayer().batchDraw();
      }
    } else if (trRef.current) {
      trRef.current.nodes([]);
      trRef.current.getLayer().batchDraw();
    }
  }, [isEditMode, selectedEntity, scale, position]);

  // Lấy danh sách con cháu của selectedEntity để tính Bounding Box chặn Resize
  const childrenBBox = useMemo(() => {
    if (!selectedEntity || !isEditMode) return null;
    
    const descendants = entities.filter(e => 
      e.id !== selectedEntity.id &&
      e.path && selectedEntity.path &&
      e.path.startsWith(selectedEntity.path)
    );

    if (descendants.length === 0) return null;

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    descendants.forEach(d => {
      const w = d.width || 0.3;
      const h = d.height || 0.3;
      if (d.x < minX) minX = d.x;
      if (d.y < minY) minY = d.y;
      if (d.x + w > maxX) maxX = d.x + w;
      if (d.y + h > maxY) maxY = d.y + h;
    });

    if (minX === Infinity) return null;

    return {
      x: minX * METERS_TO_PIXELS,
      y: minY * METERS_TO_PIXELS,
      maxX: maxX * METERS_TO_PIXELS,
      maxY: maxY * METERS_TO_PIXELS
    };
  }, [selectedEntity, entities, isEditMode]);

  // Responsive stage size
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setStageSize({
          width: Math.max(containerRef.current.offsetWidth, 1),
          height: Math.max(containerRef.current.offsetHeight, 1),
        });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    
    let observer;
    if (typeof window !== 'undefined' && window.ResizeObserver && containerRef.current) {
      observer = new ResizeObserver(updateSize);
      observer.observe(containerRef.current);
    }
    
    return () => {
      window.removeEventListener('resize', updateSize);
      if (observer) observer.disconnect();
    };
  }, []);

  // Lọc entities theo tầng hiện tại
  const floorEntities = (entities || []).filter(e => e.z === selectedFloorZ);

  // Tách entities theo type để render đúng thứ tự (rooms dưới, items trên)
  const rooms = floorEntities.filter(e => e.type === 'room');
  const doors = floorEntities.filter(e => e.type === 'door');
  const windows = floorEntities.filter(e => e.type === 'window');
  const containers = floorEntities.filter(e => e.type === 'container');
  const items = floorEntities.filter(e => e.type === 'item');

  // === PARENT-CHILD DRAG: Setup descendants on drag start ===
  const handleChildDragStart = useCallback((entityId) => {
    const draggedEntity = entities.find(e => e.id === entityId);
    if (!draggedEntity) { onDragStart(entityId); return; }

    // Find all descendants (children, grandchildren, etc.)
    const descendants = entities.filter(e =>
      e.id !== entityId &&
      e.path && draggedEntity.path &&
      e.path.startsWith(draggedEntity.path)
    );

    // Store original positions for delta calculation
    dragInfoRef.current = {
      entityId,
      startX: draggedEntity.x,
      startY: draggedEntity.y,
      descendants: descendants.map(d => ({
        id: d.id,
        startX: d.x,
        startY: d.y,
        type: d.type,
      })),
    };

    onDragStart(entityId);
  }, [entities, onDragStart]);

  // === PARENT-CHILD DRAG: Move descendants imperatively during drag ===
  const handleChildDragMove = useCallback((entityId, newX, newY) => {
    // Move descendants visually via Konva API (no React re-render needed)
    if (dragInfoRef.current && dragInfoRef.current.entityId === entityId && stageRef.current) {
      const dx = newX - dragInfoRef.current.startX;
      const dy = newY - dragInfoRef.current.startY;
      const stage = stageRef.current;

      dragInfoRef.current.descendants.forEach(desc => {
        const node = stage.findOne(`#${desc.id}`);
        if (node) {
          const padding = desc.type === 'container' ? 2 : 0;
          node.x((desc.startX + dx) * METERS_TO_PIXELS + padding);
          node.y((desc.startY + dy) * METERS_TO_PIXELS + padding);
        }
      });
    }

    onDragMove(entityId, newX, newY);
  }, [onDragMove]);

  // === PARENT-CHILD DRAG: Report all descendants on drag end ===
  const handleChildDragEnd = useCallback((entityId, newX, newY) => {
    let descendantUpdates = [];

    if (dragInfoRef.current && dragInfoRef.current.entityId === entityId) {
      const dx = newX - dragInfoRef.current.startX;
      const dy = newY - dragInfoRef.current.startY;

      if (dx !== 0 || dy !== 0) {
        descendantUpdates = dragInfoRef.current.descendants.map(desc => ({
          id: desc.id,
          x: desc.startX + dx,
          y: desc.startY + dy,
        }));
      }
    }

    dragInfoRef.current = null;
    onDragEnd(entityId, newX, newY, descendantUpdates);
  }, [onDragEnd]);

  // Zoom bằng scroll wheel
  const handleWheel = (e) => {
    e.evt.preventDefault();
    const stage = e.target.getStage();
    const oldScale = scale;
    const pointer = stage.getPointerPosition();

    const scaleBy = 1.08;
    const newScale = e.evt.deltaY < 0
      ? oldScale * scaleBy
      : oldScale / scaleBy;

    const clampedScale = Math.max(0.1, Math.min(5, newScale));

    const mousePointTo = {
      x: (pointer.x - position.x) / oldScale,
      y: (pointer.y - position.y) / oldScale,
    };

    setScale(clampedScale);
    setPosition({
      x: pointer.x - mousePointTo.x * clampedScale,
      y: pointer.y - mousePointTo.y * clampedScale,
    });
  };

  return (
    <div ref={containerRef} className="canvas-container" style={{ width: '100%', height: '100%', minHeight: 100 }}>
      {stageSize.width > 1 && stageSize.height > 1 && (
        <Stage
        ref={stageRef}
        width={stageSize.width}
        height={stageSize.height}
        scaleX={scale}
        scaleY={scale}
        x={position.x}
        y={position.y}
        draggable={!isEditMode}
        onWheel={handleWheel}
        onDragEnd={(e) => {
          if (e.target === e.target.getStage()) {
            setPosition({
              x: e.target.x(),
              y: e.target.y(),
            });
          }
        }}
        onClick={(e) => {
          if (e.target === e.target.getStage()) {
            onSelectEntity?.(null);
          }
        }}
      >
        <Layer>
          {/* Canvas background theo theme */}
          <Rect
            x={-5000} y={-5000}
            width={10000} height={10000}
            fill={canvasBg}
            listening={false}
          />

          {/* Grid background - Only show in edit mode */}
          {isEditMode && (
            <GridLines
              width={stageSize.width / scale + 200}
              height={stageSize.height / scale + 200}
              gridColor={gridColor}
              gridOpacity={gridOpacity}
            />
          )}

          {/* Render rooms (lớp dưới cùng) */}
          {rooms.map(entity => (
            <RoomShape
              key={entity.id}
              entity={entity}
              isSelected={selectedEntity?.id === entity.id}
              isHighlighted={highlightedEntity === entity.id}
              isSearchHighlighted={highlightedRoomId === entity.id}
              onSelect={onSelectEntity}
              onDragStart={handleChildDragStart}
              onDragMove={handleChildDragMove}
              onDragEnd={handleChildDragEnd}
              editMode={isEditMode}
              isDragged={draggedEntityId === entity.id}
              dragLocked={!!draggedEntityId && draggedEntityId !== entity.id}
              isDropTarget={dropTargetId === entity.id}
              isValidDrop={isValidDrop}
              theme={theme}
            />
          ))}

          {/* Render doors & windows */}
          {doors.map(entity => (
            <DoorShape
              key={entity.id}
              entity={entity}
              isSelected={selectedEntity?.id === entity.id}
              isHighlighted={highlightedEntity === entity.id}
              onSelect={onSelectEntity}
              onDragStart={handleChildDragStart}
              onDragMove={handleChildDragMove}
              onDragEnd={handleChildDragEnd}
              editMode={isEditMode}
              dragLocked={!!draggedEntityId && draggedEntityId !== entity.id}
              theme={theme}
            />
          ))}

          {windows.map(entity => (
            <WindowShape
              key={entity.id}
              entity={entity}
              isSelected={selectedEntity?.id === entity.id}
              isHighlighted={highlightedEntity === entity.id}
              onSelect={onSelectEntity}
              onDragStart={handleChildDragStart}
              onDragMove={handleChildDragMove}
              onDragEnd={handleChildDragEnd}
              editMode={isEditMode}
              dragLocked={!!draggedEntityId && draggedEntityId !== entity.id}
              theme={theme}
            />
          ))}

          {/* Render containers (lớp giữa) */}
          {containers.map(entity => (
            <ContainerShape
              key={entity.id}
              entity={entity}
              isSelected={selectedEntity?.id === entity.id}
              isHighlighted={highlightedEntity === entity.id}
              onSelect={onSelectEntity}
              onDragStart={handleChildDragStart}
              onDragMove={handleChildDragMove}
              onDragEnd={handleChildDragEnd}
              editMode={isEditMode}
              isDragged={draggedEntityId === entity.id}
              dragLocked={!!draggedEntityId && draggedEntityId !== entity.id}
              isDropTarget={dropTargetId === entity.id}
              isValidDrop={isValidDrop}
              theme={theme}
            />
          ))}

          {/* Render items (lớp trên cùng) */}
          {items.map(entity => (
            <ItemShape
              key={entity.id}
              entity={entity}
              isSelected={selectedEntity?.id === entity.id}
              isHighlighted={highlightedEntity === entity.id}
              onSelect={onSelectEntity}
              onDragStart={handleChildDragStart}
              onDragMove={handleChildDragMove}
              onDragEnd={handleChildDragEnd}
              editMode={isEditMode}
              isDragged={draggedEntityId === entity.id}
              dragLocked={!!draggedEntityId && draggedEntityId !== entity.id}
              isDropTarget={dropTargetId === entity.id}
              isValidDrop={isValidDrop}
              theme={theme}
            />
          ))}

          {/* Layer Transformer để Resize */}
          {isEditMode && (
            <Transformer
              ref={trRef}
              boundBoxFunc={(oldBox, newBox) => {
                if (newBox.width < 25 || newBox.height < 25) {
                  return oldBox;
                }

                if (childrenBBox) {
                  if (newBox.x > childrenBBox.x && newBox.x > oldBox.x) return oldBox;
                  if (newBox.y > childrenBBox.y && newBox.y > oldBox.y) return oldBox;
                  if (newBox.x + newBox.width < childrenBBox.maxX && newBox.x + newBox.width < oldBox.x + oldBox.width) return oldBox;
                  if (newBox.y + newBox.height < childrenBBox.maxY && newBox.y + newBox.height < oldBox.y + oldBox.height) return oldBox;
                }

                return newBox;
              }}
              onTransformEnd={(e) => {
                const node = trRef.current.nodes()[0];
                if (!node) return;

                const scaleX = node.scaleX();
                const scaleY = node.scaleY();
                
                node.scaleX(1);
                node.scaleY(1);

                const id = node.id();
                const entity = floorEntities.find(ent => ent.id === id);
                if (!entity) return;

                const round2 = (num) => Math.round(num * 100) / 100;

                const newX = round2(entity.x + (node.x() - (entity.x * METERS_TO_PIXELS + (entity.type === 'container' ? 2 : 0))) / METERS_TO_PIXELS);
                const newY = round2(entity.y + (node.y() - (entity.y * METERS_TO_PIXELS + (entity.type === 'container' ? 2 : 0))) / METERS_TO_PIXELS);
                
                const newWidth = round2(entity.width * scaleX);
                const newHeight = round2(entity.height * scaleY);

                onResizeEnd?.(id, newX, newY, newWidth, newHeight);
              }}
            />
          )}
        </Layer>
      </Stage>
      )}
    </div>
  );
}

/**
 * GridLines — Lưới nền cho canvas
 */
function GridLines({ width, height, gridColor = '#94A3B8', gridOpacity = 0.15 }) {
  const gridSize = METERS_TO_PIXELS;
  const lines = [];

  for (let x = 0; x < width; x += gridSize) {
    lines.push(
      <Rect
        key={`v-${x}`}
        x={x} y={0}
        width={1} height={height}
        fill={gridColor}
        opacity={gridOpacity}
      />
    );
  }

  for (let y = 0; y < height; y += gridSize) {
    lines.push(
      <Rect
        key={`h-${y}`}
        x={0} y={y}
        width={width} height={1}
        fill={gridColor}
        opacity={gridOpacity}
      />
    );
  }

  return <>{lines}</>;
}
