# Edge Flows - Cloudflare Workers / Deno

Ce module contient les fonctions edge pour la détection de langue et le routage initial des requêtes.

## Runtime

Ce module utilise Deno comme runtime pour le développement local et est déployé sur Cloudflare Workers en production.

## Commandes

Pour construire le module :
```bash
pnpm nx build edge-flows
```

Pour tester localement avec Deno :
```bash
deno run --allow-net --allow-env ./dist/apps/edge-flows/main.js
```

## Fonctionnalités

- Détection de langue en edge (faible latence)
- Routage initial des requêtes
- Validation préliminaire des entrées
