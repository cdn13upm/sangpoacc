import type { Metadata } from 'next';
import './globals.css';
import { getServerLanguage } from '@/lib/i18n/server';
import { LanguageProvider } from './language-provider';

export const metadata: Metadata = {
  title: "Sangpo Account Tracking System",
  description: "Track supplier invoices, payments, and claim certificates",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const language = getServerLanguage();

  return (
    <html lang={language}>
      <body className="antialiased">
        <LanguageProvider initialLanguage={language}>{children}</LanguageProvider>
      </body>
    </html>
  );
}
