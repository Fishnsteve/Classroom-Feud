import React, { useState, useEffect } from 'react';
import type { Team } from '../types';

interface FaceOffMinigameProps {
  onDing: (team: Team) => void;
}

const INTERVAL_MS = 850; // How often the bell moves

const FaceOffMinigame: React.FC<FaceOffMinigameProps> = ({ onDing }) => {
  const [position, setPosition] = useState({ x: 50, y: 50 }); // position in percentage
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Show a "Ready?" message for a moment
    const readyTimer = setTimeout(() => {
        setIsReady(true);
    }, 2000);

    return () => clearTimeout(readyTimer);
  }, []);

  useEffect(() => {
    if (!isReady) return;

    const moveBell = () => {
      // Calculate random position within the viewport
      const newX = 10 + Math.random() * 80; // Stay away from the edges
      const newY = 20 + Math.random() * 60; // Stay in a reasonable vertical range
      setPosition({ x: newX, y: newY });
    };

    moveBell(); // Initial position
    const interval = setInterval(moveBell, INTERVAL_MS);

    return () => clearInterval(interval);
  }, [isReady]);

  const handleBellClick = () => {
    const team: Team = position.x < 50 ? 1 : 2;
    onDing(team);
  };

  return (
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-30 flex items-center justify-center text-white overflow-hidden"
    >
      <div className="absolute w-1/2 h-full left-0 bg-blue-900/30 border-r-2 border-yellow-400 border-dashed"></div>
      <div className="absolute w-1/2 h-full right-0 bg-red-900/30"></div>
      <div className="absolute top-10 text-center">
         <h2 className="font-title text-5xl md:text-7xl text-yellow-300 animate-pulse" style={{textShadow: '2px 2px 8px rgba(0,0,0,0.7)'}}>
            {isReady ? 'CLICK THE BELL!' : 'GET READY!'}
         </h2>
         <p className="text-xl md:text-2xl mt-4">First team to click the bell answers!</p>
      </div>

      {isReady && (
        <button
          onClick={handleBellClick}
          className="absolute w-24 h-24 md:w-32 md:h-32 bg-yellow-400 rounded-full shadow-2xl flex items-center justify-center
                     transform -translate-x-1/2 -translate-y-1/2 transition-all duration-200 ease-out
                     hover:scale-110 active:scale-95 border-4 border-yellow-200"
          style={{ 
            top: `${position.y}%`, 
            left: `${position.x}%`, 
            boxShadow: '0 0 25px 10px rgba(250, 204, 21, 0.7)'
          }}
        >
          <span className="font-title text-4xl md:text-5xl text-blue-900">DING!</span>
        </button>
      )}

      <div className="absolute bottom-10 w-full flex justify-around">
        <h3 className="font-title text-4xl text-blue-300">TEAM 1</h3>
        <h3 className="font-title text-4xl text-red-300">TEAM 2</h3>
      </div>
    </div>
  );
};

export default FaceOffMinigame;
