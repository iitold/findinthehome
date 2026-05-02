'use client';

import { useRef, useEffect, useState, useMemo } from 'react';
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
 * Hỗ trợ zoom, pan, edit mode, và search highlight
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
  const trRef = useRef(null);
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
  }, [isEditMode, selectedEntity, scale, position]); // Phụ thuộc thêm scale/pos để gắn lại khi zoom/pan nếu cần

  // Lấy danh sách con cháu của selectedEntity để tính Bounding Box chặn Resize
  const childrenBBox = useMemo(() => {
    if (!selectedEntity || !isEditMode) return null;
    
    // Tìm tất cả các entity nằm trong selectedEntity
    const descendants = entities.filter(e => 
      e.id !== selectedEntity.id &&
      e.path && selectedEntity.path &&
      e.path.startsWith(selectedEntity.path)
    );

    if (descendants.length === 0) return null;

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    descendants.forEach(d => {
      const w = d.width || 0.3; // fallback 0.3m
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

    // Zoom vào con trỏ chuột
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
        width={stageSize.width}
        height={stageSize.height}
        scaleX={scale}
        scaleY={scale}
        x={position.x}
        y={position.y}
        draggable={!isEditMode}
        onWheel={handleWheel}
        onDragEnd={(e) => {
          // Chỉ pan khi kéo Stage (không phải entity)
          if (e.target === e.target.getStage()) {
            setPosition({
              x: e.target.x(),
              y: e.target.y(),
            });
          }
        }}
        onClick={(e) => {
          // Click vào vùng trống → bỏ chọn
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
              onDragStart={onDragStart}
              onDragMove={onDragMove}
              onDragEnd={onDragEnd}
              editMode={isEditMode}
              isDragged={draggedEntityId === entity.id}
              isDropTarget={dropTargetId === entity.id}
              isValidDrop={isValidDrop}
              theme={theme}
            />
          ))}

          {/* Render doors & windows (lớp kiến trúc, trên tường) */}
          {doors.map(entity => (
            <DoorShape
              key={entity.id}
              entity={entity}
              isSelected={selectedEntity?.id === entity.id}
              isHighlighted={highlightedEntity === entity.id}
              onSelect={onSelectEntity}
              onDragStart={onDragStart}
              onDragMove={onDragMove}
              onDragEnd={onDragEnd}
              editMode={isEditMode}
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
              onDragStart={onDragStart}
              onDragMove={onDragMove}
              onDragEnd={onDragEnd}
              editMode={isEditMode}
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
              onDragStart={onDragStart}
              onDragMove={onDragMove}
              onDragEnd={onDragEnd}
              editMode={isEditMode}
              isDragged={draggedEntityId === entity.id}
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
              onDragStart={onDragStart}
              onDragMove={onDragMove}
              onDragEnd={onDragEnd}
              editMode={isEditMode}
              isDragged={draggedEntityId === entity.id}
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
                // Kích thước tối thiểu: 0.5m x 0.5m (25px x 25px)
                if (newBox.width < 25 || newBox.height < 25) {
                  return oldBox;
                }

                // Giới hạn resize không được cắt vào đồ vật bên trong
                if (childrenBBox) {
                  // Chỉ chặn khi người dùng cố tình "bóp nhỏ" (shrink) phòng/hộp lấn qua đồ vật.
                  // Nếu người dùng đang phóng to (enlarge), ta luôn cho phép.
                  // Điều này tránh việc container có padding làm cho childrenBBox nhô ra 2px và khóa vĩnh viễn resize.
                  
                  // Chặn không cho tường trái lấn qua đồ vật (khi đang kéo sang phải)
                  if (newBox.x > childrenBBox.x && newBox.x > oldBox.x) return oldBox;
                  // Chặn không cho tường trên lấn qua đồ vật (khi đang kéo xuống dưới)
                  if (newBox.y > childrenBBox.y && newBox.y > oldBox.y) return oldBox;
                  // Chặn không cho tường phải lấn qua đồ vật (khi đang kéo sang trái)
                  if (newBox.x + newBox.width < childrenBBox.maxX && newBox.x + newBox.width < oldBox.x + oldBox.width) return oldBox;
                  // Chặn không cho tường dưới lấn qua đồ vật (khi đang kéo lên trên)
                  if (newBox.y + newBox.height < childrenBBox.maxY && newBox.y + newBox.height < oldBox.y + oldBox.height) return oldBox;
                }

                return newBox;
              }}
              onTransformEnd={(e) => {
                const node = trRef.current.nodes()[0];
                if (!node) return;

                const scaleX = node.scaleX();
                const scaleY = node.scaleY();
                
                // Reset scale về 1 để chữ không bị biến dạng vĩnh viễn
                node.scaleX(1);
                node.scaleY(1);

                const id = node.id();
                const entity = floorEntities.find(ent => ent.id === id);
                if (!entity) return;

                // Nếu là ContainerShape thì nó có Padding, nhưng toạ độ x của Group đã gồm padding.
                // Tuy nhiên, Transformer scale theo Group size (bao gồm cả x, y của group).
                // Do ContainerShape có Group: x = entity.x * 50 + PADDING, width = entity.width * 50 - 2*PADDING.
                // Thực tế Node là Group, width lúc scale sẽ được nhân lên.
                // Làm tròn 2 chữ số thập phân (VD: 4.99999 -> 5.00)
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
  const gridSize = METERS_TO_PIXELS; // 1 mét = 1 ô lưới
  const lines = [];

  // Vertical lines
  for (let x = 0; x < width; x += gridSize) {
    lines.push(
      <Rect
        key={`v-${x}`}
        x={x}
        y={0}
        width={1}
        height={height}
        fill={gridColor}
        opacity={gridOpacity}
      />
    );
  }

  // Horizontal lines
  for (let y = 0; y < height; y += gridSize) {
    lines.push(
      <Rect
        key={`h-${y}`}
        x={0}
        y={y}
        width={width}
        height={1}
        fill={gridColor}
        opacity={gridOpacity}
      />
    );
  }

  return <>{lines}</>;
}
