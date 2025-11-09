import React from 'react';
import { Player, League, TopPlayerStat } from '../types';
import { BatIcon, BallIcon } from './icons/StatIcons';

interface SeasonSummaryProps {
    player: Player;
    league: League;
}

// Fix: Add playerName to props to resolve scope issue and highlight the current player.
const Leaderboard: React.FC<{ title: string; data: TopPlayerStat[]; playerOwed: boolean; icon: React.ReactNode; playerName: string }> = ({ title, data, playerOwed, icon, playerName }) => (
    <div>
        <h4 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">{icon} {title}</h4>
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-300">
                <thead className="text-xs text-amber-400 uppercase bg-slate-700">
                    <tr>
                        <th scope="col" className="px-4 py-2">Player</th>
                        <th scope="col" className="px-4 py-2">Team</th>
                        <th scope="col" className="px-4 py-2 text-right">
                            {playerOwed ? 'Runs' : 'Wickets'}
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {data.map((entry, index) => (
                        // Fix: Error on line 26 - 'player' was not in scope. Use 'playerName' prop instead.
                        <tr key={index} className={`border-b border-slate-700 ${entry.playerName === playerName ? 'bg-slate-900' : ''}`}>
                            {/* Fix: Error on line 27 - 'player' was not in scope. Use 'playerName' prop instead. */}
                            <td className={`px-4 py-2 font-semibold ${entry.playerName === playerName ? 'text-amber-400' : 'text-white'}`}>{entry.playerName}</td>
                            <td className="px-4 py-2">{entry.teamName}</td>
                            <td className="px-4 py-2 text-right font-bold">{entry.stat}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
);


const SeasonSummary: React.FC<SeasonSummaryProps> = ({ player, league }) => {
    const { seasonSummary } = player;
    if (!seasonSummary) return null;

    return (
        <div>
            <h2 className="text-3xl font-bold text-amber-400 mb-4">{league.name} - Summary</h2>
            <div className="space-y-8">
                {/* Fix: Pass the player's name to the Leaderboard component. */}
                <Leaderboard title="Top Run Scorers" data={seasonSummary.topRunScorers} playerOwed={true} icon={<BatIcon />} playerName={player.name} />
                <Leaderboard title="Top Wicket Takers" data={seasonSummary.topWicketTakers} playerOwed={false} icon={<BallIcon />} playerName={player.name} />
            </div>
        </div>
    );
};

export default SeasonSummary;
