# Bibliothèque Config

Bibliothèque de configuration centralisée pour SalamBot, incluant la gestion des connexions Redis, des variables d'environnement et des configurations runtime.

## Fonctionnalités

- **Client Redis**: Configuration et client Redis prêt à l'emploi
- **Variables d'environnement**: Validation et typage des variables d'environnement
- **Configuration runtime**: Récupération des configurations depuis Firestore
- **Cache**: Mise en cache des configurations pour optimiser les performances

## Installation

```bash
pnpm install
```

## Utilisation

### Client Redis

```typescript
import { getRedisClient, RedisConfig } from '@salambot/config';

// Obtenir le client Redis configuré
const redis = await getRedisClient();

// Utiliser le client
await redis.set('key', 'value');
const value = await redis.get('key');

// Fermer la connexion
await redis.quit();
```

### Configuration d'environnement

```typescript
import { getEnvConfig } from '@salambot/config';

const config = getEnvConfig();
console.log(config.nodeEnv); // 'development' | 'production' | 'test'
console.log(config.gcpProjectId);
```

### Configuration runtime

```typescript
import { getRuntimeConfig } from '@salambot/config';

// Récupérer la configuration depuis Firestore
const runtimeConfig = await getRuntimeConfig();
console.log(runtimeConfig.redis.url);
```

## Configuration

### Variables d'environnement

Créez un fichier `.env` à la racine du projet :

```env
# Environnement
NODE_ENV=development

# Google Cloud
GCP_PROJECT_ID=your-project-id
GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account.json

# Redis (optionnel, sera récupéré depuis Firestore si non défini)
REDIS_URL=redis://localhost:6379
REDIS_TLS=false
```

### Configuration Firestore

La configuration Redis est automatiquement mise à jour dans Firestore par le script Terraform. La structure attendue :

```json
{
  "configs": {
    "runtime": {
      "redis": {
        "url": "redis://user:pass@host:6379",
        "tls": true,
        "host": "host",
        "port": 6379,
        "auth": "password",
        "updatedAt": "2025-01-27T10:00:00.000Z",
        "environment": "development"
      }
    }
  }
}
```

## API

### `getRedisClient(config?: RedisConfig): Promise<Redis>`

Crée et retourne un client Redis configuré.

**Paramètres:**

- `config` (optionnel): Configuration Redis personnalisée

**Retourne:** Instance du client Redis (ioredis)

### `getEnvConfig(): EnvConfig`

Récupère et valide les variables d'environnement.

**Retourne:** Configuration d'environnement typée

### `getRuntimeConfig(): Promise<RuntimeConfig>`

Récupère la configuration runtime depuis Firestore.

**Retourne:** Configuration runtime incluant Redis

### `clearConfigCache(): void`

Vide le cache des configurations.

## Tests

```bash
# Lancer les tests
pnpm nx test config

# Tests avec couverture
pnpm nx test config --coverage

# Tests en mode watch
pnpm nx test config --watch
```

## Développement

```bash
# Linter
pnpm nx lint config

# Build
pnpm nx build config
```

## Sécurité

- Les mots de passe Redis sont automatiquement masqués dans les logs
- Les connexions TLS sont supportées et recommandées en production
- Les configurations sensibles sont stockées dans Google Secret Manager
- Validation stricte des variables d'environnement

## Monitoring

- Métriques de connexion Redis exposées
- Logs structurés pour le debugging
- Health checks intégrés
- Alertes automatiques en cas de problème de connexion
