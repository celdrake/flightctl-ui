#!/bin/bash

# Refresh FlightCtl Token and Login Script
# This script creates a fresh service account token and logs you into FlightCtl

set -e

# Configuration
NAMESPACE="flightctl-external"
SERVICE_ACCOUNT="flightctl-user"
BACKEND_URL="https://192.168.1.131.nip.io:3443"
FLIGHTCTL_CLI="../flightctl/bin/flightctl"
TOKEN_DURATION="${TOKEN_DURATION:-24h}"

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "=========================================="
echo "FlightCtl Token Refresh & Login"
echo "=========================================="
echo ""

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
    echo -e "${RED}Error: kubectl not found. Please install kubectl first.${NC}"
    exit 1
fi

# Check if service account exists
echo -e "${YELLOW}Checking service account...${NC}"
if ! kubectl get serviceaccount "$SERVICE_ACCOUNT" -n "$NAMESPACE" &> /dev/null; then
    echo -e "${RED}Error: Service account '$SERVICE_ACCOUNT' not found in namespace '$NAMESPACE'${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Service account found${NC}"
echo ""

# Create new token
echo -e "${YELLOW}Creating new token (valid for $TOKEN_DURATION)...${NC}"
TOKEN=$(kubectl create token "$SERVICE_ACCOUNT" -n "$NAMESPACE" --duration="$TOKEN_DURATION")
if [ -z "$TOKEN" ]; then
    echo -e "${RED}Error: Failed to create token${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Token created successfully${NC}"
echo ""

# Test token against API
echo -e "${YELLOW}Testing token against API...${NC}"
HTTP_CODE=$(curl -k -s -o /dev/null -w "%{http_code}" \
    -H "Authorization: Bearer $TOKEN" \
    "$BACKEND_URL/api/v1/auth/config")

if [ "$HTTP_CODE" -eq 200 ]; then
    echo -e "${GREEN}✓ Token validated successfully (HTTP $HTTP_CODE)${NC}"
else
    echo -e "${RED}✗ Token validation failed (HTTP $HTTP_CODE)${NC}"
    echo "Backend URL: $BACKEND_URL"
    exit 1
fi
echo ""

# Check if flightctl CLI exists
if [ ! -f "$FLIGHTCTL_CLI" ]; then
    echo -e "${RED}Warning: FlightCtl CLI not found at $FLIGHTCTL_CLI${NC}"
    echo "Skipping CLI login, but token is valid."
    echo ""
    echo "You can use the token directly:"
    echo "export FLIGHTCTL_TOKEN='$TOKEN'"
    exit 0
fi

# Login with flightctl CLI
echo -e "${YELLOW}Logging in with FlightCtl CLI...${NC}"
if "$FLIGHTCTL_CLI" login "$BACKEND_URL" --insecure-skip-tls-verify --token="$TOKEN"; then
    echo -e "${GREEN}✓ Login successful${NC}"
else
    echo -e "${RED}✗ Login failed${NC}"
    exit 1
fi
echo ""

# Verify by listing resources
echo -e "${YELLOW}Verifying access...${NC}"
if "$FLIGHTCTL_CLI" get devices --limit 1 &> /dev/null; then
    echo -e "${GREEN}✓ Successfully authenticated - you can now use FlightCtl${NC}"
else
    echo -e "${RED}✗ Authentication verification failed${NC}"
    exit 1
fi

echo ""
echo "=========================================="
echo "✓ All done!"
echo "=========================================="
echo ""
echo "Your token is valid for $TOKEN_DURATION"
echo "Run this script again when your token expires."
echo ""

# Optional: Export token for direct use
echo "To use the token directly in scripts, run:"
echo "export FLIGHTCTL_TOKEN='$TOKEN'"
echo ""

