
export enum PlayerRole {
  BATSMAN = 'Batsman',
  BOWLER = 'Bowler',
  ALL_ROUNDER = 'All-rounder',
  WICKETKEEPER = 'Wicketkeeper',
}

export enum GameState {
  CREATION = 'CREATION',
  IN_GAME = 'IN_GAME',
  IN_MATCH = 'IN_MATCH',
  RETIRED = 'RETIRED',
}

export interface BattingSkills {
  timing: number;
  power: number;
  running: number;
}

export interface BowlingSkills {
  pace: number;
  spin: number;
  accuracy: number;
}

export interface PlayerSkills {
  batting: BattingSkills;
  bowling: BowlingSkills;
  fielding: number;
  fitness: number;
}

export interface PlayerAttributes {
  confidence: number;
  focus: number;
  temperament: number;
  teamwork: number;
  aggression: number;
  pressureHandling: number;
  playerHappiness: number;
  teamHappiness: number;
  managerHappiness: number;
}

export interface CareerStats {
  runs: number;
  wickets: number;
  matches: number;
  awards: string[];
  potmAward: number;
}

export interface Team {
    id: string;
    name: string;
    strength: number; // A value from 1-100 representing team quality
}

export interface LeagueTableEntry {
    teamId: string;
    teamName: string;
    played: number;
    wins: number;
    losses: number;
    points: number;
}

export interface Fixture {
    homeTeam: Team;
    awayTeam: Team;
    played: boolean;
    winnerId?: string;
}

export interface League {
    name: string;
    teams: Team[];
    fixtures: Fixture[];
    table: LeagueTableEntry[];
    season: number;
    tier: 'district' | 'state' | 'international';
}

export interface TopPlayerStat {
    playerName: string;
    teamName: string;
    stat: number;
}

export interface SeasonSummary {
    topRunScorers: TopPlayerStat[];
    topWicketTakers: TopPlayerStat[];
}

export interface BattingEntry {
    playerName: string;
    runs: number;
    balls: number;
    isOut: boolean;
    position: number;
}

export interface BowlingEntry {
    playerName:string;
    overs: number;
    runs: number;
    wickets: number;
}

export interface SeasonHistoryEntry {
  season: number;
  teamName: string;
  tier: 'district' | 'state' | 'international';
  runs: number;
  wickets: number;
  awards: string[];
}

export interface InningsData {
  battingCard: BattingEntry[];
  bowlingCard: BowlingEntry[];
  totalScore: number;
  wickets: number;
  overs: number;
}

export interface EquipmentBoost {
    category: 'batting' | 'bowling' | 'fielding' | 'fitness' | 'attributes';
    skill: keyof BattingSkills | keyof BowlingSkills | 'fielding' | 'fitness' | keyof PlayerAttributes;
    value: number;
}
export interface Equipment {
    id: string;
    name: string;
    type: 'bat' | 'pads' | 'gloves' | 'kit';
    cost: number;
    boost: EquipmentBoost | null;
    description: string;
}

export type BattingActionType = 'defensive' | 'normal' | 'aggressive' | 'single';
export type BattingPlacement = 'off_side' | 'on_side' | 'straight';

export type BowlingActionType = 'safe_delivery' | 'standard_delivery' | 'attacking_delivery' | 'yorker';
export type BowlingLine = 'outside_off' | 'on_stump' | 'leg_side';

export interface PlayerBattingAction {
    type: BattingActionType;
    placement: BattingPlacement;
}

export interface PlayerBowlingAction {
    type: BowlingActionType;
    line: BowlingLine;
}

export type PlayerAction = PlayerBattingAction | PlayerBowlingAction;


export interface LiveMatchState {
  playerTeam: Team;
  opponentTeam: Team;
  tossWinnerId: string;
  decision: 'bat' | 'bowl';
  
  pitchCondition: 'Flat' | 'Green' | 'Dusty';
  weather: 'Sunny' | 'Overcast';

  innings: 1 | 2;
  battingTeamId: string;
  
  score: number;
  wickets: number;
  overs: number; // e.g. 5.2 for 5 overs and 2 balls
  
  target: number | null;
  
  // Live data - batting order matters
  battingOrder: BattingEntry[];
  bowlingOrder: BowlingEntry[];
  currentBatsmanIndex: number;
  currentBowlerIndex: number;
  onStrikeBatsmanIndex: number;
  
  // History for final scoreboard
  innings1Data: InningsData | null;

  // Full rosters for reference
  playerTeamBattingOrder: BattingEntry[];
  opponentTeamBattingOrder: BattingEntry[];

  commentary: string[];
  playerTactic: 'aggressive' | 'balanced' | 'defensive';
  matchOver: boolean;
  resultMessage: string;
  lastBallMilestone: string | null;
}


export interface Player {
  name: string;
  country: string;
  state: string;
  district: string;
  role: PlayerRole;
  skills: PlayerSkills;
  attributes: PlayerAttributes;
  careerStats: CareerStats;
  seasonStats: {
      runs: number;
      wickets: number;
  };
  reputation: number;
  finance: number;
  energy: number;
  milestones: Set<string>;
  team: Team | null;
  currentLeague: League | null;
  battingPosition: number;
  isCaptain: boolean;
  liveMatch: LiveMatchState | null;
  lastMatchResult?: {
      opponentName: string;
      result: 'win' | 'loss';
      playerRuns: number;
      playerWickets: number;
      playerTeamScore: string;
      opponentScore: string;
      matchSummary: string;
      playerTeamBatting: BattingEntry[];
      opponentTeamBowling: BowlingEntry[];
      opponentTeamBatting: BattingEntry[];
      playerTeamBowling: BowlingEntry[];
      playerOfTheMatch?: string;
  };
  seasonSummary: SeasonSummary | null;
  careerHistory: SeasonHistoryEntry[];
  seasonAwards: string[];
  equipment: Record<string, string>;
}

export interface ChoiceEffectResult {
    updatedPlayer: Player;
    nextEventId?: string;
    newMilestone?: string;
    newGameState?: GameState;
    liveMatchData?: LiveMatchState;
}

export interface Choice {
  text: string;
  effect: (player: Player) => ChoiceEffectResult;
  condition?: (player: Player) => boolean;
}

export interface GameEvent {
  id: string;
  title: string;
  description: (player: Player) => string;
  choices: Choice[];
}