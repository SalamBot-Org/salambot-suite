/**
 * @file        Tests pour le widget web SalamBot avec simulation de détection de langue.
 * @author      SalamBot Team (contact: salam@chebakia.com)
 * @created     2025-05-21
 * @updated     2025-05-21
 * @project     SalamBot - AI CRM for Moroccan SMEs
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react-hooks';
import { useLanguageStore } from '../store/languageStore';

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

describe('Widget SalamBot - Détection de langue', () => {
  beforeEach(() => {
    // Réinitialiser le store avant chaque test
    const { result } = renderHook(() => useLanguageStore());
    act(() => {
      result.current.setLanguage('fr');
      result.current.setDetectionResult(null);
    });
  });
  
  it('devrait détecter le français et mettre à jour le store', async () => {
    const { result } = renderHook(() => useLanguageStore());
    
    // Importer dynamiquement le module pour accéder au mock
    const { detectLanguage } = await import('@salambot/ai/lang-detect');
    
    // Simuler la détection
    const detectionResult = await detectLanguage('bonjour comment ça va');
    
    // Mettre à jour le store
    act(() => {
      result.current.setDetectionResult(detectionResult);
    });
    
    // Vérifier que le store a été mis à jour correctement
    expect(result.current.currentLanguage).toBe('fr');
    expect(result.current.lastDetection).toEqual(detectionResult);
    expect(result.current.lastDetection.source).toBe('cloud');
  });
  
  it('devrait détecter l\'arabe et mettre à jour le store', async () => {
    const { result } = renderHook(() => useLanguageStore());
    
    // Importer dynamiquement le module pour accéder au mock
    const { detectLanguage } = await import('@salambot/ai/lang-detect');
    
    // Simuler la détection
    const detectionResult = await detectLanguage('مرحبا كيف حالك');
    
    // Mettre à jour le store
    act(() => {
      result.current.setDetectionResult(detectionResult);
    });
    
    // Vérifier que le store a été mis à jour correctement
    expect(result.current.currentLanguage).toBe('ar');
    expect(result.current.lastDetection).toEqual(detectionResult);
    expect(result.current.lastDetection.source).toBe('cloud');
  });
  
  it('devrait détecter le darija en alphabet latin et mettre à jour le store', async () => {
    const { result } = renderHook(() => useLanguageStore());
    
    // Importer dynamiquement le module pour accéder au mock
    const { detectLanguage } = await import('@salambot/ai/lang-detect');
    
    // Simuler la détection
    const detectionResult = await detectLanguage('labas 3lik khouya');
    
    // Mettre à jour le store
    act(() => {
      result.current.setDetectionResult(detectionResult);
    });
    
    // Vérifier que le store a été mis à jour correctement
    expect(result.current.currentLanguage).toBe('ar-ma');
    expect(result.current.lastDetection).toEqual(detectionResult);
    expect(result.current.lastDetection.source).toBe('offline');
    expect(result.current.lastDetection.fallback).toBe(true);
  });
});
