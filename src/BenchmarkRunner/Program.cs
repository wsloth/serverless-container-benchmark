using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using ServiceDefaults;
using BenchmarkRunner.Benchmarking;
using BenchmarkRunner.Storage;

// Minimal host that wires dependencies, runs benchmark, and persists results.
var builder = Host.CreateApplicationBuilder(args);
builder.AddServiceDefaults();

// Register Azure Tables client (expects a binding/connection named "benchmark-results")
builder.AddAzureTableServiceClient("benchmark-results");

// App services
builder.Services.AddHttpClient();
builder.Services.AddSingleton<IBenchmarkRunner, BenchmarkRunner.Benchmarking.BenchmarkRunner>();
builder.Services.AddSingleton<ITableClientAdapterFactory, TableClientAdapterFactory>();
builder.Services.AddSingleton<ITableStorageService, AzureTableStorageService>();

var host = builder.Build();

var runner = host.Services.GetRequiredService<IBenchmarkRunner>();
var storage = host.Services.GetRequiredService<ITableStorageService>();

var results = await runner.RunAsync();
await storage.SaveBenchmarkResultsAsync(results, CancellationToken.None);

Console.WriteLine("Stored {0} benchmark result rows to table storage.", results.Count);
