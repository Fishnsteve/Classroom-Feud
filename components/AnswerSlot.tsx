import React, { forwardRef } from 'react';
import type { RevealedAnswer } from '../types';

interface AnswerSlotProps {
  answer: RevealedAnswer;
  rank: number;
}

const AnswerSlot = forwardRef<HTMLDivElement, AnswerSlotProps>(({ answer, rank }, ref) => {
  return (
    <div ref={ref} className={`perspective-container w-full h-16 sm:h-20 flip-card ${answer.revealed ? 'flipped' : ''}`}>
      <div className="relative w-full h-full flip-card-inner">
        {/* Front of the card (Rank) */}
        <div className="flip-card-front absolute w-full h-full bg-sky-500 rounded-lg shadow-lg flex items-center justify-center border-b-4 border-sky-700">
          <span className="font-title text-4xl sm:text-5xl text-white opacity-40 absolute left-4">{rank}</span>
          <span className="font-title text-6xl sm:text-7xl text-white opacity-80" style={{ textShadow: '2px 2px 2px rgba(0,0,0,0.2)'}}>?</span>
        </div>
        
        {/* Back of the card (Answer) */}
        <div className="flip-card-back absolute w-full h-full bg-yellow-300 rounded-lg shadow-xl flex items-center justify-between p-2 md:p-4 border-b-4 border-yellow-500">
          <div className="flex-grow flex items-center justify-center gap-2 pr-2 overflow-hidden">
              {answer.emoji && <span className="text-xl sm:text-2xl md:text-3xl" role="img" aria-label="emoji">{answer.emoji}</span>}
              <span className="text-sm sm:text-base md:text-xl font-bold text-sky-800 uppercase text-center truncate">{answer.text}</span>
          </div>
          <span className="text-xl sm:text-3xl font-title text-white bg-sky-600 rounded-full flex items-center justify-center w-10 h-10 sm:w-14 sm:h-14 shadow-inner flex-shrink-0 border-2 border-white/50">
            {answer.points}
          </span>
        </div>
      </div>
    </div>
  );
});

export default AnswerSlot;