'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { HousePlus, LogOut, Plus, Shield, Edit3, X, Search as SearchIcon, Menu, Map, List, Home, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useEntities } from '@/hooks/useEntities';
import { useSearch } from '@/hooks/useSearch';
import { useCanvas } from '@/hooks/useCanvas';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { useToast } from '@/components/ui/Toast';
import { useDialog } from '@/components/ui/DialogContext';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';
import CanvasToolbar from '@/components/canvas/CanvasToolbar';
import SearchResults from '@/components/search/SearchResults';
import SearchLocationCard from '@/components/search/SearchLocationCard';
import TreePanel from '@/components/panels/TreePanel';
import PropertyPanel from '@/components/panels/PropertyPanel';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import AdminPanel from '@/components/admin/AdminPanel';
import ThemeSwitcher from '@/components/ui/ThemeSwitcher';
import { useEntityContext } from '@/components/ui/EntityProvider';
import HouseView from '@/components/views/HouseView';
import ContainerView from '@/components/views/ContainerView';

// Dynamic import cho FloorCanvas (Konva cần window)
import nextDynamic from 'next/dynamic';
const FloorCanvas = nextDynamic(
  () => import('@/components/canvas/FloorCanvas'),
  { ssr: false, loading: () => <div className="canvas-container"><LoadingSpinner size={32} /></div> }
);

export default function Dashboard() {
  const { currentView, setCurrentView, breadcrumb, setBreadcrumb, navigateTo } = useEntityContext();
  const { user, signOut, isAdmin } = useAuth();
  const [showAdmin, setShowAdmin] = useState(false);
  const { t } = useTranslation();
  const { addToast } = useToast();
  const { prompt, confirm } = useDialog();
  const { fetchTree, createEntity, updateEntity, deleteEntity, loading: crudLoading } = useEntities();
  const search = useSearch();
  const canvas = useCanvas();

  const [tree, setTree] = useState([]);
  const [allEntities, setAllEntities] = useState([]);
  const [editingEntity, setEditingEntity] = useState(null);
  const [selectedResult, setSelectedResult] = useState(null);
  const [draggedEntityId, setDraggedEntityId] = useState(null);
  const [dropTargetId, setDropTargetId] = useState(null);
  const [isValidDrop, setIsValidDrop] = useState(true);
  const [treeLoading, setTreeLoading] = useState(true);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Load tree khi mount
  const loadTree = useCallback(async () => {
    setTreeLoading(true);
    const data = await fetchTree(null, 5);
    if (data) {
      setTree(data);
      // Flatten tree để lấy tất cả entities
      const flat = flattenTree(data);
      setAllEntities(flat);
    }
    setTreeLoading(false);
  }, [fetchTree]);

  useEffect(() => { loadTree(); }, [loadTree]);

  // Lấy danh sách floors từ tree
  const floors = useMemo(() => {
    return allEntities.filter(e => e.type === 'floor').sort((a, b) => a.z - b.z);
  }, [allEntities]);

  // Chọn floor đầu tiên nếu chưa chọn
  useEffect(() => {
    if (floors.length > 0 && canvas.selectedFloorZ === undefined) {
      canvas.setSelectedFloorZ(floors[0].z);
    }
  }, [floors]);

  // Xử lý chọn entity
  const handleSelectEntity = useCallback((entity) => {
    canvas.setSelectedEntity(entity);
    setEditingEntity(null);
  }, [canvas]);

  // Bắt đầu kéo
  const handleDragStart = useCallback((entityId) => {
    setDraggedEntityId(entityId);
    setDropTargetId(null);
    setIsValidDrop(true);
  }, []);

  // Đang kéo (cập nhật viền xanh/đỏ)
  const handleDragMove = useCallback((entityId, newX, newY) => {
    const draggedEntity = allEntities.find(e => e.id === entityId);
    if (!draggedEntity) return;

    if (draggedEntity.type === 'item' || draggedEntity.type === 'container') {
      const cx = draggedEntity.type === 'item' ? newX : newX + ((draggedEntity.width || 1) / 2);
      const cy = draggedEntity.type === 'item' ? newY : newY + ((draggedEntity.height || 1) / 2);

      const candidates = allEntities.filter(c => {
        if (c.id === entityId) return false;
        if (c.z !== canvas.selectedFloorZ) return false;
        if (c.path && draggedEntity.path && c.path.startsWith(draggedEntity.path)) return false;
        if (c.type !== 'room' && c.type !== 'container') return false;

        const inBounds = cx >= c.x && cx <= c.x + c.width && cy >= c.y && cy <= c.y + c.height;
        return inBounds;
      });

      candidates.sort((a, b) => (a.width * a.height) - (b.width * b.height));

      if (candidates.length > 0) {
        setDropTargetId(candidates[0].id);
        setIsValidDrop(true);
      } else {
        setDropTargetId('floor');
        setIsValidDrop(false); // Invalid to drop container/item directly on floor
      }
    } else {
      // Room drag
      setDropTargetId(null);
      setIsValidDrop(true);
    }
  }, [allEntities, canvas.selectedFloorZ]);

  // Xử lý kéo thả entity
  const handleDragEnd = useCallback(async (entityId, newX, newY) => {
    const draggedEntity = allEntities.find(e => e.id === entityId);
    
    // Reset states
    setDraggedEntityId(null);
    setDropTargetId(null);
    setIsValidDrop(true);

    if (!draggedEntity) return;

    // Làm tròn tọa độ (2 chữ số thập phân)
    const round2 = (num) => Math.round(num * 100) / 100;
    const roundedX = round2(newX);
    const roundedY = round2(newY);

    let updateData = { x: roundedX, y: roundedY };

    // Tìm cha mới nếu là item hoặc container
    if (draggedEntity.type === 'item' || draggedEntity.type === 'container') {
      const cx = draggedEntity.type === 'item' ? roundedX : roundedX + ((draggedEntity.width || 1) / 2);
      const cy = draggedEntity.type === 'item' ? roundedY : roundedY + ((draggedEntity.height || 1) / 2);

      // Tìm các ứng viên có thể làm cha
      const candidates = allEntities.filter(c => {
        if (c.id === entityId) return false;
        if (c.z !== canvas.selectedFloorZ) return false;
        // Tránh lỗi circular reference (chọn con cháu làm cha)
        if (c.path && draggedEntity.path && c.path.startsWith(draggedEntity.path)) return false;
        // Chỉ phòng hoặc hộp mới có thể chứa
        if (c.type !== 'room' && c.type !== 'container') return false;

        // Kiểm tra xem tâm của vật bị kéo có nằm trong ứng viên này không
        const inBounds = cx >= c.x && cx <= c.x + c.width && cy >= c.y && cy <= c.y + c.height;
        return inBounds;
      });

      // Ưu tiên vật chứa nhỏ nhất (để thả trúng hộp nhỏ nằm trong phòng lớn)
      candidates.sort((a, b) => (a.width * a.height) - (b.width * b.height));

      if (candidates.length > 0) {
        const newParent = candidates[0];
        if (newParent.id !== draggedEntity.parent_id) {
          updateData.parent_id = newParent.id;
        }
      } else {
        // Rớt ra ngoài phòng -> Invalid drop
        addToast(t('errors.INVALID_TYPE_HIERARCHY') || 'Cannot place item outside of a room', 'error');
        // Force refresh to snap back
        setAllEntities([...allEntities]);
        return;
      }
    }

    const result = await updateEntity(entityId, updateData);
    if (result) {
      if (updateData.parent_id && updateData.parent_id !== draggedEntity.parent_id) {
        const newParentName = allEntities.find(e => e.id === updateData.parent_id)?.name;
        addToast(t('toast.updated') + ` → ${newParentName}`, 'success');
      } else {
        addToast(t('toast.updated'), 'success');
      }
      loadTree();
    }
  }, [allEntities, canvas.selectedFloorZ, updateEntity, addToast, t, loadTree]);

  // Xử lý thay đổi kích thước (Resize)
  const handleResizeEnd = useCallback(async (entityId, newX, newY, newWidth, newHeight) => {
    // 1. Optimistic UI update
    setAllEntities(prev => prev.map(e => {
      if (e.id === entityId) {
        return { ...e, x: newX, y: newY, width: newWidth, height: newHeight };
      }
      return e;
    }));

    // 2. Gọi API update
    const res = await updateEntity(entityId, { 
      x: newX, 
      y: newY, 
      width: newWidth, 
      height: newHeight 
    });

    if (!res) {
      // Revert if error
      loadTree();
    }
  }, [updateEntity, loadTree]);

  // Căn giữa bản đồ
  const handleCenterMap = useCallback(() => {
    if (typeof window === 'undefined') return;

    const floorEntities = allEntities.filter(e => e.z === canvas.selectedFloorZ);
    if (floorEntities.length === 0) return;

    // Ưu tiên tính Bounding Box theo các Phòng (để tránh một món đồ rớt tít ngoài xa làm lệch map)
    let entitiesToBound = floorEntities.filter(e => e.type === 'room');
    if (entitiesToBound.length === 0) {
      entitiesToBound = floorEntities;
    }

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    entitiesToBound.forEach(e => {
      if (e.x < minX) minX = e.x;
      if (e.y < minY) minY = e.y;
      if (e.x + e.width > maxX) maxX = e.x + e.width;
      if (e.y + e.height > maxY) maxY = e.y + e.height;
    });

    if (minX === Infinity) return;

    const container = document.querySelector('.canvas-container');
    const stageWidth = container ? container.offsetWidth : window.innerWidth;
    const stageHeight = container ? container.offsetHeight : window.innerHeight - 120;

    canvas.fitBounds(minX, minY, maxX, maxY, stageWidth, stageHeight);
  }, [allEntities, canvas.selectedFloorZ, canvas.fitBounds]);

  // Tự động căn giữa bản đồ khi load xong entities hoặc chuyển tầng
  useEffect(() => {
    if (allEntities.length > 0 && canvas.selectedFloorZ !== undefined) {
      // Đợi 1 chút để container render xong kích thước
      const timer = setTimeout(() => {
        handleCenterMap();
      }, 100);
      return () => clearTimeout(timer);
    }
    // Chỉ tự động center khi lần đầu có data hoặc khi chuyển tầng (để user thoải mái zoom/pan không bị giật lại)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allEntities.length > 0, canvas.selectedFloorZ]);

  // Xử lý thêm entity
  const handleAddEntity = useCallback(async (type, parentIdOverride = null) => {
    let parentId = parentIdOverride;
    let z = canvas.selectedFloorZ || 0;

    if (type === 'floor') {
      const houses = allEntities.filter(e => e.type === 'house');
      if (!parentId) {
        parentId = canvas.selectedEntity?.type === 'house'
          ? canvas.selectedEntity.id
          : houses[0]?.id;
      }
      // Đếm số tầng của nhà này
      const currentFloors = allEntities.filter(e => e.type === 'floor' && e.parent_id === parentId);
      z = currentFloors.length;
    } else if (type === 'room') {
      const currentFloor = floors.find(f => f.z === canvas.selectedFloorZ);
      parentId = currentFloor?.id;
    } else if (type === 'container' || type === 'item' || type === 'door' || type === 'window') {
      parentId = canvas.selectedEntity?.id;
    }

    if (type !== 'house' && !parentId) {
      addToast(t('errors.INVALID_PARENT'), 'error');
      return;
    }

    const titles = {
      house: t('entity.addHouse'),
      floor: t('entity.addFloor'),
      room: t('entity.addRoom'),
      container: t('entity.addContainer'),
      item: t('entity.addItem'),
      door: t('entity.addDoor'),
      window: t('entity.addWindow')
    };
    const title = titles[type] || t('entity.name');

    // Mặc định tên theo loại
    const defaultNames = {
      house: t('entity.house'),
      floor: t('entity.floor'),
      room: t('entity.room'),
      container: t('entity.container'),
      item: t('entity.item'),
      door: t('entity.door'),
      window: t('entity.window')
    };
    
    // Nếu là floor, thêm số tầng (đếm số lượng hiện tại + 1)
    let defaultName = defaultNames[type] || '';
    if (type === 'floor') {
      const currentFloors = allEntities.filter(e => e.type === 'floor' && e.parent_id === parentId);
      defaultName = `${defaultName} ${currentFloors.length + 1}`;
    }

    const name = await prompt(t('entity.name') + ':', defaultName, title);
    if (!name) return;

    let width = 0.2;
    let height = 0.2;
    let depth = 0;
    let is_structural = false;
    let is_fixed = false;

    if (type === 'room') {
      width = 4; height = 3;
    } else if (type === 'container') {
      width = 1; height = 0.5;
    } else if (type === 'door') {
      width = 0.9; height = 0.1; depth = 0.1;
      is_structural = true; is_fixed = true;
    } else if (type === 'window') {
      width = 1.2; height = 0.1; depth = 0.1;
      is_structural = true; is_fixed = true;
    }

    const result = await createEntity({
      name,
      type,
      parent_id: parentId,
      x: 1,
      y: 1,
      z,
      width,
      height,
      depth,
      is_structural,
      is_fixed
    });

    if (result) {
      addToast(t('toast.created'), 'success');
      loadTree();
    }
  }, [canvas, floors, allEntities, createEntity, addToast, t, loadTree, prompt]);

  // Xử lý save property
  const handleSaveProperty = useCallback(async (id, data) => {
    const result = await updateEntity(id, data);
    if (result) {
      addToast(t('toast.updated'), 'success');
      setEditingEntity(null);
      loadTree();
    }
  }, [updateEntity, addToast, t, loadTree]);

  // Xử lý xóa
  const handleDelete = useCallback(async () => {
    if (!canvas.selectedEntity) return;
    const ok = await confirm(t('entity.confirmDelete'));
    if (!ok) return;

    const result = await deleteEntity(canvas.selectedEntity.id);
    if (result) {
      addToast(t('toast.deleted'), 'success');
      canvas.setSelectedEntity(null);
      setEditingEntity(null);
      loadTree();
    }
  }, [deleteEntity, addToast, t, canvas, loadTree, confirm]);

  // Xử lý click search result → zoom + highlight
  const handleSearchResultClick = useCallback((result) => {
    setSelectedResult(result);
    
    // 1. Tìm room tổ tiên để zoom tới (thay vì zoom sát vào item)
    const roomIndex = (result.path_types || []).indexOf('room');
    let roomEntity = null;
    if (roomIndex !== -1) {
      const roomId = result.path_ids[roomIndex];
      roomEntity = allEntities.find(e => e.id === roomId);
    }

    if (roomEntity && typeof roomEntity.x === 'number') {
      // Zoom vừa phải để thấy cả phòng (scale 1.2)
      canvas.zoomToEntity(roomEntity, 800, 600, 1.2);
      canvas.setHighlightedRoomId(roomEntity.id);
    } else {
      // Nếu không có phòng, zoom tới item bình thường
      canvas.zoomToEntity(
        { x: result.position.x, y: result.position.y, z: result.position.z, entity_id: result.entity_id },
        800, 600, 2
      );
    }

    canvas.setSelectedFloorZ(result.position.z);
    canvas.setHighlightedEntity(result.entity_id);
    canvas.setMode('search');

    // 2. Set EntityContext Breadcrumb
    const newBreadcrumb = (result.path_ids || []).map((id, index) => ({
      id,
      name: result.path_names[index],
      type: result.path_types[index]
    }));
    
    // Nếu kết quả là item, đường dẫn bao gồm chính nó, ta nên dừng breadcrumb ở thư mục cha.
    const parentBreadcrumb = result.type === 'item' ? newBreadcrumb.slice(0, -1) : newBreadcrumb;
    setBreadcrumb(parentBreadcrumb);
    
    // 3. Set currentView dựa vào cha (hoặc chính nó nếu là container)
    const lastEntity = parentBreadcrumb[parentBreadcrumb.length - 1];
    if (lastEntity) {
      if (lastEntity.type === 'container') {
        setCurrentView('container');
      } else {
        setCurrentView('floor');
      }
    } else {
      setCurrentView('house');
    }

    setMobileDrawerOpen(false); // Close drawer on mobile to see result
  }, [canvas, setBreadcrumb, setCurrentView, allEntities]);

  // Chuyển floor
  const handleFloorSelect = useCallback((floor) => {
    canvas.setSelectedFloorZ(floor.z);
    canvas.setSelectedEntity(floor);
  }, [canvas]);

  // Sidebar luôn hiện trên Desktop để tiện điều hướng bằng cây thư mục
  const showSidebar = true;

  return (
    <div className="dashboard-layout">
      {/* GLOBAL HEADER */}
      <header className="dashboard-header" style={{ zIndex: 100 }}>
        <div className="dashboard-title-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <div 
            className="dashboard-title" 
            onClick={() => {
              navigateTo(null);
              canvas.setSelectedEntity(null);
              canvas.setSelectedFloorZ(null);
              if (canvas.mode === 'search') canvas.setMode('view');
            }}
            style={{ cursor: 'pointer' }}
            title={t('nav.home') || 'Trang chủ'}
          >
            <HousePlus size={16} style={{ color: 'var(--accent)' }} />
            <span className="hide-on-mobile">{t('app.title')}</span>
          </div>
        </div>

        {/* Header search has been removed in favor of the Hero Search on Home View */}

        <div className="dashboard-actions">
          {isAdmin && (
            <button
              className={`btn-icon ${canvas.mode === 'edit' ? 'active' : ''}`}
              onClick={() => canvas.setMode(canvas.mode === 'edit' ? 'view' : 'edit')}
              title={canvas.mode === 'edit' ? t('canvas.viewMode') : t('canvas.editMode')}
              style={{ color: canvas.mode === 'edit' ? 'var(--accent)' : 'inherit' }}
            >
              <Edit3 size={16} />
            </button>
          )}

          {isAdmin && (
            <button
              className="btn-icon"
              onClick={() => setShowAdmin(true)}
              title={t('admin.title')}
              style={{ color: 'var(--accent)' }}
            >
              <Shield size={16} />
            </button>
          )}
          <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
            <ThemeSwitcher />
            <LanguageSwitcher />
            <button className="btn-icon" onClick={signOut} title={t('auth.logout')}>
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* BODY WRAPPER */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
        {/* Mobile Overlay */}
        <div 
          className={`mobile-drawer-overlay ${mobileDrawerOpen ? 'visible' : ''}`}
          onClick={() => setMobileDrawerOpen(false)}
        />

      {/* Sidebar / Bottom Drawer */}
      <aside className={`dashboard-sidebar ${mobileDrawerOpen ? 'drawer-open' : ''} ${showSidebar ? '' : 'sidebar-hidden'}`}>
        {canvas.mode === 'search' ? (
          <div className="search-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Search input for mobile has been removed in favor of the new Hero Search on HouseView */}

            <div style={{ flex: 1, overflowY: 'auto' }}>
              {!search.query.trim() ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                  {t('search.placeholder') || 'Type to search...'}
                </div>
              ) : (
                <>
                  {selectedResult && (
                    <div className="search-selected-result">
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {selectedResult.path_names?.join(' › ')}
                      </span>
                    </div>
                  )}
                  {search.results && search.results.length > 0 && (
                    <SearchResults
                      results={search.results}
                      totalCount={search.totalCount}
                      searchType={search.searchType}
                      onResultClick={handleSearchResultClick}
                    />
                  )}
                  {search.query.trim() && !search.loading && search.results?.length === 0 && (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                      {t('search.noResults')}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        ) : (
          <>
            {treeLoading ? (
              <div style={{ padding: 40, textAlign: 'center' }}>
                <LoadingSpinner size={24} />
              </div>
            ) : (
              <TreePanel
                tree={tree}
                selectedEntity={canvas.selectedEntity}
                onSelectEntity={(entity) => {
                  handleSelectEntity(entity);
                  setEditingEntity(entity);
                  navigateTo(entity);
                  if (entity.z !== undefined && entity.z !== null) {
                    canvas.setSelectedFloorZ(entity.z);
                  }
                }}
                onExpandNode={async (nodeId) => {
                  const subtree = await fetchTree(nodeId, 3);
                  if (subtree) loadTree();
                }}
              />
            )}
          </>
        )}

        {/* Attribution Footer */}
        <div style={{ marginTop: 'auto', padding: '8px 12px', borderTop: '1px solid var(--border)', fontSize: '10px', color: 'var(--text-muted)', textAlign: 'center', background: 'var(--panel-bg)' }}>
          Made with ♥ by{' '}
          <a href="https://github.com/iitold/findinthehome" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>
            itold
          </a>
        </div>
      </aside>

      {/* Main area */}
      <main className="dashboard-main">
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          
          {/* BREADCRUMB / BACK NAVIGATION */}
          {breadcrumb.length > 0 && (
            <div className="breadcrumb-nav" style={{ padding: '8px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg-glass)', backdropFilter: 'blur(10px)', zIndex: 10 }}>
              <button 
                onClick={() => {
                  const parent = breadcrumb.length > 1 ? breadcrumb[breadcrumb.length - 2] : null;
                  navigateTo(parent);
                  if (parent && parent.type === 'floor') canvas.setSelectedFloorZ(parent.z);
                  else if (!parent) canvas.setSelectedFloorZ(null);
                }}
                style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px', padding: '4px 10px', background: 'var(--panel-bg)', border: '1px solid var(--border)', borderRadius: '20px', color: 'var(--text-primary)', fontSize: '11px', fontWeight: 500, transition: 'background 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                onMouseLeave={e => e.currentTarget.style.background = 'var(--panel-bg)'}
              >
                <ChevronLeft size={14} /> Quay lại
              </button>
              
              <div style={{ width: '1px', height: '14px', background: 'var(--border)', margin: '0 4px' }} />

              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', overflowX: 'auto', whiteSpace: 'nowrap', paddingBottom: '1px', flex: 1 }} className="hide-scrollbar">
                <button 
                  onClick={() => { navigateTo(null); canvas.setSelectedFloorZ(null); }}
                  style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', fontSize: '11px' }}
                >
                  <Home size={12} />
                </button>
                
                {breadcrumb.map((item, index) => (
                  <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <ChevronRight size={12} style={{ color: 'var(--text-muted)' }} />
                    <button
                      onClick={() => {
                        navigateTo(item);
                        if (item.type === 'floor') canvas.setSelectedFloorZ(item.z);
                      }}
                      style={{ 
                        background: 'none', border: 'none', 
                        color: index === breadcrumb.length - 1 ? 'var(--text-primary)' : 'var(--text-secondary)',
                        fontWeight: index === breadcrumb.length - 1 ? 600 : 400,
                        cursor: 'pointer', fontSize: '11px',
                        maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                      }}
                    >
                      {item.name}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          {currentView === 'house' && (
            <HouseView 
              houses={allEntities.filter(e => e.type === 'house')} 
              floors={floors} 
              onAddHouse={() => handleAddEntity('house')} 
              onAddFloor={(houseId) => handleAddEntity('floor', houseId)} 
              onEditEntity={(entity) => { setEditingEntity(entity); canvas.setMode('edit'); }} 
              onSelectFloor={(floor) => {
                canvas.setSelectedFloorZ(floor.z);
                canvas.setSelectedEntity(floor);
                navigateTo(floor);
              }}
              isAdmin={isAdmin} 
              onSearch={(query) => {
                search.setQuery(query);
                if (query.trim()) {
                  canvas.setMode('search');
                  setMobileDrawerOpen(true);
                } else {
                  canvas.setMode('view');
                }
              }}
            />
          )}

          {currentView === 'container' && breadcrumb.length > 0 && (
            <ContainerView container={breadcrumb[breadcrumb.length - 1]} entities={allEntities} />
          )}

          {['floor', 'room', 'wall', 'door', 'window', 'furniture', 'search'].includes(currentView) && (
            <>
              <CanvasToolbar
                mode={canvas.mode}
                onModeChange={canvas.setMode}
                onZoomIn={canvas.zoomIn}
                onZoomOut={canvas.zoomOut}
                onFitView={handleCenterMap}
                onAddEntity={handleAddEntity}
                onDeleteSelected={() => handleDelete()}
                selectedEntity={canvas.selectedEntity}
                selectedFloorZ={canvas.selectedFloorZ}
                hasFloors={floors.length > 0}
                floors={floors}
                onFloorSelect={handleFloorSelect}
              />

              <FloorCanvas
                entities={allEntities}
                selectedFloorZ={canvas.selectedFloorZ}
                scale={canvas.scale}
                position={canvas.position}
                setScale={canvas.setScale}
                setPosition={canvas.setPosition}
                mode={canvas.mode}
                selectedEntity={canvas.selectedEntity}
                highlightedEntity={canvas.highlightedEntity}
                highlightedRoomId={canvas.highlightedRoomId}
                onSelectEntity={(entity) => {
                  handleSelectEntity(entity);
                  if (entity) setEditingEntity(entity);
                }}
                onDragStart={handleDragStart}
                onDragMove={handleDragMove}
                onDragEnd={handleDragEnd}
                onResizeEnd={handleResizeEnd}
                draggedEntityId={draggedEntityId}
                dropTargetId={dropTargetId}
                isValidDrop={isValidDrop}
              />
            </>
          )}

          {/* Search Location Card */}
          {canvas.mode === 'search' && selectedResult && (
            <SearchLocationCard
              result={selectedResult}
              onClose={() => {
                setSelectedResult(null);
                canvas.clearHighlight();
              }}
              onNavigate={(navEntity) => {
                // Find entity from allEntities to get z index if needed
                const targetEntity = allEntities.find(e => e.id === navEntity.id) || navEntity;
                navigateTo(targetEntity);
                if (targetEntity.z !== undefined && targetEntity.z !== null) {
                  canvas.setSelectedFloorZ(targetEntity.z);
                }
                setSelectedResult(null);
                canvas.clearHighlight();
                canvas.setMode('view');
              }}
            />
          )}
        </div>

        {/* Property panel */}
        {editingEntity && canvas.mode === 'edit' && (
          <PropertyPanel
            entity={editingEntity}
            onSave={handleSaveProperty}
            onClose={() => setEditingEntity(null)}
            onDelete={handleDelete}
          />
        )}
      </main>
      </div>

      {/* Admin panel modal */}
      {showAdmin && isAdmin && (
        <AdminPanel onClose={() => setShowAdmin(false)} />
      )}

      {/* Mobile Navigation */}
      <nav className="mobile-nav">
        <button 
          className={`mobile-nav-btn ${!mobileDrawerOpen && currentView === 'house' ? 'active' : ''}`}
          onClick={() => {
            navigateTo(null);
            canvas.setSelectedEntity(null);
            canvas.setSelectedFloorZ(null);
            if (canvas.mode === 'search') canvas.setMode('view');
            setMobileDrawerOpen(false);
          }}
        >
          <Home size={18} />
          <span>{t('nav.home') || 'Trang chủ'}</span>
        </button>
        <button 
          className={`mobile-nav-btn ${mobileDrawerOpen && canvas.mode !== 'search' ? 'active' : ''}`}
          onClick={() => { canvas.setMode('view'); setMobileDrawerOpen(true); }}
        >
          <Menu size={18} />
          <span>{t('nav.menu') || 'Menu'}</span>
        </button>
      </nav>
    </div>
  );
}

/** Flatten nested tree thành flat array */
function flattenTree(nodes) {
  const result = [];
  function walk(nodeList) {
    for (const node of nodeList) {
      const { children, ...rest } = node;
      result.push(rest);
      if (children && children.length > 0) {
        walk(children);
      }
    }
  }
  walk(nodes);
  return result;
}
