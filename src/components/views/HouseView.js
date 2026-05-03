'use client';

import { useEntityContext } from '../ui/EntityProvider';
import { Home, Layers, Settings, Search } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';

export default function HouseView({ houses, floors, onAddFloor, onAddHouse, onEditEntity, onSelectFloor, isAdmin, onSearch }) {
  const { navigateTo } = useEntityContext();
  const { t } = useTranslation();

  return (
    <div className="house-view" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto', flex: 1, minHeight: 0 }}>
      
      {/* HERO SEARCH */}
      {houses.length > 0 && (
        <div style={{ textAlign: 'center', marginBottom: '8px' }}>
          <h1 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '12px' }}>Hôm nay bạn cần tìm gì?</h1>
          <div style={{ position: 'relative', maxWidth: '500px', margin: '0 auto' }}>
            <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder={t('search.placeholder') || "Tìm chìa khóa, kéo, remote..."}
              onChange={(e) => onSearch?.(e.target.value)}
              style={{
                width: '100%', padding: '10px 16px 10px 38px', fontSize: '13px',
                borderRadius: '20px', border: '1px solid var(--border)',
                background: 'var(--bg-secondary)', color: 'var(--text-primary)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)', outline: 'none',
                transition: 'border-color 0.2s, box-shadow 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
            />
          </div>
        </div>
      )}

      {houses.length === 0 && (
        <div style={{ padding: '16px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', width: '100%', background: 'var(--panel-bg)', borderRadius: '10px', border: '1px solid var(--border)' }}>
          <p>{t('entity.noHousePrompt')}</p>
          {isAdmin && (
            <button 
              onClick={onAddHouse}
              style={{
                padding: '7px 14px', background: 'var(--accent)', color: 'white',
                border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px'
              }}
            >
              <Home size={14} /> {t('entity.addHouseNew')}
            </button>
          )}
        </div>
      )}

      {houses.map(house => {
        const houseFloors = floors.filter(f => f.parent_id === house.id);

        return (
          <div key={house.id} style={{ border: '1px solid var(--border)', borderRadius: '10px', padding: '12px', background: 'var(--bg-glass)' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ background: 'var(--panel-bg)', padding: '6px', borderRadius: '6px', border: '1px solid var(--border)' }}>
                  <Home size={20} color={house.color || 'var(--accent)'} />
                </div>
                <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>{house.name}</h2>
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
                  <Settings size={14} />
                </button>
              )}
            </div>

            {/* Content */}
            <h3 style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
              {t('entity.manageFloors')}
            </h3>
            <div style={{ display: 'grid', gap: '8px', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
              {houseFloors.map(floor => (
                <div 
                  key={floor.id} 
                  className="floor-card"
                  onClick={() => onSelectFloor ? onSelectFloor(floor) : navigateTo(floor)}
                  style={{
                    background: 'var(--panel-bg)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    padding: '10px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  <div style={{ width: 32, height: 32, borderRadius: '8px', background: 'var(--bg-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Layers size={16} color={floor.color || 'var(--accent)'} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: '0 0 2px 0', fontSize: '13px', fontWeight: 600 }}>{floor.name}</h3>
                    <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-secondary)' }}>{floor.description || `Z-Index: ${floor.z}`}</p>
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
                      <Settings size={14} />
                    </button>
                  )}
                </div>
              ))}

              {/* Add floor */}
              {isAdmin && (
                <div 
                  className="floor-card"
                  onClick={() => onAddFloor(house.id)}
                  style={{
                    background: 'var(--bg-glass)',
                    border: '1px dashed var(--border)',
                    borderRadius: '8px',
                    padding: '10px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    opacity: 0.7,
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.opacity = 1; e.currentTarget.style.borderColor = 'var(--accent)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.opacity = 0.7; e.currentTarget.style.borderColor = 'var(--border)'; }}
                >
                  <div style={{ width: 32, height: 32, borderRadius: '8px', background: 'var(--bg-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Layers size={16} color="var(--text-secondary)" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: 0, fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)' }}>{t('entity.addFloorNew')}</h3>
                  </div>
                </div>
              )}

              {!isAdmin && houseFloors.length === 0 && (
                <div style={{ padding: '8px', color: 'var(--text-secondary)', fontSize: '12px' }}>
                  {t('entity.noFloorHelper')}
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Add house button */}
      {isAdmin && houses.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '8px' }}>
          <button 
            onClick={onAddHouse}
            className="toolbar-btn"
            style={{ padding: '7px 14px', display: 'flex', alignItems: 'center', gap: '6px', borderRadius: '6px', background: 'var(--panel-bg)', border: '1px dashed var(--accent)' }}
          >
            <Home size={14} color="var(--accent)" />
            <span style={{ color: 'var(--accent)', fontWeight: 600, fontSize: '12px' }}>{t('entity.addHouseNew')}</span>
          </button>
        </div>
      )}

    </div>
  );
}
