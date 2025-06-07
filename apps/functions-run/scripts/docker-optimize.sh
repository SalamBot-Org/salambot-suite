#!/bin/bash
# Script d'optimisation Docker pour SalamBot
# ==========================================

set -e

echo "🐳 Optimisation Docker SalamBot - Démarrage"
echo "============================================"

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction pour afficher les messages colorés
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Vérification que Docker est installé et en cours d'exécution
if ! command -v docker &> /dev/null; then
    log_error "Docker n'est pas installé ou n'est pas dans le PATH"
    exit 1
fi

if ! docker info &> /dev/null; then
    log_error "Docker n'est pas en cours d'exécution"
    exit 1
fi

log_info "Docker est disponible et en cours d'exécution"

# Affichage de l'espace disque avant optimisation
log_info "Espace disque utilisé par Docker avant optimisation:"
docker system df

echo ""
log_info "Démarrage du nettoyage..."

# 1. Arrêt des conteneurs SalamBot
log_info "Arrêt des conteneurs SalamBot..."
docker-compose -f docker-compose.test.yml down --remove-orphans 2>/dev/null || true
docker-compose down --remove-orphans 2>/dev/null || true
log_success "Conteneurs arrêtés"

# 2. Suppression des conteneurs arrêtés
log_info "Suppression des conteneurs arrêtés..."
STOPPED_CONTAINERS=$(docker ps -aq --filter "status=exited")
if [ ! -z "$STOPPED_CONTAINERS" ]; then
    docker rm $STOPPED_CONTAINERS
    log_success "Conteneurs arrêtés supprimés"
else
    log_info "Aucun conteneur arrêté à supprimer"
fi

# 3. Suppression des images non utilisées
log_info "Suppression des images non utilisées..."
UNUSED_IMAGES=$(docker images -f "dangling=true" -q)
if [ ! -z "$UNUSED_IMAGES" ]; then
    docker rmi $UNUSED_IMAGES
    log_success "Images non utilisées supprimées"
else
    log_info "Aucune image non utilisée à supprimer"
fi

# 4. Suppression des volumes non utilisés
log_info "Suppression des volumes non utilisés..."
docker volume prune -f
log_success "Volumes non utilisés supprimés"

# 5. Suppression des réseaux non utilisés
log_info "Suppression des réseaux non utilisés..."
docker network prune -f
log_success "Réseaux non utilisés supprimés"

# 6. Nettoyage du cache de build
log_info "Nettoyage du cache de build Docker..."
docker builder prune -f
log_success "Cache de build nettoyé"

# 7. Nettoyage complet du système (optionnel)
read -p "Voulez-vous effectuer un nettoyage complet du système Docker? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    log_warning "Nettoyage complet du système Docker..."
    docker system prune -a -f
    log_success "Nettoyage complet terminé"
fi

# Affichage de l'espace disque après optimisation
echo ""
log_info "Espace disque utilisé par Docker après optimisation:"
docker system df

echo ""
log_success "Optimisation Docker terminée avec succès! 🎉"

# Conseils d'optimisation
echo ""
log_info "💡 Conseils pour maintenir Docker optimisé:"
echo "   • Exécutez ce script régulièrement"
echo "   • Utilisez des images multi-stage pour réduire la taille"
echo "   • Supprimez les images de développement après usage"
echo "   • Utilisez .dockerignore pour exclure les fichiers inutiles"
echo "   • Configurez la rotation des logs Docker"

echo ""
log_info "Pour reconstruire les images optimisées:"
echo "   docker-compose -f docker-compose.test.yml build --no-cache"