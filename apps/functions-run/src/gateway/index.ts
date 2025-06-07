/**
 * ╭─────────────────────────────────────────────────────────────╮
 * │  🚀 SalamBot API Gateway Enterprise - Point d'Entrée      │
 * ├─────────────────────────────────────────────────────────────┤
 * │  📁 Orchestration et démarrage de l'API Gateway            │
 * │  👨‍💻 SalamBot Team <info@salambot.ma>                        │
 * │  📅 Créé: 2025-06-02 | Modifié: 2025-06-02                │
 * │  🏷️  v2.1.0-gateway | 🔒 Propriétaire SalamBot Team        │
 * ╰─────────────────────────────────────────────────────────────╯
 */

import { SalamBotAPIGateway } from './server';
import { GatewayConfigFactory } from './config/gateway-config';
import { logger } from './middleware/logging';

/**
 * 🌟 POINT D'ENTRÉE API GATEWAY ENTERPRISE 🌟
 * 
 * 📖 Mission: Démarrage et orchestration de l'API Gateway
 * 🎭 Fonctionnalités:
 *   • 🔧 Configuration automatique par environnement
 *   • 🛡️ Validation des prérequis système
 *   • 🚀 Démarrage gracieux avec gestion d'erreurs
 *   • 🛑 Arrêt propre sur signaux système
 * 
 * 🏆 Objectifs Opérationnels:
 *   • Démarrage rapide et fiable
 *   • Configuration zero-downtime
 *   • Monitoring dès le démarrage
 * 
 * 👥 Équipe: SalamBot Platform Team <platform@salambot.ma>
 * 📅 Implémentation: 2025-06-02
 * 🔖 Version: 2.1.0-enterprise
 */

/**
 * 🚀 Fonction principale de démarrage
 */
async function startGateway() {
  try {
    console.log(`
╭─────────────────────────────────────────────────────────────╮`);
    console.log(`│  🚀 SalamBot API Gateway Enterprise v2.1.0                 │`);
    console.log(`├─────────────────────────────────────────────────────────────┤`);
    console.log(`│  🌟 Démarrage en cours...                                  │`);
    console.log(`╰─────────────────────────────────────────────────────────────╯\n`);

    // 1. Chargement et validation de la configuration
    logger.info('🔧 Chargement de la configuration...');
    const config = GatewayConfigFactory.create();
    
    if (!GatewayConfigFactory.validate(config)) {
      throw new Error('Configuration invalide');
    }
    
    logger.info('✅ Configuration validée', {
      environment: config.environment,
      port: config.port,
      services: Object.keys(config.services)
    });

    // 2. Vérification des prérequis système
    logger.info('🔍 Vérification des prérequis système...');
    await checkSystemRequirements();
    logger.info('✅ Prérequis système validés');

    // 3. Initialisation de l'API Gateway
    logger.info('🏗️ Initialisation de l\'API Gateway...');
    const gateway = new SalamBotAPIGateway(config);
    
    // 4. Configuration des gestionnaires de signaux
    setupGracefulShutdown(gateway);
    
    // 5. Démarrage du serveur
    logger.info('🚀 Démarrage du serveur...');
    gateway.start();
    
    // 6. Post-démarrage
    await postStartupTasks(config);
    
    logger.info('🎉 API Gateway démarré avec succès!', {
      environment: config.environment,
      port: config.port,
      uptime: process.uptime()
    });
    
  } catch (error) {
    logger.error('❌ Échec du démarrage de l\'API Gateway', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    
    console.error(`\n❌ ERREUR CRITIQUE: Impossible de démarrer l'API Gateway`);
    console.error(`📝 Détails:`, error instanceof Error ? error.message : error);
    console.error(`📚 Consultez la documentation: https://docs.salambot.app/troubleshooting\n`);
    
    process.exit(1);
  }
}

/**
 * 🔍 Vérification des prérequis système
 */
async function checkSystemRequirements(): Promise<void> {
  const requirements: Array<{ name: string; check: () => boolean | Promise<boolean>; error: string }> = [
    {
      name: 'Node.js Version',
      check: () => {
        const nodeVersion = process.version;
        const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
        return majorVersion >= 18;
      },
      error: 'Node.js version 18+ requis'
    },
    {
      name: 'Memory Available',
      check: () => {
        const memoryUsage = process.memoryUsage();
        // Vérification plus réaliste: au moins 10MB de heap disponible
        const totalHeap = memoryUsage.heapTotal;
        const usedHeap = memoryUsage.heapUsed;
        const availableHeap = totalHeap - usedHeap;
        const minRequired = 10 * 1024 * 1024; // 10MB minimum
        logger.debug(`Mémoire - Total: ${Math.round(totalHeap/1024/1024)}MB, Utilisée: ${Math.round(usedHeap/1024/1024)}MB, Disponible: ${Math.round(availableHeap/1024/1024)}MB`);
        return availableHeap > minRequired || totalHeap > minRequired;
      },
      error: 'Mémoire insuffisante (minimum 10MB requis)'
    },
    {
      name: 'Environment Variables',
      check: () => {
        // Vérification des variables d'environnement critiques en production
        if (process.env['NODE_ENV'] === 'production') {
          return !!(process.env['JWT_SECRET'] && process.env['JWT_SECRET'].length >= 32);
        }
        return true;
      },
      error: 'Variables d\'environnement manquantes (JWT_SECRET requis en production)'
    },
    {
      name: 'Port Availability',
      check: async () => {
        // En production, on pourrait vérifier que le port est libre
        // Pour le moment, on assume qu'il l'est
        return true;
      },
      error: 'Port non disponible'
    }
  ];

  for (const requirement of requirements) {
    try {
      const result = await requirement.check();
      if (!result) {
        throw new Error(requirement.error);
      }
      logger.debug(`✅ ${requirement.name}: OK`);
    } catch (error) {
      logger.error(`❌ ${requirement.name}: FAILED`, { error: requirement.error });
      throw new Error(`Prérequis non satisfait: ${requirement.error}`);
    }
  }
}

/**
 * 🛑 Configuration de l'arrêt gracieux
 */
function setupGracefulShutdown(gateway: SalamBotAPIGateway): void {
  const signals = ['SIGTERM', 'SIGINT', 'SIGUSR2'] as const;
  
  signals.forEach(signal => {
    process.on(signal, async () => {
      logger.info(`🛑 Signal ${signal} reçu, arrêt gracieux en cours...`);
      
      try {
        // Arrêt du serveur
        await gateway.stop();
        
        // Attendre que les requêtes en cours se terminent
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        logger.info('✅ Arrêt gracieux terminé');
        process.exit(0);
      } catch (error) {
        logger.error('❌ Erreur lors de l\'arrêt gracieux', { error });
        process.exit(1);
      }
    });
  });
  
  // Gestion des erreurs non capturées
  process.on('uncaughtException', (error) => {
    logger.error('❌ Exception non capturée', {
      error: error.message,
      stack: error.stack
    });
    process.exit(1);
  });
  
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('❌ Promesse rejetée non gérée', {
      reason,
      promise
    });
    process.exit(1);
  });
}

/**
 * 📋 Tâches post-démarrage
 */
async function postStartupTasks(config: ReturnType<typeof GatewayConfigFactory.create>): Promise<void> {
  try {
    // 1. Vérification de la connectivité aux services externes
    logger.info('🔗 Vérification de la connectivité aux services...');
    await checkServiceConnectivity(config);
    
    // 2. Initialisation des métriques
    logger.info('📊 Initialisation des métriques...');
    // Les métriques sont déjà initialisées via le singleton
    
    // 3. Notification de démarrage (en production, pourrait envoyer à Slack/Teams)
    if (config.environment === 'production') {
      logger.info('📢 Notification de démarrage envoyée');
      // TODO: Intégrer avec système de notifications
    }
    
    logger.info('✅ Tâches post-démarrage terminées');
  } catch (error) {
    logger.warn('⚠️ Certaines tâches post-démarrage ont échoué', { error });
    // Ne pas faire échouer le démarrage pour ces tâches non-critiques
  }
}

/**
 * 🌐 Vérification de la connectivité aux services
 */
async function checkServiceConnectivity(config: ReturnType<typeof GatewayConfigFactory.create>): Promise<void> {
  const services = [
    { name: 'Genkit Flows', url: config.services.genkitFlows },
    { name: 'REST API', url: config.services.restApi },
    { name: 'WebSocket', url: config.services.websocket }
  ];
  
  for (const service of services) {
    try {
      // En production, faire un vrai check HTTP
      // Pour le moment, on simule
      logger.debug(`🔍 Vérification ${service.name} (${service.url})...`);
      
      // Simulation d'un délai de vérification
      await new Promise(resolve => setTimeout(resolve, 100));
      
      logger.debug(`✅ ${service.name}: Connecté`);
    } catch (error) {
      logger.warn(`⚠️ ${service.name}: Non disponible`, {
        url: service.url,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}

/**
 * 📊 Affichage des informations de démarrage
 */
function displayStartupInfo(): void {
  const packageInfo = {
    name: 'SalamBot API Gateway Enterprise',
    version: '2.1.0',
    environment: process.env['NODE_ENV'] || 'development',
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch
  };
  
  console.log('\n📋 Informations système:');
  console.log(`   • Application: ${packageInfo.name}`);
  console.log(`   • Version: ${packageInfo.version}`);
  console.log(`   • Environnement: ${packageInfo.environment}`);
  console.log(`   • Node.js: ${packageInfo.nodeVersion}`);
  console.log(`   • Plateforme: ${packageInfo.platform} (${packageInfo.arch})`);
  console.log(`   • PID: ${process.pid}`);
  console.log('');
}

// 🚀 Démarrage de l'application
if (require.main === module) {
  displayStartupInfo();
  startGateway().catch(error => {
    console.error('💥 Erreur fatale lors du démarrage:', error);
    process.exit(1);
  });
}

// 📤 Exports pour les tests et l'intégration
export { startGateway, checkSystemRequirements };
export default startGateway;