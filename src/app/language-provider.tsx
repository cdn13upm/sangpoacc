'use client';

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Language, TranslationKey } from '@/lib/i18n/translations';
import { translate } from '@/lib/i18n/translations';

type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({
  initialLanguage,
  children,
}: {
  initialLanguage: Language;
  children: ReactNode;
}) {
  const [language, setLanguageState] = useState<Language>(initialLanguage);

  useEffect(() => {
    const savedLanguage = window.localStorage.getItem('sangpo_lang');
    if (savedLanguage === 'en' || savedLanguage === 'zh') {
      if (savedLanguage !== language) {
        setLanguageState(savedLanguage);
      }
      document.cookie = `sangpo_lang=${savedLanguage}; path=/; max-age=31536000; samesite=lax`;
      return;
    }

    const browserLanguage = navigator.language.toLowerCase().startsWith('zh') ? 'zh' : 'en';
    if (browserLanguage !== language) {
      setLanguageState(browserLanguage);
    }
    window.localStorage.setItem('sangpo_lang', browserLanguage);
    document.cookie = `sangpo_lang=${browserLanguage}; path=/; max-age=31536000; samesite=lax`;
  }, []);

  function setLanguage(nextLanguage: Language) {
    setLanguageState(nextLanguage);
    window.localStorage.setItem('sangpo_lang', nextLanguage);
    document.cookie = `sangpo_lang=${nextLanguage}; path=/; max-age=31536000; samesite=lax`;
  }

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      setLanguage,
      t: (key, vars) => translate(language, key, vars),
    }),
    [language]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}
