import { cookies, headers } from 'next/headers';
import type { Language } from './translations';

export function getServerLanguage(): Language {
  const cookieLanguage = cookies().get('sangpo_lang')?.value;
  if (cookieLanguage === 'en' || cookieLanguage === 'zh') {
    return cookieLanguage;
  }

  const acceptLanguage = headers().get('accept-language') || '';
  if (acceptLanguage.toLowerCase().includes('zh')) {
    return 'zh';
  }

  return 'en';
}
