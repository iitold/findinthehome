'use client';

import { useTranslation } from '@/lib/i18n/useTranslation';

export default function LanguageSwitcher() {
  const { language, setLanguage } = useTranslation();

  return (
    <button
      className="language-switcher"
      onClick={() => setLanguage(language === 'vi' ? 'en' : 'vi')}
      title={language === 'vi' ? 'Switch to English' : 'Chuyển sang Tiếng Việt'}
    >
      <span className={language === 'vi' ? 'lang-active' : 'lang-inactive'}>VI</span>
      <span className="lang-divider">/</span>
      <span className={language === 'en' ? 'lang-active' : 'lang-inactive'}>EN</span>
    </button>
  );
}
