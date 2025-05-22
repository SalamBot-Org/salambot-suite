/**
 * @file        Tests unitaires pour la transcription audio WhatsApp de SalamBot.
 * @author      SalamBot Team (contact: info@salambot.ma)
 * @created     2025-05-22
 * @updated     2025-05-22
 * @project     SalamBot - AI CRM for Moroccan SMEs
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { downloadAudioMedia, uploadToS3 } from '../src/audioDownloader';
import { transcribeAudio, detectLanguage } from '../src/audioTranscription';
import axios from 'axios';
import fs from 'fs';
import path from 'path';

// Mock des modules externes
vi.mock('axios');
vi.mock('fs', () => ({
  existsSync: vi.fn(),
  mkdirSync: vi.fn(),
  writeFileSync: vi.fn(),
  statSync: vi.fn(),
}));
vi.mock('@opentelemetry/api', () => {
  return {
    trace: {
      getTracer: () => ({
        startSpan: () => ({
          setAttribute: () => {},
          addEvent: () => {},
          end: () => {},
        }),
      }),
    },
  };
});

describe('WhatsApp Audio Processing - Download', () => {
  const originalEnv = process.env;
  
  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.WA_ACCESS_TOKEN = 'test_token';
    vi.resetAllMocks();
  });
  
  afterEach(() => {
    process.env = originalEnv;
  });
  
  it('devrait télécharger un fichier audio avec succès', async () => {
    // Mock de la réponse pour les métadonnées du média
    (axios.get as any).mockResolvedValueOnce({
      data: {
        url: 'https://example.com/audio.ogg'
      }
    });
    
    // Mock de la réponse pour le téléchargement du fichier
    (axios.get as any).mockResolvedValueOnce({
      data: Buffer.from('fake audio data')
    });
    
    // Mock de fs.existsSync pour le répertoire de stockage
    (fs.existsSync as any).mockReturnValue(false);
    
    // Mock de fs.statSync pour la taille du fichier
    (fs.statSync as any).mockReturnValue({ size: 1024 });
    
    const audioId = 'audio123';
    const result = await downloadAudioMedia(audioId);
    
    // Vérifier que les appels API ont été effectués correctement
    expect(axios.get).toHaveBeenCalledWith(
      `https://graph.facebook.com/v17.0/${audioId}`,
      expect.objectContaining({
        headers: {
          'Authorization': 'Bearer test_token'
        }
      })
    );
    
    // Vérifier que le répertoire a été créé si nécessaire
    expect(fs.mkdirSync).toHaveBeenCalled();
    
    // Vérifier que le fichier a été écrit
    expect(fs.writeFileSync).toHaveBeenCalled();
    
    // Vérifier que le résultat est un chemin de fichier
    expect(result).toContain(audioId);
    expect(result).toMatch(/\.ogg$/);
  });
  
  it('devrait gérer les erreurs lors du téléchargement', async () => {
    // Mock d'une erreur lors de la récupération des métadonnées
    (axios.get as any).mockRejectedValueOnce(new Error('API Error'));
    
    await expect(downloadAudioMedia('audio123')).rejects.toThrow('API Error');
  });
  
  it('devrait simuler l\'upload vers S3', async () => {
    const localPath = '/tmp/audio123.ogg';
    const result = await uploadToS3(localPath);
    
    // Vérifier que le résultat est une URL S3
    expect(result).toContain('s3://wa-audio/');
    expect(result).toContain('audio123.ogg');
  });
});

describe('WhatsApp Audio Processing - Transcription', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    
    // Mock de fs.existsSync pour le fichier audio
    (fs.existsSync as any).mockReturnValue(true);
    
    // Mock de fs.statSync pour la taille du fichier
    (fs.statSync as any).mockReturnValue({ size: 1024 });
  });
  
  it('devrait transcrire un fichier audio en français', async () => {
    const audioPath = '/tmp/audio-fr.ogg';
    const result = await transcribeAudio(audioPath);
    
    expect(result).toHaveProperty('transcript');
    expect(result).toHaveProperty('lang', 'fr');
    expect(result).toHaveProperty('confidence');
    expect(result.confidence).toBeGreaterThan(0.5);
  });
  
  it('devrait transcrire un fichier audio en arabe', async () => {
    const audioPath = '/tmp/audio-ar.ogg';
    const result = await transcribeAudio(audioPath);
    
    expect(result).toHaveProperty('transcript');
    expect(['ar', 'ar-ma']).toContain(result.lang);
    expect(result).toHaveProperty('confidence');
    expect(result.confidence).toBeGreaterThan(0.5);
  });
  
  it('devrait gérer les erreurs si le fichier n\'existe pas', async () => {
    // Mock de fs.existsSync pour simuler un fichier manquant
    (fs.existsSync as any).mockReturnValue(false);
    
    const audioPath = '/tmp/missing-audio.ogg';
    await expect(transcribeAudio(audioPath)).rejects.toThrow('Audio file not found');
  });
});

describe('WhatsApp Audio Processing - Language Detection', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });
  
  it('devrait détecter la langue via l\'API', async () => {
    // Mock de la réponse de l'API de détection de langue
    (axios.post as any).mockResolvedValueOnce({
      data: {
        lang: 'fr',
        confidence: 0.95
      }
    });
    
    const text = 'Bonjour, comment allez-vous?';
    const result = await detectLanguage(text);
    
    expect(result).toHaveProperty('lang', 'fr');
    expect(result).toHaveProperty('confidence', 0.95);
    
    // Vérifier que l'API a été appelée avec le bon texte
    expect(axios.post).toHaveBeenCalledWith(
      expect.any(String),
      { text }
    );
  });
  
  it('devrait utiliser la détection de secours en cas d\'erreur API', async () => {
    // Mock d'une erreur lors de l'appel à l'API
    (axios.post as any).mockRejectedValueOnce(new Error('API Error'));
    
    // Texte en arabe
    const arabicText = 'مرحبا كيف حالك؟';
    const arabicResult = await detectLanguage(arabicText);
    
    expect(arabicResult).toHaveProperty('lang', 'ar');
    expect(arabicResult).toHaveProperty('confidence');
    expect(arabicResult.confidence).toBeGreaterThan(0.5);
    
    // Texte en darija (avec chiffres)
    const darijaText = 'salam, labas 3lik?';
    const darijaResult = await detectLanguage(darijaText);
    
    expect(darijaResult).toHaveProperty('lang', 'ar-ma');
    expect(darijaResult).toHaveProperty('confidence');
    expect(darijaResult.confidence).toBeGreaterThan(0.5);
    
    // Texte en français
    const frenchText = 'Bonjour, comment allez-vous?';
    const frenchResult = await detectLanguage(frenchText);
    
    expect(frenchResult).toHaveProperty('lang', 'fr');
    expect(frenchResult).toHaveProperty('confidence');
    expect(frenchResult.confidence).toBeGreaterThan(0.5);
  });
});

describe('WhatsApp Audio Processing - Integration', () => {
  // Ces tests seraient idéalement implémentés pour tester l'intégration complète
  // du pipeline audio dans le handler WhatsApp, mais ils nécessiteraient des mocks
  // plus complexes et une configuration d'environnement plus élaborée.
  
  it('TODO: devrait intégrer le téléchargement, la transcription et l\'envoi à /chat', () => {
    // Ce test serait implémenté dans une phase ultérieure
    expect(true).toBe(true);
  });
});
