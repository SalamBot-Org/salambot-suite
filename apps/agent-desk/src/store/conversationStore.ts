/**
 * @file        Store Zustand enrichi pour la gestion des conversations et de l'escalade en temps réel.
 * @author      SalamBot Team (contact: salam@chebakia.com)
 * @created     2025-05-21
 * @updated     2025-05-21
 * @project     SalamBot - AI CRM for Moroccan SMEs
 */

import { create } from 'zustand';
import { detectLanguage } from '../utils/lang-detect-mock';
import { useLanguageStore } from './languageStore';

// Types pour les conversations
export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot' | 'agent';
  timestamp: Date;
  language?: 'fr' | 'ar' | 'ar-ma' | 'unknown';
}

// Statuts de conversation enrichis selon les recommandations
export type ConversationStatus = 'open' | 'escalated' | 'active' | 'resolved';

// Métriques de conversation
export interface ConversationMetrics {
  firstResponseTime?: number; // Temps en ms pour la première réponse
  avgResponseTime?: number;   // Temps moyen de réponse en ms
  escalationTime?: number;    // Temps avant escalade en ms
  resolutionTime?: number;    // Temps total jusqu'à résolution en ms
  messageCount: {             // Nombre de messages par type
    user: number;
    bot: number;
    agent: number;
  };
  csatScore?: number;         // Score de satisfaction client (1-5)
}

export interface Conversation {
  id: string;
  customer: {
    id: string;
    name: string;
    channel: 'whatsapp' | 'web' | 'voice';
  };
  messages: Message[];
  status: ConversationStatus;
  language: 'fr' | 'ar' | 'ar-ma' | 'unknown';
  assignedAgent?: string;
  escalatedAt?: Date;
  lastActivity: Date;
  slaStatus: 'normal' | 'warning' | 'critical';
  metrics: ConversationMetrics;
  source: 'realtime' | 'historical'; // Indique si la conversation est en cours ou historique
}

interface ConversationState {
  // État
  conversations: Conversation[];
  activeConversationId: string | null;
  isConnected: boolean; // État de connexion WebSocket
  
  // Actions
  addConversation: (conversation: Conversation) => void;
  addMessage: (conversationId: string, message: Message) => void;
  takeOverConversation: (conversationId: string, agentId: string) => void;
  resolveConversation: (conversationId: string) => void;
  setActiveConversation: (conversationId: string | null) => void;
  detectLanguageFromMessage: (conversationId: string, messageText: string) => Promise<void>;
  updateSlaStatus: () => void;
  updateConversationStatus: (conversationId: string, status: ConversationStatus) => void;
  updateConnectionStatus: (isConnected: boolean) => void;
  updateCsatScore: (conversationId: string, score: number) => void;
}

export const useConversationStore = create<ConversationState>((set, get) => ({
  // État initial
  conversations: [],
  activeConversationId: null,
  isConnected: false,
  
  // Actions
  addConversation: (conversation) => set((state) => {
    // Vérifier si la conversation existe déjà
    if (state.conversations.some(conv => conv.id === conversation.id)) {
      return state;
    }
    
    // Initialiser les métriques si non présentes
    const conversationWithMetrics = {
      ...conversation,
      metrics: conversation.metrics || {
        messageCount: {
          user: 0,
          bot: 0,
          agent: 0
        }
      }
    };
    
    return {
      conversations: [...state.conversations, conversationWithMetrics]
    };
  }),
  
  addMessage: (conversationId, message) => set((state) => {
    const now = new Date();
    
    const updatedConversations = state.conversations.map(conv => {
      if (conv.id === conversationId) {
        // Mettre à jour les métriques
        const updatedMetrics = { ...conv.metrics };
        
        // Incrémenter le compteur de messages
        if (message.sender === 'user') {
          updatedMetrics.messageCount.user += 1;
        } else if (message.sender === 'bot') {
          updatedMetrics.messageCount.bot += 1;
        } else if (message.sender === 'agent') {
          updatedMetrics.messageCount.agent += 1;
          
          // Calculer le temps de première réponse si c'est le premier message de l'agent
          if (updatedMetrics.messageCount.agent === 1 && conv.escalatedAt) {
            updatedMetrics.firstResponseTime = now.getTime() - conv.escalatedAt.getTime();
          }
          
          // Mettre à jour le temps moyen de réponse
          const userMessages = conv.messages.filter(m => m.sender === 'user');
          if (userMessages.length > 0) {
            const lastUserMessage = userMessages[userMessages.length - 1];
            const responseTime = now.getTime() - new Date(lastUserMessage.timestamp).getTime();
            
            if (updatedMetrics.avgResponseTime) {
              updatedMetrics.avgResponseTime = (updatedMetrics.avgResponseTime + responseTime) / 2;
            } else {
              updatedMetrics.avgResponseTime = responseTime;
            }
          }
        }
        
        return {
          ...conv,
          messages: [...conv.messages, message],
          lastActivity: now,
          metrics: updatedMetrics
        };
      }
      return conv;
    });
    
    return { conversations: updatedConversations };
  }),
  
  takeOverConversation: (conversationId, agentId) => set((state) => {
    const now = new Date();
    
    const updatedConversations = state.conversations.map(conv => {
      if (conv.id === conversationId) {
        // Mettre à jour les métriques
        const updatedMetrics = { ...conv.metrics };
        
        // Si la conversation était en statut 'escalated', calculer le temps d'escalade
        if (conv.status === 'escalated' && conv.escalatedAt) {
          updatedMetrics.escalationTime = now.getTime() - conv.escalatedAt.getTime();
        }
        
        return {
          ...conv,
          status: 'active',
          assignedAgent: agentId,
          lastActivity: now,
          metrics: updatedMetrics
        };
      }
      return conv;
    });
    
    return { 
      conversations: updatedConversations,
      activeConversationId: conversationId
    };
  }),
  
  resolveConversation: (conversationId) => set((state) => {
    const now = new Date();
    
    const updatedConversations = state.conversations.map(conv => {
      if (conv.id === conversationId) {
        // Mettre à jour les métriques
        const updatedMetrics = { ...conv.metrics };
        
        // Calculer le temps total de résolution
        const firstMessage = conv.messages[0];
        if (firstMessage) {
          updatedMetrics.resolutionTime = now.getTime() - new Date(firstMessage.timestamp).getTime();
        }
        
        return {
          ...conv,
          status: 'resolved',
          lastActivity: now,
          metrics: updatedMetrics
        };
      }
      return conv;
    });
    
    return { 
      conversations: updatedConversations,
      activeConversationId: state.activeConversationId === conversationId ? null : state.activeConversationId
    };
  }),
  
  setActiveConversation: (conversationId) => set({
    activeConversationId: conversationId
  }),
  
  detectLanguageFromMessage: async (conversationId, messageText) => {
    try {
      // Détecter la langue du message
      const langResult = await detectLanguage(messageText);
      
      // Mettre à jour le store de langue
      useLanguageStore.getState().setDetectionResult(langResult, conversationId);
      
      // Mettre à jour la langue de la conversation
      set((state) => {
        const updatedConversations = state.conversations.map(conv => {
          if (conv.id === conversationId) {
            return {
              ...conv,
              language: langResult.lang
            };
          }
          return conv;
        });
        
        return { conversations: updatedConversations };
      });
    } catch (error) {
      console.error('Erreur lors de la détection de langue:', error);
    }
  },
  
  updateSlaStatus: () => set((state) => {
    const now = new Date();
    const updatedConversations = state.conversations.map(conv => {
      if (conv.status === 'resolved') {
        return conv;
      }
      
      // Calculer le temps d'attente en minutes
      const waitTime = (now.getTime() - conv.lastActivity.getTime()) / (1000 * 60);
      
      let slaStatus = 'normal';
      if (conv.status === 'open' || conv.status === 'escalated') {
        if (waitTime > 10) slaStatus = 'critical';
        else if (waitTime > 5) slaStatus = 'warning';
      } else if (conv.status === 'active') {
        if (waitTime > 20) slaStatus = 'warning';
        if (waitTime > 30) slaStatus = 'critical';
      }
      
      return {
        ...conv,
        slaStatus: slaStatus as 'normal' | 'warning' | 'critical'
      };
    });
    
    return { conversations: updatedConversations };
  }),
  
  updateConversationStatus: (conversationId, status) => set((state) => {
    const now = new Date();
    
    const updatedConversations = state.conversations.map(conv => {
      if (conv.id === conversationId) {
        // Mettre à jour les métriques selon le changement de statut
        const updatedMetrics = { ...conv.metrics };
        
        // Si la conversation passe à 'escalated', enregistrer le moment de l'escalade
        const escalatedAt = status === 'escalated' ? now : conv.escalatedAt;
        
        return {
          ...conv,
          status,
          escalatedAt,
          lastActivity: now,
          metrics: updatedMetrics
        };
      }
      return conv;
    });
    
    return { conversations: updatedConversations };
  }),
  
  updateConnectionStatus: (isConnected) => set({
    isConnected
  }),
  
  updateCsatScore: (conversationId, score) => set((state) => {
    const updatedConversations = state.conversations.map(conv => {
      if (conv.id === conversationId) {
        return {
          ...conv,
          metrics: {
            ...conv.metrics,
            csatScore: score
          }
        };
      }
      return conv;
    });
    
    return { conversations: updatedConversations };
  })
}));
