'use client';

import { useState } from 'react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { useDialog } from '@/components/ui/DialogContext';
import { Save, X, icons, Package } from 'lucide-react';
import { TYPE_COLORS, ITEM_ICONS } from '@/lib/constants';

function getLucideComponent(iconName) {
  if (!iconName) return Package;
  const componentName = iconName.split('-').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join('');
  return icons[componentName] || Package;
}

export default function PropertyPanel({ entity, onSave, onClose, onDelete }) {
  const { t } = useTranslation();
  const { confirm } = useDialog();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [form, setForm] = useState({
    name: entity?.name || '',
    description: entity?.description || '',
    tags: entity?.tags?.join(', ') || '',
    color: entity?.color || TYPE_COLORS[entity?.type] || '#6366F1',
    icon: entity?.icon || '',
    width: entity?.width ?? 1,
    height: entity?.height ?? 1,
    level: entity?.level ?? 0,
  });

  if (!entity) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(entity.id, {
      ...form,
      tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      width: parseFloat(form.width) || 1,
      height: parseFloat(form.height) || 1,
      level: parseInt(form.level) || 0,
    });
  };

  return (
    <div className="property-panel">
      <div className="property-panel-header">
        <h3>{t('entity.edit')}: {entity.name}</h3>
        <button className="btn-icon" onClick={onClose}>
          <X size={18} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="property-form">
        <div className="form-group">
          <label>{t('entity.name')}</label>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
        </div>

        <div className="form-group">
          <label>{t('entity.type')}</label>
          <div className="form-type-badge">{t(`entity.${entity.type}`)}</div>
        </div>

        <div className="form-group">
          <label>{t('entity.description')}</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={2}
          />
        </div>

        <div className="form-group">
          <label>{t('entity.tags')}</label>
          <input
            value={form.tags}
            onChange={(e) => setForm({ ...form, tags: e.target.value })}
            placeholder="tag1, tag2, tag3"
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{t('entity.color')}</label>
            <input
              type="color"
              value={form.color}
              onChange={(e) => setForm({ ...form, color: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>{t('entity.icon')}</label>
            {entity.type === 'item' ? (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <div style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-secondary)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                  {(() => {
                    const IconComp = getLucideComponent(form.icon);
                    return <IconComp size={16} color="var(--text-primary)" />;
                  })()}
                </div>
                <select
                  value={form.icon}
                  onChange={(e) => setForm({ ...form, icon: e.target.value })}
                  style={{ flex: 1, padding: '8px', borderRadius: 'var(--radius)', background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)', outline: 'none' }}
                >
                  <option value="">-- Mặc định --</option>
                  {ITEM_ICONS.map(i => (
                    <option key={i} value={i}>{i}</option>
                  ))}
                </select>
              </div>
            ) : (
              <input
                value={form.icon}
                onChange={(e) => setForm({ ...form, icon: e.target.value })}
                placeholder="icon-name"
              />
            )}
          </div>
        </div>

        <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
          <button 
            type="button" 
            onClick={() => setShowAdvanced(!showAdvanced)}
            style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', width: '100%', justifyContent: 'space-between' }}
          >
            <span>{showAdvanced ? 'Ẩn cấu hình nâng cao' : 'Hiện cấu hình nâng cao'}</span>
            <span style={{ transform: showAdvanced ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▼</span>
          </button>
          
          {showAdvanced && (
            <div className="form-row" style={{ marginTop: '1rem' }}>
              <div className="form-group">
                <label>{t('entity.dimensions')} W</label>
                <input
                  type="number"
                  step="0.1"
                  value={form.width}
                  onChange={(e) => setForm({ ...form, width: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>H</label>
                <input
                  type="number"
                  step="0.1"
                  value={form.height}
                  onChange={(e) => setForm({ ...form, height: e.target.value })}
                />
              </div>
            </div>
          )}
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary">
            <Save size={16} />
            {t('entity.save')}
          </button>
          {onDelete && (
            <button
              type="button"
              className="btn btn-danger"
              onClick={async () => {
                const ok = await confirm(t('entity.confirmDelete'));
                if (ok) {
                  onDelete(entity.id);
                }
              }}
            >
              {t('entity.delete')}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
