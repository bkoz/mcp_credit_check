#!/bin/bash

# Verification script to ensure no secrets are committed to Git

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "Verifying no secrets in Git..."
echo ""

ERRORS=0

# Check if secrets.yaml files are tracked
echo "1. Checking if secrets.yaml files are tracked by Git..."
if git ls-files | grep -E 'secrets\.yaml$'; then
    echo -e "${RED}❌ FAIL: Found secrets.yaml files tracked by Git!${NC}"
    echo "Run: git rm --cached <file>"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✓ PASS: No secrets.yaml files in Git${NC}"
fi
echo ""

# Check if .gitignore includes secrets.yaml
echo "2. Checking .gitignore for secrets.yaml..."
if grep -q "secrets.yaml" ../.gitignore && grep -q "secrets.yaml" .gitignore 2>/dev/null || grep -q "secrets.yaml" ../.gitignore; then
    echo -e "${GREEN}✓ PASS: secrets.yaml is in .gitignore${NC}"
else
    echo -e "${RED}❌ FAIL: secrets.yaml not found in .gitignore${NC}"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# Check for common secret patterns in tracked files
echo "3. Scanning for potential secrets in tracked files..."
SECRET_PATTERNS=(
    "EQUIFAX_CLIENT_ID=[^R][^E][^P]"  # Not REPLACE_WITH
    "EQUIFAX_CLIENT_SECRET=[^R][^E][^P]"
    "GITHUB_TOKEN=[^R][^E][^P]"
    "ghp_[a-zA-Z0-9]"  # GitHub token pattern
)

FOUND_SECRETS=0
for pattern in "${SECRET_PATTERNS[@]}"; do
    if git grep -n "$pattern" -- ':!*.template' ':!SECRETS_MANAGEMENT.md' ':!verify-no-secrets.sh' 2>/dev/null; then
        FOUND_SECRETS=$((FOUND_SECRETS + 1))
    fi
done

if [ $FOUND_SECRETS -gt 0 ]; then
    echo -e "${RED}❌ FAIL: Found potential secrets in tracked files!${NC}"
    echo "Review the files above and remove any real credentials"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✓ PASS: No secrets found in tracked files${NC}"
fi
echo ""

# Check if template files exist
echo "4. Checking if template files exist..."
TEMPLATES_MISSING=0
for template in overlays/dev/secrets.yaml.template overlays/prod/secrets.yaml.template; do
    if [ ! -f "$template" ]; then
        echo -e "${RED}❌ Missing: $template${NC}"
        TEMPLATES_MISSING=$((TEMPLATES_MISSING + 1))
    fi
done

if [ $TEMPLATES_MISSING -eq 0 ]; then
    echo -e "${GREEN}✓ PASS: All template files exist${NC}"
else
    echo -e "${RED}❌ FAIL: Missing template files${NC}"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# Check if local secrets.yaml files exist (should not be in git)
echo "5. Checking for local secrets files..."
LOCAL_SECRETS=0
for secrets in overlays/dev/secrets.yaml overlays/prod/secrets.yaml; do
    if [ -f "$secrets" ]; then
        LOCAL_SECRETS=$((LOCAL_SECRETS + 1))
        # Verify not tracked
        if git ls-files --error-unmatch "$secrets" 2>/dev/null; then
            echo -e "${RED}❌ WARNING: $secrets exists and is tracked by Git!${NC}"
            ERRORS=$((ERRORS + 1))
        else
            echo -e "${YELLOW}ℹ  Found: $secrets (not tracked - OK)${NC}"
        fi
    fi
done

if [ $LOCAL_SECRETS -eq 0 ]; then
    echo -e "${YELLOW}ℹ  No local secrets.yaml files found${NC}"
    echo "   This is expected if you haven't set up secrets yet"
fi
echo ""

# Final result
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✓ VERIFICATION PASSED${NC}"
    echo "No secrets found in Git repository"
    exit 0
else
    echo -e "${RED}✗ VERIFICATION FAILED${NC}"
    echo "Found $ERRORS issue(s) - please fix before committing"
    exit 1
fi
