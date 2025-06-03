# Script de conversion QADI vers JSON pour tests automatisés
# Phase 1: Intégration du dataset QADI dans le pipeline de tests

Write-Host "=== Conversion QADI vers JSON pour Tests ==="
Write-Host ""

# Charger les données de test QADI
Write-Host "Chargement des données QADI..."
$filePath = '../../raw/QADI/testset/QADI_test.txt'
Write-Host "File path: $filePath"
Write-Host "File exists: $(Test-Path $filePath)"
$testContent = Get-Content $filePath -Encoding UTF8
Write-Host "File loaded successfully. Content preview:"
Write-Host "First line: $($testContent[0])"
Write-Host "Last line: $($testContent[-1])"

# Extraire les échantillons marocains
$moroccanSamples = @()
$totalLines = $testContent.Length
$matchedLines = 0
Write-Host "Total lines in dataset: $totalLines"

foreach ($line in $testContent) {
    if ($line -match '\s+MA\s*$') {
        $matchedLines++
        # Split by spaces to separate text from country code
        # Use a more flexible approach to extract text before MA
        $parts = $line -split '\s+MA\s*$'
        if ($parts.Length -eq 2) {
            $text = $parts[0].Trim()
        } else {
            # Fallback: remove MA from the end
            $text = $line -replace '\s+MA\s*$', ''
            $text = $text.Trim()
        }
        if ($matchedLines -le 3) {
            Write-Host "Debug line ${matchedLines}: '$line'"
            Write-Host "Extracted text: '$text'"
        }
        
        if ($text -and $text.Length -gt 0) {
            
            # Analyser le script
            $hasArabic = $text -match '[\u0600-\u06FF]'
            $hasLatin = $text -match '[a-zA-Z]'
            
            $script = "other"
            if ($hasArabic -and $hasLatin) {
                $script = "bi-script"
            } elseif ($hasArabic) {
                $script = "arabic"
            } elseif ($hasLatin) {
                $script = "latin"
            }
            
            $sample = @{
                id = "qadi_ma_" + ($moroccanSamples.Length + 1)
                text = $text
                language = "darija"
                script = $script
                country = "MA"
                source = "QADI"
                expected_detection = @{
                    language = "darija"
                    confidence = 0.9
                    script = $script
                }
            }
            
            $moroccanSamples += $sample
        }
    }
}

Write-Host "Lines matching MA pattern: $matchedLines"
Write-Host "Échantillons marocains extraits: $($moroccanSamples.Length)"

# Créer la structure JSON finale
$validationDataset = @{
    metadata = @{
        name = "QADI Darija Validation Dataset"
        version = "1.0.0"
        description = "Dataset de validation pour la détection Darija bi-script basé sur QADI"
        source = "QCRI Arabic Dialect Identification (QADI)"
        created_date = (Get-Date -Format "yyyy-MM-dd")
        total_samples = $moroccanSamples.Length
        scripts = @{
            arabic = ($moroccanSamples | Where-Object {$_.script -eq "arabic"}).Length
            latin = ($moroccanSamples | Where-Object {$_.script -eq "latin"}).Length
            bi_script = ($moroccanSamples | Where-Object {$_.script -eq "bi-script"}).Length
            other = ($moroccanSamples | Where-Object {$_.script -eq "other"}).Length
        }
        validation_objectives = @{
            global_precision = 0.88
            darija_latin_precision = 0.90
            darija_arabic_precision = 0.85
            response_time_ms = 100
            test_coverage = 0.85
        }
    }
    samples = $moroccanSamples
}

# Sauvegarder en JSON
$outputPath = "../../processed/validation/qadi-darija-validation.json"
Write-Host "Sauvegarde vers $outputPath..."
$jsonContent = $validationDataset | ConvertTo-Json -Depth 10 -Compress
[System.IO.File]::WriteAllText($outputPath, $jsonContent, [System.Text.Encoding]::UTF8)

Write-Host ""
Write-Host "=== Statistiques du Dataset ==="
Write-Host "Total échantillons: $($moroccanSamples.Length)"
Write-Host "Arabe: $($validationDataset.metadata.scripts.arabic) ($([Math]::Round($validationDataset.metadata.scripts.arabic / $moroccanSamples.Length * 100, 1))%)"
Write-Host "Latin: $($validationDataset.metadata.scripts.latin) ($([Math]::Round($validationDataset.metadata.scripts.latin / $moroccanSamples.Length * 100, 1))%)"
Write-Host "Bi-script: $($validationDataset.metadata.scripts.bi_script) ($([Math]::Round($validationDataset.metadata.scripts.bi_script / $moroccanSamples.Length * 100, 1))%)"
Write-Host "Autre: $($validationDataset.metadata.scripts.other) ($([Math]::Round($validationDataset.metadata.scripts.other / $moroccanSamples.Length * 100, 1))%)"

Write-Host ""
Write-Host "=== Échantillons par Script ==="

# Afficher quelques échantillons par type de script
$arabicSamples = $moroccanSamples | Where-Object {$_.script -eq "arabic"} | Select-Object -First 3
if ($arabicSamples.Length -gt 0) {
    Write-Host "Échantillons Arabe:"
    foreach ($sample in $arabicSamples) {
        Write-Host "  - $($sample.text)"
    }
    Write-Host ""
}

$latinSamples = $moroccanSamples | Where-Object {$_.script -eq "latin"} | Select-Object -First 3
if ($latinSamples.Length -gt 0) {
    Write-Host "Échantillons Latin:"
    foreach ($sample in $latinSamples) {
        Write-Host "  - $($sample.text)"
    }
    Write-Host ""
}

$biscriptSamples = $moroccanSamples | Where-Object {$_.script -eq "bi-script"}
if ($biscriptSamples.Length -gt 0) {
    Write-Host "Échantillons Bi-script:"
    foreach ($sample in $biscriptSamples) {
        Write-Host "  - $($sample.text)"
    }
    Write-Host ""
}

Write-Host "=== Conversion Terminée ==="
Write-Host "Fichier généré: $outputPath"
Write-Host "Prêt pour intégration dans les tests automatisés!"