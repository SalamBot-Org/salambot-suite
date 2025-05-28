/**
 * @file        Configuration i18n pour l'application Agent Desk
 * @author      SalamBot Team (contact: info@salambot.ma)
 * @created     2025-05-28
 * @updated     2025-05-28
 * @project     SalamBot - AI CRM for Moroccan SMEs
 */

export const locales = ['fr', 'en'] as const;
export const defaultLocale = 'fr' as const;

export type Locale = (typeof locales)[number];
