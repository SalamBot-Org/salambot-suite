/**
 * @file        Tests pour la connexion temps réel de l'Agent Desk SalamBot.
 * @author      SalamBot Team (contact: salam@chebakia.com)
 * @created     2025-05-21
 * @updated     2025-05-21
 * @project     SalamBot - AI CRM for Moroccan SMEs
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react-hooks';
import { useConversationStore } from '../src/store/conversationStore';
import { WebSocketEvent } from '../src/services/websocketService';

// Mock du WebSocket
class MockWebSocket {
  url: string;
  onopen: () => void;
  onclose: (event: any) => void;
  onerror: (error: any) => void;
  onmessage: (event: any) => void;
  readyState: number;
  
  constructor(url: string) {
    this.url = url;
    this.readyState = 1; // OPEN
  }
  
  send(data: string) {
    // Simuler l'envoi de données
    return true;
  }
  
  close() {
    // Simuler la fermeture de connexion
    if (this.onclose) {
      this.onclose({ code: 1000, reason: 'Normal closure' });
    }
  }
  
  // Méthode pour simuler la réception d'un message
  simulateMessage(data: WebSocketEvent) {
    if (this.onmessage) {
      this.onmessage({ data: JSON.stringify(data) });
    }
  }
  
  // Méthode pour simuler l'ouverture de connexion
  simulateOpen() {
    if (this.onopen) {
      this.onopen();
    }
  }
  
  // Méthode pour simuler une erreur
  simulateError(error: any) {
    if (this.onerror) {
      this.onerror(error);
    }
  }
}

// Mock global de WebSocket
global.WebSocket = MockWebSocket as any;

describe('Agent Desk - Connexion temps réel', () => {
  beforeEach(() => {
    // Réinitialiser le store avant chaque test
    const { result } = renderHook(() => useConversationStore());
    act(() => {
      result.current.conversations = [];
      result.current.activeConversationId = null;
      result.current.isConnected = false;
    });
  });
  
  it('devrait mettre à jour le store lors de la réception d\'une nouvelle conversation', () => {
    const { result } = renderHook(() => useConversationStore());
    
    // Simuler la réception d'une nouvelle conversation via WebSocket
    const mockConversation = {
      id: 'conv-ws-123',
      customer: {
        id: 'cust-ws-1',
        name: 'Marie Dupont',
        channel: 'web'
      },
      messages: [{
        id: 'msg-ws-1',
        text: 'Bonjour, j\'ai besoin d\'aide',
        sender: 'user',
        timestamp: new Date()
      }],
      status: 'escalated',
      language: 'fr',
      lastActivity: new Date(),
      slaStatus: 'normal',
      metrics: {
        messageCount: {
          user: 1,
          bot: 0,
          agent: 0
        }
      },
      source: 'realtime'
    };
    
    act(() => {
      result.current.addConversation(mockConversation);
    });
    
    // Vérifier que la conversation a été ajoutée au store
    expect(result.current.conversations).toHaveLength(1);
    expect(result.current.conversations[0].id).toBe('conv-ws-123');
    expect(result.current.conversations[0].status).toBe('escalated');
  });
  
  it('devrait mettre à jour les métriques lors de la résolution d\'une conversation', () => {
    const { result } = renderHook(() => useConversationStore());
    
    // Ajouter une conversation
    const mockConversation = {
      id: 'conv-metrics-123',
      customer: {
        id: 'cust-metrics-1',
        name: 'Jean Martin',
        channel: 'whatsapp'
      },
      messages: [{
        id: 'msg-metrics-1',
        text: 'Bonjour, j\'ai un problème',
        sender: 'user',
        timestamp: new Date(Date.now() - 10 * 60000) // 10 minutes ago
      }],
      status: 'active',
      language: 'fr',
      lastActivity: new Date(Date.now() - 5 * 60000), // 5 minutes ago
      slaStatus: 'normal',
      assignedAgent: 'agent-001',
      escalatedAt: new Date(Date.now() - 8 * 60000), // 8 minutes ago
      metrics: {
        messageCount: {
          user: 1,
          bot: 0,
          agent: 0
        }
      },
      source: 'realtime'
    };
    
    act(() => {
      result.current.addConversation(mockConversation);
    });
    
    // Résoudre la conversation
    act(() => {
      result.current.resolveConversation('conv-metrics-123');
    });
    
    // Vérifier que le statut et les métriques ont été mis à jour
    const resolvedConv = result.current.conversations.find(c => c.id === 'conv-metrics-123');
    expect(resolvedConv.status).toBe('resolved');
    expect(resolvedConv.metrics.resolutionTime).toBeDefined();
    expect(typeof resolvedConv.metrics.resolutionTime).toBe('number');
  });
  
  it('devrait mettre à jour le statut de connexion', () => {
    const { result } = renderHook(() => useConversationStore());
    
    // Vérifier l'état initial
    expect(result.current.isConnected).toBe(false);
    
    // Mettre à jour le statut de connexion
    act(() => {
      result.current.updateConnectionStatus(true);
    });
    
    // Vérifier que le statut a été mis à jour
    expect(result.current.isConnected).toBe(true);
  });
  
  it('devrait mettre à jour le score CSAT', () => {
    const { result } = renderHook(() => useConversationStore());
    
    // Ajouter une conversation
    const mockConversation = {
      id: 'conv-csat-123',
      customer: {
        id: 'cust-csat-1',
        name: 'Sophie Petit',
        channel: 'web'
      },
      messages: [],
      status: 'resolved',
      language: 'fr',
      lastActivity: new Date(),
      slaStatus: 'normal',
      metrics: {
        messageCount: {
          user: 0,
          bot: 0,
          agent: 0
        }
      },
      source: 'historical'
    };
    
    act(() => {
      result.current.addConversation(mockConversation);
    });
    
    // Mettre à jour le score CSAT
    act(() => {
      result.current.updateCsatScore('conv-csat-123', 4);
    });
    
    // Vérifier que le score a été mis à jour
    const updatedConv = result.current.conversations.find(c => c.id === 'conv-csat-123');
    expect(updatedConv.metrics.csatScore).toBe(4);
  });
});
