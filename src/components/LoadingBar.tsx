import React from 'react';

interface LoadingBarProps {
  progress: number;
}

const LoadingBar: React.FC<LoadingBarProps> = ({ progress }) => {
  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      <div className="h-1 w-full bg-gray-200">
        <div 
          className="h-1 bg-indigo-600 transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
    </div>
  );
};

export default LoadingBar;