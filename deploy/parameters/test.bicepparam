using '../bicep/main.bicep'

// Test environment parameters with a subset of regions
param projectName = 'scb'
param environment = 'test'
param sharedLocation = 'westus2'

// Test regions - representative sample for validation
param regions = [
  'westus2'
  'eastus'
  'westeurope'
  'southeastasia'
]

// Container images - these would typically be set via CI/CD pipeline
param minimalApiImage = '#{MinimalApiImage}#'
param benchmarkRunnerImage = '#{BenchmarkRunnerImage}#'

// Test environment tags
param tags = {
  Environment: 'Test'
  Project: 'ServerlessContainerBenchmark'
  Owner: 'QA'
  CostCenter: 'Engineering'
}