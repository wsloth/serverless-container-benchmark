using Microsoft.Extensions.Hosting;

var builder = DistributedApplication.CreateBuilder(args);

var api = builder.AddProject<Projects.MinimalApi>("api")
    .WithHttpEndpoint(port: 5080);

var storage = builder.Environment.IsDevelopment()
    ? builder.AddAzureStorage("storage")
        .RunAsEmulator()
    : builder.AddAzureStorage("storage");

var table = storage.AddTables("benchmark-results");
    
builder.AddProject<Projects.BenchmarkRunner>("benchmark")
    .WithReference(api)
    .WithReference(table);

builder.Build().Run();
