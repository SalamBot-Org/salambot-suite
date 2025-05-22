/**
 * @file        Composant de conversation active pour l'Agent Desk SalamBot.
 * @author      SalamBot Team (contact: salam@chebakia.com)
 * @created     2025-05-21
 * @updated     2025-05-21
 * @project     SalamBot - AI CRM for Moroccan SMEs
 */
import { __awaiter } from "tslib";
import { useState, useRef, useEffect } from 'react';
import { useConversationStore } from '../store/conversationStore';
import { useLanguageStore } from '../store/languageStore';
import LanguageIndicator from './LanguageIndicator';
export default function ActiveConversation() {
    const { conversations, activeConversationId, addMessage, resolveConversation, detectLanguageFromMessage } = useConversationStore();
    const { currentLanguage } = useLanguageStore();
    const [inputText, setInputText] = useState('');
    const messagesEndRef = useRef(null);
    // Trouver la conversation active
    const activeConversation = conversations.find(conv => conv.id === activeConversationId);
    // Scroll automatique vers le bas lors de nouveaux messages
    useEffect(() => {
        var _a;
        (_a = messagesEndRef.current) === null || _a === void 0 ? void 0 : _a.scrollIntoView({ behavior: 'smooth' });
    }, [activeConversation === null || activeConversation === void 0 ? void 0 : activeConversation.messages]);
    // Obtenir le texte selon la langue actuelle
    const getText = (fr, ar, darija) => {
        switch (currentLanguage) {
            case 'fr': return fr;
            case 'ar': return ar;
            case 'ar-ma': return darija;
            default: return fr;
        }
    };
    // Gérer l'envoi d'un message
    const handleSendMessage = () => __awaiter(this, void 0, void 0, function* () {
        if (!inputText.trim() || !activeConversationId)
            return;
        // Créer le message agent
        const agentMessage = {
            id: `msg-${Date.now()}`,
            text: inputText,
            sender: 'agent',
            timestamp: new Date(),
            language: currentLanguage
        };
        // Ajouter le message à la conversation
        addMessage(activeConversationId, agentMessage);
        setInputText('');
        // Détecter la langue du message pour mise à jour des statistiques
        yield detectLanguageFromMessage(activeConversationId, inputText);
    });
    // Gérer la résolution de la conversation
    const handleResolveConversation = () => {
        if (activeConversationId) {
            resolveConversation(activeConversationId);
        }
    };
    // Si aucune conversation active
    if (!activeConversation) {
        return (<div className="bg-white rounded-lg shadow-md p-8 text-center text-gray-500">
        {getText('Sélectionnez une conversation pour commencer', 'اختر محادثة للبدء', 'ختار محادثة باش تبدا')}
      </div>);
    }
    return (<div className="bg-white rounded-lg shadow-md flex flex-col h-full">
      {/* En-tête de la conversation */}
      <div className="border-b p-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <span className="font-medium">{activeConversation.customer.name}</span>
          <LanguageIndicator size="sm"/>
          <span className="text-xs text-gray-500">
            {activeConversation.customer.channel === 'whatsapp' ? 'WhatsApp' :
            activeConversation.customer.channel === 'web' ? 'Web' : 'Voice'}
          </span>
        </div>
        
        <button onClick={handleResolveConversation} className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm">
          {getText('Résoudre', 'إنهاء', 'حل المشكل')}
        </button>
      </div>
      
      {/* Zone des messages */}
      <div className="flex-1 p-4 overflow-y-auto">
        {activeConversation.messages.map(message => (<div key={message.id} className={`mb-4 ${message.sender === 'user' ? 'text-left' : 'text-right'}`}>
            <div className="flex items-center mb-1">
              <span className="text-xs text-gray-500">
                {message.sender === 'user' ? activeConversation.customer.name :
                message.sender === 'bot' ? 'SalamBot' : 'Agent'}
              </span>
            </div>
            <div className={`inline-block px-4 py-2 rounded-lg ${message.sender === 'user'
                ? 'bg-gray-200 text-gray-800'
                : message.sender === 'bot'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-blue-500 text-white'}`} dir={message.language === 'ar' || message.language === 'ar-ma' ? 'rtl' : 'ltr'}>
              {message.text}
            </div>
          </div>))}
        <div ref={messagesEndRef}/>
      </div>
      
      {/* Zone de saisie */}
      <div className="border-t p-4 flex">
        <input type="text" value={inputText} onChange={(e) => setInputText(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()} placeholder={getText('Tapez votre message...', 'اكتب رسالتك...', 'كتب الرسالة ديالك...')} className="flex-1 border rounded-l-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" dir={currentLanguage === 'ar' || currentLanguage === 'ar-ma' ? 'rtl' : 'ltr'}/>
        <button onClick={handleSendMessage} disabled={!inputText.trim()} className="bg-blue-600 text-white px-4 py-2 rounded-r-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-blue-300">
          {getText('Envoyer', 'إرسال', 'صيفط')}
        </button>
      </div>
    </div>);
}
//# sourceMappingURL=ActiveConversation.js.map