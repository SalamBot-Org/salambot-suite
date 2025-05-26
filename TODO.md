# SalamBot – Roadmap & TODO

> Dernière mise à jour : 26 mai 2025  
> Convention des rôles : ⚙️ Manus · 🖐 Obaida · 👥 Tiers  

---

## 0 · Kick-off (S-0 → S-2) — **Terminé à 90 %**

| Tâche | Resp. | État |
|-------|-------|------|
| Init monorepo **Nx 19** (pnpm, Node 22) | ⚙️ | ✅ |
| CI GitHub Actions (lint/test/build) | ⚙️ | ✅ |
| Générer `docs/archi.md` (Mermaid) | ⚙️ | ✅ |
| Hooks **Husky** + **commitlint** | ⚙️ | ⬜️ *(à faire Phase 1 #2)* |
| Valider docs initiales | 🖐 | ⬜️ |
| Stack Grafana Cloud + secret `GRAFANA_API_KEY` | 🖐 | ⬜️ |
| Réunion pilotes PME (x2) | 🖐 | ⬜️ |

---

## 1 · Phase 1 — Flows Genkit & Widget v0.1  *(terminée)*

| # | Tâche | Resp. | Issue/PR | État |
|---|-------|-------|----------|------|
| 1 | Renommer `archi.mmd` → `archi.md` (OK Mermaid) | ⚙️ | PR 📄 | ✅ |
| 2 | Ajouter Husky & commitlint | ⚙️ | PR 📄 | ✅ |
| 3 | Flow **`lang-detect-flow.ts`** (CLD3 + fallback LLM) | ⚙️ | PR 📄 | ✅ |
| 4 | Flow **`reply-flow.ts`** basique | ⚙️ | PR 📄 | ✅ |
| 5 | Lib **`libs/ai/lang-detect`** | ⚙️ | PR 📄 | ✅ |
| 6 | Lib **`libs/core/orchestrator`** | ⚙️ | PR 📄 | ✅ |
| 7 | Scripts `flows:dev` / `flows:test` + README | ⚙️ | PR 📄 | ✅ |
| 8 | Widget Web v0.1 (chat box → `/api/chat` mock) | ⚙️ | PR 📄 | ✅ |
| 9 | Grafana Cloud stack + secret | 🖐 | — | ⬜️ |
| 10 | Réunion utilisateurs pilotes | 🖐 | — | ⬜️ |

> **Branche de travail :** `feature/phase-1-genkit-flows`  
> **PR Draft cible :** `feat(phase-1): flows & docs fixes (draft)`

---

## 2 · Phase 2 — Agent Desk & Connecteurs (pré-backlog)

| Tâche clé | Resp. |
|-----------|-------|
| Agent Desk v0.1 (Vite/React, WebSocket live) | ⚙️ |
| Connecteur WhatsApp Cloud (sandbox) | ⚙️ |
| Pipeline RAG (Firestore Vector Search) | 👥 |
| Fine-tuning Llama 4 Darija (dataset 50 k Q/R) | 👥 |

*(détails à affiner après Phase 1)*

---

## 3 · Phase 3 — Espace Client & Analytics

| Tâche clé | Resp. |
|-----------|-------|
| Espace Client v0.1 (onboarding Stripe, RAG upload) | ⚙️ |
| Dashboard Analytique v0.1 (latence, top intents) | ⚙️ |
| Politique souveraineté (Postgres + MinIO) | ⚙️ |

---

## 4 · Phase 4 — Performance & Go-to-Market

| Tâche clé | Resp. |
|-----------|-------|
| Micro-service NLP Rust/Wasmtime | 👥 |
| Mode offline-first (PWA) | ⚙️ |
| Packaging offres Freemium → 399 MAD/mois | 🖐 |
| SLA 99.5 % + support Zendesk | 🖐 |

---

## Légende des statuts
- ✅ : terminé  
- 🟡 : en cours (PR draft)  
- ⬜️ : à faire (non commencé)

---

### Notes rapides
- **Tags versions** : `v0.1.0` (migration), `v0.1.1` (aplatissement), prochain tag `v0.2.0` après Phase 1.  
- **Rituels** : daily stand-up (chat), weekly review (Obaida + ChatGPT), checkpoint tag à chaque phase.  
- **Branching** : pas de commit direct sur `main`, toujours via PR.
- **Docs** : rendu Mermaid `docs/archi.md` corrigé.

---

Fin du fichier `TODO.md`
