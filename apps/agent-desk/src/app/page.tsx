/**
 * @file        Page d'accueil de l'application Agent Desk
 * @author      SalamBot Team (contact: info@salambot.ma)
 * @created     2025-05-28
 * @updated     2025-05-28
 * @project     SalamBot - AI CRM for Moroccan SMEs
 */

import { useTranslations } from 'next-intl';

export default function Home() {
  const t = useTranslations('AgentDesk');
  
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-6">{t('title')}</h1>
      <p className="text-xl">{t('subtitle')}</p>
      <p className="mt-8 text-lg">{t('welcome')}</p>
    </main>
  );
}
