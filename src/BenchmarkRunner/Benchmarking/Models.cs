namespace BenchmarkRunner.Benchmarking;

public record BenchmarkResult
{
    public required string RunId { get; init; }
    public required DateTimeOffset Timestamp { get; init; }
    public required string Path { get; init; }
    public required string Phase { get; init; } // Cold | Warm | Total

    public required int Sent { get; init; }
    public required int Ok { get; init; }
    public required int Errors { get; init; }

    public required double ElapsedSeconds { get; init; }
    public required double Rps { get; init; }

    public required double MinMs { get; init; }
    public required double P50Ms { get; init; }
    public required double AvgMs { get; init; }
    public required double P90Ms { get; init; }
    public required double P99Ms { get; init; }
    public required double MaxMs { get; init; }

    // Context
    public required string BaseUri { get; init; }
    public required int Concurrency { get; init; }
    public required int ColdCalls { get; init; }
    public required int WarmCalls { get; init; }
    public required string Region { get; init; } // Runner region (e.g., westeurope). Used for central aggregation.
}
