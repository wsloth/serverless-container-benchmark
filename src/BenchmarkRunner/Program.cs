using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using ServiceDefaults;
using System.Diagnostics;

// Console benchmark runner with cold/warm phases per benchmark type (path).

var builder = Host.CreateApplicationBuilder(args);
builder.AddServiceDefaults();
var host = builder.Build();

var baseUrl = Environment.GetEnvironmentVariable("API_BASE_URL");
var singlePath = Environment.GetEnvironmentVariable("API_PATH") ?? "/ping";
var pathsEnv = Environment.GetEnvironmentVariable("API_PATHS"); // comma-separated, overrides API_PATH if set
var coldCalls = int.TryParse(Environment.GetEnvironmentVariable("COLD_CALLS"), out var cc) ? cc : 5;
var warmCalls = int.TryParse(Environment.GetEnvironmentVariable("WARM_CALLS"), out var wc) ? wc : 10;
var delayBetweenCallsSec = int.TryParse(Environment.GetEnvironmentVariable("DELAY_BETWEEN_CALLS_SEC"), out var db) ? db : 30;
var concurrency = int.TryParse(Environment.GetEnvironmentVariable("CONCURRENCY"), out var c) ? c : 10;

// Prefer service discovery: if API_BASE_URL is not absolute, treat it as a service name (e.g., "http://minimalapi").
var handler = host.Services.GetRequiredService<IHttpMessageHandlerFactory>().CreateHandler("default");
var httpClient = new HttpClient(handler);

Uri ResolveBaseUri()
{
    if (string.IsNullOrWhiteSpace(baseUrl))
    {
        // default to service discovery name
        return new Uri("http://api");
    }
    return new Uri(baseUrl);
}

var baseUri = ResolveBaseUri();
httpClient.BaseAddress = baseUri;

var paths = (pathsEnv ?? singlePath)
    .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
    .DefaultIfEmpty(singlePath)
    .ToArray();

Console.WriteLine($"Base: {baseUri}, Types: {string.Join(", ", paths)}, Cold={coldCalls}, Warm={warmCalls}, Delay={delayBetweenCallsSec}s, Concurrency={concurrency}");

foreach (var path in paths)
{
    Console.WriteLine($"\n=== Running benchmark type: '{path}' ===");

    var swAll = Stopwatch.StartNew();

    // Cold phase
    var (latCold, errsCold, elapsedCold) = await RunPhaseAsync(httpClient, path, coldCalls, concurrency);
    PrintPhaseMetrics("Cold", path, coldCalls, latCold, errsCold, elapsedCold);

    // Delay between phases
    if (delayBetweenCallsSec > 0)
    {
        Console.WriteLine($"Waiting {delayBetweenCallsSec}s before warm phase...");
        await Task.Delay(TimeSpan.FromSeconds(delayBetweenCallsSec));
    }

    // Warm phase
    var (latWarm, errsWarm, elapsedWarm) = await RunPhaseAsync(httpClient, path, warmCalls, concurrency);
    PrintPhaseMetrics("Warm", path, warmCalls, latWarm, errsWarm, elapsedWarm);

    swAll.Stop();

    // Totals
    var allLat = latCold.Concat(latWarm).ToList();
    var totalErrors = errsCold + errsWarm;
    if (allLat.Count > 0)
    {
        var count = allLat.Count;
        var min = allLat.Min();
        var max = allLat.Max();
        var avg = allLat.Average();
        var p50 = Percentile(allLat, 50);
        var p90 = Percentile(allLat, 90);
        var p99 = Percentile(allLat, 99);
        Console.WriteLine($"Total '{path}' -> sent={coldCalls + warmCalls}, ok={count}, errors={totalErrors}");
        Console.WriteLine($"Total time: {swAll.Elapsed.TotalSeconds:F2}s, RPS: {count / swAll.Elapsed.TotalSeconds:F1}");
        Console.WriteLine($"Latency ms -> min:{min:F1} p50:{p50:F1} avg:{avg:F1} p90:{p90:F1} p99:{p99:F1} max:{max:F1}");
    }
    else
    {
        Console.WriteLine($"Total '{path}' -> All requests failed. errors={totalErrors}");
    }
}

static async Task<(List<double> latencies, int errors, TimeSpan elapsed)> RunPhaseAsync(HttpClient httpClient, string path, int count, int concurrency)
{
    var latencies = new List<double>(count);
    var errors = 0;
    var pending = new SemaphoreSlim(concurrency, concurrency);
    var swPhase = Stopwatch.StartNew();

    var tasks = Enumerable.Range(0, count).Select(async i =>
    {
        await pending.WaitAsync();
        try
        {
            var sw = Stopwatch.StartNew();
            using var resp = await httpClient.GetAsync(path);
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

static void PrintPhaseMetrics(string phase, string path, int sent, List<double> latencies, int errors, TimeSpan elapsed)
{
    if (latencies.Count > 0)
    {
        var count = latencies.Count;
        var min = latencies.Min();
        var max = latencies.Max();
        var avg = latencies.Average();
        var p50 = Percentile(latencies, 50);
        var p90 = Percentile(latencies, 90);
        var p99 = Percentile(latencies, 99);
        Console.WriteLine($"{phase} '{path}' -> sent={sent}, ok={count}, errors={errors}");
        Console.WriteLine($"{phase} time: {elapsed.TotalSeconds:F2}s, RPS: {count / elapsed.TotalSeconds:F1}");
        Console.WriteLine($"{phase} latency ms -> min:{min:F1} p50:{p50:F1} avg:{avg:F1} p90:{p90:F1} p99:{p99:F1} max:{max:F1}");
    }
    else
    {
        Console.WriteLine($"{phase} '{path}' -> All requests failed. errors={errors}");
    }
}

static double Percentile(List<double> data, double p)
{
    var arr = data.OrderBy(x => x).ToArray();
    if (arr.Length == 0) return double.NaN;
    var position = (p / 100.0) * (arr.Length + 1);
    var index = (int)Math.Floor(position) - 1;
    var fraction = position - Math.Floor(position);
    if (index < 0) return arr[0];
    if (index >= arr.Length - 1) return arr[^1];
    return arr[index] + (arr[index + 1] - arr[index]) * fraction;
}
