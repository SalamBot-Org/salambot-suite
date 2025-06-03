# 📚 Documentation des Bibliothèques Internes - SalamBot Suite v2.1

**📋 Document:** Guide des Bibliothèques Partagées  
**🎯 Audience:** Développeurs, Architectes  
**📅 Dernière mise à jour:** 27 janvier 2025  
**🔄 Version:** 2.1.0

---

## 🎯 Vue d'Ensemble

SalamBot Suite utilise une **architecture monorepo** avec des bibliothèques partagées pour maximiser la réutilisabilité du code et maintenir la cohérence entre les applications.

### 📁 Structure des Bibliothèques

```
libs/
├── ui/                     # Composants UI réutilisables
├── auth/                   # Authentification et autorisation
├── ai/                     # Intelligence Artificielle
│   └── lang-detect/        # Détection de langue Darija
└── config/                 # Configuration partagée
```

### 🔗 Dépendances entre Bibliothèques

```mermaid
graph TD
    A[apps/widget-web] --> B[libs/ui]
    A --> C[libs/auth]
    A --> D[libs/ai/lang-detect]
    
    E[apps/agent-desk] --> B
    E --> C
    E --> D
    
    F[apps/functions-run] --> C
    F --> D
    F --> G[libs/config]
    
    B --> H[External: React, TailwindCSS]
    C --> I[External: JWT, bcrypt]
    D --> J[External: Gemini API, TensorFlow.js]
    G --> K[External: dotenv, joi]
    
    style B fill:#e1f5fe
    style C fill:#e8f5e8
    style D fill:#f3e5f5
    style G fill:#fff3e0
```

---

## 🎨 @salambot/ui

### 📋 Description

Bibliothèque de composants UI réutilisables construite avec **React**, **TypeScript** et **TailwindCSS**. Fournit une interface utilisateur cohérente à travers toutes les applications.

### 🚀 Installation

```bash
# Dans une application
pnpm add @salambot/ui

# Développement local
pnpm nx build ui
```

### 📦 Composants Principaux

#### 🔘 Button

**Usage :**
```tsx
import { Button } from '@salambot/ui';

// Bouton primaire
<Button variant="primary" size="md" onClick={handleClick}>
  Envoyer Message
</Button>

// Bouton avec icône
<Button variant="secondary" icon={<SendIcon />} loading={isLoading}>
  Envoyer
</Button>

// Bouton destructif
<Button variant="destructive" size="sm">
  Supprimer
</Button>
```

**Props :**
```typescript
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  icon?: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
}
```

**Styles :**
```css
/* Variants */
.btn-primary { @apply bg-blue-600 text-white hover:bg-blue-700; }
.btn-secondary { @apply bg-gray-200 text-gray-900 hover:bg-gray-300; }
.btn-outline { @apply border border-gray-300 text-gray-700 hover:bg-gray-50; }
.btn-ghost { @apply text-gray-600 hover:bg-gray-100; }
.btn-destructive { @apply bg-red-600 text-white hover:bg-red-700; }

/* Sizes */
.btn-xs { @apply px-2 py-1 text-xs; }
.btn-sm { @apply px-3 py-1.5 text-sm; }
.btn-md { @apply px-4 py-2 text-base; }
.btn-lg { @apply px-6 py-3 text-lg; }
.btn-xl { @apply px-8 py-4 text-xl; }
```

#### 💬 ChatMessage

**Usage :**
```tsx
import { ChatMessage } from '@salambot/ui';

const message = {
  id: 'msg-123',
  content: 'Salam, kifach ndir?',
  sender: 'user' as const,
  timestamp: new Date(),
  language: 'darija' as const,
  confidence: 0.95
};

<ChatMessage 
  message={message}
  onReply={(id) => handleReply(id)}
  onTranslate={(id) => handleTranslate(id)}
  showLanguageBadge={true}
/>
```

**Props :**
```typescript
interface ChatMessageProps {
  message: {
    id: string;
    content: string;
    sender: 'user' | 'agent' | 'bot';
    timestamp: Date;
    language?: 'darija' | 'arabic' | 'french' | 'english';
    confidence?: number;
    metadata?: Record<string, any>;
  };
  onReply?: (messageId: string) => void;
  onTranslate?: (messageId: string) => void;
  onEdit?: (messageId: string) => void;
  showLanguageBadge?: boolean;
  showTimestamp?: boolean;
  className?: string;
}
```

#### 📊 LanguageBadge

**Usage :**
```tsx
import { LanguageBadge } from '@salambot/ui';

<LanguageBadge 
  language="darija" 
  confidence={0.95}
  script="latin"
  size="sm"
/>
```

**Props :**
```typescript
interface LanguageBadgeProps {
  language: 'darija' | 'arabic' | 'french' | 'english' | 'unknown';
  confidence?: number;
  script?: 'latin' | 'arabic';
  size?: 'xs' | 'sm' | 'md';
  showConfidence?: boolean;
  className?: string;
}
```

#### 📝 Input

**Usage :**
```tsx
import { Input } from '@salambot/ui';

<Input
  label="Message"
  placeholder="Tapez votre message..."
  value={message}
  onChange={setMessage}
  error={error}
  helperText="Supporté: Darija, Arabe, Français"
  maxLength={500}
  multiline
  rows={3}
/>
```

**Props :**
```typescript
interface InputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'email' | 'password' | 'number';
  error?: string;
  helperText?: string;
  disabled?: boolean;
  required?: boolean;
  maxLength?: number;
  multiline?: boolean;
  rows?: number;
  className?: string;
}
```

### 🎨 Système de Design

**Couleurs :**
```typescript
export const colors = {
  primary: {
    50: '#eff6ff',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    900: '#1e3a8a'
  },
  darija: {
    50: '#fdf4ff',
    500: '#a855f7',
    600: '#9333ea',
    700: '#7c3aed'
  },
  success: {
    50: '#f0fdf4',
    500: '#22c55e',
    600: '#16a34a'
  },
  warning: {
    50: '#fffbeb',
    500: '#f59e0b',
    600: '#d97706'
  },
  error: {
    50: '#fef2f2',
    500: '#ef4444',
    600: '#dc2626'
  }
};
```

**Typography :**
```typescript
export const typography = {
  fontFamily: {
    sans: ['Inter', 'system-ui', 'sans-serif'],
    arabic: ['Noto Sans Arabic', 'Arial', 'sans-serif'],
    mono: ['JetBrains Mono', 'monospace']
  },
  fontSize: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem'
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700'
  }
};
```

**Spacing :**
```typescript
export const spacing = {
  0: '0',
  1: '0.25rem',
  2: '0.5rem',
  3: '0.75rem',
  4: '1rem',
  6: '1.5rem',
  8: '2rem',
  12: '3rem',
  16: '4rem',
  20: '5rem'
};
```

### 🧪 Tests

**Configuration Jest :**
```typescript
// libs/ui/jest.config.ts
export default {
  displayName: 'ui',
  preset: '../../jest.preset.js',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/test-setup.ts'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1'
  }
};
```

**Exemple de Test :**
```typescript
// libs/ui/src/components/Button/Button.spec.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('should render with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button')).toHaveTextContent('Click me');
  });

  it('should call onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should be disabled when loading', () => {
    render(<Button loading>Click me</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('should apply correct variant classes', () => {
    render(<Button variant="primary">Primary</Button>);
    expect(screen.getByRole('button')).toHaveClass('btn-primary');
  });
});
```

---

## 🔐 @salambot/auth

### 📋 Description

Bibliothèque d'authentification et d'autorisation utilisant **JWT**, **bcrypt** et intégrant avec **Google Cloud IAM**.

### 🚀 Installation

```bash
pnpm add @salambot/auth
```

### 🔑 Services Principaux

#### 🎫 JwtService

**Usage :**
```typescript
import { JwtService } from '@salambot/auth';

const jwtService = new JwtService({
  secret: process.env.JWT_SECRET,
  expiresIn: '24h',
  issuer: 'salambot-api',
  audience: 'salambot-clients'
});

// Générer un token
const token = await jwtService.sign({
  userId: 'user-123',
  email: 'user@example.com',
  role: 'agent',
  permissions: ['chat:read', 'chat:write']
});

// Vérifier un token
const payload = await jwtService.verify(token);
console.log(payload.userId); // 'user-123'

// Rafraîchir un token
const newToken = await jwtService.refresh(token);
```

**Configuration :**
```typescript
interface JwtConfig {
  secret: string;
  expiresIn?: string | number;
  issuer?: string;
  audience?: string;
  algorithm?: 'HS256' | 'HS384' | 'HS512' | 'RS256';
}

interface JwtPayload {
  userId: string;
  email: string;
  role: 'admin' | 'agent' | 'user';
  permissions: string[];
  iat?: number;
  exp?: number;
  iss?: string;
  aud?: string;
}
```

#### 🔒 PasswordService

**Usage :**
```typescript
import { PasswordService } from '@salambot/auth';

const passwordService = new PasswordService({
  saltRounds: 12,
  minLength: 8,
  requireSpecialChars: true
});

// Hasher un mot de passe
const hashedPassword = await passwordService.hash('mySecurePassword123!');

// Vérifier un mot de passe
const isValid = await passwordService.verify('mySecurePassword123!', hashedPassword);

// Valider la force d'un mot de passe
const validation = passwordService.validateStrength('weakpass');
if (!validation.isValid) {
  console.log(validation.errors); // ['Too short', 'Missing special characters']
}
```

**Configuration :**
```typescript
interface PasswordConfig {
  saltRounds?: number;
  minLength?: number;
  maxLength?: number;
  requireUppercase?: boolean;
  requireLowercase?: boolean;
  requireNumbers?: boolean;
  requireSpecialChars?: boolean;
  forbiddenPasswords?: string[];
}

interface PasswordValidation {
  isValid: boolean;
  score: number; // 0-100
  errors: string[];
  suggestions: string[];
}
```

#### 🛡️ AuthMiddleware

**Usage Express :**
```typescript
import { authMiddleware, requirePermissions } from '@salambot/auth';
import express from 'express';

const app = express();

// Middleware d'authentification global
app.use(authMiddleware({
  secret: process.env.JWT_SECRET,
  skipPaths: ['/health', '/api/v1/auth/login']
}));

// Protection par permissions
app.get('/api/v1/admin/users', 
  requirePermissions(['admin:read']),
  (req, res) => {
    // req.user contient les infos utilisateur
    res.json({ users: [] });
  }
);

// Protection par rôle
app.post('/api/v1/chat/escalate',
  requireRole('agent'),
  (req, res) => {
    res.json({ success: true });
  }
);
```

**Usage React :**
```tsx
import { AuthProvider, useAuth, ProtectedRoute } from '@salambot/auth';

// Provider au niveau racine
function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard" element={
            <ProtectedRoute requiredRole="agent">
              <Dashboard />
            </ProtectedRoute>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

// Hook dans un composant
function Dashboard() {
  const { user, logout, hasPermission } = useAuth();
  
  return (
    <div>
      <h1>Bienvenue {user?.email}</h1>
      {hasPermission('admin:read') && (
        <AdminPanel />
      )}
      <button onClick={logout}>Déconnexion</button>
    </div>
  );
}
```

### 🔐 Système de Permissions

**Structure :**
```typescript
// Permissions par domaine
const PERMISSIONS = {
  // Chat
  'chat:read': 'Lire les conversations',
  'chat:write': 'Envoyer des messages',
  'chat:delete': 'Supprimer des messages',
  'chat:escalate': 'Escalader vers un agent',
  
  // Analytics
  'analytics:read': 'Voir les métriques',
  'analytics:export': 'Exporter les données',
  
  // Administration
  'admin:read': 'Voir les utilisateurs',
  'admin:write': 'Modifier les utilisateurs',
  'admin:delete': 'Supprimer les utilisateurs',
  
  // Configuration
  'config:read': 'Voir la configuration',
  'config:write': 'Modifier la configuration'
};

// Rôles prédéfinis
const ROLES = {
  user: ['chat:read', 'chat:write'],
  agent: [
    'chat:read', 'chat:write', 'chat:escalate',
    'analytics:read'
  ],
  admin: [
    ...ROLES.agent,
    'admin:read', 'admin:write', 'admin:delete',
    'config:read', 'config:write',
    'analytics:export'
  ]
};
```

### 🧪 Tests

**Exemple de Test :**
```typescript
// libs/auth/src/services/JwtService.spec.ts
import { JwtService } from './JwtService';

describe('JwtService', () => {
  let jwtService: JwtService;
  
  beforeEach(() => {
    jwtService = new JwtService({
      secret: 'test-secret',
      expiresIn: '1h'
    });
  });

  describe('sign', () => {
    it('should generate a valid JWT token', async () => {
      const payload = {
        userId: 'user-123',
        email: 'test@example.com',
        role: 'user' as const,
        permissions: ['chat:read']
      };
      
      const token = await jwtService.sign(payload);
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
    });
  });

  describe('verify', () => {
    it('should verify and decode a valid token', async () => {
      const payload = {
        userId: 'user-123',
        email: 'test@example.com',
        role: 'user' as const,
        permissions: ['chat:read']
      };
      
      const token = await jwtService.sign(payload);
      const decoded = await jwtService.verify(token);
      
      expect(decoded.userId).toBe(payload.userId);
      expect(decoded.email).toBe(payload.email);
    });

    it('should throw error for invalid token', async () => {
      await expect(jwtService.verify('invalid-token'))
        .rejects.toThrow('Invalid token');
    });
  });
});
```

---

## 🧠 @salambot/ai/lang-detect

### 📋 Description

Bibliothèque spécialisée dans la **détection de langue Darija** utilisant l'**API Gemini** et des modèles de machine learning optimisés.

### 🚀 Installation

```bash
pnpm add @salambot/ai-lang-detect
```

### 🔍 Services Principaux

#### 🎯 DarijaDetector

**Usage :**
```typescript
import { DarijaDetector, GeminiClient, RedisCache } from '@salambot/ai-lang-detect';

// Configuration
const geminiClient = new GeminiClient({
  apiKey: process.env.GEMINI_API_KEY,
  model: 'gemini-pro',
  temperature: 0.1
});

const cache = new RedisCache({
  url: process.env.REDIS_URL,
  ttl: 3600 // 1 heure
});

const detector = new DarijaDetector(geminiClient, cache);

// Détection simple
const result = await detector.detectLanguage('Salam, kifach ndir?');
console.log(result);
// {
//   language: 'darija',
//   confidence: 0.95,
//   script: 'latin',
//   metadata: {
//     model: 'gemini-pro',
//     processingTime: 150
//   }
// }

// Détection par lot
const texts = [
  'Salam, kifach ndir?',
  'السلام عليكم',
  'Bonjour comment allez-vous?',
  'Hello how are you?'
];

const results = await detector.detectBatch(texts);
results.forEach((result, index) => {
  console.log(`${texts[index]} -> ${result.language} (${result.confidence})`);
});
```

**Configuration Avancée :**
```typescript
interface DarijaDetectorConfig {
  // Modèles
  primaryModel: 'gemini-pro' | 'gemini-pro-vision';
  fallbackModel?: 'cld3' | 'langdetect';
  
  // Seuils
  confidenceThreshold: number; // 0.0 - 1.0
  minTextLength: number;
  maxTextLength: number;
  
  // Cache
  enableCache: boolean;
  cacheTtl: number;
  
  // Performance
  batchSize: number;
  timeout: number;
  retryAttempts: number;
  
  // Darija spécifique
  enableScriptDetection: boolean;
  enableDialectDetection: boolean;
  supportedDialects: ('casablanca' | 'fes' | 'marrakech' | 'rabat')[];
}

const detector = new DarijaDetector(geminiClient, cache, {
  primaryModel: 'gemini-pro',
  fallbackModel: 'cld3',
  confidenceThreshold: 0.8,
  minTextLength: 3,
  maxTextLength: 1000,
  enableCache: true,
  cacheTtl: 3600,
  batchSize: 10,
  timeout: 5000,
  retryAttempts: 3,
  enableScriptDetection: true,
  enableDialectDetection: false,
  supportedDialects: ['casablanca', 'rabat']
});
```

#### 🔄 LanguageTranslator

**Usage :**
```typescript
import { LanguageTranslator } from '@salambot/ai-lang-detect';

const translator = new LanguageTranslator(geminiClient, {
  sourceLanguages: ['darija', 'arabic'],
  targetLanguages: ['french', 'english'],
  preserveFormatting: true
});

// Traduction simple
const translation = await translator.translate(
  'Salam, kifach ndir?',
  'darija',
  'french'
);
console.log(translation);
// {
//   originalText: 'Salam, kifach ndir?',
//   translatedText: 'Salut, comment ça va ?',
//   sourceLanguage: 'darija',
//   targetLanguage: 'french',
//   confidence: 0.92
// }

// Traduction automatique (détection + traduction)
const autoTranslation = await translator.autoTranslate(
  'Salam, kifach ndir?',
  'french'
);
```

#### 📊 PerformanceAnalyzer

**Usage :**
```typescript
import { PerformanceAnalyzer } from '@salambot/ai-lang-detect';

const analyzer = new PerformanceAnalyzer({
  enableMetrics: true,
  sampleRate: 0.1, // 10% des requêtes
  metricsEndpoint: 'https://monitoring.salambot.ma/metrics'
});

// Analyser les performances
const metrics = await analyzer.analyze(detector, testDataset);
console.log(metrics);
// {
//   accuracy: 0.89,
//   precision: {
//     darija: 0.92,
//     arabic: 0.87,
//     french: 0.95,
//     english: 0.91
//   },
//   recall: {
//     darija: 0.88,
//     arabic: 0.85,
//     french: 0.93,
//     english: 0.89
//   },
//   f1Score: 0.90,
//   averageLatency: 145, // ms
//   throughput: 67 // requêtes/seconde
// }

// Benchmark en temps réel
analyzer.startRealTimeMonitoring(detector);
```

### 🎯 Modèles Supportés

**Gemini Models :**
```typescript
const GEMINI_MODELS = {
  'gemini-pro': {
    description: 'Modèle principal pour la détection de langue',
    maxTokens: 30720,
    languages: ['darija', 'arabic', 'french', 'english', 'spanish'],
    accuracy: 0.92,
    avgLatency: 150 // ms
  },
  'gemini-pro-vision': {
    description: 'Modèle avec support d\'images (OCR)',
    maxTokens: 12288,
    languages: ['darija', 'arabic', 'french', 'english'],
    accuracy: 0.88,
    avgLatency: 300 // ms
  }
};
```

**Fallback Models :**
```typescript
const FALLBACK_MODELS = {
  'cld3': {
    description: 'Compact Language Detector v3 (Google)',
    languages: ['ar', 'fr', 'en', 'es'],
    accuracy: 0.75,
    avgLatency: 5 // ms
  },
  'langdetect': {
    description: 'Python langdetect port',
    languages: ['ar', 'fr', 'en', 'es', 'de'],
    accuracy: 0.70,
    avgLatency: 10 // ms
  }
};
```

### 🧪 Dataset de Test

**Structure :**
```typescript
interface TestSample {
  id: string;
  text: string;
  expectedLanguage: 'darija' | 'arabic' | 'french' | 'english';
  expectedScript?: 'latin' | 'arabic';
  dialect?: 'casablanca' | 'fes' | 'marrakech' | 'rabat';
  difficulty: 'easy' | 'medium' | 'hard';
  category: 'greeting' | 'question' | 'statement' | 'mixed';
  metadata?: {
    source: string;
    verified: boolean;
    confidence: number;
  };
}

const testDataset: TestSample[] = [
  {
    id: 'darija-001',
    text: 'Salam, kifach ndir?',
    expectedLanguage: 'darija',
    expectedScript: 'latin',
    dialect: 'casablanca',
    difficulty: 'easy',
    category: 'greeting'
  },
  {
    id: 'darija-002',
    text: 'Wach nta ghadi l\'université?',
    expectedLanguage: 'darija',
    expectedScript: 'latin',
    difficulty: 'medium',
    category: 'question'
  },
  {
    id: 'darija-003',
    text: 'السلام، كيفاش نديرو؟',
    expectedLanguage: 'darija',
    expectedScript: 'arabic',
    difficulty: 'hard',
    category: 'greeting'
  }
];
```

**Commandes de Test :**
```bash
# Tests unitaires
pnpm nx test ai-lang-detect

# Tests de performance
pnpm nx run ai-lang-detect:benchmark

# Tests avec dataset complet
pnpm nx run ai-lang-detect:test-dataset

# Validation continue
pnpm nx run ai-lang-detect:validate --threshold=0.85
```

### 🧪 Tests

**Exemple de Test :**
```typescript
// libs/ai/lang-detect/src/DarijaDetector.spec.ts
import { DarijaDetector } from './DarijaDetector';
import { createMockGeminiClient, createMockCache } from '../test-utils';

describe('DarijaDetector', () => {
  let detector: DarijaDetector;
  let mockGeminiClient: jest.Mocked<GeminiClient>;
  let mockCache: jest.Mocked<RedisCache>;

  beforeEach(() => {
    mockGeminiClient = createMockGeminiClient();
    mockCache = createMockCache();
    detector = new DarijaDetector(mockGeminiClient, mockCache);
  });

  describe('detectLanguage', () => {
    it('should detect Darija with high confidence', async () => {
      // Arrange
      const text = 'Salam, kifach ndir?';
      const expectedResult = {
        language: 'darija' as const,
        confidence: 0.95,
        script: 'latin' as const,
        metadata: {
          model: 'gemini-pro',
          processingTime: 150
        }
      };
      
      mockCache.get.mockResolvedValue(null);
      mockGeminiClient.detectLanguage.mockResolvedValue(expectedResult);

      // Act
      const result = await detector.detectLanguage(text);

      // Assert
      expect(result).toEqual(expectedResult);
      expect(result.confidence).toBeGreaterThan(0.9);
    });

    it('should handle mixed language text', async () => {
      const text = 'Salam, comment ça va?'; // Darija + French
      const result = await detector.detectLanguage(text);
      
      expect(result.language).toBe('darija'); // Dominant language
      expect(result.metadata?.mixedLanguages).toContain('french');
    });

    it('should fallback to secondary model on low confidence', async () => {
      const text = 'Ambiguous text';
      
      mockGeminiClient.detectLanguage
        .mockResolvedValueOnce({ language: 'darija', confidence: 0.6 })
        .mockResolvedValueOnce({ language: 'english', confidence: 0.9 });
      
      const result = await detector.detectLanguage(text);
      expect(result.language).toBe('english');
    });
  });

  describe('detectBatch', () => {
    it('should process multiple texts efficiently', async () => {
      const texts = [
        'Salam, kifach ndir?',
        'Bonjour comment allez-vous?',
        'Hello how are you?'
      ];
      
      const results = await detector.detectBatch(texts);
      
      expect(results).toHaveLength(3);
      expect(results[0].language).toBe('darija');
      expect(results[1].language).toBe('french');
      expect(results[2].language).toBe('english');
    });
  });
});
```

---

## ⚙️ @salambot/config

### 📋 Description

Bibliothèque de gestion de configuration centralisée avec validation, chargement d'environnement et gestion des secrets.

### 🚀 Installation

```bash
pnpm add @salambot/config
```

### 🔧 Services Principaux

#### ⚙️ ConfigService

**Usage :**
```typescript
import { ConfigService } from '@salambot/config';

// Configuration avec validation
const config = new ConfigService({
  schema: {
    NODE_ENV: {
      type: 'string',
      enum: ['development', 'staging', 'production'],
      default: 'development'
    },
    PORT: {
      type: 'number',
      min: 1000,
      max: 65535,
      default: 3000
    },
    DATABASE_URL: {
      type: 'string',
      required: true,
      format: 'uri'
    },
    GEMINI_API_KEY: {
      type: 'string',
      required: true,
      secret: true
    },
    REDIS_URL: {
      type: 'string',
      required: true
    },
    JWT_SECRET: {
      type: 'string',
      required: true,
      secret: true,
      minLength: 32
    }
  },
  envFiles: ['.env.local', '.env'],
  secretsProvider: 'gcp-secret-manager'
});

// Accès aux valeurs
const port = config.get('PORT'); // number
const dbUrl = config.get('DATABASE_URL'); // string
const isProduction = config.get('NODE_ENV') === 'production';

// Validation
const validation = config.validate();
if (!validation.isValid) {
  console.error('Configuration invalide:', validation.errors);
  process.exit(1);
}
```

**Schema de Configuration :**
```typescript
interface ConfigSchema {
  [key: string]: {
    type: 'string' | 'number' | 'boolean' | 'array' | 'object';
    required?: boolean;
    default?: any;
    enum?: any[];
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
    format?: 'email' | 'uri' | 'uuid' | 'date';
    secret?: boolean;
    description?: string;
  };
}
```

#### 🔐 SecretsManager

**Usage :**
```typescript
import { SecretsManager } from '@salambot/config';

// Configuration GCP Secret Manager
const secretsManager = new SecretsManager({
  provider: 'gcp-secret-manager',
  projectId: 'salambot-production',
  keyRing: 'salambot-secrets',
  location: 'europe-west1'
});

// Récupérer un secret
const apiKey = await secretsManager.getSecret('gemini-api-key');
const dbPassword = await secretsManager.getSecret('database-password');

// Créer/Mettre à jour un secret
await secretsManager.setSecret('new-api-key', 'secret-value');

// Rotation automatique
await secretsManager.rotateSecret('redis-password', {
  generateNew: true,
  updateServices: ['functions-run', 'widget-web'],
  rollbackOnFailure: true
});
```

#### 🌍 EnvironmentManager

**Usage :**
```typescript
import { EnvironmentManager } from '@salambot/config';

const envManager = new EnvironmentManager({
  environments: ['development', 'staging', 'production'],
  configPaths: {
    development: '.env.development',
    staging: '.env.staging',
    production: 'gcp-secret-manager'
  }
});

// Charger la configuration pour l'environnement actuel
const config = await envManager.loadConfig();

// Basculer entre environnements (dev uniquement)
if (process.env.NODE_ENV === 'development') {
  await envManager.switchEnvironment('staging');
}

// Comparer les configurations
const diff = await envManager.compareConfigs('staging', 'production');
console.log('Différences:', diff);
```

### 📋 Configuration par Environnement

**Development (.env.development) :**
```bash
# Base de données
DATABASE_URL=postgresql://dev:dev123@localhost:5432/salambot_dev
REDIS_URL=redis://localhost:6379

# APIs
GEMINI_API_KEY=dev-api-key-here
OPENAI_API_KEY=dev-openai-key

# Auth
JWT_SECRET=dev-jwt-secret-32-characters-long
JWT_EXPIRES_IN=24h

# Monitoring
ENABLE_METRICS=true
METRICS_PORT=9090
LOG_LEVEL=debug

# Features
ENABLE_DARIJA_DETECTION=true
ENABLE_WEBSOCKET=true
ENABLE_CACHE=true
```

**Staging (.env.staging) :**
```bash
# Base de données
DATABASE_URL=postgresql://staging:${DB_PASSWORD}@staging-db:5432/salambot_staging
REDIS_URL=redis://staging-redis:6379

# APIs (depuis Secret Manager)
GEMINI_API_KEY=${SECRET:gemini-api-key-staging}
OPENAI_API_KEY=${SECRET:openai-api-key-staging}

# Auth
JWT_SECRET=${SECRET:jwt-secret-staging}
JWT_EXPIRES_IN=12h

# Monitoring
ENABLE_METRICS=true
METRICS_PORT=9090
LOG_LEVEL=info

# Features
ENABLE_DARIJA_DETECTION=true
ENABLE_WEBSOCKET=true
ENABLE_CACHE=true

# Rate Limiting
RATE_LIMIT_WINDOW=15m
RATE_LIMIT_MAX=100
```

**Production (GCP Secret Manager) :**
```typescript
// Configuration chargée depuis Secret Manager
const PRODUCTION_CONFIG = {
  // Base de données
  DATABASE_URL: 'projects/salambot-prod/secrets/database-url/versions/latest',
  REDIS_URL: 'projects/salambot-prod/secrets/redis-url/versions/latest',
  
  // APIs
  GEMINI_API_KEY: 'projects/salambot-prod/secrets/gemini-api-key/versions/latest',
  OPENAI_API_KEY: 'projects/salambot-prod/secrets/openai-api-key/versions/latest',
  
  // Auth
  JWT_SECRET: 'projects/salambot-prod/secrets/jwt-secret/versions/latest',
  JWT_EXPIRES_IN: '6h',
  
  // Monitoring
  ENABLE_METRICS: true,
  METRICS_PORT: 9090,
  LOG_LEVEL: 'warn',
  
  // Performance
  RATE_LIMIT_WINDOW: '15m',
  RATE_LIMIT_MAX: 1000,
  CACHE_TTL: 3600,
  
  // Security
  ENABLE_CORS: true,
  CORS_ORIGINS: ['https://salambot.ma', 'https://app.salambot.ma'],
  ENABLE_HELMET: true,
  ENABLE_RATE_LIMITING: true
};
```

### 🧪 Tests

**Exemple de Test :**
```typescript
// libs/config/src/ConfigService.spec.ts
import { ConfigService } from './ConfigService';

describe('ConfigService', () => {
  let configService: ConfigService;
  
  beforeEach(() => {
    // Reset environment
    delete process.env.TEST_VAR;
    delete process.env.TEST_NUMBER;
  });

  describe('validation', () => {
    it('should validate required fields', () => {
      configService = new ConfigService({
        schema: {
          REQUIRED_VAR: {
            type: 'string',
            required: true
          }
        }
      });
      
      const validation = configService.validate();
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('REQUIRED_VAR is required');
    });

    it('should apply default values', () => {
      configService = new ConfigService({
        schema: {
          DEFAULT_VAR: {
            type: 'string',
            default: 'default-value'
          }
        }
      });
      
      expect(configService.get('DEFAULT_VAR')).toBe('default-value');
    });

    it('should validate enum values', () => {
      process.env.ENUM_VAR = 'invalid';
      
      configService = new ConfigService({
        schema: {
          ENUM_VAR: {
            type: 'string',
            enum: ['valid1', 'valid2']
          }
        }
      });
      
      const validation = configService.validate();
      expect(validation.isValid).toBe(false);
    });
  });

  describe('type conversion', () => {
    it('should convert string to number', () => {
      process.env.NUMBER_VAR = '42';
      
      configService = new ConfigService({
        schema: {
          NUMBER_VAR: {
            type: 'number'
          }
        }
      });
      
      expect(configService.get('NUMBER_VAR')).toBe(42);
      expect(typeof configService.get('NUMBER_VAR')).toBe('number');
    });

    it('should convert string to boolean', () => {
      process.env.BOOL_VAR = 'true';
      
      configService = new ConfigService({
        schema: {
          BOOL_VAR: {
            type: 'boolean'
          }
        }
      });
      
      expect(configService.get('BOOL_VAR')).toBe(true);
    });
  });
});
```

---

## 🔗 Intégration entre Bibliothèques

### 🏗️ Architecture d'Intégration

```typescript
// apps/functions-run/src/main.ts
import { ConfigService } from '@salambot/config';
import { JwtService, authMiddleware } from '@salambot/auth';
import { DarijaDetector, GeminiClient } from '@salambot/ai-lang-detect';
import express from 'express';

// Configuration centralisée
const config = new ConfigService({
  schema: APP_CONFIG_SCHEMA,
  envFiles: ['.env.local', '.env'],
  secretsProvider: 'gcp-secret-manager'
});

// Services d'authentification
const jwtService = new JwtService({
  secret: config.get('JWT_SECRET'),
  expiresIn: config.get('JWT_EXPIRES_IN')
});

// Services IA
const geminiClient = new GeminiClient({
  apiKey: config.get('GEMINI_API_KEY'),
  model: 'gemini-pro'
});

const darijaDetector = new DarijaDetector(geminiClient, redisCache);

// Application Express
const app = express();

// Middleware d'authentification
app.use(authMiddleware({
  jwtService,
  skipPaths: ['/health', '/api/v1/auth/login']
}));

// Routes API
app.post('/api/v1/chat/send', async (req, res) => {
  const { message } = req.body;
  
  // Détection de langue
  const detection = await darijaDetector.detectLanguage(message.content);
  
  // Traitement du message
  const response = await processMessage(message, detection);
  
  res.json({
    success: true,
    data: {
      response,
      detection
    }
  });
});

app.listen(config.get('PORT'));
```

### 🧪 Tests d'Intégration

```typescript
// tests/integration/chat-flow.spec.ts
import { createTestApp } from '../test-utils';
import { ConfigService } from '@salambot/config';
import { JwtService } from '@salambot/auth';
import { DarijaDetector } from '@salambot/ai-lang-detect';
import request from 'supertest';

describe('Chat Flow Integration', () => {
  let app: Express;
  let jwtService: JwtService;
  let authToken: string;

  beforeAll(async () => {
    // Configuration de test
    const config = new ConfigService({
      schema: TEST_CONFIG_SCHEMA,
      envFiles: ['.env.test']
    });
    
    // Services de test
    jwtService = new JwtService({
      secret: config.get('JWT_SECRET'),
      expiresIn: '1h'
    });
    
    // Application de test
    app = await createTestApp(config);
    
    // Token d'authentification
    authToken = await jwtService.sign({
      userId: 'test-user',
      email: 'test@example.com',
      role: 'user',
      permissions: ['chat:read', 'chat:write']
    });
  });

  it('should handle complete chat flow with Darija detection', async () => {
    // Envoyer un message en Darija
    const response = await request(app)
      .post('/api/v1/chat/send')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        message: {
          content: 'Salam, kifach ndir?',
          conversationId: 'test-conv-123'
        }
      })
      .expect(200);

    // Vérifier la réponse
    expect(response.body).toMatchObject({
      success: true,
      data: {
        response: {
          content: expect.any(String),
          language: 'darija'
        },
        detection: {
          language: 'darija',
          confidence: expect.numberMatching(n => n > 0.8),
          script: 'latin'
        }
      }
    });
  });

  it('should handle authentication errors', async () => {
    await request(app)
      .post('/api/v1/chat/send')
      .send({
        message: {
          content: 'Test message'
        }
      })
      .expect(401);
  });

  it('should handle invalid language detection gracefully', async () => {
    const response = await request(app)
      .post('/api/v1/chat/send')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        message: {
          content: '🤖🔥💯', // Emojis only
          conversationId: 'test-conv-456'
        }
      })
      .expect(200);

    expect(response.body.data.detection.language).toBe('unknown');
  });
});
```

---

## 📚 Ressources et Documentation

### 🔗 Liens Utiles

- **📖 Documentation API** : [api-reference.md](api-reference.md)
- **🏗️ Architecture** : [archi.md](archi.md)
- **🚀 Déploiement** : [deployment-guide.md](deployment-guide.md)
- **🤝 Contribution** : [contribution-guide.md](contribution-guide.md)

### 🛠️ Outils de Développement

```bash
# Génération de documentation
pnpm nx run ui:docs
pnpm nx run auth:docs
pnpm nx run ai-lang-detect:docs
pnpm nx run config:docs

# Tests de toutes les bibliothèques
pnpm nx run-many --target=test --projects=ui,auth,ai-lang-detect,config

# Build de toutes les bibliothèques
pnpm nx run-many --target=build --projects=ui,auth,ai-lang-detect,config

# Linting
pnpm nx run-many --target=lint --projects=ui,auth,ai-lang-detect,config
```

### 📞 Support

- **💬 Discord** : [#dev-libs](https://discord.gg/salambot)
- **📧 Email** : [libs@salambot.ma](mailto:libs@salambot.ma)
- **🎫 Issues** : [GitHub Issues](https://github.com/salambot/salambot-suite/issues)

---

**📝 Maintenu par l'équipe Core SalamBot**  
**🔄 Prochaine révision : Février 2025**  
**💬 Feedback : [GitHub Discussions](https://github.com/salambot/salambot-suite/discussions)**