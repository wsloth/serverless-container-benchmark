using '../bicep/main.bicep'

// Development environment parameters
param projectName = 'scb'
param environment = 'dev'
param sharedLocation = 'westus2'

// Regions to deploy Container App Environments
param regions = [
  'westus2'
  'eastus'
]

// Container images - these would typically be set via CI/CD pipeline
param minimalApiImage = 'mcr.microsoft.com/dotnet/samples:aspnetapp-8.0'
param benchmarkRunnerImage = 'mcr.microsoft.com/dotnet/runtime:8.0'