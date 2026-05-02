'use client';

import { useEntityContext } from '../ui/EntityProvider';
import { Home, Layers, Settings, Search } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';

export default function HouseView({ houses, floors, onAddFloor, onAddHouse, onEditEntity, onSelectFloor, isAdmin, onSearch }) {
  const { navigateTo } = useEntityContext();
  const { t } = useTranslation();

  return (
    <div className="house-view" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem', overflowY: 'auto' }}>
      
      {/* HERO SEARCH */}
      {houses.length > 0 && (
        <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px' }}>Hôm nay bạn cần tìm gì?</h1>
          <div style={{ position: 'relative', maxWidth: '600px', margin: '0 auto' }}>
            <Search size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder={t('search.placeholder') || "Tìm chìa khóa, kéo, remote..."}
              onChange={(e) => onSearch?.(e.target.value)}
              style={{
                width: '100%', padding: '16px 20px 16px 48px', fontSize: '16px',
                borderRadius: '30px', border: '1px solid var(--border)',
                background: 'var(--bg-secondary)', color: 'var(--text-primary)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)', outline: 'none',
                transition: 'border-color 0.2s, box-shadow 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
            />
          </div>
        </div>
      )}

      {houses.length === 0 && (
        <div style={{ padding: '2rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', width: '100%', background: 'var(--panel-bg)', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <p>{t('entity.noHousePrompt')}</p>
          {isAdmin && (
            <button 
              onClick={onAddHouse}
              style={{
                padding: '10px 20px', background: 'var(--accent)', color: 'white',
                border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '8px'
              }}
            >
              <Home size={18} /> {t('entity.addHouseNew')}
            </button>
          )}
        </div>
      )}

      {houses.map(house => {
        const houseFloors = floors.filter(f => f.parent_id === house.id);

        return (
          <div key={house.id} style={{ border: '1px solid var(--border)', borderRadius: '12px', padding: '1.5rem', background: 'var(--bg-glass)' }}>
            {/* Header: Thông tin ngôi nhà */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ background: 'var(--panel-bg)', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <Home size={28} color={house.color || 'var(--accent)'} />
                </div>
                <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 600 }}>{house.name}</h2>
              </div>
              {isAdmin && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditEntity(house);
                  }}
                  className="toolbar-btn"
                  title={t('entity.configureHouse')}
                >
                  <Settings size={18} />
                </button>
              )}
            </div>

            {/* Content: Danh sách Tầng */}
            <h3 style={{ fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              {t('entity.manageFloors')}
            </h3>
            <div style={{ display: 'grid', gap: '12px', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
              {houseFloors.map(floor => (
                <div 
                  key={floor.id} 
                  className="floor-card"
                  onClick={() => onSelectFloor ? onSelectFloor(floor) : navigateTo(floor)}
                  style={{
                    background: 'var(--panel-bg)',
                    border: '1px solid var(--border)',
                    borderRadius: '12px',
                    padding: '16px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  <div style={{ width: 40, height: 40, borderRadius: '10px', background: 'var(--bg-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Layers size={20} color={floor.color || 'var(--accent)'} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: 600 }}>{floor.name}</h3>
                    <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>{floor.description || `Z-Index: ${floor.z}`}</p>
                  </div>
                  {isAdmin && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditEntity(floor);
                      }}
                      className="btn-icon"
                      title={t('entity.configureFloor')}
                    >
                      <Settings size={16} />
                    </button>
                  )}
                </div>
              ))}

              {/* Nút thêm Tầng mới cho nhà này */}
              {isAdmin && (
                <div 
                  className="floor-card"
                  onClick={() => onAddFloor(house.id)}
                  style={{
                    background: 'var(--bg-glass)',
                    border: '1px dashed var(--border)',
                    borderRadius: '12px',
                    padding: '16px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    opacity: 0.7,
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.opacity = 1; e.currentTarget.style.borderColor = 'var(--accent)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.opacity = 0.7; e.currentTarget.style.borderColor = 'var(--border)'; }}
                >
                  <div style={{ width: 40, height: 40, borderRadius: '10px', background: 'var(--bg-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Layers size={20} color="var(--text-secondary)" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 500, color: 'var(--text-secondary)' }}>{t('entity.addFloorNew')}</h3>
                  </div>
                </div>
              )}

              {!isAdmin && houseFloors.length === 0 && (
                <div style={{ padding: '1rem', color: 'var(--text-secondary)' }}>
                  {t('entity.noFloorHelper')}
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Tách biệt hoàn toàn nút thêm Ngôi nhà thứ 2, 3... */}
      {isAdmin && houses.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
          <button 
            onClick={onAddHouse}
            className="toolbar-btn"
            style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '8px', borderRadius: '8px', background: 'var(--panel-bg)', border: '1px dashed var(--accent)' }}
          >
            <Home size={18} color="var(--accent)" />
            <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{t('entity.addHouseNew')}</span>
          </button>
        </div>
      )}

    </div>
  );
}
