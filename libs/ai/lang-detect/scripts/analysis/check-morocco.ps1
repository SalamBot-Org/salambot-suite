# Vérification des données marocaines dans IADD

Write-Host "Chargement du dataset IADD..."
$data = Get-Content 'IADD\IADD.json' | ConvertFrom-Json

Write-Host "Recherche des entrées marocaines..."

# Vérifier tous les codes pays uniques
Write-Host "Codes pays uniques dans le dataset:"
$uniqueCountries = $data | Select-Object -ExpandProperty Country | Sort-Object | Get-Unique
foreach ($country in $uniqueCountries) {
    $count = ($data | Where-Object {$_.Country -eq $country}).Length
    Write-Host "  $country : $count entrées"
}

Write-Host ""
Write-Host "Recherche spécifique pour le Maroc..."

# Chercher Morocco avec différentes variantes
$moroccoVariants = @('Morocco', 'MAR', 'MA', 'morocco', 'MOROCCO')
foreach ($variant in $moroccoVariants) {
    $found = $data | Where-Object {$_.Country -eq $variant}
    if ($found.Length -gt 0) {
        Write-Host "Trouvé $($found.Length) entrées pour '$variant'"
        Write-Host "Échantillon:"
        $found | Select-Object -First 2 | ForEach-Object {
            Write-Host "  Texte: $($_.Sentence)"
            Write-Host "  Région: $($_.Region)"
            Write-Host "  Source: $($_.DataSource)"
            Write-Host ""
        }
    }
}

# Vérifier les données Maghrebi pour voir si elles contiennent du Darija
Write-Host "Analyse des données Maghrebi (MGH)..."
$maghrebi = $data | Where-Object {$_.Region -eq 'MGH'}
Write-Host "Total Maghrebi: $($maghrebi.Length)"

Write-Host "Échantillons Maghrebi:"
$maghrebi | Select-Object -First 5 | ForEach-Object {
    Write-Host "  Pays: $($_.Country)"
    Write-Host "  Texte: $($_.Sentence)"
    Write-Host "  Source: $($_.DataSource)"
    Write-Host ""
}