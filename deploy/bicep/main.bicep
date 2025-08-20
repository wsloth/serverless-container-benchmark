targetScope = 'subscription'

// Parameters
@description('The name of the project')
param projectName string = 'scb'

@description('The location for the shared resources')
param sharedLocation string = 'westus2'

@description('List of regions where to deploy the container app environments')
param regions array

@description('Environment name (dev, test, prod)')
param environment string = 'dev'

@description('Tags to apply to all resources')
param tags object = {}

@description('The container image for the MinimalApi')
param minimalApiImage string

@description('The container image for the BenchmarkRunner')
param benchmarkRunnerImage string

// Variables
var resourceNamePrefix = '${projectName}-${environment}'
var sharedResourceGroupName = '${resourceNamePrefix}-shared-rg'

// Shared Resource Group for storage account
resource sharedResourceGroup 'Microsoft.Resources/resourceGroups@2024-03-01' = {
  name: sharedResourceGroupName
  location: sharedLocation
  tags: tags
}

// Deploy shared storage account
module storageAccount 'modules/storage.bicep' = {
  scope: sharedResourceGroup
  name: 'storage-deployment'
  params: {
    storageAccountName: replace('${resourceNamePrefix}st', '-', '')
    location: sharedLocation
    tags: tags
  }
}

// Deploy regional infrastructure for each region
resource regionalResourceGroups 'Microsoft.Resources/resourceGroups@2024-03-01' = [for region in regions: {
  name: '${resourceNamePrefix}-${region}-rg'
  location: region
  tags: tags
}]

module regionalInfrastructure 'modules/region.bicep' = [for (region, i) in regions: {
  scope: regionalResourceGroups[i]
  name: 'region-${region}'
  params: {
    projectName: projectName
    environment: environment
    region: region
    tags: tags
    storageAccountName: storageAccount.outputs.storageAccountName
    minimalApiImage: minimalApiImage
    benchmarkRunnerImage: benchmarkRunnerImage
  }
}]

// Role assignments for storage access - delay to ensure identities are created
resource storageRoleAssignments 'Microsoft.Authorization/roleAssignments@2022-04-01' = [for (region, i) in regions: {
  name: guid(resourceNamePrefix, region, 'api-storage')
  properties: {
    principalId: regionalInfrastructure[i].outputs.minimalApiPrincipalId
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '0a9a7e1f-b9d0-4cc4-a60d-0319b160aaa3') // Storage Table Data Contributor
    principalType: 'ServicePrincipal'
  }
  dependsOn: [
    regionalInfrastructure[i]
  ]
}]

resource storageRoleAssignmentsBenchmark 'Microsoft.Authorization/roleAssignments@2022-04-01' = [for (region, i) in regions: {
  name: guid(resourceNamePrefix, region, 'benchmark-storage')
  properties: {
    principalId: regionalInfrastructure[i].outputs.benchmarkRunnerPrincipalId
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '0a9a7e1f-b9d0-4cc4-a60d-0319b160aaa3') // Storage Table Data Contributor
    principalType: 'ServicePrincipal'
  }
  dependsOn: [
    regionalInfrastructure[i]
  ]
}]

// Outputs
output storageAccountName string = storageAccount.outputs.storageAccountName
output storageAccountResourceId string = storageAccount.outputs.storageAccountResourceId
output regionalDeployments array = [for (region, i) in regions: {
  region: region
  resourceGroupName: regionalResourceGroups[i].name
  containerAppEnvironmentName: regionalInfrastructure[i].outputs.containerAppEnvironmentName
  containerRegistryName: regionalInfrastructure[i].outputs.containerRegistryName
  containerRegistryLoginServer: regionalInfrastructure[i].outputs.containerRegistryLoginServer
  minimalApiName: regionalInfrastructure[i].outputs.minimalApiName
  minimalApiFqdn: regionalInfrastructure[i].outputs.minimalApiFqdn
  benchmarkRunnerJobName: regionalInfrastructure[i].outputs.benchmarkRunnerJobName
  logAnalyticsWorkspaceName: regionalInfrastructure[i].outputs.logAnalyticsWorkspaceName
}]