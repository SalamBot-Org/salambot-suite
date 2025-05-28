/**
 * @file        Configuration next-intl pour l'application Agent Desk
 * @author      SalamBot Team (contact: info@salambot.ma)
 * @created     2025-05-28
 * @updated     2025-05-28
 * @project     SalamBot - AI CRM for Moroccan SMEs
 */

const config = {
  locales: ['fr', 'en'],
  defaultLocale: 'fr',
  messages: {
    fr: () => import('./src/messages/fr.json'),
    en: () => import('./src/messages/en.json')
  }
};

module.exports = config;