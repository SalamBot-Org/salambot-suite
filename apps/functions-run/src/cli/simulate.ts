#!/usr/bin/env node
/**
 * @file        Simulateur CLI pour tester le pipeline de chat SalamBot.
 * @author      SalamBot Team (contact: info@salambot.ma)
 * @created     2025-05-21
 * @updated     2025-05-21
 * @project     SalamBot - AI CRM for Moroccan SMEs
 */

import readline from 'readline';
import { detectLanguage } from '../utils/lang-detect-mock';
import { shouldEscalate, triggerEscalation } from '../utils/escalation';
import { logger } from '../utils/logger';

// Configuration du simulateur
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Afficher l'en-tête
console.log('\x1b[36m%s\x1b[0m', '=== SalamBot Chat Simulator ===');
console.log('\x1b[33m%s\x1b[0m', 'Tapez un message pour tester le pipeline de chat');
console.log('\x1b[33m%s\x1b[0m', 'Commandes: :quit pour quitter, :help pour l\'aide');
console.log('');

// Fonction pour simuler le pipeline de chat
async function simulateChatPipeline(message: string, metadata = {}) {
  console.log('\x1b[90m%s\x1b[0m', '--- Début du pipeline ---');
  
  // Étape 1: Détection de langue
  console.log('\x1b[90m%s\x1b[0m', '1. Détection de langue...');
  const langResult = await detectLanguage(message);
  console.log('\x1b[32m%s\x1b[0m', `   Langue détectée: ${langResult.lang}`);
  console.log('\x1b[32m%s\x1b[0m', `   Confiance: ${langResult.confidence.toFixed(2)}`);
  console.log('\x1b[32m%s\x1b[0m', `   Source: ${langResult.source} (fallback: ${langResult.fallback})`);
  
  // Étape 2: Vérification d'escalade
  console.log('\x1b[90m%s\x1b[0m', '2. Vérification d\'escalade...');
  const { escalate, reason } = shouldEscalate(message);
  console.log('\x1b[32m%s\x1b[0m', `   Escalade nécessaire: ${escalate ? 'Oui' : 'Non'}${escalate ? ` (raison: ${reason})` : ''}`);
  
  // Étape 3: Génération de réponse (simulée)
  console.log('\x1b[90m%s\x1b[0m', '3. Génération de réponse...');
  
  // Simuler une réponse basée sur la langue détectée
  let reply = '';
  
  switch (langResult.lang) {
    case 'fr':
      reply = `Merci pour votre message en français. Nous l'avons bien reçu.`;
      break;
    case 'ar':
      reply = `شكرا على رسالتك باللغة العربية. لقد استلمناها.`;
      break;
    case 'ar-ma':
      reply = `شكرا على الرسالة ديالك بالدارجة. وصلاتنا مزيان.`;
      break;
    default:
      reply = `Thank you for your message. We have received it.`;
  }
  
  // Étape 4: Traitement de l'escalade si nécessaire
  if (escalate) {
    console.log('\x1b[90m%s\x1b[0m', '4. Traitement de l\'escalade...');
    
    const escalationMetadata = {
      conversationId: 'sim-' + Date.now(),
      userId: 'user-simulator',
      channel: 'cli' as any,
      reason,
      priority: 'medium',
      language: langResult.lang
    };
    
    const escalationResult = await triggerEscalation(message, escalationMetadata);
    console.log('\x1b[32m%s\x1b[0m', `   Escalade traitée: ${escalationResult ? 'Succès' : 'Échec'}`);
    
    // Ajouter une indication d'escalade à la réponse
    reply += langResult.lang === 'fr' 
      ? " Je vous mets en relation avec un agent." 
      : langResult.lang === 'ar' 
        ? " سأقوم بتوصيلك بأحد وكلائنا." 
        : langResult.lang === 'ar-ma' 
          ? " غادي نوصلك مع واحد الوكيل ديالنا." 
          : " I'll connect you with an agent.";
  }
  
  console.log('\x1b[32m%s\x1b[0m', `   Réponse: ${reply}`);
  
  // Résultat final
  console.log('\x1b[90m%s\x1b[0m', '--- Fin du pipeline ---');
  console.log('');
  
  // Retourner le résultat complet
  return {
    reply,
    lang: langResult.lang,
    confidence: langResult.confidence,
    source: langResult.source,
    escalated: escalate
  };
}

// Fonction principale
function startSimulator() {
  rl.question('\x1b[36m>\x1b[0m ', async (input) => {
    // Traiter les commandes spéciales
    if (input.trim() === ':quit') {
      console.log('\x1b[33m%s\x1b[0m', 'Au revoir!');
      rl.close();
      return;
    }
    
    if (input.trim() === ':help') {
      console.log('\x1b[33m%s\x1b[0m', 'Commandes disponibles:');
      console.log('\x1b[33m%s\x1b[0m', '  :quit - Quitter le simulateur');
      console.log('\x1b[33m%s\x1b[0m', '  :help - Afficher cette aide');
      console.log('\x1b[33m%s\x1b[0m', 'Tout autre texte sera traité comme un message utilisateur');
      console.log('');
      startSimulator();
      return;
    }
    
    // Traiter le message
    try {
      await simulateChatPipeline(input);
    } catch (error) {
      console.error('\x1b[31m%s\x1b[0m', 'Erreur lors du traitement du message:');
      console.error('\x1b[31m%s\x1b[0m', error);
    }
    
    // Continuer la boucle
    startSimulator();
  });
}

// Démarrer le simulateur
startSimulator();
