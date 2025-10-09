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
      <table className="min-w-full bg-white border border-gray-200 shadow-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
              Region
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b" colSpan={3}>
              Cold Start
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b" colSpan={3}>
              Warm Start
            </th>
          </tr>
          <tr className="bg-gray-50">
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 tracking-wider border-b">
              
            </th>
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 tracking-wider border-b">
              P50
            </th>
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 tracking-wider border-b">
              P90
            </th>
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 tracking-wider border-b">
              P99
            </th>
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 tracking-wider border-b">
              P50
            </th>
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 tracking-wider border-b">
              P90
            </th>
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 tracking-wider border-b">
              P99
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {results.map((result, idx) => (
            <tr key={idx} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {result.region}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-700">
                {formatMs(result.coldStart.p50Ms)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-700">
                {formatMs(result.coldStart.p90Ms)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-700">
                {formatMs(result.coldStart.p99Ms)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-700">
                {formatMs(result.warmStart.p50Ms)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-700">
                {formatMs(result.warmStart.p90Ms)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-700">
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
