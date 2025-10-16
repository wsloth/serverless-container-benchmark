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
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    loadResults();
  }, []);

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

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
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-black transition-colors">
      <Header darkMode={darkMode} onToggleDarkMode={() => setDarkMode(!darkMode)} />
      
      <main className="flex-grow container mx-auto px-4 py-10">
        {loading && (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-blue-600 dark:border-blue-400 border-t-transparent"></div>
            <p className="mt-6 text-lg text-gray-700 dark:text-gray-300 font-medium">Loading benchmark results...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 text-red-700 dark:text-red-400 px-6 py-4 rounded-lg shadow-md mb-8">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium">{error}</span>
            </div>
          </div>
        )}

        {!loading && !error && (
          <div className="space-y-10">
            <section>
              <div className="flex items-center gap-2 mb-6">
                <svg className="w-6 h-6 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                </svg>
                <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Overview</h2>
              </div>
              <StatsCard results={results} />
            </section>

            <section>
              <div className="flex items-center gap-2 mb-6">
                <svg className="w-6 h-6 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Performance Metrics</h2>
              </div>
              <ResultsChart results={results} />
            </section>

            <section>
              <div className="flex items-center gap-2 mb-6">
                <svg className="w-6 h-6 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Detailed Results</h2>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
                <ResultsTable results={results} />
              </div>
            </section>

            <section className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-l-4 border-indigo-500 dark:border-indigo-400 p-8 rounded-xl shadow-md">
              <div className="flex items-center gap-2 mb-4">
                <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-xl font-bold text-indigo-900 dark:text-indigo-300">About this benchmark</h3>
              </div>
              <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
                This benchmark measures the cold start performance of serverless containers running on 
                Azure Container Apps across multiple regions. Each region runs its own benchmark job 
                that tests the local Container App endpoint to minimize network latency.
              </p>
              <div className="bg-white dark:bg-gray-800/50 bg-opacity-60 p-5 rounded-lg">
                <p className="font-bold text-gray-800 dark:text-gray-200 mb-3">Key Metrics:</p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-500 dark:text-indigo-400 font-bold">•</span>
                    <span className="text-gray-700 dark:text-gray-300"><strong className="text-gray-900 dark:text-gray-100">P50 (Median):</strong> 50% of requests complete within this time</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-500 dark:text-indigo-400 font-bold">•</span>
                    <span className="text-gray-700 dark:text-gray-300"><strong className="text-gray-900 dark:text-gray-100">P90:</strong> 90% of requests complete within this time</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-500 dark:text-indigo-400 font-bold">•</span>
                    <span className="text-gray-700 dark:text-gray-300"><strong className="text-gray-900 dark:text-gray-100">P99:</strong> 99% of requests complete within this time (worst-case performance)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-500 dark:text-indigo-400 font-bold">•</span>
                    <span className="text-gray-700 dark:text-gray-300"><strong className="text-gray-900 dark:text-gray-100">Cold Start:</strong> First request to a scaled-down container</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-500 dark:text-indigo-400 font-bold">•</span>
                    <span className="text-gray-700 dark:text-gray-300"><strong className="text-gray-900 dark:text-gray-100">Warm Start:</strong> Subsequent requests to an already running container</span>
                  </li>
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
