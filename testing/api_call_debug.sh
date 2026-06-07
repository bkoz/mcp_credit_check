#!/bin/bash

set -x  # Enable debug mode

USERNAME="${EQUIFAX_CLIENT_ID}"
PASSWORD="${EQUIFAX_CLIENT_SECRET}"
TOKEN_URL="https://api.sandbox.equifax.com/v2/oauth/token"
CREDIT_URL="https://api.sandbox.equifax.com/business/oneview/consumer-credit/v1/reports/credit-report"

echo "=== Step 1: Obtaining OAuth Token ==="
echo "Username: ${USERNAME:0:10}..."
echo "Token URL: $TOKEN_URL"
echo ""

# Get OAuth token with verbose output
TOKEN_RESPONSE=$(curl -v -X POST "$TOKEN_URL" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -u "$USERNAME:$PASSWORD" \
  -d "grant_type=client_credentials" 2>&1)

echo "Token Response:"
echo "$TOKEN_RESPONSE"
echo ""

ACCESS_TOKEN=$(echo "$TOKEN_RESPONSE" | grep -o '"access_token": *"[^"]*"' | grep -o '"[^"]*"$' | tr -d '"')

if [ -z "$ACCESS_TOKEN" ]; then
  echo "❌ Failed to obtain access token"
  exit 1
fi

echo "✅ Access token obtained: ${ACCESS_TOKEN:0:20}..."
echo ""

echo "=== Step 2: Fetching Credit Report ==="
echo "Credit URL: $CREDIT_URL"
echo "Consumer JSON path: $(dirname "$0")/../consumer.json"
echo ""

# Show the JSON payload
echo "JSON Payload:"
cat "$(dirname "$0")/../consumer.json" | jq '.' 2>/dev/null || cat "$(dirname "$0")/../consumer.json"
echo ""

# Fetch credit report with verbose output
echo "Making credit report request..."
RESPONSE=$(curl -v -X POST "$CREDIT_URL" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d @"$(dirname "$0")/../consumer.json" 2>&1)

echo ""
echo "=== Full Response ==="
echo "$RESPONSE"
echo ""

# Extract just the JSON body
JSON_BODY=$(echo "$RESPONSE" | grep -A 1000 '^{' | tail -n +1)
echo "=== JSON Response Body ==="
echo "$JSON_BODY" | jq '.' 2>/dev/null || echo "$JSON_BODY"
