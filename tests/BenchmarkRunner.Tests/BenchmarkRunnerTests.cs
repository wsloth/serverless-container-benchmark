using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using Xunit;

namespace BenchmarkRunner.Tests;

public class BenchmarkRunnerTests
{
    [Fact]
    public async Task RunAsync_Computes_Phases_And_Metrics()
    {
        using var _ = new EnvScope(new()
        {
            ["RUN_ID"] = "testrun",
            ["API_BASE_URL"] = "http://localhost",
            ["API_PATHS"] = "/ping",
            ["COLD_CALLS"] = "2",
            ["WARM_CALLS"] = "3",
            ["DELAY_BETWEEN_CALLS_SEC"] = "0",
            ["CONCURRENCY"] = "2",
        });

        var handler = new SequenceHandler(
            Enumerable.Repeat(new HttpResponseMessage(HttpStatusCode.OK) { Content = new StringContent("ok") }, 5)
        );
        var client = new HttpClient(handler);

        var factory = new Mock<IHttpClientFactory>();
        factory.Setup(f => f.CreateClient(It.IsAny<string>())).Returns(client);

        var sut = new BenchmarkRunner.Benchmarking.BenchmarkRunner(factory.Object, NullLogger<BenchmarkRunner.Benchmarking.BenchmarkRunner>.Instance);

        var results = await sut.RunAsync(CancellationToken.None);

        results.Should().HaveCount(3);
        results.Select(r => r.Phase).Should().BeEquivalentTo(new[] { "Cold", "Warm", "Total" }, opts => opts.WithoutStrictOrdering());

        var cold = results.Single(r => r.Phase == "Cold");
        cold.Sent.Should().Be(2);
        cold.Ok.Should().Be(2);
        cold.Errors.Should().Be(0);
        cold.Rps.Should().BeGreaterThan(0);
        cold.MinMs.Should().BeGreaterThanOrEqualTo(0);

        var warm = results.Single(r => r.Phase == "Warm");
        warm.Sent.Should().Be(3);
        warm.Ok.Should().Be(3);
        warm.Errors.Should().Be(0);

        var total = results.Single(r => r.Phase == "Total");
        total.Sent.Should().Be(5);
        total.Ok.Should().Be(5);
        total.Errors.Should().Be(0);
    }

    [Fact]
    public async Task RunAsync_Tracks_Errors_On_Failure()
    {
        using var _ = new EnvScope(new()
        {
            ["RUN_ID"] = "testrun2",
            ["API_BASE_URL"] = "http://localhost",
            ["API_PATHS"] = "/ping",
            ["COLD_CALLS"] = "3",
            ["WARM_CALLS"] = "0",
            ["DELAY_BETWEEN_CALLS_SEC"] = "0",
            ["CONCURRENCY"] = "3",
        });

        // Responses: 200, 500, exception
        var handler = new SequenceHandler(new HttpResponseMessage(HttpStatusCode.OK))
            .Then(new HttpResponseMessage(HttpStatusCode.InternalServerError))
            .Then(new Exception("network"));
        var client = new HttpClient(handler);

        var factory = new Mock<IHttpClientFactory>();
        factory.Setup(f => f.CreateClient(It.IsAny<string>())).Returns(client);

        var sut = new BenchmarkRunner.Benchmarking.BenchmarkRunner(factory.Object, NullLogger<BenchmarkRunner.Benchmarking.BenchmarkRunner>.Instance);

        var results = await sut.RunAsync(CancellationToken.None);

        var cold = results.Single(r => r.Phase == "Cold");
        cold.Sent.Should().Be(3);
        cold.Ok.Should().Be(1);
        cold.Errors.Should().Be(2);

        var total = results.Single(r => r.Phase == "Total");
        total.Sent.Should().Be(3);
        total.Ok.Should().Be(1);
        total.Errors.Should().Be(2);
    }

    [Fact]
    public async Task RunAsync_Defaults_To_ServiceName_BaseUrl_When_Not_Set()
    {
        using var _ = new EnvScope(new()
        {
            ["RUN_ID"] = "testrun3",
            ["API_PATHS"] = "/p",
            ["COLD_CALLS"] = "1",
            ["WARM_CALLS"] = "0",
            ["DELAY_BETWEEN_CALLS_SEC"] = "0",
            ["CONCURRENCY"] = "1",
        });

        var handler = new CapturingHandler(new HttpResponseMessage(HttpStatusCode.OK));
        var client = new HttpClient(handler);

        var factory = new Mock<IHttpClientFactory>();
        factory.Setup(f => f.CreateClient(It.IsAny<string>())).Returns(client);

        var sut = new BenchmarkRunner.Benchmarking.BenchmarkRunner(factory.Object, NullLogger<BenchmarkRunner.Benchmarking.BenchmarkRunner>.Instance);

        await sut.RunAsync(CancellationToken.None);

        handler.RequestUris.Should().HaveCount(1);
        handler.RequestUris[0].Should().Be(new Uri("http://api/p"));
    }

    [Fact]
    public async Task RunAsync_All_Failures_Produce_Zero_Latencies()
    {
        using var _ = new EnvScope(new()
        {
            ["RUN_ID"] = "testrun4",
            ["API_BASE_URL"] = "http://localhost",
            ["API_PATHS"] = "/p",
            ["COLD_CALLS"] = "2",
            ["WARM_CALLS"] = "1",
            ["DELAY_BETWEEN_CALLS_SEC"] = "0",
            ["CONCURRENCY"] = "2",
        });

        var handler = new SequenceHandler(new HttpResponseMessage(HttpStatusCode.InternalServerError))
            .Then(new Exception("boom"))
            .Then(new HttpResponseMessage(HttpStatusCode.BadRequest));
        var client = new HttpClient(handler);

        var factory = new Mock<IHttpClientFactory>();
        factory.Setup(f => f.CreateClient(It.IsAny<string>())).Returns(client);

        var sut = new BenchmarkRunner.Benchmarking.BenchmarkRunner(factory.Object, NullLogger<BenchmarkRunner.Benchmarking.BenchmarkRunner>.Instance);

        var results = await sut.RunAsync(CancellationToken.None);

        var cold = results.Single(r => r.Phase == "Cold");
        cold.Ok.Should().Be(0);
        cold.Errors.Should().Be(2);
        cold.Rps.Should().Be(0);
        cold.MinMs.Should().Be(0);
        cold.AvgMs.Should().Be(0);
        cold.MaxMs.Should().Be(0);

        var total = results.Single(r => r.Phase == "Total");
        total.Ok.Should().Be(0);
        total.Errors.Should().Be(3);
        total.Rps.Should().Be(0);
    }

    private sealed class EnvScope : IDisposable
    {
        private readonly Dictionary<string, string?> _originals = new();

        public EnvScope(Dictionary<string, string> set)
        {
            foreach (var kv in set)
            {
                _originals[kv.Key] = Environment.GetEnvironmentVariable(kv.Key);
                Environment.SetEnvironmentVariable(kv.Key, kv.Value);
            }
        }

        public void Dispose()
        {
            foreach (var kv in _originals)
            {
                Environment.SetEnvironmentVariable(kv.Key, kv.Value);
            }
        }
    }

    private sealed class SequenceHandler : HttpMessageHandler
    {
        private readonly Queue<Func<HttpRequestMessage, HttpResponseMessage>> _queue = new();

        public SequenceHandler(IEnumerable<HttpResponseMessage> responses)
        {
            foreach (var r in responses)
            {
                _queue.Enqueue(_ => r);
            }
        }

        public SequenceHandler(HttpResponseMessage first)
        {
            _queue.Enqueue(_ => first);
        }

        public SequenceHandler Then(HttpResponseMessage next)
        {
            _queue.Enqueue(_ => next);
            return this;
        }

        public SequenceHandler Then(Exception ex)
        {
            _queue.Enqueue(_ => throw ex);
            return this;
        }

        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            if (_queue.Count == 0)
            {
                return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK));
            }
            var fn = _queue.Dequeue();
            var result = fn(request);
            return Task.FromResult(result);
        }
    }

    private sealed class CapturingHandler : HttpMessageHandler
    {
        private readonly HttpResponseMessage _response;
        public List<Uri> RequestUris { get; } = new();

        public CapturingHandler(HttpResponseMessage response)
        {
            _response = response;
        }

        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            if (request.RequestUri is not null)
            {
                RequestUris.Add(request.RequestUri);
            }
            return Task.FromResult(_response);
        }
    }
}
