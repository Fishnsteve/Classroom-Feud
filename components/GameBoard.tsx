import React, { useState, useEffect, useCallback } from 'react';
import type { RevealedAnswer, Team } from '../types';
import { GamePhase } from '../types';
import AnswerSlot from './AnswerSlot';
import StrikeDisplay from './StrikeDisplay';
import { MAX_STRIKES } from '../constants';
import { checkAnswer } from '../services/geminiService';
import Loader from './Loader';
import FaceOffMinigame from './FaceOffMinigame';

interface GameBoardProps {
  initialAnswers: RevealedAnswer[];
  onRoundEnd: (winner: Team, points: number) => void;
  category: string;
  team1Score: number;
  team2Score: number;
  onSkipCategory: () => void;
  canSkip: boolean;
}

const GameBoard: React.FC<GameBoardProps> = ({ 
  initialAnswers, 
  onRoundEnd, 
  category, 
  team1Score, 
  team2Score,
  onSkipCategory,
  canSkip,
}) => {
  const [answers, setAnswers] = useState<RevealedAnswer[]>(initialAnswers);
  const [roundPoints, setRoundPoints] = useState(0);
  const [guess, setGuess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New state for game flow
  const [phase, setPhase] = useState<GamePhase>(GamePhase.CategoryReveal);
  const [strikes, setStrikes] = useState(0);
  const [activeTeam, setActiveTeam] = useState<Team | null>(null);
  
  // Face-off specific state
  const [faceOffDinger, setFaceOffDinger] = useState<Team | null>(null);
  const [faceOffAnswers, setFaceOffAnswers] = useState<(RevealedAnswer | null)[]>([null, null]);
  const [faceOffTurn, setFaceOffTurn] = useState<Team | null>(null);

  // Play or Pass state
  const [choosingTeam, setChoosingTeam] = useState<Team | null>(null);
  const [roundWinner, setRoundWinner] = useState<Team | null>(null);

  // --- EFFECTS ---

  useEffect(() => {
    // Transition from revealing category to face-off
    const timer = setTimeout(() => {
      if (phase === GamePhase.CategoryReveal) {
        setPhase(GamePhase.FaceOff);
      }
    }, 4000); // Show category for 4 seconds
    return () => clearTimeout(timer);
  }, [phase, category]); // Rerun if category changes (due to skip)

  useEffect(() => {
    // Clear error messages after a few seconds
    if (error) {
      const timer = setTimeout(() => setError(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [error]);
  
  // --- CORE GAME LOGIC ---

  const revealAnswer = useCallback((text: string, addPoints = true): RevealedAnswer | null => {
    let revealedAnswer: RevealedAnswer | null = null;
    setAnswers(currentAnswers => {
        const newAnswers = [...currentAnswers];
        const matchIndex = newAnswers.findIndex(ans => ans.text.toLowerCase() === text.toLowerCase() && !ans.revealed);
        if (matchIndex !== -1) {
            newAnswers[matchIndex].revealed = true;
            revealedAnswer = newAnswers[matchIndex];
            if (addPoints) {
                setRoundPoints(prev => prev + revealedAnswer!.points);
            }
        }
        return newAnswers;
    });
    return revealedAnswer;
  }, []);

  const determineFaceOffWinner = useCallback((ans1: RevealedAnswer | null, ans2: RevealedAnswer | null) => {
    const points1 = ans1?.points ?? -1;
    const points2 = ans2?.points ?? -1;
    
    let winner: Team;
    if (points1 > -1 && points2 === -1) winner = 1; // Team 1 correct, Team 2 wrong
    else if (points1 === -1 && points2 > -1) winner = 2; // Team 1 wrong, Team 2 correct
    else if (points1 === -1 && points2 === -1) winner = faceOffDinger!; // Both wrong, dinger chooses
    else if (points1 > -1 && points2 > -1) { // Both correct
      winner = points1 >= points2 ? 1 : 2;
    } else {
      winner = faceOffDinger!;
    }
    
    // Adjust winner if the dinger was team 2
    if (faceOffDinger === 2) {
      winner = winner === 1 ? 2 : 1;
    }

    setChoosingTeam(winner);
    setPhase(GamePhase.PlayOrPass);
  }, [faceOffDinger]);

  const handleFaceOffSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guess.trim() || isLoading || !faceOffTurn) return;

    setIsLoading(true);
    setError(null);
    const currentGuess = guess;
    setGuess('');

    const unrevealedAnswers = answers.filter(a => !a.revealed).map(a => a.text);
    const alreadyRevealed = answers.filter(a => a.revealed).map(a => a.text);

    if (alreadyRevealed.some(ans => ans.toLowerCase() === currentGuess.toLowerCase())) {
        setError("That answer is already on the board!");
        setIsLoading(false);
        return;
    }

    const result = await checkAnswer(currentGuess, unrevealedAnswers);
    setIsLoading(false);

    let revealedAnswer: RevealedAnswer | null = null;
    if (result.match && result.text) {
      revealedAnswer = revealAnswer(result.text, true);
    }

    const newFaceOffAnswers = [...faceOffAnswers];
    // This logic determines which index (0 or 1) to update
    const teamIndex = (faceOffTurn === faceOffDinger) ? 0 : 1;
    newFaceOffAnswers[teamIndex] = revealedAnswer;
    setFaceOffAnswers(newFaceOffAnswers);
    
    // If it's the first person's turn in face-off, switch to the other player
    if (faceOffTurn === faceOffDinger) {
        setFaceOffTurn(faceOffDinger === 1 ? 2 : 1);
    } else {
        // Second person has answered, determine winner
        determineFaceOffWinner(newFaceOffAnswers[0], newFaceOffAnswers[1]);
    }
  }, [guess, isLoading, answers, faceOffTurn, faceOffDinger, faceOffAnswers, revealAnswer, determineFaceOffWinner]);

  const handleStrike = useCallback(() => {
    const newStrikes = strikes + 1;
    setStrikes(newStrikes);
    if (phase === GamePhase.MainRound && newStrikes >= MAX_STRIKES) {
      // Use a timeout to show the last strike before transitioning
      setTimeout(() => {
        setPhase(GamePhase.StealAttempt);
        setActiveTeam(activeTeam === 1 ? 2 : 1);
      }, 500);
    }
  }, [strikes, phase, activeTeam]);

  const startEndRoundSequence = useCallback(async (winningTeam: Team) => {
    setPhase(GamePhase.RoundReveal);
    setRoundWinner(winningTeam);
    const unrevealed = answers.filter(a => !a.revealed).sort((a, b) => a.points - b.points);
    
    for (const ans of unrevealed) {
        await new Promise(resolve => setTimeout(resolve, 500));
        revealAnswer(ans.text, false); // Just reveal, don't add points
    }

    setPhase(GamePhase.RoundRevealComplete);
  }, [answers, revealAnswer]);

  const handleGuessSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guess.trim() || isLoading || !activeTeam) return;

    setIsLoading(true);
    setError(null);
    const currentGuess = guess;
    setGuess('');

    const unrevealedAnswers = answers.filter(a => !a.revealed).map(a => a.text);
    const alreadyRevealed = answers.filter(a => a.revealed).map(a => a.text);

    if (alreadyRevealed.some(ans => ans.toLowerCase() === currentGuess.toLowerCase())) {
        setError("That answer is already on the board!");
        setGuess(currentGuess);
        setIsLoading(false);
        return;
    }

    const result = await checkAnswer(currentGuess, unrevealedAnswers);
    setIsLoading(false);

    if (result.match && result.text) {
      revealAnswer(result.text);
      const isBoardCleared = answers.filter(a => !a.revealed).length <= 1;

      if (phase === GamePhase.StealAttempt) {
        startEndRoundSequence(activeTeam!);
        return;
      }
      
      if (isBoardCleared) {
        startEndRoundSequence(activeTeam!);
      }
    } else {
      setError(`"${currentGuess}" is not on the board!`);
      if (phase === GamePhase.MainRound || phase === GamePhase.StealAttempt) {
        handleStrike();
      }
      if (phase === GamePhase.StealAttempt) {
        // Failed steal, other team gets the points.
        startEndRoundSequence(activeTeam === 1 ? 2 : 1);
      }
    }
  }, [guess, isLoading, answers, phase, activeTeam, revealAnswer, handleStrike, startEndRoundSequence]);

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

  const handlePass = () => {
    if (phase === GamePhase.MainRound && activeTeam) {
        handleStrike();
    }
  }

  const renderPhaseContent = () => {
    switch(phase) {
      case GamePhase.CategoryReveal:
        return (
            <div className="text-center p-4 flex flex-col items-center gap-4">
                <h3 className="font-title text-3xl md:text-4xl text-white opacity-80 mb-2">The Category Is...</h3>
                <h2 className="font-title text-4xl md:text-6xl text-yellow-300 animate-pulse tracking-wide" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>{category}</h2>
                {canSkip && (
                  <button 
                    onClick={onSkipCategory}
                    className="mt-4 px-4 py-2 bg-gray-600 text-white text-sm font-bold rounded-lg hover:bg-gray-700 transition-colors disabled:bg-gray-800 disabled:text-gray-500"
                  >
                    Skip Category
                  </button>
                )}
            </div>
        );

      case GamePhase.FaceOff:
        if (!faceOffTurn) {
            return null; // The minigame overlay is handling this state now
        }
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
                    <button type="button" onClick={handlePass} disabled={!activeTeam} className="px-8 py-3 text-xl font-bold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-transform transform hover:scale-105 disabled:bg-gray-500 disabled:scale-100">
                        Wrong / Pass
                    </button>
                )}
              </div>
            </form>
          </div>
        );
      
      case GamePhase.RoundReveal:
          return <h2 className="font-title text-5xl text-center text-yellow-300 animate-pulse">Revealing the board...</h2>;
      
      case GamePhase.RoundRevealComplete:
        return (
            <div className="text-center">
                <button 
                    onClick={() => setPhase(GamePhase.RoundOver)} 
                    className="bg-yellow-500 text-blue-900 font-bold py-3 px-6 rounded-lg text-xl hover:bg-yellow-400 transition transform hover:scale-105"
                >
                    Continue
                </button>
            </div>
        );

      case GamePhase.RoundOver:
        return (
            <div className="text-center">
                <h2 className="font-title text-4xl text-white mb-6">Round Complete!</h2>
                <button 
                    onClick={() => onRoundEnd(roundWinner!, roundPoints)} 
                    className="bg-yellow-500 text-blue-900 font-bold py-3 px-6 rounded-lg text-xl hover:bg-yellow-400 transition transform hover:scale-105"
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
      {isLoading && (
        <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 rounded-lg">
          <Loader />
        </div>
      )}
      
      {phase === GamePhase.FaceOff && !faceOffDinger && (
        <FaceOffMinigame onDing={handleDing} />
      )}
      
      {/* Score Header */}
      <div className="w-full flex justify-between items-center bg-black/40 p-2 sm:p-4 rounded-xl shadow-lg border-2 border-yellow-400/50 mb-4">
        <div className="text-center px-2 sm:px-4">
          <h3 className="font-title text-xl md:text-3xl text-blue-300">Team 1</h3>
          <p className="font-title text-4xl md:text-6xl text-white">{team1Score}</p>
        </div>
        <div className="text-center px-2 sm:px-4 flex-grow">
            <h2 className="font-title text-2xl md:text-4xl text-yellow-300 hidden sm:block truncate">{phase !== GamePhase.CategoryReveal ? category : ' '}</h2>
            <p className="font-title text-5xl md:text-7xl text-white">{roundPoints}</p>
            <p className="text-lg font-semibold text-yellow-300 hidden sm:block">Round Points</p>
        </div>
        <div className="text-center px-2 sm:px-4">
          <h3 className="font-title text-xl md:text-3xl text-red-300">Team 2</h3>
          <p className="font-title text-4xl md:text-6xl text-white">{team2Score}</p>
        </div>
      </div>
      
      {/* Main Area */}
      <div className="w-full flex flex-col lg:flex-row gap-4 flex-grow">
          {/* Answer Board */}
          <div className="w-full lg:w-3/5 grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3 p-2 sm:p-4 bg-black/40 rounded-xl shadow-lg">
            {answers.map((answer, index) => (
              <AnswerSlot key={`${answer.text}-${index}`} answer={answer} rank={index + 1} />
            ))}
          </div>
          
          {/* Game Controls & Status */}
          <div className="w-full lg:w-2/5 flex flex-col items-center justify-center bg-black/40 p-4 rounded-xl shadow-lg min-h-[250px] sm:min-h-[300px]">
            {error && <p className="text-red-400 text-xl font-semibold mb-4 text-center">{error}</p>}
            { (phase === GamePhase.MainRound || (phase === GamePhase.StealAttempt && strikes > 0)) && <StrikeDisplay strikes={strikes} /> }
            <div className="mt-4 w-full flex-grow flex items-center justify-center">
                {renderPhaseContent()}
            </div>
          </div>
      </div>
    </div>
  );
};

export default GameBoard;