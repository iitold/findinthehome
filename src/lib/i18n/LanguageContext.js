'use client';

import { createContext, useState, useEffect, useCallback } from 'react';
import en from './en.json';
import vi from './vi.json';

const translations = { en, vi };

export const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState('vi'); // Mặc định tiếng Việt

  // Đọc từ localStorage khi mount
  useEffect(() => {
    const saved = localStorage.getItem('fith_language');
    if (saved && translations[saved]) {
      setLanguageState(saved);
    }
  }, []);

  const setLanguage = useCallback((lang) => {
    if (translations[lang]) {
      setLanguageState(lang);
      localStorage.setItem('fith_language', lang);
    }
  }, []);

  // Hàm dịch: t('entity.house') → "Nhà" (vi) hoặc "House" (en)
  const t = useCallback((key) => {
    const keys = key.split('.');
    let result = translations[language];
    for (const k of keys) {
      result = result?.[k];
    }
    return result || key; // Fallback: trả về key nếu không tìm thấy
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}
