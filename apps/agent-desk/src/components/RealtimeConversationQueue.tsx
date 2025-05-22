/**
 * @file        Composant de file d'attente temps réel pour l'Agent Desk SalamBot.
 * @author      SalamBot Team (contact: salam@chebakia.com)
 * @created     2025-05-21
 * @updated     2025-05-21
 * @project     SalamBot - AI CRM for Moroccan SMEs
 */

import { useState, useEffect } from 'react';
import { useConversationStore, Conversation } from '../store/conversationStore';
import { useLanguageStore } from '../store/languageStore';
import { useWebSocketService, DEFAULT_WS_CONFIG } from '../services/websocketService';
import LanguageIndicator from './LanguageIndicator';

export default function RealtimeConversationQueue() {
  const { conversations, takeOverConversation, setActiveConversation, updateSlaStatus, isConnected: storeConnected } = useConversationStore();
  const { currentLanguage } = useLanguageStore();
  const [agentId, setAgentId] = useState('agent-001'); // Simulé pour la démo
  const [notificationSound] = useState(new Audio('/notification.mp3'));
  
  // Connexion WebSocket
  const { isConnected: wsConnected, sendMessage } = useWebSocketService(DEFAULT_WS_CONFIG);
  
  // Mettre à jour le statut de connexion dans le store
  useEffect(() => {
    useConversationStore.getState().updateConnectionStatus(wsConnected);
  }, [wsConnected]);
  
  // Mettre à jour le statut SLA toutes les 30 secondes
  useEffect(() => {
    const interval = setInterval(() => {
      updateSlaStatus();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [updateSlaStatus]);
  
  // Jouer un son de notification quand une nouvelle conversation arrive
  useEffect(() => {
    const handleNewConversation = () => {
      notificationSound.play().catch(err => console.error('Erreur lors de la lecture du son:', err));
    };
    
    // Simuler une nouvelle conversation pour la démo
    const timer = setTimeout(() => {
      handleNewConversation();
    }, 5000);
    
    return () => clearTimeout(timer);
  }, [notificationSound]);
  
  // Filtrer les conversations en attente ou escaladées
  const pendingConversations = conversations.filter(conv => 
    conv.status === 'open' || conv.status === 'escalated'
  );
  
  // Obtenir le texte selon la langue actuelle
  const getText = (fr: string, ar: string, darija: string) => {
    switch (currentLanguage) {
      case 'fr': return fr;
      case 'ar': return ar;
      case 'ar-ma': return darija;
      default: return fr;
    }
  };
  
  // Formater le temps d'attente
  const formatWaitTime = (conversation: Conversation) => {
    const waitTime = Math.floor((new Date().getTime() - conversation.lastActivity.getTime()) / (1000 * 60));
    
    return getText(
      `${waitTime} min`,
      `${waitTime} دقيقة`,
      `${waitTime} دقيقة`
    );
  };
  
  // Gérer la prise en charge d'une conversation
  const handleTakeOver = (conversationId: string) => {
    takeOverConversation(conversationId, agentId);
    setActiveConversation(conversationId);
    
    // Notifier le serveur via WebSocket
    sendMessage({
      type: 'agent_status_changed',
      data: {
        agentId,
        conversationId,
        status: 'active'
      }
    });
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold" dir={currentLanguage === 'ar' || currentLanguage === 'ar-ma' ? 'rtl' : 'ltr'}>
          {getText(
            'File d\'attente',
            'قائمة الانتظار',
            'لائحة الانتظار'
          )}
          {pendingConversations.length > 0 && (
            <span className="ml-2 bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
              {pendingConversations.length}
            </span>
          )}
        </h2>
        
        <div className={`flex items-center px-2 py-1 rounded-full text-xs ${wsConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          <span className={`w-2 h-2 rounded-full mr-1 ${wsConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
          {wsConnected ? 
            getText('Connecté', 'متصل', 'متصل') : 
            getText('Déconnecté', 'غير متصل', 'مقطوع')
          }
        </div>
      </div>
      
      {pendingConversations.length === 0 ? (
        <div className="text-center py-8 text-gray-500" dir={currentLanguage === 'ar' || currentLanguage === 'ar-ma' ? 'rtl' : 'ltr'}>
          {getText(
            'Aucune conversation en attente',
            'لا توجد محادثات في الانتظار',
            'ما كاين حتى محادثة فالانتظار'
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {pendingConversations.map(conversation => (
            <div 
              key={conversation.id}
              className={`border rounded-lg p-3 flex justify-between items-center ${
                conversation.status === 'escalated' ? 'border-purple-500 bg-purple-50' :
                conversation.slaStatus === 'critical' ? 'border-red-500 bg-red-50' :
                conversation.slaStatus === 'warning' ? 'border-yellow-500 bg-yellow-50' :
                'border-gray-200'
              } ${conversation.source === 'realtime' ? 'animate-pulse' : ''}`}
              dir={currentLanguage === 'ar' || currentLanguage === 'ar-ma' ? 'rtl' : 'ltr'}
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium">{conversation.customer.name}</span>
                  <LanguageIndicator size="sm" showSource={false} />
                  <span className={`text-xs ${
                    conversation.status === 'escalated' ? 'bg-purple-100 text-purple-800' : 'text-gray-500'
                  } px-2 py-0.5 rounded-full`}>
                    {conversation.status === 'escalated' ? 
                      getText('Escaladé', 'تصعيد', 'تصعيد') : 
                      conversation.customer.channel === 'whatsapp' ? 'WhatsApp' : 
                      conversation.customer.channel === 'web' ? 'Web' : 'Voice'
                    }
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  {getText(
                    `En attente depuis: ${formatWaitTime(conversation)}`,
                    `في الانتظار منذ: ${formatWaitTime(conversation)}`,
                    `فالانتظار من: ${formatWaitTime(conversation)}`
                  )}
                </div>
              </div>
              
              <button
                onClick={() => handleTakeOver(conversation.id)}
                className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
              >
                {getText(
                  'Prendre en charge',
                  'استلام',
                  'خود المحادثة'
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
