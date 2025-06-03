/**
 * @file        Test unitaire pour la détection de langue
 * @author      SalamBot Team (contact: info@salambot.ma)
 * @created     2025-05-25
 * @updated     2025-05-25
 * @project     SalamBot - AI CRM for Moroccan SMEs
 */

import { detectLanguage } from '../index';

describe('detectLanguage', () => {
  it('should return a language detection result', async () => {
    const result = await detectLanguage('Bonjour le monde');
    expect(result).toHaveProperty('language');
    expect(result).toHaveProperty('confidence');
    expect(result).toHaveProperty('source');
  });

  it('should handle offline mode', async () => {
    const result = await detectLanguage('مرحبا بالعالم', { offline: true });
    expect(result.source).toBe('offline-fallback');
  });
});
