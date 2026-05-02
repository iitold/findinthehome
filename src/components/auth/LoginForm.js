'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { HousePlus, Mail, Lock, LogIn, UserPlus } from 'lucide-react';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';
import ThemeSwitcher from '@/components/ui/ThemeSwitcher';

export default function LoginForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const { t } = useTranslation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error: authError } = isLogin
      ? await signIn(email, password)
      : await signUp(email, password);

    if (authError) {
      setError(isLogin ? t('auth.loginError') : t('auth.signupError'));
    }
    setLoading(false);
  };

  return (
    <div className="login-page">
      <div className="login-card">
        {/* Language + Theme switcher góc trên bên phải */}
        <div className="login-lang">
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ThemeSwitcher />
            <LanguageSwitcher />
          </div>
        </div>

        <div className="login-header">
          <div className="login-logo">
            <HousePlus size={28} />
          </div>
          <h1>{t('app.title')}</h1>
          <p className="login-subtitle">
            {isLogin ? t('auth.loginSubtitle') : t('auth.signupSubtitle')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-group">
            <Mail size={18} className="input-icon" />
            <input
              id="email-input"
              type="email"
              placeholder={t('auth.email')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="input-group">
            <Lock size={18} className="input-icon" />
            <input
              id="password-input"
              type="password"
              placeholder={t('auth.password')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete={isLogin ? 'current-password' : 'new-password'}
            />
          </div>

          {error && <div className="login-error">{error}</div>}

          <button
            id="auth-submit-btn"
            type="submit"
            className="btn btn-primary btn-full"
            disabled={loading}
          >
            {loading ? (
              <span className="btn-loading" />
            ) : isLogin ? (
              <>
                <LogIn size={18} />
                {t('auth.login')}
              </>
            ) : (
              <>
                <UserPlus size={18} />
                {t('auth.signup')}
              </>
            )}
          </button>
        </form>

        <div className="login-switch">
          <span>{isLogin ? t('auth.noAccount') : t('auth.hasAccount')}</span>
          <button
            type="button"
            className="link-btn"
            onClick={() => { setIsLogin(!isLogin); setError(''); }}
          >
            {isLogin ? t('auth.signup') : t('auth.login')}
          </button>
        </div>
      </div>

      {/* Attribution Footer */}
      <div style={{ position: 'absolute', bottom: '24px', textAlign: 'center', width: '100%', fontSize: '13px', color: 'var(--text-muted)' }}>
        Made with ♥ by{' '}
        <a href="https://github.com/iitold/findinthehome" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>
          itold
        </a>
      </div>
    </div>
  );
}
