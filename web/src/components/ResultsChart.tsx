import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { AggregatedResult } from '../services/benchmarkService';

interface Props {
  results: AggregatedResult[];
}

const ResultsChart: React.FC<Props> = ({ results }) => {
  const chartData = results.map((result) => ({
    region: result.region,
    'Cold P50': Math.round(result.coldStart.p50Ms),
    'Cold P90': Math.round(result.coldStart.p90Ms),
    'Cold P99': Math.round(result.coldStart.p99Ms),
    'Warm P50': Math.round(result.warmStart.p50Ms),
    'Warm P90': Math.round(result.warmStart.p90Ms),
    'Warm P99': Math.round(result.warmStart.p99Ms),
  }));

  if (results.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No data available to display
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Performance Comparison</h3>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="region" />
          <YAxis label={{ value: 'Latency (ms)', angle: -90, position: 'insideLeft' }} />
          <Tooltip />
          <Legend />
          <Bar dataKey="Cold P50" fill="#ef4444" />
          <Bar dataKey="Cold P90" fill="#dc2626" />
          <Bar dataKey="Cold P99" fill="#b91c1c" />
          <Bar dataKey="Warm P50" fill="#3b82f6" />
          <Bar dataKey="Warm P90" fill="#2563eb" />
          <Bar dataKey="Warm P99" fill="#1d4ed8" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ResultsChart;
