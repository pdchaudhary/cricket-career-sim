import React from 'react';
import { Player } from '../types';
import { BatIcon, BallIcon, FieldIcon, FitnessIcon, ConfidenceIcon, FocusIcon, TeamworkIcon, TrophyIcon, MoneyIcon, PlayerHappinessIcon, TeamHappinessIcon, ManagerHappinessIcon, GearIcon } from './icons/StatIcons';
import { getEffectivePlayer, EQUIPMENT_CATALOG } from '../constants';

interface PlayerStatsProps {
  player: Player;
}

const StatBar: React.FC<{ value: number; colorFrom: string; colorTo: string; icon: React.ReactNode; label: string; boost?: number }> = ({ value, colorFrom, colorTo, icon, label, boost }) => (
    <div>
        <div className="flex justify-between items-center mb-1">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-300">
                {icon}
                <span>{label}</span>
            </div>
            <span className={`text-sm font-semibold text-slate-200`}>
                {value}
                {boost && boost > 0 ? <span className="text-green-400 ml-1">(+{boost})</span> : ''}
                <span className="text-slate-400">/100</span>
            </span>
        </div>
        <div className="w-full bg-slate-700/50 rounded-full h-2">
            <div className={`bg-gradient-to-r ${colorFrom} ${colorTo} h-2 rounded-full`} style={{ width: `${value}%` }}></div>
        </div>
    </div>
);

const SubSkillDisplay: React.FC<{ label: string; value: number; boost?: number }> = ({ label, value, boost = 0 }) => (
    <div className="flex justify-between text-sm text-slate-300 px-2 py-1">
        <span>{label}</span>
        <span className="font-semibold text-white">
            {value}
            {boost > 0 && <span className="text-green-400 ml-1">(+{boost})</span>}
        </span>
    </div>
);


const PlayerStats: React.FC<PlayerStatsProps> = ({ player }) => {
  const effectivePlayer = getEffectivePlayer(player);

  // FIX: The combined check for 'fielding' and 'fitness' with a generic key was confusing TypeScript's type inference,
  // leading to a misleading error elsewhere in the file. Separating the checks makes the types clearer.
  // FIX: Made the check for 'attributes' explicit to further help TypeScript's control flow analysis and resolve the misleading error.
  // FIX: Replaced the implementation with a more type-safe version that validates keys before access.
  // This resolves the downstream type inference issue that caused a misleading error.
  const getBoost = (category: keyof Player['skills'] | 'attributes', skill: string): number => {
    if (category === 'batting') {
        if (skill in player.skills.batting) {
            const key = skill as keyof typeof player.skills.batting;
            return effectivePlayer.skills.batting[key] - player.skills.batting[key];
        }
    }
    if (category === 'bowling') {
        if (skill in player.skills.bowling) {
            const key = skill as keyof typeof player.skills.bowling;
            return effectivePlayer.skills.bowling[key] - player.skills.bowling[key];
        }
    }
    if (category === 'fielding') {
        return effectivePlayer.skills.fielding - player.skills.fielding;
    }
    if (category === 'fitness') {
        return effectivePlayer.skills.fitness - player.skills.fitness;
    }
    if (category === 'attributes') {
      if (skill in player.attributes) {
        const key = skill as keyof typeof player.attributes;
        return effectivePlayer.attributes[key] - player.attributes[key];
      }
    }
    return 0;
  }


  return (
    <div className="glass-card p-6">
      <div className="text-center mb-6 border-b border-slate-700 pb-4 relative">
        <div 
            className="absolute inset-0 bg-repeat bg-center opacity-5" 
            style={{backgroundImage: "url('https://www.transparenttextures.com/patterns/leather.png')"}}
        ></div>
        <h2 className="text-3xl font-bold text-white tracking-tight">{player.name}</h2>
        <p className="text-md text-slate-400">{player.role} | {player.country}</p>
        {player.team && (
            <p className="text-lg font-semibold text-amber-400 mt-1">{player.team.name}</p>
        )}
      </div>
      
      <div className="space-y-5">
        <div>
            <h3 className="text-lg font-semibold text-amber-400 mb-2">Skills</h3>
            <div className="space-y-2 rounded-lg bg-slate-900/50 p-3">
                 <h4 className="font-semibold text-slate-200 flex items-center gap-2 mb-1"><BatIcon /> Batting</h4>
                 <SubSkillDisplay label="Timing" value={player.skills.batting.timing} boost={getBoost('batting', 'timing')} />
                 <SubSkillDisplay label="Power" value={player.skills.batting.power} boost={getBoost('batting', 'power')} />
                 <SubSkillDisplay label="Running" value={player.skills.batting.running} boost={getBoost('batting', 'running')} />
            </div>
             <div className="space-y-2 rounded-lg bg-slate-900/50 p-3 mt-2">
                 <h4 className="font-semibold text-slate-200 flex items-center gap-2 mb-1"><BallIcon/> Bowling</h4>
                 <SubSkillDisplay label="Pace" value={player.skills.bowling.pace} boost={getBoost('bowling', 'pace')} />
                 <SubSkillDisplay label="Spin" value={player.skills.bowling.spin} boost={getBoost('bowling', 'spin')} />
                 <SubSkillDisplay label="Accuracy" value={player.skills.bowling.accuracy} boost={getBoost('bowling', 'accuracy')} />
            </div>
            <div className="mt-3 space-y-3">
                <StatBar label="Fielding" value={player.skills.fielding} colorFrom="from-blue-500" colorTo="to-cyan-400" icon={<FieldIcon />} boost={getBoost('fielding', 'fielding')} />
                <StatBar label="Fitness" value={player.skills.fitness} colorFrom="from-yellow-500" colorTo="to-orange-400" icon={<FitnessIcon />} boost={getBoost('fitness', 'fitness')} />
            </div>
        </div>

        <div>
            <h3 className="text-lg font-semibold text-amber-400 mb-2">Attributes</h3>
            <div className="space-y-3">
                <StatBar label="Confidence" value={player.attributes.confidence} colorFrom="from-purple-500" colorTo="to-pink-500" icon={<ConfidenceIcon />} boost={getBoost('attributes', 'confidence')} />
                <StatBar label="Focus" value={player.attributes.focus} colorFrom="from-indigo-500" colorTo="to-blue-500" icon={<FocusIcon />} boost={getBoost('attributes', 'focus')} />
                <StatBar label="Pressure Handling" value={player.attributes.pressureHandling} colorFrom="from-cyan-500" colorTo="to-teal-400" icon={<FocusIcon />} boost={getBoost('attributes', 'pressureHandling')} />
                <StatBar label="Teamwork" value={player.attributes.teamwork} colorFrom="from-pink-500" colorTo="to-rose-500" icon={<TeamworkIcon />} />
            </div>
        </div>

        <div>
            <h3 className="text-lg font-semibold text-amber-400 mb-2">Morale</h3>
            <div className="space-y-3">
                <StatBar label="Player Happiness" value={player.attributes.playerHappiness} colorFrom="from-green-500" colorTo="to-lime-400" icon={<PlayerHappinessIcon />} />
                <StatBar label="Team Happiness" value={player.attributes.teamHappiness} colorFrom="from-teal-500" colorTo="to-cyan-400" icon={<TeamHappinessIcon />} />
                <StatBar label="Manager Happiness" value={player.attributes.managerHappiness} colorFrom="from-orange-500" colorTo="to-amber-400" icon={<ManagerHappinessIcon />} />
            </div>
        </div>
        
        <div>
            <h3 className="text-lg font-semibold text-amber-400 mb-2">Equipment</h3>
            <div className="space-y-1 text-sm text-slate-300 bg-slate-900/50 p-3 rounded-lg">
                {Object.entries(player.equipment).map(([type, id]) => (
                    <div key={type} className="flex justify-between items-center">
                        <span className="capitalize flex items-center gap-2 text-slate-400"><GearIcon/> {type}</span>
                        <span className="font-semibold text-slate-200 text-right">{EQUIPMENT_CATALOG[id].name}</span>
                    </div>
                ))}
            </div>
        </div>
        
        <div>
             <h3 className="text-lg font-semibold text-amber-400 mb-2">Career</h3>
            <div className="grid grid-cols-2 gap-4 text-slate-300 bg-slate-900/50 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-sm"><BatIcon /> <strong>Runs:</strong> {player.careerStats.runs}</div>
                <div className="flex items-center gap-2 text-sm"><BallIcon /> <strong>Wickets:</strong> {player.careerStats.wickets}</div>
                <div className="flex items-center gap-2 text-sm"><TrophyIcon /> <strong>Matches:</strong> {player.careerStats.matches}</div>
                <div className="flex items-center gap-2 text-sm"><TrophyIcon /> <strong>POTM:</strong> {player.careerStats.potmAward}</div>
                <div className="flex items-center gap-2 col-span-2 text-sm"><MoneyIcon /> <strong>Funds:</strong> ${player.finance.toLocaleString()}</div>
            </div>
            <div className="text-sm text-slate-300 text-center pt-4">
                <p>Batting Position: <span className="font-bold text-white text-base">#{player.battingPosition}</span></p>
                {player.isCaptain && <p className="font-bold text-amber-400 text-base">Team Captain</p>}
            </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerStats;