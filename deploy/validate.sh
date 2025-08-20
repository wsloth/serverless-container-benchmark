#!/bin/bash

# Validate Bicep templates and parameter files

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "=============================================="
echo "Validating Bicep Templates"
echo "=============================================="

# Validate main template
echo "Validating main.bicep..."
az bicep build --file "$SCRIPT_DIR/bicep/main.bicep"
echo "✓ main.bicep is valid"

# Validate modules
echo "Validating storage module..."
az bicep build --file "$SCRIPT_DIR/bicep/modules/storage.bicep"
echo "✓ storage.bicep is valid"

echo "Validating region module..."
az bicep build --file "$SCRIPT_DIR/bicep/modules/region.bicep"
echo "✓ region.bicep is valid"

# Check parameter files exist
echo ""
echo "Checking parameter files..."
for env in dev prod; do
    if [ -f "$SCRIPT_DIR/parameters/${env}.bicepparam" ]; then
        echo "✓ ${env}.bicepparam exists"
    else
        echo "✗ ${env}.bicepparam missing"
        exit 1
    fi
done

echo ""
echo "=============================================="
echo "All Bicep templates are valid!"
echo "=============================================="
echo ""
echo "To deploy:"
echo "  ./deploy.sh dev    # Development environment"
echo "  ./deploy.sh prod   # Production environment"