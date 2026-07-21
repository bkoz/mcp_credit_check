#!/bin/bash

# Git pre-commit hook to prevent committing secrets
#
# Installation:
#   cp openshift/pre-commit-hook.sh .git/hooks/pre-commit
#   chmod +x .git/hooks/pre-commit

RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

echo "Running pre-commit secret check..."

# Check if any secrets.yaml files are being committed
if git diff --cached --name-only | grep -E 'secrets\.yaml$'; then
    echo -e "${RED}ERROR: Attempting to commit secrets.yaml file!${NC}"
    echo ""
    echo "Found these files:"
    git diff --cached --name-only | grep -E 'secrets\.yaml$'
    echo ""
    echo "To fix:"
    echo "  git reset HEAD <file>"
    echo "  # Add file to .gitignore if not already there"
    echo ""
    exit 1
fi

# Check for secret patterns in staged changes
SECRET_PATTERNS=(
    "EQUIFAX_CLIENT_ID=\"[^R]"  # Real values (not REPLACE_WITH)
    "EQUIFAX_CLIENT_SECRET=\"[^R]"
    "GITHUB_TOKEN=\"ghp_"
    "BEGIN PRIVATE KEY"
    "BEGIN RSA PRIVATE KEY"
)

FOUND_SECRETS=0
for pattern in "${SECRET_PATTERNS[@]}"; do
    if git diff --cached | grep -E "$pattern" > /dev/null; then
        if [ $FOUND_SECRETS -eq 0 ]; then
            echo -e "${RED}ERROR: Found potential secrets in staged changes!${NC}"
            echo ""
        fi
        echo "Pattern detected: $pattern"
        FOUND_SECRETS=1
    fi
done

if [ $FOUND_SECRETS -eq 1 ]; then
    echo ""
    echo "Please review your changes and remove any real credentials"
    echo "Use template files with placeholder values instead"
    exit 1
fi

echo -e "${GREEN}✓ No secrets detected${NC}"
exit 0
