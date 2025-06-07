#!/bin/bash

# Script to start mock services for CI/CD pipeline
# SalamBot Functions-Run - API Gateway Enterprise

set -e

echo "🚀 Starting mock services for tests..."

# Change to the functions-run directory
cd "$(dirname "$0")/../apps/functions-run"

# Create logs directory if it doesn't exist
mkdir -p logs

# Function to check if a service is ready
check_service() {
  local port=$1
  local service_name=$2
  local max_attempts=30
  local attempt=1
  
  echo "🔍 Checking $service_name on port $port..."
  
  while [ $attempt -le $max_attempts ]; do
    if curl -f -s "http://localhost:$port/health" > /dev/null 2>&1; then
      echo "✅ $service_name is ready on port $port"
      return 0
    fi
    echo "⏳ Attempt $attempt/$max_attempts: Waiting for $service_name on port $port..."
    sleep 2
    attempt=$((attempt + 1))
  done
  
  echo "❌ $service_name failed to start on port $port after $max_attempts attempts"
  echo "📋 Last 10 lines of $service_name log:"
  tail -n 10 "logs/${service_name,,}.log" 2>/dev/null || echo "No log file found"
  return 1
}

# Function to check if port is open (for services without health endpoint)
check_port() {
  local port=$1
  local service_name=$2
  local max_attempts=30
  local attempt=1
  
  echo "🔍 Checking $service_name on port $port..."
  
  while [ $attempt -le $max_attempts ]; do
    if nc -z localhost "$port" 2>/dev/null; then
      echo "✅ $service_name is ready on port $port"
      return 0
    fi
    echo "⏳ Attempt $attempt/$max_attempts: Waiting for $service_name on port $port..."
    sleep 2
    attempt=$((attempt + 1))
  done
  
  echo "❌ $service_name failed to start on port $port after $max_attempts attempts"
  return 1
}

# Start mock services in background with proper logging
echo "📦 Starting Genkit mock service..."
MOCK_GENKIT_PORT=3001 nohup pnpm run mock:genkit > logs/genkit.log 2>&1 &
GENKIT_PID=$!

echo "📦 Starting REST API mock service..."
MOCK_REST_API_PORT=3002 nohup pnpm run mock:rest-api > logs/rest-api.log 2>&1 &
REST_API_PID=$!

echo "📦 Starting WebSocket mock service..."
MOCK_WEBSOCKET_PORT=3003 nohup pnpm run mock:websocket > logs/websocket.log 2>&1 &
WEBSOCKET_PID=$!

echo "📦 Starting Prometheus mock service..."
MOCK_PROMETHEUS_PORT=3004 nohup pnpm run mock:prometheus > logs/prometheus.log 2>&1 &
PROMETHEUS_PID=$!

# Store PIDs for cleanup
echo "$GENKIT_PID" > logs/genkit.pid
echo "$REST_API_PID" > logs/rest-api.pid
echo "$WEBSOCKET_PID" > logs/websocket.pid
echo "$PROMETHEUS_PID" > logs/prometheus.pid

echo "⏳ Waiting for services to start..."
sleep 5

# Check each service
SERVICES_FAILED=0

if ! check_service 3001 "Genkit"; then
  SERVICES_FAILED=$((SERVICES_FAILED + 1))
fi

if ! check_service 3002 "REST-API"; then
  SERVICES_FAILED=$((SERVICES_FAILED + 1))
fi

if ! check_service 3004 "Prometheus"; then
  SERVICES_FAILED=$((SERVICES_FAILED + 1))
fi

# WebSocket service doesn't have /health endpoint, just check if port is open
if ! check_port 3003 "WebSocket"; then
  SERVICES_FAILED=$((SERVICES_FAILED + 1))
fi

if [ $SERVICES_FAILED -eq 0 ]; then
  echo "✅ All mock services are ready!"
  echo "🎯 Tests can now run with mock services available"
  exit 0
else
  echo "❌ $SERVICES_FAILED service(s) failed to start"
  echo "🔍 Check the log files in logs/ directory for more details"
  exit 1
fi