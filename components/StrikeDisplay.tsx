
import React from 'react';
import { MAX_STRIKES } from '../constants';
import { StrikeIcon } from './icons';

interface StrikeDisplayProps {
  strikes: number;
}

const StrikeDisplay: React.FC<StrikeDisplayProps> = ({ strikes }) => {
  return (
    <div className="flex items-center justify-center space-x-3">
      {Array.from({ length: MAX_STRIKES }).map((_, index) => (
        <div
          key={index}
          className={`
            w-14 h-14 md:w-16 md:h-16
            flex items-center justify-center 
            rounded-full 
            shadow-lg
            transition-all duration-300
            ${index < strikes ? 'bg-red-600' : 'bg-gray-700'}
          `}
        >
          {/* FIX: Reduced icon size to match the new container size. */}
          <StrikeIcon className={`w-8 h-8 md:w-10 md:h-10 transition-colors duration-300 ${index < strikes ? 'text-white' : 'text-gray-500'}`} />
        </div>
      ))}
    </div>
  );
};

export default StrikeDisplay;