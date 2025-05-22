/**
 * @file        Application principale de l'Agent Desk SalamBot avec routage.
 * @author      SalamBot Team (contact: info@salambot.ma)
 * @created     2025-05-21
 * @updated     2025-05-22
 * @project     SalamBot - AI CRM for Moroccan SMEs
 */

import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { useLanguageStore } from './store/languageStore';
import { useConversationStore } from './store/conversationStore';
import { useAuth } from './hooks/useAuth';
import { Role } from './types/auth';
import ConversationQueue from './components/ConversationQueue';
import ActiveConversation from './components/ActiveConversation';
import LanguageIndicator from './components/LanguageIndicator';
import HistoryPage from './pages/HistoryPage';
import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/LoginPage';
import './styles.css';

// Composant de protection de route
const ProtectedRoute = ({ children, roles = [] }) => {
  const { user, isAuthenticated, hasAnyRole } = useAuth();
  const location = useLocation();
  
  if (!isAuthenticated) {
    return <LoginPage redirectTo={location.pathname} />;
  }
  
  if (roles.length > 0 && !hasAnyRole(roles)) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Accès refusé</h2>
          <p className="text-gray-500 dark:text-gray-400">
            Vous n'avez pas les permissions nécessaires pour accéder à cette page.
          </p>
        </div>
      </div>
    );
  }
  
  return children;
};

// Composant de navigation
const Navigation = () => {
  const location = useLocation();
  const { currentLanguage } = useLanguageStore();
  const { hasAnyRole } = useAuth();
  
  // Vérifier si l'utilisateur a accès au dashboard
  const canAccessDashboard = hasAnyRole([Role.ADMIN, Role.AGENT]);
  
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
    <nav className="bg-white dark:bg-gray-800 shadow-sm mb-6 p-2 rounded-lg">
      <ul className="flex space-x-1">
        <li>
          <Link 
            to="/" 
            className={`px-4 py-2 rounded-md block ${
              location.pathname === '/' 
                ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 font-medium' 
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            {getText('Conversations', 'المحادثات', 'المحادثات')}
          </Link>
        </li>
        <li>
          <Link 
            to="/history" 
            className={`px-4 py-2 rounded-md block ${
              location.pathname === '/history' 
                ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 font-medium' 
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            {getText('Historique', 'السجل', 'السجل')}
          </Link>
        </li>
        {canAccessDashboard && (
          <li>
            <Link 
              to="/dashboard" 
              className={`px-4 py-2 rounded-md block ${
                location.pathname === '/dashboard' 
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 font-medium' 
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {getText('Dashboard', 'لوحة المعلومات', 'لوحة المعلومات')}
            </Link>
          </li>
        )}
      </ul>
    </nav>
  );
};

// Page d'accueil avec les conversations actives
const HomePage = () => {
  const { currentLanguage } = useLanguageStore();
  const { updateSlaStatus } = useConversationStore();
  
  // Simuler des conversations pour la démo
  useEffect(() => {
    // Mettre à jour le statut SLA toutes les 30 secondes
    const interval = setInterval(() => {
      updateSlaStatus();
    }, 30000);
    
    // Simuler des conversations entrantes
    simulateIncomingConversations();
    
    return () => clearInterval(interval);
  }, [updateSlaStatus]);
  
  // Fonction pour simuler des conversations entrantes
  const simulateIncomingConversations = () => {
    const { addConversation, detectLanguageFromMessage } = useConversationStore.getState();
    
    // Conversation en français
    addConversation({
      id: 'conv-fr-123',
      customer: {
        id: 'cust-fr-1',
        name: 'Jean Dupont',
        channel: 'web'
      },
      messages: [
        {
          id: 'msg-fr-1',
          text: 'Bonjour, j\'ai un problème avec ma commande',
          sender: 'user',
          timestamp: new Date(Date.now() - 5 * 60000)
        }
      ],
      status: 'open',
      language: 'unknown',
      lastActivity: new Date(Date.now() - 5 * 60000),
      slaStatus: 'normal',
      metrics: {
        messageCount: {
          user: 1,
          bot: 0,
          agent: 0
        }
      },
      source: 'realtime'
    });
    
    // Détecter la langue du message
    detectLanguageFromMessage('conv-fr-123', 'Bonjour, j\'ai un problème avec ma commande');
    
    // Conversation en arabe
    addConversation({
      id: 'conv-ar-456',
      customer: {
        id: 'cust-ar-1',
        name: 'محمد علي',
        channel: 'whatsapp'
      },
      messages: [
        {
          id: 'msg-ar-1',
          text: 'مرحبا، لدي مشكلة في طلبي',
          sender: 'user',
          timestamp: new Date(Date.now() - 10 * 60000)
        }
      ],
      status: 'escalated',
      language: 'unknown',
      lastActivity: new Date(Date.now() - 10 * 60000),
      slaStatus: 'warning',
      metrics: {
        messageCount: {
          user: 1,
          bot: 0,
          agent: 0
        }
      },
      source: 'realtime'
    });
    
    // Détecter la langue du message
    detectLanguageFromMessage('conv-ar-456', 'مرحبا، لدي مشكلة في طلبي');
    
    // Conversation en darija
    addConversation({
      id: 'conv-darija-789',
      customer: {
        id: 'cust-darija-1',
        name: 'Karim Alaoui',
        channel: 'web'
      },
      messages: [
        {
          id: 'msg-darija-1',
          text: 'labas 3lik, 3ndi mochkil f commande dyali',
          sender: 'user',
          timestamp: new Date(Date.now() - 15 * 60000)
        }
      ],
      status: 'active',
      language: 'unknown',
      lastActivity: new Date(Date.now() - 15 * 60000),
      slaStatus: 'critical',
      metrics: {
        messageCount: {
          user: 1,
          bot: 0,
          agent: 0
        }
      },
      source: 'realtime'
    });
    
    // Détecter la langue du message
    detectLanguageFromMessage('conv-darija-789', 'labas 3lik, 3ndi mochkil f commande dyali');
    
    // Ajouter une conversation résolue pour l'historique
    addConversation({
      id: 'conv-hist-123',
      customer: {
        id: 'cust-hist-1',
        name: 'Sophie Martin',
        channel: 'web'
      },
      messages: [
        {
          id: 'msg-hist-1',
          text: 'Bonjour, je voudrais savoir comment modifier mon adresse de livraison',
          sender: 'user',
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60000)
        },
        {
          id: 'msg-hist-2',
          text: 'Bonjour Sophie, je peux vous aider avec cela. Pouvez-vous me donner votre numéro de commande ?',
          sender: 'bot',
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60000 + 1 * 60000)
        },
        {
          id: 'msg-hist-3',
          text: 'C\'est la commande #12345',
          sender: 'user',
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60000 + 5 * 60000)
        },
        {
          id: 'msg-hist-4',
          text: 'Merci, je vais vous mettre en relation avec un agent qui pourra vous aider.',
          sender: 'bot',
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60000 + 6 * 60000)
        },
        {
          id: 'msg-hist-5',
          text: 'Bonjour Sophie, je suis Mehdi, votre conseiller. Je vais vous aider à modifier votre adresse de livraison.',
          sender: 'agent',
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60000 + 10 * 60000)
        },
        {
          id: 'msg-hist-6',
          text: 'Merci beaucoup !',
          sender: 'user',
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60000 + 12 * 60000)
        }
      ],
      status: 'resolved',
      language: 'fr',
      lastActivity: new Date(Date.now() - 2 * 24 * 60 * 60000 + 12 * 60000),
      slaStatus: 'normal',
      metrics: {
        messageCount: {
          user: 3,
          bot: 2,
          agent: 1
        },
        firstResponseTime: 10 * 60000,
        avgResponseTime: 3 * 60000,
        resolutionTime: 12 * 60000,
        csatScore: 5
      },
      source: 'historical'
    });
  };
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-1">
        <ConversationQueue />
      </div>
      <div className="md:col-span-2 h-[600px]">
        <ActiveConversation />
      </div>
    </div>
  );
};

// Application principale avec routage
function App() {
  const { currentLanguage } = useLanguageStore();
  const [darkMode, setDarkMode] = useState(false);
  
  // Détecter le mode sombre du système
  useEffect(() => {
    const isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    setDarkMode(isDarkMode);
    
    // Écouter les changements de préférence
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => setDarkMode(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);
  
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
    <Router>
      <div className={`min-h-screen ${darkMode ? 'dark' : ''} ${currentLanguage === 'ar' || currentLanguage === 'ar-ma' ? 'rtl' : 'ltr'}`}>
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
          <header className="bg-white dark:bg-gray-800 shadow-sm p-4">
            <div className="container mx-auto flex justify-between items-center">
              <h1 className="text-xl font-bold">
                {getText(
                  'SalamBot Agent Desk',
                  'لوحة وكيل سلام بوت',
                  'لوحة وكيل سلام بوت'
                )}
              </h1>
              <div className="flex items-center gap-4">
                <LanguageIndicator size="md" showSource={true} />
                <div className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 px-3 py-1 rounded-full text-sm">
                  {getText(
                    'Agent en ligne',
                    'وكيل متصل',
                    'وكيل متصل'
                  )}
                </div>
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className="p-2 rounded-full bg-gray-200 dark:bg-gray-700"
                  aria-label={darkMode ? 'Activer le mode clair' : 'Activer le mode sombre'}
                >
                  {darkMode ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </header>
          
          <main className="container mx-auto py-6 px-4">
            <Navigation />
            
            <Routes>
              <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
              <Route path="/history" element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
              <Route path="/dashboard" element={
                <ProtectedRoute roles={[Role.ADMIN, Role.AGENT]}>
                  <DashboardPage />
                </ProtectedRoute>
              } />
              <Route path="/login" element={<LoginPage />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;
