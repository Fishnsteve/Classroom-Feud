
import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { RevealedAnswer, Team, FaceOffMinigameType } from '../types';
import { GamePhase } from '../types';
import AnswerSlot from './AnswerSlot';
import StrikeDisplay from './StrikeDisplay';
import { MAX_STRIKES } from '../constants';
import { shootStarsFromElement } from '../services/particleService';
import { playCorrectSound, playWrongSound, playDingSound } from '../services/soundService';
import FaceOffMinigame from './FaceOffMinigame';
import Timer from './Timer';

interface GameBoardProps {
  initialAnswers: RevealedAnswer[];
  onRoundEnd: (winner: Team, points: number) => void;
  category: string;
  team1Name: string;
  team2Name: string;
  team1Score: number;
  team2Score: number;
  onSkipCategory: () => void;
  canSkip: boolean;
  minigame: FaceOffMinigameType;
  currentRound: number;
  timerDuration: number;
}

const GameBoard: React.FC<GameBoardProps> = ({ 
  initialAnswers, 
  onRoundEnd, 
  category, 
  team1Name,
  team2Name,
  team1Score, 
  team2Score,
  onSkipCategory,
  canSkip,
  minigame,
  currentRound,
  timerDuration,
}) => {
  const [answers, setAnswers] = useState<RevealedAnswer[]>(initialAnswers);
  const [roundPoints, setRoundPoints] = useState(0);
  const [guess, setGuess] = useState('');
  const [error, setError] = useState<string | null>(null);

  const [phase, setPhase] = useState<GamePhase>(GamePhase.FaceOff);
  const [strikes, setStrikes] = useState(0);
  const [activeTeam, setActiveTeam] = useState<Team | null>(null);
  
  const [faceOffDinger, setFaceOffDinger] = useState<Team | null>(null);
  const [faceOffAnswers, setFaceOffAnswers] = useState<(RevealedAnswer | null)[]>([null, null]);
  const [faceOffTurn, setFaceOffTurn] = useState<Team | null>(null);

  const [choosingTeam, setChoosingTeam] = useState<Team | null>(null);
  const [roundWinner, setRoundWinner] = useState<Team | null>(null);
  const [timerKey, setTimerKey] = useState(0);

  const answerRefs = useRef<(HTMLDivElement | null)[]>([]);

  const resetTimer = useCallback(() => setTimerKey(p => p + 1), []);

  /**
   * Local matching logic: Checks guess against canonical text and accepted synonyms.
   */
  const findMatchLocally = (userGuess: string, unrevealed: RevealedAnswer[]) => {
    const g = userGuess.toLowerCase().trim();
    // 1. Exact match or accepted synonym match
    const match = unrevealed.find(a => 
      a.text.toLowerCase() === g || 
      a.accepted?.some(syn => syn.toLowerCase() === g)
    );
    return match || null;
  };

  const revealAnswer = useCallback((text: string, addPoints = true): RevealedAnswer | null => {
    const matchIndex = answers.findIndex(ans => ans.text.toLowerCase() === text.toLowerCase() && !ans.revealed);
    if (matchIndex === -1) return null;
    
    const answerToReveal = answers[matchIndex];
    setAnswers(currentAnswers => {
      const newAnswers = [...currentAnswers];
      newAnswers[matchIndex] = { ...newAnswers[matchIndex], revealed: true };
      return newAnswers;
    });

    if (addPoints) setRoundPoints(prev => prev + answerToReveal.points);
    
    setTimeout(() => {
      const element = answerRefs.current[matchIndex];
      if (element) { shootStarsFromElement(element); playCorrectSound(); }
    }, 100);
    
    return answerToReveal;
  }, [answers]);

  const handlePlayOrPass = useCallback((decision: 'play' | 'pass') => {
    setActiveTeam(decision === 'play' ? choosingTeam : (choosingTeam === 1 ? 2 : 1));
    setPhase(GamePhase.MainRound);
    resetTimer();
  }, [choosingTeam, resetTimer]);

  const handleDing = useCallback((team: Team) => {
    if (!faceOffDinger) {
      setFaceOffDinger(team);
      setFaceOffTurn(team);
      playDingSound();
    }
  }, [faceOffDinger]);

  const handleFaceOffSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guess.trim() || !faceOffTurn) return;

    const currentGuess = guess;
    setGuess('');
    
    const unrevealedAnswers = answers.filter(a => !a.revealed);
    const alreadyRevealed = answers.filter(a => a.revealed).map(a => a.text);

    if (alreadyRevealed.some(ans => ans.toLowerCase() === currentGuess.toLowerCase())) {
        setError("Already revealed.");
        return;
    }

    const match = findMatchLocally(currentGuess, unrevealedAnswers);

    let revealed: RevealedAnswer | null = null;
    if (match) {
        revealed = revealAnswer(match.text, true);
    } else {
        playWrongSound();
    }

    if (faceOffTurn === faceOffDinger) {
        setFaceOffAnswers(prev => {
          const next = [...prev];
          next[faceOffTurn! - 1] = revealed;
          return next;
        });
        setFaceOffTurn(faceOffDinger === 1 ? 2 : 1);
    } else {
        const finalAnswers = [...faceOffAnswers];
        finalAnswers[faceOffTurn - 1] = revealed;
        const p1 = (faceOffDinger === 1 ? finalAnswers[0] : finalAnswers[1])?.points ?? -1;
        const p2 = (faceOffDinger === 1 ? finalAnswers[1] : finalAnswers[0])?.points ?? -1;
        
        if (p1 >= p2 && p1 > -1) setChoosingTeam(faceOffDinger);
        else if (p2 > p1) setChoosingTeam(faceOffDinger === 1 ? 2 : 1);
        else setChoosingTeam(faceOffDinger); // Tie-break to first buzzer
        setPhase(GamePhase.PlayOrPass);
    }
  };

  const startEndRoundSequence = useCallback((winningTeam: Team) => {
    setPhase(GamePhase.RoundReveal);
    setRoundWinner(winningTeam);
  }, []);

  const handleStrike = useCallback(() => {
    playWrongSound();
    if (phase === GamePhase.MainRound) {
        const next = strikes + 1;
        setStrikes(next);
        if (next >= MAX_STRIKES) {
            setTimeout(() => {
                setStrikes(0);
                setPhase(GamePhase.StealAttempt);
                setActiveTeam(activeTeam === 1 ? 2 : 1);
                resetTimer();
            }, 800);
        } else resetTimer();
    } else if (phase === GamePhase.StealAttempt) {
        setStrikes(1);
        setTimeout(() => startEndRoundSequence(activeTeam === 1 ? 2 : 1), 1000);
    }
  }, [strikes, phase, activeTeam, resetTimer, startEndRoundSequence]);

  const handleGuessSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guess.trim() || !activeTeam) return;

    const currentGuess = guess.trim();
    setGuess('');

    const unrevealedAnswers = answers.filter(a => !a.revealed);
    const match = findMatchLocally(currentGuess, unrevealedAnswers);

    if (match) {
      revealAnswer(match.text);
      if (phase === GamePhase.StealAttempt) {
        startEndRoundSequence(activeTeam);
      } else if (answers.filter(a => !a.revealed).length <= 1) {
        startEndRoundSequence(activeTeam);
      } else resetTimer();
    } else {
      setError(`"${currentGuess}" is not on the board.`);
      handleStrike();
    }
  };

  return (
    <div className="w-full h-full flex flex-col gap-6 max-w-7xl relative">
      {/* Professional TV Header */}
      <div className="flex justify-between items-center gap-4">
        <div className={`glass-card flex-1 p-6 rounded-3xl border-l-4 transition-all duration-500 ${activeTeam === 1 ? 'border-cyan-500 shadow-[0_0_30px_rgba(6,182,212,0.3)]' : 'border-transparent opacity-60'}`}>
          <span className="text-slate-500 font-semibold block text-xs uppercase tracking-widest mb-1">{team1Name}</span>
          <span className="font-title text-5xl text-white">{team1Score}</span>
        </div>
        
        <div className="glass-card flex-[2] p-8 rounded-3xl text-center border-y border-white/10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50"></div>
          <span className="text-cyan-400 font-title tracking-widest text-sm block mb-1">Round {currentRound} Category</span>
          <h1 className="font-title text-3xl text-white truncate max-w-md mx-auto">{category}</h1>
          <div className="mt-4 inline-block px-4 py-1 bg-white/5 rounded-full border border-white/10">
            <span className="font-title text-xl text-yellow-400">{roundPoints}</span>
            <span className="text-white/40 text-[10px] ml-2 font-bold uppercase">Pot</span>
          </div>
        </div>

        <div className={`glass-card flex-1 p-6 rounded-3xl border-r-4 text-right transition-all duration-500 ${activeTeam === 2 ? 'border-pink-500 shadow-[0_0_30px_rgba(236,72,153,0.3)]' : 'border-transparent opacity-60'}`}>
          <span className="text-slate-500 font-semibold block text-xs uppercase tracking-widest mb-1">{team2Name}</span>
          <span className="font-title text-5xl text-white">{team2Score}</span>
        </div>
      </div>

      {/* Main Board Area */}
      <div className="flex-grow flex flex-col lg:flex-row gap-6">
        <div className="flex-[3] glass-card p-6 rounded-[2rem] grid grid-cols-1 md:grid-cols-2 gap-4 border border-white/5 shadow-inner">
          {answers.map((ans, i) => (
            <AnswerSlot key={i} answer={ans} rank={i + 1} ref={el => { answerRefs.current[i] = el; }} />
          ))}
        </div>

        <div className="flex-[1.5] flex flex-col gap-6">
          <div className="glass-card flex-grow p-8 rounded-[2rem] flex flex-col items-center justify-center text-center relative overflow-hidden">
            <div className="relative z-10 w-full">
              {phase === GamePhase.FaceOff && !faceOffTurn && (
                <div className="animate-pulse">
                  <h2 className="font-title text-3xl text-yellow-400 mb-2">Face-Off</h2>
                  <p className="text-slate-400">Waiting for buzzer...</p>
                </div>
              )}

              {(phase === GamePhase.FaceOff && faceOffTurn) && (
                <form onSubmit={handleFaceOffSubmit} className="space-y-4">
                  <h3 className="font-title text-white">Team {faceOffTurn} Guess</h3>
                  <input autoFocus value={guess} onChange={e => setGuess(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-4 text-2xl text-white text-center focus:border-cyan-500 focus:outline-none" />
                  <button type="submit" className="w-full bg-cyan-600 text-white font-title py-4 rounded-xl">Submit</button>
                </form>
              )}

              {phase === GamePhase.PlayOrPass && (
                <div className="space-y-6">
                   <h3 className="font-title text-white text-xl">Team {choosingTeam} Won!</h3>
                   <div className="grid grid-cols-1 gap-3">
                     <button onClick={() => handlePlayOrPass('play')} className="bg-cyan-600 text-white font-title py-4 rounded-xl hover:bg-cyan-500 transition-all">Play Board</button>
                     <button onClick={() => handlePlayOrPass('pass')} className="bg-slate-700 text-white font-title py-4 rounded-xl hover:bg-slate-600 transition-all">Pass Board</button>
                   </div>
                </div>
              )}

              {(phase === GamePhase.MainRound || phase === GamePhase.StealAttempt) && (
                <div className="space-y-4">
                  <Timer key={timerKey} duration={timerDuration} onTimeUp={handleStrike} />
                  <form onSubmit={handleGuessSubmit} className="space-y-4">
                    <input autoFocus value={guess} onChange={e => setGuess(e.target.value)} placeholder="Type guess..." className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-4 text-2xl text-white text-center focus:border-cyan-500 focus:outline-none" />
                    <button type="submit" className="w-full bg-cyan-600 text-white font-title py-4 rounded-xl">Guess</button>
                  </form>
                  {error && <p className="text-red-400 text-sm font-semibold">{error}</p>}
                </div>
              )}

              {phase === GamePhase.RoundReveal && (
                <div className="space-y-4">
                  <h3 className="font-title text-white text-2xl">Reveal Board</h3>
                  <button onClick={() => {
                    const next = answers.find(a => !a.revealed);
                    if (next) revealAnswer(next.text, false);
                    else setPhase(GamePhase.RoundOver);
                  }} className="w-full bg-yellow-500 text-slate-900 font-title py-4 rounded-xl">Show Next</button>
                </div>
              )}

              {phase === GamePhase.RoundOver && (
                 <button onClick={() => onRoundEnd(roundWinner!, roundPoints)} className="w-full bg-cyan-600 text-white font-title py-5 rounded-2xl">Continue</button>
              )}
            </div>
          </div>

          <div className="glass-card p-6 rounded-[2rem] flex items-center justify-center">
            <StrikeDisplay strikes={strikes} totalStrikes={phase === GamePhase.StealAttempt ? 1 : MAX_STRIKES} />
          </div>
        </div>
      </div>

      {phase === GamePhase.FaceOff && !faceOffTurn && (
        <FaceOffMinigame onDing={handleDing} minigameType={minigame} category={category} currentRound={currentRound} onSkipCategory={onSkipCategory} canSkip={canSkip} />
      )}
    </div>
  );
};

export default GameBoard;
