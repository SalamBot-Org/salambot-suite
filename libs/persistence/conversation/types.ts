/**
 * @file        Types pour la persistance des conversations dans SalamBot.
 * @author      SalamBot Team (contact: info@salambot.ma)
 * @created     2025-05-22
 * @updated     2025-05-22
 * @project     SalamBot - AI CRM for Moroccan SMEs
 */

/**
 * Statut possible d'une conversation
 */
export enum ConversationStatus {
  ACTIVE = 'active',           // Conversation en cours
  WAITING = 'waiting',         // En attente de réponse utilisateur
  ESCALATED = 'escalated',     // Escaladée vers un agent humain
  RESOLVED = 'resolved',       // Résolue (terminée avec succès)
  ABANDONED = 'abandoned',     // Abandonnée par l'utilisateur
  ARCHIVED = 'archived'        // Archivée (plus accessible directement)
}

/**
 * Canaux de communication supportés
 */
export enum Channel {
  WEB = 'web',                 // Widget web
  WHATSAPP = 'whatsapp',       // WhatsApp Business API
  VOICE = 'voice',             // Appel vocal
  EMAIL = 'email',             // Email (futur)
  SMS = 'sms'                  // SMS (futur)
}

/**
 * Rôles possibles dans une conversation
 */
export enum MessageRole {
  USER = 'user',               // Message de l'utilisateur
  BOT = 'bot',                 // Message du bot
  AGENT = 'agent',             // Message d'un agent humain
  SYSTEM = 'system'            // Message système (notifications, etc.)
}

/**
 * Sources possibles d'un message
 */
export enum MessageSource {
  CHAT = 'chat',               // Message texte direct
  AUDIO = 'audio',             // Message audio transcrit
  IMAGE = 'image',             // Message avec image (futur)
  DOCUMENT = 'document',       // Message avec document (futur)
  LOCATION = 'location'        // Message avec localisation (futur)
}

/**
 * Interface pour les métadonnées d'un message
 */
export interface MessageMetadata {
  modelUsed?: string;          // Modèle LLM utilisé pour la réponse
  confidence?: number;         // Confiance de la détection de langue
  audioId?: string;            // ID du fichier audio (si message audio)
  escalationReason?: string;   // Raison de l'escalade (si escaladé)
  agentId?: string;            // ID de l'agent (si message d'agent)
  [key: string]: any;          // Autres métadonnées spécifiques
}

/**
 * Interface pour un message dans une conversation
 */
export interface Message {
  id: string;                  // ID unique du message
  conversationId: string;      // ID de la conversation parente
  role: MessageRole;           // Rôle de l'émetteur
  content: string;             // Contenu du message
  lang: string;                // Langue du message (fr, ar, ar-ma)
  timestamp: Date;             // Horodatage du message
  source: MessageSource;       // Source du message
  metadata?: MessageMetadata;  // Métadonnées additionnelles
}

/**
 * Interface pour une conversation
 */
export interface Conversation {
  id: string;                  // ID unique de la conversation
  userId?: string;             // ID de l'utilisateur (si authentifié)
  channel: Channel;            // Canal de communication
  lang: string;                // Langue principale détectée
  status: ConversationStatus;  // Statut actuel
  startedAt: Date;             // Date de début
  lastMessageAt: Date;         // Date du dernier message
  agentId?: string;            // ID de l'agent assigné (si escaladé)
  metadata?: {                 // Métadonnées additionnelles
    userInfo?: {               // Informations sur l'utilisateur
      name?: string;           // Nom de l'utilisateur
      email?: string;          // Email de l'utilisateur
      phone?: string;          // Téléphone de l'utilisateur
    };
    tags?: string[];           // Tags pour catégorisation
    priority?: 'low' | 'medium' | 'high' | 'urgent'; // Priorité
    [key: string]: any;        // Autres métadonnées spécifiques
  };
}

/**
 * Interface pour le repository de conversations
 */
export interface ConversationRepository {
  // Opérations sur les conversations
  createConversation(conversation: Omit<Conversation, 'id'>): Promise<Conversation>;
  getConversation(id: string): Promise<Conversation | null>;
  updateConversationStatus(id: string, status: ConversationStatus): Promise<boolean>;
  updateConversationMetadata(id: string, metadata: any): Promise<boolean>;
  listConversationsByUser(userId: string, limit?: number): Promise<Conversation[]>;
  listConversationsByStatus(status: ConversationStatus, limit?: number): Promise<Conversation[]>;
  
  // Opérations sur les messages
  addMessage(message: Omit<Message, 'id'>): Promise<Message>;
  getMessages(conversationId: string, limit?: number): Promise<Message[]>;
  getMessageById(messageId: string): Promise<Message | null>;
}
