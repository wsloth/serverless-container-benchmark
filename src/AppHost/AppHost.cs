var builder = DistributedApplication.CreateBuilder(args);

var api = builder.AddProject<Projects.MinimalApi>("api")
    .WithHttpEndpoint(port: 5080);

builder.AddProject<Projects.BenchmarkRunner>("benchmark")
    .WithReference(api);

builder.Build().Run();
