import React, { useState, useMemo, useEffect } from 'react';
import { Difficulty } from '../types';
import { DIFFICULTIES, ROUND_OPTIONS } from '../constants';
import { gameData } from '../gameData';

interface SetupScreenProps {
  onStart: (difficulty: Difficulty, rounds: number) => void;
}

const SetupScreen: React.FC<SetupScreenProps> = ({ onStart }) => {
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>(Difficulty.Easy);

  const categoryCounts = useMemo(() => {
    return DIFFICULTIES.reduce((acc, diff) => {
        acc[diff] = gameData.filter(d => d.difficulty === diff).length;
        return acc;
    }, {} as Record<Difficulty, number>);
  }, []);

  const availableRoundOptions = useMemo(() => {
    const maxRounds = categoryCounts[selectedDifficulty] || 0;
    return ROUND_OPTIONS.filter(r => r <= maxRounds);
  }, [selectedDifficulty, categoryCounts]);
  
  const [selectedRounds, setSelectedRounds] = useState<number>(availableRoundOptions.length > 0 ? availableRoundOptions[0] : 0);
  
  useEffect(() => {
    setSelectedRounds(currentSelectedRounds => {
        if (!availableRoundOptions.includes(currentSelectedRounds)) {
            if (availableRoundOptions.length > 0) {
                return availableRoundOptions[availableRoundOptions.length - 1];
            } else {
                return 0; 
            }
        }
        return currentSelectedRounds;
    });
  }, [availableRoundOptions]);


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedRounds > 0) {
        onStart(selectedDifficulty, selectedRounds);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-sky-800/70 backdrop-blur-sm rounded-2xl shadow-2xl p-8 md:p-12 border-4 border-sky-500">
      <div className="text-center mb-8">
        <h1 className="text-5xl md:text-7xl font-title text-yellow-300 uppercase" style={{ textShadow: '3px 3px 0px #0c4a6e' }}>
          Classroom Feud
        </h1>
         <h2 className="text-lg md:text-lg font-black text-yellow-400 uppercase tracking-wider" style={{ textShadow: '3px 3px 6px rgba(0,0,0,0.7)' }}>
         by Steven </h2>
        <p className="text-lg text-sky-200 mt-2">Let's see what the classroom says! </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div>
          <label className="block text-2xl font-title text-white mb-3" style={{ textShadow: '2px 2px 2px rgba(0,0,0,0.2)'}}>Select Difficulty</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 bg-sky-900/50 rounded-lg p-2 border-2 border-sky-700">
            {DIFFICULTIES.map(difficulty => (
              <button
                type="button"
                key={difficulty}
                onClick={() => setSelectedDifficulty(difficulty)}
                className={`flex-1 p-3 text-lg font-bold rounded-md transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-yellow-400 focus:ring-opacity-50 transform hover:scale-105 ${
                  selectedDifficulty === difficulty ? 'bg-yellow-400 text-sky-900 shadow-inner' : 'text-white bg-sky-700 hover:bg-sky-600'
                } ${difficulty === Difficulty.DeathMode ? 'hover:bg-red-600' : ''}`}
                 style={selectedDifficulty === difficulty && difficulty === Difficulty.DeathMode ? {backgroundColor: '#ef4444', color: 'white'} : {}}
              >
                {difficulty}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-2xl font-title text-white mb-3" style={{ textShadow: '2px 2px 2px rgba(0,0,0,0.2)'}}>Number of Rounds</label>
          {availableRoundOptions.length > 0 ? (
            <div className="flex bg-sky-900/50 rounded-lg p-2 border-2 border-sky-700 gap-2">
              {availableRoundOptions.map(rounds => (
                <button
                  type="button"
                  key={rounds}
                  onClick={() => setSelectedRounds(rounds)}
                  className={`flex-1 p-3 text-lg font-bold rounded-md transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-yellow-400 focus:ring-opacity-50 transform hover:scale-105 ${
                    selectedRounds === rounds ? 'bg-yellow-400 text-sky-900 shadow-inner' : 'text-white bg-sky-700 hover:bg-sky-600'
                  }`}
                >
                  {rounds}
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center bg-red-900/50 p-3 rounded-lg border border-red-700">
                <p className="text-red-300 font-semibold">No categories available for this difficulty.</p>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={availableRoundOptions.length === 0}
          className="w-full bg-lime-500 text-white text-4xl font-title py-4 rounded-xl shadow-lg hover:bg-lime-600 transition-transform transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-lime-300 disabled:bg-gray-600 disabled:cursor-not-allowed disabled:transform-none border-b-8 border-lime-700 active:border-b-0"
        >
          Start Game!
        </button>
      </form>
    </div>
  );
};

export default SetupScreen;