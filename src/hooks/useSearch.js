'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

export function useSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchType, setSearchType] = useState(null);
  const debounceRef = useRef(null);

  // Debounce 300ms rồi gọi API
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setTotalCount(0);
      setSearchType(null);
      return;
    }

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          q: query.trim(),
          limit: '20',
          offset: '0',
        });
        const res = await fetch(`/api/search?${params}`);
        const json = await res.json();

        if (json.error && json.error.code !== 'EMPTY_SEARCH') {
          setError(json.error);
        }

        setResults(json.data || []);
        setTotalCount(json.total_count || 0);
        setSearchType(json.search_type || null);
      } catch (err) {
        setError({ message: err.message, code: 'NETWORK_ERROR' });
      } finally {
        setLoading(false);
      }
    }, 300); // Debounce 300ms

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query]);

  const clearSearch = useCallback(() => {
    setQuery('');
    setResults([]);
    setTotalCount(0);
    setError(null);
    setSearchType(null);
  }, []);

  return {
    query,
    setQuery,
    results,
    totalCount,
    loading,
    error,
    searchType,
    clearSearch,
  };
}
