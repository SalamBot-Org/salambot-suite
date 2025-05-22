/**
 * @file        Service d'API pour le dashboard analytique de l'Agent Desk SalamBot.
 * @author      SalamBot Team (contact: info@salambot.ma)
 * @created     2025-05-22
 * @updated     2025-05-22
 * @project     SalamBot - AI CRM for Moroccan SMEs
 */

import { trace } from '@opentelemetry/api';
import { StatsPeriod, StatsGranularity, StatsOverviewResponse } from '../types/stats';

// URL de l'API
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3010';

// Tracer pour le composant d'analyse
const tracer = trace.getTracer('salambot.agent-desk');

/**
 * Service pour récupérer les statistiques depuis l'API
 */
export const StatsService = {
  /**
   * Récupère les statistiques d'aperçu
   * @param period Période d'agrégation
   * @param granularity Granularité des séries temporelles
   * @returns Réponse de l'API avec les statistiques
   */
  async getOverviewStats(
    period: StatsPeriod = StatsPeriod.LAST_7D,
    granularity: StatsGranularity = StatsGranularity.DAILY
  ): Promise<StatsOverviewResponse> {
    const span = tracer.startSpan('analytics.fetch.start');
    span.setAttributes({
      'analytics.query.period': period,
      'analytics.query.granularity': granularity,
    });
    
    try {
      // Construire l'URL avec les paramètres
      const url = new URL(`${API_URL}/stats/overview`);
      url.searchParams.append('period', period);
      url.searchParams.append('granularity', granularity);
      
      // Faire la requête
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important pour les cookies d'authentification
      });
      
      // Vérifier la réponse
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erreur lors de la récupération des statistiques');
      }
      
      // Récupérer les données
      const data: StatsOverviewResponse = await response.json();
      
      // Tracer le succès
      span.setAttribute('analytics.fetch.success', true);
      span.setAttribute('analytics.cache_hit', data.metadata.cacheHit);
      span.setAttribute('analytics.computation_time_ms', data.metadata.computationTimeMs);
      span.end();
      
      return data;
    } catch (error) {
      // Tracer l'échec
      span.setAttribute('analytics.fetch.success', false);
      span.setAttribute('analytics.error', error instanceof Error ? error.message : 'Unknown error');
      span.end();
      
      // Tracer l'échec spécifique
      const failSpan = tracer.startSpan('analytics.fetch.fail');
      failSpan.setAttribute('analytics.query.period', period);
      failSpan.setAttribute('analytics.error', error instanceof Error ? error.message : 'Unknown error');
      failSpan.end();
      
      throw error;
    }
  },
};
