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
    <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100">
      <div className="flex items-center gap-3 mb-6">
        <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <h3 className="text-xl font-bold text-gray-800">Performance Comparison by Region</h3>
      </div>
      <ResponsiveContainer width="100%" height={450}>
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey="region" 
            tick={{ fill: '#6b7280', fontSize: 12 }}
            tickLine={{ stroke: '#d1d5db' }}
          />
          <YAxis 
            label={{ value: 'Latency (ms)', angle: -90, position: 'insideLeft', style: { fill: '#6b7280' } }}
            tick={{ fill: '#6b7280', fontSize: 12 }}
            tickLine={{ stroke: '#d1d5db' }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#ffffff', 
              border: '1px solid #e5e7eb', 
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
            }}
          />
          <Legend 
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="circle"
          />
          <Bar dataKey="Cold P50" fill="#f43f5e" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Cold P90" fill="#e11d48" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Cold P99" fill="#be123c" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Warm P50" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Warm P90" fill="#2563eb" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Warm P99" fill="#1d4ed8" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ResultsChart;
