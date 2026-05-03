'use client';

import { MapPin, Package, Box, Home, Layers } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import Breadcrumb from './Breadcrumb';

const typeIcons = {
  house: Home,
  floor: Layers,
  room: MapPin,
  container: Box,
  item: Package,
};

export default function SearchResults({ results, totalCount, searchType, onResultClick }) {
  const { t } = useTranslation();

  if (results.length === 0) {
    return (
      <div className="search-empty">
        <Package size={32} strokeWidth={1} />
        <p>{t('search.noResults')}</p>
      </div>
    );
  }

  return (
    <div className="search-results">
      <div className="search-results-header">
        <span className="search-count">
          {totalCount} {totalCount === 1 ? t('search.result') : t('search.results')}
        </span>
        {searchType === 'ilike' && (
          <span className="search-badge search-badge-fallback">Fuzzy</span>
        )}
      </div>

      <div className="search-results-list">
        {results.map((result) => {
          const Icon = typeIcons[result.type] || Package;

          return (
            <div
              key={result.entity_id}
              className="search-result-card"
              onClick={() => onResultClick(result)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onResultClick(result);
                }
              }}
            >
              <div className="search-result-icon" style={{ color: result.color }}>
                <Icon size={16} />
              </div>
              <div className="search-result-info">
                <span className="search-result-name">{result.name}</span>
                <Breadcrumb
                  pathNames={result.path_names}
                  pathTypes={result.path_types}
                />
              </div>
              <div className="search-result-action">
                <MapPin size={14} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
