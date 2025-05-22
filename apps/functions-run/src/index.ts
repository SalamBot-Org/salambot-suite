/**
 * @file        Point d'entrée principal du service Cloud Run SalamBot avec authentification.
 * @author      SalamBot Team (contact: info@salambot.ma)
 * @created     2025-05-21
 * @updated     2025-05-22
 * @project     SalamBot - AI CRM for Moroccan SMEs
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import { logger } from './utils/logger';
import { chatRouter } from './routes/chat';
import { initTracing } from './utils/tracing';
import { authRouter } from './routes/auth';
import { historyRouter } from './routes/history';
import { statsRouter } from './routes/stats';
import { jwtMiddleware } from './auth';

// Charger les variables d'environnement
dotenv.config();

// Initialiser le tracing OpenTelemetry
initTracing();

// Créer l'application Express
const app = express();
const port = process.env.PORT || 3010;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGINS?.split(',') || '*',
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Logging des requêtes
app.use((req, res, next) => {
  logger.info({
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  }, 'Requête entrante');
  next();
});

// Routes publiques
app.use('/auth', authRouter);

// Route de santé
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes protégées
app.use('/chat', jwtMiddleware, chatRouter);
app.use('/history', jwtMiddleware, historyRouter);
app.use('/stats', jwtMiddleware, statsRouter);

// Gestionnaire d'erreurs global
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error({ err, method: req.method, url: req.url }, 'Erreur serveur');
  
  // Gestion des erreurs d'authentification
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ 
      error: 'Authentification requise',
      message: 'Veuillez vous connecter pour accéder à cette ressource'
    });
  }
  
  res.status(500).json({ error: 'Erreur serveur', message: err.message });
});

// Démarrer le serveur
if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    logger.info(`SalamBot Functions-Run démarré sur le port ${port}`);
  });
}

export default app;
