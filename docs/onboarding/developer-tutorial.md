# 🚀 Tutoriel Développeur - SalamBot Suite v2.1

## 📋 Vue d'ensemble

Ce tutoriel vous guide pas à pas pour configurer votre environnement de développement et contribuer efficacement au projet SalamBot Suite.

## 🌐 Architecture des Domaines

### **salambot.ma** - Site Vitrine
- **🎯 Usage** : Site marketing, landing pages, SEO local
- **👥 Audience** : Prospects, visiteurs, clients potentiels
- **📍 Contenu** : Présentation produit, pricing, blog, contact
- **🔗 Redirection** : Vers salambot.app pour accéder à l'application

### **salambot.app** - Écosystème Applicatif
- **🎯 Usage** : Application web complète et services techniques
- **👥 Audience** : Utilisateurs authentifiés, développeurs, équipes
- **📍 Services** :
  - `salambot.app` - Interface utilisateur principale
  - `api.salambot.app` - API REST et WebSocket
  - `docs.salambot.app` - Documentation technique
  - `grafana.salambot.app` - Monitoring et métriques

> **💡 Note pour les développeurs** : Lors du développement local, utilisez `localhost` avec les ports appropriés. En production, respectez cette séparation des domaines.

## 🎯 Objectifs d'apprentissage

À la fin de ce tutoriel, vous serez capable de :
- ✅ Configurer l'environnement de développement complet
- ✅ Comprendre l'architecture du monorepo Nx
- ✅ Développer et tester des fonctionnalités
- ✅ Utiliser le pipeline de détection Darija implémenté (70% précision)
- ✅ Contribuer selon les standards du projet

## 📚 Prérequis

### Connaissances techniques
- **JavaScript/TypeScript** : Niveau intermédiaire
- **Node.js** : Concepts de base
- **Git** : Commandes essentielles
- **Docker** : Notions de base (optionnel)

### Outils requis
- **Node.js** : v18.17.0+
- **pnpm** : v8.0.0+
- **Git** : v2.40.0+
- **VS Code** : Recommandé
- **Docker Desktop** : Pour les services locaux

## 🛠️ Configuration Environnement

### Étape 1 : Clonage du projet

```bash
# Cloner le repository
git clone https://github.com/salambot/salambot-suite.git
cd salambot-suite

# Vérifier les versions
node --version  # v18.17.0+
pnpm --version  # 8.0.0+
git --version   # 2.40.0+
```

### Étape 2 : Installation des dépendances

```bash
# Installer toutes les dépendances
pnpm install

# Vérifier l'installation
pnpm nx --version
```

### Étape 3 : Configuration VS Code

```bash
# Installer les extensions recommandées
code --install-extension ms-vscode.vscode-typescript-next
code --install-extension esbenp.prettier-vscode
code --install-extension ms-vscode.vscode-eslint
code --install-extension nrwl.angular-console

# Ouvrir le projet
code .
```

### Étape 4 : Services locaux

```bash
# Démarrer Redis et PostgreSQL
docker-compose up -d redis postgres

# Vérifier les services
docker ps
```

### Étape 5 : Variables d'environnement

```bash
# Copier les fichiers d'exemple
cp .env.example .env
cp apps/widget-web/.env.example apps/widget-web/.env.local
cp apps/agent-desk/.env.example apps/agent-desk/.env.local
cp apps/functions-run/.env.example apps/functions-run/.env.local

# Éditer les variables selon votre environnement
```

## 🏗️ Architecture du Monorepo

### Structure des dossiers

```
salambot-suite/
├── apps/                    # Applications
│   ├── widget-web/         # Widget chat client
│   ├── agent-desk/         # Interface agent
│   └── functions-run/      # API Backend
├── libs/                    # Bibliothèques partagées
│   ├── ui/                 # Composants UI
│   ├── auth/               # Authentification
│   ├── ai/                 # Intelligence artificielle
│   └── config/             # Configuration
├── docs/                    # Documentation
├── infra/                   # Infrastructure
└── tools/                   # Outils de développement
```

### Applications principales

| Application | Port | Description | Technologies |
|-------------|------|-------------|-------------|
| **widget-web** | 4200 | Widget chat client | Next.js, React, TailwindCSS |
| **agent-desk** | 4201 | Interface agent | Next.js, React, Shadcn/ui |
| **functions-run** | 3001 | API Backend | Node.js, Express, Prisma |

### Bibliothèques partagées

| Bibliothèque | Description | Usage |
|--------------|-------------|-------|
| **@salambot/ui** | Composants UI réutilisables | Design system |
| **@salambot/auth** | Gestion authentification | JWT, sessions |
| **@salambot/ai** | Services IA et Darija | Détection langue |
| **@salambot/config** | Configuration centralisée | Variables env |

## 🚀 Premier développement

### Étape 1 : Démarrer les applications

```bash
# Terminal 1 : Backend API
pnpm nx serve functions-run

# Terminal 2 : Widget Web
pnpm nx serve widget-web

# Terminal 3 : Agent Desk
pnpm nx serve agent-desk
```

### Étape 2 : Vérifier le fonctionnement

- **Widget Web** : http://localhost:4200
- **Agent Desk** : http://localhost:4201
- **API Backend** : http://localhost:3001/health

### Étape 3 : Première modification

```bash
# Créer une nouvelle branche
git checkout -b feature/mon-premier-changement

# Modifier un composant simple
# Exemple : apps/widget-web/src/components/ChatWidget.tsx
```

```typescript
// apps/widget-web/src/components/ChatWidget.tsx
export function ChatWidget() {
  return (
    <div className="chat-widget">
      <h2>🤖 SalamBot - Mon Premier Changement</h2>
      <p>Marhaba! Comment puis-je vous aider?</p>
    </div>
  );
}
```

### Étape 4 : Tests et validation

```bash
# Lancer les tests
pnpm nx test widget-web

# Vérifier le linting
pnpm nx lint widget-web

# Formater le code
pnpm nx format:write
```

## 🧪 Tests et Qualité

### Types de tests

```bash
# Tests unitaires
pnpm nx test <app-name>
pnpm nx test ui  # Bibliothèque UI

# Tests d'intégration
pnpm nx test:integration functions-run

# Tests E2E
pnpm nx e2e widget-web-e2e

# Couverture de code
pnpm nx test:coverage <app-name>
```

### Standards de qualité

```bash
# Linting complet
pnpm lint

# Formatage automatique
pnpm format

# Vérification TypeScript
pnpm nx type-check

# Audit sécurité
pnpm audit
```

## 🔧 Développement Avancé

### Créer une nouvelle bibliothèque

```bash
# Générer une nouvelle lib
pnpm nx g @nx/js:lib ma-nouvelle-lib

# Avec React
pnpm nx g @nx/react:lib ma-lib-react
```

### Ajouter une dépendance

```bash
# Dépendance globale
pnpm add lodash
pnpm add -D @types/lodash

# Dépendance spécifique à une app
pnpm add axios --filter=functions-run
```

### Debugging

```bash
# Mode debug Node.js
pnpm nx serve functions-run --inspect

# Logs détaillés
DEBUG=salambot:* pnpm nx serve functions-run
```

## 🌐 Développement API

### Structure API

```typescript
// apps/functions-run/src/routes/chat.ts
import { Router } from 'express';
import { authMiddleware } from '@salambot/auth';

const router = Router();

// Route protégée
router.post('/messages', authMiddleware, async (req, res) => {
  try {
    const { message, userId } = req.body;
    
    // Logique métier
    const response = await processMessage(message, userId);
    
    res.json({ success: true, data: response });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
```

### Tests API

```typescript
// apps/functions-run/src/routes/chat.spec.ts
import request from 'supertest';
import { app } from '../app';

describe('Chat API', () => {
  it('should send message successfully', async () => {
    const response = await request(app)
      .post('/api/chat/messages')
      .set('Authorization', 'Bearer valid-token')
      .send({
        message: 'Salam, kifach?',
        userId: 'user-123'
      });
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});
```

## 🎨 Développement UI

### Composants avec Storybook

```bash
# Démarrer Storybook
pnpm nx storybook ui

# Générer une story
pnpm nx g @nx/react:stories ui
```

```typescript
// libs/ui/src/lib/Button/Button.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Envoyer Message',
  },
};
```

## 🔄 Workflow Git

### Branches et commits

```bash
# Créer une branche feature
git checkout -b feature/SALA-123-nouvelle-fonctionnalite

# Commits conventionnels
git commit -m "feat(chat): ajouter détection Darija temps réel"
git commit -m "fix(auth): corriger validation JWT"
git commit -m "docs(api): mettre à jour documentation endpoints"

# Push et PR
git push origin feature/SALA-123-nouvelle-fonctionnalite
```

### Types de commits

- **feat** : Nouvelle fonctionnalité
- **fix** : Correction de bug
- **docs** : Documentation
- **style** : Formatage, style
- **refactor** : Refactoring
- **test** : Tests
- **chore** : Maintenance

## 🏷️ Système de Tagging Intelligent

### Utilisation du système de release

```bash
# Tag Phase 1 Darija (automatique)
npm run tag:phase1

# Tag Phase 2 QADI (automatique)
npm run tag:phase2

# Tag Hotfix critique
npm run tag:hotfix 2.2.1

# Tag personnalisé
npm run tag:custom 2.3.0 minor "Nouvelle fonctionnalité" "Feature A" "Feature B"
```

### Fonctionnalités du système

- **Versioning hybride** : Combine SemVer + suffixes métier + noms créatifs
- **Métriques intégrées** : Précision Darija, temps de réponse, couverture tests
- **Release notes automatiques** : Générées avec détails techniques
- **CHANGELOG automatique** : Mis à jour à chaque release
- **GitHub Actions** : Déclenchement automatique des workflows

### Exemple de tag généré

```
Tag: v2.2.0-darija-optimization-darija-master
Type: MINOR
Métriques:
  - Précision Darija: 100%
  - Temps de Réponse: 2.4ms
  - Couverture Tests: 100%
```

## 🚀 Déploiement Local

### Build de production

```bash
# Build toutes les apps
pnpm build

# Build spécifique
pnpm nx build widget-web
pnpm nx build functions-run
```

### Docker local

```bash
# Build image Docker
docker build -t salambot/widget-web .

# Démarrer avec docker-compose
docker-compose up --build
```

## 🤖 CI/CD et Automation

### GitHub Actions Workflows

Le projet utilise plusieurs workflows automatisés :

- **CI Pipeline** : Tests, linting, build sur chaque PR
- **Intelligent Release** : Release automatique avec métriques
- **Infrastructure** : Déploiement Terraform automatisé
- **Security** : Rotation automatique des mots de passe Redis

### Workflow de release automatisé

```bash
# 1. Créer un tag avec le système intelligent
npm run tag:phase1

# 2. Pousser vers GitHub
git push origin --tags

# 3. GitHub Actions se déclenche automatiquement
# - Build et tests
# - Génération release notes
# - Notifications Slack
# - Déploiement (si configuré)
```

### Monitoring et métriques

Le système collecte automatiquement :

- **Métriques de performance** : Temps de réponse, précision
- **Couverture de tests** : Pourcentage et détails
- **Statistiques Git** : Commits, auteurs, fichiers modifiés
- **Métriques métier** : Adoption, satisfaction utilisateur

## 🆘 Dépannage

### Problèmes courants

```bash
# Nettoyer le cache
pnpm nx reset
rm -rf node_modules
pnpm install

# Problèmes de ports
lsof -ti:4200 | xargs kill -9
lsof -ti:3001 | xargs kill -9

# Problèmes Docker
docker-compose down
docker system prune -f
docker-compose up -d
```

### Logs de debug

```bash
# Logs détaillés Nx
NX_VERBOSE_LOGGING=true pnpm nx serve widget-web

# Logs application
DEBUG=salambot:* pnpm nx serve functions-run
```

## 📚 Ressources

### Documentation
- [Architecture détaillée](../archi.md)
- [Guide API](../api-reference.md)
- [Guide de contribution](../contribution-guide.md)
- [Bibliothèques internes](../internal-libraries.md)
- [Stratégie Optimale SalamBot](../optimal-strategy-implementation.md)
- [Guide détection Darija](../darija-detection-guide.md)

### Outils
- [Nx Documentation](https://nx.dev)
- [Next.js Guide](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [TailwindCSS](https://tailwindcss.com/docs)

### Support
- **Discord** : [Communauté SalamBot](https://discord.gg/salambot)
- **GitHub Issues** : [Signaler un problème](https://github.com/salambot/salambot-suite/issues)
- **Email** : dev-support@salambot.ma
- **Application** : https://salambot.app
- **Site Vitrine** : https://salambot.ma
- **API** : https://api.salambot.app
- **Documentation** : https://docs.salambot.app

## ✅ Checklist de validation

Avant de soumettre votre contribution :

- [ ] ✅ Code formaté avec Prettier
- [ ] ✅ Aucune erreur ESLint
- [ ] ✅ Tests unitaires passent
- [ ] ✅ Couverture de code maintenue
- [ ] ✅ Documentation mise à jour
- [ ] ✅ Commit conventionnel
- [ ] ✅ Branch à jour avec main
- [ ] ✅ Tag créé si nécessaire (npm run tag:*)
- [ ] ✅ Release notes générées
- [ ] ✅ Métriques validées (>88% précision Darija)
- [ ] ✅ Workflow GitHub Actions réussi

---

**🎉 Félicitations !** Vous êtes maintenant prêt à contribuer efficacement au projet SalamBot Suite.

Pour toute question, n'hésitez pas à consulter notre [guide de contribution](../contribution-guide.md) ou à nous contacter sur Discord.