# Script de diagnostic pour les problèmes CI
# SalamBot Functions-Run - Diagnostic des échecs de tests

Write-Host "🔍 Diagnostic des problèmes CI SalamBot" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# 1. Vérification des ports utilisés
Write-Host "`n1. 📡 Vérification des ports 3001-3004:" -ForegroundColor Yellow
try {
    $ports = @(3001, 3002, 3003, 3004)
    foreach ($port in $ports) {
        $connection = Test-NetConnection -ComputerName localhost -Port $port -WarningAction SilentlyContinue
        if ($connection.TcpTestSucceeded) {
            Write-Host "   ✅ Port $port : OCCUPÉ" -ForegroundColor Green
        } else {
            Write-Host "   ❌ Port $port : LIBRE" -ForegroundColor Red
        }
    }
} catch {
    Write-Host "   ⚠️ Impossible de vérifier les ports" -ForegroundColor Yellow
}

# 2. Vérification des processus Node.js
Write-Host "`n2. 🟢 Processus Node.js actifs:" -ForegroundColor Yellow
try {
    $nodeProcesses = Get-Process -Name node -ErrorAction SilentlyContinue
    if ($nodeProcesses) {
        $nodeProcesses | Select-Object Id, ProcessName, StartTime | Format-Table -AutoSize
    } else {
        Write-Host "   ℹ️ Aucun processus Node.js actif" -ForegroundColor Blue
    }
} catch {
    Write-Host "   ⚠️ Erreur lors de la vérification des processus" -ForegroundColor Yellow
}

# 3. Variables d'environnement de test
Write-Host "`n3. 🔧 Variables d'environnement de test:" -ForegroundColor Yellow
$testVars = Get-ChildItem Env: | Where-Object { 
    $_.Name -like '*TEST*' -or 
    $_.Name -like '*MOCK*' -or 
    $_.Name -like '*JEST*' -or
    $_.Name -like '*NODE_ENV*' -or
    $_.Name -like '*CI*'
}
if ($testVars) {
    $testVars | Format-Table Name, Value -AutoSize
} else {
    Write-Host "   ℹ️ Aucune variable d'environnement de test trouvée" -ForegroundColor Blue
}

# 4. Vérification des fichiers de configuration
Write-Host "`n4. 📄 Fichiers de configuration:" -ForegroundColor Yellow
$configFiles = @(
    ".env.test",
    "jest.config.ts",
    "apps/functions-run/jest.config.ts",
    "apps/functions-run/.env.test"
)

foreach ($file in $configFiles) {
    if (Test-Path $file) {
        Write-Host "   ✅ $file : EXISTE" -ForegroundColor Green
    } else {
        Write-Host "   ❌ $file : MANQUANT" -ForegroundColor Red
    }
}

# 5. Vérification des services mock
Write-Host "`n5. 🎭 Scripts de services mock:" -ForegroundColor Yellow
$mockScripts = @(
    "apps/functions-run/src/__tests__/mocks/genkit-mock.mjs",
    "apps/functions-run/src/__tests__/mocks/rest-api-mock.mjs",
    "apps/functions-run/src/__tests__/mocks/websocket-mock.mjs",
    "apps/functions-run/src/__tests__/mocks/prometheus-mock.mjs"
)

foreach ($script in $mockScripts) {
    if (Test-Path $script) {
        Write-Host "   ✅ $script : EXISTE" -ForegroundColor Green
    } else {
        Write-Host "   ❌ $script : MANQUANT" -ForegroundColor Red
    }
}

# 6. Test de connectivité des services mock
Write-Host "`n6. 🌐 Test de connectivité des services mock:" -ForegroundColor Yellow
$mockServices = @(
    @{Name="Genkit"; Port=3001; Path="/health"},
    @{Name="REST API"; Port=3002; Path="/health"},
    @{Name="WebSocket"; Port=3003; Path="/health"},
    @{Name="Prometheus"; Port=3004; Path="/health"}
)

foreach ($service in $mockServices) {
    try {
        $uri = "http://localhost:$($service.Port)$($service.Path)"
        $response = Invoke-WebRequest -Uri $uri -TimeoutSec 2 -ErrorAction Stop
        Write-Host "   ✅ $($service.Name) : ACCESSIBLE" -ForegroundColor Green
    } catch {
        Write-Host "   ❌ $($service.Name) : INACCESSIBLE" -ForegroundColor Red
    }
}

Write-Host "`n🎯 Recommandations pour résoudre les échecs CI:" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "1. Augmenter les timeouts dans jest.config.ts" -ForegroundColor White
Write-Host "2. Améliorer la gestion des services mock dans le CI" -ForegroundColor White
Write-Host "3. Ajouter des retry mechanisms pour les tests flaky" -ForegroundColor White
Write-Host "4. Optimiser les health checks des services mock" -ForegroundColor White
Write-Host "5. Implémenter un cleanup plus robuste des ressources" -ForegroundColor White