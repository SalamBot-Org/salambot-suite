# 🚀 API Reference - SalamBot Suite v2.1

**📋 Document:** Documentation API Complète  
**🎯 Audience:** Développeurs, Intégrateurs, Partenaires  
**📅 Dernière mise à jour:** 27 janvier 2025  
**🔄 Version:** 2.1.0

---

## 🎯 Vue d'Ensemble

L'API SalamBot Suite offre une **interface RESTful moderne** pour intégrer la **détection Darija** et les **capacités conversationnelles** dans vos applications.

### 🏆 Caractéristiques Clés

- **🔒 Authentification JWT** : Sécurité enterprise
- **⚡ Performance** : <200ms latence moyenne
- **🌍 Multi-langue** : Darija, Français, Arabe, Anglais
- **📊 Analytics** : Métriques temps réel
- **🔄 WebSocket** : Communication temps réel
- **📝 OpenAPI 3.0** : Documentation interactive

---

## 🔐 Authentification

### 🎫 JWT Bearer Token

Toutes les requêtes API nécessitent un token JWT valide dans l'en-tête `Authorization`.

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 🔑 Obtenir un Token

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "your-password"
}
```

**Réponse :**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 3600,
    "user": {
      "id": "user_123",
      "email": "user@example.com",
      "role": "agent"
    }
  }
}
```

### 🔄 Renouveler un Token

```http
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## 💬 Chat API

### 📤 Envoyer un Message

**Endpoint principal** pour les interactions conversationnelles avec détection automatique de langue.

```http
POST /api/v1/chat/message
Authorization: Bearer {token}
Content-Type: application/json

{
  "message": "Salam, kifach ndir?",
  "sessionId": "session_abc123",
  "context": {
    "userId": "user_456",
    "channel": "web",
    "metadata": {
      "userAgent": "Mozilla/5.0...",
      "ip": "192.168.1.1"
    }
  }
}
```

**Réponse :**
```json
{
  "success": true,
  "data": {
    "messageId": "msg_789",
    "response": {
      "text": "Salam! Ana labas, chokran. Kifach ymken naawenek?",
      "language": "darija",
      "confidence": 0.94
    },
    "detection": {
      "inputLanguage": "darija",
      "confidence": 0.92,
      "script": "latin",
      "processingTime": 45
    },
    "sessionId": "session_abc123",
    "timestamp": "2025-01-27T10:30:00Z"
  }
}
```

### 📜 Historique de Conversation

```http
GET /api/v1/chat/history/{sessionId}
Authorization: Bearer {token}
```

**Paramètres de requête :**
- `limit` (optionnel) : Nombre de messages (défaut: 50, max: 100)
- `offset` (optionnel) : Décalage pour pagination (défaut: 0)
- `order` (optionnel) : `asc` ou `desc` (défaut: desc)

**Réponse :**
```json
{
  "success": true,
  "data": {
    "sessionId": "session_abc123",
    "messages": [
      {
        "id": "msg_789",
        "content": "Salam, kifach ndir?",
        "language": "darija",
        "confidence": 0.92,
        "sender": "user",
        "timestamp": "2025-01-27T10:29:30Z"
      },
      {
        "id": "msg_790",
        "content": "Salam! Ana labas, chokran. Kifach ymken naawenek?",
        "language": "darija",
        "confidence": 0.94,
        "sender": "bot",
        "timestamp": "2025-01-27T10:30:00Z"
      }
    ],
    "pagination": {
      "total": 25,
      "limit": 50,
      "offset": 0,
      "hasMore": false
    }
  }
}
```

### 🚨 Escalation vers Agent

```http
POST /api/v1/chat/escalate
Authorization: Bearer {token}
Content-Type: application/json

{
  "sessionId": "session_abc123",
  "reason": "complex_query",
  "priority": "medium",
  "context": {
    "lastMessages": 5,
    "userFrustration": true
  }
}
```

**Réponse :**
```json
{
  "success": true,
  "data": {
    "escalationId": "esc_456",
    "status": "pending",
    "estimatedWaitTime": 120,
    "queuePosition": 3,
    "assignedAgent": null
  }
}
```

---

## 🧠 AI Language Detection API

### 🔍 Détecter la Langue

**Endpoint spécialisé** pour la détection de langue avec support Darija avancé.

```http
POST /api/v1/ai/detect-language
Authorization: Bearer {token}
Content-Type: application/json

{
  "text": "Salam, kifach ndir? Ana bghi naaref 3la had l'application.",
  "options": {
    "includeConfidence": true,
    "detectScript": true,
    "fallbackLanguages": ["french", "arabic"]
  }
}
```

**Réponse :**
```json
{
  "success": true,
  "data": {
    "language": "darija",
    "confidence": 0.91,
    "script": "latin",
    "alternatives": [
      {
        "language": "french",
        "confidence": 0.15
      },
      {
        "language": "arabic",
        "confidence": 0.08
      }
    ],
    "processingTime": 42,
    "model": "cld3-darija-v2.1"
  }
}
```

### 🔄 Traduction

```http
POST /api/v1/ai/translate
Authorization: Bearer {token}
Content-Type: application/json

{
  "text": "Salam, kifach ndir?",
  "sourceLanguage": "darija",
  "targetLanguage": "french",
  "options": {
    "preserveFormality": true,
    "includeAlternatives": false
  }
}
```

**Réponse :**
```json
{
  "success": true,
  "data": {
    "translatedText": "Salut, comment ça va ?",
    "sourceLanguage": "darija",
    "targetLanguage": "french",
    "confidence": 0.89,
    "alternatives": [],
    "processingTime": 156
  }
}
```

---

## 📊 Analytics API

### 📈 Dashboard Métriques

```http
GET /api/v1/analytics/dashboard
Authorization: Bearer {token}
```

**Paramètres de requête :**
- `period` : `1h`, `24h`, `7d`, `30d` (défaut: 24h)
- `metrics` : Liste des métriques séparées par virgule
- `timezone` : Fuseau horaire (défaut: UTC)

**Réponse :**
```json
{
  "success": true,
  "data": {
    "period": "24h",
    "metrics": {
      "totalConversations": 1247,
      "totalMessages": 8934,
      "languageDistribution": {
        "darija": 0.68,
        "french": 0.22,
        "arabic": 0.08,
        "english": 0.02
      },
      "averageResponseTime": 187,
      "escalationRate": 0.034,
      "userSatisfaction": 4.6,
      "darijaAccuracy": 0.891
    },
    "trends": {
      "conversationsGrowth": 0.15,
      "accuracyImprovement": 0.023
    },
    "timestamp": "2025-01-27T10:30:00Z"
  }
}
```

### 📝 Enregistrer Événement

```http
POST /api/v1/analytics/events
Authorization: Bearer {token}
Content-Type: application/json

{
  "event": "language_detection_feedback",
  "data": {
    "messageId": "msg_789",
    "detectedLanguage": "darija",
    "actualLanguage": "darija",
    "isCorrect": true,
    "confidence": 0.92
  },
  "metadata": {
    "userId": "user_456",
    "sessionId": "session_abc123",
    "timestamp": "2025-01-27T10:30:00Z"
  }
}
```

---

## 🔌 WebSocket API

### 🌐 Connexion Temps Réel

**URL de connexion :**
```
wss://api.salambot.app/ws?token={jwt_token}
```

### 📡 Événements Disponibles

#### 📤 Événements Sortants (Client → Serveur)

```javascript
// Rejoindre une conversation
socket.emit('join_conversation', {
  sessionId: 'session_abc123',
  userId: 'user_456'
});

// Envoyer un message
socket.emit('send_message', {
  sessionId: 'session_abc123',
  message: 'Salam, kifach ndir?',
  type: 'text'
});

// Indicateur de frappe
socket.emit('typing_start', {
  sessionId: 'session_abc123'
});

socket.emit('typing_stop', {
  sessionId: 'session_abc123'
});
```

#### 📥 Événements Entrants (Serveur → Client)

```javascript
// Nouveau message reçu
socket.on('message_received', (data) => {
  console.log('Nouveau message:', data);
  /*
  {
    messageId: 'msg_790',
    sessionId: 'session_abc123',
    content: 'Salam! Ana labas, chokran.',
    language: 'darija',
    confidence: 0.94,
    sender: 'bot',
    timestamp: '2025-01-27T10:30:00Z'
  }
  */
});

// Utilisateur en train de taper
socket.on('user_typing', (data) => {
  console.log('Utilisateur tape:', data.userId);
});

// Escalation assignée
socket.on('escalation_assigned', (data) => {
  console.log('Agent assigné:', data.agentId);
});

// Erreur de connexion
socket.on('error', (error) => {
  console.error('Erreur WebSocket:', error);
});
```

---

## 🚨 Gestion d'Erreurs

### 📋 Codes d'Erreur Standards

| Code | Nom | Description |
|------|-----|-------------|
| `400` | `BAD_REQUEST` | Paramètres invalides |
| `401` | `UNAUTHORIZED` | Token manquant ou invalide |
| `403` | `FORBIDDEN` | Permissions insuffisantes |
| `404` | `NOT_FOUND` | Ressource introuvable |
| `429` | `RATE_LIMITED` | Limite de taux dépassée |
| `500` | `INTERNAL_ERROR` | Erreur serveur interne |
| `503` | `SERVICE_UNAVAILABLE` | Service temporairement indisponible |

### 🔍 Format d'Erreur

```json
{
  "success": false,
  "error": {
    "code": "INVALID_LANGUAGE",
    "message": "La langue spécifiée n'est pas supportée",
    "details": {
      "supportedLanguages": ["darija", "french", "arabic", "english"],
      "providedLanguage": "spanish"
    },
    "timestamp": "2025-01-27T10:30:00Z",
    "requestId": "req_abc123"
  }
}
```

### 🛠️ Codes d'Erreur Spécifiques

```json
{
  "LANGUAGE_DETECTION_FAILED": {
    "code": 422,
    "message": "Impossible de détecter la langue du texte"
  },
  "SESSION_EXPIRED": {
    "code": 401,
    "message": "La session a expiré, veuillez vous reconnecter"
  },
  "ESCALATION_QUEUE_FULL": {
    "code": 503,
    "message": "File d'attente d'escalation pleine, réessayez plus tard"
  },
  "DARIJA_MODEL_UNAVAILABLE": {
    "code": 503,
    "message": "Modèle Darija temporairement indisponible"
  }
}
```

---

## ⚡ Rate Limiting

### 📊 Limites par Endpoint

| Endpoint | Limite | Fenêtre | Burst |
|----------|--------|---------|-------|
| `/api/v1/chat/message` | 100 req | 1 minute | 10 req |
| `/api/v1/ai/detect-language` | 200 req | 1 minute | 20 req |
| `/api/v1/analytics/*` | 50 req | 1 minute | 5 req |
| `/api/v1/auth/*` | 10 req | 1 minute | 3 req |

### 📈 En-têtes de Réponse

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1643284800
X-RateLimit-Retry-After: 45
```

---

## 🧪 Environnements

### 🌍 URLs de Base

| Environnement | URL | Description |
|---------------|-----|-------------|
| **Production** | `https://api.salambot.app` | Environnement de production |
| **Staging** | `https://api-staging.salambot.ma` | Tests pré-production |
| **Development** | `https://api-dev.salambot.ma` | Développement et tests |

### 🔑 Authentification par Environnement

Chaque environnement utilise des clés API distinctes. Contactez l'équipe pour obtenir vos credentials.

---

## 📝 Exemples d'Intégration

### 🌐 JavaScript/TypeScript

```typescript
// Client API TypeScript
class SalamBotAPI {
  private baseURL: string;
  private token: string;

  constructor(baseURL: string, token: string) {
    this.baseURL = baseURL;
    this.token = token;
  }

  async sendMessage(message: string, sessionId: string) {
    const response = await fetch(`${this.baseURL}/api/v1/chat/message`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message,
        sessionId,
        context: {
          userId: 'user_123',
          channel: 'web'
        }
      })
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    return await response.json();
  }

  async detectLanguage(text: string) {
    const response = await fetch(`${this.baseURL}/api/v1/ai/detect-language`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text,
        options: {
          includeConfidence: true,
          detectScript: true
        }
      })
    });

    return await response.json();
  }
}

// Utilisation
const api = new SalamBotAPI('https://api.salambot.app', 'your-jwt-token');

try {
  const result = await api.sendMessage('Salam, kifach ndir?', 'session_123');
  console.log('Réponse:', result.data.response.text);
} catch (error) {
  console.error('Erreur:', error);
}
```

### 🐍 Python

```python
import requests
import json
from typing import Dict, Any

class SalamBotAPI:
    def __init__(self, base_url: str, token: str):
        self.base_url = base_url
        self.headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }
    
    def send_message(self, message: str, session_id: str) -> Dict[str, Any]:
        url = f"{self.base_url}/api/v1/chat/message"
        payload = {
            "message": message,
            "sessionId": session_id,
            "context": {
                "userId": "user_123",
                "channel": "api"
            }
        }
        
        response = requests.post(url, headers=self.headers, json=payload)
        response.raise_for_status()
        return response.json()
    
    def detect_language(self, text: str) -> Dict[str, Any]:
        url = f"{self.base_url}/api/v1/ai/detect-language"
        payload = {
            "text": text,
            "options": {
                "includeConfidence": True,
                "detectScript": True
            }
        }
        
        response = requests.post(url, headers=self.headers, json=payload)
        response.raise_for_status()
        return response.json()

# Utilisation
api = SalamBotAPI('https://api.salambot.app', 'your-jwt-token')

try:
    result = api.send_message('Salam, kifach ndir?', 'session_123')
    print(f"Réponse: {result['data']['response']['text']}")
except requests.exceptions.RequestException as e:
    print(f"Erreur: {e}")
```

### 🔗 cURL

```bash
# Envoyer un message
curl -X POST https://api.salambot.app/api/v1/chat/message \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Salam, kifach ndir?",
    "sessionId": "session_123",
    "context": {
      "userId": "user_456",
      "channel": "api"
    }
  }'

# Détecter la langue
curl -X POST https://api.salambot.app/api/v1/ai/detect-language \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Salam, kifach ndir?",
    "options": {
      "includeConfidence": true,
      "detectScript": true
    }
  }'
```

---

## 🔧 SDK Officiels

### 📦 Packages Disponibles

| Langage | Package | Installation |
|---------|---------|-------------|
| **JavaScript/TypeScript** | `@salambot/sdk-js` | `npm install @salambot/sdk-js` |
| **Python** | `salambot-sdk` | `pip install salambot-sdk` |
| **PHP** | `salambot/sdk-php` | `composer require salambot/sdk-php` |
| **Go** | `github.com/salambot/sdk-go` | `go get github.com/salambot/sdk-go` |

### 🚀 Installation Rapide

```bash
# JavaScript/TypeScript
npm install @salambot/sdk-js

# Python
pip install salambot-sdk

# PHP
composer require salambot/sdk-php

# Go
go get github.com/salambot/sdk-go
```

---

## 📚 Ressources Complémentaires

### 🔗 Liens Utiles

- **🌐 Playground API** : [https://api.salambot.app/playground](https://api.salambot.app/playground)
- **📖 Documentation OpenAPI** : [https://api.salambot.app/docs](https://api.salambot.app/docs)
- **🧪 Collection Postman** : [Télécharger](https://api.salambot.app/postman)
- **💬 Support Développeur** : [Discord](https://discord.gg/salambot)
- **📧 Contact API** : api-support@salambot.ma

### 🛠️ Outils de Développement

```bash
# Tester l'API localement
curl -X GET https://api.salambot.app/health

# Valider un token JWT
curl -X POST https://api.salambot.app/api/v1/auth/validate \
  -H "Authorization: Bearer your-token"

# Obtenir les métriques API
curl -X GET https://api.salambot.app/api/v1/system/metrics \
  -H "Authorization: Bearer your-token"
```

---

**📝 Maintenu par l'équipe API SalamBot**  
**🔄 Prochaine mise à jour : Février 2025**  
**📞 Support : api-support@salambot.ma**