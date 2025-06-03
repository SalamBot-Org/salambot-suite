#!/usr/bin/env pwsh
# =============================================================================
# QADI Dataset Conversion Script v2.2
# =============================================================================
# Description: Convertit le dataset QADI en format JSON avec encodage UTF-8 correct
# Author: SalamBot Team
# Version: 2.2
# Date: 2025-06-03
# =============================================================================

param(
    [string]$InputPath = "../datasets/raw/QADI/testset/QADI_test.txt",
    [string]$OutputPath = "../datasets/processed/qadi-darija-validation.json",
    [switch]$Verbose = $false
)

# Configuration
$ErrorActionPreference = "Stop"
$OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "=== QADI Dataset Conversion v2.2 ===" -ForegroundColor Green
Write-Host "Input: $InputPath" -ForegroundColor Cyan
Write-Host "Output: $OutputPath" -ForegroundColor Cyan
Write-Host ""

# Vérifier que le fichier source existe
if (-not (Test-Path $InputPath)) {
    Write-Error "Fichier source introuvable: $InputPath"
    exit 1
}

# Créer le dossier de sortie si nécessaire
$outputDir = Split-Path $OutputPath -Parent
if (-not (Test-Path $outputDir)) {
    New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
    Write-Host "Dossier créé: $outputDir" -ForegroundColor Yellow
}

try {
    # Charger les données avec encodage UTF-8 explicite
    Write-Host "Chargement des données QADI..." -ForegroundColor Blue
    $testContent = Get-Content $InputPath -Encoding UTF8
    
    if ($Verbose) {
        Write-Host "Lignes chargées: $($testContent.Count)" -ForegroundColor Gray
    }

    # Extraire les échantillons marocains
    $moroccanSamples = @()
    $stats = @{
        total = 0
        moroccan = 0
        arabic = 0
        latin = 0
        biScript = 0
        other = 0
    }

    Write-Host "Extraction des échantillons marocains..." -ForegroundColor Blue
    
    foreach ($line in $testContent) {
        $stats.total++
        
        if ($line -match '\tMA$') {
            $stats.moroccan++
            $parts = $line -split '\t'
            
            if ($parts.Length -eq 2) {
                $text = $parts[0].Trim()
                
                # Analyser le script avec regex Unicode appropriées
                $hasArabic = $text -match '[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]'
                $hasLatin = $text -match '[a-zA-Z]'
                
                $script = "other"
                if ($hasArabic -and $hasLatin) {
                    $script = "bi-script"
                    $stats.biScript++
                } elseif ($hasArabic) {
                    $script = "arabic"
                    $stats.arabic++
                } elseif ($hasLatin) {
                    $script = "latin"
                    $stats.latin++
                } else {
                    $stats.other++
                }
                
                $sample = @{
                    id = "qadi_ma_$($stats.moroccan)"
                    text = $text
                    source = "QADI"
                    language = "darija"
                    script = $script
                    expected_detection = @{
                        confidence = 0.9
                        script = $script
                        language = "darija"
                    }
                    country = "MA"
                }
                
                $moroccanSamples += $sample
                
                if ($Verbose -and ($stats.moroccan % 50 -eq 0)) {
                    Write-Host "  Traité: $($stats.moroccan) échantillons marocains" -ForegroundColor Gray
                }
            }
        }
    }

    # Créer la structure JSON finale
    $jsonData = @{
        metadata = @{
            created_date = (Get-Date -Format "yyyy-MM-dd")
            version = "2.2.0"
            total_samples = $stats.moroccan
            scripts = @{
                bi_script = $stats.biScript
                arabic = $stats.arabic
                latin = $stats.latin
                other = $stats.other
            }
            source = "QCRI Arabic Dialect Identification (QADI)"
            description = "Dataset de validation pour la détection Darija bi-script basé sur QADI"
            name = "QADI Darija Validation Dataset"
            validation_objectives = @{
                darija_arabic_precision = 0.85
                darija_latin_precision = 0.9
                global_precision = 0.88
                response_time_ms = 100
                test_coverage = 0.85
            }
            encoding = "UTF-8"
            conversion_script = "convert-qadi-to-json.ps1 v2.2"
        }
        samples = $moroccanSamples
    }

    # Sauvegarder avec encodage UTF-8 sans BOM
    Write-Host "Sauvegarde du fichier JSON..." -ForegroundColor Blue
    
    $jsonString = $jsonData | ConvertTo-Json -Depth 10 -Compress:$false
    
    # Utiliser StreamWriter pour contrôler l'encodage
    $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
    $writer = New-Object System.IO.StreamWriter($OutputPath, $false, $utf8NoBom)
    try {
        $writer.Write($jsonString)
    } finally {
        $writer.Close()
    }

    # Afficher les statistiques
    Write-Host ""
    Write-Host "=== Statistiques de Conversion ===" -ForegroundColor Green
    Write-Host "Total lignes traitées: $($stats.total)" -ForegroundColor White
    Write-Host "Échantillons marocains: $($stats.moroccan)" -ForegroundColor White
    Write-Host "  - Arabe uniquement: $($stats.arabic) ($(($stats.arabic / $stats.moroccan * 100).ToString('F1'))%)" -ForegroundColor White
    Write-Host "  - Latin uniquement: $($stats.latin) ($(($stats.latin / $stats.moroccan * 100).ToString('F1'))%)" -ForegroundColor White
    Write-Host "  - Bi-script: $($stats.biScript) ($(($stats.biScript / $stats.moroccan * 100).ToString('F1'))%)" -ForegroundColor White
    Write-Host "  - Autre: $($stats.other) ($(($stats.other / $stats.moroccan * 100).ToString('F1'))%)" -ForegroundColor White
    Write-Host ""
    Write-Host "Fichier généré: $OutputPath" -ForegroundColor Green
    Write-Host "Encodage: UTF-8 sans BOM" -ForegroundColor Green
    Write-Host ""
    Write-Host "✅ Conversion terminée avec succès!" -ForegroundColor Green

} catch {
    Write-Error "Erreur lors de la conversion: $($_.Exception.Message)"
    exit 1
}