'use client';

import { Search, X } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function SearchInput({ query, setQuery, loading }) {
  const { t } = useTranslation();

  return (
    <div className="search-input-wrapper">
      <Search size={18} className="search-icon" />
      <input
        id="search-input"
        type="text"
        className="search-input"
        placeholder={t('search.placeholder')}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        autoComplete="off"
      />
      {loading && (
        <div className="search-spinner">
          <LoadingSpinner size={16} />
        </div>
      )}
      {query && !loading && (
        <button
          className="search-clear"
          onClick={() => setQuery('')}
          title="Clear"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}
