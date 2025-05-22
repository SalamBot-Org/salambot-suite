/**
 * @file        Page principale de l'Agent Desk SalamBot avec intégration de la détection de langue.
 * @author      SalamBot Team (contact: salam@chebakia.com)
 * @created     2025-05-21
 * @updated     2025-05-21
 * @project     SalamBot - AI CRM for Moroccan SMEs
 */
import { useEffect } from 'react';
import { useLanguageStore } from './store/languageStore';
import { useConversationStore } from './store/conversationStore';
import ConversationQueue from './components/ConversationQueue';
import ActiveConversation from './components/ActiveConversation';
import LanguageIndicator from './components/LanguageIndicator';
import './styles.css';
function App() {
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
            status: 'waiting',
            language: 'unknown',
            lastActivity: new Date(Date.now() - 5 * 60000),
            slaStatus: 'normal'
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
            status: 'waiting',
            language: 'unknown',
            lastActivity: new Date(Date.now() - 10 * 60000),
            slaStatus: 'warning'
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
            status: 'waiting',
            language: 'unknown',
            lastActivity: new Date(Date.now() - 15 * 60000),
            slaStatus: 'critical'
        });
        // Détecter la langue du message
        detectLanguageFromMessage('conv-darija-789', 'labas 3lik, 3ndi mochkil f commande dyali');
    };
    // Obtenir le texte selon la langue actuelle
    const getText = (fr, ar, darija) => {
        switch (currentLanguage) {
            case 'fr': return fr;
            case 'ar': return ar;
            case 'ar-ma': return darija;
            default: return fr;
        }
    };
    return (<div className={`min-h-screen bg-gray-100 ${currentLanguage === 'ar' || currentLanguage === 'ar-ma' ? 'rtl' : 'ltr'}`}>
      <header className="bg-white shadow-sm p-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold">
            {getText('SalamBot Agent Desk', 'لوحة وكيل سلام بوت', 'لوحة وكيل سلام بوت')}
          </h1>
          <div className="flex items-center gap-4">
            <LanguageIndicator size="md" showSource={true}/>
            <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
              {getText('Agent en ligne', 'وكيل متصل', 'وكيل متصل')}
            </div>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto py-6 px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <ConversationQueue />
          </div>
          <div className="md:col-span-2 h-[600px]">
            <ActiveConversation />
          </div>
        </div>
      </main>
    </div>);
}
export default App;
//# sourceMappingURL=App.js.map