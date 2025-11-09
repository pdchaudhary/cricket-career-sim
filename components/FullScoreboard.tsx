
import React from 'react';
import { Player, BattingEntry, BowlingEntry } from '../types';
import { TrophyIcon } from './icons/StatIcons';

interface FullScoreboardProps {
    lastMatchResult: NonNullable<Player['lastMatchResult']>;
    playerTeamName: string;
    playerName: string;
}

const BattingTable: React.FC<{ battingData: BattingEntry[], playerName: string }> = ({ battingData, playerName }) => (
    <table className="w-full text-sm text-left text-slate-300">
        <thead className="text-xs text-amber-400/80 uppercase">
            <tr>
                <th scope="col" className="px-4 py-2">Batsman</th>
                <th scope="col" className="px-2 py-2 text-center">R</th>
                <th scope="col" className="px-2 py-2 text-center">B</th>
            </tr>
        </thead>
        <tbody>
            {[...battingData].sort((a,b) => a.position - b.position).map((entry, index) => (
                <tr key={index} className={`border-b border-slate-800 last:border-b-0 ${entry.playerName === playerName ? 'bg-amber-900/30 text-amber-300' : ''}`}>
                    <td className="px-4 py-1.5 font-medium">{entry.playerName} {!entry.isOut && <span className="text-xs text-green-400"> not out</span>}</td>
                    <td className="px-2 py-1.5 text-center font-bold">{entry.runs}</td>
                    <td className="px-2 py-1.5 text-center">{entry.balls}</td>
                </tr>
            ))}
        </tbody>
    </table>
);

const BowlingTable: React.FC<{ bowlingData: BowlingEntry[], playerName: string }> = ({ bowlingData, playerName }) => (
     <table className="w-full text-sm text-left text-slate-300 mt-2">
        <thead className="text-xs text-amber-400/80 uppercase">
            <tr>
                <th scope="col" className="px-4 py-2">Bowler</th>
                <th scope="col" className="px-2 py-2 text-center">O</th>
                <th scope="col" className="px-2 py-2 text-center">R</th>
                <th scope="col" className="px-2 py-2 text-center">W</th>
            </tr>
        </thead>
        <tbody>
            {bowlingData.filter(b => b.overs > 0).map((entry, index) => (
                <tr key={index} className={`border-b border-slate-800 last:border-b-0 ${entry.playerName === playerName ? 'bg-amber-900/30 text-amber-300' : ''}`}>
                    <td className="px-4 py-1.5 font-medium">{entry.playerName}</td>
                    <td className="px-2 py-1.5 text-center">{entry.overs}</td>
                    <td className="px-2 py-1.5 text-center">{entry.runs}</td>
                    <td className="px-2 py-1.5 text-center font-bold">{entry.wickets}</td>
                </tr>
            ))}
        </tbody>
    </table>
);

const FullScoreboard: React.FC<FullScoreboardProps> = ({ lastMatchResult, playerTeamName, playerName }) => {
    const { 
        opponentName,
        playerTeamScore, 
        opponentScore,
        playerTeamBatting,
        opponentTeamBowling,
        opponentTeamBatting,
        playerTeamBowling,
        result,
        playerOfTheMatch
    } = lastMatchResult;

    const isWin = result === 'win';
    
    return (
        <div className="space-y-6">
            <div className={`text-center p-3 rounded-lg ${isWin ? 'bg-green-500/80' : 'bg-red-500/80'} shadow-lg`}>
                 <p className="font-bold text-white text-lg tracking-wider">{isWin ? 'VICTORY' : 'DEFEAT'}</p>
                 <p className="text-sm text-white/90">{lastMatchResult.matchSummary}</p>
            </div>
            
            {playerOfTheMatch && (
                <div className="text-center p-3 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-900 shadow-lg">
                    <p className="font-bold flex items-center justify-center gap-2 text-lg">
                        <TrophyIcon /> Player of the Match: {playerOfTheMatch}
                    </p>
                </div>
            )}
            
            <div className="glass-card p-4">
                <div className="flex justify-between items-baseline mb-3 border-b border-slate-700 pb-2">
                    <h3 className="text-xl font-bold text-white">{playerTeamName} Innings</h3>
                    <span className="font-mono text-2xl text-white font-semibold">{playerTeamScore}</span>
                </div>
                <BattingTable battingData={playerTeamBatting} playerName={playerName} />
                <h4 className="text-xs text-slate-400 mt-4 mb-1 uppercase font-semibold border-t border-slate-700 pt-2">Bowling</h4>
                <BowlingTable bowlingData={opponentTeamBowling} playerName={playerName} />
            </div>

            <div className="glass-card p-4">
                <div className="flex justify-between items-baseline mb-3 border-b border-slate-700 pb-2">
                    <h3 className="text-xl font-bold text-white">{opponentName} Innings</h3>
                    <span className="font-mono text-2xl text-white font-semibold">{opponentScore}</span>
                </div>
                <BattingTable battingData={opponentTeamBatting} playerName={playerName} />
                 <h4 className="text-xs text-slate-400 mt-4 mb-1 uppercase font-semibold border-t border-slate-700 pt-2">Bowling</h4>
                <BowlingTable bowlingData={playerTeamBowling} playerName={playerName} />
            </div>
        </div>
    );
};

export default FullScoreboard;
