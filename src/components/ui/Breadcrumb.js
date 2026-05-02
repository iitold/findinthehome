'use client';

import { useEntityContext } from './EntityProvider';
import { ChevronRight, Home } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';

export default function Breadcrumb() {
  const { breadcrumb, goHome, navigateTo } = useEntityContext();
  const { t } = useTranslation();

  return (
    <nav className="breadcrumb">
      <button className="breadcrumb-item" onClick={goHome}>
        <Home size={16} />
        <span>{t('app.title') || 'Home'}</span>
      </button>
      
      {breadcrumb.map((entity, index) => (
        <div key={entity.id} className="breadcrumb-segment">
          <ChevronRight size={14} className="breadcrumb-separator" />
          <button 
            className="breadcrumb-item"
            onClick={() => {
              // Nếu bấm vào phần tử ở giữa, sẽ pop các phần tử phía sau ra
              // Hành vi này đã được xử lý trong navigateTo (cắt breadcrumb đến đúng entity này)
              navigateTo(entity);
            }}
          >
            <span>{entity.name}</span>
          </button>
        </div>
      ))}
    </nav>
  );
}
