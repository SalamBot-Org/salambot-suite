/**
 * @file        Layout racine pour l'application Agent Desk
 * @author      SalamBot Team (contact: info@salambot.ma)
 * @created     2025-05-28
 * @updated     2025-05-28
 * @project     SalamBot - AI CRM for Moroccan SMEs
 */

import '../globals.css';
import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';

export async function generateMetadata({
  params: { locale }
}: {
  params: { locale: string }
}) {
  const messages = await getMessages({ locale });
  return {
    title: messages?.['AgentDesk']?.['title'] || 'SalamBot Agent Desk',
    description: messages?.['AgentDesk']?.['subtitle'] || 'Interface agent pour SalamBot CRM',
  };
}

export default async function RootLayout({
  children,
  params: { locale }
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const messages = await getMessages({ locale });
  
  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}