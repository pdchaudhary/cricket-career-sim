
import { Player, PlayerRole, GameEvent, Team, League, Fixture, LeagueTableEntry, SeasonSummary, TopPlayerStat, BattingEntry, BowlingEntry, SeasonHistoryEntry, ChoiceEffectResult, GameState, LiveMatchState, Equipment } from './types';

export const ROLES: PlayerRole[] = [
  PlayerRole.BATSMAN,
  PlayerRole.BOWLER,
  PlayerRole.ALL_ROUNDER,
  PlayerRole.WICKETKEEPER,
];

export const LOCATIONS: Record<string, Record<string, string[]>> = {
    'India': {
        'Gujarat': ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot'],
        'Maharashtra': ['Mumbai', 'Pune', 'Nagpur', 'Nashik'],
        'Karnataka': ['Bengaluru', 'Mysuru', 'Hubballi', 'Mangaluru'],
        'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli'],
    },
    'Australia': {
        'New South Wales': ['Sydney', 'Newcastle', 'Wollongong'],
        'Victoria': ['Melbourne', 'Geelong', 'Ballarat'],
        'Queensland': ['Brisbane', 'Gold Coast', 'Sunshine Coast'],
    }
};

const DISTRICT_TEAM_SUFFIXES = ['Challengers', 'Warriors', 'Strikers', 'Lions', 'Eagles', 'Panthers', 'Rockets', 'Titans'];
const STATE_TEAMS: Record<string, string> = {
    'Gujarat': 'Gujarat Titans',
    'Maharashtra': 'Maharashtra Kings',
    'Karnataka': 'Karnataka Royals',
    'Tamil Nadu': 'Tamil Nadu Super Kings',
    'New South Wales': 'NSW Blues',
    'Victoria': 'Victorian Bushrangers',
    'Queensland': 'Queensland Bulls',
};


const AI_PLAYER_NAMES = ['A. Jones', 'B. Smith', 'C. Patel', 'D. Williams', 'E. Khan', 'F. Miller', 'G. Taylor', 'H. Ali', 'I. Sharma', 'J. Root', 'K. Perera', 'L. Ngidi'];

const MAX_OVERS = 20;

export const EQUIPMENT_CATALOG: Record<string, Equipment> = {
    // Bats
    'bat_starter': { id: 'bat_starter', name: 'Standard Willow Bat', type: 'bat', cost: 0, boost: null, description: 'A basic, reliable bat.' },
    'bat_power': { id: 'bat_power', name: 'Pro "Blaster" Bat', type: 'bat', cost: 5000, boost: { category: 'batting', skill: 'power', value: 5 }, description: '+5 Power' },
    'bat_timing': { id: 'bat_timing', name: 'Master "Touch" Bat', type: 'bat', cost: 7500, boost: { category: 'batting', skill: 'timing', value: 7 }, description: '+7 Timing' },
    
    // Pads
    'pads_starter': { id: 'pads_starter', name: 'Standard Pads', type: 'pads', cost: 0, boost: null, description: 'Basic protection.' },
    'pads_run': { id: 'pads_run', name: 'Lightweight "Sprinter" Pads', type: 'pads', cost: 4000, boost: { category: 'batting', skill: 'running', value: 6 }, description: '+6 Running' },
    
    // Gloves
    'gloves_starter': { id: 'gloves_starter', name: 'Standard Gloves', type: 'gloves', cost: 0, boost: null, description: 'Basic gloves.' },
    'gloves_confidence': { id: 'gloves_confidence', name: '"Aura" Pro Gloves', type: 'gloves', cost: 6000, boost: { category: 'attributes', skill: 'confidence', value: 5 }, description: '+5 Confidence' },

    // Kit
    'kit_starter': { id: 'kit_starter', name: 'Plain Club Kit', type: 'kit', cost: 0, boost: null, description: 'Standard team apparel.' },
    'kit_fitness': { id: 'kit_fitness', name: 'Aero-Dynamic Pro Kit', type: 'kit', cost: 10000, boost: { category: 'fitness', skill: 'fitness', value: 5 }, description: '+5 Fitness' },
};


export const initialPlayer: Player = {
    name: '',
    country: '',
    state: '',
    district: '',
    role: PlayerRole.BATSMAN,
    skills: { 
        batting: { timing: 30, power: 30, running: 30 }, 
        bowling: { pace: 30, spin: 30, accuracy: 30 }, 
        fielding: 40, 
        fitness: 50 
    },
    attributes: { confidence: 50, focus: 50, temperament: 50, teamwork: 50, aggression: 30, pressureHandling: 30, playerHappiness: 50, teamHappiness: 50, managerHappiness: 50 },
    careerStats: { runs: 0, wickets: 0, matches: 0, awards: [], potmAward: 0 },
    seasonStats: { runs: 0, wickets: 0 },
    reputation: 10,
    finance: 1000,
    energy: 100,
    milestones: new Set(),
    team: null,
    currentLeague: null,
    battingPosition: 5,
    isCaptain: false,
    liveMatch: null,
    seasonSummary: null,
    careerHistory: [],
    seasonAwards: [],
    equipment: {
        bat: 'bat_starter',
        pads: 'pads_starter',
        gloves: 'gloves_starter',
        kit: 'kit_starter',
    },
};

export const withStatClamps = (player: Player): Player => {
    const clamp = (val: number) => Math.max(0, Math.min(val, 100));
    return {
        ...player,
        skills: {
            batting: {
                timing: clamp(player.skills.batting.timing),
                power: clamp(player.skills.batting.power),
                running: clamp(player.skills.batting.running),
            },
            bowling: {
                pace: clamp(player.skills.bowling.pace),
                spin: clamp(player.skills.bowling.spin),
                accuracy: clamp(player.skills.bowling.accuracy),
            },
            fielding: clamp(player.skills.fielding),
            fitness: clamp(player.skills.fitness),
        },
        attributes: {
            confidence: clamp(player.attributes.confidence),
            focus: clamp(player.attributes.focus),
            temperament: clamp(player.attributes.temperament),
            teamwork: clamp(player.attributes.teamwork),
            aggression: clamp(player.attributes.aggression),
            pressureHandling: clamp(player.attributes.pressureHandling),
            playerHappiness: clamp(player.attributes.playerHappiness),
            teamHappiness: clamp(player.attributes.teamHappiness),
            managerHappiness: clamp(player.attributes.managerHappiness),
        },
        reputation: clamp(player.reputation),
        energy: clamp(player.energy),
    };
};

export const getEffectivePlayer = (player: Player): Player => {
    const effectivePlayer = JSON.parse(JSON.stringify(player)); // Deep copy
    
    const boosts = Object.values(player.equipment)
        .map(id => EQUIPMENT_CATALOG[id])
        .filter((item): item is Equipment => !!(item && item.boost))
        .map(item => item.boost!);

    for (const boost of boosts) {
        const { category, skill, value } = boost;
        if (category === 'batting' || category === 'bowling') {
            (effectivePlayer.skills[category] as any)[skill] += value;
        } else if (category === 'fielding' || category === 'fitness') {
            (effectivePlayer.skills as any)[skill] += value;
        } else if (category === 'attributes') {
            (effectivePlayer.attributes as any)[skill] += value;
        }
    }

    // Return a clamped version but not the full player object from withStatClamps to avoid recursion issues
    const clampedPlayer = withStatClamps(effectivePlayer);
    effectivePlayer.skills = clampedPlayer.skills;
    effectivePlayer.attributes = clampedPlayer.attributes;

    return effectivePlayer;
};


const generateLeague = (player: Player, tier: 'district' | 'state', season: number): League => {
    const teams: Team[] = [player.team!];
    let leagueName = '';
    
    if (tier === 'district') {
        leagueName = `${player.district} Premier League Season ${season}`;
        const districts = LOCATIONS[player.country][player.state];
        const otherDistricts = districts.filter(d => d !== player.district);
        const usedSuffixes = new Set([DISTRICT_TEAM_SUFFIXES[0]]);
        
        let suffixIndex = 1;
        while(teams.length < 8) {
            let suffix = DISTRICT_TEAM_SUFFIXES[suffixIndex % DISTRICT_TEAM_SUFFIXES.length];
            if(!usedSuffixes.has(suffix)) {
                const districtName = otherDistricts[(teams.length -1) % otherDistricts.length];
                teams.push({
                     id: `team_dist_${teams.length}`,
                     name: `${districtName} ${suffix}`,
                     strength: 40 + Math.floor(Math.random() * 20),
                });
                usedSuffixes.add(suffix);
            }
            suffixIndex++;
        }

    } else { // state
        leagueName = `${player.state} State Trophy Season ${season}`;
        const otherStates = Object.keys(LOCATIONS[player.country]).filter(s => s !== player.state);
        for(let i=0; i<7; i++) {
             const stateName = otherStates[i % otherStates.length];
             teams.push({
                id: `team_state_${i}`,
                name: STATE_TEAMS[stateName] || `${stateName} XI`,
                strength: 65 + Math.floor(Math.random() * 15),
            });
        }
    }


    const fixtures: Fixture[] = [];
    for (let i = 0; i < teams.length; i++) {
        for (let j = i + 1; j < teams.length; j++) {
            fixtures.push({ homeTeam: teams[i], awayTeam: teams[j], played: false });
             fixtures.push({ homeTeam: teams[j], awayTeam: teams[i], played: false });
        }
    }

    const table: LeagueTableEntry[] = teams.map(team => ({
        teamId: team.id,
        teamName: team.name,
        played: 0,
        wins: 0,
        losses: 0,
        points: 0,
    }));

    return {
        name: leagueName,
        teams,
        fixtures: fixtures.sort(() => 0.5 - Math.random()),
        table,
        season,
        tier,
    };
};

export const updateLeagueTable = (table: LeagueTableEntry[], winningTeamId: string, losingTeamId: string): LeagueTableEntry[] => {
    return table.map(entry => {
        if (entry.teamId === winningTeamId) {
            return { ...entry, played: entry.played + 1, wins: entry.wins + 1, points: entry.points + 2 };
        }
        if (entry.teamId === losingTeamId) {
            return { ...entry, played: entry.played + 1, losses: entry.losses + 1 };
        }
        return entry;
    }).sort((a, b) => b.points - a.points || (b.wins - b.losses) - (a.wins - a.losses));
};


export const checkMilestones = (player: Player): { player: Player, newMilestone?: string } => {
    let newMilestone: string | undefined;
    let updatedPlayer = {...player};

    if (player.careerStats.runs >= 1000 && !player.milestones.has('1000_RUNS')) {
        updatedPlayer.milestones.add('1000_RUNS');
        newMilestone = 'Reached 1000 career runs!';
        updatedPlayer.reputation += 5;
    }
    if (player.careerStats.wickets >= 50 && !player.milestones.has('50_WICKETS')) {
        updatedPlayer.milestones.add('50_WICKETS');
        newMilestone = 'Took 50 career wickets!';
        updatedPlayer.reputation += 5;
    }
     if (player.careerStats.matches >= 50 && !player.milestones.has('50_MATCHES')) {
        updatedPlayer.milestones.add('50_MATCHES');
        newMilestone = 'Played 50 professional matches!';
        updatedPlayer.reputation += 10;
    }
    
    // Batting position promotion
    const effectivePlayer = getEffectivePlayer(player);
    const battingSkill = (effectivePlayer.skills.batting.timing + effectivePlayer.skills.batting.power) / 2;
    if (battingSkill > 75 && player.battingPosition > 1 && !player.milestones.has(`promo_${player.battingPosition-1}`)){
        updatedPlayer.battingPosition -= 1;
        updatedPlayer.milestones.add(`promo_${updatedPlayer.battingPosition}`);
        newMilestone = `Promoted to #${updatedPlayer.battingPosition} in the batting order!`;
    }

    return { player: updatedPlayer, newMilestone };
};

const generateSeasonSummary = (player: Player): SeasonSummary => {
    const topRunScorers: TopPlayerStat[] = [];
    const topWicketTakers: TopPlayerStat[] = [];

    topRunScorers.push({ playerName: player.name, teamName: player.team!.name, stat: player.seasonStats.runs });
    topWicketTakers.push({ playerName: player.name, teamName: player.team!.name, stat: player.seasonStats.wickets });
    
    const aiPlayerNames = ['R. Sharma', 'V. Kohli', 'J. Bumrah', 'S. Smith', 'P. Cummins', 'K. Williamson', 'B. Stokes'];
    const teams = player.currentLeague!.teams;

    for(let i = 0; i < 5; i++) {
        const team = teams[Math.floor(Math.random() * teams.length)];
        topRunScorers.push({
            playerName: aiPlayerNames[Math.floor(Math.random() * aiPlayerNames.length)],
            teamName: team.name,
            stat: Math.floor(player.seasonStats.runs * (0.8 + Math.random() * 0.5)) + 50,
        });
        topWicketTakers.push({
            playerName: aiPlayerNames[Math.floor(Math.random() * aiPlayerNames.length)],
            teamName: team.name,
            stat: Math.floor(player.seasonStats.wickets * (0.8 + Math.random() * 0.5)) + 5,
        });
    }

    return {
        topRunScorers: topRunScorers.sort((a, b) => b.stat - a.stat).slice(0, 5),
        topWicketTakers: topWicketTakers.sort((a, b) => b.stat - a.stat).slice(0, 5),
    };
};

export const getSelectorThoughts = (player: Player) => {
    const thoughts = {
        state: { chance: 0, text: "Not on the radar yet. Needs to dominate district cricket first." },
        franchise: { chance: 0, text: "Franchise scouts are looking for explosive talent in top state leagues." },
        national: { chance: 0, text: "The ultimate dream. Only the best of the best at the state level get a look-in." },
        t20worldcup: { chance: 0, text: "Requires exceptional performance in national and T20 franchise leagues." }
    };

    const effectivePlayer = getEffectivePlayer(player);
    const skillSum = effectivePlayer.skills.batting.timing + effectivePlayer.skills.batting.power + effectivePlayer.skills.bowling.accuracy + effectivePlayer.skills.bowling.pace + effectivePlayer.skills.bowling.spin + effectivePlayer.skills.fitness;
    
    if (player.currentLeague?.tier === 'district') {
        const stateChance = Math.min(90, Math.floor(player.reputation * 1.5 + player.seasonStats.runs / 20 + player.seasonStats.wickets / 2));
        thoughts.state.chance = stateChance;
        if (stateChance > 75) thoughts.state.text = "A top performer. Almost a certainty for a state call-up if this form continues.";
        else if (stateChance > 50) thoughts.state.text = "Making a name for themself. A few more big performances should seal a state trial.";
        else if (stateChance > 20) thoughts.state.text = "Showing potential, but needs more consistency to impress the state selectors.";
    } else {
        thoughts.state.chance = 100;
        thoughts.state.text = "Already a key member of the state squad.";
    }

    if (player.currentLeague?.tier === 'state') {
        const franchiseChance = Math.min(95, Math.floor(player.reputation * 1.2 + skillSum / 4));
        thoughts.franchise.chance = franchiseChance;
        if (franchiseChance > 80) thoughts.franchise.text = "Hot property! Multiple franchises are likely interested. A big contract is on the horizon.";
        else if (franchiseChance > 50) thoughts.franchise.text = "On the shortlist for several teams. A strong showing in the state playoffs could guarantee a spot.";
        else if (franchiseChance > 20) thoughts.franchise.text = "Scouts are taking notice. Needs to show more X-factor to stand out.";
    }

    if (player.currentLeague?.tier === 'state' && player.reputation > 70) {
         const nationalChance = Math.min(90, Math.floor((player.reputation - 50) * 2 + (skillSum - 150) / 2));
         thoughts.national.chance = nationalChance;
         if (nationalChance > 80) thoughts.national.text = "Knocking on the door of the national team. A debut seems imminent.";
         else if (nationalChance > 50) thoughts.national.text = "In the national conversation. The selectors want to see dominance over a full state season.";
         else if (nationalChance > 20) thoughts.national.text = "An outside chance. Needs to be the undisputed best in their role at the state level.";
    }

    if (player.milestones.has('NATIONAL_DEBUT')) {
        thoughts.national.chance = 100;
        thoughts.national.text = "A proud representative of the national team.";
        const t20Chance = Math.min(99, player.reputation + (effectivePlayer.skills.batting.timing > effectivePlayer.skills.bowling.accuracy ? effectivePlayer.skills.batting.timing : effectivePlayer.skills.bowling.accuracy) - 100);
        thoughts.t20worldcup.chance = t20Chance;
        if (t20Chance > 85) thoughts.t20worldcup.text = "A key part of the T20 World Cup plans.";
        else if (t20Chance > 50) thoughts.t20worldcup.text = "In contention for the squad, but needs to prove their worth in international T20s.";
    }

    return thoughts;
};

// =================================================================
// NEW INTERACTIVE MATCH SIMULATION LOGIC
// =================================================================

const startLiveMatch = (player: Player, tactic: 'aggressive' | 'balanced' | 'defensive'): ChoiceEffectResult => {
    if (!player.currentLeague || !player.team) return { updatedPlayer: player };

    const fixture = player.currentLeague.fixtures.find(f => !f.played && (f.homeTeam.id === player.team!.id || f.awayTeam.id === player.team!.id));
    if (!fixture) return { updatedPlayer: player, nextEventId: 'LEAGUE_END' };

    const opponentTeam = fixture.homeTeam.id === player.team.id ? fixture.awayTeam : fixture.homeTeam;

    const tossWinnerId = Math.random() > 0.5 ? player.team.id : opponentTeam.id;
    const decision = Math.random() > 0.5 ? 'bat' : 'bowl';
    const battingTeamId = (tossWinnerId === player.team.id && decision === 'bat') || (tossWinnerId === opponentTeam.id && decision === 'bowl') ? player.team.id : opponentTeam.id;

    // Create batting orders
    const createBattingOrder = (teamId: string, teamName: string): BattingEntry[] => {
        const order: BattingEntry[] = [];
        const isPlayerTeam = teamId === player.team!.id;
        
        if (isPlayerTeam) {
             order.push({ playerName: player.name, runs: 0, balls: 0, isOut: false, position: player.battingPosition });
        }
        
        const shuffledAINames = [...AI_PLAYER_NAMES].sort(() => 0.5 - Math.random());
        let nameIndex = 0;
        for(let i=1; i<=11; i++){
            if(isPlayerTeam && i === player.battingPosition) continue;
            order.push({ playerName: shuffledAINames[nameIndex++], runs: 0, balls: 0, isOut: false, position: i});
        }
        return order.sort((a, b) => a.position - b.position);
    };

    const playerTeamBattingOrder = createBattingOrder(player.team.id, player.team.name);
    const opponentTeamBattingOrder = createBattingOrder(opponentTeam.id, opponentTeam.name);

    const pitchConditions: Array<'Flat' | 'Green' | 'Dusty'> = ['Flat', 'Green', 'Dusty'];
    const weatherConditions: Array<'Sunny' | 'Overcast'> = ['Sunny', 'Overcast'];

    const liveMatchData: LiveMatchState = {
        playerTeam: player.team,
        opponentTeam,
        tossWinnerId,
        decision,
        pitchCondition: pitchConditions[Math.floor(Math.random() * pitchConditions.length)],
        weather: weatherConditions[Math.floor(Math.random() * weatherConditions.length)],
        innings: 1,
        battingTeamId: battingTeamId,
        score: 0,
        wickets: 0,
        overs: 0,
        target: null,
        battingOrder: battingTeamId === player.team.id ? playerTeamBattingOrder : opponentTeamBattingOrder,
        bowlingOrder: [], // will be populated as bowlers are used
        currentBatsmanIndex: 0,
        currentBowlerIndex: -1,
        onStrikeBatsmanIndex: 0,
        innings1Data: null,
        playerTeamBattingOrder,
        opponentTeamBattingOrder,
        commentary: [`${tossWinnerId === player.team.id ? player.team.name : opponentTeam.name} won the toss and chose to ${decision}.`],
        playerTactic: tactic,
        matchOver: false,
        resultMessage: '',
        lastBallMilestone: null,
    };
    liveMatchData.commentary.push(`Conditions: ${liveMatchData.weather} weather on a ${liveMatchData.pitchCondition} pitch.`);

    return { 
        updatedPlayer: { ...player, liveMatch: liveMatchData }, 
        newGameState: GameState.IN_MATCH, 
        liveMatchData 
    };
}


const applyTraining = (player: Player, trainingEffect: Partial<Player>): ChoiceEffectResult => {
     const updatedPlayer = withStatClamps({
        ...player,
        ...trainingEffect,
        skills: { 
            ...player.skills, 
            ...trainingEffect.skills,
            batting: { ...player.skills.batting, ...trainingEffect.skills?.batting },
            bowling: { ...player.skills.bowling, ...trainingEffect.skills?.bowling },
        },
        attributes: { ...player.attributes, ...trainingEffect?.attributes },
    });
    const nextEvent = updatedPlayer.isCaptain ? 'CAPTAIN_TACTICS' : 'PRE_MATCH_STRATEGY';
    return { updatedPlayer, nextEventId: nextEvent };
};

// This function is for AI vs AI matches in the league table
const simulateAIMatch = (league: League, fixture: Fixture): League => {
    const homeStrength = fixture.homeTeam.strength + Math.random() * 15 - 7.5;
    const awayStrength = fixture.awayTeam.strength + Math.random() * 15 - 7.5;
    const winnerId = homeStrength > awayStrength ? fixture.homeTeam.id : fixture.awayTeam.id;
    const loserId = winnerId === fixture.homeTeam.id ? fixture.awayTeam.id : fixture.homeTeam.id;

    const updatedTable = updateLeagueTable(league.table, winnerId, loserId);
    const updatedFixtures = league.fixtures.map(f => f === fixture ? {...f, played: true, winnerId } : f);
    
    return { ...league, table: updatedTable, fixtures: updatedFixtures };
};

// =================================================================
// GAME EVENTS
// =================================================================

export const gameEvents: Record<string, GameEvent> = {
  DISTRICT_TRIAL: {
    id: 'DISTRICT_TRIAL',
    title: 'The District Trial',
    description: (p) => `Welcome to the selection trial for the ${p.district} district team. This is the first step on the ladder. Show them what you've got.`,
    choices: [
      {
        text: 'Focus on technique and play safe.',
        effect: (p) => {
            const success = (p.skills.batting.timing + p.skills.bowling.accuracy) / 2 + p.attributes.focus > 80;
            return {
                updatedPlayer: withStatClamps({ ...p, attributes: { ...p.attributes, focus: p.attributes.focus + 5 } }),
                nextEventId: success ? 'DISTRICT_TRIAL_SUCCESS' : 'DISTRICT_TRIAL_FAIL',
            };
        },
      },
      {
        text: 'Go for big shots and aggressive spells.',
        effect: (p) => {
             const success = (p.skills.batting.power + p.skills.bowling.pace) / 2 + p.attributes.confidence > 90;
             return {
                updatedPlayer: withStatClamps({ ...p, attributes: { ...p.attributes, confidence: p.attributes.confidence + 5 } }),
                nextEventId: success ? 'DISTRICT_TRIAL_SUCCESS' : 'DISTRICT_TRIAL_FAIL',
            };
        },
      },
    ],
  },
  DISTRICT_TRIAL_FAIL: {
      id: 'DISTRICT_TRIAL_FAIL',
      title: 'Not This Time',
      description: () => 'You gave it your best, but the competition was stiff. The selectors have asked you to come back next year. A bitter pill to swallow.',
      choices: [
          { text: 'Train harder and prove them wrong.', effect: (p) => ({ updatedPlayer: p, nextEventId: 'RETIRE_BURNOUT' }) }
      ]
  },
  DISTRICT_TRIAL_SUCCESS: {
    id: 'DISTRICT_TRIAL_SUCCESS',
    title: 'You\'re In!',
    description: (p) => `Congratulations! You've been selected for the ${p.district} team. Your first contract is on the table.`,
    choices: [
      { text: 'Sign the contract and start my journey.', effect: (p) => {
          const playerTeam: Team = { 
              id: 'player_team', 
              name: `${p.district} ${DISTRICT_TEAM_SUFFIXES[0]}`, 
              strength: 50 
          };
          const updatedPlayer = {...p, team: playerTeam, reputation: p.reputation + 5 };
          const newLeague = generateLeague(updatedPlayer, 'district', 1);
          return { 
              updatedPlayer: { ...updatedPlayer, currentLeague: newLeague }, 
              nextEventId: 'DOMESTIC_WEEKLY_SCHEDULE',
              newMilestone: 'First Professional Contract!'
            };
      }},
    ],
  },
  DOMESTIC_WEEKLY_SCHEDULE: {
    id: 'DOMESTIC_WEEKLY_SCHEDULE',
    title: 'Weekly Schedule',
    description: (p) => {
        if (!p.currentLeague || !p.team) return "Error: No league data found.";
        const nextFixture = p.currentLeague.fixtures.find(f => !f.played && (f.homeTeam.id === p.team!.id || f.awayTeam.id === p.team!.id));
        if (nextFixture) {
            const opponent = nextFixture.homeTeam.id === p.team.id ? nextFixture.awayTeam : nextFixture.homeTeam;
            return `It's the week leading up to your match against ${opponent.name}. How do you want to prepare? Your energy is at ${p.energy}%.`;
        }
        return "The league season has concluded. Time to see the final standings.";
    },
    choices: [
        {
            text: 'Net session: Focus on timing & defense',
            condition: (p) => p.energy >= 15 && (p.role !== PlayerRole.BOWLER),
            effect: (p) => applyTraining(p, { skills: { ...p.skills, batting: { ...p.skills.batting, timing: p.skills.batting.timing + 2 } }, attributes: { ...p.attributes, temperament: p.attributes.temperament + 1 }, energy: p.energy - 15 })
        },
        {
            text: 'Gym: Power hitting drills',
            condition: (p) => p.energy >= 20 && (p.role !== PlayerRole.BOWLER),
            effect: (p) => applyTraining(p, { skills: { ...p.skills, batting: { ...p.skills.batting, power: p.skills.batting.power + 3 } }, attributes: { ...p.attributes, aggression: p.attributes.aggression + 1 }, energy: p.energy - 20 })
        },
         {
            text: 'Nets: Drill line and length',
            condition: (p) => p.energy >= 15 && (p.role !== PlayerRole.BATSMAN),
            effect: (p) => applyTraining(p, { skills: { ...p.skills, bowling: { ...p.skills.bowling, accuracy: p.skills.bowling.accuracy + 2 } }, attributes: { ...p.attributes, focus: p.attributes.focus + 1 }, energy: p.energy - 15 })
        },
        {
            text: 'Nets: Work on bowling variations',
            condition: (p) => p.energy >= 20 && (p.role !== PlayerRole.BATSMAN),
            effect: (p) => applyTraining(p, { skills: { ...p.skills, bowling: { ...p.skills.bowling, pace: p.skills.bowling.pace + 1, spin: p.skills.bowling.spin + 1 } }, attributes: { ...p.attributes, aggression: p.attributes.aggression + 1 }, energy: p.energy - 20 })
        },
        {
            text: 'Fielding & Agility Training',
            condition: (p) => p.energy >= 15,
            effect: (p) => applyTraining(p, { skills: { ...p.skills, fielding: p.skills.fielding + 2 }, attributes: { ...p.attributes, teamwork: p.attributes.teamwork + 1, teamHappiness: p.attributes.teamHappiness + 2 }, energy: p.energy - 15 })
        },
        {
            text: 'Endurance & Fitness Training',
            condition: (p) => p.energy >= 25,
            effect: (p) => applyTraining(p, { skills: { ...p.skills, fitness: p.skills.fitness + 3 }, energy: p.energy - 25 })
        },
        {
            text: 'Visit the Pro Shop & Manage Finances',
            effect: (p) => ({ updatedPlayer: p, nextEventId: 'FINANCE_HUB' })
        },
        {
            text: 'Rest & Recover',
            effect: (p) => {
                const updatedPlayer = withStatClamps({ ...p, energy: p.energy + 40, attributes: { ...p.attributes, playerHappiness: p.attributes.playerHappiness + 5 } });
                const nextEvent = updatedPlayer.isCaptain ? 'CAPTAIN_TACTICS' : 'PRE_MATCH_STRATEGY';
                return { updatedPlayer, nextEventId: nextEvent };
            }
        },
    ]
  },
  PRE_MATCH_STRATEGY: {
    id: 'PRE_MATCH_STRATEGY',
    title: 'Pre-Match Strategy',
    description: (p) => `You're in the dressing room. The captain has confirmed you're batting at #${p.battingPosition}. How do you want to approach this game? Your choice will set your mindset for the innings.`,
    choices: [
        { text: 'Play Aggressively', effect: (p) => startLiveMatch(p, 'aggressive') },
        { text: 'Play a Balanced Game', effect: (p) => startLiveMatch(p, 'balanced') },
        { text: 'Play Defensively', effect: (p) => startLiveMatch(p, 'defensive') }
    ]
  },
  CAPTAIN_TACTICS: {
    id: 'CAPTAIN_TACTICS',
    title: 'Captain\'s Tactics',
    description: (p) => {
        if (!p.currentLeague || !p.team) return "Error: No league data found.";
        const nextFixture = p.currentLeague.fixtures.find(f => !f.played && (f.homeTeam.id === p.team!.id || f.awayTeam.id === p.team!.id));
        const opponentName = nextFixture ? (nextFixture.homeTeam.id === p.team.id ? nextFixture.awayTeam.name : nextFixture.homeTeam.name) : "the opposition";
        return `As captain, the final decisions are yours for the match against ${opponentName}. Set your batting position and the team's approach.`;
    },
    choices: [
        { 
            text: 'I\'ll open. Team Tactic: All-out Attack!', 
            effect: (p) => startLiveMatch({ ...p, battingPosition: 1 }, 'aggressive') 
        },
        { 
            text: 'I\'ll open. Team Tactic: Balanced.', 
            effect: (p) => startLiveMatch({ ...p, battingPosition: 1 }, 'balanced') 
        },
        { 
            text: 'I\'ll bat at #3. Team Tactic: Balanced.', 
            effect: (p) => startLiveMatch({ ...p, battingPosition: 3 }, 'balanced') 
        },
        { 
            text: 'I\'ll bat at #3. Team Tactic: Defensive.', 
            effect: (p) => startLiveMatch({ ...p, battingPosition: 3 }, 'defensive') 
        },
        { 
            text: 'I\'ll finish at #5. Team Tactic: Balanced.', 
            effect: (p) => startLiveMatch({ ...p, battingPosition: 5 }, 'balanced') 
        },
        { 
            text: 'I\'ll finish at #5. Team Tactic: Aggressive.', 
            effect: (p) => startLiveMatch({ ...p, battingPosition: 5 }, 'aggressive') 
        },
    ]
  },
   MATCH_RESULT: {
    id: 'MATCH_RESULT',
    title: 'Match Result',
    description: (p) => {
      if (!p.lastMatchResult) return "Match summary is unavailable.";
      const { opponentName, result } = p.lastMatchResult;
      let baseDescription = result === 'win' ? `A great victory against ${opponentName}!` : `A tough loss against ${opponentName}. On to the next one.`;

      if (p.reputation > 50 && !p.isCaptain && !p.milestones.has('CAPTAINCY_OFFERED')) {
        baseDescription += `\n\nYour leadership qualities are being noticed by the team management.`
      }

      return baseDescription;
    },
    choices: [
      { 
          text: 'Continue season', 
          effect: p => {
              if (p.reputation > 60 && !p.isCaptain && !p.milestones.has('CAPTAINCY_OFFERED')) {
                return { updatedPlayer: p, nextEventId: 'CAPTAINCY_OFFER' };
              }
              const fixtureIndex = p.currentLeague?.fixtures.findIndex(f => !f.played && (f.homeTeam.id === p.team!.id || f.awayTeam.id === p.team!.id));
              if (fixtureIndex === -1) {
                  return { updatedPlayer: p, nextEventId: 'LEAGUE_END' };
              }
              // Simulate AI matches for the round
              let updatedLeague = { ...p.currentLeague! };
              const teamsInPlayerMatch = new Set([p.team!.id, p.lastMatchResult!.opponentName]); // Simplified
              const availableTeams = new Set(p.currentLeague!.teams.map(t => t.id).filter(id => !teamsInPlayerMatch.has(id)));
              
              for(const fixture of updatedLeague.fixtures) {
                  if(!fixture.played && availableTeams.has(fixture.homeTeam.id) && availableTeams.has(fixture.awayTeam.id)) {
                      updatedLeague = simulateAIMatch(updatedLeague, fixture);
                      availableTeams.delete(fixture.homeTeam.id);
                      availableTeams.delete(fixture.awayTeam.id);
                  }
              }

              return { updatedPlayer: {...p, currentLeague: updatedLeague }, nextEventId: 'DOMESTIC_WEEKLY_SCHEDULE' };
          } 
      }
    ]
  },
    FINANCE_HUB: {
    id: 'FINANCE_HUB',
    title: 'Pro Shop & Finances',
    description: (p) => `Welcome to the Pro Shop. You have $${p.finance.toLocaleString()} to spend on upgrading your gear. Better equipment can give you an edge on the field.`,
    choices: [
        ...Object.values(EQUIPMENT_CATALOG).filter(item => item.cost > 0).map(item => ({
            text: `Buy ${item.name} ($${item.cost.toLocaleString()}) - ${item.description}`,
            condition: (p: Player) => p.finance >= item.cost && p.equipment[item.type] !== item.id,
            effect: (p: Player): ChoiceEffectResult => {
                const updatedPlayer = {
                    ...p,
                    finance: p.finance - item.cost,
                    equipment: {
                        ...p.equipment,
                        [item.type]: item.id,
                    },
                };
                return { 
                    updatedPlayer, 
                    nextEventId: 'FINANCE_HUB', 
                    newMilestone: `Purchased ${item.name}!` 
                };
            }
        })),
        {
            text: 'Return to training',
            effect: (p: Player) => {
                const nextEvent = p.isCaptain ? 'CAPTAIN_TACTICS' : 'PRE_MATCH_STRATEGY';
                return { updatedPlayer: p, nextEventId: nextEvent };
            }
        }
    ]
  },
  LEAGUE_END: {
    id: 'LEAGUE_END',
    title: 'League Season Over',
    description: (p) => {
        if (!p.currentLeague || !p.team) return "Error reading league data.";
        const finalPosition = p.currentLeague.table.findIndex(t => t.teamId === p.team!.id) + 1;
        if (finalPosition <= 2) {
            return `You finished ${finalPosition === 1 ? '1st' : '2nd'} in the league! You've qualified for the playoffs!`;
        }
        return `You finished ${finalPosition}th in the league. A good effort, but you didn't make the playoffs this time.`;
    },
    choices: [
      { 
        text: 'Proceed to Playoffs!', 
        condition: p => p.currentLeague!.table.findIndex(t => t.teamId === p.team!.id) < 2,
        effect: p => ({ updatedPlayer: p, nextEventId: 'PLAYOFF_SEMI_FINAL' })
      },
      { 
        text: 'View Season Summary.', 
        condition: p => p.currentLeague!.table.findIndex(t => t.teamId === p.team!.id) >= 2,
        effect: p => ({ 
            updatedPlayer: {...p, seasonSummary: generateSeasonSummary(p)}, 
            nextEventId: 'SEASON_SUMMARY' 
        })
      }
    ]
  },
  STATE_SELECTION_TRIAL: {
      id: 'STATE_SELECTION_TRIAL',
      title: 'The Big League Trial',
      description: (p) => `Your consistent performances in the district league have paid off. You've been invited to the selection trials for the ${p.state} state team! This is a huge step up.`,
      choices: [
          {
              text: 'Show them my best.',
              effect: p => {
                  const skillCheck = (p.skills.batting.timing + p.skills.batting.power) + (p.skills.bowling.accuracy + p.skills.bowling.pace) + p.attributes.confidence;
                  if (skillCheck > 150) {
                      const newStateTeam: Team = { id: 'player_state_team', name: STATE_TEAMS[p.state], strength: 75 };
                      const updatedPlayer = { ...p, team: newStateTeam, reputation: p.reputation + 20, seasonStats: { runs: 0, wickets: 0 }, battingPosition: 5, isCaptain: false }; // Reset for new team
                      const newLeague = generateLeague(updatedPlayer, 'state', p.currentLeague ? p.currentLeague.season + 1 : 1);
                      return { updatedPlayer: {...updatedPlayer, currentLeague: newLeague }, nextEventId: 'DOMESTIC_WEEKLY_SCHEDULE', newMilestone: `Selected for ${p.state}!` };
                  }
                  return { updatedPlayer: withStatClamps({ ...p, attributes: {...p.attributes, confidence: p.attributes.confidence - 10} }), nextEventId: 'DOMESTIC_WEEKLY_SCHEDULE' };
              }
          }
      ]
  },
  PLAYOFF_SEMI_FINAL: {
      id: 'PLAYOFF_SEMI_FINAL',
      title: 'Playoff Semi-Final',
      description: () => 'This is it, a knockout match to reach the final. The pressure is immense. Can you deliver?',
      choices: [
          { text: 'Give it my all.', effect: p => startLiveMatch(p, 'balanced') }
      ]
  },
  PLAYOFF_FINAL: {
      id: 'PLAYOFF_FINAL',
      title: 'The Grand Final',
      description: () => 'The stadium is roaring. The trophy is gleaming. One match to decide the champions. This is your moment.',
      choices: [
          { text: 'For glory!', effect: p => {
              const playerAfterMatch = {...p };
              if (Math.random() > 0.4) { // Simulate win
                playerAfterMatch.seasonAwards.push(`${p.currentLeague!.tier === 'district' ? 'District' : 'State'} League Winner`);
                playerAfterMatch.reputation += 15;
              }
              // This should ideally also be a live match, but for simplicity we skip to summary
               return { 
                updatedPlayer: {...playerAfterMatch, seasonSummary: generateSeasonSummary(playerAfterMatch)}, 
                nextEventId: 'SEASON_SUMMARY', 
                newMilestone: 'DOMESTIC CHAMPION!' 
              };
          }}
      ]
  },
  SEASON_SUMMARY: {
      id: 'SEASON_SUMMARY',
      title: 'Season Summary',
      description: () => 'The season is over. Time for a well-deserved rest, and to prepare for the next challenge.',
      choices: [
          { 
              text: 'Start next season.', 
              effect: p => {
                  let updatedPlayer = { ...p };

                  if (p.seasonSummary?.topRunScorers[0].playerName === p.name) {
                      updatedPlayer.seasonAwards.push('Top Run Scorer');
                  }
                  if (p.seasonSummary?.topWicketTakers[0].playerName === p.name) {
                      updatedPlayer.seasonAwards.push('Top Wicket Taker');
                  }

                  const historyEntry: SeasonHistoryEntry = {
                      season: p.currentLeague!.season,
                      teamName: p.team!.name,
                      tier: p.currentLeague!.tier,
                      runs: p.seasonStats.runs,
                      wickets: p.seasonStats.wickets,
                      awards: updatedPlayer.seasonAwards,
                  };
                  updatedPlayer.careerHistory.push(historyEntry);

                  const currentTier = p.currentLeague!.tier;
                  const nextSeasonTier = currentTier === 'international' ? 'state' : currentTier;
                  const newLeague = generateLeague(p, nextSeasonTier, (p.currentLeague?.season || 0) + 1);
                  
                  return { updatedPlayer: { ...updatedPlayer, currentLeague: newLeague, energy: 100, seasonStats: { runs: 0, wickets: 0 }, seasonSummary: null, lastMatchResult: undefined, seasonAwards: [] }, nextEventId: 'DOMESTIC_WEEKLY_SCHEDULE' };
              }
          }
      ]
  },
  // FIX: Placeholder implementations for missing game events to satisfy the GameEvent type.
  NATIONAL_CAMP: {
    id: 'NATIONAL_CAMP',
    title: 'National Camp',
    description: () => 'You have been called to the national team selection camp. This is your chance to impress the selectors.',
    choices: [{ text: 'I am ready.', effect: p => ({ updatedPlayer: p, nextEventId: 'DOMESTIC_WEEKLY_SCHEDULE' }) }]
  },
  INTERNATIONAL_DEBUT: {
    id: 'INTERNATIONAL_DEBUT',
    title: 'International Debut',
    description: (p) => `You are making your debut for ${p.country}! The whole nation is watching.`,
    choices: [{ text: 'Play for the flag.', effect: p => startLiveMatch(p, 'balanced') }]
  },
  WORLD_CUP_ARC: {
    id: 'WORLD_CUP_ARC',
    title: 'The World Cup',
    description: () => 'The biggest stage of them all. You have been selected for the World Cup squad!',
    choices: [{ text: 'Let\'s bring home the trophy.', effect: p => ({ updatedPlayer: p, nextEventId: 'DOMESTIC_WEEKLY_SCHEDULE' }) }]
  },
  CAPTAINCY_OFFER: {
    id: 'CAPTAINCY_OFFER',
    title: "A Leadership Opportunity",
    description: (p) => `The coach pulls you aside after training. "Your performances have been excellent, but more than that, we're impressed with your attitude. We'd like to offer you the team captaincy."`,
    choices: [
        { text: 'Accept the responsibility with pride.', effect: (p) => ({
            updatedPlayer: { ...p, isCaptain: true, reputation: p.reputation + 15, milestones: p.milestones.add('CAPTAINCY_OFFERED'), attributes: { ...p.attributes, playerHappiness: p.attributes.playerHappiness + 10, teamHappiness: p.attributes.teamHappiness + 5, managerHappiness: p.attributes.managerHappiness + 10 } },
            nextEventId: 'DOMESTIC_WEEKLY_SCHEDULE',
            newMilestone: 'Named Team Captain!',
        })},
        { text: 'Decline, I want to focus on my game.', effect: (p) => ({
            updatedPlayer: { ...p, attributes: {...p.attributes, focus: p.attributes.focus + 5, managerHappiness: p.attributes.managerHappiness - 5 }, milestones: p.milestones.add('CAPTAINCY_OFFERED') },
            nextEventId: 'DOMESTIC_WEEKLY_SCHEDULE',
        })},
    ]
  },
  RETIRE_LEGEND: {
      id: 'RETIRE_LEGEND',
      title: 'A Legendary Farewell',
      description: (p) => `You retire as a legend of the game. Your name, ${p.name}, is etched in the annals of cricket history, a hero for ${p.country}. Your career was a masterclass in skill and sportsmanship.`,
      choices: []
  },
  RETIRE_BURNOUT: {
      id: 'RETIRE_BURNOUT',
      title: 'Early Burnout',
      description: () => 'The pressure was too much. Injuries and poor choices cut your promising career short. You retire with a sense of "what could have been".',
      choices: []
  },
};
