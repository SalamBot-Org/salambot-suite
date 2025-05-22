/**
 * @file        Téléchargement des médias audio WhatsApp pour SalamBot.
 * @author      SalamBot Team (contact: info@salambot.ma)
 * @created     2025-05-22
 * @updated     2025-05-22
 * @project     SalamBot - AI CRM for Moroccan SMEs
 */

import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { trace } from '@opentelemetry/api';
import { v4 as uuidv4 } from 'uuid';

// Tracer pour le composant WhatsApp
const tracer = trace.getTracer('salambot.connectors.whatsapp');

/**
 * Télécharge un fichier audio WhatsApp à partir de son ID
 * 
 * @param audioId - ID du média audio WhatsApp
 * @returns Promise<string> - Chemin local du fichier téléchargé
 */
export async function downloadAudioMedia(audioId: string): Promise<string> {
  const span = tracer.startSpan('wa.audio.download');
  span.setAttribute('wa.audio.id', audioId);
  
  try {
    // Récupérer les variables d'environnement nécessaires
    const accessToken = process.env.WA_ACCESS_TOKEN;
    
    if (!accessToken) {
      throw new Error('Missing required environment variable: WA_ACCESS_TOKEN');
    }
    
    // Construire l'URL de l'API WhatsApp pour récupérer les métadonnées du média
    const mediaUrl = `https://graph.facebook.com/v17.0/${audioId}`;
    
    // Récupérer les métadonnées du média
    const mediaResponse = await axios.get(mediaUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    // Vérifier que la réponse contient une URL de média
    if (!mediaResponse.data || !mediaResponse.data.url) {
      throw new Error('Media URL not found in response');
    }
    
    // Récupérer l'URL du média
    const downloadUrl = mediaResponse.data.url;
    span.setAttribute('wa.audio.download_url', 'present'); // Ne pas logger l'URL complète pour des raisons de sécurité
    
    // Télécharger le fichier audio
    const audioResponse = await axios.get(downloadUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      },
      responseType: 'arraybuffer'
    });
    
    // Déterminer le répertoire de stockage
    const storageDir = process.env.WA_AUDIO_STORAGE_DIR || '/tmp/wa-audio';
    
    // Créer le répertoire s'il n'existe pas
    if (!fs.existsSync(storageDir)) {
      fs.mkdirSync(storageDir, { recursive: true });
    }
    
    // Générer un nom de fichier unique
    const fileName = `${audioId}-${uuidv4()}.ogg`;
    const filePath = path.join(storageDir, fileName);
    
    // Écrire le fichier audio
    fs.writeFileSync(filePath, Buffer.from(audioResponse.data));
    
    span.setAttribute('wa.audio.download.success', true);
    span.setAttribute('wa.audio.file_path', filePath);
    span.setAttribute('wa.audio.file_size', audioResponse.data.length);
    span.end();
    
    return filePath;
  } catch (error) {
    span.setAttribute('wa.audio.download.success', false);
    span.setAttribute('wa.audio.download.error', error instanceof Error ? error.message : 'unknown');
    span.end();
    
    throw error;
  }
}

/**
 * Simule le téléchargement vers un bucket S3 (pour préparation future)
 * 
 * @param localFilePath - Chemin local du fichier audio
 * @returns Promise<string> - URL S3 du fichier téléchargé
 */
export async function uploadToS3(localFilePath: string): Promise<string> {
  const span = tracer.startSpan('wa.audio.s3.upload');
  span.setAttribute('wa.audio.local_path', localFilePath);
  
  try {
    // Simuler un délai de téléchargement
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Générer une URL S3 simulée
    const fileName = path.basename(localFilePath);
    const s3Url = `s3://wa-audio/${fileName}`;
    
    span.setAttribute('wa.audio.s3.upload.success', true);
    span.setAttribute('wa.audio.s3.url', s3Url);
    span.end();
    
    return s3Url;
  } catch (error) {
    span.setAttribute('wa.audio.s3.upload.success', false);
    span.setAttribute('wa.audio.s3.upload.error', error instanceof Error ? error.message : 'unknown');
    span.end();
    
    throw error;
  }
}
