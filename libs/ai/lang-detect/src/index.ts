/**
 * 🚀 SalamBot | Détection Darija Bi-Script
 *
 * @description  Interface unifiée pour détection linguistique (FR/AR/Darija)
 * @author       SalamBot AI Research Team <ai@salambot.ma>
 * @version      2.1.0-neural
 * @created      2025-06-02
 * @license      Propriétaire - SalamBot Team
 *
 * ✨ Fonctionnalités: CLD3 hybride | Fallback LLM | Métriques temps-réel
 */

export * from './lib/ai-lang-detect';
export * from './lib/types';
export * from './lib/darija-detector';
export * from './lib/bi-script-analyzer';

// Interface principale pour la détection de langue
export { detectLanguage } from './lib/ai-lang-detect';
