# Analyse des données marocaines dans QADI

Write-Host "=== Analyse QADI - Données Marocaines ==="
Write-Host ""

# Analyser le fichier de test
Write-Host "Analyse du fichier de test QADI..."
$testContent = Get-Content 'QADI\testset\QADI_test.txt'

# Extraire les données marocaines
$moroccanSamples = @()
foreach ($line in $testContent) {
    if ($line -match '\tMA$') {
        $parts = $line -split '\t'
        if ($parts.Length -eq 2) {
            $moroccanSamples += @{
                Text = $parts[0]
                Country = $parts[1]
            }
        }
    }
}

Write-Host "Échantillons marocains trouvés: $($moroccanSamples.Length)"
Write-Host ""

if ($moroccanSamples.Length -gt 0) {
    Write-Host "=== Échantillons Darija Marocain ==="
    
    # Afficher les premiers échantillons
    $sampleCount = [Math]::Min(10, $moroccanSamples.Length)
    for ($i = 0; $i -lt $sampleCount; $i++) {
        Write-Host "Échantillon $($i + 1):"
        Write-Host "  Texte: $($moroccanSamples[$i].Text)"
        Write-Host "  Pays: $($moroccanSamples[$i].Country)"
        
        # Analyser le script (Latin vs Arabe)
        $text = $moroccanSamples[$i].Text
        $hasArabic = $text -match '[\u0600-\u06FF]'
        $hasLatin = $text -match '[a-zA-Z]'
        
        if ($hasArabic -and $hasLatin) {
            Write-Host "  Script: Bi-script (Arabe + Latin)"
        } elseif ($hasArabic) {
            Write-Host "  Script: Arabe"
        } elseif ($hasLatin) {
            Write-Host "  Script: Latin"
        } else {
            Write-Host "  Script: Autre/Mixte"
        }
        Write-Host ""
    }
    
    # Statistiques sur les scripts
    Write-Host "=== Statistiques Scripts ==="
    $arabicCount = 0
    $latinCount = 0
    $biscriptCount = 0
    $otherCount = 0
    
    foreach ($sample in $moroccanSamples) {
        $text = $sample.Text
        $hasArabic = $text -match '[\u0600-\u06FF]'
        $hasLatin = $text -match '[a-zA-Z]'
        
        if ($hasArabic -and $hasLatin) {
            $biscriptCount++
        } elseif ($hasArabic) {
            $arabicCount++
        } elseif ($hasLatin) {
            $latinCount++
        } else {
            $otherCount++
        }
    }
    
    Write-Host "Arabe uniquement: $arabicCount ($([Math]::Round($arabicCount / $moroccanSamples.Length * 100, 1))%)"
    Write-Host "Latin uniquement: $latinCount ($([Math]::Round($latinCount / $moroccanSamples.Length * 100, 1))%)"
    Write-Host "Bi-script: $biscriptCount ($([Math]::Round($biscriptCount / $moroccanSamples.Length * 100, 1))%)"
    Write-Host "Autre: $otherCount ($([Math]::Round($otherCount / $moroccanSamples.Length * 100, 1))%)"
    
} else {
    Write-Host "Aucun échantillon marocain trouvé dans le fichier de test."
}

Write-Host ""
Write-Host "=== Informations sur les IDs d'entraînement ==="
$trainIds = Get-Content 'QADI\dataset\QADI_train_ids_MA.txt'
Write-Host "IDs d'entraînement marocains: $($trainIds.Length)"
Write-Host "Premiers IDs: $($trainIds[0..4] -join ', ')"

Write-Host ""
Write-Host "=== Résumé ==="
Write-Host "- Dataset QADI contient des données d'identification de dialectes arabes"
Write-Host "- $($moroccanSamples.Length) échantillons de test marocains"
Write-Host "- $($trainIds.Length) IDs d'entraînement marocains (nécessitent hydratation Twitter)"
Write-Host "- Format: Texte + Code pays (MA pour Maroc)"
Write-Host "- Contient du Darija en scripts arabe et latin"