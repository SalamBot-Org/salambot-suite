#!/usr/bin/env pwsh
# Script robuste pour démarrer les services mock
# SalamBot Functions-Run - Corrections CI

param(
    [int]$MaxRetries = 3,
    [int]$ServiceTimeout = 60,
    [int]$InitialWait = 10
)

$ErrorActionPreference = "Stop"

Write-Host "🚀 Démarrage robuste des services mock..." -ForegroundColor Green

# Change to the functions-run directory
Set-Location "$PSScriptRoot\..\apps\functions-run"

# Create logs directory
if (-not (Test-Path "logs")) {
    New-Item -ItemType Directory -Path "logs" -Force | Out-Null
}

# Function to wait for service with exponential backoff
function Wait-ForService {
    param(
        [int]$Port,
        [string]$ServiceName,
        [int]$MaxAttempts = 60
    )
    
    Write-Host "🔍 Attente du service $ServiceName sur le port $Port..." -ForegroundColor Yellow
    
    $attempt = 1
    $waitTime = 1
    
    while ($attempt -le $MaxAttempts) {
        try {
            # Check if process is still running
            $pidFile = "logs\$($ServiceName.ToLower()).pid"
            if (Test-Path $pidFile) {
                $pid = Get-Content $pidFile -ErrorAction SilentlyContinue
                if ($pid -and -not (Get-Process -Id $pid -ErrorAction SilentlyContinue)) {
                    Write-Host "❌ Le processus $ServiceName (PID: $pid) s'est arrêté" -ForegroundColor Red
                    if (Test-Path "logs\$($ServiceName.ToLower()).log") {
                        Write-Host "📋 Dernières 20 lignes du log $ServiceName :" -ForegroundColor Yellow
                        Get-Content "logs\$($ServiceName.ToLower()).log" -Tail 20
                    }
                    return $false
                }
            }
            
            $response = Invoke-WebRequest -Uri "http://localhost:$Port/health" -Method GET -TimeoutSec 5 -ErrorAction SilentlyContinue
            if ($response.StatusCode -eq 200) {
                Write-Host "✅ $ServiceName est prêt sur le port $Port" -ForegroundColor Green
                return $true
            }
        }
        catch {
            # Service not ready yet
        }
        
        Write-Host "⏳ Tentative $attempt/$MaxAttempts : Attente de $ServiceName (délai: ${waitTime}s)" -ForegroundColor Yellow
        Start-Sleep -Seconds $waitTime
        
        # Exponential backoff with max 3 seconds
        $waitTime = [Math]::Min($waitTime + 1, 5)
        $attempt++
    }
    
    Write-Host "❌ $ServiceName a échoué à démarrer sur le port $Port" -ForegroundColor Red
    if (Test-Path "logs\$($ServiceName.ToLower()).log") {
        Write-Host "📋 Dernières lignes du log:" -ForegroundColor Yellow
        Get-Content "logs\$($ServiceName.ToLower()).log" -Tail 20
    }
    return $false
}

# Function to check port availability
function Test-PortAvailable {
    param([int]$Port)
    
    try {
        $connection = New-Object System.Net.Sockets.TcpClient
        $connection.Connect('localhost', $Port)
        $connection.Close()
        return $false  # Port is in use
    }
    catch {
        return $true   # Port is available
    }
}

# Function to kill process on port
function Stop-ProcessOnPort {
    param([int]$Port)
    
    try {
        $processes = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess
        foreach ($processId in $processes) {
            Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
            Write-Host "⚠️ Processus $processId arrêté sur le port $Port" -ForegroundColor Yellow
        }
        Start-Sleep -Seconds 2
    }
    catch {
        # Ignore errors
    }
}

# Clean up any existing services
Write-Host "🧹 Nettoyage des services existants..." -ForegroundColor Yellow
$ports = @(3001, 3002, 3003, 3004)
foreach ($port in $ports) {
    if (-not (Test-PortAvailable -Port $port)) {
        Write-Host "⚠️ Port $port déjà utilisé, tentative d'arrêt..." -ForegroundColor Yellow
        Stop-ProcessOnPort -Port $port
    }
}

# Start services with better error handling
Write-Host "📦 Démarrage des services mock..." -ForegroundColor Green

$services = @(
    @{ Name = "Genkit"; Port = 3001; Script = "mock:genkit" },
    @{ Name = "REST-API"; Port = 3002; Script = "mock:rest-api" },
    @{ Name = "WebSocket"; Port = 3003; Script = "mock:websocket" },
    @{ Name = "Prometheus"; Port = 3004; Script = "mock:prometheus" }
)

$processes = @()

foreach ($service in $services) {
    Write-Host "Starting $($service.Name) mock service..." -ForegroundColor Cyan
    
    $env:"MOCK_$($service.Name.ToUpper().Replace('-', '_'))_PORT" = $service.Port
    
    $processInfo = Start-Process -FilePath "pnpm" -ArgumentList "run", $service.Script -NoNewWindow -PassThru -RedirectStandardOutput "logs\$($service.Name.ToLower()).log" -RedirectStandardError "logs\$($service.Name.ToLower()).error.log"
    
    $processes += @{
        Name = $service.Name
        Port = $service.Port
        Process = $processInfo
    }
    
    # Store PID for cleanup
    $processInfo.Id | Out-File "logs\$($service.Name.ToLower()).pid" -Encoding ASCII
    
    Start-Sleep -Seconds 3
}

# Wait initial delay for services to initialize
Write-Host "⏳ Attente initiale de $InitialWait secondes pour l'initialisation des services..." -ForegroundColor Yellow
Start-Sleep -Seconds $InitialWait

# Wait for all services to be ready
Write-Host "⏳ Vérification de la disponibilité des services..." -ForegroundColor Yellow
$servicesFailed = 0

foreach ($service in $services) {
    if ($service.Name -eq "WebSocket") {
        # WebSocket check (no health endpoint) - use port connectivity test
        $wsReady = $false
        for ($attempt = 1; $attempt -le 30; $attempt++) {
            try {
                $tcpClient = New-Object System.Net.Sockets.TcpClient
                $connect = $tcpClient.BeginConnect("localhost", $service.Port, $null, $null)
                $wait = $connect.AsyncWaitHandle.WaitOne(1000, $false)
                
                if ($wait) {
                    try {
                        $tcpClient.EndConnect($connect)
                        $tcpClient.Close()
                        Write-Host "✅ WebSocket service disponible sur le port $($service.Port)" -ForegroundColor Green
                        $wsReady = $true
                        break
                    }
                    catch {
                        $tcpClient.Close()
                    }
                }
                else {
                    $tcpClient.Close()
                }
            }
            catch {
                # Port not ready yet
            }
            
            Write-Host "⏳ Tentative $attempt/30 : Attente WebSocket..." -ForegroundColor Yellow
            Start-Sleep -Seconds 2
        }
        
        if (-not $wsReady) {
            Write-Host "❌ WebSocket service non disponible après 30 tentatives" -ForegroundColor Red
            $servicesFailed++
        }
    } else {
        if (-not (Wait-ForService -Port $service.Port -ServiceName $service.Name)) {
            $servicesFailed++
        }
    }
}

if ($servicesFailed -eq 0) {
    Write-Host "✅ Tous les services mock sont prêts!" -ForegroundColor Green
    Write-Host "🎯 Les tests peuvent maintenant s'exécuter" -ForegroundColor Green
    exit 0
} else {
    Write-Host "❌ $servicesFailed service(s) ont échoué à démarrer" -ForegroundColor Red
    Write-Host "🔍 Vérifiez les fichiers de log dans le répertoire logs/" -ForegroundColor Yellow
    exit 1
}