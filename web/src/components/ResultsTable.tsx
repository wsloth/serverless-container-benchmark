import React from 'react';
import { AggregatedResult } from '../services/benchmarkService';

interface Props {
  results: AggregatedResult[];
}

const ResultsTable: React.FC<Props> = ({ results }) => {
  const formatMs = (ms: number) => `${Math.round(ms)}ms`;

  if (results.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No results available
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white dark:bg-gray-800">
        <thead>
          <tr className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800">
            <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-b-2 border-gray-300 dark:border-gray-600">
              Region
            </th>
            <th className="px-6 py-4 text-center text-xs font-bold text-pink-600 dark:text-pink-400 uppercase tracking-wider border-b-2 border-gray-300 dark:border-gray-600" colSpan={3}>
              Cold Start
            </th>
            <th className="px-6 py-4 text-center text-xs font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider border-b-2 border-gray-300 dark:border-gray-600" colSpan={3}>
              Warm Start
            </th>
          </tr>
          <tr className="bg-gray-50 dark:bg-gray-700">
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 tracking-wider border-b border-gray-200 dark:border-gray-600">
              
            </th>
            <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 tracking-wider border-b border-gray-200 dark:border-gray-600">
              P50
            </th>
            <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 tracking-wider border-b border-gray-200 dark:border-gray-600">
              P90
            </th>
            <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 tracking-wider border-b border-gray-200 dark:border-gray-600">
              P99
            </th>
            <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 tracking-wider border-b border-gray-200 dark:border-gray-600">
              P50
            </th>
            <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 tracking-wider border-b border-gray-200 dark:border-gray-600">
              P90
            </th>
            <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 tracking-wider border-b border-gray-200 dark:border-gray-600">
              P99
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {results.map((result, idx) => (
            <tr key={idx} className="hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors duration-150">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-purple-500 dark:bg-purple-400"></div>
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{result.region}</span>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-medium text-gray-800 dark:text-gray-200">
                {formatMs(result.coldStart.p50Ms)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-medium text-gray-800 dark:text-gray-200">
                {formatMs(result.coldStart.p90Ms)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-medium text-gray-800 dark:text-gray-200">
                {formatMs(result.coldStart.p99Ms)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-medium text-gray-800 dark:text-gray-200">
                {formatMs(result.warmStart.p50Ms)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-medium text-gray-800 dark:text-gray-200">
                {formatMs(result.warmStart.p90Ms)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-medium text-gray-800 dark:text-gray-200">
                {formatMs(result.warmStart.p99Ms)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ResultsTable;
