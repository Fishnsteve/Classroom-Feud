
import React, { useState, useEffect, useRef } from 'react';

interface TimerProps {
  duration: number;
  graceDuration?: number;
  onTimeUp: () => void;
}

const Timer: React.FC<TimerProps> = ({ duration, graceDuration = 5, onTimeUp }) => {
  const totalDuration = duration + graceDuration;
  const [timeLeft, setTimeLeft] = useState(totalDuration);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (timeLeft <= 0) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      onTimeUp();
      return;
    }

    intervalRef.current = window.setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [timeLeft, onTimeUp]);

  useEffect(() => {
    setTimeLeft(duration + graceDuration);
  }, [duration, graceDuration]);
  
  const isGracePeriod = timeLeft <= graceDuration;
  const displayTime = isGracePeriod ? timeLeft : timeLeft - graceDuration;
  const progress = (timeLeft / totalDuration) * 100;

  return (
    <div className="w-full text-center mb-6 transition-all duration-300">
        <div className="relative mb-2">
          <p className={`font-title text-7xl transition-all duration-300 ${isGracePeriod ? 'text-red-500 scale-110 drop-shadow-[0_0_15px_#ef4444]' : 'text-cyan-400 drop-shadow-[0_0_10px_#22d3ee]'}`}>
              {displayTime}
          </p>
          {isGracePeriod && (
            <p className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-full text-red-500 font-bold text-[10px] uppercase tracking-tighter animate-pulse">
              Final Countdown
            </p>
          )}
        </div>

        <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden border border-white/10 mt-6">
            <div 
                className={`h-full transition-all duration-1000 ease-linear shadow-[0_0_10px_rgba(0,0,0,0.5)] ${isGracePeriod ? 'bg-red-500' : 'bg-cyan-500'}`} 
                style={{ width: `${progress}%` }}
            ></div>
        </div>
    </div>
  );
};

export default Timer;
