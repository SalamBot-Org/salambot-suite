import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { detectLanguage } from '../index';
import * as telemetry from '../telemetry';

// Mock des fonctions de télémétrie
vi.spyOn(telemetry, 'traceCloudDetection');
vi.spyOn(telemetry, 'traceCacheHit');
vi.spyOn(telemetry, 'traceFallback');
vi.spyOn(telemetry, 'traceDetectionResult');

// Mock de localStorage pour la simulation du cache
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    clear: () => { store = {}; }
  };
})();

// Assigner le mock à global
vi.stubGlobal('localStorage', localStorageMock);

describe('Détection de langue cloud - Tests', () => {
  beforeEach(() => {
    // Réinitialiser les mocks avant chaque test
    vi.clearAllMocks();
    localStorageMock.clear();
    
    // Utiliser des timers simulés pour contrôler les délais
    vi.useFakeTimers();
  });
  
  afterEach(() => {
    // Restaurer les timers réels après chaque test
    vi.useRealTimers();
  });
  
  it('devrait détecter le français via Gemini (Cas 1)', async () => {
    const textPromise = detectLanguage('Bonjour, j\'aimerais parler à un conseiller');
    
    // Avancer le temps pour simuler la réponse de l'API
    vi.advanceTimersByTime(300);
    
    const result = await textPromise;
    expect(result.lang).toBe('fr');
    expect(result.source).toBe('cloud');
    expect(result.fallback).toBe(false);
    expect(result.confidence).toBeGreaterThan(0.8);
  });
  
  it('devrait détecter le darija en alphabet latin via Llama (Cas 2)', async () => {
    const textPromise = detectLanguage('labas 3lik?');
    
    // Avancer le temps pour simuler la réponse de l'API
    vi.advanceTimersByTime(300);
    
    const result = await textPromise;
    expect(result.lang).toBe('ar-ma');
    expect(result.source).toBe('cloud');
    expect(result.confidence).toBeGreaterThan(0.8);
  });
  
  it('devrait détecter l\'arabe standard via Gemini (Cas 3)', async () => {
    const textPromise = detectLanguage('مرحبا خويا');
    
    // Avancer le temps pour simuler la réponse de l'API
    vi.advanceTimersByTime(300);
    
    const result = await textPromise;
    expect(result.lang).toBe('ar');
    expect(result.source).toBe('cloud');
    expect(result.fallback).toBe(false);
    expect(result.confidence).toBeGreaterThan(0.8);
  });
  
  it('devrait retourner unknown pour une chaîne vide (Cas 4)', async () => {
    const result = await detectLanguage('');
    expect(result.lang).toBe('unknown');
    expect(result.source).toBeDefined();
  });
  
  it('devrait fallback vers offline si timeout dépassé', async () => {
    // Configurer un timeout court pour le test
    const textPromise = detectLanguage('Test timeout', { timeout: 100 });
    
    // Avancer le temps juste après le timeout
    vi.advanceTimersByTime(150);
    
    const result = await textPromise;
    expect(result.fallback).toBe(true);
    expect(result.source).toBe('offline');
    expect(telemetry.traceFallback).toHaveBeenCalledWith('timeout');
  });
  
  it('devrait utiliser le cache pour des requêtes répétées', async () => {
    // Première requête - pas de cache
    const firstPromise = detectLanguage('Bonjour, test du cache');
    vi.advanceTimersByTime(300);
    await firstPromise;
    
    // Deuxième requête - devrait utiliser le cache
    const secondPromise = detectLanguage('Bonjour, test du cache');
    vi.advanceTimersByTime(50); // Temps minimal, car le cache est rapide
    const result = await secondPromise;
    
    expect(result.source).toBe('cloud');
    expect(telemetry.traceCacheHit).toHaveBeenCalled();
  });
  
  it('devrait fonctionner en mode offline explicite avec source=offline', async () => {
    const result = await detectLanguage('Bonjour', { offline: true });
    expect(result.mode).toBe('offline');
    expect(result.source).toBe('offline');
    expect(result.latency).toBeLessThan(10); // Latence cible < 3ms
  });
});
