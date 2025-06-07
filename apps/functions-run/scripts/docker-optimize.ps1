# Script d'optimisation Docker pour SalamBot (Windows PowerShell)
# ==============================================================

param(
    [switch]$Force,
    [switch]$FullClean
)

# Configuration des couleurs
$ErrorActionPreference = "Continue"

function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Color
}

function Write-Info {
    param([string]$Message)
    Write-ColorOutput "ℹ️  $Message" "Cyan"
}

function Write-Success {
    param([string]$Message)
    Write-ColorOutput "✅ $Message" "Green"
}

function Write-Warning {
    param([string]$Message)
    Write-ColorOutput "⚠️  $Message" "Yellow"
}

function Write-Error {
    param([string]$Message)
    Write-ColorOutput "❌ $Message" "Red"
}

Write-ColorOutput "🐳 Optimisation Docker SalamBot - Démarrage" "Magenta"
Write-ColorOutput "============================================" "Magenta"

# Vérification que Docker est installé et en cours d'exécution
try {
    $null = docker --version
    Write-Info "Docker est installé"
} catch {
    Write-Error "Docker n'est pas installé ou n'est pas dans le PATH"
    exit 1
}

try {
    $null = docker info 2>$null
    Write-Info "Docker est en cours d'exécution"
} catch {
    Write-Error "Docker n'est pas en cours d'exécution. Veuillez démarrer Docker Desktop."
    exit 1
}

# Affichage de l'espace disque avant optimisation
Write-Info "Espace disque utilisé par Docker avant optimisation:"
docker system df

Write-Host ""
Write-Info "Démarrage du nettoyage..."

# 1. Arrêt des conteneurs SalamBot
Write-Info "Arrêt des conteneurs SalamBot..."
try {
    docker-compose -f docker-compose.test.yml down --remove-orphans 2>$null
} catch {
    # Ignore les erreurs si le fichier n'existe pas
}

try {
    docker-compose down --remove-orphans 2>$null
} catch {
    # Ignore les erreurs si le fichier n'existe pas
}
Write-Success "Conteneurs arrêtés"

# 2. Suppression des conteneurs arrêtés
Write-Info "Suppression des conteneurs arrêtés..."
$stoppedContainers = docker ps -aq --filter "status=exited" 2>$null
if ($stoppedContainers) {
    docker rm $stoppedContainers 2>$null
    Write-Success "Conteneurs arrêtés supprimés"
} else {
    Write-Info "Aucun conteneur arrêté à supprimer"
}

# 3. Suppression des images non utilisées (dangling)
Write-Info "Suppression des images non utilisées..."
$unusedImages = docker images -f "dangling=true" -q 2>$null
if ($unusedImages) {
    docker rmi $unusedImages 2>$null
    Write-Success "Images non utilisées supprimées"
} else {
    Write-Info "Aucune image non utilisée à supprimer"
}

# 4. Suppression des volumes non utilisés
Write-Info "Suppression des volumes non utilisés..."
docker volume prune -f 2>$null
Write-Success "Volumes non utilisés supprimés"

# 5. Suppression des réseaux non utilisés
Write-Info "Suppression des réseaux non utilisés..."
docker network prune -f 2>$null
Write-Success "Réseaux non utilisés supprimés"

# 6. Nettoyage du cache de build
Write-Info "Nettoyage du cache de build Docker..."
docker builder prune -f 2>$null
Write-Success "Cache de build nettoyé"

# 7. Nettoyage complet du système (optionnel)
if ($FullClean -or (!$Force)) {
    if (!$FullClean) {
        $response = Read-Host "Voulez-vous effectuer un nettoyage complet du système Docker? (y/N)"
        if ($response -match "^[Yy]$") {
            $FullClean = $true
        }
    }
    
    if ($FullClean) {
        Write-Warning "Nettoyage complet du système Docker..."
        docker system prune -a -f 2>$null
        Write-Success "Nettoyage complet terminé"
    }
}

# Affichage de l'espace disque après optimisation
Write-Host ""
Write-Info "Espace disque utilisé par Docker après optimisation:"
docker system df

Write-Host ""
Write-Success "Optimisation Docker terminée avec succès! 🎉"

# Conseils d'optimisation
Write-Host ""
Write-Info "💡 Conseils pour maintenir Docker optimisé:"
Write-Host "   • Exécutez ce script régulièrement" -ForegroundColor Gray
Write-Host "   • Utilisez des images multi-stage pour réduire la taille" -ForegroundColor Gray
Write-Host "   • Supprimez les images de développement après usage" -ForegroundColor Gray
Write-Host "   • Utilisez .dockerignore pour exclure les fichiers inutiles" -ForegroundColor Gray
Write-Host "   • Configurez la rotation des logs Docker" -ForegroundColor Gray

Write-Host ""
Write-Info "Pour reconstruire les images optimisées:"
Write-Host "   docker-compose -f docker-compose.test.yml build --no-cache" -ForegroundColor Gray

Write-Host ""
Write-Info "Utilisation du script:"
Write-Host "   .\docker-optimize.ps1                    # Mode interactif" -ForegroundColor Gray
Write-Host "   .\docker-optimize.ps1 -Force             # Sans confirmation" -ForegroundColor Gray
Write-Host "   .\docker-optimize.ps1 -FullClean         # Nettoyage complet" -ForegroundColor Gray
Write-Host "   .\docker-optimize.ps1 -Force -FullClean  # Nettoyage complet sans confirmation" -ForegroundColor Gray