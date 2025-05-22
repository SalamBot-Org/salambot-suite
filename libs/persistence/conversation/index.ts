/**
 * @file        Façade unifiée pour la persistance des conversations dans SalamBot.
 * @author      SalamBot Team (contact: info@salambot.ma)
 * @created     2025-05-22
 * @updated     2025-05-22
 * @project     SalamBot - AI CRM for Moroccan SMEs
 */

import { FirestoreConversationRepository } from './firestore/conversationRepo';
import { ConversationRepository } from './types';

// Exporter tous les types pour faciliter l'utilisation
export * from './types';
export * from './schema';

/**
 * Détermine le driver de persistance à utiliser en fonction de la configuration
 */
function getPersistenceDriver(): 'firestore' | 'postgres' {
  const driver = process.env.PERSISTENCE_DRIVER || 'firestore';
  
  if (driver !== 'firestore' && driver !== 'postgres') {
    console.warn(`Driver de persistance inconnu: ${driver}. Utilisation de Firestore par défaut.`);
    return 'firestore';
  }
  
  return driver as 'firestore' | 'postgres';
}

/**
 * Crée et retourne une instance du repository de conversations
 * en fonction du driver configuré (Firestore ou PostgreSQL)
 */
export function createConversationRepository(): ConversationRepository {
  const driver = getPersistenceDriver();
  
  switch (driver) {
    case 'firestore':
      return new FirestoreConversationRepository();
    
    case 'postgres':
      // Note: L'implémentation PostgreSQL sera ajoutée dans une PR future
      // Pour l'instant, on lance une erreur explicite
      throw new Error('Le driver PostgreSQL n\'est pas encore implémenté. Utilisez Firestore pour le moment.');
    
    default:
      // Ce cas ne devrait jamais arriver grâce à la validation dans getPersistenceDriver
      return new FirestoreConversationRepository();
  }
}

// Exporter une instance par défaut pour faciliter l'utilisation
export const conversationRepository = createConversationRepository();
