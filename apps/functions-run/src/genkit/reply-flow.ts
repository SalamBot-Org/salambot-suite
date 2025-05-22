/**
 * @file        Flow principal Genkit pour la génération de réponses IA.
 * @author      SalamBot Team (contact: info@salambot.ma)
 * @created     2025-05-22
 * @updated     2025-05-22
 * @project     SalamBot - AI CRM for Moroccan SMEs
 */

import { trace } from '@opentelemetry/api';
import { ReplyFlowInput, ReplyFlowResult, ModelType } from './types';
import { selectModelForLanguage, redisConfig } from './flows.config';
import axios from 'axios';
import Redis from 'ioredis';

// Tracer pour le composant Genkit
const tracer = trace.getTracer('salambot.genkit');

// Client Redis pour le cache (initialisé si activé)
let redisClient: Redis | null = null;

if (redisConfig.enabled) {
  try {
    redisClient = new Redis({
      host: redisConfig.host,
      port: redisConfig.port
    });
    console.log('Redis cache initialized for Genkit');
  } catch (error) {
    console.error('Failed to initialize Redis cache:', error);
    redisClient = null;
  }
}

/**
 * Exécute le flow de génération de réponse IA
 * 
 * @param input Paramètres d'entrée du flow
 * @returns Résultat du flow avec la réponse générée
 */
export async function runReplyFlow(input: ReplyFlowInput): Promise<ReplyFlowResult> {
  const span = tracer.startSpan('chat.llm.reply.flow');
  span.setAttribute('chat.llm.input.lang', input.lang);
  span.setAttribute('chat.llm.input.message_length', input.message.length);
  
  try {
    const startTime = Date.now();
    
    // Vérifier le cache si Redis est activé
    let cachedResult: ReplyFlowResult | null = null;
    
    if (redisClient && !input.forceModel) {
      const cacheKey = `genkit:reply:${Buffer.from(input.message).toString('base64')}:${input.lang}`;
      const cachedData = await redisClient.get(cacheKey);
      
      if (cachedData) {
        try {
          cachedResult = JSON.parse(cachedData);
          span.setAttribute('chat.llm.cache.hit', true);
        } catch (error) {
          console.error('Failed to parse cached data:', error);
        }
      }
    }
    
    // Si résultat en cache, le retourner directement
    if (cachedResult) {
      span.setAttribute('chat.llm.reply.model', cachedResult.modelUsed);
      span.setAttribute('chat.llm.reply.latency', cachedResult.latency);
      span.setAttribute('chat.llm.reply.cached', true);
      span.end();
      
      return {
        ...cachedResult,
        cached: true
      };
    }
    
    // Sélectionner le modèle approprié
    const modelConfig = selectModelForLanguage(input.lang, input.forceModel);
    span.setAttribute('chat.llm.model.selected', modelConfig.id);
    span.setAttribute('chat.llm.model.provider', modelConfig.provider);
    
    // Préparer le prompt avec le message de l'utilisateur
    const prompt = modelConfig.promptTemplate.replace('{{message}}', input.message);
    
    // Appeler l'API du modèle sélectionné
    let reply: string;
    
    switch (modelConfig.provider) {
      case 'vertexai':
        reply = await callVertexAI(modelConfig.modelName, prompt, modelConfig.temperature, modelConfig.maxTokens);
        break;
      case 'openai':
        reply = await callOpenAI(modelConfig.modelName, prompt, modelConfig.temperature, modelConfig.maxTokens);
        break;
      case 'local':
        reply = await callLocalModel(modelConfig.modelName, prompt, modelConfig.temperature, modelConfig.maxTokens);
        break;
      default:
        throw new Error(`Unsupported provider: ${modelConfig.provider}`);
    }
    
    const latency = Date.now() - startTime;
    
    // Préparer le résultat
    const result: ReplyFlowResult = {
      reply,
      lang: input.lang,
      modelUsed: modelConfig.id as ModelType,
      latency
    };
    
    // Mettre en cache si Redis est activé
    if (redisClient && !input.forceModel) {
      const cacheKey = `genkit:reply:${Buffer.from(input.message).toString('base64')}:${input.lang}`;
      await redisClient.set(cacheKey, JSON.stringify(result), 'EX', redisConfig.ttl);
    }
    
    // Ajouter les attributs au span
    span.setAttribute('chat.llm.reply.length', reply.length);
    span.setAttribute('chat.llm.reply.latency', latency);
    span.setAttribute('chat.llm.reply.success', true);
    span.end();
    
    return result;
  } catch (error) {
    // Ajouter l'erreur au span
    span.setAttribute('chat.llm.reply.success', false);
    span.setAttribute('chat.llm.reply.error', error instanceof Error ? error.message : 'Unknown error');
    span.end();
    
    // Retourner une réponse d'erreur
    return {
      reply: getErrorReply(input.lang),
      lang: input.lang,
      modelUsed: 'fallback',
      latency: 0
    };
  }
}

/**
 * Appelle l'API Vertex AI (Gemini)
 */
async function callVertexAI(model: string, prompt: string, temperature: number, maxTokens: number): Promise<string> {
  const span = tracer.startSpan('chat.llm.vertexai.call');
  
  try {
    // URL de l'API Vertex AI (simulée pour cette PR)
    const apiUrl = process.env.VERTEXAI_API_URL || 'http://localhost:3020/genkit/vertexai';
    
    // Appeler l'API
    const response = await axios.post(apiUrl, {
      model,
      prompt,
      temperature,
      maxTokens
    });
    
    span.setAttribute('chat.llm.vertexai.success', true);
    span.end();
    
    return response.data.text;
  } catch (error) {
    span.setAttribute('chat.llm.vertexai.success', false);
    span.setAttribute('chat.llm.vertexai.error', error instanceof Error ? error.message : 'Unknown error');
    span.end();
    
    throw error;
  }
}

/**
 * Appelle l'API OpenAI (Llama via OpenAI API)
 */
async function callOpenAI(model: string, prompt: string, temperature: number, maxTokens: number): Promise<string> {
  const span = tracer.startSpan('chat.llm.openai.call');
  
  try {
    // URL de l'API OpenAI (simulée pour cette PR)
    const apiUrl = process.env.OPENAI_API_URL || 'http://localhost:3020/genkit/openai';
    
    // Appeler l'API
    const response = await axios.post(apiUrl, {
      model,
      prompt,
      temperature,
      max_tokens: maxTokens
    });
    
    span.setAttribute('chat.llm.openai.success', true);
    span.end();
    
    return response.data.choices[0].text;
  } catch (error) {
    span.setAttribute('chat.llm.openai.success', false);
    span.setAttribute('chat.llm.openai.error', error instanceof Error ? error.message : 'Unknown error');
    span.end();
    
    throw error;
  }
}

/**
 * Appelle un modèle local (pour développement/test)
 */
async function callLocalModel(model: string, prompt: string, temperature: number, maxTokens: number): Promise<string> {
  const span = tracer.startSpan('chat.llm.local.call');
  
  try {
    // URL de l'API locale (simulée pour cette PR)
    const apiUrl = process.env.LOCAL_MODEL_API_URL || 'http://localhost:3020/genkit/local';
    
    // Appeler l'API
    const response = await axios.post(apiUrl, {
      model,
      prompt,
      temperature,
      max_tokens: maxTokens
    });
    
    span.setAttribute('chat.llm.local.success', true);
    span.end();
    
    return response.data.text;
  } catch (error) {
    span.setAttribute('chat.llm.local.success', false);
    span.setAttribute('chat.llm.local.error', error instanceof Error ? error.message : 'Unknown error');
    span.end();
    
    throw error;
  }
}

/**
 * Retourne une réponse d'erreur en fonction de la langue
 */
function getErrorReply(lang: string): string {
  switch (lang) {
    case 'fr':
      return "Désolé, je rencontre actuellement des difficultés techniques. Puis-je te mettre en relation avec un agent humain ?";
    case 'ar':
      return "عذرًا، أواجه حاليًا صعوبات تقنية. هل يمكنني توصيلك بوكيل بشري؟";
    case 'ar-ma':
      return "smeh liya, kayn chi mochkil t9ni daba. wach n9der nweslek m3a chi agent?";
    default:
      return "Sorry, I'm currently experiencing technical difficulties. Can I connect you with a human agent?";
  }
}
