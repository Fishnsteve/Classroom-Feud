

import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { RevealedAnswer, Team, FaceOffMinigameType } from '../types';
import { GamePhase } from '../types';
import AnswerSlot from './AnswerSlot';
import StrikeDisplay from './StrikeDisplay';
import { MAX_STRIKES } from '../constants';
import { checkAnswer } from '../services/geminiService';
import { shootStarsFromElement } from '../services/particleService';
import { playCorrectSound, playWrongSound } from '../services/soundService';
import FaceOffMinigame from './FaceOffMinigame';

interface GameBoardProps {
  initialAnswers: RevealedAnswer[];
  onRoundEnd: (winner: Team, points: number) => void;
  category: string;
  team1Score: number;
  team2Score: number;
  onSkipCategory: () => void;
  canSkip: boolean;
  minigame: FaceOffMinigameType;
  currentRound: number;
}

const GameBoard: React.FC<GameBoardProps> = ({ 
  initialAnswers, 
  onRoundEnd, 
  category, 
  team1Score, 
  team2Score,
  onSkipCategory,
  canSkip,
  minigame,
  currentRound,
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

  const answerRefs = useRef<(HTMLDivElement | null)[]>([]);

  // --- EFFECTS ---
  useEffect(() => {
    answerRefs.current = answerRefs.current.slice(0, initialAnswers.length);
  }, [initialAnswers]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [error]);
  
  // --- CORE GAME LOGIC ---

  const revealAnswer = useCallback((text: string, addPoints = true): RevealedAnswer | null => {
    // Find the answer from the current state to return it synchronously.
    const matchIndex = answers.findIndex(ans => ans.text.toLowerCase() === text.toLowerCase() && !ans.revealed);

    if (matchIndex === -1) {
      return null;
    }
    
    const answerToReveal = answers[matchIndex];
    
    // Schedule state updates.
    setAnswers(currentAnswers => {
      const newAnswers = [...currentAnswers];
      newAnswers[matchIndex] = { ...newAnswers[matchIndex], revealed: true };
      return newAnswers;
    });

    if (addPoints) {
      setRoundPoints(prev => prev + answerToReveal.points);
    }
    
    // Trigger side effects.
    setTimeout(() => {
      const element = answerRefs.current[matchIndex];
      if (element) {
        shootStarsFromElement(element);
        playCorrectSound();
      }
    }, 100);
    
    // Return the found answer object immediately.
    return answerToReveal;
  }, [answers]);

  const determineFaceOffWinner = useCallback((ans1: RevealedAnswer | null, ans2: RevealedAnswer | null) => {
    const points1 = ans1?.points ?? -1;
    const points2 = ans2?.points ?? -1;
    
    // If one team answers and the other doesn't, the one who answered wins.
    if (points1 > -1 && points2 === -1) setChoosingTeam(faceOffDinger);
    else if (points1 === -1 && points2 > -1) setChoosingTeam(faceOffDinger === 1 ? 2 : 1);
    // If neither team answers, the team that buzzed in first wins by default.
    else if (points1 === -1 && points2 === -1) setChoosingTeam(faceOffDinger);
    // If both answer, the higher score wins. Tie goes to the first buzzer.
    else if (points1 > -1 && points2 > -1) {
        const team1IsDinger = faceOffDinger === 1;
        const dingerPoints = team1IsDinger ? points1 : points2;
        const otherPoints = team1IsDinger ? points2 : points1;
        
        if (dingerPoints >= otherPoints) {
            setChoosingTeam(faceOffDinger);
        } else {
            setChoosingTeam(faceOffDinger === 1 ? 2 : 1);
        }
    }
    setPhase(GamePhase.PlayOrPass);
}, [faceOffDinger]);

  const handleFaceOffSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!guess.trim() || !faceOffTurn) return;

    const currentGuess = guess;
    setGuess('');
    
    const unrevealedAnswers = answers.filter(a => !a.revealed);
    const alreadyRevealed = answers.filter(a => a.revealed).map(a => a.text);

    if (alreadyRevealed.some(ans => ans.toLowerCase() === currentGuess.toLowerCase())) {
        setError("That answer is already on the board!");
        return;
    }

    const result = checkAnswer(currentGuess, unrevealedAnswers);
    let revealedAnswer: RevealedAnswer | null = null;
    if (result.match && result.text) {
      revealedAnswer = revealAnswer(result.text, true);
    } else {
      playWrongSound();
    }

    const isFirstGuess = faceOffTurn === faceOffDinger;

    if (isFirstGuess) {
        // First guesser: just store their answer and switch turns.
        const newAnswers = [...faceOffAnswers];
        newAnswers[faceOffTurn - 1] = revealedAnswer;
        setFaceOffAnswers(newAnswers);
        setFaceOffTurn(faceOffDinger === 1 ? 2 : 1);
    } else {
        // Second guesser: update their answer and determine winner.
        const finalAnswers = [...faceOffAnswers];
        finalAnswers[faceOffTurn - 1] = revealedAnswer;
        setFaceOffAnswers(finalAnswers);

        const team1Answer = finalAnswers[0];
        const team2Answer = finalAnswers[1];
        determineFaceOffWinner(team1Answer, team2Answer);
    }
  }, [guess, answers, faceOffTurn, faceOffDinger, faceOffAnswers, revealAnswer, determineFaceOffWinner]);

  const handleStrike = useCallback(() => {
    playWrongSound();
    const newStrikes = strikes + 1;
    setStrikes(newStrikes);
    if (phase === GamePhase.MainRound && newStrikes >= MAX_STRIKES) {
      setTimeout(() => {
        setStrikes(0); // Reset strikes for the steal attempt
        setPhase(GamePhase.StealAttempt);
        setActiveTeam(activeTeam === 1 ? 2 : 1);
      }, 500);
    }
  }, [strikes, phase, activeTeam]);

  const startEndRoundSequence = useCallback((winningTeam: Team) => {
    setPhase(GamePhase.RoundReveal);
    setRoundWinner(winningTeam);
  }, []);

  const handleGuessSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!guess.trim() || !activeTeam) return;

    const currentGuess = guess;
    setGuess('');

    const unrevealedAnswers = answers.filter(a => !a.revealed);
    const alreadyRevealed = answers.filter(a => a.revealed).map(a => a.text);

    if (alreadyRevealed.some(ans => ans.toLowerCase() === currentGuess.toLowerCase())) {
        setError("That answer is already on the board!");
        setGuess(currentGuess);
        return;
    }

    const result = checkAnswer(currentGuess, unrevealedAnswers);

    if (result.match && result.text) {
      revealAnswer(result.text);
      const isBoardCleared = answers.filter(a => !a.revealed).length <= 1;

      if (phase === GamePhase.StealAttempt) {
        // Successful steal, go to reveal sequence
        startEndRoundSequence(activeTeam!);
        return;
      }
      
      if (isBoardCleared) {
        startEndRoundSequence(activeTeam!);
      }
    } else {
      setError(`"${currentGuess}" is not on the board!`);
      if (phase === GamePhase.MainRound) {
        handleStrike();
      } else if (phase === GamePhase.StealAttempt) {
        // Failed steal, show the strike, then the other team gets the points.
        setStrikes(1);
        setTimeout(() => {
            startEndRoundSequence(activeTeam === 1 ? 2 : 1);
        }, 800);
      }
    }
  }, [guess, answers, phase, activeTeam, revealAnswer, handleStrike, startEndRoundSequence]);

  const handlePlayOrPass = (decision: 'play' | 'pass') => {
    setActiveTeam(decision === 'play' ? choosingTeam : (choosingTeam === 1 ? 2 : 1));
    setPhase(GamePhase.MainRound);
  };

  const handleDing = (team: Team) => {
    if (!faceOffDinger) {
      setFaceOffDinger(team);
      setFaceOffTurn(team);
    }
  };
  
  const handleRevealNextAnswer = () => {
    const unrevealed = answers
      .filter(a => !a.revealed)
      .sort((a, b) => b.points - a.points); // Reveal from top to bottom

    if (unrevealed.length > 0) {
        revealAnswer(unrevealed[0].text, false); 
    }

    if (unrevealed.length <= 1) {
        setTimeout(() => {
            setPhase(GamePhase.RoundOver);
        }, 800);
    }
  };

  const renderPhaseContent = () => {
    switch(phase) {
      case GamePhase.FaceOff:
        return (
            <div className="w-full flex flex-col items-center gap-4">
                <h2 className="font-title text-4xl text-center text-white mb-2">Team {faceOffTurn}'s Guess:</h2>
                <form onSubmit={handleFaceOffSubmit} className="w-full max-w-lg flex flex-col items-center gap-4">
                    <input
                      type="text"
                      value={guess}
                      onChange={(e) => setGuess(e.target.value)}
                      className="w-full p-4 text-2xl text-center rounded-lg bg-white/90 text-gray-900 shadow-lg focus:outline-none focus:ring-4 focus:ring-yellow-400"
                      placeholder="Enter your guess..."
                      autoFocus
                    />
                    <button type="submit" className="px-8 py-3 text-2xl font-bold text-white bg-green-600 rounded-lg hover:bg-green-700 transition-transform transform hover:scale-105">
                      Submit
                    </button>
                </form>
            </div>
        );

      case GamePhase.PlayOrPass:
        return (
            <div className="text-center p-4">
                <h2 className="font-title text-4xl text-white mb-4">Team {choosingTeam} wins the face-off!</h2>
                <p className="text-xl text-yellow-300 mb-6">Will you play the round or pass?</p>
                <div className="flex justify-center gap-4">
                    <button onClick={() => handlePlayOrPass('play')} className="px-10 py-4 font-title text-3xl text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-transform transform hover:scale-105 shadow-lg">
                        Play!
                    </button>
                    <button onClick={() => handlePlayOrPass('pass')} className="px-10 py-4 font-title text-3xl text-white bg-orange-600 rounded-lg hover:bg-orange-700 transition-transform transform hover:scale-105 shadow-lg">
                        Pass!
                    </button>
                </div>
            </div>
        );

      case GamePhase.MainRound:
      case GamePhase.StealAttempt:
        return (
          <div className="w-full flex flex-col items-center gap-4">
            <h2 className="font-title text-4xl text-center text-white mb-2">
              {phase === GamePhase.StealAttempt ? `Team ${activeTeam}, For The Steal!` : `Team ${activeTeam}'s Turn`}
            </h2>
            <form onSubmit={handleGuessSubmit} className="w-full max-w-lg flex flex-col items-center gap-3">
              <input
                type="text"
                value={guess}
                onChange={(e) => setGuess(e.target.value)}
                className="w-full p-4 text-2xl text-center rounded-lg bg-white/90 text-gray-900 shadow-lg focus:outline-none focus:ring-4 focus:ring-yellow-400"
                placeholder="Enter your guess..."
                autoFocus
                disabled={!activeTeam}
              />
              <div className="flex gap-3">
                <button type="submit" disabled={!activeTeam || !guess.trim()} className="px-8 py-3 text-xl font-bold text-white bg-green-600 rounded-lg hover:bg-green-700 transition-transform transform hover:scale-105 disabled:bg-gray-500 disabled:scale-100">
                  Submit
                </button>
                {phase === GamePhase.MainRound && (
                    <button type="button" onClick={handleStrike} disabled={!activeTeam} className="px-8 py-3 text-xl font-bold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-transform transform hover:scale-105 disabled:bg-gray-500 disabled:scale-100">
                        Wrong / Pass
                    </button>
                )}
              </div>
            </form>
          </div>
        );
      
      case GamePhase.RoundReveal:
          const unrevealedCount = answers.filter(a => !a.revealed).length;
          return (
             <div className="text-center">
                <h2 className="font-title text-4xl text-white mb-6">Reveal the board!</h2>
                <button 
                    onClick={handleRevealNextAnswer} 
                    className="bg-yellow-500 text-blue-900 font-bold py-3 px-6 rounded-lg text-xl hover:bg-yellow-400 transition transform hover:scale-105"
                >
                    Reveal Next Answer ({unrevealedCount} left)
                </button>
            </div>
          );

      case GamePhase.RoundOver:
        return (
            <div className="text-center">
                <h2 className="font-title text-4xl text-white mb-6">Round Complete!</h2>
                <button 
                    onClick={() => onRoundEnd(roundWinner!, roundPoints)} 
                    className="bg-lime-500 text-white text-3xl font-title py-4 px-8 rounded-xl shadow-lg hover:bg-lime-600 transition transform hover:scale-105 border-b-4 border-lime-700 active:border-b-0"
                >
                    Continue to Scores
                </button>
            </div>
        );
      
      default:
        return null;
    }
  }

  return (
    <div className="w-full h-full max-w-7xl mx-auto flex flex-col items-center p-2 sm:p-4 relative">
      
      {/* Score Header */}
      <div className="w-full flex justify-between items-center bg-sky-800/60 p-2 sm:p-4 rounded-xl shadow-lg border-2 border-yellow-400/50 mb-4 backdrop-blur-sm">
        <div className={`text-center px-2 sm:px-4 py-1 rounded-lg transition-all duration-300 ${activeTeam === 1 || choosingTeam === 1 ? 'bg-blue-500 shadow-lg scale-105' : 'bg-black/20'}`}>
          <h3 className="font-title text-xl md:text-3xl text-blue-300">Team 1</h3>
          <p className="font-title text-4xl md:text-6xl text-white">{team1Score}</p>
        </div>
        <div className="text-center px-2 sm:px-4 flex-grow">
            <h2 className="font-title text-2xl md:text-4xl text-yellow-300 hidden sm:block truncate">{category}</h2>
            <p className="font-title text-5xl md:text-7xl text-white">{roundPoints}</p>
            <p className="text-lg font-semibold text-yellow-300 hidden sm:block">Round Points</p>
        </div>
        <div className={`text-center px-2 sm:px-4 py-1 rounded-lg transition-all duration-300 ${activeTeam === 2 || choosingTeam === 2 ? 'bg-red-500 shadow-lg scale-105' : 'bg-black/20'}`}>
          <h3 className="font-title text-xl md:text-3xl text-red-300">Team 2</h3>
          <p className="font-title text-4xl md:text-6xl text-white">{team2Score}</p>
        </div>
      </div>
      
      {/* Main Area */}
      <div className="w-full flex flex-col lg:flex-row gap-4 flex-grow">
          {/* Answer Board */}
          <div className="w-full lg:w-3/5 grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3 p-2 sm:p-4 bg-sky-800/60 rounded-xl shadow-lg backdrop-blur-sm">
            {answers.map((answer, index) => (
              <AnswerSlot 
                key={`${answer.text}-${index}`} 
                answer={answer} 
                rank={index + 1}
                // FIX: Ensure the ref callback doesn't return a value. The assignment expression
                // implicitly returns the assigned element, which is not allowed for ref callbacks.
                ref={el => { answerRefs.current[index] = el; }}
              />
            ))}
          </div>
          
          {/* Game Controls & Status */}
          <div className="w-full lg:w-2/5 flex flex-col items-center justify-center bg-sky-800/60 p-4 rounded-xl shadow-lg min-h-[250px] sm:min-h-[300px] backdrop-blur-sm">
            {error && <p className="text-red-400 text-xl font-semibold mb-4 text-center">{error}</p>}
            { (phase === GamePhase.MainRound || phase === GamePhase.StealAttempt) && <StrikeDisplay strikes={strikes} totalStrikes={phase === GamePhase.StealAttempt ? 1 : MAX_STRIKES}/> }
            <div className="mt-4 w-full flex-grow flex items-center justify-center">
                {renderPhaseContent()}
            </div>
          </div>
      </div>
       {/* Minigame controller for face-off */}
       {phase === GamePhase.FaceOff && !faceOffTurn && (
         <FaceOffMinigame 
            minigameType={minigame} 
            onDing={handleDing}
            category={category}
            currentRound={currentRound}
            onSkipCategory={onSkipCategory}
            canSkip={canSkip}
        />
       )}
    </div>
  );
};

export default GameBoard;