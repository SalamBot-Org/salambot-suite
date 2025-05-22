/**
 * @file        Tests pour le repository de conversations Firestore.
 * @author      SalamBot Team (contact: info@salambot.ma)
 * @created     2025-05-22
 * @updated     2025-05-22
 * @project     SalamBot - AI CRM for Moroccan SMEs
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FirestoreConversationRepository } from '../firestore/conversationRepo';
import { 
  Conversation, 
  Message, 
  ConversationStatus, 
  Channel, 
  MessageRole, 
  MessageSource 
} from '../types';

// Mock de Firestore
const mockFirestore = {
  collection: vi.fn(),
};

// Mock de CollectionReference
const mockCollection = {
  doc: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
};

// Mock de DocumentReference
const mockDocument = {
  get: vi.fn(),
  set: vi.fn(),
  update: vi.fn(),
};

// Mock de Query
const mockQuery = {
  get: vi.fn(),
};

// Mock de DocumentSnapshot
const mockDocumentSnapshot = {
  exists: true,
  data: vi.fn(),
};

// Mock de QuerySnapshot
const mockQuerySnapshot = {
  docs: [],
};

describe('FirestoreConversationRepository', () => {
  let repository: FirestoreConversationRepository;
  
  beforeEach(() => {
    // Réinitialiser les mocks
    vi.clearAllMocks();
    
    // Configurer les mocks
    mockFirestore.collection.mockReturnValue(mockCollection);
    mockCollection.doc.mockReturnValue(mockDocument);
    mockCollection.where.mockReturnValue(mockQuery);
    mockQuery.orderBy = vi.fn().mockReturnValue(mockQuery);
    mockQuery.limit = vi.fn().mockReturnValue(mockQuery);
    mockQuery.get.mockResolvedValue(mockQuerySnapshot);
    mockDocument.get.mockResolvedValue(mockDocumentSnapshot);
    mockDocument.set.mockResolvedValue(undefined);
    mockDocument.update.mockResolvedValue(undefined);
    
    // Créer le repository avec le mock Firestore
    repository = new FirestoreConversationRepository(mockFirestore as any);
  });
  
  afterEach(() => {
    vi.resetAllMocks();
  });
  
  describe('createConversation', () => {
    it('devrait créer une nouvelle conversation avec un ID unique', async () => {
      // Données de test
      const conversationData: Omit<Conversation, 'id'> = {
        userId: 'user123',
        channel: Channel.WEB,
        lang: 'fr',
        status: ConversationStatus.ACTIVE,
        startedAt: new Date(),
        lastMessageAt: new Date(),
      };
      
      // Exécuter la méthode
      const result = await repository.createConversation(conversationData);
      
      // Vérifier que l'ID a été généré
      expect(result.id).toBeDefined();
      expect(typeof result.id).toBe('string');
      
      // Vérifier que les données sont correctes
      expect(result.userId).toBe(conversationData.userId);
      expect(result.channel).toBe(conversationData.channel);
      expect(result.lang).toBe(conversationData.lang);
      expect(result.status).toBe(conversationData.status);
      
      // Vérifier que Firestore a été appelé correctement
      expect(mockFirestore.collection).toHaveBeenCalledWith('conversations');
      expect(mockCollection.doc).toHaveBeenCalledWith(result.id);
      expect(mockDocument.set).toHaveBeenCalled();
    });
  });
  
  describe('getConversation', () => {
    it('devrait retourner une conversation existante', async () => {
      // Configurer le mock pour retourner des données
      const mockData = {
        id: 'conv123',
        userId: 'user123',
        channel: Channel.WEB,
        lang: 'fr',
        status: ConversationStatus.ACTIVE,
        startedAt: { seconds: 1621500000, nanoseconds: 0 },
        lastMessageAt: { seconds: 1621500100, nanoseconds: 0 },
      };
      
      mockDocumentSnapshot.data.mockReturnValue(mockData);
      
      // Exécuter la méthode
      const result = await repository.getConversation('conv123');
      
      // Vérifier que les données sont correctes
      expect(result).toBeDefined();
      expect(result?.id).toBe('conv123');
      expect(result?.userId).toBe('user123');
      expect(result?.channel).toBe(Channel.WEB);
      expect(result?.lang).toBe('fr');
      expect(result?.status).toBe(ConversationStatus.ACTIVE);
      expect(result?.startedAt).toBeInstanceOf(Date);
      expect(result?.lastMessageAt).toBeInstanceOf(Date);
      
      // Vérifier que Firestore a été appelé correctement
      expect(mockFirestore.collection).toHaveBeenCalledWith('conversations');
      expect(mockCollection.doc).toHaveBeenCalledWith('conv123');
      expect(mockDocument.get).toHaveBeenCalled();
    });
    
    it('devrait retourner null si la conversation n\'existe pas', async () => {
      // Configurer le mock pour simuler une conversation inexistante
      mockDocumentSnapshot.exists = false;
      
      // Exécuter la méthode
      const result = await repository.getConversation('nonexistent');
      
      // Vérifier que null est retourné
      expect(result).toBeNull();
      
      // Vérifier que Firestore a été appelé correctement
      expect(mockFirestore.collection).toHaveBeenCalledWith('conversations');
      expect(mockCollection.doc).toHaveBeenCalledWith('nonexistent');
      expect(mockDocument.get).toHaveBeenCalled();
    });
  });
  
  describe('updateConversationStatus', () => {
    it('devrait mettre à jour le statut d\'une conversation', async () => {
      // Exécuter la méthode
      const result = await repository.updateConversationStatus('conv123', ConversationStatus.ESCALATED);
      
      // Vérifier que la mise à jour a réussi
      expect(result).toBe(true);
      
      // Vérifier que Firestore a été appelé correctement
      expect(mockFirestore.collection).toHaveBeenCalledWith('conversations');
      expect(mockCollection.doc).toHaveBeenCalledWith('conv123');
      expect(mockDocument.update).toHaveBeenCalled();
      
      // Vérifier que le statut a été mis à jour
      const updateCall = mockDocument.update.mock.calls[0][0];
      expect(updateCall.status).toBe(ConversationStatus.ESCALATED);
      expect(updateCall.lastMessageAt).toBeDefined();
    });
  });
  
  describe('addMessage', () => {
    it('devrait ajouter un message à une conversation', async () => {
      // Données de test
      const messageData: Omit<Message, 'id'> = {
        conversationId: 'conv123',
        role: MessageRole.USER,
        content: 'Bonjour, comment puis-je vous aider ?',
        lang: 'fr',
        timestamp: new Date(),
        source: MessageSource.CHAT,
      };
      
      // Exécuter la méthode
      const result = await repository.addMessage(messageData);
      
      // Vérifier que l'ID a été généré
      expect(result.id).toBeDefined();
      expect(typeof result.id).toBe('string');
      
      // Vérifier que les données sont correctes
      expect(result.conversationId).toBe(messageData.conversationId);
      expect(result.role).toBe(messageData.role);
      expect(result.content).toBe(messageData.content);
      expect(result.lang).toBe(messageData.lang);
      expect(result.source).toBe(messageData.source);
      
      // Vérifier que Firestore a été appelé correctement
      expect(mockFirestore.collection).toHaveBeenCalledWith('messages');
      expect(mockCollection.doc).toHaveBeenCalledWith(result.id);
      expect(mockDocument.set).toHaveBeenCalled();
      
      // Vérifier que la conversation a été mise à jour
      expect(mockFirestore.collection).toHaveBeenCalledWith('conversations');
      expect(mockCollection.doc).toHaveBeenCalledWith('conv123');
      expect(mockDocument.update).toHaveBeenCalled();
    });
  });
  
  describe('getMessages', () => {
    it('devrait récupérer les messages d\'une conversation', async () => {
      // Configurer le mock pour retourner des messages
      const mockMessages = [
        {
          id: 'msg1',
          conversationId: 'conv123',
          role: MessageRole.USER,
          content: 'Bonjour',
          lang: 'fr',
          timestamp: { seconds: 1621500000, nanoseconds: 0 },
          source: MessageSource.CHAT,
        },
        {
          id: 'msg2',
          conversationId: 'conv123',
          role: MessageRole.BOT,
          content: 'Comment puis-je vous aider ?',
          lang: 'fr',
          timestamp: { seconds: 1621500100, nanoseconds: 0 },
          source: MessageSource.CHAT,
        },
      ];
      
      mockQuerySnapshot.docs = mockMessages.map(msg => ({
        data: () => msg,
      }));
      
      // Exécuter la méthode
      const result = await repository.getMessages('conv123');
      
      // Vérifier que les messages sont retournés
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('msg1');
      expect(result[0].role).toBe(MessageRole.USER);
      expect(result[1].id).toBe('msg2');
      expect(result[1].role).toBe(MessageRole.BOT);
      
      // Vérifier que Firestore a été appelé correctement
      expect(mockFirestore.collection).toHaveBeenCalledWith('messages');
      expect(mockCollection.where).toHaveBeenCalledWith('conversationId', '==', 'conv123');
      expect(mockQuery.orderBy).toHaveBeenCalledWith('timestamp', 'asc');
      expect(mockQuery.limit).toHaveBeenCalledWith(50);
      expect(mockQuery.get).toHaveBeenCalled();
    });
  });
  
  describe('listConversationsByUser', () => {
    it('devrait lister les conversations d\'un utilisateur', async () => {
      // Configurer le mock pour retourner des conversations
      const mockConversations = [
        {
          id: 'conv1',
          userId: 'user123',
          channel: Channel.WEB,
          lang: 'fr',
          status: ConversationStatus.ACTIVE,
          startedAt: { seconds: 1621500000, nanoseconds: 0 },
          lastMessageAt: { seconds: 1621500100, nanoseconds: 0 },
        },
        {
          id: 'conv2',
          userId: 'user123',
          channel: Channel.WHATSAPP,
          lang: 'ar',
          status: ConversationStatus.RESOLVED,
          startedAt: { seconds: 1621400000, nanoseconds: 0 },
          lastMessageAt: { seconds: 1621400100, nanoseconds: 0 },
        },
      ];
      
      mockQuerySnapshot.docs = mockConversations.map(conv => ({
        data: () => conv,
      }));
      
      // Exécuter la méthode
      const result = await repository.listConversationsByUser('user123');
      
      // Vérifier que les conversations sont retournées
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('conv1');
      expect(result[0].channel).toBe(Channel.WEB);
      expect(result[1].id).toBe('conv2');
      expect(result[1].channel).toBe(Channel.WHATSAPP);
      
      // Vérifier que Firestore a été appelé correctement
      expect(mockFirestore.collection).toHaveBeenCalledWith('conversations');
      expect(mockCollection.where).toHaveBeenCalledWith('userId', '==', 'user123');
      expect(mockQuery.orderBy).toHaveBeenCalledWith('lastMessageAt', 'desc');
      expect(mockQuery.limit).toHaveBeenCalledWith(10);
      expect(mockQuery.get).toHaveBeenCalled();
    });
  });
});
