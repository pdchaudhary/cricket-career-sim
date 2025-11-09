import React, { useState } from 'react';
import { Player, GameEvent, Choice } from '../types';
import PlayerStats from './PlayerStats';
import EventDisplay from './EventDisplay';
import LeagueDisplay from './LeagueDisplay';
import SelectionStatus from './SelectionStatus';
import CareerHistory from './CareerHistory';

interface GameScreenProps {
  player: Player;
  currentEvent: GameEvent;
  onChoice: (choice: Choice) => void;
}

const GameScreen: React.FC<GameScreenProps> = ({ player, currentEvent, onChoice }) => {
  const [isSelectionModalOpen, setSelectionModalOpen] = useState(false);
  const [isHistoryModalOpen, setHistoryModalOpen] = useState(false);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 max-w-screen-2xl mx-auto">
      {isSelectionModalOpen && (
        <SelectionStatus player={player} onClose={() => setSelectionModalOpen(false)} />
      )}
      {isHistoryModalOpen && (
        <CareerHistory player={player} onClose={() => setHistoryModalOpen(false)} />
      )}
      <div className="lg:col-span-1">
        <div className="sticky top-6 space-y-6">
          <PlayerStats player={player} />
          <div className="space-y-4">
            <button
              onClick={() => setSelectionModalOpen(true)}
              className="w-full glass-card text-white font-bold py-3 px-4 text-lg transition-all transform hover:scale-105 hover:bg-indigo-600/50"
            >
              Selection Status
            </button>
            <button
              onClick={() => setHistoryModalOpen(true)}
              className="w-full glass-card text-white font-bold py-3 px-4 text-lg transition-all transform hover:scale-105 hover:bg-slate-600/50"
            >
              Career History
            </button>
          </div>
        </div>
      </div>
      <div className="lg:col-span-2">
        <EventDisplay event={currentEvent} onChoice={onChoice} player={player} />
      </div>
      <div className="lg:col-span-1">
        <div className="sticky top-6">
          {player.currentLeague && player.team && (
            <LeagueDisplay league={player.currentLeague} playerTeam={player.team} />
          )}
        </div>
      </div>
    </div>
  );
};

export default GameScreen;