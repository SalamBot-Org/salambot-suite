/**
 * @file        Store Zustand enrichi pour la gestion des conversations et de l'escalade en temps réel.
 * @author      SalamBot Team (contact: salam@chebakia.com)
 * @created     2025-05-21
 * @updated     2025-05-21
 * @project     SalamBot - AI CRM for Moroccan SMEs
 */
import { __awaiter } from "tslib";
import { create } from 'zustand';
import { detectLanguage } from '../utils/lang-detect-mock';
import { useLanguageStore } from './languageStore';
export const useConversationStore = create((set, get) => ({
    // État initial
    conversations: [],
    activeConversationId: null,
    isConnected: false,
    // Actions
    addConversation: (conversation) => set((state) => {
        // Vérifier si la conversation existe déjà
        if (state.conversations.some(conv => conv.id === conversation.id)) {
            return state;
        }
        // Initialiser les métriques si non présentes
        const conversationWithMetrics = Object.assign(Object.assign({}, conversation), { metrics: conversation.metrics || {
                messageCount: {
                    user: 0,
                    bot: 0,
                    agent: 0
                }
            } });
        return {
            conversations: [...state.conversations, conversationWithMetrics]
        };
    }),
    addMessage: (conversationId, message) => set((state) => {
        const now = new Date();
        const updatedConversations = state.conversations.map(conv => {
            if (conv.id === conversationId) {
                // Mettre à jour les métriques
                const updatedMetrics = Object.assign({}, conv.metrics);
                // Incrémenter le compteur de messages
                if (message.sender === 'user') {
                    updatedMetrics.messageCount.user += 1;
                }
                else if (message.sender === 'bot') {
                    updatedMetrics.messageCount.bot += 1;
                }
                else if (message.sender === 'agent') {
                    updatedMetrics.messageCount.agent += 1;
                    // Calculer le temps de première réponse si c'est le premier message de l'agent
                    if (updatedMetrics.messageCount.agent === 1 && conv.escalatedAt) {
                        updatedMetrics.firstResponseTime = now.getTime() - conv.escalatedAt.getTime();
                    }
                    // Mettre à jour le temps moyen de réponse
                    const userMessages = conv.messages.filter(m => m.sender === 'user');
                    if (userMessages.length > 0) {
                        const lastUserMessage = userMessages[userMessages.length - 1];
                        const responseTime = now.getTime() - new Date(lastUserMessage.timestamp).getTime();
                        if (updatedMetrics.avgResponseTime) {
                            updatedMetrics.avgResponseTime = (updatedMetrics.avgResponseTime + responseTime) / 2;
                        }
                        else {
                            updatedMetrics.avgResponseTime = responseTime;
                        }
                    }
                }
                return Object.assign(Object.assign({}, conv), { messages: [...conv.messages, message], lastActivity: now, metrics: updatedMetrics });
            }
            return conv;
        });
        return { conversations: updatedConversations };
    }),
    takeOverConversation: (conversationId, agentId) => set((state) => {
        const now = new Date();
        const updatedConversations = state.conversations.map(conv => {
            if (conv.id === conversationId) {
                // Mettre à jour les métriques
                const updatedMetrics = Object.assign({}, conv.metrics);
                // Si la conversation était en statut 'escalated', calculer le temps d'escalade
                if (conv.status === 'escalated' && conv.escalatedAt) {
                    updatedMetrics.escalationTime = now.getTime() - conv.escalatedAt.getTime();
                }
                return Object.assign(Object.assign({}, conv), { status: 'active', assignedAgent: agentId, lastActivity: now, metrics: updatedMetrics });
            }
            return conv;
        });
        return {
            conversations: updatedConversations,
            activeConversationId: conversationId
        };
    }),
    resolveConversation: (conversationId) => set((state) => {
        const now = new Date();
        const updatedConversations = state.conversations.map(conv => {
            if (conv.id === conversationId) {
                // Mettre à jour les métriques
                const updatedMetrics = Object.assign({}, conv.metrics);
                // Calculer le temps total de résolution
                const firstMessage = conv.messages[0];
                if (firstMessage) {
                    updatedMetrics.resolutionTime = now.getTime() - new Date(firstMessage.timestamp).getTime();
                }
                return Object.assign(Object.assign({}, conv), { status: 'resolved', lastActivity: now, metrics: updatedMetrics });
            }
            return conv;
        });
        return {
            conversations: updatedConversations,
            activeConversationId: state.activeConversationId === conversationId ? null : state.activeConversationId
        };
    }),
    setActiveConversation: (conversationId) => set({
        activeConversationId: conversationId
    }),
    detectLanguageFromMessage: (conversationId, messageText) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            // Détecter la langue du message
            const langResult = yield detectLanguage(messageText);
            // Mettre à jour le store de langue
            useLanguageStore.getState().setDetectionResult(langResult, conversationId);
            // Mettre à jour la langue de la conversation
            set((state) => {
                const updatedConversations = state.conversations.map(conv => {
                    if (conv.id === conversationId) {
                        return Object.assign(Object.assign({}, conv), { language: langResult.lang });
                    }
                    return conv;
                });
                return { conversations: updatedConversations };
            });
        }
        catch (error) {
            console.error('Erreur lors de la détection de langue:', error);
        }
    }),
    updateSlaStatus: () => set((state) => {
        const now = new Date();
        const updatedConversations = state.conversations.map(conv => {
            if (conv.status === 'resolved') {
                return conv;
            }
            // Calculer le temps d'attente en minutes
            const waitTime = (now.getTime() - conv.lastActivity.getTime()) / (1000 * 60);
            let slaStatus = 'normal';
            if (conv.status === 'open' || conv.status === 'escalated') {
                if (waitTime > 10)
                    slaStatus = 'critical';
                else if (waitTime > 5)
                    slaStatus = 'warning';
            }
            else if (conv.status === 'active') {
                if (waitTime > 20)
                    slaStatus = 'warning';
                if (waitTime > 30)
                    slaStatus = 'critical';
            }
            return Object.assign(Object.assign({}, conv), { slaStatus: slaStatus });
        });
        return { conversations: updatedConversations };
    }),
    updateConversationStatus: (conversationId, status) => set((state) => {
        const now = new Date();
        const updatedConversations = state.conversations.map(conv => {
            if (conv.id === conversationId) {
                // Mettre à jour les métriques selon le changement de statut
                const updatedMetrics = Object.assign({}, conv.metrics);
                // Si la conversation passe à 'escalated', enregistrer le moment de l'escalade
                const escalatedAt = status === 'escalated' ? now : conv.escalatedAt;
                return Object.assign(Object.assign({}, conv), { status,
                    escalatedAt, lastActivity: now, metrics: updatedMetrics });
            }
            return conv;
        });
        return { conversations: updatedConversations };
    }),
    updateConnectionStatus: (isConnected) => set({
        isConnected
    }),
    updateCsatScore: (conversationId, score) => set((state) => {
        const updatedConversations = state.conversations.map(conv => {
            if (conv.id === conversationId) {
                return Object.assign(Object.assign({}, conv), { metrics: Object.assign(Object.assign({}, conv.metrics), { csatScore: score }) });
            }
            return conv;
        });
        return { conversations: updatedConversations };
    })
}));
//# sourceMappingURL=conversationStore.js.map