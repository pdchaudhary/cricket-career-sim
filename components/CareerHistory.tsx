
import React from 'react';
import { Player } from '../types';
import { TrophyIcon } from './icons/StatIcons';

interface CareerHistoryProps {
  player: Player;
  onClose: () => void;
}

const CareerHistory: React.FC<CareerHistoryProps> = ({ player, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="glass-card w-full max-w-4xl">
        <div className="flex justify-between items-center p-4 border-b border-slate-700">
          <h2 className="text-2xl font-bold text-amber-400">Career History</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-3xl leading-none">&times;</button>
        </div>
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {player.careerHistory.length === 0 ? (
            <p className="text-slate-400 text-center py-10">Your professional career is just beginning. Complete a season to see your history here.</p>
          ) : (
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-slate-300">
                    <thead className="text-xs text-amber-400 uppercase bg-slate-800/50">
                        <tr>
                            <th scope="col" className="px-4 py-3">Season</th>
                            <th scope="col" className="px-4 py-3">Team</th>
                            <th scope="col" className="px-4 py-3">Level</th>
                            <th scope="col" className="px-4 py-3 text-center">Runs</th>
                            <th scope="col" className="px-4 py-3 text-center">Wickets</th>
                            <th scope="col" className="px-4 py-3">Achievements</th>
                        </tr>
                    </thead>
                    <tbody>
                        {player.careerHistory.map((season) => (
                            <tr key={season.season} className="border-b border-slate-800 hover:bg-slate-800/50">
                                <td className="px-4 py-3 font-medium">{season.season}</td>
                                <td className="px-4 py-3">{season.teamName}</td>
                                <td className="px-4 py-3 capitalize">{season.tier}</td>
                                <td className="px-4 py-3 text-center font-semibold">{season.runs}</td>
                                <td className="px-4 py-3 text-center font-semibold">{season.wickets}</td>
                                <td className="px-4 py-3 text-amber-400">{season.awards.join(', ') || '-'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
          )}

           {player.careerStats.awards.length > 0 && (
            <div className="mt-6 pt-4 border-t border-slate-700">
                <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                    <TrophyIcon />
                    Major Honors
                </h3>
                <p className="text-slate-300">{player.careerStats.awards.join(', ')}</p>
            </div>
           )}
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

export default CareerHistory;
