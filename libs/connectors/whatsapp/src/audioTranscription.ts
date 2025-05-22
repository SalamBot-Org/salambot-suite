/**
 * @file        Transcription audio pour les messages vocaux WhatsApp de SalamBot.
 * @author      SalamBot Team (contact: info@salambot.ma)
 * @created     2025-05-22
 * @updated     2025-05-22
 * @project     SalamBot - AI CRM for Moroccan SMEs
 */

import { trace } from '@opentelemetry/api';
import fs from 'fs';
import path from 'path';
import axios from 'axios';

// Tracer pour le composant WhatsApp
const tracer = trace.getTracer('salambot.connectors.whatsapp');

// Interface pour le résultat de transcription
export interface TranscriptionResult {
  transcript: string;
  lang: string;
  confidence: number;
}

/**
 * Transcrit un fichier audio en texte en utilisant Whisper (stub)
 * 
 * @param audioFilePath - Chemin du fichier audio à transcrire
 * @returns Promise<TranscriptionResult> - Résultat de la transcription
 */
export async function transcribeAudio(audioFilePath: string): Promise<TranscriptionResult> {
  const span = tracer.startSpan('wa.audio.transcribe');
  span.setAttribute('wa.audio.file_path', audioFilePath);
  
  try {
    // Vérifier que le fichier existe
    if (!fs.existsSync(audioFilePath)) {
      throw new Error(`Audio file not found: ${audioFilePath}`);
    }
    
    // Obtenir la taille du fichier pour les logs
    const fileStats = fs.statSync(audioFilePath);
    span.setAttribute('wa.audio.file_size', fileStats.size);
    
    // En production, ici on appellerait l'API Whisper via Genkit
    // Pour cette PR, on simule la transcription avec un délai
    
    // Simuler un délai de traitement
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Déterminer la langue en fonction du nom de fichier (pour simulation)
    // En production, Whisper détecterait automatiquement la langue
    const fileName = path.basename(audioFilePath).toLowerCase();
    
    let transcript: string;
    let lang: string;
    let confidence: number;
    
    // Simulation de transcription basée sur l'ID du fichier
    if (fileName.includes('fr') || Math.random() < 0.33) {
      transcript = "Bonjour, j'aimerais avoir des informations sur vos services.";
      lang = 'fr';
      confidence = 0.92;
    } else if (fileName.includes('ar') || Math.random() < 0.5) {
      transcript = "مرحبا، أود الحصول على معلومات حول خدماتكم.";
      lang = 'ar';
      confidence = 0.89;
    } else {
      transcript = "salam, bghit chi ma3lomat 3la khadamatkom.";
      lang = 'ar-ma';
      confidence = 0.85;
    }
    
    // Ajouter des attributs au span
    span.setAttribute('wa.audio.transcript', transcript);
    span.setAttribute('wa.audio.transcript.lang', lang);
    span.setAttribute('wa.audio.transcript.confidence', confidence);
    span.setAttribute('wa.audio.transcribe.success', true);
    span.end();
    
    return {
      transcript,
      lang,
      confidence
    };
  } catch (error) {
    span.setAttribute('wa.audio.transcribe.success', false);
    span.setAttribute('wa.audio.transcribe.error', error instanceof Error ? error.message : 'unknown');
    span.end();
    
    throw error;
  }
}

/**
 * Détecte la langue d'un texte transcrit en utilisant le service de détection de langue
 * 
 * @param text - Texte à analyser
 * @returns Promise<{lang: string, confidence: number}> - Langue détectée et niveau de confiance
 */
export async function detectLanguage(text: string): Promise<{lang: string, confidence: number}> {
  const span = tracer.startSpan('wa.audio.detect_language');
  span.setAttribute('wa.audio.text', text);
  
  try {
    // URL de l'API de détection de langue (configurable via variable d'environnement)
    const langDetectUrl = process.env.LANG_DETECT_URL || 'http://localhost:3010/detect-language';
    
    // Appeler l'API de détection de langue
    const response = await axios.post(langDetectUrl, { text });
    
    const { lang, confidence } = response.data;
    
    span.setAttribute('wa.audio.detect_language.lang', lang);
    span.setAttribute('wa.audio.detect_language.confidence', confidence);
    span.setAttribute('wa.audio.detect_language.success', true);
    span.end();
    
    return { lang, confidence };
  } catch (error) {
    // En cas d'erreur, utiliser une détection simplifiée basée sur les caractères
    let lang = 'unknown';
    let confidence = 0.5;
    
    // Détection simplifiée basée sur les caractères arabes
    const arabicPattern = /[\u0600-\u06FF]/;
    if (arabicPattern.test(text)) {
      lang = 'ar';
      confidence = 0.7;
    } else if (/[a-zA-Z]/.test(text)) {
      // Si contient des caractères latins et des chiffres au milieu des mots, probablement darija
      if (/\w[0-9]\w/.test(text)) {
        lang = 'ar-ma';
        confidence = 0.65;
      } else {
        lang = 'fr';
        confidence = 0.75;
      }
    }
    
    span.setAttribute('wa.audio.detect_language.fallback', true);
    span.setAttribute('wa.audio.detect_language.lang', lang);
    span.setAttribute('wa.audio.detect_language.confidence', confidence);
    span.setAttribute('wa.audio.detect_language.success', false);
    span.setAttribute('wa.audio.detect_language.error', error instanceof Error ? error.message : 'unknown');
    span.end();
    
    return { lang, confidence };
  }
}
