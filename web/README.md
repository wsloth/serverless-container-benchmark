# Serverless Container Benchmark - Frontend

A React-based web application for visualizing cold start performance metrics of Azure Container Apps across multiple regions.

## Features

- 📊 **Interactive Charts**: Visual comparison of performance metrics across regions
- 📈 **Detailed Tables**: Complete breakdown of cold and warm start latencies
- 🎯 **Key Metrics**: Overview cards showing aggregate statistics
- 🎨 **Modern UI**: Built with Tailwind CSS for a clean, responsive design
- ⚡ **Static Build**: Optimized for deployment on Azure Static Web Apps
- 🔄 **Mock Data**: Development mode with realistic sample data

## Tech Stack

- **React** with TypeScript
- **Vite** for fast builds and HMR
- **Tailwind CSS** for styling
- **Recharts** for data visualization
- **Axios** for API communication

## Getting Started

### Prerequisites

- Node.js 20+ (recommended)
- npm 10+

### Installation

```bash
cd web
npm install
```

### Development

Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:5173/`

### Environment Variables

Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

Configuration:
- `VITE_API_URL`: Base URL for the benchmark API (default: `/api`)

### Building for Production

Build the static files:

```bash
npm run build
```

The output will be in the `dist/` directory.

Preview the production build:

```bash
npm run preview
```

## Project Structure

```
web/
├── src/
│   ├── components/          # React components
│   │   ├── Header.tsx       # Application header
│   │   ├── Footer.tsx       # Application footer
│   │   ├── StatsCard.tsx    # Overview statistics cards
│   │   ├── ResultsChart.tsx # Performance comparison chart
│   │   └── ResultsTable.tsx # Detailed results table
│   ├── services/            # API and business logic
│   │   └── benchmarkService.ts  # Benchmark data service
│   ├── App.tsx              # Main application component
│   ├── main.tsx             # Application entry point
│   └── index.css            # Global styles (Tailwind)
├── public/                  # Static assets
├── index.html              # HTML template
├── tailwind.config.js      # Tailwind configuration
├── tsconfig.json           # TypeScript configuration
├── vite.config.js          # Vite configuration
└── staticwebapp.config.json # Azure Static Web Apps configuration
```

## API Integration

The frontend expects a REST API with the following endpoint:

### GET `/api/results/latest`

Returns an array of benchmark results:

```typescript
interface BenchmarkResult {
  runId: string;
  timestamp: string;
  path: string;
  phase: string; // "Cold" | "Warm" | "Total"
  sent: number;
  ok: number;
  errors: number;
  elapsedSeconds: number;
  rps: number;
  minMs: number;
  p50Ms: number;
  avgMs: number;
  p90Ms: number;
  p99Ms: number;
  maxMs: number;
  baseUri: string;
  concurrency: number;
  coldCalls: number;
  warmCalls: number;
  region: string;
}
```

When the API is not available, the application falls back to mock data for development purposes.

## Deployment to Azure Static Web Apps

### Prerequisites

- Azure account
- Azure CLI or Azure Static Web Apps CLI

### Deployment Steps

1. Build the application:
   ```bash
   npm run build
   ```

2. Deploy using Azure Static Web Apps CLI:
   ```bash
   swa deploy --app-location ./dist
   ```

Or configure GitHub Actions for continuous deployment.

### Configuration

The `staticwebapp.config.json` file contains:
- API routing rules
- Navigation fallback for SPA routing
- Cache headers for static assets

## Development Notes

### Mock Data

When the API endpoint is unavailable or returns invalid data, the application automatically uses mock data. This enables development without a backend.

### Component Design

- **Header**: Displays the application title and description
- **StatsCard**: Shows key performance indicators (total regions, average latencies, best region)
- **ResultsChart**: Bar chart comparing P50/P90/P99 metrics for cold and warm starts across regions
- **ResultsTable**: Detailed table with all performance metrics organized by region
- **Footer**: Credits and additional information

### Styling

The application uses Tailwind CSS with a responsive grid layout:
- Mobile-first design
- Flexible grid columns (1-5 columns based on screen size)
- Consistent color scheme (blue for primary, red for cold starts, blue for warm starts)

## Contributing

When adding new features:

1. Follow the existing component structure
2. Use TypeScript for type safety
3. Maintain Tailwind CSS conventions
4. Test with both mock and real API data
5. Ensure responsive design

## License

See the LICENSE file in the repository root.
