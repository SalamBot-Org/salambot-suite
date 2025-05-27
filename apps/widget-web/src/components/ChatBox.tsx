/**
 * @file        Composant de chat box pour le widget web SalamBot
 * @author      SalamBot Team (contact: info@salambot.ma)
 * @created     2025-05-26
 * @updated     2025-05-26
 * @project     SalamBot - AI CRM for Moroccan SMEs
 */

import React, { useState, useRef, useEffect } from 'react';
import styles from './ChatBox.module.css';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

export const ChatBox: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Effet pour faire défiler vers le bas à chaque nouveau message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Fonction pour envoyer un message
  const sendMessage = async () => {
    if (!inputValue.trim()) return;
    
    // Générer un ID unique pour le message
    const messageId = Date.now().toString();
    
    // Ajouter le message de l'utilisateur
    const userMessage: Message = {
      id: messageId,
      text: inputValue,
      sender: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    
    try {
      // Appel à l'API mock (à remplacer par l'API réelle plus tard)
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: inputValue }),
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors de la communication avec le serveur');
      }
      
      const data = await response.json();
      
      // Ajouter la réponse du bot
      const botMessage: Message = {
        id: Date.now().toString(),
        text: data.reply || 'Désolé, je n&apos;ai pas compris votre message.',
        sender: 'bot',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Erreur:', error);
      
      // Message d'erreur en cas d'échec
      const errorMessage: Message = {
        id: Date.now().toString(),
        text: 'Désolé, une erreur est survenue. Veuillez réessayer plus tard.',
        sender: 'bot',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Gérer la soumission du formulaire
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage();
  };

  return (
    <div className={styles.chatContainer}>
      <div className={styles.chatHeader}>
        <h2>SalamBot</h2>
        <p>Assistant virtuel pour PME</p>
      </div>
      
      <div className={styles.messagesContainer}>
        {messages.length === 0 ? (
          <div className={styles.emptyState}>
            <p>Bonjour ! Comment puis-je vous aider aujourd&apos;hui ?</p>
          </div>
        ) : (
          messages.map(message => (
            <div 
              key={message.id} 
              className={`${styles.message} ${message.sender === 'user' ? styles.userMessage : styles.botMessage}`}
            >
              <div className={styles.messageContent}>
                <p>{message.text}</p>
                <span className={styles.timestamp}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className={`${styles.message} ${styles.botMessage}`}>
            <div className={styles.loadingIndicator}>
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <form onSubmit={handleSubmit} className={styles.inputContainer}>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Écrivez votre message..."
          disabled={isLoading}
          className={styles.messageInput}
        />
        <button 
          type="submit" 
          disabled={isLoading || !inputValue.trim()} 
          className={styles.sendButton}
        >
          Envoyer
        </button>
      </form>
    </div>
  );
};

export default ChatBox;
