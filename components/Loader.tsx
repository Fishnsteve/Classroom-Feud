import React from 'react';

// FIX: Removed background styling. The loader is now transparent and intended to be used inside an overlay container.
const Loader: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center text-white space-y-4 p-8">
      <div className="w-16 h-16 border-4 border-t-4 border-gray-200 border-t-yellow-400 rounded-full animate-spin"></div>
      <p className="text-xl font-semibold">Checking Answer...</p>
    </div>
  );
};

export default Loader;