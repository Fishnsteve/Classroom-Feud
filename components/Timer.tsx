
import React, { useState, useEffect, useRef } from 'react';

interface TimerProps {
  duration: number;
  graceDuration?: number;
  onTimeUp: () => void;
}

const Timer: React.FC<TimerProps> = ({ duration, graceDuration = 5, onTimeUp }) => {
  // Total time is the initial duration plus the extra grace period for typing fairness.
  const totalDuration = duration + graceDuration;
  const [timeLeft, setTimeLeft] = useState(totalDuration);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    // When total time (including grace) runs out, trigger the onTimeUp callback.
    if (timeLeft <= 0) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      onTimeUp();
      return;
    }

    // Set up the interval to decrement time every second.
    intervalRef.current = window.setInterval(() => {
      setTimeLeft((prevTime) => prevTime - 1);
    }, 1000);

    // Cleanup interval on unmount or state change.
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [timeLeft, onTimeUp]);

  // Reset timeLeft when the duration prop changes (e.g., new round or phase).
  useEffect(() => {
    setTimeLeft(duration + graceDuration);
  }, [duration, graceDuration]);
  
  // Determine if we are currently in the 5-second "Last Chance" period.
  const isGracePeriod = timeLeft <= graceDuration;
  
  /**
   * Display Logic:
   * Phase 1: timeLeft is between totalDuration and graceDuration + 1. 
   *          We display (timeLeft - graceDuration) so the user sees 30 down to 1.
   * Phase 2: timeLeft is between graceDuration and 1.
   *          We display timeLeft directly so the user sees 5 down to 1 in red.
   */
  const displayTime = isGracePeriod ? timeLeft : timeLeft - graceDuration;

  // Overall progress for the bar (0 to 100%)
  const progress = (timeLeft / totalDuration) * 100;
  
  // Styling based on phase
  const textColorClass = isGracePeriod 
    ? 'text-red-500 animate-strike-pulse drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]' 
    : 'text-white';

  let barColorClass = 'bg-green-500';
  if (isGracePeriod) {
    barColorClass = 'bg-red-600';
  } else {
    // Initial phase color logic
    const phase1Progress = ((timeLeft - graceDuration) / duration) * 100;
    if (phase1Progress < 50) barColorClass = 'bg-yellow-500';
    if (phase1Progress < 25) barColorClass = 'bg-orange-500';
  }

  return (
    <div className="w-full max-w-xs mx-auto text-center my-2 transition-all duration-300">
        <p className={`font-title text-6xl md:text-7xl mb-1 transition-all duration-300 ${textColorClass}`} 
           style={{ textShadow: !isGracePeriod ? '2px 2px 4px rgba(0,0,0,0.5)' : 'none' }}>
            {displayTime}
        </p>
        
        {isGracePeriod && (
          <p className="text-red-400 font-black text-xs uppercase tracking-tighter mb-2 animate-pulse">
            Last chance to type!
          </p>
        )}

        <div className="w-full bg-sky-900/50 rounded-full h-4 overflow-hidden border-2 border-sky-700/50 shadow-inner">
            <div 
                className={`h-full rounded-full transition-all duration-1000 ease-linear ${barColorClass}`} 
                style={{ width: `${progress}%` }}
                aria-valuenow={timeLeft}
                aria-valuemin={0}
                aria-valuemax={totalDuration}
                role="progressbar"
            ></div>
        </div>
    </div>
  );
};

export default Timer;
