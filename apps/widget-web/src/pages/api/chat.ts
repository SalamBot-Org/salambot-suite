/**
 * @file        API endpoint pour le chat SalamBot
 * @description Endpoint pour les interactions avec SalamBot via Kong Gateway
 * @version     2.0.0
 * @since       2025-01-07
 * @author      SalamBot Team
 * @license     MIT
 * 
 * @todo        Implémenter l'intégration avec Kong Gateway
 * @todo        Ajouter l'authentification
 * @todo        Implémenter la gestion des erreurs
 * @todo        Ajouter les logs
 */

import type { NextApiRequest, NextApiResponse } from 'next';

/**
 * Endpoint /api/chat
 * 
 * Cette version sera intégrée avec Kong Gateway pour router
 * les requêtes vers les services backend appropriés.
 * 
 * @param req - Requête HTTP
 * @param res - Réponse HTTP
 */
export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Vérification de la méthode HTTP
  if (req.method !== 'POST') {
    return res.status(405).end('Method Not Allowed');
  }

  // Extraction du message
  const { message } = req.body;

  // Validation basique
  if (!message || typeof message !== 'string') {
    return res.status(400).json({
      reply: 'Erreur: Le message est requis et doit être une chaîne de caractères.',
      lang: 'fr'
    });
  }

  // TODO: Intégrer avec Kong Gateway
  // Pour l'instant, retourner une réponse temporaire
  res.status(503).json({
    error: 'Service temporairement indisponible',
    message: 'L\'intégration avec Kong Gateway est en cours de développement.',
    lang: 'fr'
  });
}
