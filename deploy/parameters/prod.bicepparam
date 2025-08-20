using '../bicep/main.bicep'

// Production environment parameters with multiple regions for comprehensive testing
param projectName = 'scb'
param environment = 'prod'
param sharedLocation = 'westus2'

// Comprehensive list of regions for production benchmarking
param regions = [
  'westus2'
  'westus3'
  'eastus'
  'eastus2'
  'centralus'
  'northcentralus'
  'southcentralus'
  'westcentralus'
  'canadacentral'
  'canadaeast'
  'brazilsouth'
  'uksouth'
  'ukwest'
  'westeurope'
  'northeurope'
  'francecentral'
  'germanywestcentral'
  'switzerlandnorth'
  'norwayeast'
  'swedencentral'
  'australiaeast'
  'australiasoutheast'
  'southeastasia'
  'eastasia'
  'japaneast'
  'japanwest'
  'koreacentral'
  'southafricanorth'
  'uaenorth'
  'centralindia'
  'southindia'
]

// Container images - these should be set via CI/CD pipeline in production
param minimalApiImage = '#{MinimalApiImage}#'
param benchmarkRunnerImage = '#{BenchmarkRunnerImage}#'

// Production tags
param tags = {
  Environment: 'Production'
  Project: 'ServerlessContainerBenchmark'
  Owner: 'Platform'
  CostCenter: 'Research'
  Criticality: 'Low'
}