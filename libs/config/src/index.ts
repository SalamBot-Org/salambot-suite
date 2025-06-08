/**
 * ╭─────────────────────────────────────────────────────────────╮
 * │  🤖 SalamBot - Intelligence Conversationnelle Marocaine    │
 * ├─────────────────────────────────────────────────────────────┤
 * │  ⚙️  Configuration centralisée et gestion environnement    │
 * │  👨‍💻 SalamBot Team <info@salambot.ma>                        │
 * │  📅 Créé: 2025-06-02 | Modifié: 2025-06-02                │
 * │  🏷️  v2.1.0 | 🔒 Propriétaire SalamBot Team                │
 * ╰─────────────────────────────────────────────────────────────╯
 * 
 * 🎯 Mission: Point d'entrée unifié pour toute la configuration
 * 🚀 Features: Variables env | Runtime config | Types | Cache Redis
 * 🛡️ Security: Validation stricte | Secrets rotation | Zero-leak
 * 
 * ✨ Modules exportés:
 *   • 🌍 env      - Variables d'environnement validées
 *   • ⚡ runtime  - Configuration runtime dynamique  
 *   • 📝 types    - Types TypeScript configuration
 *   • 💾 cache    - Configuration cache Redis/Memorystore
 */

// 🌍 Variables d'environnement avec validation stricte
export * from './env';

// ⚡ Configuration runtime et paramètres dynamiques
export * from './runtime';

// 📝 Types TypeScript pour configuration typée
export * from './types';

// 💾 Configuration cache Redis et stratégies de mise en cache
export * from './cache';
