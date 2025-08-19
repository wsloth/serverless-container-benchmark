using Azure;
using Azure.Data.Tables;
using BenchmarkRunner.Benchmarking;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace BenchmarkRunner.Storage;

public interface ITableStorageService
{
    Task SaveBenchmarkResultsAsync(IReadOnlyList<BenchmarkResult> results, CancellationToken cancellationToken);
}

public sealed class AzureTableStorageService : ITableStorageService
{
    private readonly ITableClientAdapterFactory _factory;
    private readonly ILogger<AzureTableStorageService> _logger;
    private readonly string _clientName;
    private readonly string _tableName;

    public AzureTableStorageService(
        ITableClientAdapterFactory factory,
        IConfiguration configuration,
        ILogger<AzureTableStorageService> logger)
    {
        _factory = factory;
        _logger = logger;
        _clientName = configuration["Benchmark:TableClientName"] ?? "benchmark-results"; // maps to AddAzureTableServiceClient(name)
        _tableName = configuration["Benchmark:TableName"] ?? Environment.GetEnvironmentVariable("BENCHMARK_TABLE") ?? "BenchmarkResults";
    }

    public async Task SaveBenchmarkResultsAsync(IReadOnlyList<BenchmarkResult> results, CancellationToken cancellationToken)
    {
        if (results.Count == 0) return;

        var table = _factory.Create(_clientName, _tableName);
        await table.CreateIfNotExistsAsync(cancellationToken);

        // Batch by PartitionKey (RunId) to leverage transactional batching per partition (up to 100 entities per batch)
        var partitions = results.GroupBy(r => r.RunId);
        int stored = 0;

        foreach (var partition in partitions)
        {
            var entities = partition.Select(ToEntity).ToList();

            // Split into batches of 100
            foreach (var chunk in Chunk(entities, 100))
            {
                var batch = new List<TableTransactionAction>(chunk.Count);
                foreach (var e in chunk)
                {
                    batch.Add(new TableTransactionAction(TableTransactionActionType.UpsertMerge, e));
                }

                try
                {
                    var count = await table.SubmitTransactionAsync(batch, cancellationToken);
                    stored += count;
                }
                catch (RequestFailedException ex) when (ex.Status == 404)
                {
                    // Table may not exist yet due to eventual consistency; try once more after ensure
                    await table.CreateIfNotExistsAsync(cancellationToken);
                    var count = await table.SubmitTransactionAsync(batch, cancellationToken);
                    stored += count;
                }
            }
        }

        _logger.LogInformation("Stored {Count} benchmark rows into table {Table}", stored, _tableName);
    }

    private static IEnumerable<List<TableEntity>> Chunk(List<TableEntity> items, int size)
    {
        for (var i = 0; i < items.Count; i += size)
        {
            yield return items.GetRange(i, Math.Min(size, items.Count - i));
        }
    }

    private static TableEntity ToEntity(BenchmarkResult r)
    {
        var rowKey = $"{r.Path}:{r.Phase}:{r.Timestamp:yyyyMMddHHmmssfff}:{Guid.NewGuid():N}";
        var entity = new TableEntity(partitionKey: r.RunId, rowKey: rowKey)
        {
            { nameof(BenchmarkResult.Timestamp), r.Timestamp },
            { nameof(BenchmarkResult.Path), r.Path },
            { nameof(BenchmarkResult.Phase), r.Phase },
            { nameof(BenchmarkResult.Sent), r.Sent },
            { nameof(BenchmarkResult.Ok), r.Ok },
            { nameof(BenchmarkResult.Errors), r.Errors },
            { nameof(BenchmarkResult.ElapsedSeconds), r.ElapsedSeconds },
            { nameof(BenchmarkResult.Rps), r.Rps },
            { nameof(BenchmarkResult.MinMs), r.MinMs },
            { nameof(BenchmarkResult.P50Ms), r.P50Ms },
            { nameof(BenchmarkResult.AvgMs), r.AvgMs },
            { nameof(BenchmarkResult.P90Ms), r.P90Ms },
            { nameof(BenchmarkResult.P99Ms), r.P99Ms },
            { nameof(BenchmarkResult.MaxMs), r.MaxMs },
            { nameof(BenchmarkResult.BaseUri), r.BaseUri },
            { nameof(BenchmarkResult.Concurrency), r.Concurrency },
            { nameof(BenchmarkResult.ColdCalls), r.ColdCalls },
            { nameof(BenchmarkResult.WarmCalls), r.WarmCalls }
        };
        return entity;
    }
}
