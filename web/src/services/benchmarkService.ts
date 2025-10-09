import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export interface BenchmarkResult {
  runId: string;
  timestamp: string;
  path: string;
  phase: string; // Cold | Warm | Total
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

export interface AggregatedResult {
  region: string;
  runId: string;
  timestamp: string;
  coldStart: {
    p50Ms: number;
    p90Ms: number;
    p99Ms: number;
    avgMs: number;
    minMs: number;
    maxMs: number;
  };
  warmStart: {
    p50Ms: number;
    p90Ms: number;
    p99Ms: number;
    avgMs: number;
    minMs: number;
    maxMs: number;
  };
}

class BenchmarkService {
  async fetchResults(): Promise<BenchmarkResult[]> {
    try {
      const response = await axios.get<BenchmarkResult[]>(`${API_BASE_URL}/results`);
      if (Array.isArray(response.data)) {
        return response.data;
      }
      // If response is not an array, fall back to mock data
      console.log('API returned non-array data, using mock data');
      return this.getMockData();
    } catch (error) {
      console.log('Error fetching benchmark results, using mock data:', error);
      // Return mock data for development
      return this.getMockData();
    }
  }

  async fetchLatestResults(): Promise<BenchmarkResult[]> {
    try {
      const response = await axios.get<BenchmarkResult[]>(`${API_BASE_URL}/results/latest`);
      if (Array.isArray(response.data)) {
        return response.data;
      }
      // If response is not an array, fall back to mock data
      console.log('API returned non-array data, using mock data');
      return this.getMockData();
    } catch (error) {
      console.log('Error fetching latest results, using mock data:', error);
      return this.getMockData();
    }
  }

  aggregateByRegion(results: BenchmarkResult[]): AggregatedResult[] {
    if (!Array.isArray(results) || results.length === 0) {
      return [];
    }

    const grouped = results.reduce((acc, result) => {
      const key = `${result.region}-${result.runId}`;
      if (!acc[key]) {
        acc[key] = {
          region: result.region,
          runId: result.runId,
          timestamp: result.timestamp,
          coldResults: [],
          warmResults: [],
        };
      }
      if (result.phase === 'Cold') {
        acc[key].coldResults.push(result);
      } else if (result.phase === 'Warm') {
        acc[key].warmResults.push(result);
      }
      return acc;
    }, {} as Record<string, any>);

    return Object.values(grouped).map((group: any) => {
      const coldStart = this.aggregatePhase(group.coldResults);
      const warmStart = this.aggregatePhase(group.warmResults);
      return {
        region: group.region,
        runId: group.runId,
        timestamp: group.timestamp,
        coldStart,
        warmStart,
      };
    });
  }

  private aggregatePhase(results: BenchmarkResult[]) {
    if (results.length === 0) {
      return {
        p50Ms: 0,
        p90Ms: 0,
        p99Ms: 0,
        avgMs: 0,
        minMs: 0,
        maxMs: 0,
      };
    }

    return {
      p50Ms: results.reduce((sum, r) => sum + r.p50Ms, 0) / results.length,
      p90Ms: results.reduce((sum, r) => sum + r.p90Ms, 0) / results.length,
      p99Ms: results.reduce((sum, r) => sum + r.p99Ms, 0) / results.length,
      avgMs: results.reduce((sum, r) => sum + r.avgMs, 0) / results.length,
      minMs: Math.min(...results.map(r => r.minMs)),
      maxMs: Math.max(...results.map(r => r.maxMs)),
    };
  }

  private getMockData(): BenchmarkResult[] {
    const regions = ['westus', 'eastus', 'westeurope', 'southeastasia'];
    const runId = 'run-2024-01-01';
    const now = new Date().toISOString();
    
    const mockData: BenchmarkResult[] = [];

    regions.forEach((region) => {
      // Cold start data
      mockData.push({
        runId,
        timestamp: now,
        path: '/ping',
        phase: 'Cold',
        sent: 5,
        ok: 5,
        errors: 0,
        elapsedSeconds: 5.2,
        rps: 0.96,
        minMs: 800 + Math.random() * 400,
        p50Ms: 1200 + Math.random() * 600,
        avgMs: 1300 + Math.random() * 700,
        p90Ms: 1800 + Math.random() * 900,
        p99Ms: 2200 + Math.random() * 1100,
        maxMs: 2500 + Math.random() * 1200,
        baseUri: `https://${region}.azurecontainerapps.io`,
        concurrency: 10,
        coldCalls: 5,
        warmCalls: 10,
        region,
      });

      // Warm start data
      mockData.push({
        runId,
        timestamp: now,
        path: '/ping',
        phase: 'Warm',
        sent: 10,
        ok: 10,
        errors: 0,
        elapsedSeconds: 1.2,
        rps: 8.33,
        minMs: 80 + Math.random() * 40,
        p50Ms: 120 + Math.random() * 60,
        avgMs: 130 + Math.random() * 70,
        p90Ms: 180 + Math.random() * 90,
        p99Ms: 220 + Math.random() * 110,
        maxMs: 250 + Math.random() * 120,
        baseUri: `https://${region}.azurecontainerapps.io`,
        concurrency: 10,
        coldCalls: 5,
        warmCalls: 10,
        region,
      });
    });

    return mockData;
  }
}

export const benchmarkService = new BenchmarkService();
