#!/bin/bash

# Deploy MCP Credit Report Demo to Development Environment

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

NAMESPACE="mcp-credit-report-dev"
OVERLAY="overlays/dev"

echo -e "${BLUE}MCP Credit Report Demo - Development Deployment${NC}\n"

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

# Check for secrets file
if [ ! -f "$OVERLAY/secrets.yaml" ]; then
    echo -e "\n${RED}Error: secrets.yaml not found${NC}"
    echo -e "${YELLOW}Please create secrets file:${NC}"
    echo "  cd $OVERLAY"
    echo "  cp secrets.yaml.template secrets.yaml"
    echo "  # Edit secrets.yaml with your credentials"
    echo ""
    echo "See SECRETS_MANAGEMENT.md for details"
    exit 1
fi

echo -e "${GREEN}✓${NC} Found secrets.yaml"

# Check if secrets contain placeholder values
if grep -q "REPLACE_WITH_YOUR" "$OVERLAY/secrets.yaml"; then
    echo -e "\n${YELLOW}⚠️  Warning: secrets.yaml contains placeholder values${NC}"
    echo "Please update secrets.yaml with actual credentials"
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 0
    fi
fi

# Preview manifests
echo -e "\n${BLUE}Previewing manifests...${NC}"
oc kustomize $OVERLAY | head -50
echo "..."

read -p "Deploy to development? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 0
fi

# Apply resources
echo -e "\n${BLUE}Applying resources...${NC}"
oc apply -k $OVERLAY

# Start builds
echo -e "\n${BLUE}Starting builds...${NC}"
oc start-build dev-mcp-server -n $NAMESPACE || true
oc start-build dev-api-server -n $NAMESPACE || true
oc start-build dev-nextjs -n $NAMESPACE || true

# Wait for builds
echo -e "\n${YELLOW}Waiting for builds (this may take several minutes)...${NC}"
oc wait --for=condition=Complete build/dev-mcp-server-1 -n $NAMESPACE --timeout=15m 2>/dev/null || echo "Build dev-mcp-server-1 not ready yet"
oc wait --for=condition=Complete build/dev-api-server-1 -n $NAMESPACE --timeout=15m 2>/dev/null || echo "Build dev-api-server-1 not ready yet"
oc wait --for=condition=Complete build/dev-nextjs-1 -n $NAMESPACE --timeout=15m 2>/dev/null || echo "Build dev-nextjs-1 not ready yet"

# Wait for deployments
echo -e "\n${YELLOW}Waiting for deployments...${NC}"
oc rollout status deployment/dev-mcp-server -n $NAMESPACE --timeout=5m
oc rollout status deployment/dev-api-server -n $NAMESPACE --timeout=5m
oc rollout status deployment/dev-nextjs -n $NAMESPACE --timeout=5m

# Get route
ROUTE_URL=$(oc get route dev-nextjs -n $NAMESPACE -o jsonpath='{.spec.host}' 2>/dev/null || echo "Route not found")

echo -e "\n${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}Development Deployment Complete!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
echo -e "  ${BLUE}URL:${NC} https://$ROUTE_URL"
echo -e "\n${YELLOW}Useful Commands:${NC}"
echo "  oc get all -n $NAMESPACE"
echo "  oc logs -f deployment/dev-mcp-server -n $NAMESPACE"
echo "  oc logs -f deployment/dev-api-server -n $NAMESPACE"
echo "  oc logs -f deployment/dev-nextjs -n $NAMESPACE"
echo ""
