'use client';

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

const EntityContext = createContext();

export function EntityProvider({ children }) {
  // Cấp độ view hiện tại: 'house', 'floor', 'room', 'container', 'search'
  const [currentView, setCurrentView] = useState('house');
  
  // Mảng breadcrumb lưu vết đường dẫn từ House -> Item
  const [breadcrumb, setBreadcrumb] = useState([]);
  
  // Entity đang được chọn (để hiển thị ở sidebar)
  const [selectedEntity, setSelectedEntity] = useState(null);
  
  // Mode của UI: 'search' (mặc định) hoặc 'edit'
  const [viewMode, setViewMode] = useState('search');

  // Điều hướng xuống 1 cấp (drill-down)
  const navigateTo = useCallback((entity) => {
    if (!entity) {
      setCurrentView('house');
      setBreadcrumb([]);
      setSelectedEntity(null);
      return;
    }

    // Nếu entity là item, ta không drill-down nữa, chỉ chọn nó
    if (entity.type === 'item') {
      setSelectedEntity(entity);
      return;
    }

    // Cập nhật breadcrumb
    setBreadcrumb(prev => {
      // Nếu entity đã nằm trong breadcrumb, cắt bớt tới đoạn đó
      const index = prev.findIndex(item => item.id === entity.id);
      if (index !== -1) {
        return prev.slice(0, index + 1);
      }
      return [...prev, entity];
    });

    setCurrentView(entity.type);
    setSelectedEntity(null); // Xóa chọn khi đổi view
  }, []);

  // Điều hướng lùi lại 1 cấp
  const navigateUp = useCallback(() => {
    setBreadcrumb(prev => {
      if (prev.length <= 1) {
        setCurrentView('house');
        return [];
      }
      const newBreadcrumb = prev.slice(0, -1);
      const lastEntity = newBreadcrumb[newBreadcrumb.length - 1];
      setCurrentView(lastEntity.type);
      return newBreadcrumb;
    });
    setSelectedEntity(null);
  }, []);

  // Về thẳng màn hình chính (House)
  const goHome = useCallback(() => {
    setBreadcrumb([]);
    setCurrentView('house');
    setSelectedEntity(null);
  }, []);

  // Set mode explicitly
  const toggleViewMode = useCallback((mode) => {
    setViewMode(mode);
    if (mode === 'search') {
      setCurrentView('search');
    } else {
      // Khi quay lại edit, về state dựa trên breadcrumb
      setCurrentView(breadcrumb.length > 0 ? breadcrumb[breadcrumb.length - 1].type : 'house');
    }
  }, [breadcrumb]);

  const value = useMemo(() => ({
    currentView,
    setCurrentView,
    breadcrumb,
    setBreadcrumb,
    selectedEntity,
    setSelectedEntity,
    viewMode,
    toggleViewMode,
    navigateTo,
    navigateUp,
    goHome
  }), [
    currentView, breadcrumb, selectedEntity, viewMode, 
    toggleViewMode, navigateTo, navigateUp, goHome
  ]);

  return (
    <EntityContext.Provider value={value}>
      {children}
    </EntityContext.Provider>
  );
}

export function useEntityContext() {
  const context = useContext(EntityContext);
  if (!context) {
    throw new Error('useEntityContext must be used within an EntityProvider');
  }
  return context;
}
