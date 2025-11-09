
import React from 'react';
import { Player } from '../types';
import { getSelectorThoughts } from '../constants';

interface SelectionStatusProps {
  player: Player;
  onClose: () => void;
}

const StatusCategory: React.FC<{ title: string; chance: number; text: string; }> = ({ title, chance, text }) => {
    const barColor = chance > 75 ? 'bg-green-500' : chance > 50 ? 'bg-yellow-500' : 'bg-red-500';

    return (
        <div className="bg-slate-900/50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
            <div className="flex items-center gap-4 mb-2">
                <div className="w-full bg-slate-700 rounded-full h-4 shadow-inner">
                    <div className={`${barColor} h-4 rounded-full text-center text-xs text-white font-bold leading-4 transition-all duration-500`} style={{ width: `${chance}%` }}>
                        {chance > 10 ? `${chance}%` : ''}
                    </div>
                </div>
            </div>
            <p className="text-sm text-slate-300 italic">"{text}"</p>
        </div>
    );
};


const SelectionStatus: React.FC<SelectionStatusProps> = ({ player, onClose }) => {
  const thoughts = getSelectorThoughts(player);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="glass-card w-full max-w-lg">
        <div className="flex justify-between items-center p-4 border-b border-slate-700">
          <h2 className="text-2xl font-bold text-amber-400">Selector's Hub</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-3xl leading-none">&times;</button>
        </div>
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
            <StatusCategory 
                title={`${player.state} State Team`}
                chance={thoughts.state.chance}
                text={thoughts.state.text}
            />
            <StatusCategory 
                title="Franchise League Contract"
                chance={thoughts.franchise.chance}
                text={thoughts.franchise.text}
            />
            <StatusCategory 
                title={`National Team (${player.country})`}
                chance={thoughts.national.chance}
                text={thoughts.national.text}
            />
            <StatusCategory 
                title="T20 World Cup Squad"
                chance={thoughts.t20worldcup.chance}
                text={thoughts.t20worldcup.text}
            />
        </div>
         <div className="p-4 border-t border-slate-700 text-right">
            <button
                onClick={onClose}
                className="bg-amber-600 hover:bg-amber-500 text-slate-900 font-bold py-2 px-4 rounded-lg transition-colors"
            >
                Close
            </button>
        </div>
      </div>
    </div>
  );
};

export default SelectionStatus;
