#!/bin/bash

# Function to cleanly handle Ctrl+C
cleanup() {
    echo ""
    echo "Stopping Leads Generator services..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit
}

# Trap SIGINT (Ctrl+C)
trap cleanup SIGINT

echo "==================================================="
echo "  Starting Leads Generator Agent & Dashboard"
echo "==================================================="
echo ""

echo "[1/2] Starting Python FastAPI Backend (Port 8000)..."
source venv/bin/activate 2>/dev/null || source venv/Scripts/activate 2>/dev/null
python main.py serve </dev/null &
BACKEND_PID=$!

echo "[2/2] Starting Next.js Frontend (Port 3000)..."
cd web
npm run dev </dev/null &
FRONTEND_PID=$!

echo ""
echo "Both services are running!"
echo "Open http://localhost:3000 in your browser."
echo "Logs from both services will appear below. Press Ctrl+C to stop both."
echo ""

# Wait for background processes
wait $BACKEND_PID $FRONTEND_PID
