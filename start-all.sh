#!/bin/bash

# MCP Credit Report Demo - Start All Services
# Starts MCP server, API server, and Next.js UI in parallel

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}Starting MCP Credit Report Demo...${NC}\n"

# Trap to cleanup on exit
cleanup() {
    echo -e "\n${YELLOW}Shutting down all services...${NC}"
    jobs -p | xargs -r kill 2>/dev/null || true
    wait
    echo -e "${GREEN}All services stopped.${NC}"
    exit 0
}

trap cleanup SIGINT SIGTERM EXIT

# Start MCP Server (port 3001)
echo -e "${BLUE}[1/3]${NC} Starting MCP server on port 3001..."
cd mcp-server
npm run dev > ../logs/mcp-server.log 2>&1 &
MCP_PID=$!
cd ..
echo -e "${GREEN}✓${NC} MCP server started (PID: $MCP_PID)"

# Wait a moment for MCP server to start
sleep 2

# Start API Server (port 3002)
echo -e "${BLUE}[2/3]${NC} Starting API server on port 3002..."
cd api-server
npm run dev > ../logs/api-server.log 2>&1 &
API_PID=$!
cd ..
echo -e "${GREEN}✓${NC} API server started (PID: $API_PID)"

# Wait a moment for API server to start
sleep 2

# Start Next.js UI (port 3000)
echo -e "${BLUE}[3/3]${NC} Starting Next.js UI on port 3000..."
npm run dev > logs/nextjs.log 2>&1 &
NEXT_PID=$!
echo -e "${GREEN}✓${NC} Next.js UI started (PID: $NEXT_PID)"

# Wait for Next.js to compile
sleep 3

echo -e "\n${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}All services are running!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

echo -e "  ${BLUE}MCP Server:${NC}  http://localhost:3001/mcp (PID: $MCP_PID)"
echo -e "  ${BLUE}API Server:${NC}  http://localhost:3002 (PID: $API_PID)"
echo -e "  ${BLUE}Next.js UI:${NC}  http://localhost:3000 (PID: $NEXT_PID)"

echo -e "\n${YELLOW}Logs are being written to:${NC}"
echo -e "  - logs/mcp-server.log"
echo -e "  - logs/api-server.log"
echo -e "  - logs/nextjs.log"

echo -e "\n${YELLOW}Press Ctrl+C to stop all services${NC}\n"

# Wait for all background processes
wait
