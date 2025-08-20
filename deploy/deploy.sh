#!/bin/bash

# Serverless Container Benchmark - Deployment Script
# Usage: ./deploy.sh <environment> [subscription-id]

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BICEP_FILE="$SCRIPT_DIR/bicep/main.bicep"
DEPLOYMENT_LOCATION="westus2"

# Function to display usage
usage() {
    echo "Usage: $0 <environment> [subscription-id]"
    echo ""
    echo "Environments:"
    echo "  dev   - Development environment (2 regions)"
    echo "  test  - Test environment (4 regions)"
    echo "  prod  - Production environment (30+ regions)"
    echo ""
    echo "Examples:"
    echo "  $0 dev"
    echo "  $0 prod 12345678-1234-1234-1234-123456789012"
    exit 1
}

# Check parameters
if [ $# -lt 1 ] || [ $# -gt 2 ]; then
    usage
fi

ENVIRONMENT=$1
SUBSCRIPTION_ID=$2

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(dev|test|prod)$ ]]; then
    echo "Error: Invalid environment '$ENVIRONMENT'"
    usage
fi

PARAMS_FILE="$SCRIPT_DIR/parameters/${ENVIRONMENT}.bicepparam"

# Check if parameter file exists
if [ ! -f "$PARAMS_FILE" ]; then
    echo "Error: Parameter file not found: $PARAMS_FILE"
    exit 1
fi

# Set subscription if provided
if [ -n "$SUBSCRIPTION_ID" ]; then
    echo "Setting Azure subscription to: $SUBSCRIPTION_ID"
    az account set --subscription "$SUBSCRIPTION_ID"
fi

# Get current subscription info
CURRENT_SUB=$(az account show --query "id" -o tsv 2>/dev/null || echo "")
CURRENT_SUB_NAME=$(az account show --query "name" -o tsv 2>/dev/null || echo "")

if [ -z "$CURRENT_SUB" ]; then
    echo "Error: Not logged in to Azure. Please run 'az login' first."
    exit 1
fi

echo "=============================================="
echo "Serverless Container Benchmark Deployment"
echo "=============================================="
echo "Environment: $ENVIRONMENT"
echo "Subscription: $CURRENT_SUB_NAME ($CURRENT_SUB)"
echo "Location: $DEPLOYMENT_LOCATION"
echo "Parameters: $PARAMS_FILE"
echo "=============================================="

# Confirm deployment
read -p "Do you want to proceed with the deployment? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Deployment cancelled."
    exit 0
fi

# Validate Bicep template
echo "Validating Bicep template..."
az deployment sub validate \
    --location "$DEPLOYMENT_LOCATION" \
    --template-file "$BICEP_FILE" \
    --parameters "$PARAMS_FILE"

if [ $? -ne 0 ]; then
    echo "Error: Bicep template validation failed"
    exit 1
fi

echo "Template validation successful!"

# Deploy infrastructure
DEPLOYMENT_NAME="scb-${ENVIRONMENT}-$(date +%Y%m%d-%H%M%S)"
echo "Starting deployment: $DEPLOYMENT_NAME"

az deployment sub create \
    --name "$DEPLOYMENT_NAME" \
    --location "$DEPLOYMENT_LOCATION" \
    --template-file "$BICEP_FILE" \
    --parameters "$PARAMS_FILE"

if [ $? -eq 0 ]; then
    echo "=============================================="
    echo "Deployment completed successfully!"
    echo "=============================================="
    
    # Show deployment outputs
    echo "Deployment outputs:"
    az deployment sub show \
        --name "$DEPLOYMENT_NAME" \
        --query "properties.outputs" \
        --output table
    
    echo ""
    echo "Next steps:"
    echo "1. Build and push container images to the created registries"
    echo "2. Update Container Apps with the actual container images"
    echo "3. Start benchmark jobs manually or set up scheduled execution"
    echo ""
    echo "For more information, see: deploy/README.md"
    
else
    echo "Error: Deployment failed"
    exit 1
fi