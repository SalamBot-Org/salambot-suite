/**
 * @file        Middleware pour la gestion des routes localisées de l'application Agent Desk
 * @author      SalamBot Team (contact: info@salambot.ma)
 * @created     2025-05-28
 * @updated     2025-05-28
 * @project     SalamBot - AI CRM for Moroccan SMEs
 */

import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './i18n';

export default createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'as-needed'
});

export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)']
};
