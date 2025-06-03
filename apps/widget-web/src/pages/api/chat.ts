/**
 * @file        API mock pour le endpoint /api/chat
 * @author      SalamBot Team (contact: info@salambot.ma)
 * @created     2025-05-26
 * @updated     2025-05-26
 * @project     SalamBot - AI CRM for Moroccan SMEs
 */

import type { NextApiRequest, NextApiResponse } from 'next';

// Types pour la réponse de l'API
interface ChatResponse {
  reply: string;
  lang: string;
  modelUsed?: string;
}

/**
 * Endpoint /api/chat (mock)
 *
 * Cette version est un mock qui sera remplacé par l'intégration réelle
 * avec les flows Genkit (lang-detect et reply) dans une future itération.
 */
export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<ChatResponse>
) {
  // Vérification de la méthode HTTP
  if (req.method !== 'POST') {
    return res.status(405).end('Method Not Allowed');
  }

  // Récupération du message de l'utilisateur
  const { message } = req.body;

  if (!message || typeof message !== 'string') {
    return res.status(400).json({
      reply:
        'Erreur: Le message est requis et doit être une chaîne de caractères.',
      lang: 'fr',
    });
  }

  // Détection simple de la langue (à remplacer par lang-detect-flow)
  let detectedLang = 'fr';
  if (/[\u0600-\u06FF]/.test(message)) {
    detectedLang = 'ar';
  } else if (/labas|mezyan|wach|zwin|bghit/.test(message.toLowerCase())) {
    detectedLang = 'darija';
  }

  // Génération d'une réponse mock basée sur la langue détectée
  const modelUsed = 'mock';
  let reply = '';

  switch (detectedLang) {
    case 'fr':
      reply =
        'Merci pour votre message. Je suis SalamBot, un assistant virtuel pour les PME marocaines. Cette réponse est générée par un mock et sera remplacée par une IA réelle dans une future version.';
      break;
    case 'ar':
      reply =
        'شكرا على رسالتك. أنا سلام بوت، مساعد افتراضي للشركات الصغيرة والمتوسطة المغربية. هذا الرد تم إنشاؤه بواسطة نموذج وسيتم استبداله بذكاء اصطناعي حقيقي في إصدار مستقبلي.';
      break;
    case 'darija':
      // Pour Darija, on répond en arabe classique selon les exigences
      reply =
        'شكرا على رسالتك. أنا سلام بوت، مساعد افتراضي للشركات الصغيرة والمتوسطة المغربية. هذا الرد تم إنشاؤه بواسطة نموذج وسيتم استبداله بذكاء اصطناعي حقيقي في إصدار مستقبلي.';
      break;
    default:
      reply =
        'Merci pour votre message. Je suis SalamBot, un assistant virtuel pour les PME marocaines.';
  }

  // Ajout d'un délai aléatoire pour simuler le temps de traitement
  setTimeout(() => {
    res.status(200).json({
      reply,
      lang: detectedLang,
      modelUsed,
    });
  }, Math.random() * 1000 + 500); // Délai entre 500ms et 1500ms
}
