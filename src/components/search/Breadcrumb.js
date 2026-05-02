'use client';

import { ChevronRight } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';

export default function Breadcrumb({ pathNames, pathTypes, onSegmentClick }) {
  const { t } = useTranslation();

  if (!pathNames || pathNames.length === 0) return null;

  return (
    <nav className="breadcrumb" aria-label="breadcrumb">
      {pathNames.map((name, index) => (
        <span key={index} className="breadcrumb-segment">
          {index > 0 && <ChevronRight size={14} className="breadcrumb-separator" />}
          <button
            className={`breadcrumb-item breadcrumb-type-${pathTypes?.[index] || 'item'}`}
            onClick={() => onSegmentClick?.(index)}
          >
            {name}
          </button>
        </span>
      ))}
    </nav>
  );
}
