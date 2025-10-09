# Deployment Guide

This guide covers deploying the Serverless Container Benchmark frontend to Azure Static Web Apps.

## Prerequisites

- Azure account with an active subscription
- Azure CLI installed (or use Azure Portal)
- GitHub repository with the source code

## Option 1: Deploy via Azure Portal (Recommended for first deployment)

### Step 1: Create Azure Static Web App

1. Log in to the [Azure Portal](https://portal.azure.com)
2. Click "Create a resource" → Search for "Static Web App"
3. Click "Create"

### Step 2: Configure Basic Settings

- **Subscription**: Select your Azure subscription
- **Resource Group**: Create new or use existing
- **Name**: Choose a unique name (e.g., `serverless-benchmark-frontend`)
- **Plan type**: Choose Free or Standard based on your needs
- **Region**: Select the closest Azure region

### Step 3: Configure Deployment

- **Source**: Select "GitHub"
- **Organization**: Select your GitHub organization
- **Repository**: Select `serverless-container-benchmark`
- **Branch**: Select `main` (or your deployment branch)

### Step 4: Build Configuration

- **Build Presets**: Select "Custom"
- **App location**: `/web`
- **Api location**: Leave empty (unless you add Azure Functions)
- **Output location**: `dist`

### Step 5: Review and Create

- Review all settings
- Click "Create"
- Wait for deployment to complete (this may take several minutes)

### Step 6: Configure API Backend (Optional)

If you have a backend API:

1. Go to your Static Web App resource
2. Navigate to "Configuration"
3. Add the API URL under "Application settings":
   - Key: `VITE_API_URL`
   - Value: `https://your-api-url.com/api`
4. Click "Save"

## Option 2: Deploy via Azure CLI

### Step 1: Install Azure Static Web Apps CLI

```bash
npm install -g @azure/static-web-apps-cli
```

### Step 2: Build the Application

```bash
cd web
npm install
npm run build
```

### Step 3: Login to Azure

```bash
az login
```

### Step 4: Create Static Web App

```bash
az staticwebapp create \
  --name serverless-benchmark-frontend \
  --resource-group your-resource-group \
  --location westus2 \
  --sku Free
```

### Step 5: Get Deployment Token

```bash
az staticwebapp secrets list \
  --name serverless-benchmark-frontend \
  --resource-group your-resource-group \
  --query "properties.apiKey" -o tsv
```

### Step 6: Deploy

```bash
swa deploy \
  --app-location ./dist \
  --deployment-token <YOUR_DEPLOYMENT_TOKEN>
```

## Option 3: GitHub Actions (Automated CI/CD)

A GitHub Actions workflow is already included in `.github/workflows/frontend.yml`.

### Step 1: Get Deployment Token

1. Go to your Static Web App in Azure Portal
2. Click "Manage deployment token"
3. Copy the token

### Step 2: Add Secret to GitHub

1. Go to your GitHub repository
2. Navigate to Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Name: `AZURE_STATIC_WEB_APPS_API_TOKEN`
5. Value: Paste the deployment token
6. Click "Add secret"

### Step 3: Enable Deployment

In `.github/workflows/frontend.yml`, uncomment the `deploy` job.

### Step 4: Push to Main Branch

The workflow will automatically:
1. Build the application
2. Deploy to Azure Static Web Apps
3. On every push to the `main` branch

## Post-Deployment Configuration

### Custom Domain (Optional)

1. In Azure Portal, navigate to your Static Web App
2. Go to "Custom domains"
3. Click "Add"
4. Follow the instructions to configure DNS

### Environment Variables

To configure environment variables in production:

1. Navigate to your Static Web App in Azure Portal
2. Go to "Configuration"
3. Add application settings:
   ```
   VITE_API_URL=https://your-backend-api.com/api
   ```
4. Click "Save"
5. The app will automatically redeploy with new settings

## Monitoring

### View Deployment Logs

1. Go to your Static Web App in Azure Portal
2. Navigate to "Deployment history"
3. Click on a deployment to view logs

### Application Insights (Optional)

To enable monitoring:

1. Create an Application Insights resource
2. Copy the connection string
3. Add to Static Web App configuration:
   ```
   APPLICATIONINSIGHTS_CONNECTION_STRING=<your-connection-string>
   ```

## Troubleshooting

### Build Failures

If the build fails:

1. Check the build logs in Azure Portal or GitHub Actions
2. Ensure all dependencies are in `package.json`
3. Verify the build command works locally: `npm run build`
4. Check that the output directory is correct (`dist`)

### API Connection Issues

If the frontend can't connect to your API:

1. Verify CORS settings on your API
2. Check that `VITE_API_URL` is configured correctly
3. Test API endpoints with Postman or curl
4. Review browser console for errors

### Deployment Token Issues

If deployment fails with authentication errors:

1. Generate a new deployment token
2. Update the GitHub secret
3. Retry the deployment

## Costs

- **Free Tier**: Includes 100 GB bandwidth, 0.5 GB storage
- **Standard Tier**: $9/month, includes 100 GB bandwidth, 0.5 GB storage
- Additional bandwidth: $0.20 per GB

For most scenarios, the Free tier is sufficient for this application.

## Additional Resources

- [Azure Static Web Apps Documentation](https://docs.microsoft.com/azure/static-web-apps/)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)
- [Azure CLI Reference](https://docs.microsoft.com/cli/azure/staticwebapp)
