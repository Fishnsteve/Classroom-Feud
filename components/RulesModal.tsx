
import React from 'react';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl animate-in fade-in duration-300">
      <div 
        className="glass-card relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-[2rem] p-12 text-white border-t border-white/20 shadow-2xl"
        role="dialog"
      >
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 w-12 h-12 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-full text-2xl transition-all"
        >
          ×
        </button>

        <h2 className="font-title text-4xl text-cyan-400 mb-10 text-center tracking-widest">Game Regulations</h2>

        <div className="space-y-10 font-sans">
          {[
            {
              id: 1, title: "The Buzzer Face-Off", 
              text: "A quick-reaction test for team leads. The high-score answer takes priority. Winner chooses to play the board or pass it to opponents."
            },
            {
              id: 2, title: "Board Control", 
              text: "Playing team must clear all 10 answers. Each wrong guess earns a Strike. 3 Strikes ends control."
            },
            {
              id: 3, title: "The Steal Opportunity", 
              text: "If control is lost, the opposing team gets one guess to steal all banked points. Failure returns points to the original team."
            },
            {
              id: 4, title: "Precision Timer", 
              text: "Standard time is 30s. A 5s 'Last Chance' grace period ensures fairness for slow typists."
            }
          ].map(rule => (
            <div key={rule.id} className="flex gap-6">
              <div className="shrink-0 w-10 h-10 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center font-title text-cyan-400">
                {rule.id}
              </div>
              <div>
                <h3 className="font-title text-xl text-white mb-1">{rule.title}</h3>
                <p className="text-slate-400 leading-relaxed text-sm">{rule.text}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12">
          <button 
            onClick={onClose}
            className="w-full bg-white text-slate-900 font-title text-xl py-5 rounded-2xl hover:bg-slate-200 transition-all shadow-xl"
          >
            Confirm & Return
          </button>
        </div>
      </div>
    </div>
  );
};

export default RulesModal;
