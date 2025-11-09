
import React, { useState, useEffect } from 'react';
import { Player, PlayerRole, PlayerSkills, PlayerAttributes } from '../types';
import { initialPlayer, ROLES, LOCATIONS } from '../constants';

interface PlayerCreationProps {
  onStart: (player: Player) => void;
}

const SkillInput: React.FC<{
  label: string;
  value: number;
  onChange: (value: number) => void;
}> = ({ label, value, onChange }) => (
    <div>
        <label htmlFor={label} className="block text-sm font-medium text-slate-300">{label}: <span className="font-bold text-amber-400">{value}</span></label>
        <input
            id={label}
            type="range"
            min="10"
            max="70"
            value={value}
            onChange={(e) => onChange(parseInt(e.target.value, 10))}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
        />
    </div>
);

const PlayerCreation: React.FC<PlayerCreationProps> = ({ onStart }) => {
  const [player, setPlayer] = useState<Player>(initialPlayer);
  const [points, setPoints] = useState(150);
  const [states, setStates] = useState<string[]>([]);
  const [districts, setDistricts] = useState<string[]>([]);

  useEffect(() => {
    if (player.country && LOCATIONS[player.country]) {
      const countryStates = Object.keys(LOCATIONS[player.country]);
      setStates(countryStates);
      setPlayer(p => ({ ...p, state: '', district: '' }));
    } else {
      setStates([]);
      setDistricts([]);
    }
  }, [player.country]);

  useEffect(() => {
    if (player.state && LOCATIONS[player.country]?.[player.state]) {
      const stateDistricts = LOCATIONS[player.country][player.state];
      setDistricts(stateDistricts);
      setPlayer(p => ({ ...p, district: '' }));
    } else {
      setDistricts([]);
    }
  }, [player.state]);

  const handleSkillChange = (
      category: 'batting' | 'bowling', 
      skill: keyof PlayerSkills['batting'] | keyof PlayerSkills['bowling'], 
      value: number
    ) => {
    const oldValue = (player.skills[category] as any)[skill];
    const diff = value - oldValue;
    if (points - diff >= 0) {
      setPlayer(prev => ({ 
          ...prev, 
          skills: { 
              ...prev.skills, 
              [category]: {
                  ...prev.skills[category],
                  [skill]: value
              }
            } 
        }));
      setPoints(prev => prev - diff);
    }
  };

   const handleSingleSkillChange = (skill: 'fielding' | 'fitness', value: number) => {
    const oldValue = player.skills[skill];
    const diff = value - oldValue;
    if (points - diff >= 0) {
      setPlayer(prev => ({ ...prev, skills: { ...prev.skills, [skill]: value } }));
      setPoints(prev => prev - diff);
    }
  };

  const handleAttributeChange = (attribute: keyof PlayerAttributes, value: number) => {
      const oldValue = player.attributes[attribute];
      const diff = value - oldValue;
      if (points - diff >= 0) {
        setPlayer(prev => ({ ...prev, attributes: { ...prev.attributes, [attribute]: value } }));
        setPoints(prev => prev - diff);
      }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!player.name.trim() || !player.country || !player.state || !player.district) {
        alert('Please fill in all details, including name and location.');
        return;
    }
    onStart(player);
  };
  
  const isFormComplete = player.name.trim() !== '' && player.country !== '' && player.state !== '' && player.district !== '';

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-3xl glass-card p-8">
        <h1 className="text-4xl font-bold text-center text-amber-400 mb-2">Create Your Cricketer</h1>
        <p className="text-center text-slate-400 mb-8">Define your legacy from the very beginning.</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-300">Player Name</label>
              <input
                id="name"
                type="text"
                value={player.name}
                onChange={(e) => setPlayer({ ...player, name: e.target.value })}
                className="mt-1 block w-full bg-slate-900/50 border-slate-700 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                required
              />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="country" className="block text-sm font-medium text-slate-300">Country</label>
                <select id="country" value={player.country} onChange={(e) => setPlayer({ ...player, country: e.target.value })} className="mt-1 block w-full bg-slate-900/50 border-slate-700 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500" required>
                    <option value="">Select Country</option>
                    {Object.keys(LOCATIONS).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="state" className="block text-sm font-medium text-slate-300">State / Region</label>
                <select id="state" value={player.state} onChange={(e) => setPlayer({ ...player, state: e.target.value })} className="mt-1 block w-full bg-slate-900/50 border-slate-700 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500" required disabled={!player.country}>
                    <option value="">Select State</option>
                    {states.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="district" className="block text-sm font-medium text-slate-300">District / City</label>
                <select id="district" value={player.district} onChange={(e) => setPlayer({ ...player, district: e.target.value })} className="mt-1 block w-full bg-slate-900/50 border-slate-700 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500" required disabled={!player.state}>
                    <option value="">Select District</option>
                    {districts.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300">Player Role</label>
            <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-4">
              {ROLES.map(role => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setPlayer({ ...player, role })}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 border-2 ${player.role === role ? 'bg-amber-500 text-slate-900 border-amber-500 scale-105' : 'bg-slate-700 border-slate-600 hover:bg-slate-600 hover:border-slate-500'}`}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>
          <div className="bg-slate-900/50 p-6 rounded-lg">
            <h2 className="text-lg font-semibold text-slate-200">Distribute Skill Points</h2>
            <p className="text-sm text-slate-400">Remaining Points: <span className="font-bold text-amber-400 text-lg">{points}</span></p>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                <div className="space-y-3">
                    <h3 className="font-semibold text-slate-300 border-b border-slate-700 pb-1 mb-2">Batting</h3>
                    <SkillInput label="Timing" value={player.skills.batting.timing} onChange={(v) => handleSkillChange('batting', 'timing', v)} />
                    <SkillInput label="Power" value={player.skills.batting.power} onChange={(v) => handleSkillChange('batting', 'power', v)} />
                    <SkillInput label="Running" value={player.skills.batting.running} onChange={(v) => handleSkillChange('batting', 'running', v)} />
                </div>
                 <div className="space-y-3">
                    <h3 className="font-semibold text-slate-300 border-b border-slate-700 pb-1 mb-2">Bowling</h3>
                    <SkillInput label="Pace" value={player.skills.bowling.pace} onChange={(v) => handleSkillChange('bowling', 'pace', v)} />
                    <SkillInput label="Spin" value={player.skills.bowling.spin} onChange={(v) => handleSkillChange('bowling', 'spin', v)} />
                    <SkillInput label="Accuracy" value={player.skills.bowling.accuracy} onChange={(v) => handleSkillChange('bowling', 'accuracy', v)} />
                </div>
                 <div className="space-y-3">
                    <h3 className="font-semibold text-slate-300 border-b border-slate-700 pb-1 mb-2">Physical</h3>
                    <SkillInput label="Fielding" value={player.skills.fielding} onChange={(v) => handleSingleSkillChange('fielding', v)} />
                    <SkillInput label="Fitness" value={player.skills.fitness} onChange={(v) => handleSingleSkillChange('fitness', v)} />
                </div>
                <div className="space-y-3">
                    <h3 className="font-semibold text-slate-300 border-b border-slate-700 pb-1 mb-2">Mental</h3>
                    <SkillInput label="Aggression" value={player.attributes.aggression} onChange={(v) => handleAttributeChange('aggression', v)} />
                    <SkillInput label="Temperament" value={player.attributes.temperament} onChange={(v) => handleAttributeChange('temperament', v)} />
                    <SkillInput label="Pressure Handling" value={player.attributes.pressureHandling} onChange={(v) => handleAttributeChange('pressureHandling', v)} />
                </div>
            </div>
          </div>
          <button
            type="submit"
            className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-4 rounded-lg text-lg transition-all transform hover:scale-105 disabled:bg-slate-700 disabled:hover:scale-100 disabled:cursor-not-allowed disabled:text-slate-400"
            disabled={points > 0 || !isFormComplete}
          >
            {points > 0 ? `Assign all ${points} points` : !isFormComplete ? 'Complete all fields' : 'Start Career'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PlayerCreation;
