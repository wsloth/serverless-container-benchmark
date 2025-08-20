# Use the official .NET 9.0 SDK image for building
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /app

# Copy solution and project files
COPY ServerlessContainerBenckmark.sln ./
COPY Directory.Packages.props ./
COPY src/BenchmarkRunner/BenchmarkRunner.csproj ./src/BenchmarkRunner/
COPY src/ServiceDefaults/ServiceDefaults.csproj ./src/ServiceDefaults/

# Restore dependencies
RUN dotnet restore src/BenchmarkRunner/BenchmarkRunner.csproj

# Copy source code
COPY src/BenchmarkRunner/ ./src/BenchmarkRunner/
COPY src/ServiceDefaults/ ./src/ServiceDefaults/

# Build and publish the application
RUN dotnet publish src/BenchmarkRunner/BenchmarkRunner.csproj -c Release -o out --no-restore

# Use the runtime image
FROM mcr.microsoft.com/dotnet/runtime:9.0 AS runtime
WORKDIR /app

# Copy the published application
COPY --from=build /app/out .

# Set the entry point
ENTRYPOINT ["dotnet", "BenchmarkRunner.dll"]