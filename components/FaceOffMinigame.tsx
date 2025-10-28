import React, { useState, useEffect, useRef } from 'react';
import type { Team, FaceOffMinigameType } from '../types';
import { playDingSound } from '../services/soundService';

interface FaceOffMinigameProps {
  onDing: (team: Team) => void;
  minigameType: FaceOffMinigameType;
}

// --- Classic FaceOff Component ---
const ClassicFaceOff: React.FC<{ onDing: (team: Team) => void }> = ({ onDing }) => {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-30 flex flex-col items-center justify-center text-white overflow-hidden">
      <div className="text-center mb-8">
        <h2 className="font-title text-5xl md:text-7xl text-yellow-300 animate-pulse" style={{textShadow: '2px 2px 8px rgba(0,0,0,0.7)'}}>
          Face-Off!
        </h2>
        <p className="text-xl md:text-2xl mt-4">First team to hit their buzzer answers!</p>
      </div>
      <div className="flex justify-around w-full max-w-4xl">
        <button onClick={() => onDing(1)} className="px-8 py-4 bg-blue-600 text-white font-title text-4xl rounded-lg shadow-lg transform transition hover:scale-110 border-b-4 border-blue-800 active:border-b-0">
          Team 1
        </button>
        <button onClick={() => onDing(2)} className="px-8 py-4 bg-red-600 text-white font-title text-4xl rounded-lg shadow-lg transform transition hover:scale-110 border-b-4 border-red-800 active:border-b-0">
          Team 2
        </button>
      </div>
    </div>
  );
};

// --- Teleporting Bell Component ---
const TeleportingBell: React.FC<{ onDing: (team: Team) => void }> = ({ onDing }) => {
  const [position, setPosition] = useState({ x: 50, y: 50 }); // position in percentage
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const readyTimer = setTimeout(() => setIsReady(true), 2000);
    return () => clearTimeout(readyTimer);
  }, []);

  useEffect(() => {
    if (!isReady) return;
    const moveBell = () => {
      const newX = 10 + Math.random() * 80;
      const newY = 20 + Math.random() * 60;
      setPosition({ x: newX, y: newY });
    };
    moveBell();
    const interval = setInterval(moveBell, 950);
    return () => clearInterval(interval);
  }, [isReady]);

  const handleBellClick = () => {
    const team: Team = position.x < 50 ? 1 : 2;
    onDing(team);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-30 flex items-center justify-center text-white overflow-hidden">
      <div className="absolute w-1/2 h-full left-0 bg-blue-500/30 border-r-2 border-yellow-300 border-dashed"></div>
      <div className="absolute w-1/2 h-full right-0 bg-red-500/30"></div>
      <div className="absolute top-10 text-center">
        <h2 className="font-title text-5xl md:text-7xl text-yellow-300 animate-pulse" style={{textShadow: '2px 2px 8px rgba(0,0,0,0.7)'}}>
          {isReady ? 'CLICK THE BELL!' : 'GET READY!'}
        </h2>
        <p className="text-xl md:text-2xl mt-4">Click the bell on your team's side!</p>
      </div>
      {isReady && (
        <button
          onClick={handleBellClick}
          className="absolute w-28 h-28 md:w-36 md:h-36 bg-yellow-400 rounded-full shadow-2xl flex items-center justify-center transform -translate-x-1/2 -translate-y-1/2 transition-all duration-200 ease-out hover:scale-110 active:scale-95 border-8 border-yellow-200"
          style={{ top: `${position.y}%`, left: `${position.x}%`, boxShadow: '0 0 35px 15px rgba(250, 204, 21, 0.7)' }}
        >
          <span className="font-title text-4xl md:text-5xl text-sky-900" style={{ textShadow: '1px 1px 0px white' }}>DING!</span>
        </button>
      )}
      <div className="absolute bottom-10 w-full flex justify-around">
        <h3 className="font-title text-4xl text-blue-300" style={{ textShadow: '2px 2px 2px rgba(0,0,0,0.5)' }}>TEAM 1</h3>
        <h3 className="font-title text-4xl text-red-300" style={{ textShadow: '2px 2px 2px rgba(0,0,0,0.5)' }}>TEAM 2</h3>
      </div>
    </div>
  );
};

// --- Quick Draw Component ---
const QuickDraw: React.FC<{ onDing: (team: Team) => void }> = ({ onDing }) => {
  type Status = 'waiting' | 'ready' | 'go' | 'finished';
  const [status, setStatus] = useState<Status>('waiting');
  const [message, setMessage] = useState('Wait for the DING!');
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const randomDelay = 2000 + Math.random() * 3000;
    timeoutRef.current = window.setTimeout(() => {
      setStatus('go');
      setMessage('DING!');
      playDingSound();
    }, randomDelay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleClick = (team: Team) => {
    if (status === 'finished') return;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    if (status === 'waiting') {
      const winner: Team = team === 1 ? 2 : 1;
      setMessage(`Team ${team} was too soon! Team ${winner} wins!`);
      setStatus('finished');
      setTimeout(() => onDing(winner), 2000);
    } else if (status === 'go') {
      setMessage(`Team ${team} wins!`);
      setStatus('finished');
      setTimeout(() => onDing(team), 2000);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-30 flex flex-col items-center justify-center text-white overflow-hidden">
      <div className="text-center mb-8">
        <h2 className={`font-title text-5xl md:text-8xl text-yellow-300 ${status === 'go' ? 'animate-pulse' : ''}`} style={{textShadow: '2px 2px 8px rgba(0,0,0,0.7)'}}>
          {message}
        </h2>
        <p className="text-xl md:text-2xl mt-4">
            {status !== 'finished' ? "First to click AFTER the ding wins!" : " "}
        </p>
      </div>
      <div className="flex justify-around w-full max-w-4xl">
        <button disabled={status === 'finished'} onClick={() => handleClick(1)} className="px-8 py-4 bg-blue-600 text-white font-title text-4xl rounded-lg shadow-lg transform transition hover:scale-110 border-b-4 border-blue-800 active:border-b-0 disabled:bg-gray-600 disabled:border-gray-800 disabled:scale-100">
          Team 1
        </button>
        <button disabled={status === 'finished'} onClick={() => handleClick(2)} className="px-8 py-4 bg-red-600 text-white font-title text-4xl rounded-lg shadow-lg transform transition hover:scale-110 border-b-4 border-red-800 active:border-b-0 disabled:bg-gray-600 disabled:border-gray-800 disabled:scale-100">
          Team 2
        </button>
      </div>
    </div>
  );
};

// --- Main Manager Component ---
const FaceOffMinigame: React.FC<FaceOffMinigameProps> = ({ onDing, minigameType }) => {
  switch (minigameType) {
    case 'QuickDraw':
      return <QuickDraw onDing={onDing} />;
    case 'TeleportingBell':
      return <TeleportingBell onDing={onDing} />;
    case 'Classic':
    default:
      return <ClassicFaceOff onDing={onDing} />;
  }
};

export default FaceOffMinigame;