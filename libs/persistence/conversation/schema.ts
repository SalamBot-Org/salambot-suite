/**
 * @file        Schéma de données pour la persistance des conversations dans SalamBot.
 * @author      SalamBot Team (contact: info@salambot.ma)
 * @created     2025-05-22
 * @updated     2025-05-22
 * @project     SalamBot - AI CRM for Moroccan SMEs
 */

import { ConversationStatus, Channel, MessageRole, MessageSource } from './types';

/**
 * Schéma Firestore pour les collections et documents
 */
export const FirestoreSchema = {
  // Collections principales
  collections: {
    conversations: 'conversations',
    messages: 'messages',
  },
  
  // Structure des documents
  conversationDocument: {
    id: '',                    // ID unique de la conversation
    userId: '',                // ID de l'utilisateur (si authentifié)
    channel: Channel.WEB,      // Canal de communication
    lang: 'fr',                // Langue principale détectée
    status: ConversationStatus.ACTIVE, // Statut actuel
    startedAt: new Date(),     // Date de début
    lastMessageAt: new Date(), // Date du dernier message
    agentId: '',               // ID de l'agent assigné (si escaladé)
    metadata: {                // Métadonnées additionnelles
      userInfo: {              // Informations sur l'utilisateur
        name: '',              // Nom de l'utilisateur
        email: '',             // Email de l'utilisateur
        phone: '',             // Téléphone de l'utilisateur
      },
      tags: [],                // Tags pour catégorisation
      priority: 'medium',      // Priorité
    },
  },
  
  messageDocument: {
    id: '',                    // ID unique du message
    conversationId: '',        // ID de la conversation parente
    role: MessageRole.USER,    // Rôle de l'émetteur
    content: '',               // Contenu du message
    lang: 'fr',                // Langue du message (fr, ar, ar-ma)
    timestamp: new Date(),     // Horodatage du message
    source: MessageSource.CHAT, // Source du message
    metadata: {                // Métadonnées additionnelles
      modelUsed: '',           // Modèle LLM utilisé pour la réponse
      confidence: 0,           // Confiance de la détection de langue
      audioId: '',             // ID du fichier audio (si message audio)
      escalationReason: '',    // Raison de l'escalade (si escaladé)
      agentId: '',             // ID de l'agent (si message d'agent)
    },
  },
  
  // Indexes pour optimiser les requêtes
  indexes: [
    { collection: 'conversations', fields: ['userId', 'lastMessageAt'] },
    { collection: 'conversations', fields: ['status', 'lastMessageAt'] },
    { collection: 'conversations', fields: ['channel', 'status'] },
    { collection: 'messages', fields: ['conversationId', 'timestamp'] },
  ],
};

/**
 * Schéma PostgreSQL pour les tables et relations (préparation pour mode souverain)
 */
export const PostgresSchema = {
  // Tables principales
  tables: {
    conversations: 'conversations',
    messages: 'messages',
  },
  
  // Structure des tables (compatible avec Drizzle ORM)
  conversationTable: {
    id: 'uuid primary key',
    userId: 'varchar(255)',
    channel: 'varchar(50) not null',
    lang: 'varchar(10) not null',
    status: 'varchar(50) not null',
    startedAt: 'timestamp not null',
    lastMessageAt: 'timestamp not null',
    agentId: 'varchar(255)',
    metadata: 'jsonb',
  },
  
  messageTable: {
    id: 'uuid primary key',
    conversationId: 'uuid not null references conversations(id)',
    role: 'varchar(50) not null',
    content: 'text not null',
    lang: 'varchar(10) not null',
    timestamp: 'timestamp not null',
    source: 'varchar(50) not null',
    metadata: 'jsonb',
  },
  
  // Indexes pour optimiser les requêtes
  indexes: [
    'CREATE INDEX idx_conversations_user ON conversations(userId, lastMessageAt DESC)',
    'CREATE INDEX idx_conversations_status ON conversations(status, lastMessageAt DESC)',
    'CREATE INDEX idx_conversations_channel ON conversations(channel, status)',
    'CREATE INDEX idx_messages_conversation ON messages(conversationId, timestamp DESC)',
  ],
};

/**
 * Convertit un objet Date en timestamp Firestore
 */
export function dateToFirestore(date: Date): any {
  return {
    seconds: Math.floor(date.getTime() / 1000),
    nanoseconds: (date.getTime() % 1000) * 1000000,
  };
}

/**
 * Convertit un timestamp Firestore en objet Date
 */
export function firestoreToDate(timestamp: any): Date {
  if (!timestamp) return new Date();
  
  if (timestamp.toDate && typeof timestamp.toDate === 'function') {
    return timestamp.toDate();
  }
  
  if (timestamp.seconds !== undefined && timestamp.nanoseconds !== undefined) {
    return new Date(timestamp.seconds * 1000 + timestamp.nanoseconds / 1000000);
  }
  
  return new Date(timestamp);
}
