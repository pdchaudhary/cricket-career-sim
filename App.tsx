
import React, { useState, useCallback } from 'react';
import PlayerCreation from './components/PlayerCreation';
import GameScreen from './components/GameScreen';
import MatchScreen from './components/MatchScreen';
import { Player, GameState, GameEvent, Choice, LiveMatchState, InningsData, BattingEntry, BowlingEntry } from './types';
import { gameEvents, initialPlayer, updateLeagueTable, checkMilestones } from './constants';
import { TrophyIcon, BatIcon, BallIcon, MoneyIcon } from './components/icons/StatIcons';


const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.CREATION);
  const [player, setPlayer] = useState<Player | null>(null);
  const [currentEventId, setCurrentEventId] = useState<string>('DISTRICT_TRIAL');
  const [milestone, setMilestone] = useState<string | null>(null);
  const [liveMatch, setLiveMatch] = useState<LiveMatchState | null>(null);

  const startGame = (newPlayer: Player) => {
    setPlayer(newPlayer);
    setGameState(GameState.IN_GAME);
    setCurrentEventId('DISTRICT_TRIAL');
  };

  const handleChoice = useCallback((choice: Choice) => {
    if (!player) return;

    const { updatedPlayer, nextEventId, newMilestone, newGameState, liveMatchData } = choice.effect(player);
    
    setPlayer(updatedPlayer);

    if (newGameState) {
        setGameState(newGameState);
    }
    if (liveMatchData) {
        setLiveMatch(liveMatchData);
    }

    if (newMilestone) {
        setMilestone(newMilestone);
        setTimeout(() => setMilestone(null), 4000);
    }

    if (nextEventId) {
      if (gameEvents[nextEventId]) {
        setCurrentEventId(nextEventId);
      } else if (nextEventId.startsWith('RETIRE')) {
        setGameState(GameState.RETIRED);
        setCurrentEventId(nextEventId);
      }
    }
  }, [player]);

  const handleMatchEnd = (finalMatchState: LiveMatchState) => {
    if (!player || !player.team || !player.currentLeague) return;

    // 1. Determine winner and loser
    const playerTeamWon = finalMatchState.resultMessage.includes(player.team.name);
    const result: 'win' | 'loss' = playerTeamWon ? 'win' : 'loss';
    const winningTeamId = playerTeamWon ? player.team.id : finalMatchState.opponentTeam.id;
    const losingTeamId = playerTeamWon ? finalMatchState.opponentTeam.id : player.team.id;

    // 2. Extract final scorecards and stats
    const innings2Data: InningsData = {
        battingCard: finalMatchState.battingOrder,
        bowlingCard: finalMatchState.bowlingOrder,
        totalScore: finalMatchState.score,
        wickets: finalMatchState.wickets,
        overs: finalMatchState.overs
    };
    const finalInnings1 = finalMatchState.innings1Data!;
    const finalInnings2 = innings2Data;

    const playerTeamBatFirst = finalMatchState.innings1Data!.battingCard.some(b => b.playerName === player.name);
    
    const playerTeamInnings = playerTeamBatFirst ? finalInnings1 : finalInnings2;
    const opponentInnings = playerTeamBatFirst ? finalInnings2 : finalInnings1;

    // 3. Calculate player's personal contribution
    const playerBattingStats = [...playerTeamInnings.battingCard].find(b => b.playerName === player.name);
    const playerBowlingStats = [...playerTeamInnings.bowlingCard, ...opponentInnings.bowlingCard].find(b => b.playerName === player.name);
    const runsScored = playerBattingStats?.runs ?? 0;
    const wicketsTaken = playerBowlingStats?.wickets ?? 0;
    
    // 4. Calculate Player of the Match
    let playerOfTheMatch = '';
    let highestScore = -1;

    const allPerformances = [
        ...playerTeamInnings.battingCard.map(p => ({ ...p, teamId: player.team!.id, wickets: 0 })),
        ...opponentInnings.battingCard.map(p => ({ ...p, teamId: finalMatchState.opponentTeam.id, wickets: 0 })),
    ].reduce((acc, p) => {
        if (!acc[p.playerName]) {
            acc[p.playerName] = { runs: 0, wickets: 0, teamId: p.teamId };
        }
        acc[p.playerName].runs += p.runs;
        return acc;
    }, {} as Record<string, { runs: number, wickets: number, teamId: string }>);

    [
        ...playerTeamInnings.bowlingCard,
        ...opponentInnings.bowlingCard,
    ].forEach(p => {
        if (!allPerformances[p.playerName]) {
            const teamId = playerTeamInnings.bowlingCard.some(bowler => bowler.playerName === p.playerName) ? player.team!.id : finalMatchState.opponentTeam.id;
            allPerformances[p.playerName] = { runs: 0, wickets: 0, teamId: teamId };
        }
        allPerformances[p.playerName].wickets += p.wickets;
    });

    for(const [playerName, stats] of Object.entries(allPerformances)) {
        let score = stats.runs + (stats.wickets * 25);
        if (stats.teamId === winningTeamId) {
            score += 10; // Winning team bonus
        }
        if (score > highestScore) {
            highestScore = score;
            playerOfTheMatch = playerName;
        }
    }

    // 5. Create lastMatchResult for scoreboard
    const lastMatchResult = {
        opponentName: finalMatchState.opponentTeam.name,
        result,
        playerRuns: runsScored,
        playerWickets: wicketsTaken,
        playerTeamScore: `${playerTeamInnings.totalScore}/${playerTeamInnings.wickets}`,
        opponentScore: `${opponentInnings.totalScore}/${opponentInnings.wickets}`,
        matchSummary: finalMatchState.resultMessage,
        playerTeamBatting: playerTeamInnings.battingCard,
        opponentTeamBowling: opponentInnings.bowlingCard,
        opponentTeamBatting: opponentInnings.battingCard,
        playerTeamBowling: playerTeamInnings.bowlingCard,
        playerOfTheMatch,
    };
    
    // 6. Update player stats
    const winBonus = playerTeamWon ? 5 : -5;
    const performanceBonus = Math.floor((runsScored / 10) + (wicketsTaken * 5) - 2);
    const clamp = (val: number) => Math.max(0, Math.min(val, 100));
    const potmAwardIncrement = playerOfTheMatch === player.name ? 1 : 0;

    // Financial Calculation
    let earnings = 1500 + player.reputation * 20; // Base match fee
    if (runsScored >= 100) earnings += 500;
    else if (runsScored >= 50) earnings += 200;
    if (wicketsTaken >= 5) earnings += 400;
    else if (wicketsTaken >= 3) earnings += 250;
    if (potmAwardIncrement > 0) earnings += 1000;

    let playerAfterMatch: Player = {
        ...player,
        liveMatch: null,
        lastMatchResult,
        attributes: {
            ...player.attributes,
            playerHappiness: clamp(player.attributes.playerHappiness + winBonus + performanceBonus),
            teamHappiness: clamp(player.attributes.teamHappiness + (playerTeamWon ? 7 : -3)),
            managerHappiness: clamp(player.attributes.managerHappiness + winBonus + performanceBonus),
        },
        careerStats: {
            ...player.careerStats,
            runs: player.careerStats.runs + runsScored,
            wickets: player.careerStats.wickets + wicketsTaken,
            matches: player.careerStats.matches + 1,
            potmAward: player.careerStats.potmAward + potmAwardIncrement,
        },
        seasonStats: {
            runs: player.seasonStats.runs + runsScored,
            wickets: player.seasonStats.wickets + wicketsTaken,
        },
        finance: player.finance + earnings,
        energy: player.energy - 25,
    };
    
    if (potmAwardIncrement > 0) {
        playerAfterMatch.reputation += 5;
    }

    // 7. Update league table
    const updatedTable = updateLeagueTable(player.currentLeague.table, winningTeamId, losingTeamId);
    const updatedFixtures = player.currentLeague.fixtures.map(f => {
        if((f.homeTeam.id === winningTeamId && f.awayTeam.id === losingTeamId) || (f.homeTeam.id === losingTeamId && f.awayTeam.id === winningTeamId)){
            return { ...f, played: true, winnerId: winningTeamId };
        }
        return f;
    });

    const updatedLeague = { ...player.currentLeague, table: updatedTable, fixtures: updatedFixtures };
    playerAfterMatch = { ...playerAfterMatch, currentLeague: updatedLeague };
    
    // 8. Check for milestones
    const { player: milestonePlayer, newMilestone } = checkMilestones(playerAfterMatch);
     if (newMilestone) {
        setMilestone(newMilestone);
        setTimeout(() => setMilestone(null), 4000);
    } else if (potmAwardIncrement > 0) {
        setMilestone("Player of the Match!");
        setTimeout(() => setMilestone(null), 4000);
    }
    playerAfterMatch = milestonePlayer;

    // 9. Set final states
    setPlayer(playerAfterMatch);
    setLiveMatch(null);
    setGameState(GameState.IN_GAME);
    setCurrentEventId('MATCH_RESULT');
  };

  const renderContent = () => {
    switch (gameState) {
      case GameState.CREATION:
        return <PlayerCreation onStart={startGame} />;
      case GameState.IN_GAME:
        if (player && gameEvents[currentEventId]) {
          const currentEvent: GameEvent = gameEvents[currentEventId];
          return <GameScreen player={player} currentEvent={currentEvent} onChoice={handleChoice} />;
        }
        return <div className="text-center p-8">Loading game...</div>;
      case GameState.IN_MATCH:
          if (player && liveMatch) {
              return <MatchScreen player={player} initialMatchState={liveMatch} onMatchEnd={handleMatchEnd} />;
          }
          return <div className="text-center p-8">Loading match...</div>;
      case GameState.RETIRED:
        if (player && gameEvents[currentEventId]) {
          const retirementEvent = gameEvents[currentEventId];
          const isLegend = currentEventId === 'RETIRE_LEGEND';
          return (
            <div className="flex flex-col items-center justify-center min-h-screen p-4">
              <div className="w-full max-w-4xl glass-card p-8 text-center">
                <TrophyIcon />
                <h1 className={`text-5xl font-bold ${isLegend ? 'text-amber-400' : 'text-slate-400'} mt-4 mb-2`}>{retirementEvent.title}</h1>
                <p className="text-xl text-slate-300 mb-8">{player.name}</p>

                <p className="text-lg text-slate-300 mb-10 max-w-3xl mx-auto">{retirementEvent.description(player)}</p>
                
                <div className="w-full max-w-4xl space-y-6 text-left">
                    <div className="bg-slate-900/50 p-6 rounded-lg shadow-inner">
                        <h2 className="text-2xl font-semibold text-white mb-4 text-center border-b border-slate-700 pb-2">Final Career Stats</h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 text-center">
                            <div className="flex flex-col items-center"><BatIcon /><p className="text-slate-400 mt-2">Runs</p><p className="text-2xl font-bold">{player.careerStats.runs.toLocaleString()}</p></div>
                            <div className="flex flex-col items-center"><BallIcon /><p className="text-slate-400 mt-2">Wickets</p><p className="text-2xl font-bold">{player.careerStats.wickets}</p></div>
                            <div className="flex flex-col items-center"><TrophyIcon /><p className="text-slate-400 mt-2">Matches</p><p className="text-2xl font-bold">{player.careerStats.matches}</p></div>
                            <div className="flex flex-col items-center"><TrophyIcon /><p className="text-slate-400 mt-2">POTM Awards</p><p className="text-2xl font-bold">{player.careerStats.potmAward}</p></div>
                            <div className="flex flex-col items-center"><p className="text-slate-400 mt-2">Reputation</p><p className="text-2xl font-bold">{player.reputation}</p></div>
                            <div className="flex flex-col items-center"><MoneyIcon /><p className="text-slate-400 mt-2">Finances</p><p className="text-2xl font-bold">${player.finance.toLocaleString()}</p></div>
                        </div>
                         {player.careerStats.awards.length > 0 && (
                            <div className="mt-6 text-center border-t border-slate-700 pt-4">
                                <p className="text-slate-400">Major Honors</p>
                                <p className="text-lg font-semibold text-amber-400">{player.careerStats.awards.join(', ')}</p>
                            </div>
                        )}
                    </div>

                    {player.careerHistory.length > 0 && (
                         <div className="bg-slate-900/50 p-6 rounded-lg shadow-inner">
                            <h2 className="text-2xl font-semibold text-white mb-4 text-center border-b border-slate-700 pb-2">Career History</h2>
                            <div className="overflow-x-auto">
                               <table className="w-full text-sm text-left text-slate-300">
                                    <thead className="text-xs text-amber-400 uppercase bg-slate-800">
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
                                                <td className="px-4 py-2 font-medium">{season.season}</td>
                                                <td className="px-4 py-2">{season.teamName}</td>
                                                <td className="px-4 py-2 capitalize">{season.tier}</td>
                                                <td className="px-4 py-2 text-center">{season.runs}</td>
                                                <td className="px-4 py-2 text-center">{season.wickets}</td>
                                                <td className="px-4 py-2">{season.awards.join(', ') || '-'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
              </div>
            </div>
          );
        }
        return <div className="text-center p-8">Your career has ended.</div>;
      default:
        return <div>Something went wrong.</div>;
    }
  };

  return (
    <div className="container mx-auto p-4 font-sans relative">
        {milestone && (
            <div className="fixed top-5 right-5 glass-card py-3 px-5 z-50 animate-fade-in-out">
                <h3 className="font-bold text-lg text-amber-400">Milestone Unlocked!</h3>
                <p className="text-slate-200">{milestone}</p>
            </div>
        )}
        {renderContent()}
    </div>
  );
};

export default App;
