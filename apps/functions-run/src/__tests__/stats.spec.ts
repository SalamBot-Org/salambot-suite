/**
 * @file        Tests pour l'API de statistiques du dashboard SalamBot.
 * @author      SalamBot Team (contact: info@salambot.ma)
 * @created     2025-05-22
 * @updated     2025-05-22
 * @project     SalamBot - AI CRM for Moroccan SMEs
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../index';
import { StatsService } from '../routes/stats/service';
import { StatsPeriod, StatsGranularity } from '../routes/stats/types';

// Mock du service d'authentification
vi.mock('../auth', () => ({
  agentGuard: () => (req, res, next) => next(),
  jwtMiddleware: (req, res, next) => {
    req.user = { id: 'test-user', email: 'test@example.com', roles: ['agent'] };
    next();
  },
}));

// Mock du service de statistiques
vi.mock('../routes/stats/service', () => ({
  StatsService: {
    getOverviewStats: vi.fn(),
  },
}));

// Mock des données de statistiques
const mockStats = {
  stats: {
    totalConversations: 123,
    totalMessages: 567,
    byStatus: { open: 20, resolved: 90, escalated: 13 },
    byLanguage: { fr: 60, ar: 40, 'ar-ma': 23 },
    byChannel: { web: 80, whatsapp: 43 },
    sla: {
      firstResponseTimeP50: 15000, // 15s
      firstResponseTimeP90: 45000, // 45s
      resolutionTimeP50: 180000, // 3min
      resolutionTimeP90: 600000, // 10min
    },
    escalationRate: 13 / 123,
    timeSeries: {
      conversations: [
        { timestamp: '2025-05-21T00:00:00Z', count: 15 },
        { timestamp: '2025-05-22T00:00:00Z', count: 25 },
      ],
      messages: [
        { timestamp: '2025-05-21T00:00:00Z', count: 70 },
        { timestamp: '2025-05-22T00:00:00Z', count: 110 },
      ],
    },
  },
  cacheHit: false,
  computationTimeMs: 123,
};

describe('API de statistiques', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock de la réponse du service
    StatsService.getOverviewStats.mockResolvedValue(mockStats);
  });

  it('retourne les statistiques d\'aperçu avec les paramètres par défaut', async () => {
    const response = await request(app)
      .get('/stats/overview')
      .expect('Content-Type', /json/)
      .expect(200);

    // Vérifier que le service est appelé avec les bons paramètres
    expect(StatsService.getOverviewStats).toHaveBeenCalledWith({
      period: StatsPeriod.LAST_7D,
      granularity: StatsGranularity.DAILY,
    });

    // Vérifier la structure de la réponse
    expect(response.body).toHaveProperty('stats');
    expect(response.body).toHaveProperty('metadata');
    expect(response.body.stats).toHaveProperty('totalConversations', 123);
    expect(response.body.stats).toHaveProperty('totalMessages', 567);
    expect(response.body.stats).toHaveProperty('byStatus');
    expect(response.body.stats).toHaveProperty('byLanguage');
    expect(response.body.stats).toHaveProperty('byChannel');
    expect(response.body.stats).toHaveProperty('sla');
    expect(response.body.stats).toHaveProperty('escalationRate');
    expect(response.body.stats).toHaveProperty('timeSeries');
    expect(response.body.metadata).toHaveProperty('period', StatsPeriod.LAST_7D);
    expect(response.body.metadata).toHaveProperty('granularity', StatsGranularity.DAILY);
    expect(response.body.metadata).toHaveProperty('startDate');
    expect(response.body.metadata).toHaveProperty('endDate');
    expect(response.body.metadata).toHaveProperty('generatedAt');
    expect(response.body.metadata).toHaveProperty('cacheHit', false);
    expect(response.body.metadata).toHaveProperty('computationTimeMs', 123);
  });

  it('retourne les statistiques d\'aperçu avec des paramètres personnalisés', async () => {
    const response = await request(app)
      .get('/stats/overview?period=last_24h&granularity=hourly')
      .expect('Content-Type', /json/)
      .expect(200);

    // Vérifier que le service est appelé avec les bons paramètres
    expect(StatsService.getOverviewStats).toHaveBeenCalledWith({
      period: StatsPeriod.LAST_24H,
      granularity: StatsGranularity.HOURLY,
    });

    // Vérifier la structure de la réponse
    expect(response.body).toHaveProperty('stats');
    expect(response.body).toHaveProperty('metadata');
    expect(response.body.metadata).toHaveProperty('period', StatsPeriod.LAST_24H);
    expect(response.body.metadata).toHaveProperty('granularity', StatsGranularity.HOURLY);
  });

  it('retourne une erreur 400 pour une période invalide', async () => {
    await request(app)
      .get('/stats/overview?period=invalid')
      .expect('Content-Type', /json/)
      .expect(400);

    // Vérifier que le service n'est pas appelé
    expect(StatsService.getOverviewStats).not.toHaveBeenCalled();
  });

  it('retourne une erreur 400 pour une granularité invalide', async () => {
    await request(app)
      .get('/stats/overview?granularity=invalid')
      .expect('Content-Type', /json/)
      .expect(400);

    // Vérifier que le service n'est pas appelé
    expect(StatsService.getOverviewStats).not.toHaveBeenCalled();
  });

  it('retourne une erreur 400 pour une période personnalisée sans dates', async () => {
    await request(app)
      .get('/stats/overview?period=custom')
      .expect('Content-Type', /json/)
      .expect(400);

    // Vérifier que le service n'est pas appelé
    expect(StatsService.getOverviewStats).not.toHaveBeenCalled();
  });

  it('retourne une erreur 500 en cas d\'échec du service', async () => {
    // Simuler une erreur
    StatsService.getOverviewStats.mockRejectedValue(new Error('Erreur de service'));

    await request(app)
      .get('/stats/overview')
      .expect('Content-Type', /json/)
      .expect(500);
  });
});
