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
      <table className="min-w-full bg-white">
        <thead>
          <tr className="bg-gradient-to-r from-gray-50 to-gray-100">
            <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b-2 border-gray-300">
              Region
            </th>
            <th className="px-6 py-4 text-center text-xs font-bold text-rose-700 uppercase tracking-wider border-b-2 border-gray-300" colSpan={3}>
              Cold Start
            </th>
            <th className="px-6 py-4 text-center text-xs font-bold text-blue-700 uppercase tracking-wider border-b-2 border-gray-300" colSpan={3}>
              Warm Start
            </th>
          </tr>
          <tr className="bg-gray-50">
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 tracking-wider border-b border-gray-200">
              
            </th>
            <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 tracking-wider border-b border-gray-200">
              P50
            </th>
            <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 tracking-wider border-b border-gray-200">
              P90
            </th>
            <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 tracking-wider border-b border-gray-200">
              P99
            </th>
            <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 tracking-wider border-b border-gray-200">
              P50
            </th>
            <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 tracking-wider border-b border-gray-200">
              P90
            </th>
            <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 tracking-wider border-b border-gray-200">
              P99
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {results.map((result, idx) => (
            <tr key={idx} className="hover:bg-blue-50 transition-colors duration-150">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                  <span className="text-sm font-semibold text-gray-900">{result.region}</span>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-medium text-gray-800">
                {formatMs(result.coldStart.p50Ms)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-medium text-gray-800">
                {formatMs(result.coldStart.p90Ms)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-medium text-gray-800">
                {formatMs(result.coldStart.p99Ms)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-medium text-gray-800">
                {formatMs(result.warmStart.p50Ms)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-medium text-gray-800">
                {formatMs(result.warmStart.p90Ms)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-medium text-gray-800">
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
