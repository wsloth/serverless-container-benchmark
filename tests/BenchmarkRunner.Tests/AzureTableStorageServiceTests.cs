using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Azure;
using Azure.Data.Tables;
using BenchmarkRunner.Benchmarking;
using BenchmarkRunner.Storage;
using FluentAssertions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using Xunit;

namespace BenchmarkRunner.Tests;

public class AzureTableStorageServiceTests
{
    private static IConfiguration EmptyConfig => new ConfigurationBuilder().Build();

    [Fact]
    public async Task SaveBenchmarkResultsAsync_NoResults_NoCalls()
    {
        var factory = new Mock<ITableClientAdapterFactory>(MockBehavior.Strict);
        var sut = new AzureTableStorageService(factory.Object, EmptyConfig, NullLogger<AzureTableStorageService>.Instance);
        await sut.SaveBenchmarkResultsAsync(Array.Empty<BenchmarkResult>(), CancellationToken.None);
        factory.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task SaveBenchmarkResultsAsync_Batches_By_100()
    {
        var adapter = new Mock<ITableClientAdapter>();
        var created = false;
        adapter.Setup(a => a.CreateIfNotExistsAsync(It.IsAny<CancellationToken>()))
            .Callback(() => created = true)
            .Returns(Task.CompletedTask);

        var submitCalls = new List<IReadOnlyList<TableTransactionAction>>();
        adapter.Setup(a => a.SubmitTransactionAsync(It.IsAny<IReadOnlyList<TableTransactionAction>>(), It.IsAny<CancellationToken>()))
            .Callback((IReadOnlyList<TableTransactionAction> actions, CancellationToken _) => submitCalls.Add(actions))
            .ReturnsAsync((IReadOnlyList<TableTransactionAction> actions, CancellationToken _) => actions.Count);

        var factory = new Mock<ITableClientAdapterFactory>();
        factory.Setup(f => f.Create(It.IsAny<string>(), It.IsAny<string>())).Returns(adapter.Object);

        var sut = new AzureTableStorageService(factory.Object, EmptyConfig, NullLogger<AzureTableStorageService>.Instance);

        var results = GenerateResults(runId: "r1", count: 205);
        await sut.SaveBenchmarkResultsAsync(results, CancellationToken.None);

        created.Should().BeTrue();
        submitCalls.Should().HaveCount(3);
        submitCalls[0].Count.Should().Be(100);
        submitCalls[1].Count.Should().Be(100);
        submitCalls[2].Count.Should().Be(5);

        // Validate a sample action entity
        var entity = (TableEntity)submitCalls[0][0].Entity;
        entity.PartitionKey.Should().Be("r1");
        entity.ContainsKey(nameof(BenchmarkResult.Path)).Should().BeTrue();
        submitCalls.All(batch => batch.All(a => a.ActionType == TableTransactionActionType.UpsertMerge)).Should().BeTrue();
    }

    [Fact]
    public async Task SaveBenchmarkResultsAsync_Retries_On_404()
    {
        var adapter = new Mock<ITableClientAdapter>();
        var createCount = 0;
        adapter.Setup(a => a.CreateIfNotExistsAsync(It.IsAny<CancellationToken>()))
            .Callback(() => createCount++)
            .Returns(Task.CompletedTask);

        var first = true;
        adapter.Setup(a => a.SubmitTransactionAsync(It.IsAny<IReadOnlyList<TableTransactionAction>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(() =>
            {
                if (first)
                {
                    first = false;
                    throw new RequestFailedException(404, "not found");
                }
                return 1;
            });

        var factory = new Mock<ITableClientAdapterFactory>();
        factory.Setup(f => f.Create(It.IsAny<string>(), It.IsAny<string>())).Returns(adapter.Object);

        var sut = new AzureTableStorageService(factory.Object, EmptyConfig, NullLogger<AzureTableStorageService>.Instance);

        var results = GenerateResults(runId: "r2", count: 1);
        await sut.SaveBenchmarkResultsAsync(results, CancellationToken.None);

        createCount.Should().Be(2); // initial + retry path
        adapter.Verify(a => a.SubmitTransactionAsync(It.IsAny<IReadOnlyList<TableTransactionAction>>(), It.IsAny<CancellationToken>()), Times.Exactly(2));
    }

    private static List<BenchmarkResult> GenerateResults(string runId, int count)
    {
        var list = new List<BenchmarkResult>(count);
        var ts = DateTimeOffset.UtcNow;
        for (int i = 0; i < count; i++)
        {
            list.Add(new BenchmarkResult
            {
                RunId = runId,
                Timestamp = ts.AddMilliseconds(i),
                Path = "/p",
                Phase = i % 3 == 0 ? "Cold" : i % 3 == 1 ? "Warm" : "Total",
                Sent = 1,
                Ok = 1,
                Errors = 0,
                ElapsedSeconds = 0.1,
                Rps = 10,
                MinMs = 1,
                P50Ms = 1,
                AvgMs = 1,
                P90Ms = 1,
                P99Ms = 1,
                MaxMs = 1,
                BaseUri = "http://localhost",
                Concurrency = 1,
                ColdCalls = 1,
                WarmCalls = 0,
                Region = "test-region"
            });
        }
        return list;
    }
}
