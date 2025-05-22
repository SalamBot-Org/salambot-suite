/**
 * @file        Tests pour le dashboard analytique de l'Agent Desk SalamBot.
 * @author      SalamBot Team (contact: info@salambot.ma)
 * @created     2025-05-22
 * @updated     2025-05-22
 * @project     SalamBot - AI CRM for Moroccan SMEs
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import DashboardPage from '../pages/DashboardPage';
import { StatsService } from '../services/statsService';
import { StatsPeriod, StatsGranularity } from '../types/stats';

// Mock du service d'authentification
vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'test-user', email: 'test@example.com', roles: ['agent'] },
    hasAnyRole: () => true,
  }),
}));

// Mock du service de statistiques
vi.mock('../services/statsService', () => ({
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
  metadata: {
    period: StatsPeriod.LAST_7D,
    granularity: StatsGranularity.DAILY,
    startDate: '2025-05-15T00:00:00Z',
    endDate: '2025-05-22T00:00:00Z',
    generatedAt: '2025-05-22T14:30:00Z',
    cacheHit: false,
    computationTimeMs: 123,
  },
};

// Mock de Recharts pour les tests
vi.mock('recharts', () => {
  const OriginalModule = vi.importActual('recharts');
  return {
    ...OriginalModule,
    ResponsiveContainer: ({ children }) => <div data-testid="responsive-container">{children}</div>,
    BarChart: ({ children }) => <div data-testid="bar-chart">{children}</div>,
    PieChart: ({ children }) => <div data-testid="pie-chart">{children}</div>,
    LineChart: ({ children }) => <div data-testid="line-chart">{children}</div>,
    Bar: () => <div data-testid="bar"></div>,
    Pie: () => <div data-testid="pie"></div>,
    Line: () => <div data-testid="line"></div>,
    XAxis: () => <div data-testid="x-axis"></div>,
    YAxis: () => <div data-testid="y-axis"></div>,
    CartesianGrid: () => <div data-testid="cartesian-grid"></div>,
    Tooltip: () => <div data-testid="tooltip"></div>,
    Legend: () => <div data-testid="legend"></div>,
    Cell: () => <div data-testid="cell"></div>,
  };
});

// Mock de Framer Motion pour les tests
vi.mock('framer-motion', () => {
  const OriginalModule = vi.importActual('framer-motion');
  return {
    ...OriginalModule,
    motion: {
      div: ({ children, ...props }) => <div data-testid="motion-div" {...props}>{children}</div>,
    },
  };
});

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock de la réponse du service
    StatsService.getOverviewStats.mockResolvedValue(mockStats);
  });

  it('affiche les cartes KPI avec les bonnes valeurs', async () => {
    render(
      <BrowserRouter>
        <DashboardPage />
      </BrowserRouter>
    );

    // Vérifier que les cartes KPI sont affichées avec les bonnes valeurs
    await waitFor(() => {
      expect(screen.getByText('Conversations totales')).toBeInTheDocument();
      expect(screen.getByText('123')).toBeInTheDocument();
      expect(screen.getByText('Messages échangés')).toBeInTheDocument();
      expect(screen.getByText('567')).toBeInTheDocument();
      expect(screen.getByText('Taux d\'escalade')).toBeInTheDocument();
      expect(screen.getByText('11%')).toBeInTheDocument();
      expect(screen.getByText('SLA Réponse (p90)')).toBeInTheDocument();
      expect(screen.getByText('45s')).toBeInTheDocument();
    });
  });

  it('affiche les graphiques avec les bonnes données', async () => {
    render(
      <BrowserRouter>
        <DashboardPage />
      </BrowserRouter>
    );

    // Vérifier que les graphiques sont affichés
    await waitFor(() => {
      expect(screen.getByText('Volume de conversations')).toBeInTheDocument();
      expect(screen.getByText('Répartition par langue')).toBeInTheDocument();
      expect(screen.getByText('Répartition par canal')).toBeInTheDocument();
      expect(screen.getByText('Statut des conversations')).toBeInTheDocument();
      
      // Vérifier les composants Recharts
      expect(screen.getAllByTestId('bar-chart').length).toBeGreaterThan(0);
      expect(screen.getAllByTestId('pie-chart').length).toBeGreaterThan(0);
    });
  });

  it('affiche un message d\'erreur en cas d\'échec de chargement', async () => {
    // Simuler une erreur
    StatsService.getOverviewStats.mockRejectedValue(new Error('Erreur de chargement'));

    render(
      <BrowserRouter>
        <DashboardPage />
      </BrowserRouter>
    );

    // Vérifier que le message d'erreur est affiché
    await waitFor(() => {
      expect(screen.getByText('Erreur de chargement')).toBeInTheDocument();
    });
  });

  it('affiche les animations Framer Motion', async () => {
    render(
      <BrowserRouter>
        <DashboardPage />
      </BrowserRouter>
    );

    // Vérifier que les composants animés sont présents
    await waitFor(() => {
      expect(screen.getAllByTestId('motion-div').length).toBeGreaterThan(0);
    });
  });

  it('appelle le service avec les bons paramètres', async () => {
    render(
      <BrowserRouter>
        <DashboardPage />
      </BrowserRouter>
    );

    // Vérifier que le service est appelé avec les bons paramètres
    await waitFor(() => {
      expect(StatsService.getOverviewStats).toHaveBeenCalledWith(StatsPeriod.LAST_7D);
    });
  });
});
