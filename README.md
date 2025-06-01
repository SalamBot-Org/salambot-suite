# SalamBot Suite 🤖

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub issues](https://img.shields.io/github/issues/SalamBot-Org/salambot-suite)](https://github.com/SalamBot-Org/salambot-suite/issues)
[![GitHub forks](https://img.shields.io/github/forks/SalamBot-Org/salambot-suite)](https://github.com/SalamBot-Org/salambot-suite/network)
[![GitHub stars](https://img.shields.io/github/stars/SalamBot-Org/salambot-suite)](https://github.com/SalamBot-Org/salambot-suite/stargazers)
[![CI Status](https://github.com/SalamBot-Org/salambot-suite/actions/workflows/ci.yml/badge.svg)](https://github.com/SalamBot-Org/salambot-suite/actions/workflows/ci.yml)
[![Security](https://img.shields.io/badge/Security-Automated-green.svg)](https://github.com/SalamBot-Org/salambot-suite/security)
[![Dependabot](https://img.shields.io/badge/Dependabot-Enabled-blue.svg)](https://github.com/SalamBot-Org/salambot-suite/network/dependencies)

## Présentation

SalamBot est une solution CRM (Customer Relationship Management) intelligente conçue spécifiquement pour les besoins des Petites et Moyennes Entreprises (PME) au Maroc. Notre objectif est de fournir aux entreprises marocaines des outils puissants et accessibles pour gérer leurs interactions clients, automatiser les tâches répétitives et améliorer leur efficacité commerciale grâce à l'intelligence artificielle.

SalamBot intègre des fonctionnalités avancées de traitement du langage naturel (NLP) pour comprendre et interagir avec les clients en **Français**, **Arabe Classique** et **Darija Marocaine**, offrant ainsi une expérience client personnalisée et culturellement adaptée.

### Vision

Devenir la plateforme CRM de référence pour les PME au Maroc, en démocratisant l'accès à l'IA pour améliorer la relation client et stimuler la croissance des entreprises locales.

### Objectifs Clés

*   **Gestion centralisée des clients :** Offrir une vue à 360 degrés des interactions clients.
*   **Automatisation Intelligente :** Automatiser les réponses aux questions fréquentes, la qualification des leads et le suivi client via des agents conversationnels.
*   **Support Multilingue :** Communiquer efficacement en Français, Arabe et Darija.
*   **Intégration Facile :** Se connecter aux canaux de communication populaires (WhatsApp, Web, etc.).
*   **Analyse et Reporting :** Fournir des insights exploitables sur les performances commerciales et la satisfaction client.

## Stack Technique Principale

SalamBot est construit sur une architecture moderne et évolutive utilisant les technologies suivantes :

*   **Frontend (Agent Desk & Widget Web) :** React, TypeScript, Next.js, Tailwind CSS
*   **Backend & AI Flows :** Node.js, TypeScript, Genkit (pour l'orchestration AI), Google Gemini, Llama (via API ou local)
*   **Infrastructure :** Google Cloud Platform (Cloud Functions, Vertex AI), Vercel (pour le déploiement frontend)
*   **Base de données :** Firestore / PostgreSQL (à définir selon les besoins)
*   **Monorepo Management :** Nx, pnpm

## Roadmap Projet (Phases)

*   **Phase 1 (Terminée - v0.2.0) :**
    *   Mise en place des flows Genkit pour la détection de langue (FR/AR/Darija) et la génération de réponses basiques.
    *   Développement d'un widget web v0.1 avec API mock pour la simulation.
    *   Configuration initiale CI/CD.
*   **Phase 2 (En cours) :**
    *   Développement du socle de l'Agent Desk (interface opérateur).
    *   Mise en place d'une gateway WebSocket pour la communication temps réel.
    *   Création d'un connecteur WhatsApp Business API.
    *   Développement d'une librairie d'orchestration pour gérer les conversations multi-tours.
*   **Phase 3 (À venir) :**
    *   Intégration CRM (gestion contacts, historique).
    *   Fonctionnalités avancées de l'Agent Desk (transfert, escalade).
    *   Amélioration des capacités NLU (reconnaissance d'intention, extraction d'entités).
    *   Tableaux de bord et reporting.
*   **Phase 4 (Vision Long Terme) :**
    *   Connecteurs additionnels (Email, SMS, réseaux sociaux).
    *   Fonctionnalités proactives (campagnes marketing ciblées).
    *   Personnalisation avancée et marketplace d'extensions.

## Infrastructure

SalamBot utilise une infrastructure cloud moderne basée sur Google Cloud Platform avec Terraform pour la gestion de l'infrastructure as code.

### Redis Cache Managé

Le projet utilise Google Cloud Memorystore pour Redis comme solution de cache distribuée et de stockage de sessions.

#### Commandes Infrastructure Redis

*   **Initialiser Terraform :**
    ```bash
    pnpm infra:redis:init
    ```

*   **Planifier les changements d'infrastructure :**
    ```bash
    pnpm infra:redis:plan
    ```

*   **Appliquer l'infrastructure Redis :**
    ```bash
    pnpm infra:redis:apply
    ```

*   **Détruire l'infrastructure Redis :**
    ```bash
    pnpm infra:redis:destroy
    ```

*   **Mettre à jour la configuration Firestore avec l'URL Redis :**
    ```bash
    pnpm infra:update-config
    ```

#### Configuration

L'infrastructure Redis est configurée via les fichiers Terraform dans `infra/terraform/`. Les variables d'environnement sont gérées via la librairie `libs/config` qui expose :

*   `getRedisClient()` - Client Redis configuré automatiquement
*   `getEnvConfig()` - Variables d'environnement validées
*   `getRuntimeConfig()` - Configuration runtime depuis Firestore

#### Monitoring

L'infrastructure inclut :
*   Monitoring automatique via Google Cloud Operations
*   Métriques Prometheus exportées par défaut
*   Alertes Grafana configurables
*   Health checks automatiques
*   Intégration Grafana Cloud pour les tableaux de bord avancés
*   Export de métriques avec `prometheus_target_tag` pour Grafana Cloud

#### Sécurité & Maintenance

*   **Rotation Automatique des Mots de Passe :** Rotation mensuelle automatisée des mots de passe Redis via GitHub Actions
*   **Gestion des Secrets :** Intégration avec Google Secret Manager pour le stockage sécurisé des identifiants
*   **Audit Trail :** Journalisation complète et versioning de toutes les opérations de sécurité
*   **Support Multi-Environnements :** Workflows de rotation séparés pour dev, staging et production

Pour des informations détaillées sur la rotation des mots de passe Redis, voir [`docs/redis-password-rotation.md`](docs/redis-password-rotation.md).

## 🔒 Sécurité et Qualité

SalamBot Suite implémente des pratiques de sécurité robustes et une approche DevSecOps complète :

### Gestion Automatisée des Vulnérabilités

- **🔍 Audit Continu** : Vérification automatique des vulnérabilités à chaque commit
- **🤖 Dependabot** : Mises à jour automatiques des dépendances de sécurité
- **⚡ Correction Rapide** : Pipeline CI/CD qui échoue en cas de vulnérabilités modérées+
- **📋 Documentation** : Procédures standardisées dans [`docs/security-vulnerability-management.md`](docs/security-vulnerability-management.md)

### Surveillance de Sécurité

```bash
# Audit de sécurité local
pnpm audit

# Correction automatique des vulnérabilités
pnpm audit --fix

# Vérification des dépendances obsolètes
pnpm outdated
```

### Qualité du Code

- **✅ Tests Automatisés** : Couverture complète avec Jest et Testing Library
- **🎯 Linting Strict** : ESLint + TypeScript pour la qualité du code
- **🔄 CI/CD Robuste** : 4 jobs parallèles (lint, test, build, security)
- **📊 Monitoring** : Nx Cloud pour l'optimisation des builds

### Conformité et Bonnes Pratiques

- **🔐 Secrets Management** : Google Secret Manager pour les données sensibles
- **🏗️ Infrastructure as Code** : Terraform pour la reproductibilité
- **📝 Audit Trail** : Journalisation complète des opérations critiques
- **🔄 Rotation Automatique** : Mots de passe et clés API renouvelés régulièrement

## 🚀 Commandes de Développement

Ce projet utilise `pnpm` comme gestionnaire de paquets et `Nx` pour la gestion du monorepo.

### Développement Local

```bash
# Installation des dépendances
pnpm install

# Lancer tous les tests
pnpm test

# Lancer le linting
pnpm lint

# Builder pour la production
pnpm build

# Lancer une application en développement
pnpm nx serve agent-desk
pnpm nx serve widget-web
```

### Commandes Nx Avancées

```bash
# Tests pour un projet spécifique
pnpm nx test widget-web

# Linting pour un projet spécifique
pnpm nx lint functions-run

# Build avec configuration spécifique
pnpm nx build widget-web --configuration=production

# Exécuter une cible sur tous les projets affectés
pnpm nx affected --target=test

# Visualiser le graphe des dépendances
pnpm nx graph
```

### Infrastructure et Sécurité

```bash
# Infrastructure Redis
pnpm infra:redis:init      # Initialiser Terraform
pnpm infra:redis:plan      # Planifier les changements
pnpm infra:redis:apply     # Appliquer l'infrastructure
pnpm infra:redis:destroy   # Détruire l'infrastructure

# Configuration et maintenance
pnpm infra:update-config           # Mettre à jour la config Firestore
pnpm infra:validate                # Valider la configuration Terraform
pnpm infra:rotate-redis-password   # Rotation manuelle du mot de passe Redis

# Sécurité
pnpm audit                 # Audit des vulnérabilités
pnpm audit --fix          # Correction automatique
pnpm outdated             # Vérifier les dépendances obsolètes
```

## 📁 Structure du Projet

```
salambot-suite/
├── apps/                          # Applications principales
│   ├── agent-desk/               # Interface opérateur (React + Next.js)
│   ├── functions-run/            # Cloud Functions (Node.js + TypeScript)
│   └── widget-web/               # Widget client (React + Next.js)
├── libs/                          # Bibliothèques partagées
│   ├── ai/lang-detect/           # Détection de langue (FR/AR/Darija)
│   ├── auth/                     # Authentification et autorisation
│   ├── config/                   # Configuration centralisée
│   └── ui/                       # Composants UI réutilisables
├── infra/                         # Infrastructure as Code
│   └── terraform/                # Configuration Terraform (Redis, GCP)
├── docs/                          # Documentation technique
│   ├── security-vulnerability-management.md
│   ├── redis-password-rotation.md
│   └── workload-identity-setup.md
├── scripts/                       # Scripts d'automatisation
└── .github/                       # Workflows CI/CD et Dependabot
```

## 🤝 Contribution

Les contributions sont les bienvenues ! Voici comment participer :

### Prérequis

- Node.js 22+
- pnpm 10+
- Accès Google Cloud Platform (pour l'infrastructure)

### Processus de Contribution

1. **Fork** le repository
2. **Créer** une branche feature (`git checkout -b feature/amazing-feature`)
3. **Développer** en suivant les standards du projet
4. **Tester** : `pnpm test && pnpm lint`
5. **Sécuriser** : `pnpm audit` (zéro vulnérabilité requise)
6. **Committer** avec des messages conventionnels
7. **Pousser** vers votre branche
8. **Ouvrir** une Pull Request

### Standards de Qualité

- ✅ Tests unitaires obligatoires
- ✅ Couverture de code > 80%
- ✅ Linting sans erreur
- ✅ TypeScript strict
- ✅ Documentation à jour
- ✅ Sécurité validée

### Ressources Utiles

- [Architecture Documentation](docs/archi.md)
- [Security Guidelines](docs/security-vulnerability-management.md)
- [Infrastructure Setup](docs/workload-identity-setup.md)

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

---

**Développé avec ❤️ pour les PME marocaines par l'équipe SalamBot**

*Pour toute question ou support, contactez-nous à : [info@salambot.ma](mailto:info@salambot.ma)*

