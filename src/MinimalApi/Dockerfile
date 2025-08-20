# Use the official .NET 9.0 SDK image for building
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /app

# Copy solution and project files
COPY ServerlessContainerBenckmark.sln ./
COPY Directory.Packages.props ./
COPY src/MinimalApi/MinimalApi.csproj ./src/MinimalApi/
COPY src/ServiceDefaults/ServiceDefaults.csproj ./src/ServiceDefaults/

# Restore dependencies
RUN dotnet restore src/MinimalApi/MinimalApi.csproj

# Copy source code
COPY src/MinimalApi/ ./src/MinimalApi/
COPY src/ServiceDefaults/ ./src/ServiceDefaults/

# Build and publish the application
RUN dotnet publish src/MinimalApi/MinimalApi.csproj -c Release -o out --no-restore

# Use the runtime image
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
WORKDIR /app

# Copy the published application
COPY --from=build /app/out .

# Expose port
EXPOSE 8080

# Set the entry point
ENTRYPOINT ["dotnet", "MinimalApi.dll"]