/**
 * @file        Implémentation Firestore du repository de conversations pour SalamBot.
 * @author      SalamBot Team (contact: info@salambot.ma)
 * @created     2025-05-22
 * @updated     2025-05-22
 * @project     SalamBot - AI CRM for Moroccan SMEs
 */

import { Firestore, CollectionReference, DocumentReference } from '@google-cloud/firestore';
import { v4 as uuidv4 } from 'uuid';
import { trace } from '@opentelemetry/api';
import { 
  Conversation, 
  Message, 
  ConversationStatus,
  ConversationRepository
} from '../types';
import { FirestoreSchema, dateToFirestore, firestoreToDate } from '../schema';

// Tracer pour le composant de persistance
const tracer = trace.getTracer('salambot.persistence');

/**
 * Implémentation Firestore du repository de conversations
 */
export class FirestoreConversationRepository implements ConversationRepository {
  private firestore: Firestore;
  private conversationsCollection: CollectionReference;
  private messagesCollection: CollectionReference;

  /**
   * Constructeur du repository Firestore
   * @param firestoreClient Client Firestore (injecté pour faciliter les tests)
   */
  constructor(firestoreClient?: Firestore) {
    // Initialiser Firestore
    this.firestore = firestoreClient || new Firestore();
    
    // Récupérer les références des collections
    this.conversationsCollection = this.firestore.collection(FirestoreSchema.collections.conversations);
    this.messagesCollection = this.firestore.collection(FirestoreSchema.collections.messages);
  }

  /**
   * Crée une nouvelle conversation
   * @param conversation Données de la conversation à créer
   * @returns La conversation créée avec son ID
   */
  async createConversation(conversation: Omit<Conversation, 'id'>): Promise<Conversation> {
    const span = tracer.startSpan('chat.persist.conversation.created');
    
    try {
      // Générer un ID unique
      const id = uuidv4();
      
      // Préparer le document à insérer
      const conversationDoc = {
        id,
        ...conversation,
        startedAt: dateToFirestore(conversation.startedAt),
        lastMessageAt: dateToFirestore(conversation.lastMessageAt),
      };
      
      // Ajouter à Firestore
      await this.conversationsCollection.doc(id).set(conversationDoc);
      
      // Ajouter des attributs au span
      span.setAttribute('conversation.id', id);
      span.setAttribute('conversation.channel', conversation.channel);
      span.setAttribute('conversation.lang', conversation.lang);
      span.end();
      
      // Retourner la conversation créée
      return {
        ...conversation,
        id,
      };
    } catch (error) {
      // Ajouter l'erreur au span
      span.setAttribute('error', true);
      span.setAttribute('error.message', error instanceof Error ? error.message : 'Unknown error');
      span.end();
      
      throw error;
    }
  }

  /**
   * Récupère une conversation par son ID
   * @param id ID de la conversation
   * @returns La conversation ou null si non trouvée
   */
  async getConversation(id: string): Promise<Conversation | null> {
    const span = tracer.startSpan('chat.persist.conversation.get');
    span.setAttribute('conversation.id', id);
    
    try {
      // Récupérer le document
      const doc = await this.conversationsCollection.doc(id).get();
      
      if (!doc.exists) {
        span.setAttribute('conversation.found', false);
        span.end();
        return null;
      }
      
      // Convertir le document en objet Conversation
      const data = doc.data();
      const conversation: Conversation = {
        ...data,
        startedAt: firestoreToDate(data.startedAt),
        lastMessageAt: firestoreToDate(data.lastMessageAt),
      } as Conversation;
      
      span.setAttribute('conversation.found', true);
      span.end();
      
      return conversation;
    } catch (error) {
      // Ajouter l'erreur au span
      span.setAttribute('error', true);
      span.setAttribute('error.message', error instanceof Error ? error.message : 'Unknown error');
      span.end();
      
      throw error;
    }
  }

  /**
   * Met à jour le statut d'une conversation
   * @param id ID de la conversation
   * @param status Nouveau statut
   * @returns true si la mise à jour a réussi
   */
  async updateConversationStatus(id: string, status: ConversationStatus): Promise<boolean> {
    const span = tracer.startSpan('chat.persist.conversation.update_status');
    span.setAttribute('conversation.id', id);
    span.setAttribute('conversation.new_status', status);
    
    try {
      // Mettre à jour le statut
      await this.conversationsCollection.doc(id).update({
        status,
        lastMessageAt: dateToFirestore(new Date()),
      });
      
      span.setAttribute('success', true);
      span.end();
      
      return true;
    } catch (error) {
      // Ajouter l'erreur au span
      span.setAttribute('error', true);
      span.setAttribute('error.message', error instanceof Error ? error.message : 'Unknown error');
      span.end();
      
      return false;
    }
  }

  /**
   * Met à jour les métadonnées d'une conversation
   * @param id ID de la conversation
   * @param metadata Nouvelles métadonnées (fusion avec les existantes)
   * @returns true si la mise à jour a réussi
   */
  async updateConversationMetadata(id: string, metadata: any): Promise<boolean> {
    const span = tracer.startSpan('chat.persist.conversation.update_metadata');
    span.setAttribute('conversation.id', id);
    
    try {
      // Récupérer la conversation actuelle
      const doc = await this.conversationsCollection.doc(id).get();
      
      if (!doc.exists) {
        span.setAttribute('conversation.found', false);
        span.end();
        return false;
      }
      
      const data = doc.data();
      const currentMetadata = data.metadata || {};
      
      // Fusionner les métadonnées
      const updatedMetadata = {
        ...currentMetadata,
        ...metadata,
      };
      
      // Mettre à jour les métadonnées
      await this.conversationsCollection.doc(id).update({
        metadata: updatedMetadata,
        lastMessageAt: dateToFirestore(new Date()),
      });
      
      span.setAttribute('success', true);
      span.end();
      
      return true;
    } catch (error) {
      // Ajouter l'erreur au span
      span.setAttribute('error', true);
      span.setAttribute('error.message', error instanceof Error ? error.message : 'Unknown error');
      span.end();
      
      return false;
    }
  }

  /**
   * Liste les conversations d'un utilisateur
   * @param userId ID de l'utilisateur
   * @param limit Nombre maximum de conversations à retourner
   * @returns Liste des conversations
   */
  async listConversationsByUser(userId: string, limit: number = 10): Promise<Conversation[]> {
    const span = tracer.startSpan('chat.persist.conversation.list_by_user');
    span.setAttribute('user.id', userId);
    span.setAttribute('limit', limit);
    
    try {
      // Requête pour récupérer les conversations de l'utilisateur
      const query = this.conversationsCollection
        .where('userId', '==', userId)
        .orderBy('lastMessageAt', 'desc')
        .limit(limit);
      
      const snapshot = await query.get();
      
      // Convertir les documents en objets Conversation
      const conversations: Conversation[] = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          startedAt: firestoreToDate(data.startedAt),
          lastMessageAt: firestoreToDate(data.lastMessageAt),
        } as Conversation;
      });
      
      span.setAttribute('conversations.count', conversations.length);
      span.end();
      
      return conversations;
    } catch (error) {
      // Ajouter l'erreur au span
      span.setAttribute('error', true);
      span.setAttribute('error.message', error instanceof Error ? error.message : 'Unknown error');
      span.end();
      
      throw error;
    }
  }

  /**
   * Liste les conversations par statut
   * @param status Statut des conversations à récupérer
   * @param limit Nombre maximum de conversations à retourner
   * @returns Liste des conversations
   */
  async listConversationsByStatus(status: ConversationStatus, limit: number = 10): Promise<Conversation[]> {
    const span = tracer.startSpan('chat.persist.conversation.list_by_status');
    span.setAttribute('conversation.status', status);
    span.setAttribute('limit', limit);
    
    try {
      // Requête pour récupérer les conversations par statut
      const query = this.conversationsCollection
        .where('status', '==', status)
        .orderBy('lastMessageAt', 'desc')
        .limit(limit);
      
      const snapshot = await query.get();
      
      // Convertir les documents en objets Conversation
      const conversations: Conversation[] = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          startedAt: firestoreToDate(data.startedAt),
          lastMessageAt: firestoreToDate(data.lastMessageAt),
        } as Conversation;
      });
      
      span.setAttribute('conversations.count', conversations.length);
      span.end();
      
      return conversations;
    } catch (error) {
      // Ajouter l'erreur au span
      span.setAttribute('error', true);
      span.setAttribute('error.message', error instanceof Error ? error.message : 'Unknown error');
      span.end();
      
      throw error;
    }
  }

  /**
   * Ajoute un message à une conversation
   * @param message Message à ajouter
   * @returns Le message ajouté avec son ID
   */
  async addMessage(message: Omit<Message, 'id'>): Promise<Message> {
    const span = tracer.startSpan('chat.persist.message');
    span.setAttribute('conversation.id', message.conversationId);
    span.setAttribute('message.role', message.role);
    
    try {
      // Générer un ID unique
      const id = uuidv4();
      
      // Préparer le document à insérer
      const messageDoc = {
        id,
        ...message,
        timestamp: dateToFirestore(message.timestamp),
      };
      
      // Ajouter à Firestore
      await this.messagesCollection.doc(id).set(messageDoc);
      
      // Mettre à jour la date du dernier message de la conversation
      await this.conversationsCollection.doc(message.conversationId).update({
        lastMessageAt: dateToFirestore(message.timestamp),
        lang: message.lang, // Mettre à jour la langue détectée
      });
      
      // Ajouter des attributs au span
      span.setAttribute('message.id', id);
      span.setAttribute('message.lang', message.lang);
      span.end();
      
      // Retourner le message créé
      return {
        ...message,
        id,
      };
    } catch (error) {
      // Ajouter l'erreur au span
      span.setAttribute('error', true);
      span.setAttribute('error.message', error instanceof Error ? error.message : 'Unknown error');
      span.end();
      
      throw error;
    }
  }

  /**
   * Récupère les messages d'une conversation
   * @param conversationId ID de la conversation
   * @param limit Nombre maximum de messages à retourner
   * @returns Liste des messages
   */
  async getMessages(conversationId: string, limit: number = 50): Promise<Message[]> {
    const span = tracer.startSpan('chat.persist.messages.get');
    span.setAttribute('conversation.id', conversationId);
    span.setAttribute('limit', limit);
    
    try {
      // Requête pour récupérer les messages de la conversation
      const query = this.messagesCollection
        .where('conversationId', '==', conversationId)
        .orderBy('timestamp', 'asc')
        .limit(limit);
      
      const snapshot = await query.get();
      
      // Convertir les documents en objets Message
      const messages: Message[] = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          timestamp: firestoreToDate(data.timestamp),
        } as Message;
      });
      
      span.setAttribute('messages.count', messages.length);
      span.end();
      
      return messages;
    } catch (error) {
      // Ajouter l'erreur au span
      span.setAttribute('error', true);
      span.setAttribute('error.message', error instanceof Error ? error.message : 'Unknown error');
      span.end();
      
      throw error;
    }
  }

  /**
   * Récupère un message par son ID
   * @param messageId ID du message
   * @returns Le message ou null si non trouvé
   */
  async getMessageById(messageId: string): Promise<Message | null> {
    const span = tracer.startSpan('chat.persist.message.get');
    span.setAttribute('message.id', messageId);
    
    try {
      // Récupérer le document
      const doc = await this.messagesCollection.doc(messageId).get();
      
      if (!doc.exists) {
        span.setAttribute('message.found', false);
        span.end();
        return null;
      }
      
      // Convertir le document en objet Message
      const data = doc.data();
      const message: Message = {
        ...data,
        timestamp: firestoreToDate(data.timestamp),
      } as Message;
      
      span.setAttribute('message.found', true);
      span.end();
      
      return message;
    } catch (error) {
      // Ajouter l'erreur au span
      span.setAttribute('error', true);
      span.setAttribute('error.message', error instanceof Error ? error.message : 'Unknown error');
      span.end();
      
      throw error;
    }
  }
}
