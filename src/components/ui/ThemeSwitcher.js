'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/lib/theme/ThemeContext';
import { useTranslation } from '@/lib/i18n/useTranslation';

export default function ThemeSwitcher() {
  const { theme, toggleTheme } = useTheme();
  const { t } = useTranslation();

  return (
    <button 
      className="btn-icon" 
      onClick={toggleTheme} 
      title={theme === 'dark' ? t('theme.dark') : t('theme.light')}
    >
      {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
