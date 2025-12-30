
import React, { forwardRef } from 'react';
import type { RevealedAnswer } from '../types';

interface AnswerSlotProps {
  answer: RevealedAnswer;
  rank: number;
}

const AnswerSlot = forwardRef<HTMLDivElement, AnswerSlotProps>(({ answer, rank }, ref) => {
  return (
    <div ref={ref} className={`perspective-container w-full h-14 sm:h-16 flip-card ${answer.revealed ? 'flipped' : ''}`}>
      <div className="relative w-full h-full flip-card-inner">
        {/* Front: Mystery Slate */}
        <div className="flip-card-front absolute w-full h-full rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 flex items-center justify-between px-6 shadow-xl">
          <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center border border-cyan-500/30">
            <span className="font-title text-cyan-400 text-lg">{rank}</span>
          </div>
          <div className="flex-grow flex justify-center">
            <div className="w-1/2 h-1 bg-white/5 rounded-full"></div>
          </div>
        </div>
        
        {/* Back: Revealed Truth */}
        <div className="flip-card-back absolute w-full h-full bg-white rounded-xl flex items-center justify-between px-4 shadow-2xl border-b-4 border-slate-300">
          <div className="flex items-center gap-3 overflow-hidden">
             {answer.emoji && <span className="text-xl shrink-0" role="img">{answer.emoji}</span>}
             <span className="font-title text-slate-900 text-lg truncate tracking-tight">{answer.text}</span>
          </div>
          <div className="bg-slate-900 text-white font-title px-3 py-1 rounded-lg text-lg min-w-[3rem] text-center">
            {answer.points}
          </div>
        </div>
      </div>
    </div>
  );
});

export default AnswerSlot;
