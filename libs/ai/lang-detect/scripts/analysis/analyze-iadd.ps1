# Script d'analyse du dataset IADD
# Analyse la structure et le contenu du dataset pour la détection Darija

Write-Host "=== Analyse du Dataset IADD ==="
Write-Host ""

# Charger le dataset
Write-Host "Chargement du dataset IADD..."
$data = Get-Content 'IADD\IADD.json' | ConvertFrom-Json

# Statistiques générales
Write-Host "=== Statistiques Générales ==="
Write-Host "Total d'entrées: $($data.Length)"
Write-Host ""

# Analyse par région
Write-Host "=== Répartition par Région ==="
$regions = $data | Group-Object Region | Sort-Object Count -Descending
foreach ($region in $regions) {
    Write-Host "$($region.Name): $($region.Count) entrées"
}
Write-Host ""

# Analyse par pays
Write-Host "=== Répartition par Pays ==="
$countries = $data | Group-Object Country | Sort-Object Count -Descending
foreach ($country in $countries) {
    Write-Host "$($country.Name): $($country.Count) entrées"
}
Write-Host ""

# Focus sur les données Maghrebi
Write-Host "=== Focus Maghrebi (MGH) ==="
$maghrebi = $data | Where-Object {$_.Region -eq 'MGH'}
Write-Host "Total Maghrebi: $($maghrebi.Length) entrées"

$maghrebiCountries = $maghrebi | Group-Object Country | Sort-Object Count -Descending
foreach ($country in $maghrebiCountries) {
    Write-Host "  $($country.Name): $($country.Count) entrées"
}
Write-Host ""

# Focus sur les données Marocaines
Write-Host "=== Focus Maroc (MAR) ==="
$moroccan = $data | Where-Object {$_.Country -eq 'MAR'}
Write-Host "Total Marocain: $($moroccan.Length) entrées"

# Analyse des sources de données pour le Maroc
if ($moroccan.Length -gt 0) {
    $moroccanSources = $moroccan | Group-Object DataSource | Sort-Object Count -Descending
    Write-Host "Sources pour le Maroc:"
    foreach ($source in $moroccanSources) {
        Write-Host "  $($source.Name): $($source.Count) entrées"
    }
    
    # Échantillons marocains
    Write-Host ""
    Write-Host "=== Échantillons Marocains ==="
    $samples = $moroccan | Select-Object -First 5
    for ($i = 0; $i -lt $samples.Length; $i++) {
        Write-Host "Échantillon $($i + 1):"
        Write-Host "  Texte: $($samples[$i].Sentence)"
        Write-Host "  Source: $($samples[$i].DataSource)"
        Write-Host "  Région: $($samples[$i].Region)"
        Write-Host ""
    }
}

# Analyse des sources de données
Write-Host "=== Répartition par Source ==="
$sources = $data | Group-Object DataSource | Sort-Object Count -Descending
foreach ($source in $sources) {
    Write-Host "$($source.Name): $($source.Count) entrées"
}

Write-Host ""
Write-Host "=== Analyse Terminée ==="