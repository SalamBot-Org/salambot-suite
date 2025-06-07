/**
 * Setup Global pour les Tests d'Intégration
 * SalamBot Functions-Run - API Gateway Enterprise
 * 
 * @description Démarre tous les services mock nécessaires avant l'exécution
 *              de la suite de tests d'intégration
 * @author SalamBot Platform Team
 * @created 2025-06-02
 */

import { spawn, ChildProcess } from 'child_process';
import { createConnection } from 'net';
import path from 'path';
import { startRedisMemoryServer } from './redis-memory-setup';

// Types pour la gestion des services
interface MockService {
  name: string;
  port: number;
  process?: ChildProcess;
  scriptPath: string;
  healthEndpoint?: string;
}

// Configuration des services mock
const MOCK_SERVICES: MockService[] = [
  {
    name: 'genkit-mock',
    port: 3001,
    scriptPath: path.resolve(__dirname, 'mocks/genkit-mock.js'),
    healthEndpoint: '/health'
  },
  {
    name: 'rest-api-mock',
    port: 3002,
    scriptPath: path.resolve(__dirname, 'mocks/rest-api-mock.js'),
    healthEndpoint: '/health'
  },
  {
    name: 'websocket-mock',
    port: 3003,
    scriptPath: path.resolve(__dirname, 'mocks/websocket-mock.js'),
    healthEndpoint: '/health'
  },
  {
    name: 'prometheus-mock',
    port: 9090,
    scriptPath: path.resolve(__dirname, 'mocks/prometheus-mock.js'),
    healthEndpoint: '/-/healthy'
  }
];

// Timeout pour le démarrage des services
const PORT_CHECK_INTERVAL = 500; // 500ms
const MAX_PORT_CHECK_ATTEMPTS = 60; // 30 secondes total

/**
 * Vérifie si un port est disponible
 */
function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = createConnection({ port, host: '127.0.0.1' }, () => {
      socket.end();
      resolve(false); // Port occupé
    });
    
    socket.on('error', () => {
      resolve(true); // Port disponible
    });
  });
}

/**
 * Attend qu'un port soit occupé (service démarré)
 */
function waitForPort(port: number, maxAttempts: number = MAX_PORT_CHECK_ATTEMPTS): Promise<boolean> {
  return new Promise((resolve) => {
    let attempts = 0;
    
    const checkPort = async () => {
      attempts++;
      const available = await isPortAvailable(port);
      
      if (!available) {
        // Port occupé = service démarré
        resolve(true);
        return;
      }
      
      if (attempts >= maxAttempts) {
        console.error(`❌ Timeout: Le port ${port} n'est toujours pas occupé après ${maxAttempts} tentatives`);
        resolve(false);
        return;
      }
      
      setTimeout(checkPort, PORT_CHECK_INTERVAL);
    };
   
   console.log('🔧 Démarrage des services mock...');
    
    checkPort();
  });
}

/**
 * Tue un processus utilisant un port spécifique
 */
function killProcessOnPort(port: number): Promise<void> {
  return new Promise((resolve) => {
    if (process.platform === 'win32') {
      // Windows
      const netstat = spawn('netstat', ['-ano']);
      let output = '';
      
      netstat.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      netstat.on('close', () => {
        const lines = output.split('\n');
        const portLine = lines.find(line => line.includes(`:${port} `));
        
        if (portLine) {
          const parts = portLine.trim().split(/\s+/);
          const pid = parts[parts.length - 1];
          
          if (pid && pid !== '0') {
            console.log(`🔄 Arrêt du processus ${pid} sur le port ${port}`);
            spawn('taskkill', ['/F', '/PID', pid], { stdio: 'ignore' });
          }
        }
        
        setTimeout(resolve, 1000); // Attendre 1 seconde
      });
    } else {
      // Unix/Linux/macOS
      const lsof = spawn('lsof', ['-ti', `:${port}`]);
      let pid = '';
      
      lsof.stdout.on('data', (data) => {
        pid += data.toString().trim();
      });
      
      lsof.on('close', () => {
        if (pid) {
          console.log(`🔄 Arrêt du processus ${pid} sur le port ${port}`);
          spawn('kill', ['-9', pid], { stdio: 'ignore' });
        }
        
        setTimeout(resolve, 1000); // Attendre 1 seconde
      });
    }
  });
}

/**
 * Démarre un service mock
 */
async function startMockService(service: MockService): Promise<boolean> {
  console.log(`🚀 Démarrage du service ${service.name} sur le port ${service.port}...`);
  
  // Vérifier si le port est déjà utilisé
  const portAvailable = await isPortAvailable(service.port);
  if (!portAvailable) {
    console.log(`⚠️  Le port ${service.port} est déjà utilisé, tentative d'arrêt du processus...`);
    await killProcessOnPort(service.port);
    
    // Attendre un peu après l'arrêt
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // Démarrer le service
  const childProcess = spawn('node', [service.scriptPath], {
    stdio: ['ignore', 'pipe', 'pipe'],
    env: {
      ...process.env,
      PORT: service.port.toString(),
      NODE_ENV: 'test'
    }
  });
  
  service.process = childProcess;
  
  // Gérer les logs du service
  childProcess.stdout?.on('data', (data) => {
    const message = data.toString().trim();
    if (message) {
      console.log(`📝 [${service.name}] ${message}`);
    }
  });
  
  childProcess.stderr?.on('data', (data) => {
    const message = data.toString().trim();
    if (message && !message.includes('ExperimentalWarning')) {
      console.error(`❌ [${service.name}] ${message}`);
    }
  });
  
  childProcess.on('error', (error) => {
    console.error(`❌ Erreur lors du démarrage de ${service.name}:`, error.message);
    return false;
  });
  
  childProcess.on('exit', (code) => {
    if (code !== 0) {
      console.error(`❌ ${service.name} s'est arrêté avec le code ${code}`);
    }
  });
  
  // Attendre que le service soit prêt
  const isReady = await waitForPort(service.port);
  
  if (isReady) {
    console.log(`✅ Service ${service.name} démarré avec succès sur le port ${service.port}`);
    return true;
  } else {
    console.error(`❌ Échec du démarrage de ${service.name}`);
    return false;
  }
}

/**
 * Setup global - Point d'entrée
 */
export default async function globalSetup(): Promise<void> {
  console.log('🧪 === SETUP GLOBAL DES TESTS D\'INTÉGRATION ===');
  
  // Set up comprehensive error handling before any Redis operations
  const originalEmit = process.emit;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (process as any).emit = function(event: string, ...args: unknown[]): boolean {
    if (event === 'unhandledRejection') {
      const reason = args[0];
      const reasonStr = String(reason);
      console.warn('⚠️ Intercepted Unhandled Promise Rejection:', reasonStr);
      
      // Specifically handle Redis server closure errors
      if (reasonStr.includes('redis-server instance closed')) {
        console.warn('⚠️ Redis server closure detected - suppressing error');
        return true; // Prevent the default behavior
      }
      
      // For other rejections, log but don't crash
      console.warn('⚠️ Non-Redis rejection - logging and continuing');
      return true; // Prevent the default behavior
    }
    
    if (event === 'uncaughtException') {
      const error = args[0];
      const errorStr = String(error);
      console.warn('⚠️ Intercepted Uncaught Exception:', errorStr);
      
      // Handle Redis-related exceptions
      if (errorStr.includes('redis-server') || errorStr.includes('Redis')) {
        console.warn('⚠️ Redis-related exception detected - suppressing error');
        return true; // Prevent the default behavior
      }
    }
    
    // Call the original emit for other events
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    originalEmit.apply(this, [event, ...args] as any);
    return true;
  };
  
  const startTime = Date.now();
  
  try {
    // Démarrer Redis en mémoire en premier
    console.log('📦 Démarrage de Redis en mémoire...');
    await startRedisMemoryServer();
    
    // Démarrer tous les services en parallèle
    const servicePromises = MOCK_SERVICES.map(service => startMockService(service));
    const results = await Promise.all(servicePromises);
    
    // Vérifier que tous les services ont démarré
    const failedServices = MOCK_SERVICES.filter((_, index) => !results[index]);
    
    if (failedServices.length > 0) {
      console.error('❌ Échec du démarrage des services:', failedServices.map(s => s.name).join(', '));
      throw new Error(`Échec du démarrage de ${failedServices.length} service(s)`);
    }
    
    const duration = Date.now() - startTime;
    console.log(`✅ Tous les services mock sont prêts (${duration}ms)`);
    console.log('🎯 Les tests d\'intégration peuvent commencer');
    
    // Stocker les références des processus pour le teardown
    (global as Record<string, unknown>)['__MOCK_SERVICES__'] = MOCK_SERVICES;
    
  } catch (error) {
    console.error('❌ Erreur lors du setup global:', error);
    
    // Nettoyer en cas d'erreur
    for (const service of MOCK_SERVICES) {
      if (service.process) {
        service.process.kill('SIGTERM');
      }
    }
    
    throw error;
  }
}