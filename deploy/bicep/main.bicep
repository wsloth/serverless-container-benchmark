targetScope = 'subscription'

// Parameters
@description('The location for the primary resources')
param primaryLocation string = 'westus2'

@description('List of regions where to deploy the container app environments')
param regions array

@description('The container image for the MinimalApi')
param minimalApiImage string

@description('The container image for the BenchmarkRunner')
param benchmarkRunnerImage string

// Variables
var resourceGroupName = 'serverless-container-benchmark'

// Single Resource Group for all resources
resource resourceGroup 'Microsoft.Resources/resourceGroups@2024-03-01' = {
  name: resourceGroupName
  location: primaryLocation
}

// Deploy shared storage account
module storageAccount 'modules/storage.bicep' = {
  scope: resourceGroup
  name: 'storage-deployment'
  params: {
    storageAccountName: 'scbstprod'
    location: primaryLocation
  }
}

// Deploy regional infrastructure for each region
module regionalInfrastructure 'modules/region.bicep' = [for (region, i) in regions: {
  scope: resourceGroup
  name: 'region-${region}'
  params: {
    region: region
    storageAccountName: storageAccount.outputs.storageAccountName
    minimalApiImage: minimalApiImage
    benchmarkRunnerImage: benchmarkRunnerImage
  }
}]

// Role assignments for storage access - delay to ensure identities are created
resource storageRoleAssignments 'Microsoft.Authorization/roleAssignments@2022-04-01' = [for (region, i) in regions: {
  name: guid(resourceGroupName, region, 'api-storage')
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
  name: guid(resourceGroupName, region, 'benchmark-storage')
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
output resourceGroupName string = resourceGroup.name
output storageAccountName string = storageAccount.outputs.storageAccountName
output storageAccountResourceId string = storageAccount.outputs.storageAccountResourceId
output regionalDeployments array = [for (region, i) in regions: {
  region: region
  containerAppEnvironmentName: regionalInfrastructure[i].outputs.containerAppEnvironmentName
  containerRegistryName: regionalInfrastructure[i].outputs.containerRegistryName
  containerRegistryLoginServer: regionalInfrastructure[i].outputs.containerRegistryLoginServer
  minimalApiName: regionalInfrastructure[i].outputs.minimalApiName
  minimalApiFqdn: regionalInfrastructure[i].outputs.minimalApiFqdn
  benchmarkRunnerJobName: regionalInfrastructure[i].outputs.benchmarkRunnerJobName
  logAnalyticsWorkspaceName: regionalInfrastructure[i].outputs.logAnalyticsWorkspaceName
}]