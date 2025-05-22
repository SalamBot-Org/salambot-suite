/**
 * @file        Route d'API pour les statistiques du dashboard SalamBot.
 * @author      SalamBot Team (contact: info@salambot.ma)
 * @created     2025-05-22
 * @updated     2025-05-22
 * @project     SalamBot - AI CRM for Moroccan SMEs
 */

import { Router, Request, Response } from 'express';
import { trace } from '@opentelemetry/api';
import { StatsService } from './service';
import { StatsPeriod, StatsGranularity, StatsQueryParams } from './types';
import { logger } from '../../utils/logger';
import { agentGuard } from '../../auth';

// Tracer pour le composant d'analyse
const tracer = trace.getTracer('salambot.analytics');

// Créer le routeur
const router = Router();

/**
 * Route pour obtenir les statistiques d'aperçu
 * GET /stats/overview
 */
router.get('/overview', agentGuard(), async (req: Request, res: Response) => {
  const span = tracer.startSpan('analytics.api.overview');
  
  try {
    // Extraire et valider les paramètres de la requête
    const period = (req.query.period as StatsPeriod) || StatsPeriod.LAST_7D;
    const granularity = (req.query.granularity as StatsGranularity) || StatsGranularity.DAILY;
    
    // Valider la période
    if (!Object.values(StatsPeriod).includes(period)) {
      span.setAttribute('analytics.error', 'Invalid period');
      span.end();
      return res.status(400).json({ error: 'Période invalide' });
    }
    
    // Valider la granularité
    if (!Object.values(StatsGranularity).includes(granularity)) {
      span.setAttribute('analytics.error', 'Invalid granularity');
      span.end();
      return res.status(400).json({ error: 'Granularité invalide' });
    }
    
    // Construire les paramètres de requête
    const params: StatsQueryParams = {
      period,
      granularity,
    };
    
    // Ajouter les dates personnalisées si nécessaire
    if (period === StatsPeriod.CUSTOM) {
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;
      
      if (!startDate || !endDate) {
        span.setAttribute('analytics.error', 'Missing dates for custom period');
        span.end();
        return res.status(400).json({ error: 'Dates requises pour une période personnalisée' });
      }
      
      params.startDate = startDate;
      params.endDate = endDate;
    }
    
    // Ajouter les filtres optionnels
    if (req.query.channels) {
      params.channels = (req.query.channels as string).split(',');
    }
    
    if (req.query.languages) {
      params.languages = (req.query.languages as string).split(',');
    }
    
    span.setAttributes({
      'analytics.query.period': params.period,
      'analytics.query.granularity': params.granularity,
    });
    
    // Obtenir les statistiques
    const { stats, cacheHit, computationTimeMs } = await StatsService.getOverviewStats(params);
    
    // Déterminer les dates de début et de fin en fonction de la période
    let startDate = new Date();
    let endDate = new Date();
    
    switch (period) {
      case StatsPeriod.LAST_24H:
        startDate.setDate(startDate.getDate() - 1);
        break;
      case StatsPeriod.LAST_7D:
        startDate.setDate(startDate.getDate() - 7);
        break;
      case StatsPeriod.LAST_30D:
        startDate.setDate(startDate.getDate() - 30);
        break;
      case StatsPeriod.CUSTOM:
        startDate = new Date(params.startDate!);
        endDate = new Date(params.endDate!);
        break;
    }
    
    // Construire la réponse
    const response = {
      stats,
      metadata: {
        period,
        granularity,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        generatedAt: new Date().toISOString(),
        cacheHit,
        computationTimeMs,
      },
    };
    
    span.setAttribute('analytics.cache_hit', cacheHit);
    span.setAttribute('analytics.computation_time_ms', computationTimeMs);
    span.end();
    
    // Envoyer la réponse
    res.status(200).json(response);
    
  } catch (error) {
    logger.error({ error }, 'Erreur lors de la récupération des statistiques');
    
    span.setAttribute('analytics.error', error instanceof Error ? error.message : 'Unknown error');
    span.end();
    
    res.status(500).json({ error: 'Erreur lors de la récupération des statistiques' });
  }
});

export const statsRouter = router;
