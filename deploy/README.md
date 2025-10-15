# Serverless Container Benchmark - Infrastructure Deployment

This directory contains the Bicep Infrastructure-as-Code (IaC) templates for deploying the Serverless Container Benchmark solution across multiple Azure regions.

## Architecture Overview

The infrastructure is designed with the following principles:

- **Distributed Execution**: Each region has its own Container App Environment with local Container Apps for minimal latency
- **Single Resource Group**: All resources deploy to `serverless-container-benchmark` resource group
- **Centralized Storage**: A single Azure Storage Account (Table Storage) collects benchmark results from all regions
- **Managed Identity Authentication**: No connection strings, all authentication uses managed identities
- **Production-Only**: Simplified deployment with single production environment

## Infrastructure Components

### Shared Resources
- **Storage Account**: Centralized Azure Table Storage for benchmark results
- **Table**: `BenchmarkResults` table for storing performance metrics

### Regional Resources (Per Region)
- **Container Registry**: Region-local registry for fast image pulls during cold starts
- **Log Analytics Workspace**: Monitoring and diagnostics
- **Container App Environment**: Serverless container hosting platform
- **Container App (MinimalApi)**: The API being benchmarked, configured for serverless scaling (0-1 replicas)
- **Container App Job (BenchmarkRunner)**: Scheduled job (hourly) that performs the benchmarking

## File Structure

```
deploy/
├── bicep/
│   ├── main.bicep                 # Main deployment template
│   └── modules/
│       ├── storage.bicep          # Shared storage account module
│       └── region.bicep           # Regional infrastructure module
└── parameters/
    └── prod.bicepparam            # Production environment (30+ regions)
```

## Prerequisites

1. **Azure CLI** with Bicep extension
   ```bash
   az --version
   az bicep version
   ```

2. **Azure Subscription** with appropriate permissions
   - Contributor role on the subscription
   - Ability to create resource groups and assign roles

3. **Container Images** built and pushed to a registry accessible during deployment

## Deployment

### 1. Login to Azure
```bash
az login
az account set --subscription "<your-subscription-id>"
```

### 2. Validate Templates
```bash
cd deploy
./validate.sh
```

### 3. Deploy Infrastructure
```bash
cd deploy
./deploy.sh
```

Or deploy manually:
```bash
az deployment sub create \
  --location westus2 \
  --template-file deploy/bicep/main.bicep \
  --parameters deploy/parameters/prod.bicepparam \
  --parameters minimalApiImage="<your-registry>/minimal-api:latest" \
  --parameters benchmarkRunnerImage="<your-registry>/benchmark-runner:latest"
```

### 4. Validate Deployment
```bash
# Check resource group
az group show -n serverless-container-benchmark

# List Container Apps
az containerapp list -g serverless-container-benchmark --query "[].{Name:name, Status:properties.provisioningState, Region:location}" -o table
```

## Configuration

### Environment Variables

The BenchmarkRunner Container App Job is configured with the following environment variables:

- `REGION`: The Azure region identifier
- `API_BASE_URL`: FQDN of the MinimalApi Container App in the same region
- `BENCHMARK_TABLE`: Table name for storing results (`BenchmarkResults`)
- `ConnectionStrings__benchmark-results`: Connection string using managed identity

### Managed Identity Permissions

Each Container App and Container App Job has a system-assigned managed identity with:
- **Storage Table Data Contributor** role on the shared storage account

## Running Benchmarks

### Scheduled Execution
The Container App Jobs are configured with cron triggers to run every hour (`0 * * * *`).

### Manual Execution
```bash
# Start a benchmark job in a specific region
az containerapp job start \
  --name "scb-westus2-benchmark" \
  --resource-group "serverless-container-benchmark"
```

### Monitor Results
```bash
# View job execution history
az containerapp job execution list \
  --name "scb-westus2-benchmark" \
  --resource-group "serverless-container-benchmark"

# View logs from a specific execution
az containerapp job logs show \
  --name "scb-westus2-benchmark" \
  --resource-group "serverless-container-benchmark"
```

## Customization

### Adding Regions
Edit the `regions` parameter in `parameters/prod.bicepparam`:

```bicep
param regions = [
  'westus2'
  'eastus'
  'newregion'  // Add new regions here
]
```

### Modifying Container Configuration
Edit the container specifications in `modules/region.bicep`:
- CPU and memory allocations
- Environment variables
- Scaling parameters
- Health check configurations

### Changing Storage Configuration
Modify the storage account settings in `modules/storage.bicep`:
- SKU and replication settings
- Network access rules
- Additional tables or services

## Troubleshooting

### Common Issues

1. **Insufficient Permissions**
   - Ensure your account has Contributor role on the subscription
   - Check if managed identity role assignments are complete

2. **Container Image Pull Failures**
   - Verify container images exist and are accessible
   - Check Container Registry authentication settings

3. **Scaling Issues**
   - Review Container App Environment capacity
   - Check scaling rule configurations

### Diagnostic Commands
```bash
# Check deployment status
az deployment sub show --name "<deployment-name>"

# View Container App logs
az containerapp logs show --name "scb-westus2-api" --resource-group "serverless-container-benchmark"

# Check managed identity role assignments
az role assignment list --assignee "<managed-identity-principal-id>"
```

## Security Considerations

- **No Connection Strings**: All authentication uses managed identities
- **Network Isolation**: Configure network access rules as needed
- **Minimal Permissions**: Role assignments follow principle of least privilege

## Cost Optimization

- **Consumption-based Scaling**: Container Apps scale to zero when not in use
- **Regional Isolation**: Each region uses local resources to minimize data transfer costs
- **Standard Storage**: Uses Standard_LRS for cost-effective table storage
- **Basic Container Registry**: Uses Basic SKU for cost optimization

## GitHub Actions Workflows

### Infrastructure What-If
Automatically runs on PRs affecting infrastructure files to preview changes before deployment.

### Infrastructure Deploy
Automatically deploys infrastructure on pushes to main branch, or can be manually triggered from GitHub Actions.

## Next Steps

1. **CI/CD Integration**: Use GitHub Actions workflows for automated deployments
2. **Monitoring**: Set up Azure Monitor alerts and dashboards for benchmark results
3. **Analysis**: Build reporting tools to analyze cross-region performance patterns