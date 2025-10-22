import React from 'react';
import type { RevealedAnswer } from '../types';

interface AnswerSlotProps {
  answer: RevealedAnswer;
  rank: number;
}

const AnswerSlot: React.FC<AnswerSlotProps> = ({ answer, rank }) => {
  return (
    <div className={`perspective-container w-full h-16 sm:h-20 flip-card ${answer.revealed ? 'flipped' : ''}`}>
      <div className="relative w-full h-full flip-card-inner">
        {/* Front of the card (Rank) */}
        <div className="flip-card-front absolute w-full h-full bg-indigo-600 rounded-lg shadow-lg flex items-center justify-center border-2 border-indigo-400">
          <span className="font-title text-4xl sm:text-5xl text-white opacity-80">{rank}</span>
        </div>
        
        {/* Back of the card (Answer) */}
        <div className="flip-card-back absolute w-full h-full bg-amber-400 rounded-lg shadow-xl flex items-center justify-between p-2 md:p-4 border-2 border-amber-600">
          <div className="flex-grow flex items-center justify-center gap-2 pr-2 overflow-hidden">
              {answer.emoji && <span className="text-xl sm:text-2xl md:text-3xl" role="img" aria-label="emoji">{answer.emoji}</span>}
              <span className="text-sm sm:text-base md:text-xl font-bold text-indigo-900 uppercase text-center truncate">{answer.text}</span>
          </div>
          <span className="text-xl sm:text-3xl font-black text-white bg-indigo-700 rounded-full flex items-center justify-center w-10 h-10 sm:w-14 sm:h-14 shadow-inner flex-shrink-0">
            {answer.points}
          </span>
        </div>
      </div>
    </div>
  );
};

export default AnswerSlot;