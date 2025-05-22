/**
 * @file        Tests pour les composants d'historique de l'Agent Desk.
 * @author      SalamBot Team (contact: info@salambot.ma)
 * @created     2025-05-22
 * @updated     2025-05-22
 * @project     SalamBot - AI CRM for Moroccan SMEs
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ConversationList from '../components/ConversationList';
import ConversationDetails from '../components/ConversationDetails';
import HistoryPage from '../pages/HistoryPage';
import { useConversationStore } from '../store/conversationStore';
import { useLanguageStore } from '../store/languageStore';
import { AgentTracing } from '../utils/tracing';

// Mock des stores Zustand
vi.mock('../store/conversationStore', () => ({
  useConversationStore: vi.fn()
}));

vi.mock('../store/languageStore', () => ({
  useLanguageStore: vi.fn()
}));

// Mock du module de traçage
vi.mock('../utils/tracing', () => ({
  AgentTracing: {
    historyLoad: vi.fn(),
    historyView: vi.fn(),
    historyFilter: vi.fn(),
    traceAction: vi.fn((name, attributes, fn) => fn())
  }
}));

// Données de test
const mockConversations = [
  {
    id: 'conv-1',
    customer: {
      id: 'cust-1',
      name: 'Jean Dupont',
      channel: 'web'
    },
    messages: [
      {
        id: 'msg-1',
        text: 'Bonjour, j\'ai un problème avec ma commande',
        sender: 'user',
        timestamp: new Date(Date.now() - 5 * 60000)
      },
      {
        id: 'msg-2',
        text: 'Bonjour, je peux vous aider. Quel est le problème ?',
        sender: 'bot',
        timestamp: new Date(Date.now() - 4 * 60000)
      }
    ],
    status: 'resolved',
    language: 'fr',
    lastActivity: new Date(Date.now() - 4 * 60000),
    slaStatus: 'normal',
    metrics: {
      messageCount: {
        user: 1,
        bot: 1,
        agent: 0
      }
    },
    source: 'historical'
  },
  {
    id: 'conv-2',
    customer: {
      id: 'cust-2',
      name: 'محمد علي',
      channel: 'whatsapp'
    },
    messages: [
      {
        id: 'msg-3',
        text: 'مرحبا، لدي مشكلة في طلبي',
        sender: 'user',
        timestamp: new Date(Date.now() - 10 * 60000)
      }
    ],
    status: 'escalated',
    language: 'ar',
    lastActivity: new Date(Date.now() - 10 * 60000),
    slaStatus: 'warning',
    metrics: {
      messageCount: {
        user: 1,
        bot: 0,
        agent: 0
      }
    },
    source: 'historical'
  },
  {
    id: 'conv-3',
    customer: {
      id: 'cust-3',
      name: 'Karim Alaoui',
      channel: 'web'
    },
    messages: [
      {
        id: 'msg-4',
        text: 'labas 3lik, 3ndi mochkil f commande dyali',
        sender: 'user',
        timestamp: new Date(Date.now() - 15 * 60000)
      }
    ],
    status: 'resolved',
    language: 'ar-ma',
    lastActivity: new Date(Date.now() - 15 * 60000),
    slaStatus: 'normal',
    metrics: {
      messageCount: {
        user: 1,
        bot: 0,
        agent: 0
      }
    },
    source: 'historical'
  }
];

describe('ConversationList', () => {
  beforeEach(() => {
    // Mock du store de conversations
    useConversationStore.mockReturnValue({
      conversations: mockConversations
    });
    
    // Mock du store de langue
    useLanguageStore.mockReturnValue({
      currentLanguage: 'fr'
    });
  });
  
  it('affiche correctement la liste des conversations', () => {
    const handleSelectMock = vi.fn();
    
    render(
      <BrowserRouter>
        <ConversationList onSelectConversation={handleSelectMock} />
      </BrowserRouter>
    );
    
    // Vérifier que les conversations sont affichées
    expect(screen.getByText('Jean Dupont')).toBeInTheDocument();
    expect(screen.getByText('محمد علي')).toBeInTheDocument();
    expect(screen.getByText('Karim Alaoui')).toBeInTheDocument();
    
    // Vérifier que les statuts sont affichés
    expect(screen.getAllByText('Résolu').length).toBe(2);
    expect(screen.getByText('Escaladé')).toBeInTheDocument();
  });
  
  it('filtre les conversations par statut', async () => {
    const handleSelectMock = vi.fn();
    
    render(
      <BrowserRouter>
        <ConversationList onSelectConversation={handleSelectMock} />
      </BrowserRouter>
    );
    
    // Sélectionner le filtre de statut "Résolu"
    fireEvent.change(screen.getByRole('combobox', { name: '' }), { target: { value: 'resolved' } });
    
    // Vérifier que seules les conversations résolues sont affichées
    await waitFor(() => {
      expect(screen.getByText('Jean Dupont')).toBeInTheDocument();
      expect(screen.getByText('Karim Alaoui')).toBeInTheDocument();
      expect(screen.queryByText('محمد علي')).not.toBeInTheDocument();
    });
    
    // Vérifier que la trace de filtrage a été appelée
    expect(AgentTracing.historyFilter).toHaveBeenCalled();
  });
  
  it('filtre les conversations par langue', async () => {
    const handleSelectMock = vi.fn();
    
    render(
      <BrowserRouter>
        <ConversationList onSelectConversation={handleSelectMock} />
      </BrowserRouter>
    );
    
    // Sélectionner le filtre de langue "Français"
    const languageSelect = screen.getAllByRole('combobox')[1];
    fireEvent.change(languageSelect, { target: { value: 'fr' } });
    
    // Vérifier que seules les conversations en français sont affichées
    await waitFor(() => {
      expect(screen.getByText('Jean Dupont')).toBeInTheDocument();
      expect(screen.queryByText('محمد علي')).not.toBeInTheDocument();
      expect(screen.queryByText('Karim Alaoui')).not.toBeInTheDocument();
    });
  });
  
  it('filtre les conversations par canal', async () => {
    const handleSelectMock = vi.fn();
    
    render(
      <BrowserRouter>
        <ConversationList onSelectConversation={handleSelectMock} />
      </BrowserRouter>
    );
    
    // Sélectionner le filtre de canal "WhatsApp"
    const channelSelect = screen.getAllByRole('combobox')[2];
    fireEvent.change(channelSelect, { target: { value: 'whatsapp' } });
    
    // Vérifier que seules les conversations WhatsApp sont affichées
    await waitFor(() => {
      expect(screen.queryByText('Jean Dupont')).not.toBeInTheDocument();
      expect(screen.getByText('محمد علي')).toBeInTheDocument();
      expect(screen.queryByText('Karim Alaoui')).not.toBeInTheDocument();
    });
  });
  
  it('recherche dans les conversations', async () => {
    const handleSelectMock = vi.fn();
    
    render(
      <BrowserRouter>
        <ConversationList onSelectConversation={handleSelectMock} />
      </BrowserRouter>
    );
    
    // Rechercher "problème"
    fireEvent.change(screen.getByPlaceholderText('Rechercher...'), { target: { value: 'problème' } });
    
    // Vérifier que seules les conversations contenant "problème" sont affichées
    await waitFor(() => {
      expect(screen.getByText('Jean Dupont')).toBeInTheDocument();
      expect(screen.queryByText('محمد علي')).not.toBeInTheDocument();
      expect(screen.queryByText('Karim Alaoui')).not.toBeInTheDocument();
    });
  });
  
  it('sélectionne une conversation quand on clique dessus', () => {
    const handleSelectMock = vi.fn();
    
    render(
      <BrowserRouter>
        <ConversationList onSelectConversation={handleSelectMock} />
      </BrowserRouter>
    );
    
    // Cliquer sur une conversation
    fireEvent.click(screen.getByText('Jean Dupont').closest('div.p-4') as HTMLElement);
    
    // Vérifier que la fonction de sélection a été appelée avec le bon ID
    expect(handleSelectMock).toHaveBeenCalledWith('conv-1');
    
    // Vérifier que la trace de visualisation a été appelée
    expect(AgentTracing.historyView).toHaveBeenCalled();
  });
});

describe('ConversationDetails', () => {
  beforeEach(() => {
    // Mock du store de conversations
    useConversationStore.mockReturnValue({
      conversations: mockConversations
    });
    
    // Mock du store de langue
    useLanguageStore.mockReturnValue({
      currentLanguage: 'fr'
    });
  });
  
  it('affiche un message quand aucune conversation n\'est sélectionnée', () => {
    render(
      <BrowserRouter>
        <ConversationDetails conversationId={null} />
      </BrowserRouter>
    );
    
    expect(screen.getByText('Sélectionnez une conversation pour voir les détails')).toBeInTheDocument();
  });
  
  it('affiche les détails d\'une conversation sélectionnée', () => {
    render(
      <BrowserRouter>
        <ConversationDetails conversationId="conv-1" />
      </BrowserRouter>
    );
    
    // Vérifier que les informations de la conversation sont affichées
    expect(screen.getByText('Jean Dupont')).toBeInTheDocument();
    expect(screen.getByText('Résolu')).toBeInTheDocument();
    
    // Vérifier que les messages sont affichés
    expect(screen.getByText('Bonjour, j\'ai un problème avec ma commande')).toBeInTheDocument();
    expect(screen.getByText('Bonjour, je peux vous aider. Quel est le problème ?')).toBeInTheDocument();
    
    // Vérifier que les émetteurs sont affichés
    expect(screen.getByText('Jean Dupont')).toBeInTheDocument();
    expect(screen.getByText('SalamBot')).toBeInTheDocument();
  });
  
  it('appelle la fonction onBack quand on clique sur le bouton de retour', () => {
    const handleBackMock = vi.fn();
    
    render(
      <BrowserRouter>
        <ConversationDetails conversationId="conv-1" onBack={handleBackMock} />
      </BrowserRouter>
    );
    
    // Cliquer sur le bouton de retour
    fireEvent.click(screen.getByLabelText('Retour'));
    
    // Vérifier que la fonction de retour a été appelée
    expect(handleBackMock).toHaveBeenCalled();
  });
});

describe('HistoryPage', () => {
  beforeEach(() => {
    // Mock du store de conversations
    useConversationStore.mockReturnValue({
      conversations: mockConversations
    });
    
    // Mock du store de langue
    useLanguageStore.mockReturnValue({
      currentLanguage: 'fr'
    });
  });
  
  it('affiche la liste des conversations et les détails vides au démarrage', () => {
    render(
      <BrowserRouter>
        <HistoryPage />
      </BrowserRouter>
    );
    
    // Vérifier que la liste des conversations est affichée
    expect(screen.getByText('Historique des conversations')).toBeInTheDocument();
    expect(screen.getByText('Jean Dupont')).toBeInTheDocument();
    
    // Vérifier que les détails sont vides
    expect(screen.getByText('Sélectionnez une conversation pour voir les détails')).toBeInTheDocument();
  });
  
  it('affiche les détails d\'une conversation quand on la sélectionne', async () => {
    render(
      <BrowserRouter>
        <HistoryPage />
      </BrowserRouter>
    );
    
    // Cliquer sur une conversation
    fireEvent.click(screen.getByText('Jean Dupont').closest('div.p-4') as HTMLElement);
    
    // Vérifier que les détails sont affichés
    await waitFor(() => {
      expect(screen.getByText('Bonjour, j\'ai un problème avec ma commande')).toBeInTheDocument();
      expect(screen.getByText('Bonjour, je peux vous aider. Quel est le problème ?')).toBeInTheDocument();
    });
    
    // Vérifier que la trace de chargement a été appelée
    expect(AgentTracing.historyLoad).toHaveBeenCalled();
  });
});
