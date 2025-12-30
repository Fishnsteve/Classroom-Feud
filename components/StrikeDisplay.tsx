
import React, { useState, useEffect, useRef } from 'react';
import { MAX_STRIKES } from '../constants';
import { StrikeIcon } from './icons';

interface StrikeDisplayProps {
  strikes: number;
  totalStrikes?: number;
}

const StrikeDisplay: React.FC<StrikeDisplayProps> = ({ strikes, totalStrikes = MAX_STRIKES }) => {
  const [pulse, setPulse] = useState(false);
  const prevStrikesRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (prevStrikesRef.current !== undefined && strikes > prevStrikesRef.current) {
      setPulse(true);
      const timer = setTimeout(() => setPulse(false), 600);
      return () => clearTimeout(timer);
    }
    prevStrikesRef.current = strikes;
  }, [strikes]);

  return (
    <div className="flex items-center gap-4">
      {Array.from({ length: totalStrikes }).map((_, index) => {
        const isStruck = index < strikes;
        return (
          <div
            key={index}
            className={`
              w-16 h-16 sm:w-20 sm:h-20
              flex items-center justify-center 
              rounded-2xl
              border-2
              transition-all duration-500
              ${isStruck 
                ? 'bg-red-600/20 border-red-500 shadow-[0_0_20px_#ef4444] animate-strike-pulse' 
                : 'bg-black/40 border-white/10 grayscale opacity-40'}
            `}
          >
            <StrikeIcon className={`w-10 h-10 sm:w-12 sm:h-12 ${isStruck ? 'text-red-500' : 'text-slate-600'}`} />
          </div>
        );
      })}
    </div>
  );
};

export default StrikeDisplay;
