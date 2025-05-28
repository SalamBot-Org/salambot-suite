/**
 * @file        Page 404 pour l'application Agent Desk
 * @author      SalamBot Team (contact: info@salambot.ma)
 * @created     2025-05-28
 * @updated     2025-05-28
 * @project     SalamBot - AI CRM for Moroccan SMEs
 */

'use client';
import { useTranslations } from 'next-intl';

export default function NotFound() {
  const t = useTranslations('Common');
  
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-6">404</h1>
      <p className="text-xl">{t('error')}</p>
      <button className="mt-8 px-4 py-2 bg-blue-500 text-white rounded">
        {t('retry')}
      </button>
    </main>
  );
}