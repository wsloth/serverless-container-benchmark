using ServiceDefaults;

var builder = WebApplication.CreateBuilder(args);

builder.AddServiceDefaults();

var app = builder.Build();

// Health endpoint
app.MapGet("/ping", () => Results.Ok(new { ok = true, ts = DateTimeOffset.UtcNow }));

app.Run();
