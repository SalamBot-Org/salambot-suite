/**
 * @file        Vérification de signature pour les webhooks WhatsApp de SalamBot.
 * @author      SalamBot Team (contact: info@salambot.ma)
 * @created     2025-05-22
 * @updated     2025-05-22
 * @project     SalamBot - AI CRM for Moroccan SMEs
 */

import crypto from 'crypto';

/**
 * Vérifie la signature HMAC SHA256 d'un webhook WhatsApp
 * 
 * @param signature - La signature X-Hub-Signature-256 fournie par Meta
 * @param body - Le corps de la requête en format brut (Buffer ou string)
 * @param appSecret - Le secret d'application WhatsApp Business API
 * @returns boolean - true si la signature est valide, false sinon
 */
export function verifySignature(
  signature: string | undefined,
  body: Buffer | string,
  appSecret: string
): boolean {
  // Si la signature est absente, la vérification échoue
  if (!signature) {
    return false;
  }

  // Vérifier que la signature commence par "sha256="
  if (!signature.startsWith('sha256=')) {
    return false;
  }

  // Extraire la valeur de la signature après "sha256="
  const signatureValue = signature.slice(7); // Longueur de "sha256="

  // Calculer le HMAC SHA256 du corps avec le secret d'application
  const hmac = crypto.createHmac('sha256', appSecret);
  hmac.update(body);
  const expectedSignature = hmac.digest('hex');

  // Comparer la signature calculée avec celle fournie (comparaison sécurisée)
  return crypto.timingSafeEqual(
    Buffer.from(signatureValue, 'hex'),
    Buffer.from(expectedSignature, 'hex')
  );
}
