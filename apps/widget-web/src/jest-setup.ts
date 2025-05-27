/**
 * @file        Configuration de Jest pour les tests du widget web
 * @author      SalamBot Team (contact: info@salambot.ma)
 * @created     2025-05-26
 * @updated     2025-05-26
 * @project     SalamBot - AI CRM for Moroccan SMEs
 */

import '@testing-library/jest-dom';

// Mock pour scrollIntoView qui n'est pas implémenté dans JSDOM
window.HTMLElement.prototype.scrollIntoView = function() {};

// Mock pour fetch global
global.fetch = jest.fn();
