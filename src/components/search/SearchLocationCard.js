'use client';

import { X, MapPin, Package, Box, Layers, Home, ChevronRight } from 'lucide-react';

const typeIcons = {
  house: Home,
  floor: Layers,
  room: MapPin,
  container: Box,
  item: Package,
};

export default function SearchLocationCard({ result, onClose, onNavigate }) {
  if (!result) return null;

  const Icon = typeIcons[result.type] || Package;

  return (
    <div className="search-location-card">
      <div className="location-card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className="location-card-icon" style={{ backgroundColor: result.color || 'var(--accent)', color: '#fff' }}>
            <Icon size={16} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
              {result.name}
            </h3>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '1px' }}>
              Kết quả tìm kiếm
            </div>
          </div>
        </div>
        <button onClick={onClose} className="btn-icon" title="Đóng">
          <X size={16} />
        </button>
      </div>

      <div className="location-card-body">
        <div className="location-breadcrumb hide-scrollbar">
          {(result.path_names || []).map((name, index) => {
            const isLast = index === result.path_names.length - 1;
            const pathType = result.path_types[index];
            const PathIcon = typeIcons[pathType] || Package;
            const pathId = result.path_ids[index];

            return (
              <div key={index} style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                <button
                  onClick={() => onNavigate?.({ id: pathId, type: pathType, name })}
                  className={`breadcrumb-btn ${isLast ? 'active' : ''}`}
                  title={`Đi tới ${name}`}
                >
                  <PathIcon size={10} style={{ marginRight: '3px' }} />
                  {name}
                </button>
                {!isLast && <ChevronRight size={14} style={{ color: 'var(--text-muted)', margin: '0 4px' }} />}
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
