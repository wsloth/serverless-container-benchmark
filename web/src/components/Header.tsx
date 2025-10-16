import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="bg-blue-600 text-white shadow-lg">
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-3xl font-bold">Serverless Container Benchmark</h1>
        <p className="text-blue-100 mt-2">
          Cold start performance of Azure Container Apps across multiple regions
        </p>
      </div>
    </header>
  );
};

export default Header;
