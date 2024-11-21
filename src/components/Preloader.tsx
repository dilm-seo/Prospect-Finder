import React from 'react';
import { Target } from 'lucide-react';

const Preloader: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center z-50">
      <div className="text-center">
        <div className="relative">
          <Target className="w-16 h-16 text-indigo-600 animate-[spin_3s_linear_infinite]" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin"></div>
          </div>
        </div>
        <h2 className="mt-4 text-xl font-semibold text-gray-800">
          ProspectFinder
        </h2>
        <p className="mt-2 text-gray-600">
          Chargement de vos opportunités...
        </p>
      </div>
    </div>
  );
};

export default Preloader;