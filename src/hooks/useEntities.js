'use client';

import { useState, useCallback } from 'react';

export function useEntities() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Lấy cây entities
  const fetchTree = useCallback(async (parentId = null, depth = 2) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ depth: String(depth) });
      if (parentId) params.set('parent_id', parentId);

      const res = await fetch(`/api/entities/tree?${params}`);
      const json = await res.json();

      if (json.error) {
        setError(json.error);
        return null;
      }
      return json.data;
    } catch (err) {
      setError({ message: err.message, code: 'NETWORK_ERROR' });
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Tạo entity mới
  const createEntity = useCallback(async (entityData) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/entities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entityData),
      });
      const json = await res.json();

      if (json.error) {
        setError(json.error);
        return null;
      }
      return json.data;
    } catch (err) {
      setError({ message: err.message, code: 'NETWORK_ERROR' });
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Cập nhật entity
  const updateEntity = useCallback(async (id, updateData) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/entities/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });
      const json = await res.json();

      if (json.error) {
        setError(json.error);
        return null;
      }
      return json.data;
    } catch (err) {
      setError({ message: err.message, code: 'NETWORK_ERROR' });
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Xóa entity
  const deleteEntity = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/entities/${id}`, { method: 'DELETE' });
      const json = await res.json();

      if (json.error) {
        setError(json.error);
        return null;
      }
      return json.data;
    } catch (err) {
      setError({ message: err.message, code: 'NETWORK_ERROR' });
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Di chuyển (reparent)
  const moveEntity = useCallback(async (id, newParentId, position = {}) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/entities/${id}/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_parent_id: newParentId, ...position }),
      });
      const json = await res.json();

      if (json.error) {
        setError(json.error);
        return null;
      }
      return json.data;
    } catch (err) {
      setError({ message: err.message, code: 'NETWORK_ERROR' });
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Thay đổi vị trí (spatial)
  const repositionEntity = useCallback(async (id, x, y) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/entities/${id}/reposition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ x, y }),
      });
      const json = await res.json();

      if (json.error) {
        setError(json.error);
        return null;
      }
      return json.data;
    } catch (err) {
      setError({ message: err.message, code: 'NETWORK_ERROR' });
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch toàn bộ floor (cho FloorCanvas)
  const fetchFloor = useCallback(async (z) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/entities/floor/${z}`);
      const json = await res.json();

      if (json.error) {
        setError(json.error);
        return null;
      }
      return json.data;
    } catch (err) {
      setError({ message: err.message, code: 'NETWORK_ERROR' });
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { 
    fetchTree, fetchFloor, createEntity, updateEntity, 
    deleteEntity, moveEntity, repositionEntity, 
    loading, error 
  };
}
