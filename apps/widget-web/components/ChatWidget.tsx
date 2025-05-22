/**
 * @file        Composant principal du widget de chat SalamBot avec détection de langue.
 * @author      SalamBot Team (contact: salam@chebakia.com)
 * @created     2025-05-21
 * @updated     2025-05-21
 * @project     SalamBot - AI CRM for Moroccan SMEs
 */

import { useState, useRef, useEffect } from 'react';
import { detectLanguage } from '../utils/lang-detect-mock';
import { useLanguageStore } from '../store/languageStore';

// Type pour les messages
interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

export default function ChatWidget() {
  // État local
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Référence pour le scroll automatique
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Store global pour la langue
  const { setDetectionResult, currentLanguage } = useLanguageStore();
  
  // Scroll automatique vers le bas lors de nouveaux messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Fonction pour envoyer un message
  const handleSendMessage = async () => {
    if (!inputText.trim() || isProcessing) return;
    
    // Créer le message utilisateur
    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      text: inputText,
      sender: 'user',
      timestamp: new Date()
    };
    
    // Ajouter le message à la liste
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsProcessing(true);
    
    try {
      // Détecter la langue du message
      const langResult = await detectLanguage(inputText);
      
      // Mettre à jour le store global avec le résultat de détection
      setDetectionResult(langResult);
      
      // Simuler une réponse du bot
      setTimeout(() => {
        const botResponse = getBotResponse(inputText, langResult.lang);
        
        const botMessage: Message = {
          id: `msg-${Date.now()}`,
          text: botResponse,
          sender: 'bot',
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, botMessage]);
        setIsProcessing(false);
      }, 1000);
      
    } catch (error) {
      setIsProcessing(false);
    }
  };
  
  // Fonction pour générer une réponse du bot selon la langue détectée
  const getBotResponse = (text: string, lang: string): string => {
    switch (lang) {
      case 'fr':
        return 'Merci pour votre message. Comment puis-je vous aider aujourd\'hui ?';
      case 'ar':
        return 'شكرا على رسالتك. كيف يمكنني مساعدتك اليوم؟';
      case 'ar-ma':
        return 'شكرا على الرسالة ديالك. كيفاش نقدر نعاونك اليوم؟';
      default:
        return 'Thank you for your message. How can I help you today?';
    }
  };
  
  // Texte du placeholder selon la langue
  const getPlaceholderText = (): string => {
    switch (currentLanguage) {
      case 'fr':
        return 'Tapez votre message...';
      case 'ar':
        return 'اكتب رسالتك...';
      case 'ar-ma':
        return 'كتب الرسالة ديالك...';
      default:
        return 'Type your message...';
    }
  };
  
  // Texte du bouton selon la langue
  const getButtonText = (): string => {
    switch (currentLanguage) {
      case 'fr':
        return 'Envoyer';
      case 'ar':
        return 'إرسال';
      case 'ar-ma':
        return 'صيفط';
      default:
        return 'Send';
    }
  };
  
  return (
    <>
      {/* Zone des messages */}
      <div className="flex-1 p-4 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            {currentLanguage === 'fr' && 'Commencez une conversation...'}
            {currentLanguage === 'ar' && 'ابدأ محادثة...'}
            {currentLanguage === 'ar-ma' && 'بدا المحادثة...'}
            {currentLanguage === 'unknown' && 'Start a conversation...'}
          </div>
        ) : (
          messages.map(message => (
            <div 
              key={message.id} 
              className={`mb-4 ${message.sender === 'user' ? 'text-right' : 'text-left'}`}
            >
              <div 
                className={`inline-block px-4 py-2 rounded-lg ${
                  message.sender === 'user' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-200 text-gray-800'
                }`}
                dir={message.sender === 'bot' && (currentLanguage === 'ar' || currentLanguage === 'ar-ma') ? 'rtl' : 'ltr'}
              >
                {message.text}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Zone de saisie */}
      <div className="border-t p-4 flex">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder={getPlaceholderText()}
          className="flex-1 border rounded-l-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          dir={currentLanguage === 'ar' || currentLanguage === 'ar-ma' ? 'rtl' : 'ltr'}
          disabled={isProcessing}
        />
        <button
          onClick={handleSendMessage}
          disabled={!inputText.trim() || isProcessing}
          className="bg-blue-600 text-white px-4 py-2 rounded-r-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-blue-300"
        >
          {getButtonText()}
        </button>
      </div>
    </>
  );
}
