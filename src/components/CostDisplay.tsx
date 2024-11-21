import React from 'react';
import { DollarSign } from 'lucide-react';

interface CostDisplayProps {
  tokens: number;
  cost: number;
}

const CostDisplay: React.FC<CostDisplayProps> = ({ tokens, cost }) => {
  return (
    <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
      <div className="flex items-center gap-2">
        <DollarSign className="w-5 h-5 text-green-600" />
        <span className="text-green-800 font-medium">Coût estimé</span>
      </div>
      <div className="text-right">
        <p className="text-green-800">
          <span className="font-medium">{tokens.toLocaleString()}</span> tokens
        </p>
        <p className="text-green-800">
          <span className="font-medium">${cost.toFixed(4)}</span> USD
        </p>
      </div>
    </div>
  );
};

export default CostDisplay;