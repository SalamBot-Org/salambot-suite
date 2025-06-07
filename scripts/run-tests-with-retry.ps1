#!/usr/bin/env pwsh
# Script pour exécuter les tests avec retry automatique
# SalamBot Functions-Run - Corrections CI

param(
    [int]$MaxRetries = 3,
    [string]$TestCommand = "pnpm test",
    [int]$DelayBetweenRetries = 30
)

$ErrorActionPreference = "Continue"

Write-Host "🧪 Exécution des tests avec retry automatique (max: $MaxRetries tentatives)" -ForegroundColor Green

$attempt = 1
$success = $false

while ($attempt -le $MaxRetries -and -not $success) {
    Write-Host "\n🚀 Tentative $attempt/$MaxRetries" -ForegroundColor Cyan
    Write-Host "=" * 50 -ForegroundColor Gray
    
    # Clean up before each attempt (except first)
    if ($attempt -gt 1) {
        Write-Host "🧹 Nettoyage avant nouvelle tentative..." -ForegroundColor Yellow
        
        # Stop any remaining processes
        $ports = @(3001, 3002, 3003, 3004)
        foreach ($port in $ports) {
            try {
                $processes = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess
                foreach ($processId in $processes) {
                    Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
                }
            }
            catch {
                # Ignore cleanup errors
            }
        }
        
        # Clean up log files
        if (Test-Path "apps\functions-run\logs") {
            Remove-Item "apps\functions-run\logs\*.log" -Force -ErrorAction SilentlyContinue
            Remove-Item "apps\functions-run\logs\*.pid" -Force -ErrorAction SilentlyContinue
        }
        
        Write-Host "⏳ Attente de $DelayBetweenRetries secondes avant retry..." -ForegroundColor Yellow
        Start-Sleep -Seconds $DelayBetweenRetries
    }
    
    # Execute test command
    Write-Host "▶️ Exécution: $TestCommand" -ForegroundColor White
    $startTime = Get-Date
    
    try {
        # Use Invoke-Expression to handle complex commands
        $result = Invoke-Expression $TestCommand
        $exitCode = $LASTEXITCODE
        
        $endTime = Get-Date
        $duration = $endTime - $startTime
        
        if ($exitCode -eq 0) {
            Write-Host "\n✅ Tests réussis à la tentative $attempt!" -ForegroundColor Green
            Write-Host "⏱️ Durée: $($duration.ToString('mm\:ss'))" -ForegroundColor Green
            $success = $true
        } else {
            Write-Host "\n❌ Tests échoués à la tentative $attempt (code: $exitCode)" -ForegroundColor Red
            Write-Host "⏱️ Durée: $($duration.ToString('mm\:ss'))" -ForegroundColor Yellow
            
            if ($attempt -lt $MaxRetries) {
                Write-Host "🔄 Préparation de la tentative suivante..." -ForegroundColor Yellow
            }
        }
    }
    catch {
        $endTime = Get-Date
        $duration = $endTime - $startTime
        
        Write-Host "\n💥 Erreur lors de l'exécution des tests: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "⏱️ Durée: $($duration.ToString('mm\:ss'))" -ForegroundColor Yellow
        
        if ($attempt -lt $MaxRetries) {
            Write-Host "🔄 Préparation de la tentative suivante..." -ForegroundColor Yellow
        }
    }
    
    $attempt++
}

# Final result
Write-Host "\n" + "=" * 50 -ForegroundColor Gray

if ($success) {
    Write-Host "🎉 Tests terminés avec succès!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "💔 Tous les tests ont échoué après $MaxRetries tentatives" -ForegroundColor Red
    Write-Host "🔍 Vérifiez les logs pour plus de détails" -ForegroundColor Yellow
    
    # Show recent error logs if available
    $logDir = "apps\functions-run\logs"
    if (Test-Path $logDir) {
        Write-Host "\n📋 Derniers logs d'erreur:" -ForegroundColor Yellow
        Get-ChildItem "$logDir\*.error.log" -ErrorAction SilentlyContinue | ForEach-Object {
            Write-Host "\n--- $($_.Name) ---" -ForegroundColor Cyan
            Get-Content $_.FullName -Tail 10 -ErrorAction SilentlyContinue
        }
    }
    
    exit 1
}