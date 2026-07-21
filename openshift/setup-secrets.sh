#!/bin/bash

# Setup script for creating secrets files from templates

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}MCP Credit Report - Secrets Setup${NC}\n"

# Function to setup secrets for an environment
setup_environment() {
    local env=$1
    local env_dir="overlays/$env"

    echo -e "${BLUE}Setting up $env environment...${NC}"

    # Check if template exists
    if [ ! -f "$env_dir/secrets.yaml.template" ]; then
        echo -e "${RED}Error: Template not found at $env_dir/secrets.yaml.template${NC}"
        return 1
    fi

    # Check if secrets.yaml already exists
    if [ -f "$env_dir/secrets.yaml" ]; then
        echo -e "${YELLOW}⚠️  secrets.yaml already exists in $env_dir${NC}"
        read -p "Overwrite? (y/N) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo "Skipping $env"
            return 0
        fi
    fi

    # Copy template
    cp "$env_dir/secrets.yaml.template" "$env_dir/secrets.yaml"
    echo -e "${GREEN}✓${NC} Created $env_dir/secrets.yaml from template"

    # Prompt for credentials
    echo -e "\n${YELLOW}Enter credentials for $env environment:${NC}\n"

    read -p "Equifax Client ID: " equifax_id
    read -p "Equifax Client Secret: " equifax_secret
    read -p "GitHub Token: " github_token

    # Update secrets file
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s/REPLACE_WITH_YOUR_.*_EQUIFAX_CLIENT_ID/$equifax_id/g" "$env_dir/secrets.yaml"
        sed -i '' "s/REPLACE_WITH_YOUR_.*_EQUIFAX_CLIENT_SECRET/$equifax_secret/g" "$env_dir/secrets.yaml"
        sed -i '' "s/REPLACE_WITH_YOUR_.*_GITHUB_TOKEN/$github_token/g" "$env_dir/secrets.yaml"
    else
        # Linux
        sed -i "s/REPLACE_WITH_YOUR_.*_EQUIFAX_CLIENT_ID/$equifax_id/g" "$env_dir/secrets.yaml"
        sed -i "s/REPLACE_WITH_YOUR_.*_EQUIFAX_CLIENT_SECRET/$equifax_secret/g" "$env_dir/secrets.yaml"
        sed -i "s/REPLACE_WITH_YOUR_.*_GITHUB_TOKEN/$github_token/g" "$env_dir/secrets.yaml"
    fi

    # Set restrictive permissions
    chmod 600 "$env_dir/secrets.yaml"

    echo -e "${GREEN}✓${NC} Updated $env_dir/secrets.yaml with credentials"
    echo -e "${GREEN}✓${NC} Set file permissions to 600 (owner read/write only)"

    # Verify secrets are not tracked by git
    if git ls-files --error-unmatch "$env_dir/secrets.yaml" 2>/dev/null; then
        echo -e "${RED}⚠️  WARNING: secrets.yaml is tracked by Git!${NC}"
        echo "Run: git rm --cached $env_dir/secrets.yaml"
    else
        echo -e "${GREEN}✓${NC} Verified secrets.yaml is not tracked by Git"
    fi

    echo ""
}

# Main menu
echo "Select environment to setup:"
echo "1) Development"
echo "2) Production"
echo "3) Both"
echo "4) Exit"
read -p "Enter choice [1-4]: " choice

case $choice in
    1)
        setup_environment "dev"
        ;;
    2)
        setup_environment "prod"
        ;;
    3)
        setup_environment "dev"
        setup_environment "prod"
        ;;
    4)
        echo "Exiting"
        exit 0
        ;;
    *)
        echo -e "${RED}Invalid choice${NC}"
        exit 1
        ;;
esac

echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}Setup Complete!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

echo -e "${YELLOW}Important Security Notes:${NC}"
echo "1. Never commit secrets.yaml files to Git"
echo "2. Keep backup of credentials in secure location"
echo "3. Use different credentials for dev/prod"
echo "4. Rotate credentials regularly"
echo ""

echo -e "${BLUE}Next Steps:${NC}"
echo "1. Review your secrets files:"
echo "   - overlays/dev/secrets.yaml"
echo "   - overlays/prod/secrets.yaml"
echo ""
echo "2. Deploy:"
echo "   make deploy-dev    # For development"
echo "   make deploy-prod   # For production"
echo ""
echo "See SECRETS_MANAGEMENT.md for more information"
echo ""
