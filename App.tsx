import React, { useState, useCallback, useMemo, useEffect } from 'react';
import type { RevealedAnswer, Team, FaceOffMinigameType } from './types';
import { Difficulty } from './types';
import { ANSWERS_COUNT } from './constants';
import { gameData } from './gameData';
import SetupScreen from './components/SetupScreen';
import GameBoard from './components/GameBoard';
import { rainConfetti } from './services/particleService';

type GameState = 'setup' | 'playing' | 'gameOver' | 'roundTransition';

const minigameRotation: FaceOffMinigameType[] = ['TeleportingBell'];

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>('setup');
  const [roundData, setRoundData] = useState<{ category: string; answers: RevealedAnswer[]; minigame: FaceOffMinigameType } | null>(null);
  
  const [scores, setScores] = useState({ team1: 0, team2: 0 });
  const [gameSettings, setGameSettings] = useState<{ difficulty: Difficulty; totalRounds: number } | null>(null);
  const [currentRound, setCurrentRound] = useState(0);
  const [usedCategoryIndices, setUsedCategoryIndices] = useState<number[]>([]);
  const [gameWinner, setGameWinner] = useState<Team | null>(null);

  const availableCategories = useMemo(() => {
    if (!gameSettings) return [];
    return gameData
      .map((data, index) => ({ ...data, originalIndex: index }))
      .filter(data => data.difficulty === gameSettings.difficulty);
  }, [gameSettings]);

  const canSkipCategory = useMemo(() => {
    const unplayedCategories = availableCategories.filter(
      data => !usedCategoryIndices.includes(data.originalIndex)
    );
    return unplayedCategories.length > 0;
  }, [availableCategories, usedCategoryIndices]);

  const pickAndSetNewCategory = useCallback(() => {
    const unplayedCategories = availableCategories.filter(
      data => !usedCategoryIndices.includes(data.originalIndex)
    );

    if (unplayedCategories.length === 0) {
      console.error("No more unique categories available for this difficulty.");
      const winner = scores.team1 > scores.team2 ? 1 : (scores.team2 > scores.team1 ? 2 : null);
      setGameWinner(winner); 
      setGameState('gameOver');
      rainConfetti(); // Celebrate game end even if categories run out
      return false;
    }

    const randomIndex = Math.floor(Math.random() * unplayedCategories.length);
    const newCategoryData = unplayedCategories[randomIndex];
    
    setUsedCategoryIndices(prev => [...prev, newCategoryData.originalIndex]);

    const formattedAnswers: RevealedAnswer[] = newCategoryData.answers.map((answer, index) => ({
      text: answer.text,
      emoji: answer.emoji,
      points: ANSWERS_COUNT - index,
      revealed: false,
      accepted: answer.accepted, // Pass along acceptable answers
    }));

    // Determine which minigame to use for this round
    const minigameType = minigameRotation[usedCategoryIndices.length % minigameRotation.length];
    
    setRoundData({
      category: newCategoryData.category,
      answers: formattedAnswers,
      minigame: minigameType,
    });
    return true;
  }, [availableCategories, usedCategoryIndices, scores]);

  const startNewRound = useCallback(() => {
    const success = pickAndSetNewCategory();
    if (success) {
      setCurrentRound(prev => prev + 1);
      setGameState('playing');
    }
  }, [pickAndSetNewCategory]);

  const handleSkipCategory = useCallback(() => {
    pickAndSetNewCategory();
  }, [pickAndSetNewCategory]);

  const handleStartGame = (difficulty: Difficulty, totalRounds: number) => {
    setGameSettings({ difficulty, totalRounds });
    setUsedCategoryIndices([]);
    setCurrentRound(0);
    setScores({ team1: 0, team2: 0 });
    setGameWinner(null);
    setGameState('roundTransition'); // Go to transition screen to start round 1
  };

  // This effect will trigger the first round after settings are set
  useEffect(() => {
    if (gameState === 'roundTransition' && currentRound === 0 && gameSettings) {
      startNewRound();
    }
  }, [gameState, currentRound, gameSettings, startNewRound]);

  const handleRoundEnd = useCallback((winner: Team, points: number) => {
    const newScores = { ...scores };
    if (winner === 1) {
      newScores.team1 += points;
    } else {
      newScores.team2 += points;
    }
    setScores(newScores);

    if (currentRound >= gameSettings!.totalRounds) {
      const finalWinner = newScores.team1 > newScores.team2 ? 1 : (newScores.team2 > newScores.team1 ? 2 : null);
      setGameWinner(finalWinner);
      setGameState('gameOver');
      rainConfetti(); // Celebrate end of the game
    } else {
      setGameState('roundTransition');
      rainConfetti(); // Celebrate end of the round
    }
  }, [currentRound, gameSettings, scores]);
  
  const handlePlayAgain = useCallback(() => {
    setGameState('setup');
  }, []);

  const renderContent = () => {
    switch (gameState) {
      case 'playing':
        if (!roundData) return null;
        return <GameBoard 
            key={roundData.category} // Use category as key to force re-mount on skip
            initialAnswers={roundData.answers} 
            onRoundEnd={handleRoundEnd} 
            category={roundData.category}
            team1Score={scores.team1}
            team2Score={scores.team2}
            onSkipCategory={handleSkipCategory}
            canSkip={canSkipCategory}
            minigame={roundData.minigame}
            currentRound={currentRound}
        />;
      case 'roundTransition':
        return (
          <div className="text-center text-white bg-sky-800/70 backdrop-blur-sm p-8 rounded-2xl shadow-2xl border-4 border-yellow-300">
            <h2 className="font-title text-5xl mb-4" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.3)'}}>Round {currentRound} Complete!</h2>
            <div className="flex justify-center gap-8 text-2xl mb-8">
                <div>
                    <span className="block font-semibold text-blue-300">Team 1 Score</span>
                    <span className="block font-title text-6xl text-white">{scores.team1}</span>
                </div>
                <div>
                    <span className="block font-semibold text-red-400">Team 2 Score</span>
                    <span className="block font-title text-6xl text-white">{scores.team2}</span>
                </div>
            </div>
            <button onClick={startNewRound} className="bg-lime-500 text-white font-title text-3xl py-4 px-8 rounded-xl shadow-lg hover:bg-lime-600 transition transform hover:scale-105 border-b-4 border-lime-700 active:border-b-0">
              Start Round {currentRound + 1}/{gameSettings?.totalRounds}
            </button>
          </div>
        );
      case 'gameOver':
         return (
          <div className="text-center text-white bg-sky-800/70 backdrop-blur-sm p-8 rounded-2xl shadow-2xl border-4 border-yellow-300">
            <h2 className="font-title text-6xl mb-4" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.3)'}}>GAME OVER!</h2>
            {gameWinner ? (
                 <p className="text-4xl font-bold text-yellow-300 mb-6">Team {gameWinner} is the winner!</p>
            ) : (
                 <p className="text-4xl font-bold text-yellow-300 mb-6">It's a tie!</p>
            )}
            <div className="flex justify-center gap-8 text-2xl mb-8">
                <div>
                    <span className="block font-semibold text-blue-300">Team 1 Final Score</span>
                    <span className="block font-title text-6xl text-white">{scores.team1}</span>
                </div>
                <div>
                    <span className="block font-semibold text-red-400">Team 2 Final Score</span>
                    <span className="block font-title text-6xl text-white">{scores.team2}</span>
                </div>
            </div>
            <button onClick={handlePlayAgain} className="bg-lime-500 text-white font-title text-3xl py-4 px-8 rounded-xl shadow-lg hover:bg-lime-600 transition transform hover:scale-105 border-b-4 border-lime-700 active:border-b-0">
              Play Again
            </button>
          </div>
        );
      case 'setup':
      default:
        return <SetupScreen onStart={handleStartGame} />;
    }
  };

  return (
    <main className="w-screen h-screen flex items-center justify-center p-2 sm:p-4 overflow-hidden">
      {renderContent()}
    </main>
  );
};

export default App;