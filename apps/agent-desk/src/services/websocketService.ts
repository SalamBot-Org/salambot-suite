/**
 * @file        Service de connexion temps réel WebSocket pour l'Agent Desk SalamBot.
 * @author      SalamBot Team (contact: salam@chebakia.com)
 * @created     2025-05-21
 * @updated     2025-05-21
 * @project     SalamBot - AI CRM for Moroccan SMEs
 */

import { useEffect, useRef, useState } from 'react';
import { useConversationStore } from '../store/conversationStore';

// Types pour les événements WebSocket
export type WebSocketEvent = 
  | { type: 'new_conversation'; data: any }
  | { type: 'message_received'; data: any }
  | { type: 'conversation_escalated'; data: any }
  | { type: 'agent_status_changed'; data: any }
  | { type: 'connection_status'; data: { connected: boolean } };

// Configuration du service WebSocket
interface WebSocketConfig {
  url: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

// Hook personnalisé pour la gestion de la connexion WebSocket
export function useWebSocketService(config: WebSocketConfig) {
  const { url, reconnectInterval = 3000, maxReconnectAttempts = 5 } = config;
  
  const socket = useRef<WebSocket | null>(null);
  const reconnectCount = useRef(0);
  const [isConnected, setIsConnected] = useState(false);
  
  const { addConversation, addMessage, updateConversationStatus } = useConversationStore();
  
  // Fonction pour envoyer un message via WebSocket
  const sendMessage = (event: WebSocketEvent) => {
    if (socket.current && socket.current.readyState === WebSocket.OPEN) {
      socket.current.send(JSON.stringify(event));
      return true;
    }
    return false;
  };
  
  // Fonction pour se connecter au serveur WebSocket
  const connect = () => {
    try {
      socket.current = new WebSocket(url);
      
      socket.current.onopen = () => {
        console.log('WebSocket connection established');
        setIsConnected(true);
        reconnectCount.current = 0;
        
        // Notifier le store de la connexion
        sendMessage({
          type: 'connection_status',
          data: { connected: true }
        });
      };
      
      socket.current.onclose = (event) => {
        console.log(`WebSocket connection closed: ${event.code} ${event.reason}`);
        setIsConnected(false);
        
        // Tentative de reconnexion
        if (reconnectCount.current < maxReconnectAttempts) {
          setTimeout(() => {
            reconnectCount.current += 1;
            connect();
          }, reconnectInterval);
        }
      };
      
      socket.current.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
      
      socket.current.onmessage = (event) => {
        try {
          const wsEvent = JSON.parse(event.data) as WebSocketEvent;
          handleWebSocketEvent(wsEvent);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
    } catch (error) {
      console.error('Error connecting to WebSocket:', error);
    }
  };
  
  // Fonction pour gérer les événements WebSocket reçus
  const handleWebSocketEvent = (event: WebSocketEvent) => {
    switch (event.type) {
      case 'new_conversation':
        // Ajouter une nouvelle conversation
        addConversation(event.data);
        break;
        
      case 'message_received':
        // Ajouter un nouveau message à une conversation existante
        addMessage(event.data.conversationId, event.data.message);
        break;
        
      case 'conversation_escalated':
        // Mettre à jour le statut d'une conversation
        updateConversationStatus(event.data.conversationId, 'escalated');
        break;
        
      case 'agent_status_changed':
        // Gérer le changement de statut d'un agent
        // Implémentation à venir
        break;
        
      default:
        console.warn('Unknown WebSocket event type:', event.type);
    }
  };
  
  // Connexion et nettoyage
  useEffect(() => {
    connect();
    
    return () => {
      if (socket.current) {
        socket.current.close();
      }
    };
  }, [url]);
  
  return {
    isConnected,
    sendMessage
  };
}

// Configuration par défaut pour le service WebSocket
export const DEFAULT_WS_CONFIG: WebSocketConfig = {
  url: 'wss://api.salambot.ma/agent-desk/ws',
  reconnectInterval: 3000,
  maxReconnectAttempts: 5
};
