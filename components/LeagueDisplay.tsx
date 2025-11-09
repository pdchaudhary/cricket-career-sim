import React from 'react';
import { League, Team } from '../types';

interface LeagueDisplayProps {
    league: League;
    playerTeam: Team;
}

const LeagueDisplay: React.FC<LeagueDisplayProps> = ({ league, playerTeam }) => {
    const nextFixture = league.fixtures.find(f => !f.played && (f.homeTeam.id === playerTeam.id || f.awayTeam.id === playerTeam.id));
    const opponent = nextFixture ? (nextFixture.homeTeam.id === playerTeam.id ? nextFixture.awayTeam : nextFixture.homeTeam) : null;

    return (
        <div className="glass-card p-6">
            <h3 className="text-xl font-bold text-amber-400 border-b border-slate-700 pb-3 mb-4">{league.name}</h3>
            
            {opponent ? (
                <div className="mb-6 bg-slate-900/50 p-4 rounded-lg border border-slate-700">
                    <p className="text-sm text-slate-400 text-center uppercase tracking-wider">Next Match</p>
                    <div className="flex justify-around items-center mt-2">
                        <span className="text-lg font-semibold text-amber-400 text-center">{playerTeam.name}</span>
                        <span className="text-slate-500 font-bold">vs</span>
                        <span className="text-lg font-semibold text-white text-center">{opponent.name}</span>
                    </div>
                </div>
            ) : (
                 <div className="mb-6 bg-slate-900/50 p-4 rounded-lg">
                    <p className="text-lg font-semibold text-white text-center">Season Finished</p>
                </div>
            )}

            <div>
                <h4 className="text-lg font-semibold text-white mb-3">League Table</h4>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-slate-300">
                        <thead className="text-xs text-amber-400 uppercase bg-slate-800/50">
                            <tr>
                                <th scope="col" className="px-4 py-3">Pos</th>
                                <th scope="col" className="px-4 py-3">Team</th>
                                <th scope="col" className="px-4 py-3 text-center">P</th>
                                <th scope="col" className="px-4 py-3 text-center">W</th>
                                <th scope="col" className="px-4 py-3 text-center">L</th>
                                <th scope="col" className="px-4 py-3 text-center">Pts</th>
                            </tr>
                        </thead>
                        <tbody>
                            {league.table.map((entry, index) => (
                                <tr key={entry.teamId} className={`border-b border-slate-800 ${entry.teamId === playerTeam.id ? 'bg-amber-800/20' : 'odd:bg-slate-900/20 even:bg-slate-800/20'}`}>
                                    <td className="px-4 py-2 font-medium">{index + 1}</td>
                                    <td className={`px-4 py-2 font-semibold ${entry.teamId === playerTeam.id ? 'text-amber-400' : 'text-white'}`}>{entry.teamName}</td>
                                    <td className="px-4 py-2 text-center">{entry.played}</td>
                                    <td className="px-4 py-2 text-center">{entry.wins}</td>
                                    <td className="px-4 py-2 text-center">{entry.losses}</td>
                                    <td className="px-4 py-2 text-center font-bold">{entry.points}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default LeagueDisplay;