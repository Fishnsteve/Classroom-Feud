
import React, { useState, useMemo } from 'react';
import { Difficulty } from '../types';
import { DIFFICULTIES, ROUND_OPTIONS } from '../constants';
import { gameData } from '../gameData';
import RulesModal from './RulesModal';
import { GameSettings } from '../App';

interface SetupScreenProps {
  onStart: (settings: GameSettings) => void;
}

const SetupScreen: React.FC<SetupScreenProps> = ({ onStart }) => {
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.Easy);
  const [rounds, setRounds] = useState<number>(3);
  const [team1Name, setTeam1Name] = useState('Team Alpha');
  const [team2Name, setTeam2Name] = useState('Team Omega');
  const [timerDuration, setTimerDuration] = useState(30);
  const [isRulesOpen, setIsRulesOpen] = useState(false);

  const categoryCounts = useMemo(() => {
    return DIFFICULTIES.reduce((acc, diff) => {
        acc[diff] = gameData.filter(d => d.difficulty === diff).length;
        return acc;
    }, {} as Record<Difficulty, number>);
  }, []);

  const availableRoundOptions = useMemo(() => {
    const max = categoryCounts[difficulty] || 0;
    return ROUND_OPTIONS.filter(r => r <= max);
  }, [difficulty, categoryCounts]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onStart({
      difficulty,
      totalRounds: rounds,
      team1Name: team1Name.trim() || 'Team 1',
      team2Name: team2Name.trim() || 'Team 2',
      timerDuration
    });
  };

  return (
    <div className="w-full max-w-4xl glass-card rounded-[2.5rem] p-10 md:p-16 border-t border-white/20 shadow-2xl relative overflow-hidden">
      {/* Background Accent */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl"></div>
      
      <div className="relative z-10 flex flex-col md:flex-row gap-12">
        <div className="md:w-1/2">
          <h1 className="font-title text-5xl md:text-7xl text-white mb-2">Classroom<br/><span className="text-cyan-400">Feud</span></h1>
          <p className="text-slate-400 text-lg mb-8">Professional Studio Edition</p>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold uppercase tracking-widest text-slate-500 mb-2">Team Identities</label>
              <div className="space-y-3">
                <input 
                  value={team1Name} 
                  onChange={e => setTeam1Name(e.target.value)}
                  placeholder="Team 1 Name"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-cyan-500 focus:outline-none transition-all"
                />
                <input 
                  value={team2Name} 
                  onChange={e => setTeam2Name(e.target.value)}
                  placeholder="Team 2 Name"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-cyan-500 focus:outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold uppercase tracking-widest text-slate-500 mb-2">Timer Speed</label>
              <div className="flex gap-2">
                {[15, 30, 45].map(t => (
                  <button 
                    key={t}
                    type="button"
                    onClick={() => setTimerDuration(t)}
                    className={`flex-1 py-2 rounded-lg font-title border transition-all ${timerDuration === t ? 'bg-cyan-500 border-cyan-400 text-white' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'}`}
                  >
                    {t}s
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="md:w-1/2 flex flex-col justify-between">
          <div className="space-y-8">
            <div>
              <label className="block text-sm font-semibold uppercase tracking-widest text-slate-500 mb-3">Difficulty Tier</label>
              <div className="grid grid-cols-2 gap-2">
                {DIFFICULTIES.map(d => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => { setDifficulty(d); setRounds(availableRoundOptions[0] || 3); }}
                    className={`py-3 rounded-xl font-title text-sm border transition-all ${difficulty === d ? 'bg-white text-slate-900 border-white' : 'bg-black/40 border-white/10 text-slate-400 hover:bg-white/5'}`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold uppercase tracking-widest text-slate-500 mb-3">Series Length</label>
              <div className="flex gap-2">
                {availableRoundOptions.map(r => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRounds(r)}
                    className={`flex-1 py-3 rounded-xl font-title border transition-all ${rounds === r ? 'bg-cyan-500 border-cyan-400 text-white' : 'bg-black/40 border-white/10 text-slate-400 hover:bg-white/5'}`}
                  >
                    {r} Rounds
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-12 space-y-4">
            <button
              onClick={handleSubmit}
              className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-title text-2xl py-6 rounded-2xl shadow-2xl transition-all transform hover:scale-[1.02] active:scale-95 border-b-4 border-cyan-800"
            >
              Enter Studio
            </button>
            <button
              type="button"
              onClick={() => setIsRulesOpen(true)}
              className="w-full text-slate-400 hover:text-white font-semibold text-sm transition-colors"
            >
              View Game Regulations
            </button>
          </div>
        </div>
      </div>

      <RulesModal isOpen={isRulesOpen} onClose={() => setIsRulesOpen(false)} />
    </div>
  );
};

export default SetupScreen;
