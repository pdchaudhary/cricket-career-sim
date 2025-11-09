
import React from 'react';
import { GameEvent, Choice, Player } from '../types';
import SeasonSummary from './SeasonSummary';
import FullScoreboard from './FullScoreboard';

interface EventDisplayProps {
  event: GameEvent;
  player: Player;
  onChoice: (choice: Choice) => void;
}

const EventDisplay: React.FC<EventDisplayProps> = ({ event, player, onChoice }) => {
  if (event.id === 'SEASON_SUMMARY' && player.seasonSummary && player.currentLeague) {
    return (
        <div className="glass-card p-8 h-full flex flex-col">
            <SeasonSummary player={player} league={player.currentLeague} />
            <div className="mt-8">
                 {event.choices.map((choice, index) => (
                    <button
                        key={index}
                        onClick={() => onChoice(choice)}
                        className="w-full bg-green-600 hover:bg-green-500 text-white font-semibold py-3 px-4 rounded-lg text-center transition-all duration-200 ease-in-out transform hover:scale-105 shadow-lg"
                    >
                        {choice.text}
                    </button>
                ))}
            </div>
        </div>
    );
  }

  if (event.id === 'MATCH_RESULT' && player.lastMatchResult) {
    return (
        <div className="glass-card p-6 h-full flex flex-col" style={{maxHeight: 'calc(100vh - 3rem)'}}>
            <h2 className="text-3xl font-bold text-amber-400 mb-2 px-2">{event.title}</h2>
            <p className="text-slate-300 text-lg mb-4 px-2">{event.description(player)}</p>
            
            <div className="flex-grow overflow-y-auto pr-2">
                 <FullScoreboard 
                    lastMatchResult={player.lastMatchResult} 
                    playerTeamName={player.team?.name || 'Your Team'}
                    playerName={player.name}
                 />
            </div>
            
            <div className="mt-6 pt-6 border-t border-slate-700">
                {event.choices.map((choice, index) => (
                    <button
                        key={index}
                        onClick={() => onChoice(choice)}
                        className="w-full bg-slate-700 hover:bg-amber-600 hover:text-slate-900 text-white font-semibold py-3 px-4 rounded-lg text-center transition-all duration-200 ease-in-out transform hover:scale-105 shadow-md"
                    >
                        {choice.text}
                    </button>
                ))}
            </div>
        </div>
    );
  }

  return (
    <div className="glass-card p-8 h-full flex flex-col">
      <h2 className="text-4xl font-bold text-amber-400 mb-4">{event.title}</h2>
      <p className="text-slate-300 text-lg mb-8 flex-grow whitespace-pre-wrap">{event.description(player)}</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {event.choices
            .filter(choice => choice.condition ? choice.condition(player) : true)
            .map((choice, index) => (
          <button
            key={index}
            onClick={() => onChoice(choice)}
            className="w-full bg-slate-800/80 border border-slate-700 hover:border-amber-500 hover:bg-slate-700/80 text-white font-semibold py-4 px-5 rounded-lg text-left transition-all duration-200 ease-in-out transform hover:scale-105 shadow-md"
          >
            {choice.text}
          </button>
        ))}
      </div>
    </div>
  );
};

export default EventDisplay;
