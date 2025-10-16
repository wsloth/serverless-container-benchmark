import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gradient-to-r from-gray-800 via-gray-900 to-indigo-900 dark:from-black dark:via-gray-950 dark:to-indigo-950 text-white py-8 mt-auto border-t border-gray-700 dark:border-gray-800">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-indigo-400 dark:text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <p className="text-sm text-gray-300 dark:text-gray-400">
              Inspired by the{' '}
              <a
                href="https://serverlessbenchmark.cloudrepublic.nl/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-400 dark:text-indigo-300 hover:text-indigo-300 dark:hover:text-indigo-200 underline font-medium transition-colors"
              >
                CloudRepublic Serverless Function Benchmark
              </a>
            </p>
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Measuring cold start performance of serverless containers on Azure Container Apps
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
