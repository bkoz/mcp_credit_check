#!/bin/bash

# Test script to verify MCP prompt integration

echo "Testing MCP prompt integration..."
echo ""

# Test payload
PAYLOAD='{
  "firstName": "John",
  "lastName": "Doe",
  "ssn": "666123456",
  "houseNumber": "123",
  "streetName": "Main",
  "streetType": "St",
  "city": "Atlanta",
  "state": "GA",
  "zip": "30374"
}'

echo "Sending request to API server at http://localhost:3002/credit-report"
echo ""

# Make the request
RESPONSE=$(curl -s -X POST http://localhost:3002/credit-report \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD")

echo "Response received:"
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
echo ""

echo "Check logs/api-server.log for prompt retrieval confirmation"
