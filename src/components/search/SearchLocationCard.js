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
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="location-card-icon" style={{ backgroundColor: result.color || 'var(--accent)', color: '#fff' }}>
            <Icon size={20} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
              {result.name}
            </h3>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Kết quả tìm kiếm
            </div>
          </div>
        </div>
        <button onClick={onClose} className="btn-icon" title="Đóng">
          <X size={20} />
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
                  <PathIcon size={12} style={{ marginRight: '4px' }} />
                  {name}
                </button>
                {!isLast && <ChevronRight size={14} style={{ color: 'var(--text-muted)', margin: '0 4px' }} />}
              </div>
            );
          })}
        </div>
      </div>

      <style jsx>{`
        .search-location-card {
          position: absolute;
          background: var(--bg-card);
          border: 1px solid var(--border);
          box-shadow: var(--shadow-lg);
          z-index: 100;
        }

        /* Desktop Positioning */
        @media (min-width: 769px) {
          .search-location-card {
            top: 16px;
            right: 16px;
            width: 320px;
            border-radius: var(--radius);
          }
        }

        /* Mobile Positioning (Bottom Sheet) */
        @media (max-width: 768px) {
          .search-location-card {
            bottom: 70px; /* Above mobile nav */
            left: 16px;
            right: 16px;
            border-radius: var(--radius-lg);
            animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          }
        }

        .location-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px;
          border-bottom: 1px solid var(--border);
        }

        .location-card-icon {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .location-card-body {
          padding: 12px 16px;
        }

        .location-breadcrumb {
          display: flex;
          align-items: center;
          overflow-x: auto;
          padding-bottom: 4px;
        }

        .breadcrumb-btn {
          background: none;
          border: none;
          padding: 4px 8px;
          border-radius: 12px;
          color: var(--text-secondary);
          font-size: 13px;
          cursor: pointer;
          display: flex;
          align-items: center;
          white-space: nowrap;
          transition: background 0.2s, color 0.2s;
        }

        .breadcrumb-btn:hover {
          background: var(--bg-hover);
          color: var(--text-primary);
        }

        .breadcrumb-btn.active {
          background: var(--accent-glow);
          color: var(--accent);
          font-weight: 500;
        }

        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
