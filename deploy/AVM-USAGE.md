# Azure Resource Modules (AVM) Usage

This project is designed to use Azure Resource Modules (AVM) for best practices and verified templates. The current implementation uses direct Azure resource definitions due to network limitations during development.

## Converting to Azure Resource Modules

When you have access to the Azure Resource Module registry, you can replace the direct resource definitions with AVM modules for better maintainability and best practices.

### Storage Account Module

Replace the storage account in `modules/storage.bicep`:

```bicep
// Replace direct resource with AVM module
module storageAccount 'br/public:avm/res/storage/storage-account:0.15.0' = {
  name: 'storage-account'
  params: {
    name: storageAccountName
    location: location
    tags: tags
    kind: 'StorageV2'
    skuName: 'Standard_LRS'
    allowBlobPublicAccess: false
    allowSharedKeyAccess: false
    defaultToOAuthAuthentication: true
    publicNetworkAccess: 'Enabled'
    minimumTlsVersion: 'TLS1_2'
    
    tableServices: {
      tables: [
        { name: 'BenchmarkResults' }
      ]
    }
    
    networkAcls: {
      defaultAction: 'Allow'
      bypass: 'AzureServices'
    }
  }
}
```

### Container Registry Module

Replace the container registry in `modules/region.bicep`:

```bicep
module containerRegistry 'br/public:avm/res/container-registry/registry:0.8.0' = {
  name: 'container-registry'
  params: {
    name: replace('${resourceNamePrefix}cr', '-', '')
    location: region
    tags: tags
    acrSku: 'Basic'
    adminUserEnabled: false
    publicNetworkAccess: 'Enabled'
    anonymousPullEnabled: false
    
    managedIdentities: {
      systemAssigned: true
    }
  }
}
```

### Container App Environment Module

```bicep
module containerAppEnvironment 'br/public:avm/res/app/managed-environment:0.8.3' = {
  name: 'container-app-environment'
  params: {
    name: '${resourceNamePrefix}-cae'
    location: region
    tags: tags
    workloadProfiles: []
    logAnalyticsWorkspaceResourceId: logAnalyticsWorkspace.outputs.resourceId
  }
}
```

### Log Analytics Workspace Module

```bicep
module logAnalyticsWorkspace 'br/public:avm/res/operational-insights/workspace:0.9.0' = {
  name: 'log-analytics-workspace'
  params: {
    name: '${resourceNamePrefix}-law'
    location: region
    tags: tags
    skuName: 'PerGB2018'
    dataRetention: 30
  }
}
```

### Container App Module

```bicep
module minimalApiContainerApp 'br/public:avm/res/app/container-app:0.12.0' = {
  name: 'minimal-api-container-app'
  params: {
    name: '${resourceNamePrefix}-api'
    location: region
    tags: tags
    environmentResourceId: containerAppEnvironment.outputs.resourceId
    
    managedIdentities: {
      systemAssigned: true
    }
    
    containers: [
      {
        name: 'minimal-api'
        image: minimalApiImage
        resources: {
          cpu: '0.25'
          memory: '0.5Gi'
        }
        env: [/* environment variables */]
        probes: [/* health checks */]
      }
    ]
    
    ingressExternal: true
    ingressTargetPort: 8080
    ingressTransport: 'http'
    
    scaleMinReplicas: 0
    scaleMaxReplicas: 10
    scaleRules: [
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
```

### Container App Job Module

```bicep
module benchmarkRunnerJob 'br/public:avm/res/app/job:0.3.0' = {
  name: 'benchmark-runner-job'
  params: {
    name: '${resourceNamePrefix}-benchmark'
    location: region
    tags: tags
    environmentResourceId: containerAppEnvironment.outputs.resourceId
    
    managedIdentities: {
      systemAssigned: true
    }
    
    jobType: 'Manual'
    containers: [
      {
        name: 'benchmark-runner'
        image: benchmarkRunnerImage
        resources: {
          cpu: '0.5'
          memory: '1Gi'
        }
        env: [/* environment variables */]
      }
    ]
    
    replicaRetryLimit: 3
    replicaTimeout: 1800
  }
}
```

### Role Assignment Module

```bicep
module storageRoleAssignment 'br/public:avm/ptn/authorization/role-assignment:0.1.1' = {
  name: 'storage-role-assignment'
  params: {
    principalId: containerApp.outputs.systemAssignedMIPrincipalId
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '0a9a7e1f-b9d0-4cc4-a60d-0319b160aaa3')
    resourceId: storageAccountResourceId
  }
}
```

## Benefits of Azure Resource Modules

1. **Best Practices**: AVM modules implement Azure Well-Architected Framework principles
2. **Consistency**: Standardized patterns across different deployments
3. **Maintenance**: Microsoft-maintained modules with regular updates
4. **Features**: Built-in diagnostic settings, monitoring, and security configurations
5. **Validation**: Pre-tested and validated resource configurations

## Module Versions

Check the [Azure Resource Module registry](https://aka.ms/avm) for the latest versions:

- Storage Account: `br/public:avm/res/storage/storage-account`
- Container Registry: `br/public:avm/res/container-registry/registry`
- Container App Environment: `br/public:avm/res/app/managed-environment`
- Container App: `br/public:avm/res/app/container-app`
- Container App Job: `br/public:avm/res/app/job`
- Log Analytics: `br/public:avm/res/operational-insights/workspace`
- Role Assignment: `br/public:avm/ptn/authorization/role-assignment`

## Testing AVM Modules

When converting to AVM modules:

1. Update one module at a time
2. Test thoroughly in development environment
3. Validate parameter compatibility
4. Check output properties match current usage
5. Update any dependent references