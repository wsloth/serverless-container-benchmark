import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import StatsCard from './components/StatsCard';
import ResultsChart from './components/ResultsChart';
import ResultsTable from './components/ResultsTable';
import { benchmarkService, AggregatedResult } from './services/benchmarkService';

function App() {
  const [results, setResults] = useState<AggregatedResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadResults();
  }, []);

  const loadResults = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await benchmarkService.fetchLatestResults();
      const aggregated = benchmarkService.aggregateByRegion(data);
      setResults(aggregated);
    } catch (err) {
      setError('Failed to load benchmark results');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading benchmark results...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {!loading && !error && (
          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Overview</h2>
              <StatsCard results={results} />
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Performance Metrics</h2>
              <ResultsChart results={results} />
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Detailed Results</h2>
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <ResultsTable results={results} />
              </div>
            </section>

            <section className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">About this benchmark</h3>
              <p className="text-blue-800 mb-3">
                This benchmark measures the cold start performance of serverless containers running on 
                Azure Container Apps across multiple regions. Each region runs its own benchmark job 
                that tests the local Container App endpoint to minimize network latency.
              </p>
              <div className="text-sm text-blue-700">
                <p className="font-semibold mb-1">Key Metrics:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li><strong>P50 (Median):</strong> 50% of requests complete within this time</li>
                  <li><strong>P90:</strong> 90% of requests complete within this time</li>
                  <li><strong>P99:</strong> 99% of requests complete within this time (worst-case performance)</li>
                  <li><strong>Cold Start:</strong> First request to a scaled-down container</li>
                  <li><strong>Warm Start:</strong> Subsequent requests to an already running container</li>
                </ul>
              </div>
            </section>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default App;
