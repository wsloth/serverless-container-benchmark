import React from 'react';
import { AggregatedResult } from '../services/benchmarkService';

interface Props {
  results: AggregatedResult[];
}

const StatsCard: React.FC<Props> = ({ results }) => {
  if (results.length === 0) {
    return null;
  }

  const calculateStats = () => {
    const coldP50s = results.map((r) => r.coldStart.p50Ms);
    const coldP99s = results.map((r) => r.coldStart.p99Ms);
    const warmP50s = results.map((r) => r.warmStart.p50Ms);

    return {
      avgColdP50: Math.round(coldP50s.reduce((a, b) => a + b, 0) / coldP50s.length),
      avgColdP99: Math.round(coldP99s.reduce((a, b) => a + b, 0) / coldP99s.length),
      avgWarmP50: Math.round(warmP50s.reduce((a, b) => a + b, 0) / warmP50s.length),
      bestRegion: results.reduce((best, curr) =>
        curr.coldStart.p99Ms < best.coldStart.p99Ms ? curr : best
      ).region,
      totalRegions: results.length,
    };
  };

  const stats = calculateStats();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="text-sm text-gray-500 uppercase">Total Regions</div>
        <div className="text-3xl font-bold text-gray-900 mt-2">{stats.totalRegions}</div>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="text-sm text-gray-500 uppercase">Avg Cold P50</div>
        <div className="text-3xl font-bold text-red-600 mt-2">{stats.avgColdP50}ms</div>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="text-sm text-gray-500 uppercase">Avg Cold P99</div>
        <div className="text-3xl font-bold text-red-700 mt-2">{stats.avgColdP99}ms</div>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="text-sm text-gray-500 uppercase">Avg Warm P50</div>
        <div className="text-3xl font-bold text-blue-600 mt-2">{stats.avgWarmP50}ms</div>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="text-sm text-gray-500 uppercase">Best Region</div>
        <div className="text-2xl font-bold text-green-600 mt-2">{stats.bestRegion}</div>
      </div>
    </div>
  );
};

export default StatsCard;
