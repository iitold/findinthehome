'use client';

import { LanguageProvider } from '@/lib/i18n/LanguageContext';
import { ThemeProvider } from '@/lib/theme/ThemeContext';
import { DialogProvider } from '@/components/ui/DialogContext';
import { ToastProvider } from '@/components/ui/Toast';
import { useAuth } from '@/hooks/useAuth';
import LoginForm from '@/components/auth/LoginForm';
import DashboardView from '@/components/DashboardView';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function HomePage() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <DialogProvider>
          <ToastProvider>
            <AuthGate />
          </ToastProvider>
        </DialogProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

import { EntityProvider } from '@/components/ui/EntityProvider';

function AuthGate() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', background: 'var(--bg-primary)'
      }}>
        <LoadingSpinner size={40} />
      </div>
    );
  }

  if (!user) {
    return <LoginForm />;
  }

  return (
    <EntityProvider>
      <DashboardView />
    </EntityProvider>
  );
}
