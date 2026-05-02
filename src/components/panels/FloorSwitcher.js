'use client';

import { useTranslation } from '@/lib/i18n/useTranslation';
import { Layers } from 'lucide-react';

export default function FloorSwitcher({ floors, selectedFloorZ, onFloorSelect }) {
  const { t } = useTranslation();

  if (!floors || floors.length === 0) {
    return (
      <div className="floor-switcher floor-switcher-empty">
        <Layers size={16} />
        <span>{t('floor.noFloors')}</span>
      </div>
    );
  }

  return (
    <div className="floor-switcher">
      <span className="floor-switcher-label">{t('floor.switchFloor')}</span>
      <div className="floor-tabs">
        {floors.map((floor) => (
          <button
            key={floor.id}
            className={`floor-tab ${floor.z === selectedFloorZ ? 'floor-tab-active' : ''}`}
            onClick={() => onFloorSelect(floor)}
          >
            <Layers size={14} />
            <span>{floor.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
