/**
 * @file        Composant d'affichage détaillé d'une conversation avec historique des messages.
 * @author      SalamBot Team (contact: info@salambot.ma)
 * @created     2025-05-22
 * @updated     2025-05-22
 * @project     SalamBot - AI CRM for Moroccan SMEs
 */

import { useState, useEffect, useRef } from 'react';
import { useConversationStore, Message } from '../store/conversationStore';
import { useLanguageStore } from '../store/languageStore';
import { trace } from '@opentelemetry/api';

// Tracer pour le composant Agent Desk
const tracer = trace.getTracer('salambot.agent-desk');

// Props du composant
interface ConversationDetailsProps {
  conversationId: string | null;
  onBack?: () => void;
}

const ConversationDetails = ({ conversationId, onBack }: ConversationDetailsProps) => {
  // Accès au store
  const { conversations } = useConversationStore();
  const { currentLanguage } = useLanguageStore();
  
  // État local
  const [conversation, setConversation] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Effet pour charger la conversation
  useEffect(() => {
    if (!conversationId) {
      setConversation(null);
      return;
    }
    
    const span = tracer.startSpan('agent.history.view');
    span.setAttribute('conversation.id', conversationId);
    
    try {
      // Trouver la conversation
      const foundConversation = conversations.find(conv => conv.id === conversationId);
      
      if (foundConversation) {
        setConversation(foundConversation);
        span.setAttribute('conversation.found', true);
        span.setAttribute('conversation.messages_count', foundConversation.messages.length);
        span.setAttribute('conversation.language', foundConversation.language);
        span.setAttribute('conversation.channel', foundConversation.customer.channel);
        span.setAttribute('conversation.status', foundConversation.status);
      } else {
        setConversation(null);
        span.setAttribute('conversation.found', false);
      }
    } catch (error) {
      span.setAttribute('error', true);
      span.setAttribute('error.message', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      span.end();
    }
  }, [conversationId, conversations]);
  
  // Effet pour scroller vers le bas quand les messages changent
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversation?.messages]);
  
  // Obtenir le texte selon la langue actuelle
  const getText = (fr: string, ar: string, darija: string) => {
    switch (currentLanguage) {
      case 'fr': return fr;
      case 'ar': return ar;
      case 'ar-ma': return darija;
      default: return fr;
    }
  };
  
  // Formater la date
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat(
      currentLanguage === 'fr' ? 'fr-FR' : 'ar-MA',
      { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
      }
    ).format(date);
  };
  
  // Obtenir l'icône du canal
  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'web': return '🌐';
      case 'whatsapp': return '📱';
      case 'voice': return '🔊';
      default: return '📩';
    }
  };
  
  // Obtenir l'icône de la langue
  const getLanguageIcon = (language: string) => {
    switch (language) {
      case 'fr': return '🇫🇷';
      case 'ar': return '🇸🇦';
      case 'ar-ma': return '🇲🇦';
      default: return '🌍';
    }
  };
  
  // Obtenir la couleur du statut
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800';
      case 'active': return 'bg-green-100 text-green-800';
      case 'escalated': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Obtenir le texte du statut
  const getStatusText = (status: string) => {
    switch (status) {
      case 'open':
        return getText('Ouvert', 'مفتوح', 'مفتوح');
      case 'active':
        return getText('Actif', 'نشط', 'نشط');
      case 'escalated':
        return getText('Escaladé', 'مُصعَّد', 'مُصعَّد');
      case 'resolved':
        return getText('Résolu', 'محلول', 'محلول');
      default:
        return status;
    }
  };
  
  // Obtenir la classe CSS pour la bulle de message
  const getMessageBubbleClass = (sender: string) => {
    switch (sender) {
      case 'user':
        return 'bg-blue-50 text-blue-900 border-blue-200';
      case 'bot':
        return 'bg-gray-50 text-gray-900 border-gray-200';
      case 'agent':
        return 'bg-green-50 text-green-900 border-green-200';
      default:
        return 'bg-gray-50 text-gray-900 border-gray-200';
    }
  };
  
  // Obtenir le nom de l'émetteur
  const getSenderName = (sender: string) => {
    switch (sender) {
      case 'user':
        return conversation?.customer?.name || getText('Utilisateur', 'المستخدم', 'المستخدم');
      case 'bot':
        return 'SalamBot';
      case 'agent':
        return getText('Agent', 'الوكيل', 'الوكيل');
      default:
        return sender;
    }
  };
  
  // Si aucune conversation n'est sélectionnée
  if (!conversation) {
    return (
      <div className="bg-white rounded-lg shadow h-full flex items-center justify-center p-8">
        <div className="text-center text-gray-500">
          <p className="text-xl mb-4">
            {getText(
              'Sélectionnez une conversation pour voir les détails',
              'اختر محادثة لعرض التفاصيل',
              'ختار محادثة باش تشوف التفاصيل'
            )}
          </p>
          <p className="text-sm">
            {getText(
              'Vous pourrez voir l\'historique complet des messages',
              'ستتمكن من رؤية السجل الكامل للرسائل',
              'غادي تقدر تشوف التاريخ الكامل ديال الرسائل'
            )}
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow h-full flex flex-col">
      {/* En-tête avec informations sur la conversation */}
      <div className="p-4 border-b flex justify-between items-center">
        <div className="flex items-center">
          {onBack && (
            <button 
              onClick={onBack}
              className="mr-3 p-1 rounded-full hover:bg-gray-100"
              aria-label={getText('Retour', 'رجوع', 'رجوع')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
            </button>
          )}
          
          <div>
            <div className="flex items-center">
              <span className="mr-2 text-lg">{getChannelIcon(conversation.customer.channel)}</span>
              <span className="mr-2 text-lg">{getLanguageIcon(conversation.language)}</span>
              <h2 className="text-lg font-semibold">{conversation.customer.name}</h2>
            </div>
            <div className="text-sm text-gray-500">
              {getText('Conversation démarrée le', 'بدأت المحادثة في', 'بدات المحادثة ف')} {formatDate(conversation.messages[0]?.timestamp || conversation.lastActivity)}
            </div>
          </div>
        </div>
        
        <div className={`px-3 py-1 rounded-full text-sm ${getStatusColor(conversation.status)}`}>
          {getStatusText(conversation.status)}
        </div>
      </div>
      
      {/* Métriques de la conversation */}
      <div className="p-4 border-b grid grid-cols-4 gap-4 text-center">
        <div>
          <div className="text-sm text-gray-500">
            {getText('Messages', 'الرسائل', 'الرسائل')}
          </div>
          <div className="font-semibold">
            {conversation.messages.length}
          </div>
        </div>
        
        <div>
          <div className="text-sm text-gray-500">
            {getText('Durée', 'المدة', 'المدة')}
          </div>
          <div className="font-semibold">
            {conversation.metrics?.resolutionTime ? (
              new Intl.DateTimeFormat('fr-FR', { 
                minute: 'numeric', 
                second: 'numeric' 
              }).format(new Date(conversation.metrics.resolutionTime))
            ) : (
              '-'
            )}
          </div>
        </div>
        
        <div>
          <div className="text-sm text-gray-500">
            {getText('Temps de réponse', 'وقت الرد', 'وقت الرد')}
          </div>
          <div className="font-semibold">
            {conversation.metrics?.avgResponseTime ? (
              `${Math.round(conversation.metrics.avgResponseTime / 1000)}s`
            ) : (
              '-'
            )}
          </div>
        </div>
        
        <div>
          <div className="text-sm text-gray-500">
            {getText('Satisfaction', 'الرضا', 'الرضا')}
          </div>
          <div className="font-semibold">
            {conversation.metrics?.csatScore ? (
              `${conversation.metrics.csatScore}/5`
            ) : (
              '-'
            )}
          </div>
        </div>
      </div>
      
      {/* Liste des messages */}
      <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
        <div className="space-y-4">
          {conversation.messages.map((message: Message, index: number) => (
            <div 
              key={message.id || index}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`max-w-[80%] p-3 rounded-lg border ${getMessageBubbleClass(message.sender)}`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium text-sm">
                    {getSenderName(message.sender)}
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatDate(message.timestamp)}
                  </span>
                </div>
                <div className="whitespace-pre-wrap">{message.text}</div>
                
                {/* Métadonnées du message (si disponibles) */}
                {message.language && (
                  <div className="mt-1 text-xs text-gray-500 flex items-center">
                    <span className="mr-1">{getLanguageIcon(message.language)}</span>
                    <span>
                      {message.language === 'fr' ? 'Français' : 
                       message.language === 'ar' ? 'Arabe' : 
                       message.language === 'ar-ma' ? 'Darija' : message.language}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>
    </div>
  );
};

export default ConversationDetails;
