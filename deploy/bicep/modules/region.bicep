// Regional infrastructure module
targetScope = 'resourceGroup'

@description('The region to deploy to')
param region string

@description('Name of the shared storage account')
param storageAccountName string

@description('The container image for the MinimalApi')
param minimalApiImage string

@description('The container image for the BenchmarkRunner')
param benchmarkRunnerImage string

// Variables
var resourceNamePrefix = 'scb-${region}'

// Deploy Container Registry
resource containerRegistry 'Microsoft.ContainerRegistry/registries@2023-11-01-preview' = {
  name: replace('${resourceNamePrefix}cr', '-', '')
  location: region
  sku: {
    name: 'Basic'
  }
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    adminUserEnabled: false
    publicNetworkAccess: 'Enabled'
    anonymousPullEnabled: false
  }
}

// Log Analytics Workspace for Container App Environment
resource logAnalyticsWorkspace 'Microsoft.OperationalInsights/workspaces@2023-09-01' = {
  name: '${resourceNamePrefix}-law'
  location: region
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: 30
  }
}

// Deploy Container App Environment
resource containerAppEnvironment 'Microsoft.App/managedEnvironments@2024-03-01' = {
  name: '${resourceNamePrefix}-cae'
  location: region
  properties: {
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsConfiguration: {
        customerId: logAnalyticsWorkspace.properties.customerId
        sharedKey: logAnalyticsWorkspace.listKeys().primarySharedKey
      }
    }
  }
}

// Deploy MinimalApi Container App
resource minimalApiContainerApp 'Microsoft.App/containerApps@2024-03-01' = {
  name: '${resourceNamePrefix}-api'
  location: region
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    environmentId: containerAppEnvironment.id
    configuration: {
      ingress: {
        external: true
        targetPort: 8080
        transport: 'http'
        allowInsecure: true
      }
    }
    template: {
      containers: [
        {
          name: 'minimal-api'
          image: minimalApiImage
          resources: {
            cpu: json('0.25')
            memory: '0.5Gi'
          }
          env: [
            {
              name: 'ASPNETCORE_ENVIRONMENT'
              value: 'Production'
            }
            {
              name: 'ASPNETCORE_URLS'
              value: 'http://+:8080'
            }
          ]
          probes: [
            {
              type: 'Readiness'
              httpGet: {
                path: '/ping'
                port: 8080
                scheme: 'HTTP'
              }
              initialDelaySeconds: 1
              periodSeconds: 5
              timeoutSeconds: 3
              failureThreshold: 2
            }
            {
              type: 'Liveness'
              httpGet: {
                path: '/ping'
                port: 8080
                scheme: 'HTTP'
              }
              initialDelaySeconds: 10
              periodSeconds: 60
              timeoutSeconds: 5
              failureThreshold: 3
            }
          ]
        }
      ]
      scale: {
        minReplicas: 0
        maxReplicas: 1
        rules: [
          {
            name: 'http-rule'
            http: {
              metadata: {
                concurrentRequests: '10'
              }
            }
          }
        ]
      }
    }
  }
}

// Deploy BenchmarkRunner Container App Job
resource benchmarkRunnerJob 'Microsoft.App/jobs@2024-03-01' = {
  name: '${resourceNamePrefix}-benchmark'
  location: region
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    environmentId: containerAppEnvironment.id
    configuration: {
      triggerType: 'Schedule'
      scheduleTriggerConfig: {
        cronExpression: '0 * * * *' // Every hour at minute 0
        parallelism: 1
        replicaCompletionCount: 1
      }
      replicaTimeout: 1800 // 30 minutes
      replicaRetryLimit: 3
    }
    template: {
      containers: [
        {
          name: 'benchmark-runner'
          image: benchmarkRunnerImage
          resources: {
            cpu: json('0.5')
            memory: '1Gi'
          }
          env: [
            {
              name: 'REGION'
              value: region
            }
            {
              name: 'API_BASE_URL'
              value: 'https://${minimalApiContainerApp.properties.configuration.ingress.fqdn}'
            }
            {
              name: 'BENCHMARK_TABLE'
              value: 'BenchmarkResults'
            }
            {
              name: 'ConnectionStrings__benchmark-results'
              value: 'AccountName=${storageAccountName};TableEndpoint=https://${storageAccountName}.table.core.windows.net/'
            }
          ]
        }
      ]
    }
  }
}

// Role assignments for storage access - these need to be at subscription level to assign to the storage account
// These will be handled in the main template since the storage account is in a different resource group

// Outputs
output containerAppEnvironmentName string = containerAppEnvironment.name
output containerRegistryName string = containerRegistry.name
output containerRegistryLoginServer string = containerRegistry.properties.loginServer
output minimalApiName string = minimalApiContainerApp.name
output minimalApiFqdn string = minimalApiContainerApp.properties.configuration.ingress.fqdn
output minimalApiPrincipalId string = minimalApiContainerApp.identity.principalId
output benchmarkRunnerJobName string = benchmarkRunnerJob.name
output benchmarkRunnerPrincipalId string = benchmarkRunnerJob.identity.principalId
output logAnalyticsWorkspaceName string = logAnalyticsWorkspace.name