'use client';

import { useRouter } from 'next/navigation';
import { useLanguage } from './language-provider';

export default function LanguageToggle({ dark = false }: { dark?: boolean }) {
  const router = useRouter();
  const { language, setLanguage, t } = useLanguage();

  function changeLanguage(nextLanguage: 'en' | 'zh') {
    setLanguage(nextLanguage);
    router.refresh();
  }

  return (
    <div
      style={{
        display: 'inline-flex',
        padding: '0.25rem',
        borderRadius: '999px',
        border: dark ? '1px solid rgba(255,255,255,0.16)' : '1px solid #e5e7eb',
        backgroundColor: dark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.9)',
        gap: '0.25rem',
      }}
    >
      {(['en', 'zh'] as const).map((option) => {
        const isActive = language === option;
        return (
          <button
            key={option}
            type="button"
            onClick={() => changeLanguage(option)}
            style={{
              border: 'none',
              borderRadius: '999px',
              padding: '0.4rem 0.8rem',
              cursor: 'pointer',
              fontSize: '0.82rem',
              fontWeight: 700,
              color: dark ? 'white' : '#111827',
              background: isActive
                ? dark
                  ? 'linear-gradient(90deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.12) 100%)'
                  : 'linear-gradient(90deg, #7f1d1d 0%, #b91c1c 100%)'
                : 'transparent',
              boxShadow: isActive && !dark ? '0 6px 12px -8px rgba(127,29,29,0.65)' : 'none',
            }}
          >
            {option === 'en' ? t('common.english') : t('common.chinese')}
          </button>
        );
      })}
    </div>
  );
}
