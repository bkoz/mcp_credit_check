#!/bin/bash

# Deploy MCP Credit Report Demo to Production Environment

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

NAMESPACE="mcp-credit-report-prod"
OVERLAY="overlays/prod"

echo -e "${BLUE}MCP Credit Report Demo - Production Deployment${NC}\n"

# Check prerequisites
if ! command -v oc &> /dev/null; then
    echo -e "${RED}Error: 'oc' CLI not found${NC}"
    exit 1
fi

if ! oc whoami &> /dev/null; then
    echo -e "${RED}Error: Not logged into OpenShift${NC}"
    echo "Run: oc login <cluster-url>"
    exit 1
fi

echo -e "${GREEN}✓${NC} Logged in as: $(oc whoami)"

# Preview manifests
echo -e "\n${BLUE}Previewing manifests...${NC}"
oc kustomize $OVERLAY | head -50
echo "..."

echo -e "\n${RED}⚠️  WARNING: This will deploy to PRODUCTION${NC}"
read -p "Are you sure you want to continue? (yes/no) " -r
echo
if [[ ! $REPLY == "yes" ]]; then
    exit 0
fi

# Apply resources
echo -e "\n${BLUE}Applying resources...${NC}"
oc apply -k $OVERLAY

# Start builds
echo -e "\n${BLUE}Starting builds...${NC}"
oc start-build prod-mcp-server -n $NAMESPACE || true
oc start-build prod-api-server -n $NAMESPACE || true
oc start-build prod-nextjs -n $NAMESPACE || true

# Wait for builds
echo -e "\n${YELLOW}Waiting for builds (this may take several minutes)...${NC}"
oc wait --for=condition=Complete build/prod-mcp-server-1 -n $NAMESPACE --timeout=15m 2>/dev/null || echo "Build prod-mcp-server-1 not ready yet"
oc wait --for=condition=Complete build/prod-api-server-1 -n $NAMESPACE --timeout=15m 2>/dev/null || echo "Build prod-api-server-1 not ready yet"
oc wait --for=condition=Complete build/prod-nextjs-1 -n $NAMESPACE --timeout=15m 2>/dev/null || echo "Build prod-nextjs-1 not ready yet"

# Wait for deployments
echo -e "\n${YELLOW}Waiting for deployments...${NC}"
oc rollout status deployment/prod-mcp-server -n $NAMESPACE --timeout=5m
oc rollout status deployment/prod-api-server -n $NAMESPACE --timeout=5m
oc rollout status deployment/prod-nextjs -n $NAMESPACE --timeout=5m

# Get route
ROUTE_URL=$(oc get route prod-nextjs -n $NAMESPACE -o jsonpath='{.spec.host}' 2>/dev/null || echo "Route not found")

echo -e "\n${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}Production Deployment Complete!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
echo -e "  ${BLUE}URL:${NC} https://$ROUTE_URL"
echo -e "\n${YELLOW}Useful Commands:${NC}"
echo "  oc get all -n $NAMESPACE"
echo "  oc logs -f deployment/prod-mcp-server -n $NAMESPACE"
echo "  oc logs -f deployment/prod-api-server -n $NAMESPACE"
echo "  oc logs -f deployment/prod-nextjs -n $NAMESPACE"
echo ""
