/**
 * @file        Page d'historique des conversations pour l'Agent Desk.
 * @author      SalamBot Team (contact: info@salambot.ma)
 * @created     2025-05-22
 * @updated     2025-05-22
 * @project     SalamBot - AI CRM for Moroccan SMEs
 */

import { useState } from 'react';
import { useLanguageStore } from '../store/languageStore';
import ConversationList from '../components/ConversationList';
import ConversationDetails from '../components/ConversationDetails';
import { trace } from '@opentelemetry/api';

// Tracer pour le composant Agent Desk
const tracer = trace.getTracer('salambot.agent-desk');

const HistoryPage = () => {
  // Accès au store
  const { currentLanguage } = useLanguageStore();
  
  // État local
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  
  // Gestionnaire de sélection de conversation
  const handleSelectConversation = (conversationId: string) => {
    const span = tracer.startSpan('agent.history.load');
    span.setAttribute('conversation.id', conversationId);
    
    setSelectedConversationId(conversationId);
    
    span.end();
  };
  
  // Gestionnaire de retour à la liste
  const handleBackToList = () => {
    setSelectedConversationId(null);
  };
  
  // Obtenir le texte selon la langue actuelle
  const getText = (fr: string, ar: string, darija: string) => {
    switch (currentLanguage) {
      case 'fr': return fr;
      case 'ar': return ar;
      case 'ar-ma': return darija;
      default: return fr;
    }
  };
  
  return (
    <div className={`min-h-screen bg-gray-100 ${currentLanguage === 'ar' || currentLanguage === 'ar-ma' ? 'rtl' : 'ltr'}`}>
      <header className="bg-white shadow-sm p-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold">
            {getText(
              'Historique des conversations',
              'سجل المحادثات',
              'سجل المحادثات'
            )}
          </h1>
        </div>
      </header>
      
      <main className="container mx-auto py-6 px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Liste des conversations (visible uniquement sur desktop ou quand aucune conversation n'est sélectionnée) */}
          <div className={`md:col-span-1 ${selectedConversationId ? 'hidden md:block' : ''}`}>
            <ConversationList onSelectConversation={handleSelectConversation} />
          </div>
          
          {/* Détails de la conversation (plein écran sur mobile quand une conversation est sélectionnée) */}
          <div className={`${selectedConversationId ? 'col-span-1 md:col-span-2' : 'hidden md:block md:col-span-2'} h-[600px]`}>
            <ConversationDetails 
              conversationId={selectedConversationId} 
              onBack={handleBackToList}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default HistoryPage;
