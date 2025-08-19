using Azure.Data.Tables;
using Microsoft.Extensions.Azure;

namespace BenchmarkRunner.Storage;

public interface ITableClientAdapter
{
    Task CreateIfNotExistsAsync(CancellationToken cancellationToken);
    Task<int> SubmitTransactionAsync(IReadOnlyList<TableTransactionAction> actions, CancellationToken cancellationToken);
}

public interface ITableClientAdapterFactory
{
    ITableClientAdapter Create(string clientName, string tableName);
}

internal sealed class TableClientAdapterFactory : ITableClientAdapterFactory
{
    private readonly IAzureClientFactory<TableServiceClient> _factory;

    public TableClientAdapterFactory(IAzureClientFactory<TableServiceClient> factory)
    {
        _factory = factory;
    }

    public ITableClientAdapter Create(string clientName, string tableName)
    {
        var serviceClient = _factory.CreateClient(clientName);
        var tableClient = serviceClient.GetTableClient(tableName);
        return new TableClientAdapter(tableClient);
    }
}

internal sealed class TableClientAdapter : ITableClientAdapter
{
    private readonly TableClient _inner;

    public TableClientAdapter(TableClient inner)
    {
        _inner = inner;
    }

    public Task CreateIfNotExistsAsync(CancellationToken cancellationToken)
        => _inner.CreateIfNotExistsAsync(cancellationToken);

    public async Task<int> SubmitTransactionAsync(IReadOnlyList<TableTransactionAction> actions, CancellationToken cancellationToken)
    {
        var resp = await _inner.SubmitTransactionAsync(actions, cancellationToken);
        return resp.Value.Count;
    }
}

