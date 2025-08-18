using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using ServiceDefaults;

// Simple benchmark runner that exercises the MinimalApi and measures latency using service discovery under .NET Aspire.

var builder = Host.CreateApplicationBuilder(args);
builder.AddServiceDefaults();
var host = builder.Build();

var baseUrl = Environment.GetEnvironmentVariable("API_BASE_URL");
var path = Environment.GetEnvironmentVariable("API_PATH") ?? "/ping";
var requests = int.TryParse(Environment.GetEnvironmentVariable("REQUESTS"), out var r) ? r : 50;
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

Console.WriteLine($"Benchmarking {baseUri}{path} with {requests} requests @ concurrency {concurrency}...");

var latencies = new List<double>(requests);
var errors = 0;
var pending = new SemaphoreSlim(concurrency, concurrency);
var swAll = System.Diagnostics.Stopwatch.StartNew();

var tasks = Enumerable.Range(0, requests).Select(async i =>
{
    await pending.WaitAsync();
    try
    {
        var sw = System.Diagnostics.Stopwatch.StartNew();
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

swAll.Stop();

if (latencies.Count > 0)
{
    var count = latencies.Count;
    var min = latencies.Min();
    var max = latencies.Max();
    var avg = latencies.Average();
    var p50 = Percentile(latencies, 50);
    var p90 = Percentile(latencies, 90);
    var p99 = Percentile(latencies, 99);

    Console.WriteLine($"Requests: sent={requests}, ok={count}, errors={errors}");
    Console.WriteLine($"Total time: {swAll.Elapsed.TotalSeconds:F2}s, RPS: {count / swAll.Elapsed.TotalSeconds:F1}");
    Console.WriteLine($"Latency ms -> min:{min:F1} p50:{p50:F1} avg:{avg:F1} p90:{p90:F1} p99:{p99:F1} max:{max:F1}");
}
else
{
    Console.WriteLine($"All requests failed. errors={errors}");
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
