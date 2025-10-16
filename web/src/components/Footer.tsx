import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-800 text-white py-6 mt-auto">
      <div className="container mx-auto px-4 text-center">
        <p className="text-sm">
          Inspired by the{' '}
          <a
            href="https://serverlessbenchmark.cloudrepublic.nl/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 underline"
          >
            CloudRepublic Serverless Function Benchmark
          </a>
        </p>
        <p className="text-xs text-gray-400 mt-2">
          Measuring cold start performance of serverless containers on Azure Container Apps
        </p>
      </div>
    </footer>
  );
};

export default Footer;
