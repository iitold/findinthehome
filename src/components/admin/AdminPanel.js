'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { useToast } from '@/components/ui/Toast';
import { useDialog } from '@/components/ui/DialogContext';
import {
  Users, UserPlus, Trash2, Edit3, KeyRound,
  Shield, User, X, Save, Eye, EyeOff
} from 'lucide-react';

export default function AdminPanel({ onClose }) {
  const { t } = useTranslation();
  const { addToast } = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [resetUser, setResetUser] = useState(null);

  const { confirm } = useDialog();

  // Load users
  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users');
      const json = await res.json();
      if (json.data) setUsers(json.data);
    } catch (err) {
      addToast(t('toast.error'), 'error');
    }
    setLoading(false);
  }, [addToast, t]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  // Thêm user
  const handleAddUser = async (formData) => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const json = await res.json();
      if (json.error) {
        addToast(json.error.message, 'error');
      } else {
        addToast(t('toast.created'), 'success');
        setShowAddForm(false);
        loadUsers();
      }
    } catch { addToast(t('toast.error'), 'error'); }
  };

  // Sửa user
  const handleEditUser = async (id, data) => {
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (json.error) {
        addToast(json.error.message, 'error');
      } else {
        addToast(t('toast.updated'), 'success');
        setEditingUser(null);
        loadUsers();
      }
    } catch { addToast(t('toast.error'), 'error'); }
  };

  // Xóa user
  const handleDeleteUser = async (id, email) => {
    const ok = await confirm(t('admin.confirmDelete').replace('{email}', email));
    if (!ok) return;
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.error) {
        addToast(json.error.message, 'error');
      } else {
        addToast(t('toast.deleted'), 'success');
        loadUsers();
      }
    } catch { addToast(t('toast.error'), 'error'); }
  };

  // Reset password
  const handleResetPassword = async (id, newPassword) => {
    try {
      const res = await fetch(`/api/admin/users/${id}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_password: newPassword }),
      });
      const json = await res.json();
      if (json.error) {
        addToast(json.error.message, 'error');
      } else {
        addToast(t('admin.passwordReset'), 'success');
        setResetUser(null);
      }
    } catch { addToast(t('toast.error'), 'error'); }
  };

  return (
    <div className="admin-overlay" onClick={onClose}>
      <div className="admin-panel" onClick={e => e.stopPropagation()}>
        <div className="admin-header">
          <div className="admin-title">
            <Users size={20} />
            <h2>{t('admin.title')}</h2>
          </div>
          <button className="btn-icon" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="admin-actions">
          <button
            className="btn btn-primary"
            onClick={() => setShowAddForm(true)}
          >
            <UserPlus size={16} />
            {t('admin.addUser')}
          </button>
        </div>

        {/* Add user form */}
        {showAddForm && (
          <AddUserForm
            onSubmit={handleAddUser}
            onCancel={() => setShowAddForm(false)}
            t={t}
          />
        )}

        {/* Reset password form */}
        {resetUser && (
          <ResetPasswordForm
            user={resetUser}
            onSubmit={(pw) => handleResetPassword(resetUser.id, pw)}
            onCancel={() => setResetUser(null)}
            t={t}
          />
        )}

        {/* User list */}
        <div className="admin-user-list">
          {loading ? (
            <div className="admin-loading">{t('search.searching')}</div>
          ) : (
            users.map(u => (
              <div key={u.id} className="admin-user-card">
                <div className="admin-user-info">
                  <div className="admin-user-avatar">
                    {u.role === 'admin' ? <Shield size={18} /> : <User size={18} />}
                  </div>
                  <div>
                    <div className="admin-user-email">{u.email}</div>
                    <div className="admin-user-meta">
                      <span className={`admin-role-badge admin-role-${u.role}`}>
                        {u.role}
                      </span>
                      {u.full_name && <span>{u.full_name}</span>}
                    </div>
                  </div>
                </div>
                <div className="admin-user-actions">
                  <button
                    className="btn-icon"
                    onClick={() => setEditingUser(u)}
                    title={t('entity.edit')}
                  >
                    <Edit3 size={15} />
                  </button>
                  <button
                    className="btn-icon"
                    onClick={() => setResetUser(u)}
                    title={t('admin.resetPassword')}
                  >
                    <KeyRound size={15} />
                  </button>
                  <button
                    className="btn-icon"
                    onClick={() => handleDeleteUser(u.id, u.email)}
                    title={t('entity.delete')}
                    style={{ color: 'var(--danger)' }}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>

                {/* Inline edit */}
                {editingUser?.id === u.id && (
                  <EditUserForm
                    user={u}
                    onSubmit={(data) => handleEditUser(u.id, data)}
                    onCancel={() => setEditingUser(null)}
                    t={t}
                  />
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function AddUserForm({ onSubmit, onCancel, t }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [fullName, setFullName] = useState('');
  const [showPw, setShowPw] = useState(false);

  return (
    <div className="admin-form">
      <h4>{t('admin.addUser')}</h4>
      <div className="form-group">
        <label>Email</label>
        <input value={email} onChange={e => setEmail(e.target.value)} type="email" required />
      </div>
      <div className="form-group">
        <label>{t('auth.password')}</label>
        <div className="input-group">
          <input
            value={password}
            onChange={e => setPassword(e.target.value)}
            type={showPw ? 'text' : 'password'}
            minLength={6}
            required
            style={{ paddingLeft: '12px' }}
          />
          <button type="button" className="btn-icon" onClick={() => setShowPw(!showPw)}
            style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)' }}>
            {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>
      <div className="form-group">
        <label>{t('admin.role')}</label>
        <select value={role} onChange={e => setRole(e.target.value)}
          style={{ padding: '8px 12px', background: 'var(--bg-secondary)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '13px' }}>
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>
      </div>
      <div className="form-group">
        <label>{t('admin.fullName')}</label>
        <input value={fullName} onChange={e => setFullName(e.target.value)} />
      </div>
      <div className="form-actions">
        <button className="btn btn-primary" onClick={() => onSubmit({ email, password, role, full_name: fullName })}>
          <Save size={16} />{t('entity.save')}
        </button>
        <button className="btn btn-danger" onClick={onCancel}>{t('entity.cancel')}</button>
      </div>
    </div>
  );
}

function EditUserForm({ user, onSubmit, onCancel, t }) {
  const [role, setRole] = useState(user.role);
  const [fullName, setFullName] = useState(user.full_name || '');

  return (
    <div className="admin-form admin-form-inline">
      <div className="form-row">
        <div className="form-group">
          <label>{t('admin.role')}</label>
          <select value={role} onChange={e => setRole(e.target.value)}
            style={{ padding: '6px 8px', background: 'var(--bg-secondary)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '12px' }}>
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <div className="form-group">
          <label>{t('admin.fullName')}</label>
          <input value={fullName} onChange={e => setFullName(e.target.value)} style={{ fontSize: '12px' }} />
        </div>
      </div>
      <div className="form-actions">
        <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '12px' }}
          onClick={() => onSubmit({ role, full_name: fullName })}>
          <Save size={14} />{t('entity.save')}
        </button>
        <button className="btn btn-danger" style={{ padding: '6px 12px', fontSize: '12px' }}
          onClick={onCancel}>{t('entity.cancel')}</button>
      </div>
    </div>
  );
}

function ResetPasswordForm({ user, onSubmit, onCancel, t }) {
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);

  return (
    <div className="admin-form">
      <h4>{t('admin.resetPassword')}: {user.email}</h4>
      <div className="form-group">
        <label>{t('admin.newPassword')}</label>
        <div className="input-group">
          <input
            value={password}
            onChange={e => setPassword(e.target.value)}
            type={showPw ? 'text' : 'password'}
            minLength={6}
            placeholder="Min 6 characters"
            style={{ paddingLeft: '12px' }}
          />
          <button type="button" className="btn-icon" onClick={() => setShowPw(!showPw)}
            style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)' }}>
            {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>
      <div className="form-actions">
        <button className="btn btn-primary" onClick={() => onSubmit(password)}
          disabled={password.length < 6}>
          <KeyRound size={16} />{t('admin.resetPassword')}
        </button>
        <button className="btn btn-danger" onClick={onCancel}>{t('entity.cancel')}</button>
      </div>
    </div>
  );
}
