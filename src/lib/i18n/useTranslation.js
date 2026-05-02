'use client';

import { useContext } from 'react';
import { LanguageContext } from './LanguageContext';

/**
 * Hook đa ngôn ngữ
 * const { t, language, setLanguage } = useTranslation();
 * t('search.placeholder') → "Tìm đồ vật..."
 */
export function useTranslation() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
}
