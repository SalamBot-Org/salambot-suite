/**
 * @file        Composant de file d'attente des conversations pour l'Agent Desk SalamBot.
 * @author      SalamBot Team (contact: salam@chebakia.com)
 * @created     2025-05-21
 * @updated     2025-05-21
 * @project     SalamBot - AI CRM for Moroccan SMEs
 */
import { useState, useEffect } from 'react';
import { useConversationStore } from '../store/conversationStore';
import { useLanguageStore } from '../store/languageStore';
import LanguageIndicator from './LanguageIndicator';
export default function ConversationQueue() {
    const { conversations, takeOverConversation, setActiveConversation, updateSlaStatus } = useConversationStore();
    const { currentLanguage } = useLanguageStore();
    const [agentId, setAgentId] = useState('agent-001'); // Simulé pour la démo
    // Mettre à jour le statut SLA toutes les 30 secondes
    useEffect(() => {
        const interval = setInterval(() => {
            updateSlaStatus();
        }, 30000);
        return () => clearInterval(interval);
    }, [updateSlaStatus]);
    // Filtrer les conversations en attente
    const waitingConversations = conversations.filter(conv => conv.status === 'waiting');
    // Obtenir le texte selon la langue actuelle
    const getText = (fr, ar, darija) => {
        switch (currentLanguage) {
            case 'fr': return fr;
            case 'ar': return ar;
            case 'ar-ma': return darija;
            default: return fr;
        }
    };
    // Formater le temps d'attente
    const formatWaitTime = (conversation) => {
        const waitTime = Math.floor((new Date().getTime() - conversation.lastActivity.getTime()) / (1000 * 60));
        return getText(`${waitTime} min`, `${waitTime} دقيقة`, `${waitTime} دقيقة`);
    };
    // Gérer la prise en charge d'une conversation
    const handleTakeOver = (conversationId) => {
        takeOverConversation(conversationId, agentId);
        setActiveConversation(conversationId);
    };
    return (<div className="bg-white rounded-lg shadow-md p-4">
      <h2 className="text-lg font-semibold mb-4" dir={currentLanguage === 'ar' || currentLanguage === 'ar-ma' ? 'rtl' : 'ltr'}>
        {getText('File d\'attente', 'قائمة الانتظار', 'لائحة الانتظار')}
        {waitingConversations.length > 0 && (<span className="ml-2 bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
            {waitingConversations.length}
          </span>)}
      </h2>
      
      {waitingConversations.length === 0 ? (<div className="text-center py-8 text-gray-500" dir={currentLanguage === 'ar' || currentLanguage === 'ar-ma' ? 'rtl' : 'ltr'}>
          {getText('Aucune conversation en attente', 'لا توجد محادثات في الانتظار', 'ما كاين حتى محادثة فالانتظار')}
        </div>) : (<div className="space-y-3">
          {waitingConversations.map(conversation => (<div key={conversation.id} className={`border rounded-lg p-3 flex justify-between items-center ${conversation.slaStatus === 'critical' ? 'border-red-500 bg-red-50' :
                    conversation.slaStatus === 'warning' ? 'border-yellow-500 bg-yellow-50' :
                        'border-gray-200'}`} dir={currentLanguage === 'ar' || currentLanguage === 'ar-ma' ? 'rtl' : 'ltr'}>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium">{conversation.customer.name}</span>
                  <LanguageIndicator size="sm" showSource={false}/>
                  <span className="text-xs text-gray-500">
                    {conversation.customer.channel === 'whatsapp' ? 'WhatsApp' :
                    conversation.customer.channel === 'web' ? 'Web' : 'Voice'}
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  {getText(`En attente depuis: ${formatWaitTime(conversation)}`, `في الانتظار منذ: ${formatWaitTime(conversation)}`, `فالانتظار من: ${formatWaitTime(conversation)}`)}
                </div>
              </div>
              
              <button onClick={() => handleTakeOver(conversation.id)} className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm">
                {getText('Prendre en charge', 'استلام', 'خود المحادثة')}
              </button>
            </div>))}
        </div>)}
    </div>);
}
//# sourceMappingURL=ConversationQueue.js.map