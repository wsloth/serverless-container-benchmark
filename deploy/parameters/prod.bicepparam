using '../bicep/main.bicep'

// Production environment with multiple regions for comprehensive benchmarking
param primaryLocation = 'westeurope'

// Comprehensive list of regions for production benchmarking
param regions = [
  'westeurope'
  'northeurope'
]

// Container images - these should be set via CI/CD pipeline
param minimalApiImage = '#{MinimalApiImage}#'
param benchmarkRunnerImage = '#{BenchmarkRunnerImage}#'
