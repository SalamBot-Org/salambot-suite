# SalamBot - AI CRM pour PME Marocaines

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub issues](https://img.shields.io/github/issues/SalamBot-Org/salambot-suite)](https://github.com/SalamBot-Org/salambot-suite/issues)
[![GitHub forks](https://img.shields.io/github/forks/SalamBot-Org/salambot-suite)](https://github.com/SalamBot-Org/salambot-suite/network)
[![GitHub stars](https://img.shields.io/github/stars/SalamBot-Org/salambot-suite)](https://github.com/SalamBot-Org/salambot-suite/stargazers)
[![CI Status](https://github.com/SalamBot-Org/salambot-suite/actions/workflows/ci.yml/badge.svg)](https://github.com/SalamBot-Org/salambot-suite/actions/workflows/ci.yml)

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

## Commandes de Développement Courantes

Ce projet utilise `pnpm` comme gestionnaire de paquets et `Nx` pour la gestion du monorepo.

*   **Installer les dépendances :**
    ```bash
    pnpm install
    ```
*   **Lancer tous les tests :**
    ```bash
    pnpm test
    # ou
    pnpm nx run-many --target=test --all
    ```
*   **Lancer les tests pour un projet spécifique (ex: widget-web) :**
    ```bash
    pnpm nx test widget-web
    ```
*   **Lancer le linting pour tous les projets :**
    ```bash
    pnpm lint
    # ou
    pnpm nx run-many --target=lint --all
    ```
*   **Lancer le linting pour un projet spécifique :**
    ```bash
    pnpm nx lint functions-run
    ```
*   **Builder tous les projets pour la production :**
    ```bash
    pnpm nx run-many --target=build --all --configuration=production
    ```
*   **Builder un projet spécifique pour la production :**
    ```bash
    pnpm nx build widget-web --configuration=production
    ```
*   **Lancer une application en mode développement (ex: agent-desk) :**
    ```bash
    pnpm nx serve agent-desk
    ```

## Contribution

Les contributions sont les bienvenues ! Veuillez consulter les [directives de contribution](CONTRIBUTING.md) (à créer) et le [code de conduite](CODE_OF_CONDUCT.md) (à créer) avant de commencer.

## Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

