// Storage account module
@description('The name of the storage account')
param storageAccountName string

@description('The location for the storage account')
param location string

@description('Tags to apply to the storage account')
param tags object = {}

// Deploy storage account
resource storageAccount 'Microsoft.Storage/storageAccounts@2023-05-01' = {
  name: storageAccountName
  location: location
  tags: tags
  kind: 'StorageV2'
  sku: {
    name: 'Standard_LRS'
  }
  properties: {
    allowBlobPublicAccess: false
    allowSharedKeyAccess: false // Force managed identity authentication
    defaultToOAuthAuthentication: true
    publicNetworkAccess: 'Enabled'
    minimumTlsVersion: 'TLS1_2'
    networkAcls: {
      defaultAction: 'Allow'
      bypass: 'AzureServices'
    }
  }
}

// Enable table service and create the BenchmarkResults table
resource tableService 'Microsoft.Storage/storageAccounts/tableServices@2023-05-01' = {
  parent: storageAccount
  name: 'default'
}

resource benchmarkResultsTable 'Microsoft.Storage/storageAccounts/tableServices/tables@2023-05-01' = {
  parent: tableService
  name: 'BenchmarkResults'
}

// Outputs
output storageAccountName string = storageAccount.name
output storageAccountResourceId string = storageAccount.id
output tableServiceEndpoint string = storageAccount.properties.primaryEndpoints.table