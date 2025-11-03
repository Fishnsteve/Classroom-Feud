import React, { useState, useEffect, useRef } from 'react';

interface TimerProps {
  duration: number;
  onTimeUp: () => void;
}

const Timer: React.FC<TimerProps> = ({ duration, onTimeUp }) => {
  const [timeLeft, setTimeLeft] = useState(duration);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    // This effect handles the countdown logic.
    // It's crucial to clear the interval on cleanup to prevent memory leaks.
    
    // If time is up, call the callback and stop.
    if (timeLeft <= 0) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      onTimeUp();
      return;
    }

    // Set up the interval to decrement time every second.
    intervalRef.current = window.setInterval(() => {
      setTimeLeft((prevTime) => prevTime - 1);
    }, 1000);

    // Cleanup function: this is called when the component unmounts or `timeLeft` or `onTimeUp` changes.
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [timeLeft, onTimeUp]);

  // Reset timeLeft when the duration prop changes (e.g., new round or phase).
  // This is typically handled by re-keying the component, but this is a fallback.
  useEffect(() => {
    setTimeLeft(duration);
  }, [duration]);
  
  const progress = (timeLeft / duration) * 100;
  let colorClass = 'bg-green-500';
  if (progress < 50) colorClass = 'bg-yellow-500';
  if (progress < 25) colorClass = 'bg-red-500';

  return (
    <div className="w-full max-w-xs mx-auto text-center my-2">
        <p className="font-title text-5xl text-white mb-2" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>{timeLeft}</p>
        <div className="w-full bg-sky-900/50 rounded-full h-4 overflow-hidden border-2 border-sky-700/50">
            <div 
                className={`h-full rounded-full transition-all duration-200 ease-linear ${colorClass}`} 
                style={{ width: `${progress}%` }}
                aria-valuenow={timeLeft}
                aria-valuemin={0}
                aria-valuemax={duration}
                role="progressbar"
            ></div>
        </div>
    </div>
  );
};

export default Timer;
