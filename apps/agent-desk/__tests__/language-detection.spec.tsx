/**
 * @file        Tests pour l'Agent Desk SalamBot avec simulation de détection de langue.
 * @author      SalamBot Team (contact: salam@chebakia.com)
 * @created     2025-05-21
 * @updated     2025-05-21
 * @project     SalamBot - AI CRM for Moroccan SMEs
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react-hooks';
import { useLanguageStore } from '../src/store/languageStore';
import { useConversationStore } from '../src/store/conversationStore';

// Mock du module de détection de langue
vi.mock('@salambot/ai/lang-detect', () => ({
  detectLanguage: vi.fn().mockImplementation((text) => {
    // Simuler la détection selon le texte
    if (text.includes('bonjour') || text.includes('merci')) {
      return Promise.resolve({
        lang: 'fr',
        confidence: 0.95,
        mode: 'cloud',
        latency: 120,
        fallback: false,
        source: 'cloud'
      });
    } else if (text.includes('مرحبا') || text.includes('شكرا')) {
      return Promise.resolve({
        lang: 'ar',
        confidence: 0.97,
        mode: 'cloud',
        latency: 150,
        fallback: false,
        source: 'cloud'
      });
    } else if (text.includes('labas') || text.includes('3lik')) {
      return Promise.resolve({
        lang: 'ar-ma',
        confidence: 0.85,
        mode: 'offline',
        latency: 2,
        fallback: true,
        source: 'offline'
      });
    } else {
      return Promise.resolve({
        lang: 'unknown',
        confidence: 0.5,
        mode: 'offline',
        latency: 1,
        fallback: true,
        source: 'offline'
      });
    }
  })
}));

describe('Agent Desk - Détection de langue et escalade', () => {
  beforeEach(() => {
    // Réinitialiser les stores avant chaque test
    const { result: langResult } = renderHook(() => useLanguageStore());
    act(() => {
      langResult.current.setLanguage('fr');
      langResult.current.setDetectionResult(null);
    });
    
    const { result: convResult } = renderHook(() => useConversationStore());
    act(() => {
      // Réinitialiser les conversations
      convResult.current.conversations = [];
      convResult.current.activeConversationId = null;
    });
  });
  
  it('devrait détecter le français et mettre à jour le store', async () => {
    const { result } = renderHook(() => useLanguageStore());
    const { result: convResult } = renderHook(() => useConversationStore());
    
    // Créer une conversation
    const conversationId = 'conv-123';
    act(() => {
      convResult.current.addConversation({
        id: conversationId,
        customer: {
          id: 'cust-1',
          name: 'Jean Dupont',
          channel: 'web'
        },
        messages: [],
        status: 'waiting',
        language: 'unknown',
        lastActivity: new Date(),
        slaStatus: 'normal'
      });
    });
    
    // Simuler la détection de langue depuis un message
    await act(async () => {
      await convResult.current.detectLanguageFromMessage(conversationId, 'bonjour comment ça va');
    });
    
    // Vérifier que le store de langue a été mis à jour
    expect(result.current.currentLanguage).toBe('fr');
    expect(result.current.lastDetection).toBeTruthy();
    expect(result.current.lastDetection.source).toBe('cloud');
    
    // Vérifier que la langue de la conversation a été mise à jour
    const updatedConv = convResult.current.conversations.find(c => c.id === conversationId);
    expect(updatedConv.language).toBe('fr');
  });
  
  it('devrait détecter l\'arabe et mettre à jour le store', async () => {
    const { result } = renderHook(() => useLanguageStore());
    const { result: convResult } = renderHook(() => useConversationStore());
    
    // Créer une conversation
    const conversationId = 'conv-456';
    act(() => {
      convResult.current.addConversation({
        id: conversationId,
        customer: {
          id: 'cust-2',
          name: 'محمد علي',
          channel: 'whatsapp'
        },
        messages: [],
        status: 'waiting',
        language: 'unknown',
        lastActivity: new Date(),
        slaStatus: 'normal'
      });
    });
    
    // Simuler la détection de langue depuis un message
    await act(async () => {
      await convResult.current.detectLanguageFromMessage(conversationId, 'مرحبا كيف حالك');
    });
    
    // Vérifier que le store de langue a été mis à jour
    expect(result.current.currentLanguage).toBe('ar');
    expect(result.current.lastDetection).toBeTruthy();
    expect(result.current.lastDetection.source).toBe('cloud');
    
    // Vérifier que la langue de la conversation a été mise à jour
    const updatedConv = convResult.current.conversations.find(c => c.id === conversationId);
    expect(updatedConv.language).toBe('ar');
  });
  
  it('devrait détecter le darija en alphabet latin et mettre à jour le store', async () => {
    const { result } = renderHook(() => useLanguageStore());
    const { result: convResult } = renderHook(() => useConversationStore());
    
    // Créer une conversation
    const conversationId = 'conv-789';
    act(() => {
      convResult.current.addConversation({
        id: conversationId,
        customer: {
          id: 'cust-3',
          name: 'Karim Alaoui',
          channel: 'web'
        },
        messages: [],
        status: 'waiting',
        language: 'unknown',
        lastActivity: new Date(),
        slaStatus: 'normal'
      });
    });
    
    // Simuler la détection de langue depuis un message
    await act(async () => {
      await convResult.current.detectLanguageFromMessage(conversationId, 'labas 3lik khouya');
    });
    
    // Vérifier que le store de langue a été mis à jour
    expect(result.current.currentLanguage).toBe('ar-ma');
    expect(result.current.lastDetection).toBeTruthy();
    expect(result.current.lastDetection.source).toBe('offline');
    expect(result.current.lastDetection.fallback).toBe(true);
    
    // Vérifier que la langue de la conversation a été mise à jour
    const updatedConv = convResult.current.conversations.find(c => c.id === conversationId);
    expect(updatedConv.language).toBe('ar-ma');
  });
  
  it('devrait gérer correctement l\'escalade et la prise en charge', () => {
    const { result: convResult } = renderHook(() => useConversationStore());
    
    // Créer une conversation
    const conversationId = 'conv-escalation';
    act(() => {
      convResult.current.addConversation({
        id: conversationId,
        customer: {
          id: 'cust-4',
          name: 'Sophie Martin',
          channel: 'whatsapp'
        },
        messages: [],
        status: 'waiting',
        language: 'fr',
        lastActivity: new Date(),
        slaStatus: 'normal'
      });
    });
    
    // Simuler la prise en charge
    act(() => {
      convResult.current.takeOverConversation(conversationId, 'agent-001');
    });
    
    // Vérifier que la conversation est active
    expect(convResult.current.activeConversationId).toBe(conversationId);
    const updatedConv = convResult.current.conversations.find(c => c.id === conversationId);
    expect(updatedConv.status).toBe('active');
    expect(updatedConv.assignedAgent).toBe('agent-001');
    
    // Simuler la résolution
    act(() => {
      convResult.current.resolveConversation(conversationId);
    });
    
    // Vérifier que la conversation est résolue
    const resolvedConv = convResult.current.conversations.find(c => c.id === conversationId);
    expect(resolvedConv.status).toBe('resolved');
    expect(convResult.current.activeConversationId).toBeNull();
  });
});
