import React, { useState, useCallback, useMemo, useEffect } from 'react';
import type { RevealedAnswer, Team } from './types';
import { Difficulty } from './types';
import { ANSWERS_COUNT } from './constants';
import { gameData } from './gameData';
import SetupScreen from './components/SetupScreen';
import GameBoard from './components/GameBoard';

type GameState = 'setup' | 'playing' | 'gameOver' | 'roundTransition';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>('setup');
  const [roundData, setRoundData] = useState<{ category: string; answers: RevealedAnswer[] } | null>(null);
  
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
    }));
    
    setRoundData({
      category: newCategoryData.category,
      answers: formattedAnswers
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
    } else {
      setGameState('roundTransition');
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
        />;
      case 'roundTransition':
        return (
          <div className="text-center text-white bg-black/60 backdrop-blur-sm p-8 rounded-2xl shadow-2xl border-2 border-yellow-400/50">
            <h2 className="font-title text-5xl mb-4">Round {currentRound} Complete!</h2>
            <div className="flex justify-center gap-8 text-2xl mb-8">
                <div>
                    <span className="block font-semibold text-blue-300">Team 1 Score</span>
                    <span className="block font-title text-6xl text-white">{scores.team1}</span>
                </div>
                <div>
                    <span className="block font-semibold text-red-300">Team 2 Score</span>
                    <span className="block font-title text-6xl text-white">{scores.team2}</span>
                </div>
            </div>
            <button onClick={startNewRound} className="bg-green-600 text-white font-bold py-4 px-8 rounded-lg text-2xl hover:bg-green-700 transition transform hover:scale-105">
              Start Next Round ({currentRound + 1}/{gameSettings?.totalRounds})
            </button>
          </div>
        );
      case 'gameOver':
         return (
          <div className="text-center text-white bg-black/60 backdrop-blur-sm p-8 rounded-2xl shadow-2xl border-2 border-yellow-400/50">
            <h2 className="font-title text-6xl mb-4">GAME OVER!</h2>
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
                    <span className="block font-semibold text-red-300">Team 2 Final Score</span>
                    <span className="block font-title text-6xl text-white">{scores.team2}</span>
                </div>
            </div>
            <button onClick={handlePlayAgain} className="bg-green-600 text-white font-bold py-4 px-8 rounded-lg text-2xl hover:bg-green-700 transition transform hover:scale-105">
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
    <main className="w-screen h-screen bg-cover bg-center flex items-center justify-center p-2 sm:p-4 overflow-hidden" style={{fontFamily: "'Nunito', sans-serif", background: "radial-gradient(circle, rgba(2,0,36,1) 0%, rgba(3,50,89,1) 0%, rgba(0,29,61,1) 100%)"}}>
      {renderContent()}
    </main>
  );
};

export default App;