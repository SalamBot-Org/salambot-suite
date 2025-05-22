# Documentation du système d'authentification et RBAC de SalamBot

Ce document décrit l'architecture et l'utilisation du système d'authentification et de contrôle d'accès basé sur les rôles (RBAC) implémenté dans SalamBot.

## Architecture

```mermaid
flowchart TD
    A[Client] --> B[API Auth]
    B --> C[Firebase Auth]
    B --> D[JWT RS256]
    A --> E[Routes protégées]
    E --> F[authGuard Middleware]
    F --> G[Vérification JWT]
    F --> H[Vérification Rôles]
    I[OpenTelemetry] --> B
    I --> F
```

## Composants principaux

### 1. Service d'authentification Firebase

Le service d'authentification utilise Firebase Auth pour gérer les utilisateurs et leurs informations d'identification.

**Fonctionnalités :**
- Authentification par email/mot de passe
- Authentification OAuth (Google, Microsoft)
- Gestion des utilisateurs (création, mise à jour, suppression)
- Stockage sécurisé des mots de passe
- Vérification d'email

### 2. Système de rôles

SalamBot définit quatre rôles principaux :

| Rôle | Description | Accès |
|------|-------------|-------|
| `admin` | Administrateur système | Accès complet à toutes les fonctionnalités |
| `agent` | Agent du service client | Accès à l'Agent Desk et aux conversations |
| `viewer` | Observateur | Accès en lecture seule aux conversations et statistiques |
| `client` | Utilisateur final | Accès limité au widget et à ses propres conversations |

Les rôles sont stockés dans les custom claims Firebase et inclus dans les tokens JWT.

### 3. Tokens JWT RS256

SalamBot utilise des tokens JWT signés avec l'algorithme RS256 (clé privée/publique) pour l'authentification.

**Caractéristiques :**
- Signature asymétrique RS256
- Durée de validité : 1 heure
- Stockage dans des cookies HttpOnly + Secure
- Payload incluant : ID utilisateur, email, rôles, nom, timestamps

### 4. Middleware de protection

Plusieurs middlewares sont disponibles pour protéger les routes :

- `authGuard()` : Vérifie l'authentification de base
- `roleGuard([roles])` : Vérifie l'authentification et les rôles spécifiques
- `adminGuard()` : Raccourci pour `roleGuard([Role.ADMIN])`
- `agentGuard()` : Raccourci pour `roleGuard([Role.ADMIN, Role.AGENT])`

### 5. Instrumentation OpenTelemetry

Toutes les actions d'authentification sont tracées via OpenTelemetry pour le monitoring et l'audit.

**Traces générées :**
- `auth.login.attempt` : Tentative de connexion
- `auth.login.success` : Connexion réussie
- `auth.login.fail` : Échec de connexion
- `auth.logout` : Déconnexion
- `auth.verify_token` : Vérification de token
- `auth.role.denied` : Refus d'accès basé sur le rôle
- `auth.access.denied` : Refus d'accès (non authentifié)

## Utilisation

### Configuration des variables d'environnement

```env
FIREBASE_API_KEY=your-api-key
FIREBASE_PROJECT_ID=your-project-id
JWT_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----
JWT_PUBLIC_KEY=-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----
```

### Protection des routes API

```typescript
import { authGuard, roleGuard, Role } from './auth';

// Route accessible à tous les utilisateurs authentifiés
app.get('/profile', authGuard(), (req, res) => {
  res.json({ user: req.auth });
});

// Route accessible uniquement aux administrateurs
app.get('/admin', roleGuard([Role.ADMIN]), (req, res) => {
  res.json({ message: 'Admin dashboard' });
});

// Route accessible aux agents et administrateurs
app.get('/agent-desk', agentGuard(), (req, res) => {
  res.json({ message: 'Agent desk' });
});
```

### Utilisation dans le front-end (React)

```tsx
import { useAuth, ProtectedRoute, Role } from '../hooks/useAuth';

// Dans un composant
const MyComponent = () => {
  const { user, login, logout, hasRole } = useAuth();
  
  return (
    <div>
      {user ? (
        <>
          <p>Bienvenue, {user.displayName}</p>
          {hasRole(Role.ADMIN) && <AdminPanel />}
          <button onClick={logout}>Déconnexion</button>
        </>
      ) : (
        <button onClick={() => login('user@example.com', 'password')}>Connexion</button>
      )}
    </div>
  );
};

// Protection de routes
const App = () => (
  <Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route path="/history" element={
      <ProtectedRoute roles={[Role.ADMIN, Role.AGENT]}>
        <HistoryPage />
      </ProtectedRoute>
    } />
  </Routes>
);
```

### Traçage des actions d'authentification

```typescript
import { AuthTracing } from '../utils/auth-tracing';

// Tracer une tentative de connexion
AuthTracing.loginAttempt('email', 'user@example.com');

// Tracer une connexion réussie
AuthTracing.loginSuccess('email', 'user-id', ['agent']);

// Tracer un échec de connexion
AuthTracing.loginFail('email', 'Identifiants invalides', 'auth/invalid-credentials');

// Tracer une action avec gestion d'erreur
await AuthTracing.traceAction(
  'auth.custom.action',
  { user_id: 'user-id' },
  async () => {
    // Code à exécuter
    return result;
  }
);
```

## Sécurité

### Bonnes pratiques implémentées

1. **Stockage sécurisé des tokens**
   - Cookies HttpOnly pour prévenir le vol par XSS
   - Flag Secure pour limiter aux connexions HTTPS
   - SameSite=strict pour prévenir le CSRF

2. **Signature asymétrique**
   - Algorithme RS256 (clé privée/publique)
   - Clé privée uniquement sur le serveur
   - Clé publique pour la vérification

3. **Gestion des sessions**
   - Durée de validité limitée (1 heure)
   - Vérification de l'émetteur et de l'audience
   - Timestamps d'émission et d'expiration

4. **Audit et monitoring**
   - Traces OpenTelemetry pour toutes les actions
   - Attributs détaillés pour l'analyse
   - Traçage des échecs et refus d'accès

## Tests

Les tests unitaires couvrent :
- Authentification (succès/échec)
- Vérification de token
- Middleware de protection
- Vérification de rôles
- Instrumentation OpenTelemetry

Pour exécuter les tests :
```bash
nx test apps/functions-run
```

## Prochaines évolutions

- Ajout de l'authentification à deux facteurs (2FA)
- Gestion des sessions multiples
- Rotation automatique des clés JWT
- Intégration avec d'autres fournisseurs d'identité
- Audit avancé des actions utilisateur
