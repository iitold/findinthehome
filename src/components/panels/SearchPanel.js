'use client';

import SearchInput from '@/components/search/SearchInput';
import SearchResults from '@/components/search/SearchResults';
import Breadcrumb from '@/components/search/Breadcrumb';

export default function SearchPanel({
  query,
  setQuery,
  results,
  totalCount,
  loading,
  searchType,
  selectedResult,
  onResultClick,
}) {
  return (
    <div className="search-panel">
      <SearchInput
        query={query}
        setQuery={setQuery}
        loading={loading}
      />

      {selectedResult && (
        <div className="search-selected-result">
          <Breadcrumb
            pathNames={selectedResult.path_names}
            pathTypes={selectedResult.path_types}
          />
        </div>
      )}

      {query.trim() && (
        <SearchResults
          results={results}
          totalCount={totalCount}
          searchType={searchType}
          onResultClick={onResultClick}
        />
      )}
    </div>
  );
}
