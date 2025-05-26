# SalamBot - AI CRM pour les PME Marocaines

[![CI](PLACEHOLDER_CI_BADGE_URL)](PLACEHOLDER_CI_WORKFLOW_URL) [![Vercel](PLACEHOLDER_VERCEL_BADGE_URL)](PLACEHOLDER_VERCEL_PROJECT_URL)

## Vision

SalamBot vise à fournir aux petites et moyennes entreprises (PME) marocaines un outil CRM intelligent et accessible, intégrant des fonctionnalités d'IA pour améliorer la gestion de la relation client, l'automatisation des tâches et la communication multilingue (Français, Arabe, Darija).

## Stack Technique Principale

- **Monorepo:** Nx 19+ avec pnpm
- **Frontend:**
  - Widget Web (`widget-web`): Next.js 15+, React 19+, Tailwind CSS 4
  - Interface Agent (`agent-desk`): React 19+, Vite
- **Backend & IA:**
  - API & Flows (`functions-run`): Node.js 22+, Genkit 1.x (pour l'orchestration IA)
  - Modèles IA: Google Gemini Pro, Llama 4 (fine-tuné Darija), CLD3 (détection de langue offline)
- **Base de données:** Firestore, PostgreSQL (selon les besoins)
- **CI/CD:** GitHub Actions, Vercel
- **Tests:** Vitest, Playwright

## Structure du Monorepo

Le projet utilise un monorepo Nx pour gérer les différentes applications et bibliothèques partagées.

- `apps/`: Contient les applications déployables (widget, interface agent, API).
- `libs/`: Contient le code partagé (logique métier, composants UI, connecteurs, types).

## Documentation

- [Architecture Globale](docs/archi.md)
- Documentation spécifique à chaque application/librairie dans leurs répertoires respectifs (`README.md`).

## Contribution

Voir les [conventions de développement](PLACEHOLDER_CONTRIBUTING_GUIDELINES_URL).

