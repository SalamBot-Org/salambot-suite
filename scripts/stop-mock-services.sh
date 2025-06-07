#!/bin/bash

# Script to stop mock services for CI/CD pipeline
# SalamBot Functions-Run - API Gateway Enterprise

echo "🛑 Stopping mock services..."

# Change to the functions-run directory
cd "$(dirname "$0")/../apps/functions-run"

# Function to stop a service by PID
stop_service_by_pid() {
  local service_name=$1
  local pid_file="logs/${service_name}.pid"
  
  if [ -f "$pid_file" ]; then
    local pid=$(cat "$pid_file")
    if kill -0 "$pid" 2>/dev/null; then
      echo "🔄 Stopping $service_name (PID: $pid)..."
      kill "$pid" 2>/dev/null || true
      sleep 2
      
      # Force kill if still running
      if kill -0 "$pid" 2>/dev/null; then
        echo "⚡ Force stopping $service_name..."
        kill -9 "$pid" 2>/dev/null || true
      fi
      
      echo "✅ $service_name stopped"
    else
      echo "ℹ️ $service_name was not running"
    fi
    rm -f "$pid_file"
  else
    echo "ℹ️ No PID file found for $service_name"
  fi
}

# Function to stop services by port
stop_service_by_port() {
  local port=$1
  local service_name=$2
  
  echo "🔍 Checking for processes on port $port..."
  
  # Find processes using the port
  local pids=$(lsof -ti:"$port" 2>/dev/null || true)
  
  if [ -n "$pids" ]; then
    echo "🔄 Stopping $service_name processes on port $port..."
    echo "$pids" | xargs kill 2>/dev/null || true
    sleep 2
    
    # Force kill if still running
    local remaining_pids=$(lsof -ti:"$port" 2>/dev/null || true)
    if [ -n "$remaining_pids" ]; then
      echo "⚡ Force stopping remaining processes on port $port..."
      echo "$remaining_pids" | xargs kill -9 2>/dev/null || true
    fi
    
    echo "✅ Processes on port $port stopped"
  else
    echo "ℹ️ No processes found on port $port"
  fi
}

# Stop services by PID first (cleaner approach)
if [ -d "logs" ]; then
  stop_service_by_pid "genkit"
  stop_service_by_pid "rest-api"
  stop_service_by_pid "websocket"
  stop_service_by_pid "prometheus"
else
  echo "ℹ️ No logs directory found, using port-based cleanup"
fi

# Fallback: stop by port
stop_service_by_port 3001 "Genkit"
stop_service_by_port 3002 "REST-API"
stop_service_by_port 3003 "WebSocket"
stop_service_by_port 3004 "Prometheus"

# Additional cleanup: kill any remaining mock processes
echo "🧹 Additional cleanup..."
pkill -f "mock" 2>/dev/null || true
pkill -f "genkit-mock" 2>/dev/null || true
pkill -f "rest-api-mock" 2>/dev/null || true
pkill -f "websocket-mock" 2>/dev/null || true
pkill -f "prometheus-mock" 2>/dev/null || true

# Clean up log files if they exist
if [ -d "logs" ]; then
  echo "🗑️ Cleaning up log files..."
  rm -f logs/*.pid
  rm -f logs/*.log
fi

echo "✅ Mock services cleanup completed"