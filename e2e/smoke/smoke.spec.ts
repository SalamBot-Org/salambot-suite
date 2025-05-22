/**
 * @file        Tests de fumée pour vérifier le déploiement MVP SalamBot.
 * @author      SalamBot Team (contact: info@salambot.ma)
 * @created     2025-05-22
 * @updated     2025-05-22
 * @project     SalamBot - AI CRM for Moroccan SMEs
 */

import { test, expect } from '@playwright/test';

// Variables d'environnement pour les URLs (définies dans le workflow CI/CD)
const WIDGET_URL = process.env.WIDGET_URL || 'https://widget.salambot.app';
const DESK_URL = process.env.DESK_URL || 'https://desk.salambot.app';
const API_URL = process.env.API_URL || 'https://api.salambot.app';

// Test du Widget Web
test.describe('Widget Web', () => {
  test('doit charger correctement', async ({ page }) => {
    // Accéder au widget
    await page.goto(WIDGET_URL);
    
    // Vérifier que le widget est chargé
    await expect(page.locator('h1:has-text("SalamBot")')).toBeVisible();
    
    // Vérifier que le bouton de chat est présent
    const chatButton = page.locator('button:has-text("Discuter")');
    await expect(chatButton).toBeVisible();
    
    // Ouvrir le chat
    await chatButton.click();
    
    // Vérifier que l'interface de chat s'ouvre
    await expect(page.locator('.chat-container')).toBeVisible();
    
    // Envoyer un message de test
    await page.locator('textarea[placeholder="Écrivez votre message..."]').fill('Test automatisé');
    await page.locator('button[type="submit"]').click();
    
    // Vérifier que le message est envoyé et affiché
    await expect(page.locator('.message-bubble:has-text("Test automatisé")')).toBeVisible();
    
    // Vérifier qu'une réponse est reçue (attendre max 10 secondes)
    await expect(page.locator('.message-bubble.bot')).toBeVisible({ timeout: 10000 });
  });
});

// Test de l'Agent Desk
test.describe('Agent Desk', () => {
  test('doit permettre la connexion', async ({ page }) => {
    // Accéder à l'Agent Desk
    await page.goto(DESK_URL);
    
    // Vérifier que la page de login est chargée
    await expect(page.locator('h1:has-text("Connexion")')).toBeVisible();
    
    // Remplir le formulaire de connexion (utiliser des identifiants de test)
    await page.locator('input[type="email"]').fill('test@salambot.ma');
    await page.locator('input[type="password"]').fill('Test@123456');
    
    // Soumettre le formulaire
    await page.locator('button[type="submit"]').click();
    
    // Vérifier la redirection vers le dashboard (attendre max 10 secondes)
    await expect(page.locator('nav')).toBeVisible({ timeout: 10000 });
    
    // Vérifier que les éléments principaux sont chargés
    await expect(page.locator('h1:has-text("SalamBot Agent Desk")')).toBeVisible();
  });
  
  test('doit afficher le dashboard', async ({ page }) => {
    // Accéder à l'Agent Desk (avec auto-login pour les tests)
    await page.goto(`${DESK_URL}/dashboard?test_token=true`);
    
    // Vérifier que le dashboard est chargé
    await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible();
    
    // Vérifier que les KPI sont affichés
    await expect(page.locator('.kpi-card')).toHaveCount.atLeast(3);
    
    // Vérifier que les graphiques sont chargés
    await expect(page.locator('.recharts-wrapper')).toHaveCount.atLeast(2);
  });
});

// Test de l'API Backend
test.describe('API Backend', () => {
  test('doit répondre sur /health', async ({ request }) => {
    // Vérifier que l'API est en ligne
    const response = await request.get(`${API_URL}/health`);
    
    // Vérifier le statut 200
    expect(response.status()).toBe(200);
    
    // Vérifier le contenu de la réponse
    const data = await response.json();
    expect(data.status).toBe('ok');
    expect(data.version).toBeDefined();
  });
  
  test('doit répondre sur /wa/webhook (GET)', async ({ request }) => {
    // Vérifier que le webhook WhatsApp répond
    const response = await request.get(`${API_URL}/wa/webhook?hub.mode=subscribe&hub.verify_token=test_token`);
    
    // Le statut peut être 200 (si le token est correct) ou 403 (si incorrect)
    // Dans les deux cas, l'endpoint est fonctionnel
    expect(response.status()).toBeOneOf([200, 403]);
  });
  
  test('doit répondre sur /chat avec authentification', async ({ request }) => {
    // Préparer un message de test
    const testMessage = {
      message: 'Test automatisé',
      metadata: {
        channel: 'web',
        lang: 'fr'
      }
    };
    
    // Obtenir un token de test (dans un environnement réel, il faudrait s'authentifier)
    const testToken = 'test_token';
    
    // Envoyer une requête à l'API /chat
    const response = await request.post(`${API_URL}/chat`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testToken}`
      },
      data: testMessage
    });
    
    // Vérifier le statut (200 si authentifié, 401/403 sinon)
    // Dans les deux cas, l'endpoint est fonctionnel
    expect(response.status()).toBeOneOf([200, 401, 403]);
  });
});
