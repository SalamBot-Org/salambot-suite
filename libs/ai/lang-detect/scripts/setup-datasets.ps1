#!/usr/bin/env pwsh
# =============================================================================
# Dataset Organization Setup Script v2.2
# =============================================================================
# Description: Réorganise la structure des datasets selon les bonnes pratiques
# Author: SalamBot Team
# Version: 2.2
# Date: 2025-06-03
# =============================================================================

param(
    [switch]$Force = $false,
    [switch]$Verbose = $false
)

$ErrorActionPreference = "Stop"

Write-Host "=== Setup Dataset Organization v2.2 ===" -ForegroundColor Green
Write-Host ""

# Configuration des chemins
$baseDir = Split-Path $PSScriptRoot -Parent
$currentDatasetsDir = Join-Path $baseDir "datasets"
$newStructure = @{
    "raw" = @(
        "QADI",
        "IADD"
    )
    "processed" = @(
        "validation",
        "training",
        "test"
    )
    "scripts" = @(
        "conversion",
        "analysis",
        "validation"
    )
    "docs" = @(
        "datasets"
    )
}

function Write-Step {
    param([string]$Message)
    Write-Host "[STEP] $Message" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[OK] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARN] $Message" -ForegroundColor Yellow
}

function Write-Info {
    param([string]$Message)
    if ($Verbose) {
        Write-Host "[INFO] $Message" -ForegroundColor Gray
    }
}

try {
    # 1. Créer la nouvelle structure de dossiers
    Write-Step "Création de la nouvelle structure de dossiers"
    
    foreach ($category in $newStructure.Keys) {
        $categoryPath = Join-Path $baseDir $category
        
        if (-not (Test-Path $categoryPath)) {
            New-Item -ItemType Directory -Path $categoryPath -Force | Out-Null
            Write-Info "Créé: $category/"
        }
        
        foreach ($subDir in $newStructure[$category]) {
            $subDirPath = Join-Path $categoryPath $subDir
            if (-not (Test-Path $subDirPath)) {
                New-Item -ItemType Directory -Path $subDirPath -Force | Out-Null
                Write-Info "Créé: $category/$subDir/"
            }
        }
    }
    
    Write-Success "Structure de dossiers créée"

    # 2. Déplacer les datasets existants vers raw/
    Write-Step "Migration des datasets vers raw/"
    
    $rawDir = Join-Path $baseDir "raw"
    
    # Déplacer QADI
    $qadiSource = Join-Path $currentDatasetsDir "QADI"
    $qadiTarget = Join-Path $rawDir "QADI"
    
    if ((Test-Path $qadiSource) -and (-not (Test-Path $qadiTarget) -or $Force)) {
        if (Test-Path $qadiTarget) {
            Remove-Item $qadiTarget -Recurse -Force
        }
        Move-Item $qadiSource $qadiTarget
        Write-Success "QADI déplacé vers raw/QADI/"
    } elseif (Test-Path $qadiTarget) {
        Write-Warning "QADI existe déjà dans raw/ (utilisez -Force pour écraser)"
    }
    
    # Déplacer IADD
    $iaddSource = Join-Path $currentDatasetsDir "IADD"
    $iaddTarget = Join-Path $rawDir "IADD"
    
    if ((Test-Path $iaddSource) -and (-not (Test-Path $iaddTarget) -or $Force)) {
        if (Test-Path $iaddTarget) {
            Remove-Item $iaddTarget -Recurse -Force
        }
        Move-Item $iaddSource $iaddTarget
        Write-Success "IADD déplacé vers raw/IADD/"
    } elseif (Test-Path $iaddTarget) {
        Write-Warning "IADD existe déjà dans raw/ (utilisez -Force pour écraser)"
    }

    # 3. Déplacer les scripts vers scripts/
    Write-Step "Migration des scripts"
    
    $scriptsDir = Join-Path $baseDir "scripts"
    $conversionDir = Join-Path $scriptsDir "conversion"
    $analysisDir = Join-Path $scriptsDir "analysis"
    
    $scriptsToMove = @(
        @{ Source = "convert-qadi-to-json.ps1"; Target = $conversionDir; Category = "conversion" },
        @{ Source = "analyze-qadi-morocco.ps1"; Target = $analysisDir; Category = "analysis" },
        @{ Source = "analyze-iadd.ps1"; Target = $analysisDir; Category = "analysis" },
        @{ Source = "check-morocco.ps1"; Target = $analysisDir; Category = "analysis" }
    )
    
    foreach ($script in $scriptsToMove) {
        $sourcePath = Join-Path $currentDatasetsDir $script.Source
        $targetPath = Join-Path $script.Target $script.Source
        
        if ((Test-Path $sourcePath) -and (-not (Test-Path $targetPath) -or $Force)) {
            if (Test-Path $targetPath) {
                Remove-Item $targetPath -Force
            }
            Move-Item $sourcePath $targetPath
            Write-Success "$($script.Source) déplacé vers scripts/$($script.Category)/"
        } elseif (Test-Path $sourcePath) {
            Write-Warning "$($script.Source) existe déjà dans scripts/$($script.Category)/ (utilisez -Force pour écraser)"
        }
    }

    # 4. Déplacer le fichier JSON corrompu vers processed/
    Write-Step "Migration du fichier JSON existant"
    
    $jsonSource = Join-Path $currentDatasetsDir "qadi-darija-validation.json"
    $processedDir = Join-Path $baseDir "processed"
    $validationDir = Join-Path $processedDir "validation"
    $jsonTarget = Join-Path $validationDir "qadi-darija-validation-corrupted.json"
    
    if (Test-Path $jsonSource) {
        if (-not (Test-Path $jsonTarget) -or $Force) {
            if (Test-Path $jsonTarget) {
                Remove-Item $jsonTarget -Force
            }
            Move-Item $jsonSource $jsonTarget
            Write-Success "Fichier JSON corrompu sauvegardé dans processed/validation/"
        } else {
            Write-Warning "Fichier JSON corrompu existe déjà (utilisez -Force pour écraser)"
        }
    }

    # 5. Créer les fichiers README pour chaque dossier
    Write-Step "Création des fichiers de documentation"
    
    # README principal datasets
    $mainReadme = @"
# Datasets Lang-Detect v2.2

Structure organisée des datasets pour la détection Darija bi-script.

## Structure

```
lang-detect/
├── raw/                     # Datasets sources non modifiés
│   ├── QADI/               # QCRI Arabic Dialect Identification
│   └── IADD/               # Integrated Arabic Dialect Identification
├── processed/              # Datasets traités et formatés
│   ├── validation/         # Datasets de validation
│   ├── training/           # Datasets d'entraînement
│   └── test/               # Datasets de test
├── scripts/                # Scripts de traitement
│   ├── conversion/         # Scripts de conversion
│   ├── analysis/           # Scripts d'analyse
│   └── validation/         # Scripts de validation
└── docs/                   # Documentation
    └── datasets/           # Documentation des datasets
```

## Utilisation

1. **Conversion QADI**: `./scripts/conversion/convert-qadi-to-json.ps1`
2. **Analyse datasets**: `./scripts/analysis/analyze-*.ps1`
3. **Validation**: `./scripts/validation/validate-*.ps1`

## Objectifs de Qualité

- **Précision Darija**: >88%
- **Couverture bi-script**: >85%
- **Temps de réponse**: <100ms
- **Encodage**: UTF-8 sans BOM

## Statut

- ✅ Structure organisée
- ✅ Scripts de conversion v2.2
- ⚠️ Encodage corrigé
- 🔄 Tests en cours
"@
    
    $readmePath = Join-Path $baseDir "README.md"
    if (-not (Test-Path $readmePath) -or $Force) {
        $mainReadme | Out-File -FilePath $readmePath -Encoding UTF8
        Write-Success "README principal créé"
    }

    # 6. Nettoyer l'ancien dossier datasets s'il est vide
    Write-Step "Nettoyage de l'ancienne structure"
    
    if (Test-Path $currentDatasetsDir) {
        $remainingItems = Get-ChildItem $currentDatasetsDir -Force
        if ($remainingItems.Count -eq 0) {
            Remove-Item $currentDatasetsDir -Force
            Write-Success "Ancien dossier datasets/ supprimé (vide)"
        } else {
            Write-Warning "Ancien dossier datasets/ contient encore des fichiers:"
            foreach ($item in $remainingItems) {
                Write-Host "  - $($item.Name)" -ForegroundColor Gray
            }
        }
    }

    # 7. Afficher la nouvelle structure
    Write-Host ""
    Write-Host "=== Nouvelle Structure ===" -ForegroundColor Green
    Write-Host ""
    
    function Show-Tree {
        param([string]$Path, [string]$Prefix = "", [bool]$IsLast = $true)
        
        $items = Get-ChildItem $Path -Force | Sort-Object Name
        for ($i = 0; $i -lt $items.Count; $i++) {
            $item = $items[$i]
            $isLastItem = ($i -eq $items.Count - 1)
            $connector = if ($isLastItem) { "+-- " } else { "|-- " }
            $newPrefix = if ($isLastItem) { "    " } else { "|   " }
            
            $displayName = if ($item.PSIsContainer) { "$($item.Name)/" } else { $item.Name }
            Write-Host "$Prefix$connector$displayName" -ForegroundColor $(if ($item.PSIsContainer) { "Blue" } else { "White" })
            
            if ($item.PSIsContainer -and $item.Name -notmatch "^\.") {
                Show-Tree $item.FullName "$Prefix$newPrefix" $isLastItem
            }
        }
    }
    
    Show-Tree $baseDir
    
    Write-Host ""
    Write-Host "✅ Réorganisation terminée avec succès!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Prochaines étapes:" -ForegroundColor Yellow
    Write-Host "1. Exécuter: ./scripts/convert-qadi-to-json.ps1" -ForegroundColor White
    Write-Host "2. Valider l'encodage UTF-8" -ForegroundColor White
    Write-Host "3. Lancer les tests: npm test" -ForegroundColor White
    Write-Host ""

} catch {
    Write-Error "Erreur lors de la réorganisation: $($_.Exception.Message)"
    exit 1
}