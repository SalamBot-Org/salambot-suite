/**
 * @file        Page de dashboard analytique pour l'Agent Desk SalamBot.
 * @author      SalamBot Team (contact: info@salambot.ma)
 * @created     2025-05-22
 * @updated     2025-05-22
 * @project     SalamBot - AI CRM for Moroccan SMEs
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { StatsService } from '../services/statsService';
import { StatsPeriod, StatsGranularity, StatsOverviewResponse } from '../types/stats';
import { Role } from '../types/auth';
import { trace } from '@opentelemetry/api';
import { BarChart, Bar, PieChart, Pie, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { motion } from 'framer-motion';

// Tracer pour le composant d'analyse
const tracer = trace.getTracer('salambot.agent-desk');

// Couleurs pour les graphiques
const COLORS = {
  primary: '#3b82f6',
  secondary: '#10b981',
  accent: '#f59e0b',
  danger: '#ef4444',
  success: '#22c55e',
  info: '#0ea5e9',
  warning: '#f97316',
  fr: '#3b82f6',
  ar: '#10b981',
  'ar-ma': '#f59e0b',
  web: '#0ea5e9',
  whatsapp: '#22c55e',
};

// Intervalle d'auto-refresh en ms (30 secondes)
const REFRESH_INTERVAL = 30 * 1000;

/**
 * Composant de carte KPI
 */
const KpiCard = ({ title, value, subtitle, icon, color = 'primary', isLoading = false }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 flex flex-col"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">{title}</h3>
        <span className={`text-${color}-500 bg-${color}-100 dark:bg-${color}-900 dark:bg-opacity-20 p-2 rounded-full`}>
          {icon}
        </span>
      </div>
      {isLoading ? (
        <div className="animate-pulse h-8 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
      ) : (
        <p className="text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
      )}
      {subtitle && <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{subtitle}</p>}
    </motion.div>
  );
};

/**
 * Composant de carte graphique
 */
const ChartCard = ({ title, children, isLoading = false }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6"
    >
      <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-4">{title}</h3>
      {isLoading ? (
        <div className="animate-pulse h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
      ) : (
        <div className="h-64">
          {children}
        </div>
      )}
    </motion.div>
  );
};

/**
 * Page principale du dashboard
 */
const DashboardPage = () => {
  // État pour les statistiques
  const [stats, setStats] = useState<StatsOverviewResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<StatsPeriod>(StatsPeriod.LAST_7D);
  
  // Accès au contexte d'authentification
  const { user, hasAnyRole } = useAuth();
  
  // Vérifier si l'utilisateur a accès au dashboard
  const hasAccess = hasAnyRole([Role.ADMIN, Role.AGENT]);
  
  // Fonction pour charger les statistiques
  const loadStats = useCallback(async () => {
    if (!hasAccess) return;
    
    const span = tracer.startSpan('analytics.dashboard.refresh');
    span.setAttribute('analytics.period', period);
    
    try {
      setIsLoading(true);
      setError(null);
      
      const data = await StatsService.getOverviewStats(period);
      setStats(data);
      
      span.setAttribute('analytics.success', true);
      span.end();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Erreur lors du chargement des statistiques');
      
      span.setAttribute('analytics.success', false);
      span.setAttribute('analytics.error', error instanceof Error ? error.message : 'Unknown error');
      span.end();
    } finally {
      setIsLoading(false);
    }
  }, [period, hasAccess]);
  
  // Charger les statistiques au chargement et lors des changements de période
  useEffect(() => {
    loadStats();
    
    // Configurer l'auto-refresh
    const intervalId = setInterval(() => {
      loadStats();
    }, REFRESH_INTERVAL);
    
    // Nettoyer l'intervalle lors du démontage
    return () => clearInterval(intervalId);
  }, [loadStats]);
  
  // Préparer les données pour les graphiques
  const prepareTimeSeriesData = () => {
    if (!stats) return [];
    
    return stats.stats.timeSeries.conversations.map(item => ({
      date: new Date(item.timestamp).toLocaleDateString(),
      conversations: item.count,
      messages: stats.stats.timeSeries.messages.find(msg => msg.timestamp === item.timestamp)?.count || 0,
    }));
  };
  
  const prepareLanguageData = () => {
    if (!stats) return [];
    
    return [
      { name: 'Français', value: stats.stats.byLanguage.fr, color: COLORS.fr },
      { name: 'Arabe', value: stats.stats.byLanguage.ar, color: COLORS.ar },
      { name: 'Darija', value: stats.stats.byLanguage['ar-ma'], color: COLORS['ar-ma'] },
    ];
  };
  
  const prepareChannelData = () => {
    if (!stats) return [];
    
    return Object.entries(stats.stats.byChannel).map(([key, value]) => ({
      name: key === 'web' ? 'Web' : key === 'whatsapp' ? 'WhatsApp' : key,
      value,
      color: COLORS[key] || COLORS.primary,
    }));
  };
  
  // Formater les durées SLA
  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ${seconds % 60}s`;
  };
  
  // Si l'utilisateur n'a pas accès, afficher un message
  if (!hasAccess) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Accès refusé</h2>
          <p className="text-gray-500 dark:text-gray-400">
            Vous n'avez pas les permissions nécessaires pour accéder au dashboard.
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard SalamBot</h1>
        
        <div className="flex space-x-2">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as StatsPeriod)}
            className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={StatsPeriod.LAST_24H}>Dernières 24h</option>
            <option value={StatsPeriod.LAST_7D}>7 derniers jours</option>
            <option value={StatsPeriod.LAST_30D}>30 derniers jours</option>
          </select>
          
          <button
            onClick={loadStats}
            className="bg-blue-500 hover:bg-blue-600 text-white rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Actualiser
          </button>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <p>{error}</p>
        </div>
      )}
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <KpiCard
          title="Conversations totales"
          value={stats?.stats.totalConversations || 0}
          subtitle={`${stats?.metadata.period === StatsPeriod.LAST_24H ? 'Dernières 24h' : stats?.metadata.period === StatsPeriod.LAST_7D ? '7 derniers jours' : '30 derniers jours'}`}
          icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" /></svg>}
          color="primary"
          isLoading={isLoading}
        />
        
        <KpiCard
          title="Messages échangés"
          value={stats?.stats.totalMessages || 0}
          subtitle={`${stats?.metadata.period === StatsPeriod.LAST_24H ? 'Dernières 24h' : stats?.metadata.period === StatsPeriod.LAST_7D ? '7 derniers jours' : '30 derniers jours'}`}
          icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" /><path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" /></svg>}
          color="info"
          isLoading={isLoading}
        />
        
        <KpiCard
          title="Taux d'escalade"
          value={`${stats ? Math.round(stats.stats.escalationRate * 100) : 0}%`}
          subtitle={`${stats?.stats.byStatus.escalated || 0} conversations escaladées`}
          icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-2 0c0 .993-.241 1.929-.668 2.754l-1.524-1.525a3.997 3.997 0 00.078-2.183l1.562-1.562C15.802 8.249 16 9.1 16 10zm-5.165 3.913l1.58 1.58A5.98 5.98 0 0110 16a5.976 5.976 0 01-2.516-.552l1.562-1.562a4.006 4.006 0 001.789.027zm-4.677-2.796a4.002 4.002 0 01-.041-2.08l-.08.08-1.53-1.533A5.98 5.98 0 004 10c0 .954.223 1.856.619 2.657l1.54-1.54zm1.088-6.45A5.974 5.974 0 0110 4c.954 0 1.856.223 2.657.619l-1.54 1.54a4.002 4.002 0 00-2.346.033L7.246 4.668zM12 10a2 2 0 11-4 0 2 2 0 014 0z" clipRule="evenodd" /></svg>}
          color="warning"
          isLoading={isLoading}
        />
        
        <KpiCard
          title="SLA Réponse (p90)"
          value={stats ? formatDuration(stats.stats.sla.firstResponseTimeP90) : '0s'}
          subtitle={`Médiane: ${stats ? formatDuration(stats.stats.sla.firstResponseTimeP50) : '0s'}`}
          icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" /></svg>}
          color="success"
          isLoading={isLoading}
        />
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <ChartCard title="Volume de conversations" isLoading={isLoading}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={prepareTimeSeriesData()}
              margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="conversations" name="Conversations" fill={COLORS.primary} />
              <Bar dataKey="messages" name="Messages" fill={COLORS.secondary} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        
        <ChartCard title="Répartition par langue" isLoading={isLoading}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={prepareLanguageData()}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {prepareLanguageData().map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Répartition par canal" isLoading={isLoading}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={prepareChannelData()}
              layout="vertical"
              margin={{ top: 10, right: 30, left: 50, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis type="category" dataKey="name" />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" name="Conversations" radius={[0, 4, 4, 0]}>
                {prepareChannelData().map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        
        <ChartCard title="Statut des conversations" isLoading={isLoading}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={[
                  { name: 'Ouvertes', value: stats?.stats.byStatus.open || 0, color: COLORS.info },
                  { name: 'Résolues', value: stats?.stats.byStatus.resolved || 0, color: COLORS.success },
                  { name: 'Escaladées', value: stats?.stats.byStatus.escalated || 0, color: COLORS.warning },
                ]}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {[
                  { name: 'Ouvertes', value: stats?.stats.byStatus.open || 0, color: COLORS.info },
                  { name: 'Résolues', value: stats?.stats.byStatus.resolved || 0, color: COLORS.success },
                  { name: 'Escaladées', value: stats?.stats.byStatus.escalated || 0, color: COLORS.warning },
                ].map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
      
      {/* Metadata */}
      {stats && (
        <div className="mt-6 text-xs text-gray-500 dark:text-gray-400">
          <p>
            Dernière mise à jour: {new Date(stats.metadata.generatedAt).toLocaleString()} 
            {stats.metadata.cacheHit && ' (cache)'} • 
            Temps de calcul: {stats.metadata.computationTimeMs}ms • 
            Période: {stats.metadata.startDate.substring(0, 10)} à {stats.metadata.endDate.substring(0, 10)}
          </p>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
