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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
      <div className="bg-gradient-to-br from-purple-500 to-indigo-600 dark:from-purple-600 dark:to-indigo-800 p-6 rounded-xl shadow-lg text-white transform transition hover:scale-105">
        <div className="flex items-center gap-2 mb-3">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-xs font-medium uppercase tracking-wide opacity-90">Total Regions</div>
        </div>
        <div className="text-4xl font-bold">{stats.totalRegions}</div>
      </div>
      
      <div className="bg-gradient-to-br from-pink-500 to-rose-600 dark:from-pink-600 dark:to-rose-800 p-6 rounded-xl shadow-lg text-white transform transition hover:scale-105">
        <div className="flex items-center gap-2 mb-3">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-xs font-medium uppercase tracking-wide opacity-90">Avg Cold P50</div>
        </div>
        <div className="text-4xl font-bold">{stats.avgColdP50}<span className="text-lg ml-1">ms</span></div>
      </div>
      
      <div className="bg-gradient-to-br from-orange-500 to-red-600 dark:from-orange-600 dark:to-red-800 p-6 rounded-xl shadow-lg text-white transform transition hover:scale-105">
        <div className="flex items-center gap-2 mb-3">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <div className="text-xs font-medium uppercase tracking-wide opacity-90">Avg Cold P99</div>
        </div>
        <div className="text-4xl font-bold">{stats.avgColdP99}<span className="text-lg ml-1">ms</span></div>
      </div>
      
      <div className="bg-gradient-to-br from-cyan-500 to-blue-600 dark:from-cyan-600 dark:to-blue-800 p-6 rounded-xl shadow-lg text-white transform transition hover:scale-105">
        <div className="flex items-center gap-2 mb-3">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
          <div className="text-xs font-medium uppercase tracking-wide opacity-90">Avg Warm P50</div>
        </div>
        <div className="text-4xl font-bold">{stats.avgWarmP50}<span className="text-lg ml-1">ms</span></div>
      </div>
      
      <div className="bg-gradient-to-br from-teal-500 to-emerald-600 dark:from-teal-600 dark:to-emerald-800 p-6 rounded-xl shadow-lg text-white transform transition hover:scale-105">
        <div className="flex items-center gap-2 mb-3">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-xs font-medium uppercase tracking-wide opacity-90">Best Region</div>
        </div>
        <div className="text-3xl font-bold truncate">{stats.bestRegion}</div>
      </div>
    </div>
  );
};

export default StatsCard;
