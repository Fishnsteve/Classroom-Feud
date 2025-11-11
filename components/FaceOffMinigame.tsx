import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { Team, FaceOffMinigameType } from '../types';
import { playDingSound, playCorrectSound, playWrongSound } from '../services/soundService';

interface FaceOffMinigameProps {
  onDing: (team: Team) => void;
  minigameType: FaceOffMinigameType;
  category: string;
  currentRound: number;
  onSkipCategory: () => void;
  canSkip: boolean;
}

interface MinigameComponentProps {
    onDing: (team: Team) => void;
    category: string;
    currentRound: number;
    onSkipCategory: () => void;
    canSkip: boolean;
}

// --- Teleporting Bell Component ---
const TeleportingBell: React.FC<MinigameComponentProps> = ({ onDing, category, currentRound, onSkipCategory, canSkip }) => {
  const [bells, setBells] = useState<{id: number, x: number, y: number}[]>([]);
  const [revealStep, setRevealStep] = useState<'waiting' | 'revealing' | 'active'>('waiting');
  
  const nextBellId = useRef(0);
  const duplicationTimeoutRef = useRef<number | null>(null);

  const calculateNewPosition = useCallback(() => {
    let newX: number;
    
    // 50% chance for the bell to be on the left (Team 1) or right (Team 2)
    if (Math.random() < 0.5) {
      // Team 1 side (10% to 45% from the left)
      newX = 10 + Math.random() * 35;
    } else {
      // Team 2 side (55% to 90% from the left)
      newX = 55 + Math.random() * 35;
    }
    
    const newY = 35 + Math.random() * 50;
    return { x: newX, y: newY };
  }, []);

  const createNewBell = useCallback(() => {
    nextBellId.current += 1;
    return {
      id: nextBellId.current,
      ...calculateNewPosition()
    };
  }, [calculateNewPosition]);

  useEffect(() => {
    const t1 = setTimeout(() => setRevealStep('revealing'), 2000);
    const t2 = setTimeout(() => {
        setRevealStep('active');
        setBells([createNewBell()]);
    }, 5000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [createNewBell]);

  useEffect(() => {
    if (revealStep !== 'active') return;

    const moveBells = () => {
      setBells(currentBells => currentBells.map(bell => ({
        ...bell,
        ...calculateNewPosition()
      })));
    };
    
    const interval = setInterval(moveBells, 650);
    return () => clearInterval(interval);
  }, [revealStep, calculateNewPosition]);
  
  useEffect(() => {
    if (revealStep !== 'active' || bells.length === 0) return;

    if (duplicationTimeoutRef.current) {
        clearTimeout(duplicationTimeoutRef.current);
    }
    
    const addBell = () => {
      setBells(prevBells => {
        if (prevBells.length >= 8) return prevBells; 
        return [...prevBells, createNewBell()];
      });
    };
    
    const delay = Math.max(1200, 5000 - bells.length * 500); 
    duplicationTimeoutRef.current = window.setTimeout(addBell, delay);

    return () => {
      if (duplicationTimeoutRef.current) {
        clearTimeout(duplicationTimeoutRef.current);
      }
    };
  }, [revealStep, bells.length, createNewBell]);


  const handleBellClick = (e: React.MouseEvent, xPosition: number) => {
    e.preventDefault();
    playDingSound();
    const team: Team = xPosition < 50 ? 1 : 2;
    onDing(team);
  };

  const renderTopText = () => {
    switch(revealStep) {
        case 'waiting':
            return <h2 className="font-title text-5xl md:text-7xl text-yellow-300" style={{textShadow: '2px 2px 8px rgba(0,0,0,0.7)'}}>GET READY!</h2>;
        case 'revealing':
            return (
                <div className="text-center animate-pulse">
                    <h3 className="font-title text-3xl md:text-4xl text-white opacity-80 mb-2">The Category Is...</h3>
                    <h2 className="font-title text-4xl md:text-6xl text-yellow-300 tracking-wide" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>{category}</h2>
                </div>
            );
        case 'active':
            return <h2 className="font-title text-5xl md:text-7xl text-yellow-300 animate-pulse" style={{textShadow: '2px 2px 8px rgba(0,0,0,0.7)'}}>CLICK THE BELL!</h2>;
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-30 flex items-center justify-center text-white overflow-hidden" onContextMenu={(e) => e.preventDefault()}>
      <div className="absolute w-1/2 h-full left-0 bg-blue-500/30 border-r-2 border-yellow-300 border-dashed"></div>
      <div className="absolute w-1/2 h-full right-0 bg-red-500/30"></div>
      <div className="absolute top-10 text-center p-4">
        {renderTopText()}
        {revealStep === 'active' && <p className="text-xl md:text-2xl mt-4">Click the bell on your team's side!</p>}
        {(revealStep === 'revealing' || revealStep === 'active') && canSkip && (
          <div className="mt-4">
            <button
              onClick={onSkipCategory}
              className="px-3 py-1 bg-black/30 text-gray-300 text-xs font-bold rounded-full hover:bg-black/50 hover:text-white transition-colors"
            >
              SKIP CATEGORY
            </button>
          </div>
        )}
      </div>
      {revealStep === 'active' && bells.map(bell => (
        <button
          key={bell.id}
          onMouseDown={(e) => handleBellClick(e, bell.x)}
          className="absolute w-28 h-28 md:w-36 md:h-36 bg-yellow-400 rounded-full shadow-2xl flex items-center justify-center transform -translate-x-1/2 -translate-y-1/2 transition-all duration-200 ease-out hover:scale-110 active:scale-95 border-8 border-yellow-200"
          style={{ top: `${bell.y}%`, left: `${bell.x}%`, boxShadow: '0 0 35px 15px rgba(250, 204, 21, 0.7)' }}
          aria-label="Ding button"
        >
          <span className="font-title text-4xl md:text-5xl text-sky-900" style={{ textShadow: '1px 1px 0px white' }}>DING!</span>
        </button>
      ))}
      <div className="absolute bottom-10 w-full flex justify-around">
        <h3 className="font-title text-4xl text-blue-300" style={{ textShadow: '2px 2px 2px rgba(0,0,0,0.5)' }}>TEAM 1</h3>
        <h3 className="font-title text-4xl text-red-300" style={{ textShadow: '2px 2px 2px rgba(0,0,0,0.5)' }}>TEAM 2</h3>
      </div>
    </div>
  );
};


// --- Classic FaceOff Component ---
const ClassicFaceOff: React.FC<MinigameComponentProps> = ({ onDing, category, onSkipCategory, canSkip }) => {
  const [revealStep, setRevealStep] = useState<'waiting' | 'revealing' | 'active'>('waiting');
  
  useEffect(() => {
    const t1 = setTimeout(() => setRevealStep('revealing'), 2000);
    const t2 = setTimeout(() => setRevealStep('active'), 5000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const renderTopText = () => {
    switch(revealStep) {
        case 'waiting':
            return <h2 className="font-title text-5xl md:text-7xl text-yellow-300" style={{textShadow: '2px 2px 8px rgba(0,0,0,0.7)'}}>GET READY!</h2>;
        case 'revealing':
             return (
                <div className="text-center animate-pulse">
                    <h3 className="font-title text-3xl md:text-4xl text-white opacity-80 mb-2">The Category Is...</h3>
                    <h2 className="font-title text-4xl md:text-6xl text-yellow-300 tracking-wide" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>{category}</h2>
                </div>
            );
        case 'active':
            return <h2 className="font-title text-5xl md:text-7xl text-yellow-300 animate-pulse" style={{textShadow: '2px 2px 8px rgba(0,0,0,0.7)'}}>Face-Off!</h2>;
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-30 flex flex-col items-center justify-center text-white overflow-hidden" onContextMenu={(e) => e.preventDefault()}>
      <div className="text-center mb-8 p-4">
        {renderTopText()}
        {revealStep === 'active' && <p className="text-xl md:text-2xl mt-4">First team to hit their buzzer answers!</p>}
        {(revealStep === 'revealing' || revealStep === 'active') && canSkip && (
          <div className="mt-4">
            <button
              onClick={onSkipCategory}
              className="px-3 py-1 bg-black/30 text-gray-300 text-xs font-bold rounded-full hover:bg-black/50 hover:text-white transition-colors"
            >
              SKIP CATEGORY
            </button>
          </div>
        )}
      </div>
      {revealStep === 'active' && (
        <div className="flex justify-around w-full max-w-4xl">
            <button onMouseDown={(e) => { e.preventDefault(); playDingSound(); onDing(1); }} className="px-8 py-4 bg-blue-600 text-white font-title text-4xl rounded-lg shadow-lg transform transition hover:scale-110 border-b-4 border-blue-800 active:border-b-0">
            Team 1
            </button>
            <button onMouseDown={(e) => { e.preventDefault(); playDingSound(); onDing(2); }} className="px-8 py-4 bg-red-600 text-white font-title text-4xl rounded-lg shadow-lg transform transition hover:scale-110 border-b-4 border-red-800 active:border-b-0">
            Team 2
            </button>
        </div>
      )}
    </div>
  );
};


// --- Quick Draw Component ---
const QuickDraw: React.FC<MinigameComponentProps> = ({ onDing, category, onSkipCategory, canSkip }) => {
  type Status = 'waiting' | 'revealing' | 'ready' | 'go' | 'finished';
  const [status, setStatus] = useState<Status>('waiting');
  const [message, setMessage] = useState('Wait for the DING!');
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const t1 = setTimeout(() => setStatus('revealing'), 1500);
    const t2 = setTimeout(() => {
        setStatus('ready');
        const randomDelay = 2000 + Math.random() * 3000;
        timeoutRef.current = window.setTimeout(() => {
          setStatus('go');
          setMessage('DING!');
          playDingSound();
        }, randomDelay);
    }, 4500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleClick = (e: React.MouseEvent, team: Team) => {
    e.preventDefault();
    if (status === 'finished') return;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    if (status === 'ready') {
      playWrongSound();
      const winner: Team = team === 1 ? 2 : 1;
      setMessage(`Team ${team} was too soon! Team ${winner} wins!`);
      setStatus('finished');
      setTimeout(() => onDing(winner), 2000);
    } else if (status === 'go') {
      playCorrectSound();
      setMessage(`Team ${team} wins!`);
      setStatus('finished');
      setTimeout(() => onDing(team), 2000);
    }
  };

  const renderTopText = () => {
    if(status === 'waiting') {
        return <h2 className="font-title text-5xl md:text-7xl text-yellow-300">QUICK DRAW!</h2>
    }
    if (status === 'revealing') {
        return (
            <div className="text-center animate-pulse">
                <h3 className="font-title text-3xl md:text-4xl text-white opacity-80 mb-2">The Category Is...</h3>
                <h2 className="font-title text-4xl md:text-6xl text-yellow-300 tracking-wide">{category}</h2>
            </div>
        );
    }
    return <h2 className={`font-title text-5xl md:text-8xl text-yellow-300 ${status === 'go' ? 'animate-pulse' : ''}`} style={{textShadow: '2px 2px 8px rgba(0,0,0,0.7)'}}>{message}</h2>
  }


  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-30 flex flex-col items-center justify-center text-white overflow-hidden" onContextMenu={(e) => e.preventDefault()}>
      <div className="text-center mb-8 p-4">
        {renderTopText()}
        <p className="text-xl md:text-2xl mt-4 h-8">
            {status === 'ready' ? "First to click AFTER the ding wins!" : " "}
        </p>
        {(status === 'revealing' || status === 'ready' || status === 'go') && canSkip && (
          <div className="mt-4">
            <button
              onClick={onSkipCategory}
              className="px-3 py-1 bg-black/30 text-gray-300 text-xs font-bold rounded-full hover:bg-black/50 hover:text-white transition-colors"
            >
              SKIP CATEGORY
            </button>
          </div>
        )}
      </div>
      {(status === 'ready' || status === 'go' || status === 'finished') && (
        <div className="flex justify-around w-full max-w-4xl">
            {/* FIX: The conditional render narrows the type of `status`, making checks for 'revealing' and 'waiting' redundant and causing a TS error. The button should only be disabled when finished. */}
            <button disabled={status === 'finished'} onMouseDown={(e) => handleClick(e, 1)} className="px-8 py-4 bg-blue-600 text-white font-title text-4xl rounded-lg shadow-lg transform transition hover:scale-110 border-b-4 border-blue-800 active:border-b-0 disabled:bg-gray-600 disabled:border-gray-800 disabled:scale-100">
            Team 1
            </button>
            {/* FIX: The conditional render narrows the type of `status`, making checks for 'revealing' and 'waiting' redundant and causing a TS error. The button should only be disabled when finished. */}
            <button disabled={status === 'finished'} onMouseDown={(e) => handleClick(e, 2)} className="px-8 py-4 bg-red-600 text-white font-title text-4xl rounded-lg shadow-lg transform transition hover:scale-110 border-b-4 border-red-800 active:border-b-0 disabled:bg-gray-600 disabled:border-gray-800 disabled:scale-100">
            Team 2
            </button>
        </div>
      )}
    </div>
  );
};

// --- Main Manager Component ---
const FaceOffMinigame: React.FC<FaceOffMinigameProps> = ({ onDing, minigameType, category, currentRound, onSkipCategory, canSkip }) => {
  switch (minigameType) {
    case 'QuickDraw':
      return <QuickDraw onDing={onDing} category={category} currentRound={currentRound} onSkipCategory={onSkipCategory} canSkip={canSkip} />;
    case 'TeleportingBell':
      return <TeleportingBell onDing={onDing} category={category} currentRound={currentRound} onSkipCategory={onSkipCategory} canSkip={canSkip} />;
    case 'Classic':
    default:
      return <ClassicFaceOff onDing={onDing} category={category} currentRound={currentRound} onSkipCategory={onSkipCategory} canSkip={canSkip} />;
  }
};

export default FaceOffMinigame;