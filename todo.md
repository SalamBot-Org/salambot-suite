/**
 * @file        Liste des tâches pour la migration du workspace SalamBot
 * @author      SalamBot Team (contact: info@salambot.ma)
 * @created     2025-05-25
 * @updated     2025-05-25
 * @project     SalamBot - AI CRM for Moroccan SMEs
 */

# Migration du workspace SalamBot

## Analyse de l'état actuel
- [x] Vérifier la structure des dossiers dans les deux workspaces
- [x] Comparer les fichiers package.json
- [x] Analyser les configurations Nx
- [x] Créer la structure de base dans le nouveau workspace

## Migration des configurations essentielles
- [x] Migrer le fichier .github/workflows/ci.yml
- [x] Migrer le diagramme docs/archi.mmd
- [x] Vérifier la configuration ESLint (utiliser version 8 stable)
- [x] Vérifier la configuration Tailwind CSS 4

## Migration des applications
- [x] Migrer apps/widget-web (chat widget multilingue)
- [x] Migrer apps/agent-desk (interface opérateur)
- [x] Migrer apps/functions-run (API Genkit)

## Migration des bibliothèques
- [x] Migrer libs/ui (design system partagé)
- [x] Migrer libs/auth (hooks Firebase)
- [x] Migrer libs/ai/lang-detect (logique Genkit)

## Validation
- [ ] Vérifier que pnpm lint fonctionne
- [ ] Vérifier que pnpm test fonctionne
- [ ] Vérifier que pnpm build fonctionne
- [x] Migrer les project.json pour toutes les applications et bibliothèques
- [x] Vérifier la présence des README dans chaque dossier
- [x] Vérifier la conformité des headers SalamBot
- [x] Créer des fichiers source minimaux dans chaque app/lib
- [x] Vérification syntaxique TypeScript réussie (script check-syntax.js)
- [ ] Ajouter les fichiers de configuration Jest et TS manquants

## Problèmes identifiés
- [x] Configuration ESLint problématique : tous les dossiers d'apps/libs sont ignorés malgré les corrections
- [x] Erreur de project graph Nx persistante même après reset
- [x] Nécessité d'une phase de correction approfondie de la configuration ESLint/Nx après la migration initiale

## Finalisation
- [ ] Remplacer l'ancien workspace par le nouveau
- [ ] Pousser les changements vers la branche feature/init-monorepo
- [ ] Mettre à jour la Pull Request
