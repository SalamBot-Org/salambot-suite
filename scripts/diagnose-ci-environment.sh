#!/bin/bash

# Script de diagnostic pour environnement CI
# SalamBot Functions-Run - API Gateway Enterprise
# Aide à identifier les différences entre environnements local et CI

set -e

echo "🔍 Diagnostic de l'environnement CI SalamBot"
echo "============================================="

# Informations système
echo "📋 Informations système:"
echo "  OS: $(uname -s)"
echo "  Architecture: $(uname -m)"
echo "  Kernel: $(uname -r)"
echo "  Distribution: $(lsb_release -d 2>/dev/null | cut -f2 || echo 'N/A')"
echo ""

# Informations Node.js
echo "🟢 Environnement Node.js:"
echo "  Node version: $(node --version)"
echo "  NPM version: $(npm --version)"
echo "  PNPM version: $(pnpm --version 2>/dev/null || echo 'N/A')"
echo "  Memory limit: $(node -e 'console.log(v8.getHeapStatistics().heap_size_limit / 1024 / 1024 + " MB")')"
echo ""

# Variables d'environnement CI
echo "🔧 Variables d'environnement CI:"
echo "  CI: ${CI:-'false'}"
echo "  CI_PLATFORM: ${CI_PLATFORM:-'unknown'}"
echo "  NODE_ENV: ${NODE_ENV:-'undefined'}"
echo "  JEST_TIMEOUT: ${JEST_TIMEOUT:-'undefined'}"
echo "  MOCK_SERVICES_ENABLED: ${MOCK_SERVICES_ENABLED:-'undefined'}"
echo ""

# Ports disponibles
echo "🌐 Vérification des ports:"
for port in 3001 3002 3003 3004; do
  if nc -z localhost $port 2>/dev/null; then
    echo "  Port $port: ✅ OCCUPÉ"
  else
    echo "  Port $port: ⚪ LIBRE"
  fi
done
echo ""

# Processus en cours
echo "⚙️ Processus Node.js actifs:"
ps aux | grep -E '(node|pnpm)' | grep -v grep | head -10
echo ""

# Espace disque
echo "💾 Espace disque:"
df -h | grep -E '(Filesystem|/$)'
echo ""

# Mémoire
echo "🧠 Utilisation mémoire:"
free -h 2>/dev/null || echo "Commande 'free' non disponible"
echo ""

# Réseau
echo "🌍 Configuration réseau:"
echo "  Hostname: $(hostname)"
echo "  IP locale: $(hostname -I 2>/dev/null | awk '{print $1}' || echo 'N/A')"
echo "  Résolution DNS localhost: $(nslookup localhost 2>/dev/null | grep 'Address:' | tail -1 | awk '{print $2}' || echo 'N/A')"
echo ""

# Test de connectivité locale
echo "🔗 Test de connectivité locale:"
for port in 3001 3002 3003 3004; do
  if timeout 3 bash -c "echo >/dev/tcp/localhost/$port" 2>/dev/null; then
    echo "  localhost:$port: ✅ ACCESSIBLE"
  else
    echo "  localhost:$port: ❌ INACCESSIBLE"
  fi
done
echo ""

# Logs récents
echo "📝 Logs récents des services mock:"
if [ -d "apps/functions-run/logs" ]; then
  for log_file in apps/functions-run/logs/*.log; do
    if [ -f "$log_file" ]; then
      echo "  📄 $(basename $log_file):"
      tail -n 3 "$log_file" | sed 's/^/    /'
    fi
  done
else
  echo "  ⚠️ Répertoire logs non trouvé"
fi
echo ""

# Configuration Jest
echo "🧪 Configuration Jest:"
if [ -f "apps/functions-run/jest.config.ts" ]; then
  echo "  ✅ jest.config.ts trouvé"
  grep -E '(testTimeout|maxWorkers|testRetries)' apps/functions-run/jest.config.ts | sed 's/^/    /'
else
  echo "  ❌ jest.config.ts non trouvé"
fi
echo ""

# Fichiers d'environnement
echo "📁 Fichiers d'environnement:"
for env_file in ".env" ".env.test" ".env.ci"; do
  if [ -f "apps/functions-run/$env_file" ]; then
    echo "  ✅ $env_file trouvé ($(wc -l < apps/functions-run/$env_file) lignes)"
  else
    echo "  ❌ $env_file non trouvé"
  fi
done
echo ""

# Recommandations
echo "💡 Recommandations:"
if [ "$CI" = "true" ]; then
  echo "  🔧 Environnement CI détecté"
  echo "  📈 Augmenter les timeouts Jest à 45000ms"
  echo "  🔄 Utiliser testRetries: 3"
  echo "  ⏱️ Attendre 25s pour le démarrage des services"
  echo "  🎯 Réduire ERROR_RATE à 1% et TIMEOUT_RATE à 0%"
else
  echo "  🏠 Environnement local détecté"
  echo "  ⚡ Configuration standard recommandée"
fi
echo ""

echo "✅ Diagnostic terminé"
echo "📊 Pour plus d'informations, consultez les logs dans apps/functions-run/logs/"