/**
 * @file        Types pour les statistiques et métriques du dashboard SalamBot.
 * @author      SalamBot Team (contact: info@salambot.ma)
 * @created     2025-05-22
 * @updated     2025-05-22
 * @project     SalamBot - AI CRM for Moroccan SMEs
 */

/**
 * Période d'agrégation pour les statistiques
 */
export enum StatsPeriod {
  LAST_24H = 'last_24h',
  LAST_7D = 'last_7d',
  LAST_30D = 'last_30d',
  CUSTOM = 'custom'
}

/**
 * Granularité pour les séries temporelles
 */
export enum StatsGranularity {
  HOURLY = 'hourly',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly'
}

/**
 * Statistiques globales des conversations
 */
export interface ConversationStats {
  // Totaux
  totalConversations: number;
  totalMessages: number;
  
  // Répartition par statut
  byStatus: {
    open: number;
    resolved: number;
    escalated: number;
  };
  
  // Répartition par langue
  byLanguage: {
    fr: number;
    ar: number;
    'ar-ma': number; // darija
  };
  
  // Répartition par canal
  byChannel: {
    web: number;
    whatsapp: number;
    [key: string]: number; // autres canaux
  };
  
  // Métriques SLA
  sla: {
    firstResponseTimeP50: number; // médiane en ms
    firstResponseTimeP90: number; // 90e percentile en ms
    resolutionTimeP50: number; // médiane en ms
    resolutionTimeP90: number; // 90e percentile en ms
  };
  
  // Taux d'escalade
  escalationRate: number; // pourcentage
  
  // Séries temporelles
  timeSeries: {
    // Conversations par période
    conversations: Array<{
      timestamp: string;
      count: number;
    }>;
    
    // Messages par période
    messages: Array<{
      timestamp: string;
      count: number;
    }>;
  };
}

/**
 * Paramètres de requête pour les statistiques
 */
export interface StatsQueryParams {
  period: StatsPeriod;
  granularity?: StatsGranularity;
  startDate?: string; // format ISO pour période personnalisée
  endDate?: string; // format ISO pour période personnalisée
  channels?: string[]; // filtrer par canaux spécifiques
  languages?: string[]; // filtrer par langues spécifiques
}

/**
 * Réponse de l'API pour les statistiques d'aperçu
 */
export interface StatsOverviewResponse {
  stats: ConversationStats;
  metadata: {
    period: StatsPeriod;
    granularity: StatsGranularity;
    startDate: string; // format ISO
    endDate: string; // format ISO
    generatedAt: string; // format ISO
    cacheHit: boolean;
    computationTimeMs: number;
  };
}
