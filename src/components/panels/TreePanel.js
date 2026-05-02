'use client';

import { useState } from 'react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import {
  ChevronRight, ChevronDown,
  Home, Layers, Square, Box, Package,
  icons
} from 'lucide-react';

const typeIcons = {
  house: Home,
  floor: Layers,
  room: Square,
  container: Box,
  item: Package,
};

function getLucideComponent(iconName, fallback = Package) {
  if (!iconName) return fallback;
  const componentName = iconName.split('-').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join('');
  return icons[componentName] || fallback;
}

export default function TreePanel({
  tree,
  selectedEntity,
  onSelectEntity,
  onExpandNode,
}) {
  const { t } = useTranslation();

  if (!tree || tree.length === 0) {
    return (
      <div className="tree-panel-empty">
        <Home size={32} strokeWidth={1} />
        <p>{t('entity.noEntities')}</p>
      </div>
    );
  }

  return (
    <div className="tree-panel">
      <div className="tree-panel-header">
        <Home size={16} />
        <span>{t('entity.selectHouse')}</span>
      </div>
      <div className="tree-list">
        {tree.map(node => (
          <TreeNode
            key={node.id}
            node={node}
            depth={0}
            selectedEntity={selectedEntity}
            onSelectEntity={onSelectEntity}
            onExpandNode={onExpandNode}
            t={t}
          />
        ))}
      </div>
    </div>
  );
}

function TreeNode({ node, depth, selectedEntity, onSelectEntity, onExpandNode, t }) {
  const [expanded, setExpanded] = useState(depth < 2);
  const Icon = node.icon ? getLucideComponent(node.icon, typeIcons[node.type] || Package) : (typeIcons[node.type] || Package);
  const hasChildren = node.children?.length > 0 || node.has_children;
  const isSelected = selectedEntity?.id === node.id;

  const handleToggle = (e) => {
    e.stopPropagation();
    if (!expanded && node.has_children && (!node.children || node.children.length === 0)) {
      // Lazy load children
      onExpandNode?.(node.id);
    }
    setExpanded(!expanded);
  };

  return (
    <div className="tree-node">
      <button
        className={`tree-node-row ${isSelected ? 'tree-node-selected' : ''}`}
        style={{ paddingLeft: 12 + depth * 16 }}
        onClick={() => onSelectEntity(node)}
      >
        {hasChildren ? (
          <span className="tree-chevron" onClick={handleToggle}>
            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </span>
        ) : (
          <span className="tree-chevron tree-chevron-spacer" />
        )}
        <Icon
          size={14}
          style={{ color: node.color || 'var(--text-muted)' }}
          className="tree-icon"
        />
        <span className="tree-node-name">{node.name}</span>
        <span className="tree-node-type">{t(`entity.${node.type}`)}</span>
      </button>

      {expanded && node.children && node.children.length > 0 && (
        <div className="tree-children">
          {node.children.map(child => (
            <TreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              selectedEntity={selectedEntity}
              onSelectEntity={onSelectEntity}
              onExpandNode={onExpandNode}
              t={t}
            />
          ))}
        </div>
      )}
    </div>
  );
}
