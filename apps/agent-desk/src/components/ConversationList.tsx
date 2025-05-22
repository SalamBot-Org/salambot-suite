/**
 * @file        Composant de liste des conversations avec pagination et filtres pour l'Agent Desk.
 * @author      SalamBot Team (contact: info@salambot.ma)
 * @created     2025-05-22
 * @updated     2025-05-22
 * @project     SalamBot - AI CRM for Moroccan SMEs
 */

import { useState, useEffect } from 'react';
import { useConversationStore, Conversation, ConversationStatus } from '../store/conversationStore';
import { useLanguageStore } from '../store/languageStore';
import { trace } from '@opentelemetry/api';

// Tracer pour le composant Agent Desk
const tracer = trace.getTracer('salambot.agent-desk');

// Types pour les filtres
interface ConversationFilters {
  status?: ConversationStatus | 'all';
  language?: 'fr' | 'ar' | 'ar-ma' | 'all';
  channel?: 'web' | 'whatsapp' | 'voice' | 'all';
  searchText?: string;
}

// Props du composant
interface ConversationListProps {
  onSelectConversation: (conversationId: string) => void;
  pageSize?: number;
}

const ConversationList = ({ onSelectConversation, pageSize = 10 }: ConversationListProps) => {
  // Accès au store
  const { conversations } = useConversationStore();
  const { currentLanguage } = useLanguageStore();
  
  // État local
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<ConversationFilters>({
    status: 'all',
    language: 'all',
    channel: 'all',
    searchText: ''
  });
  
  // Effet pour filtrer les conversations
  useEffect(() => {
    const span = tracer.startSpan('agent.history.filter');
    
    try {
      // Appliquer les filtres
      let filtered = [...conversations];
      
      // Filtre par statut
      if (filters.status && filters.status !== 'all') {
        filtered = filtered.filter(conv => conv.status === filters.status);
      }
      
      // Filtre par langue
      if (filters.language && filters.language !== 'all') {
        filtered = filtered.filter(conv => conv.language === filters.language);
      }
      
      // Filtre par canal
      if (filters.channel && filters.channel !== 'all') {
        filtered = filtered.filter(conv => conv.customer.channel === filters.channel);
      }
      
      // Filtre par texte de recherche
      if (filters.searchText) {
        const searchLower = filters.searchText.toLowerCase();
        filtered = filtered.filter(conv => {
          // Recherche dans les messages
          const hasMatchingMessage = conv.messages.some(msg => 
            msg.text.toLowerCase().includes(searchLower)
          );
          
          // Recherche dans le nom du client
          const hasMatchingCustomer = conv.customer.name.toLowerCase().includes(searchLower);
          
          return hasMatchingMessage || hasMatchingCustomer;
        });
      }
      
      // Trier par dernière activité (plus récent en premier)
      filtered.sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime());
      
      // Mettre à jour l'état
      setFilteredConversations(filtered);
      
      // Réinitialiser la page si nécessaire
      if (currentPage > Math.ceil(filtered.length / pageSize)) {
        setCurrentPage(1);
      }
      
      // Ajouter des attributs au span
      span.setAttribute('agent.history.filter.count', filtered.length);
      span.setAttribute('agent.history.filter.status', filters.status || 'all');
      span.setAttribute('agent.history.filter.language', filters.language || 'all');
      span.setAttribute('agent.history.filter.channel', filters.channel || 'all');
      span.setAttribute('agent.history.filter.hasSearch', !!filters.searchText);
    } catch (error) {
      // Ajouter l'erreur au span
      span.setAttribute('error', true);
      span.setAttribute('error.message', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      span.end();
    }
  }, [conversations, filters, pageSize, currentPage]);
  
  // Calculer les conversations à afficher pour la page actuelle
  const paginatedConversations = filteredConversations.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );
  
  // Nombre total de pages
  const totalPages = Math.ceil(filteredConversations.length / pageSize);
  
  // Gestionnaire de changement de filtre
  const handleFilterChange = (filterName: keyof ConversationFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
    setCurrentPage(1); // Réinitialiser à la première page
  };
  
  // Gestionnaire de recherche
  const handleSearch = (text: string) => {
    setFilters(prev => ({
      ...prev,
      searchText: text
    }));
    setCurrentPage(1); // Réinitialiser à la première page
  };
  
  // Gestionnaire de sélection de conversation
  const handleSelectConversation = (conversationId: string) => {
    const span = tracer.startSpan('agent.history.view');
    span.setAttribute('conversation.id', conversationId);
    
    onSelectConversation(conversationId);
    
    span.end();
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
  
  // Formater la durée
  const formatDuration = (startDate: Date, endDate: Date = new Date()) => {
    const diffMs = endDate.getTime() - startDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60) {
      return `${diffMins} ${getText('min', 'دقيقة', 'دقيقة')}`;
    } else {
      const hours = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      return `${hours}${getText('h', 'س', 'س')} ${mins}${getText('m', 'د', 'د')}`;
    }
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
  const getStatusColor = (status: ConversationStatus) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800';
      case 'active': return 'bg-green-100 text-green-800';
      case 'escalated': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Obtenir le texte du statut
  const getStatusText = (status: ConversationStatus) => {
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
  
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* En-tête avec titre et compteur */}
      <div className="p-4 border-b">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">
            {getText('Historique des conversations', 'سجل المحادثات', 'سجل المحادثات')}
          </h2>
          <span className="text-sm text-gray-500">
            {filteredConversations.length} {getText('conversations', 'محادثة', 'محادثة')}
          </span>
        </div>
      </div>
      
      {/* Barre de recherche */}
      <div className="p-4 border-b">
        <input
          type="text"
          placeholder={getText('Rechercher...', 'بحث...', 'بحث...')}
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={filters.searchText}
          onChange={(e) => handleSearch(e.target.value)}
        />
      </div>
      
      {/* Filtres */}
      <div className="p-4 border-b grid grid-cols-3 gap-2">
        {/* Filtre par statut */}
        <select
          className="px-2 py-1 border rounded-lg text-sm"
          value={filters.status}
          onChange={(e) => handleFilterChange('status', e.target.value)}
        >
          <option value="all">{getText('Tous statuts', 'كل الحالات', 'كل الحالات')}</option>
          <option value="open">{getText('Ouvert', 'مفتوح', 'مفتوح')}</option>
          <option value="active">{getText('Actif', 'نشط', 'نشط')}</option>
          <option value="escalated">{getText('Escaladé', 'مُصعَّد', 'مُصعَّد')}</option>
          <option value="resolved">{getText('Résolu', 'محلول', 'محلول')}</option>
        </select>
        
        {/* Filtre par langue */}
        <select
          className="px-2 py-1 border rounded-lg text-sm"
          value={filters.language}
          onChange={(e) => handleFilterChange('language', e.target.value)}
        >
          <option value="all">{getText('Toutes langues', 'كل اللغات', 'كل اللغات')}</option>
          <option value="fr">{getText('Français', 'فرنسية', 'فرنسية')}</option>
          <option value="ar">{getText('Arabe', 'عربية', 'عربية')}</option>
          <option value="ar-ma">{getText('Darija', 'دارجة', 'دارجة')}</option>
        </select>
        
        {/* Filtre par canal */}
        <select
          className="px-2 py-1 border rounded-lg text-sm"
          value={filters.channel}
          onChange={(e) => handleFilterChange('channel', e.target.value)}
        >
          <option value="all">{getText('Tous canaux', 'كل القنوات', 'كل القنوات')}</option>
          <option value="web">{getText('Web', 'ويب', 'ويب')}</option>
          <option value="whatsapp">{getText('WhatsApp', 'واتساب', 'واتساب')}</option>
          <option value="voice">{getText('Vocal', 'صوتي', 'صوتي')}</option>
        </select>
      </div>
      
      {/* Liste des conversations */}
      <div className="divide-y max-h-[500px] overflow-y-auto">
        {paginatedConversations.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {getText(
              'Aucune conversation ne correspond aux critères',
              'لا توجد محادثات تطابق المعايير',
              'ما كاين حتى محادثة كتطابق المعايير'
            )}
          </div>
        ) : (
          paginatedConversations.map(conversation => (
            <div
              key={conversation.id}
              className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
              onClick={() => handleSelectConversation(conversation.id)}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center">
                  <span className="mr-2 text-lg">{getChannelIcon(conversation.customer.channel)}</span>
                  <span className="mr-2 text-lg">{getLanguageIcon(conversation.language)}</span>
                  <span className="font-medium">{conversation.customer.name}</span>
                </div>
                <div className={`px-2 py-1 rounded-full text-xs ${getStatusColor(conversation.status)}`}>
                  {getStatusText(conversation.status)}
                </div>
              </div>
              
              <div className="text-sm text-gray-600 mb-2 line-clamp-2">
                {conversation.messages.length > 0
                  ? conversation.messages[conversation.messages.length - 1].text
                  : getText('Pas de messages', 'لا توجد رسائل', 'ما كاين حتى رسالة')}
              </div>
              
              <div className="flex justify-between text-xs text-gray-500">
                <span>
                  {conversation.messages.length} {getText('messages', 'رسائل', 'رسائل')}
                </span>
                <span>
                  {formatDuration(conversation.messages[0]?.timestamp || conversation.lastActivity)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="p-4 border-t flex justify-between items-center">
          <button
            className="px-3 py-1 rounded bg-gray-100 text-gray-700 disabled:opacity-50"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
          >
            {getText('Précédent', 'السابق', 'السابق')}
          </button>
          
          <span className="text-sm">
            {getText('Page', 'صفحة', 'صفحة')} {currentPage} / {totalPages}
          </span>
          
          <button
            className="px-3 py-1 rounded bg-gray-100 text-gray-700 disabled:opacity-50"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
          >
            {getText('Suivant', 'التالي', 'التالي')}
          </button>
        </div>
      )}
    </div>
  );
};

export default ConversationList;
