
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import type { RevealedAnswer, Team, FaceOffMinigameType } from './types';
import { Difficulty } from './types';
import { ANSWERS_COUNT } from './constants';
import { gameData } from './gameData';
import SetupScreen from './components/SetupScreen';
import GameBoard from './components/GameBoard';
import { rainConfetti } from './services/particleService';

type GameState = 'setup' | 'playing' | 'gameOver' | 'roundTransition';

export interface GameSettings {
  difficulty: Difficulty;
  totalRounds: number;
  team1Name: string;
  team2Name: string;
  timerDuration: number;
}

const minigameRotation: FaceOffMinigameType[] = ['TeleportingBell'];

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>('setup');
  const [roundData, setRoundData] = useState<{ category: string; answers: RevealedAnswer[]; minigame: FaceOffMinigameType } | null>(null);
  
  const [scores, setScores] = useState({ team1: 0, team2: 0 });
  const [settings, setSettings] = useState<GameSettings | null>(null);
  const [currentRound, setCurrentRound] = useState(0);
  const [usedCategoryIndices, setUsedCategoryIndices] = useState<number[]>([]);
  const [gameWinner, setGameWinner] = useState<Team | null>(null);

  const availableCategories = useMemo(() => {
    if (!settings) return [];
    return gameData
      .map((data, index) => ({ ...data, originalIndex: index }))
      .filter(data => data.difficulty === settings.difficulty);
  }, [settings]);

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
      const winner = scores.team1 > scores.team2 ? 1 : (scores.team2 > scores.team1 ? 2 : null);
      setGameWinner(winner); 
      setGameState('gameOver');
      rainConfetti();
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
      accepted: answer.accepted,
    }));

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

  const handleStartGame = (newSettings: GameSettings) => {
    setSettings(newSettings);
    setUsedCategoryIndices([]);
    setCurrentRound(0);
    setScores({ team1: 0, team2: 0 });
    setGameWinner(null);
    setGameState('roundTransition');
  };

  useEffect(() => {
    if (gameState === 'roundTransition' && currentRound === 0 && settings) {
      startNewRound();
    }
  }, [gameState, currentRound, settings, startNewRound]);

  const handleRoundEnd = useCallback((winner: Team, points: number) => {
    const newScores = { ...scores };
    if (winner === 1) newScores.team1 += points;
    else newScores.team2 += points;
    setScores(newScores);

    if (currentRound >= settings!.totalRounds) {
      const finalWinner = newScores.team1 > newScores.team2 ? 1 : (newScores.team2 > newScores.team1 ? 2 : null);
      setGameWinner(finalWinner);
      setGameState('gameOver');
      rainConfetti();
    } else {
      setGameState('roundTransition');
      rainConfetti();
    }
  }, [currentRound, settings, scores]);
  
  const handlePlayAgain = useCallback(() => {
    setGameState('setup');
  }, []);

  return (
    <main className="w-screen h-screen flex items-center justify-center p-4 md:p-8">
      {gameState === 'setup' && <SetupScreen onStart={handleStartGame} />}
      
      {gameState === 'playing' && roundData && settings && (
        <GameBoard 
            key={roundData.category}
            initialAnswers={roundData.answers} 
            onRoundEnd={handleRoundEnd} 
            category={roundData.category}
            team1Name={settings.team1Name}
            team2Name={settings.team2Name}
            team1Score={scores.team1}
            team2Score={scores.team2}
            onSkipCategory={pickAndSetNewCategory}
            canSkip={canSkipCategory}
            minigame={roundData.minigame}
            currentRound={currentRound}
            timerDuration={settings.timerDuration}
        />
      )}

      {gameState === 'roundTransition' && settings && (
        <div className="glass-card w-full max-w-2xl p-12 rounded-3xl text-center border-t border-white/20 shadow-2xl">
          <h2 className="font-title text-4xl text-sky-400 mb-2">Round {currentRound} Over</h2>
          <div className="flex justify-around items-center my-10">
            <div className="text-center">
              <span className="text-white/60 font-semibold block uppercase tracking-widest text-xs mb-2">{settings.team1Name}</span>
              <span className="font-title text-7xl text-white">{scores.team1}</span>
            </div>
            <div className="h-16 w-px bg-white/10"></div>
            <div className="text-center">
              <span className="text-white/60 font-semibold block uppercase tracking-widest text-xs mb-2">{settings.team2Name}</span>
              <span className="font-title text-7xl text-white">{scores.team2}</span>
            </div>
          </div>
          <button onClick={startNewRound} className="w-full bg-cyan-600 text-white font-title text-2xl py-5 rounded-2xl hover:bg-cyan-500 transition-all border-b-4 border-cyan-800 active:border-b-0 active:translate-y-1">
            Next Round: {currentRound + 1} / {settings.totalRounds}
          </button>
        </div>
      )}

      {gameState === 'gameOver' && settings && (
        <div className="glass-card w-full max-w-2xl p-12 rounded-3xl text-center border-t border-white/20 shadow-2xl">
          <h2 className="font-title text-2xl text-cyan-400 mb-2">Final Results</h2>
          <h1 className="font-title text-6xl text-white mb-8">
            {gameWinner ? `${gameWinner === 1 ? settings.team1Name : settings.team2Name} Wins!` : "It's a Tie!"}
          </h1>
          <div className="flex justify-around my-10 bg-black/30 p-8 rounded-2xl">
            <div className="text-center">
              <span className="text-white/40 block mb-1">{settings.team1Name}</span>
              <span className="font-title text-5xl text-white">{scores.team1}</span>
            </div>
            <div className="text-center">
              <span className="text-white/40 block mb-1">{settings.team2Name}</span>
              <span className="font-title text-5xl text-white">{scores.team2}</span>
            </div>
          </div>
          <button onClick={handlePlayAgain} className="w-full bg-white text-slate-900 font-title text-2xl py-5 rounded-2xl hover:bg-slate-200 transition-all border-b-4 border-slate-400 active:border-b-0 active:translate-y-1">
            New Game
          </button>
        </div>
      )}
    </main>
  );
};

export default App;
