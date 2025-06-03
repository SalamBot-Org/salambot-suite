# Changelog

Tous les changements notables de ce projet seront documentés dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/),
et ce projet adhère au [Versioning Sémantique](https://semver.org/lang/fr/).

## [Non publié]

### Ajouté
- Configuration GitHub Actions pour CI/CD
- Configuration Dependabot pour les mises à jour automatiques
- Scripts d'infrastructure Terraform pour Redis
- Configuration ESLint et Prettier
- Tests automatisés avec Jest
- **Script de synchronisation automatique TODO.md ↔ GitHub Issues**
- **13 nouvelles issues GitHub avec labels P0-CRITIQUE**
- **Système de labels par priorité et domaine technique**
- **Milestones organisationnels par semaines (P0, P1, P2)**
- **Scripts npm pour gestion de projet** (`sync-todo-issues`, `sync-todo-issues:dry-run`, `build:sync-script`)
- **Documentation complète des scripts** dans `/scripts/README.md`

### Modifié
- Standardisation des versions Node.js à 22 dans tous les workflows
- Amélioration de la cohérence des en-têtes de workflows
- **Amélioration de la gestion de projet** avec alignement automatique TODO-Issues

### Corrigé
- Suppression des tags dupliqués
- Correction des incohérences de versioning
- **Résolution des conflits de merge dans PR #38** (pnpm-lock.yaml)
- **Synchronisation des dépendances Dependabot**

## [1.0.0] - 2025-01-27

### Ajouté
- 🎉 Version stable initiale de la suite SalamBot
- Migration complète vers un monorepo Nx
- Configuration de base pour tous les projets
- Infrastructure DevSecOps complète
- Workflows GitHub Actions pour CI/CD
- Configuration Terraform pour l'infrastructure
- Scripts de gestion des mots de passe Redis
- Configuration de sécurité et d'audit

### Technique
- Monorepo Nx avec support multi-projets
- Node.js 22 et PNPM 10
- TypeScript, React, Next.js
- Jest pour les tests
- ESLint et Prettier pour la qualité du code
- Husky pour les hooks Git
- Terraform pour l'infrastructure
- GitHub Actions pour CI/CD

---

## Convention de Versioning

Ce projet suit le [Versioning Sémantique](https://semver.org/lang/fr/) :

- **MAJOR** (X.0.0) : Changements incompatibles avec les versions précédentes
- **MINOR** (0.X.0) : Nouvelles fonctionnalités compatibles avec les versions précédentes
- **PATCH** (0.0.X) : Corrections de bugs compatibles avec les versions précédentes

### Préfixes de tags
- `v` : Version stable (ex: `v1.0.0`)
- `v*.*.*-alpha` : Version alpha (ex: `v1.1.0-alpha`)
- `v*.*.*-beta` : Version beta (ex: `v1.1.0-beta`)
- `v*.*.*-rc` : Release candidate (ex: `v1.1.0-rc.1`)

### Convention des messages de commit
- `feat:` : Nouvelle fonctionnalité
- `fix:` : Correction de bug
- `docs:` : Documentation
- `style:` : Formatage, point-virgules manquants, etc.
- `refactor:` : Refactoring du code
- `test:` : Ajout de tests
- `chore:` : Maintenance, tâches de build, etc.