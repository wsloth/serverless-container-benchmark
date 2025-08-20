# Azure Container Registry OIDC Federation Setup

This document explains how to configure Azure Container Registry authentication using OpenID Connect (OIDC) federated identity instead of username/password credentials.

## Why Use Federated Identity?

Federated identity provides several security advantages over traditional username/password authentication:

- **No static credentials**: No need to store and rotate passwords or access keys
- **Automatic token rotation**: Tokens are short-lived and automatically managed
- **Principle of least privilege**: Fine-grained access control through Azure RBAC
- **Audit trail**: Better tracking of authentication and authorization events

## Prerequisites

- Azure subscription with appropriate permissions
- Azure Container Registry (ACR) instance
- GitHub repository with Actions enabled

## Setup Steps

### 1. Create Azure AD Application

```bash
# Create an Azure AD application
az ad app create --display-name "GitHub-Actions-ServerlessBenchmark"

# Note the Application (client) ID from the output
AZURE_CLIENT_ID="<application-id>"
```

### 2. Create Service Principal

```bash
# Create a service principal for the application
az ad sp create --id $AZURE_CLIENT_ID

# Get the Object ID of the service principal
AZURE_OBJECT_ID=$(az ad sp show --id $AZURE_CLIENT_ID --query id -o tsv)
```

### 3. Configure Federated Identity Credential

```bash
# Set your GitHub repository details
GITHUB_ORG="wsloth"
GITHUB_REPO="serverless-container-benchmark"

# Create federated identity credential for main branch
az ad app federated-credential create \
  --id $AZURE_CLIENT_ID \
  --parameters '{
    "name": "github-main-branch",
    "issuer": "https://token.actions.githubusercontent.com",
    "subject": "repo:'$GITHUB_ORG'/'$GITHUB_REPO':ref:refs/heads/main",
    "description": "GitHub Actions main branch",
    "audiences": ["api://AzureADTokenExchange"]
  }'
```

### 4. Grant ACR Permissions

```bash
# Get your ACR resource ID
ACR_NAME="your-registry-name"
RESOURCE_GROUP="your-resource-group"
ACR_RESOURCE_ID=$(az acr show --name $ACR_NAME --resource-group $RESOURCE_GROUP --query id -o tsv)

# Assign AcrPush role to the service principal
az role assignment create \
  --assignee $AZURE_OBJECT_ID \
  --role AcrPush \
  --scope $ACR_RESOURCE_ID
```

### 5. Configure GitHub Repository Secrets

Add the following secrets to your GitHub repository (Settings → Secrets and variables → Actions):

| Secret Name | Value | Description |
|-------------|-------|-------------|
| `AZURE_CLIENT_ID` | `<application-id>` | The Application (client) ID from step 1 |
| `AZURE_TENANT_ID` | `<tenant-id>` | Your Azure AD tenant ID |

### 6. Update Environment Variables

In `.github/workflows/main.yml`, set the following environment variables:

```yaml
env:
  REGISTRY_NAME: 'your-registry.azurecr.io'
  AZURE_RESOURCE_GROUP: 'your-resource-group'
  AZURE_SUBSCRIPTION_ID: 'your-subscription-id'
```

## Verification

After setup, the GitHub Actions workflow will:

1. Authenticate with Azure using OIDC tokens
2. Log in to your ACR using `az acr login`
3. Build and push Docker images to your registry

## Troubleshooting

### Common Issues

1. **Authentication failed**: Verify the federated identity credential subject matches your repository exactly
2. **Permission denied**: Ensure the service principal has AcrPush role on your container registry
3. **Invalid audience**: Make sure the audience is set to `api://AzureADTokenExchange`

### Useful Commands

```bash
# List federated credentials for your app
az ad app federated-credential list --id $AZURE_CLIENT_ID

# Check role assignments for your service principal
az role assignment list --assignee $AZURE_OBJECT_ID

# Test ACR access (run this locally after `az login`)
az acr login --name $ACR_NAME
```

## Security Best Practices

- Use separate service principals for different environments (dev/staging/prod)
- Regularly review and audit role assignments
- Configure federated credentials for specific branches/environments only
- Monitor Azure Activity Logs for authentication events

## References

- [Azure AD Workload Identity Federation](https://docs.microsoft.com/en-us/azure/active-directory/develop/workload-identity-federation)
- [GitHub Actions OIDC with Azure](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/configuring-openid-connect-in-azure)
- [Azure Container Registry Authentication](https://docs.microsoft.com/en-us/azure/container-registry/container-registry-authentication)