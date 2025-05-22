/**
 * @file        Documentation de l'Agent Desk SalamBot avec schéma de circulation.
 * @author      SalamBot Team (contact: salam@chebakia.com)
 * @created     2025-05-21
 * @updated     2025-05-21
 * @project     SalamBot - AI CRM for Moroccan SMEs
 */

# Agent Desk SalamBot

Interface de gestion des conversations pour les agents humains, avec détection automatique de la langue et escalade en temps réel.

## Schéma de circulation

```
┌─────────────┐     ┌───────────────┐     ┌────────────┐
│  Widget Web  │────▶│  SalamBot Core │────▶│ Agent Desk │
└─────────────┘     └───────────────┘     └────────────┘
       │                     │                   │
       │                     │                   │
┌─────────────┐     ┌───────────────┐     ┌────────────┐
│   WhatsApp   │────▶│  Orchestrateur │────▶│  Escalade  │
└─────────────┘     └───────────────┘     └────────────┘
```

Le flux de communication est le suivant :
1. L'utilisateur interagit avec SalamBot via le Widget Web ou WhatsApp
2. SalamBot Core (orchestrateur) traite les messages et détecte la langue
3. Si nécessaire, la conversation est escaladée vers l'Agent Desk
4. L'agent humain prend en charge la conversation avec contexte de langue

## Installation

```bash
pnpm install
pnpm dev
```

## Fonctionnalités

- Détection automatique de la langue (français, arabe, darija)
- File d'attente des conversations avec indicateurs SLA
- Prise en charge des conversations par les agents
- Interface adaptée à la langue détectée (LTR/RTL)
- Statistiques par langue et par canal

## Connexion temps réel

La connexion temps réel (WebSocket/SSE) permet aux agents connectés de recevoir instantanément les conversations escaladées.

### Statuts de conversation
- `open` : Conversation en cours avec le bot
- `escalated` : Conversation escaladée vers un agent
- `resolved` : Conversation terminée

### Métriques suivies
- Temps de réponse
- Langue détectée
- Canal d'origine
- Satisfaction client (CSAT)
