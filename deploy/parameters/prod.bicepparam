using '../bicep/main.bicep'

// Production environment with multiple regions for comprehensive benchmarking
param primaryLocation = 'westus2'

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

// Container images - these should be set via CI/CD pipeline
param minimalApiImage = '#{MinimalApiImage}#'
param benchmarkRunnerImage = '#{BenchmarkRunnerImage}#'