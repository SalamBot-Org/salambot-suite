# 🔧 Guide de Dépannage - SalamBot Suite v2.1

**📋 Document:** Guide de Résolution de Problèmes  
**🎯 Audience:** Développeurs, DevOps, Support Technique  
**📅 Dernière mise à jour:** 27 janvier 2025  
**🔄 Version:** 2.1.0

---

## 🎯 Vue d'Ensemble

Ce guide fournit des **solutions pratiques** aux problèmes courants rencontrés avec SalamBot Suite, organisées par **catégorie** et **niveau de criticité**.

### 🚨 Niveaux de Criticité

- **🔴 P0 - CRITIQUE** : Service indisponible, perte de données
- **🟠 P1 - URGENT** : Fonctionnalité majeure impactée
- **🟡 P2 - IMPORTANT** : Performance dégradée
- **🟢 P3 - MINEUR** : Problème cosmétique ou documentation

---

## 🚨 Problèmes Critiques (P0)

### 🔴 Service Complètement Indisponible

**Symptômes :**
- API retourne 503 Service Unavailable
- Toutes les applications frontend inaccessibles
- Monitoring montre 0% de disponibilité

**Diagnostic :**
```bash
# Vérifier l'état des services Cloud Run
gcloud run services list --region=europe-west1 --format="table(metadata.name,status.conditions[0].type,status.conditions[0].status)"

# Vérifier les logs d'erreur
gcloud logs read "resource.type=cloud_run_revision AND severity>=ERROR" --limit=50 --format=json

# Vérifier l'état de l'infrastructure
terraform plan -detailed-exitcode
```

**Solutions :**

1. **Rollback Immédiat**
   ```bash
   # Rollback vers la version précédente
   ./scripts/rollback.sh production previous
   
   # Vérifier le retour à la normale
   curl -f https://api.salambot.app/health
   ```

2. **Redéploiement d'Urgence**
   ```bash
   # Redéployer la dernière version stable
   gcloud run deploy salambot-functions-run-production \
     --image gcr.io/$PROJECT_ID/salambot-functions-run:stable \
     --region europe-west1
   ```

3. **Activation du Mode Maintenance**
   ```bash
   # Activer la page de maintenance
   gcloud compute url-maps edit salambot-lb-production
   # Rediriger vers la page de maintenance
   ```

### 🔴 Perte de Données Firestore

**Symptômes :**
- Conversations utilisateur disparues
- Erreurs "Document not found"
- Historique de chat vide

**Diagnostic :**
```bash
# Vérifier l'état de Firestore
gcloud firestore databases describe --database=salambot-production

# Vérifier les opérations récentes
gcloud firestore operations list --database=salambot-production

# Vérifier les backups
gcloud firestore backups list --location=europe-west1
```

**Solutions :**

1. **Restauration depuis Backup**
   ```bash
   # Lister les backups disponibles
   gcloud firestore backups list --location=europe-west1
   
   # Restaurer le backup le plus récent
   gcloud firestore databases restore \
     --source-backup=projects/$PROJECT_ID/locations/europe-west1/backups/BACKUP_ID \
     --destination-database=salambot-production-restored
   ```

2. **Point-in-Time Recovery**
   ```bash
   # Restaurer à un point dans le temps
   gcloud firestore databases restore \
     --source-database=salambot-production \
     --destination-database=salambot-production-recovered \
     --point-in-time="2025-01-27T10:00:00Z"
   ```

### 🔴 Redis Cluster Inaccessible

**Symptômes :**
- Sessions utilisateur perdues
- Cache non fonctionnel
- WebSocket déconnexions massives

**Diagnostic :**
```bash
# Vérifier l'état de Redis
gcloud redis instances describe salambot-redis-production --region=europe-west1

# Tester la connectivité
gcloud compute ssh redis-test-vm --zone=europe-west1-b --command="redis-cli -h REDIS_IP ping"

# Vérifier les métriques
gcloud monitoring metrics list --filter="metric.type:redis.googleapis.com"
```

**Solutions :**

1. **Redémarrage Redis**
   ```bash
   # Redémarrer l'instance Redis
   gcloud redis instances failover salambot-redis-production --region=europe-west1
   ```

2. **Recréation du Cluster**
   ```bash
   # Sauvegarder les données critiques
   redis-cli --rdb /tmp/redis-backup.rdb
   
   # Recréer l'instance
   terraform destroy -target=module.database.google_redis_instance.main
   terraform apply -target=module.database.google_redis_instance.main
   ```

---

## 🟠 Problèmes Urgents (P1)

### 🟠 Détection Darija Défaillante

**Symptômes :**
- Précision < 80% sur les tests
- Mauvaise classification des langues
- Temps de réponse > 1 seconde

**Diagnostic :**
```bash
# Tester la détection de langue
curl -X POST https://api.salambot.app/api/v1/ai/detect-language \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"text": "Salam, kifach ndir?"}'

# Vérifier les métriques de précision
gcloud monitoring metrics list --filter="metric.type:custom.googleapis.com/darija_accuracy"

# Analyser les logs d'erreur IA
gcloud logs read "resource.type=cloud_run_revision AND jsonPayload.component=\"ai-lang-detect\" AND severity>=WARNING" --limit=100
```

**Solutions :**

1. **Redémarrage du Service IA**
   ```bash
   # Redéployer le service avec cache vidé
   gcloud run deploy salambot-functions-run-production \
     --set-env-vars="CLEAR_AI_CACHE=true" \
     --region europe-west1
   ```

2. **Fallback vers Modèle Secondaire**
   ```typescript
   // Configuration d'urgence
   const config = {
     primaryModel: 'gemini-pro', // Désactivé temporairement
     fallbackModel: 'cld3-basic',
     confidenceThreshold: 0.7, // Abaissé temporairement
     enableFallback: true
   };
   ```

3. **Recalibrage du Modèle**
   ```bash
   # Lancer le script de recalibrage
   pnpm nx run ai-lang-detect:recalibrate --dataset=darija-validation
   
   # Déployer le modèle recalibré
   pnpm nx run ai-lang-detect:deploy-model
   ```

### 🟠 API Gateway Surchargé

**Symptômes :**
- Rate limiting excessif (429 errors)
- Latence > 500ms
- Timeouts fréquents

**Diagnostic :**
```bash
# Vérifier les métriques de charge
gcloud monitoring metrics list --filter="metric.type:loadbalancing.googleapis.com/https/request_count"

# Analyser les logs de rate limiting
gcloud logs read "resource.type=http_load_balancer AND httpRequest.status=429" --limit=100

# Vérifier la configuration Cloud Armor
gcloud compute security-policies describe salambot-waf-production
```

**Solutions :**

1. **Augmentation Temporaire des Limites**
   ```bash
   # Modifier la politique Cloud Armor
   gcloud compute security-policies rules update 1000 \
     --security-policy=salambot-waf-production \
     --rate-limit-threshold-count=200 \
     --rate-limit-threshold-interval-sec=60
   ```

2. **Scaling Horizontal**
   ```bash
   # Augmenter le nombre d'instances
   gcloud run services update salambot-functions-run-production \
     --max-instances=200 \
     --region europe-west1
   ```

3. **Activation du CDN Agressif**
   ```bash
   # Activer le cache CDN pour plus d'endpoints
   gcloud compute backend-services update salambot-backend \
     --enable-cdn \
     --cache-mode=CACHE_ALL_STATIC
   ```

### 🟠 Base de Données PostgreSQL Lente

**Symptômes :**
- Requêtes analytics > 5 secondes
- Connexions en timeout
- CPU > 80% constant

**Diagnostic :**
```sql
-- Identifier les requêtes lentes
SELECT query, mean_exec_time, calls, total_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Vérifier les verrous
SELECT blocked_locks.pid AS blocked_pid,
       blocked_activity.usename AS blocked_user,
       blocking_locks.pid AS blocking_pid,
       blocking_activity.usename AS blocking_user,
       blocked_activity.query AS blocked_statement
FROM pg_catalog.pg_locks blocked_locks
JOIN pg_catalog.pg_stat_activity blocked_activity ON blocked_activity.pid = blocked_locks.pid
JOIN pg_catalog.pg_locks blocking_locks ON blocking_locks.locktype = blocked_locks.locktype
JOIN pg_catalog.pg_stat_activity blocking_activity ON blocking_activity.pid = blocking_locks.pid
WHERE NOT blocked_locks.granted;
```

**Solutions :**

1. **Optimisation des Index**
   ```sql
   -- Créer des index manquants
   CREATE INDEX CONCURRENTLY idx_conversation_metrics_created_at 
   ON conversation_metrics(created_at);
   
   CREATE INDEX CONCURRENTLY idx_darija_performance_confidence 
   ON darija_performance(confidence, created_at);
   ```

2. **Scaling Vertical Temporaire**
   ```bash
   # Augmenter les ressources
   gcloud sql instances patch salambot-analytics-production \
     --tier=db-custom-4-16384 \
     --maintenance-release-channel=production
   ```

3. **Nettoyage des Données**
   ```sql
   -- Archiver les anciennes données
   DELETE FROM conversation_metrics 
   WHERE created_at < NOW() - INTERVAL '90 days';
   
   -- Vacuum complet
   VACUUM ANALYZE;
   ```

---

## 🟡 Problèmes Importants (P2)

### 🟡 Performance WebSocket Dégradée

**Symptômes :**
- Messages en retard (> 2 secondes)
- Déconnexions fréquentes
- Typing indicators non fonctionnels

**Diagnostic :**
```bash
# Vérifier les connexions WebSocket
gcloud logs read "resource.type=cloud_run_revision AND jsonPayload.component=\"websocket\"" --limit=50

# Tester la connectivité WebSocket
wscat -c wss://api.salambot.app/ws?token=$TOKEN

# Vérifier Redis pour les rooms WebSocket
redis-cli --scan --pattern "ws:room:*" | wc -l
```

**Solutions :**

1. **Redémarrage du Service WebSocket**
   ```bash
   # Redéployer avec nettoyage des connexions
   gcloud run deploy salambot-websocket-production \
     --set-env-vars="FORCE_RECONNECT=true" \
     --region europe-west1
   ```

2. **Nettoyage Redis WebSocket**
   ```bash
   # Nettoyer les rooms orphelines
   redis-cli --eval cleanup-ws-rooms.lua 0
   ```

3. **Optimisation des Connexions**
   ```typescript
   // Configuration optimisée
   const socketConfig = {
     pingTimeout: 30000,
     pingInterval: 25000,
     maxHttpBufferSize: 1e6,
     transports: ['websocket', 'polling'],
     allowEIO3: true
   };
   ```

### 🟡 Monitoring Alerts Excessives

**Symptômes :**
- Spam d'alertes Slack
- Faux positifs fréquents
- Alertes non pertinentes

**Diagnostic :**
```bash
# Analyser l'historique des alertes
gcloud alpha monitoring policies list --format="table(displayName,enabled,conditions[0].displayName)"

# Vérifier les seuils d'alerte
gcloud monitoring alert-policies describe POLICY_ID

# Analyser les métriques récentes
gcloud monitoring metrics-descriptors list --filter="metric.type:custom.googleapis.com"
```

**Solutions :**

1. **Ajustement des Seuils**
   ```bash
   # Modifier les seuils d'alerte
   gcloud alpha monitoring policies update POLICY_ID \
     --update-condition-threshold=500 \
     --update-condition-duration=600s
   ```

2. **Filtrage des Alertes**
   ```yaml
   # Configuration Slack avec filtrage
   alert_filters:
     - severity: "critical"
       environment: "production"
     - metric_type: "darija_accuracy"
       threshold: "< 0.85"
   ```

3. **Groupement des Alertes**
   ```bash
   # Configurer le groupement d'alertes
   gcloud alpha monitoring notification-channels update CHANNEL_ID \
     --update-labels="group_by=service,environment"
   ```

### 🟡 Logs Volumineux

**Symptômes :**
- Coûts Cloud Logging élevés
- Recherche de logs lente
- Stockage saturé

**Diagnostic :**
```bash
# Analyser l'utilisation des logs
gcloud logging metrics list --format="table(name,filter)"

# Vérifier la taille des logs
gcloud logging logs list --format="table(name)" | wc -l

# Identifier les sources volumineuses
gcloud logs read "timestamp>=\"2025-01-26T00:00:00Z\"" --format="value(resource.type)" | sort | uniq -c | sort -nr
```

**Solutions :**

1. **Configuration de Rétention**
   ```bash
   # Définir la rétention à 30 jours
   gcloud logging sinks create salambot-archive \
     bigquery.googleapis.com/projects/$PROJECT_ID/datasets/logs_archive \
     --log-filter="resource.type=cloud_run_revision"
   
   # Supprimer les anciens logs
   gcloud logging logs delete projects/$PROJECT_ID/logs/salambot-debug
   ```

2. **Filtrage des Logs**
   ```typescript
   // Configuration de logging optimisée
   const logConfig = {
     level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
     excludePatterns: [
       '/health',
       '/metrics',
       'static assets'
     ],
     sampling: {
       debug: 0.1,  // 10% des logs debug
       info: 1.0,   // 100% des logs info
       error: 1.0   // 100% des logs error
     }
   };
   ```

3. **Export vers BigQuery**
   ```bash
   # Configurer l'export automatique
   gcloud logging sinks create logs-to-bigquery \
     bigquery.googleapis.com/projects/$PROJECT_ID/datasets/application_logs \
     --log-filter="resource.type=cloud_run_revision AND severity>=INFO"
   ```

---

## 🟢 Problèmes Mineurs (P3)

### 🟢 Interface Agent Desk Lente

**Symptômes :**
- Chargement > 3 secondes
- Interactions UI lentes
- Pagination lente

**Solutions :**

1. **Optimisation Frontend**
   ```typescript
   // Lazy loading des composants
   const ConversationList = lazy(() => import('./ConversationList'));
   const Analytics = lazy(() => import('./Analytics'));
   
   // Pagination optimisée
   const ITEMS_PER_PAGE = 20; // Réduire de 50 à 20
   ```

2. **Cache Agressif**
   ```typescript
   // Configuration SWR optimisée
   const swrConfig = {
     revalidateOnFocus: false,
     revalidateOnReconnect: false,
     refreshInterval: 30000, // 30 secondes
     dedupingInterval: 10000 // 10 secondes
   };
   ```

### 🟢 Documentation Obsolète

**Solutions :**

1. **Mise à Jour Automatique**
   ```bash
   # Script de mise à jour de la documentation
   pnpm nx run docs:generate
   pnpm nx run docs:deploy
   ```

2. **Validation Continue**
   ```yaml
   # GitHub Action pour valider la doc
   - name: Validate Documentation
     run: |
       pnpm nx run docs:lint
       pnpm nx run docs:test-links
   ```

---

## 🛠️ Outils de Diagnostic

### 📊 Scripts de Diagnostic Automatique

```bash
#!/bin/bash
# scripts/health-check.sh

set -euo pipefail

echo "🏥 SalamBot Suite - Health Check"
echo "================================"

# Vérification des services
echo "📡 Services Cloud Run:"
SERVICES=("functions-run" "widget-web" "agent-desk")
for service in "${SERVICES[@]}"; do
    URL=$(gcloud run services describe salambot-$service-production \
        --region=europe-west1 --format="value(status.url)" 2>/dev/null || echo "")
    
    if [[ -n "$URL" ]]; then
        if curl -sf "$URL/health" > /dev/null 2>&1; then
            echo "  ✅ $service: OK"
        else
            echo "  ❌ $service: ERREUR"
        fi
    else
        echo "  ⚠️  $service: NON DÉPLOYÉ"
    fi
done

# Vérification des bases de données
echo "\n💾 Bases de données:"

# Firestore
if gcloud firestore databases describe --database=salambot-production > /dev/null 2>&1; then
    echo "  ✅ Firestore: OK"
else
    echo "  ❌ Firestore: ERREUR"
fi

# Redis
REDIS_IP=$(gcloud redis instances describe salambot-redis-production \
    --region=europe-west1 --format="value(host)" 2>/dev/null || echo "")
if [[ -n "$REDIS_IP" ]]; then
    echo "  ✅ Redis: OK ($REDIS_IP)"
else
    echo "  ❌ Redis: ERREUR"
fi

# PostgreSQL
if gcloud sql instances describe salambot-analytics-production > /dev/null 2>&1; then
    echo "  ✅ PostgreSQL: OK"
else
    echo "  ❌ PostgreSQL: ERREUR"
fi

# Vérification des métriques critiques
echo "\n📊 Métriques critiques:"

# Latence API
LATENCY=$(gcloud monitoring metrics list \
    --filter="metric.type:run.googleapis.com/request_latencies" \
    --format="value(metric.type)" | wc -l)
if [[ $LATENCY -gt 0 ]]; then
    echo "  ✅ Métriques de latence: Disponibles"
else
    echo "  ⚠️  Métriques de latence: Indisponibles"
fi

# Précision Darija
ACCURACY=$(gcloud monitoring metrics list \
    --filter="metric.type:custom.googleapis.com/darija_accuracy" \
    --format="value(metric.type)" | wc -l)
if [[ $ACCURACY -gt 0 ]]; then
    echo "  ✅ Métriques Darija: Disponibles"
else
    echo "  ⚠️  Métriques Darija: Indisponibles"
fi

echo "\n🏁 Health Check terminé"
```

### 🔍 Script de Diagnostic Avancé

```bash
#!/bin/bash
# scripts/deep-diagnosis.sh

set -euo pipefail

COMPONENT=${1:-all}
TIME_RANGE=${2:-1h}

echo "🔍 Diagnostic Avancé - $COMPONENT (dernières $TIME_RANGE)"
echo "================================================"

case $COMPONENT in
    "api"|"all")
        echo "📡 Analyse API:"
        
        # Erreurs récentes
        ERROR_COUNT=$(gcloud logs read \
            "resource.type=cloud_run_revision AND severity>=ERROR AND timestamp>=\"$(date -d "$TIME_RANGE ago" -Iseconds)\"" \
            --format="value(timestamp)" | wc -l)
        echo "  🚨 Erreurs: $ERROR_COUNT"
        
        # Top erreurs
        echo "  📋 Top 5 erreurs:"
        gcloud logs read \
            "resource.type=cloud_run_revision AND severity>=ERROR AND timestamp>=\"$(date -d "$TIME_RANGE ago" -Iseconds)\"" \
            --format="value(jsonPayload.message)" | sort | uniq -c | sort -nr | head -5
        
        # Latence moyenne
        echo "  ⏱️  Analyse de latence en cours..."
        ;;
        
    "database"|"all")
        echo "\n💾 Analyse Base de Données:"
        
        # Connexions actives
        ACTIVE_CONNECTIONS=$(gcloud sql operations list \
            --instance=salambot-analytics-production \
            --filter="status=RUNNING" \
            --format="value(name)" | wc -l)
        echo "  🔗 Connexions actives: $ACTIVE_CONNECTIONS"
        
        # Espace disque
        DISK_USAGE=$(gcloud sql instances describe salambot-analytics-production \
            --format="value(settings.dataDiskSizeGb)")
        echo "  💿 Espace disque: ${DISK_USAGE}GB"
        ;;
        
    "ai"|"all")
        echo "\n🧠 Analyse IA:"
        
        # Test de détection
        echo "  🧪 Test de détection Darija:"
        DETECTION_RESULT=$(curl -s -X POST https://api.salambot.app/api/v1/ai/detect-language \
            -H "Authorization: Bearer $API_TOKEN" \
            -H "Content-Type: application/json" \
            -d '{"text": "Salam, kifach ndir?"}' | jq -r '.data.confidence // "error"')
        
        if [[ "$DETECTION_RESULT" != "error" ]]; then
            echo "    ✅ Confiance: $DETECTION_RESULT"
        else
            echo "    ❌ Échec du test"
        fi
        ;;
esac

echo "\n🏁 Diagnostic terminé"
```

### 📈 Monitoring en Temps Réel

```bash
#!/bin/bash
# scripts/live-monitoring.sh

echo "📊 Monitoring en Temps Réel - SalamBot Suite"
echo "============================================"

while true; do
    clear
    echo "🕐 $(date '+%Y-%m-%d %H:%M:%S')"
    echo ""
    
    # Services status
    echo "📡 Services:"
    for service in functions-run widget-web agent-desk; do
        STATUS=$(gcloud run services describe salambot-$service-production \
            --region=europe-west1 \
            --format="value(status.conditions[0].status)" 2>/dev/null || echo "Unknown")
        
        if [[ "$STATUS" == "True" ]]; then
            echo "  ✅ $service"
        else
            echo "  ❌ $service ($STATUS)"
        fi
    done
    
    echo ""
    echo "📊 Métriques (dernière minute):"
    
    # Requêtes par minute
    REQUESTS=$(gcloud logs read \
        "resource.type=cloud_run_revision AND httpRequest.requestMethod!=\"\" AND timestamp>=\"$(date -d '1 minute ago' -Iseconds)\"" \
        --format="value(timestamp)" | wc -l)
    echo "  📈 Requêtes: $REQUESTS/min"
    
    # Erreurs
    ERRORS=$(gcloud logs read \
        "resource.type=cloud_run_revision AND severity>=ERROR AND timestamp>=\"$(date -d '1 minute ago' -Iseconds)\"" \
        --format="value(timestamp)" | wc -l)
    echo "  🚨 Erreurs: $ERRORS/min"
    
    # Instances actives
    INSTANCES=$(gcloud run services describe salambot-functions-run-production \
        --region=europe-west1 \
        --format="value(status.traffic[0].revisionName)" | wc -l)
    echo "  🖥️  Instances: $INSTANCES"
    
    sleep 10
done
```

---

## 📞 Escalation et Support

### 🚨 Procédure d'Escalation

1. **P0 - CRITIQUE (0-15 min)**
   - 📞 Appel immédiat : +212-XXX-XXXX
   - 💬 Slack : @channel dans #salambot-incidents
   - 📧 Email : incidents@salambot.ma

2. **P1 - URGENT (15-60 min)**
   - 💬 Slack : #salambot-support
   - 🎫 Ticket Jira avec priorité HIGH
   - 📧 Email : support@salambot.ma

3. **P2 - IMPORTANT (1-4 heures)**
   - 🎫 Ticket Jira avec priorité MEDIUM
   - 💬 Slack : #salambot-support

4. **P3 - MINEUR (1-3 jours)**
   - 🎫 Ticket Jira avec priorité LOW
   - 📧 Email : support@salambot.ma

### 📋 Template de Rapport d'Incident

```markdown
# 🚨 Rapport d'Incident - [TITRE]

**📅 Date:** [DATE]
**⏰ Heure:** [HEURE]
**🔴 Criticité:** [P0/P1/P2/P3]
**👤 Rapporteur:** [NOM]

## 📝 Description
[Description détaillée du problème]

## 🎯 Impact
- **Utilisateurs affectés:** [NOMBRE/POURCENTAGE]
- **Services impactés:** [LISTE]
- **Durée:** [TEMPS]

## 🔍 Symptômes Observés
- [ ] [Symptôme 1]
- [ ] [Symptôme 2]
- [ ] [Symptôme 3]

## 🛠️ Actions Entreprises
1. [Action 1] - [RÉSULTAT]
2. [Action 2] - [RÉSULTAT]
3. [Action 3] - [RÉSULTAT]

## ✅ Résolution
[Description de la solution appliquée]

## 🔄 Actions Préventives
- [ ] [Action préventive 1]
- [ ] [Action préventive 2]
- [ ] [Action préventive 3]

## 📚 Leçons Apprises
[Points d'amélioration identifiés]
```

### 🔗 Contacts d'Urgence

| Rôle | Nom | Téléphone | Email | Disponibilité |
|------|-----|-----------|-------|---------------|
| **Lead DevOps** | Ahmed Benali | +212-XXX-XXXX | ahmed@salambot.ma | 24/7 |
| **Architecte** | Fatima Zahra | +212-XXX-XXXX | fatima@salambot.ma | 8h-20h |
| **Support L2** | Youssef Alami | +212-XXX-XXXX | youssef@salambot.ma | 9h-18h |
| **CTO** | Karim Benjelloun | +212-XXX-XXXX | karim@salambot.ma | Urgences P0 |

---

## 📚 Ressources Complémentaires

### 🔗 Liens Utiles

- **📊 Dashboard Monitoring** : [Grafana](https://monitoring.salambot.ma)
- **📝 Logs Centralisés** : [Cloud Logging](https://console.cloud.google.com/logs)
- **🎫 Système de Tickets** : [Jira](https://salambot.atlassian.net)
- **💬 Chat Support** : [Slack #salambot-support](https://salambot.slack.com)
- **📖 Documentation** : [Confluence](https://salambot.atlassian.net/wiki)

### 🛠️ Outils de Diagnostic

```bash
# Installation des outils de diagnostic
pnpm install -g @salambot/diagnostic-tools

# Utilisation
salambot-diag --component=api --severity=error --time=1h
salambot-health --environment=production
salambot-perf --service=functions-run --metrics=latency,throughput
```

### 📖 Documentation Technique

- [Architecture Guide](archi.md)
- [API Reference](api-reference.md)
- [Deployment Guide](deployment-guide.md)
- [Security Guidelines](security-vulnerability-management.md)

---

**📝 Maintenu par l'équipe Support SalamBot**  
**🔄 Prochaine révision : Février 2025**  
**📞 Support 24/7 : +212-XXX-XXXX**