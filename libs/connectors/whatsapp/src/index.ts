/**
 * @file        Point d'entrée principal du connecteur WhatsApp pour SalamBot.
 * @author      SalamBot Team (contact: info@salambot.ma)
 * @created     2025-05-22
 * @updated     2025-05-22
 * @project     SalamBot - AI CRM for Moroccan SMEs
 */

import dotenv from 'dotenv';
import { Router } from 'express';
import { whatsappRouter } from './webhookHandler';
import { verifySignature } from './verifySignature';
import { sendMessage } from './sendMessage';

// Charger les variables d'environnement
dotenv.config();

// Exporter les fonctions et types publics
export { verifySignature, sendMessage, whatsappRouter };

// Exporter un router Express configuré
export function createWhatsAppConnector(): Router {
  // Vérifier les variables d'environnement requises
  const requiredEnvVars = [
    'WA_VERIFY_TOKEN',
    'WA_PHONE_ID',
    'WA_ACCESS_TOKEN',
    'APP_SECRET'
  ];
  
  const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingEnvVars.length > 0) {
    console.warn(`WhatsApp connector: Missing environment variables: ${missingEnvVars.join(', ')}`);
  }
  
  // Créer et retourner le router
  const router = Router();
  router.use('/wa', whatsappRouter);
  return router;
}

// Exporter un middleware Express pour faciliter l'intégration
export default createWhatsAppConnector();
