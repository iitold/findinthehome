'use client';

import { useTranslation } from '@/lib/i18n/useTranslation';
import {
  Edit3, Search, ZoomIn, ZoomOut, Maximize2,
  Home, Layers, Square, Box, Circle, Trash2, DoorOpen, AppWindow
} from 'lucide-react';

export default function CanvasToolbar({
  mode,
  onModeChange,
  onZoomIn,
  onZoomOut,
  onFitView,
  onAddEntity,
  onDeleteSelected,
  selectedEntity,
  selectedFloorZ,
  hasFloors,
  floors,
  onFloorSelect,
}) {
  const { t } = useTranslation();

  return (
    <div className="canvas-toolbar">
      {/* Floor Tab Pills */}
      {floors && floors.length > 0 && (
        <div className="toolbar-group toolbar-floor-pills">
          {floors.map((floor) => (
            <button
              key={floor.id}
              className={`toolbar-btn toolbar-floor-pill ${floor.z === selectedFloorZ ? 'toolbar-floor-pill-active' : ''}`}
              onClick={() => onFloorSelect?.(floor)}
              title={floor.name}
            >
              <Layers size={14} />
              <span className="floor-pill-label">{floor.name}</span>
            </button>
          ))}
        </div>
      )}

      {/* Zoom controls */}
      <div className="toolbar-group">
        <button className="toolbar-btn" onClick={onZoomIn} title={t('canvas.zoomIn')}>
          <ZoomIn size={16} /> <span className="hide-on-mobile">{t('canvas.zoomIn') || 'Phóng to'}</span>
        </button>
        <button className="toolbar-btn" onClick={onZoomOut} title={t('canvas.zoomOut')}>
          <ZoomOut size={16} /> <span className="hide-on-mobile">{t('canvas.zoomOut') || 'Thu nhỏ'}</span>
        </button>
        <button className="toolbar-btn" onClick={onFitView} title={t('canvas.fitView')}>
          <Maximize2 size={16} /> <span className="hide-on-mobile">{t('canvas.fitView') || 'Vừa khung'}</span>
        </button>
      </div>

      {/* Add entity buttons (chỉ hiện ở edit mode) */}
      {mode === 'edit' && (
        <div className="toolbar-group" style={{ flexWrap: 'wrap' }}>
          {selectedFloorZ === undefined && (
            <button
              className="toolbar-btn toolbar-btn-add"
              onClick={() => onAddEntity('house')}
              title={t('entity.addHouse')}
            >
              <Home size={16} /> <span className="hide-on-mobile">{t('entity.addHouse') || 'Thêm nhà'}</span>
            </button>
          )}
          {selectedEntity?.type === 'house' && (
            <button
              className="toolbar-btn toolbar-btn-add"
              onClick={() => onAddEntity('floor')}
              title={t('entity.addFloor')}
            >
              <Layers size={16} /> <span className="hide-on-mobile">{t('entity.addFloor') || 'Thêm tầng'}</span>
            </button>
          )}
          {hasFloors && (
            <button
              className="toolbar-btn toolbar-btn-add"
              onClick={() => onAddEntity('room')}
              title={t('entity.addRoom')}
            >
              <Square size={16} /> <span className="hide-on-mobile">{t('entity.addRoom') || 'Thêm phòng'}</span>
            </button>
          )}
          {selectedEntity?.type === 'room' || selectedEntity?.type === 'container' ? (
            <>
              {selectedEntity?.type === 'room' && (
                <>
                  <button
                    className="toolbar-btn toolbar-btn-add"
                    onClick={() => onAddEntity('door')}
                    title={t('canvas.addDoor')}
                  >
                    <DoorOpen size={16} /> <span className="hide-on-mobile">Cửa</span>
                  </button>
                  <button
                    className="toolbar-btn toolbar-btn-add"
                    onClick={() => onAddEntity('window')}
                    title={t('canvas.addWindow')}
                  >
                    <AppWindow size={16} /> <span className="hide-on-mobile">Cửa sổ</span>
                  </button>
                </>
              )}
              <button
                className="toolbar-btn toolbar-btn-add"
                onClick={() => onAddEntity('container')}
                title={t('entity.addContainer')}
              >
                <Box size={16} /> <span className="hide-on-mobile">{t('entity.addContainer') || 'Thêm kệ/tủ'}</span>
              </button>
              <button
                className="toolbar-btn toolbar-btn-add"
                onClick={() => onAddEntity('item')}
                title={t('entity.addItem')}
              >
                <Circle size={16} /> <span className="hide-on-mobile">{t('entity.addItem') || 'Thêm đồ'}</span>
              </button>
            </>
          ) : null}
          {selectedEntity && (
            <button
              className="toolbar-btn toolbar-btn-danger"
              onClick={onDeleteSelected}
              title={t('entity.delete')}
            >
              <Trash2 size={16} /> <span className="hide-on-mobile">{t('entity.delete') || 'Xóa'}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
