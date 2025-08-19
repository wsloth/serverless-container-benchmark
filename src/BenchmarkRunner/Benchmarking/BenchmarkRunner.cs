using System.Diagnostics;
using Microsoft.Extensions.Logging;

namespace BenchmarkRunner.Benchmarking;

public interface IBenchmarkRunner
{
    Task<IReadOnlyList<BenchmarkResult>> RunAsync(CancellationToken cancellationToken = default);
}

public class BenchmarkRunner : IBenchmarkRunner
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<BenchmarkRunner> _logger;

    public BenchmarkRunner(IHttpClientFactory httpClientFactory, ILogger<BenchmarkRunner> logger)
    {
        _httpClientFactory = httpClientFactory;
        _logger = logger;
    }

    public async Task<IReadOnlyList<BenchmarkResult>> RunAsync(CancellationToken cancellationToken = default)
    {
        var runId = Environment.GetEnvironmentVariable("RUN_ID") ?? Guid.NewGuid().ToString("N");
        var baseUrl = Environment.GetEnvironmentVariable("API_BASE_URL");
        var singlePath = Environment.GetEnvironmentVariable("API_PATH") ?? "/ping";
        var pathsEnv = Environment.GetEnvironmentVariable("API_PATHS"); // comma-separated, overrides API_PATH if set
        var coldCalls = int.TryParse(Environment.GetEnvironmentVariable("COLD_CALLS"), out var cc) ? cc : 5;
        var warmCalls = int.TryParse(Environment.GetEnvironmentVariable("WARM_CALLS"), out var wc) ? wc : 10;
        var delayBetweenCallsSec = int.TryParse(Environment.GetEnvironmentVariable("DELAY_BETWEEN_CALLS_SEC"), out var db) ? db : 30;
        var concurrency = int.TryParse(Environment.GetEnvironmentVariable("CONCURRENCY"), out var c) ? c : 10;

        var httpClient = _httpClientFactory.CreateClient("default");
        httpClient.BaseAddress = ResolveBaseUri(baseUrl);

        var paths = (pathsEnv ?? singlePath)
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .DefaultIfEmpty(singlePath)
            .ToArray();

        _logger.LogInformation("Base: {Base}, Types: {Types}, Cold={Cold}, Warm={Warm}, Delay={Delay}s, Concurrency={Concurrency}",
            httpClient.BaseAddress, string.Join(", ", paths), coldCalls, warmCalls, delayBetweenCallsSec, concurrency);

        var results = new List<BenchmarkResult>();
        var ts = DateTimeOffset.UtcNow;

        foreach (var path in paths)
        {
            _logger.LogInformation("Running benchmark type: {Path}", path);

            var swAll = Stopwatch.StartNew();

            // Cold phase
            var (latCold, errsCold, elapsedCold) = await RunPhaseAsync(httpClient, path, coldCalls, concurrency, cancellationToken);
            results.Add(BuildResult(runId, ts, httpClient.BaseAddress!, path, "Cold", coldCalls, latCold, errsCold, elapsedCold, concurrency, coldCalls, warmCalls));

            // Delay between phases
            if (delayBetweenCallsSec > 0)
            {
                await Task.Delay(TimeSpan.FromSeconds(delayBetweenCallsSec), cancellationToken);
            }

            // Warm phase
            var (latWarm, errsWarm, elapsedWarm) = await RunPhaseAsync(httpClient, path, warmCalls, concurrency, cancellationToken);
            results.Add(BuildResult(runId, ts, httpClient.BaseAddress!, path, "Warm", warmCalls, latWarm, errsWarm, elapsedWarm, concurrency, coldCalls, warmCalls));

            swAll.Stop();

            // Totals
            var allLat = latCold.Concat(latWarm).ToList();
            var totalErrors = errsCold + errsWarm;
            results.Add(BuildResult(runId, ts, httpClient.BaseAddress!, path, "Total", coldCalls + warmCalls, allLat, totalErrors, swAll.Elapsed, concurrency, coldCalls, warmCalls));
        }

        return results;
    }

    private static async Task<(List<double> latencies, int errors, TimeSpan elapsed)> RunPhaseAsync(HttpClient httpClient, string path, int count, int concurrency, CancellationToken ct)
    {
        var latencies = new List<double>(count);
        var errors = 0;
        var pending = new SemaphoreSlim(concurrency, concurrency);
        var swPhase = Stopwatch.StartNew();

        var tasks = Enumerable.Range(0, count).Select(async _ =>
        {
            await pending.WaitAsync(ct);
            try
            {
                var sw = Stopwatch.StartNew();
                using var resp = await httpClient.GetAsync(path, ct);
                sw.Stop();
                if (!resp.IsSuccessStatusCode)
                {
                    Interlocked.Increment(ref errors);
                    return;
                }
                lock (latencies)
                {
                    latencies.Add(sw.Elapsed.TotalMilliseconds);
                }
            }
            catch
            {
                Interlocked.Increment(ref errors);
            }
            finally
            {
                pending.Release();
            }
        }).ToArray();

        await Task.WhenAll(tasks);

        swPhase.Stop();
        return (latencies, errors, swPhase.Elapsed);
    }

    private static BenchmarkResult BuildResult(
        string runId,
        DateTimeOffset ts,
        Uri baseUri,
        string path,
        string phase,
        int sent,
        List<double> latencies,
        int errors,
        TimeSpan elapsed,
        int concurrency,
        int coldCalls,
        int warmCalls)
    {
        double min = 0, p50 = 0, avg = 0, p90 = 0, p99 = 0, max = 0;
        var ok = latencies.Count;
        if (ok > 0)
        {
            min = latencies.Min();
            max = latencies.Max();
            avg = latencies.Average();
            p50 = Percentile(latencies, 50);
            p90 = Percentile(latencies, 90);
            p99 = Percentile(latencies, 99);
        }

        var rps = elapsed.TotalSeconds > 0 ? ok / elapsed.TotalSeconds : 0;

        return new BenchmarkResult
        {
            RunId = runId,
            Timestamp = ts,
            Path = path,
            Phase = phase,
            Sent = sent,
            Ok = ok,
            Errors = errors,
            ElapsedSeconds = elapsed.TotalSeconds,
            Rps = rps,
            MinMs = min,
            P50Ms = p50,
            AvgMs = avg,
            P90Ms = p90,
            P99Ms = p99,
            MaxMs = max,
            BaseUri = baseUri.ToString(),
            Concurrency = concurrency,
            ColdCalls = coldCalls,
            WarmCalls = warmCalls
        };
    }

    private static double Percentile(List<double> data, double p)
    {
        var arr = data.OrderBy(x => x).ToArray();
        if (arr.Length == 0) return 0;
        var position = (p / 100.0) * (arr.Length + 1);
        var index = (int)Math.Floor(position) - 1;
        var fraction = position - Math.Floor(position);
        if (index < 0) return arr[0];
        if (index >= arr.Length - 1) return arr[^1];
        return arr[index] + (arr[index + 1] - arr[index]) * fraction;
    }

    private static Uri ResolveBaseUri(string? baseUrl)
    {
        if (string.IsNullOrWhiteSpace(baseUrl))
        {
            return new Uri("http://api");
        }
        return new Uri(baseUrl);
    }
}
