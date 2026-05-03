'use client';

import { useEntityContext } from '../ui/EntityProvider';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { Package, Box, Search, icons } from 'lucide-react';

function getLucideComponent(iconName, fallback = Package) {
  if (!iconName) return fallback;
  const componentName = iconName.split('-').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join('');
  return icons[componentName] || fallback;
}

export default function ContainerView({ container, entities }) {
  const { navigateTo, setSelectedEntity } = useEntityContext();
  const { t } = useTranslation();

  // Tìm các con trực tiếp của container này
  const children = entities.filter(e => e.parent_id === container.id).sort((a, b) => a.order_index - b.order_index);
  
  const shelvesAndBoxes = children.filter(e => e.type === 'container');
  const items = children.filter(e => e.type === 'item');

  return (
    <div className="container-view" style={{ padding: '16px', flex: 1, minHeight: 0, overflowY: 'auto' }}>
      <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', fontSize: '16px', fontWeight: 600 }}>
        <Package size={20} color="var(--accent)" />
        {container.name}
      </h2>

      {shelvesAndBoxes.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <h3 style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)', marginBottom: '8px' }}>{t('entity.subContainers')}</h3>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {shelvesAndBoxes.map(sub => (
              <div 
                key={sub.id} 
                className="sub-container-card"
                onClick={() => navigateTo(sub)}
                style={{
                  background: 'var(--panel-bg)', border: '1px solid var(--border)',
                  borderRadius: '8px', padding: '10px', width: '170px',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'var(--panel-bg)'}
              >
                <Box size={16} color={sub.color || 'var(--text-secondary)'} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '12px' }}>{sub.name}</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>{t('entity.level')}: {sub.level}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {items.length > 0 && (
        <div>
          <h3 style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)', marginBottom: '8px' }}>{t('entity.itemsList')}</h3>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {items.map(item => (
              <div 
                key={item.id} 
                className="item-card"
                onClick={() => setSelectedEntity(item)}
                style={{
                  background: 'var(--panel-bg)', border: '1px solid var(--border)',
                  borderRadius: '8px', padding: '10px', width: '120px',
                  cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
                  transition: 'background 0.2s, borderColor 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--bg-hover)';
                  e.currentTarget.style.borderColor = 'var(--accent)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'var(--panel-bg)';
                  e.currentTarget.style.borderColor = 'var(--border)';
                }}
              >
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: item.color || 'var(--bg-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {(() => {
                    if (!item.icon) return <Search size={14} color="var(--text-primary)" />;
                    const IconComp = getLucideComponent(item.icon, Search);
                    return <IconComp size={14} color="var(--text-primary)" />;
                  })()}
                </div>
                <div style={{ fontWeight: 600, textAlign: 'center', fontSize: '11px' }}>{item.name}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {children.length === 0 && (
        <div style={{ color: 'var(--text-secondary)', fontStyle: 'italic', fontSize: '12px' }}>
          {t('entity.containerEmpty')}
        </div>
      )}
    </div>
  );
}
