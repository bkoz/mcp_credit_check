#!/bin/bash

#
# Step 1: Obtain an Oauth token and create an authorization header using the following info:
#
USERNAME="${EQUIFAX_CLIENT_ID}"
PASSWORD="${EQUIFAX_CLIENT_SECRET}"
TOKEN_URL="https://api.sandbox.equifax.com/v2/oauth/token"

#
# Step 2: Using the information from step 1, obtain a credit report using the following info:
#
# The json body should be loaded from the consumer.json file
#
CREDIT_URL="https://api.sandbox.equifax.com/business/oneview/consumer-credit/v1/reports/credit-report"

#
# Step 1: Obtain OAuth token
#
TOKEN_RESPONSE=$(curl -s -X POST "$TOKEN_URL" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -u "$USERNAME:$PASSWORD" \
  -d "grant_type=client_credentials")

ACCESS_TOKEN=$(echo "$TOKEN_RESPONSE" | grep -o '"access_token": *"[^"]*"' | grep -o '"[^"]*"$' | tr -d '"')

if [ -z "$ACCESS_TOKEN" ]; then
  echo "Failed to obtain access token:"
  echo "$TOKEN_RESPONSE"
  exit 1
fi

#
# Step 2: Fetch credit report
#
RESPONSE=$(curl -s -X POST "$CREDIT_URL" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d @"$(dirname "$0")/../consumer.json")

echo "$RESPONSE"
