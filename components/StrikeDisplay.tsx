
import React, { useState, useEffect, useRef } from 'react';
import { MAX_STRIKES } from '../constants';
import { StrikeIcon } from './icons';

interface StrikeDisplayProps {
  strikes: number;
  totalStrikes?: number;
}

const StrikeDisplay: React.FC<StrikeDisplayProps> = ({ strikes, totalStrikes = MAX_STRIKES }) => {
  const [pulse, setPulse] = useState(false);
  // FIX: Explicitly initialize useRef with `undefined` to satisfy the "Expected 1 arguments, but got 0" error.
  const prevStrikesRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    // Only trigger animation if the number of strikes increases
    if (prevStrikesRef.current !== undefined && strikes > prevStrikesRef.current) {
      setPulse(true);
      // Reset the pulse state after the animation completes
      const timer = setTimeout(() => setPulse(false), 500); // Corresponds to animation duration
      return () => clearTimeout(timer);
    }
    // Store current strikes value for the next render
    prevStrikesRef.current = strikes;
  }, [strikes]);

  return (
    <div className="flex items-center justify-center space-x-3">
      {Array.from({ length: totalStrikes }).map((_, index) => {
        const isStruck = index < strikes;
        const animationClass = isStruck && pulse ? 'animate-strike-pulse' : '';
        
        return (
          <div
            key={index}
            className={`
              w-14 h-14 md:w-16 md:h-16
              flex items-center justify-center 
              rounded-full 
              shadow-lg
              transition-all duration-300
              ${isStruck ? 'bg-rose-500 border-b-4 border-rose-700' : 'bg-sky-900/50 border-2 border-sky-700/50'}
              ${animationClass}
            `}
          >
            <StrikeIcon className={`w-8 h-8 md:w-10 md:h-10 transition-colors duration-300 ${isStruck ? 'text-white' : 'text-sky-700'}`} />
          </div>
        );
      })}
    </div>
  );
};

export default StrikeDisplay;
