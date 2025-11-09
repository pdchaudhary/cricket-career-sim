import { LiveMatchState, Player, BattingEntry, BowlingEntry, Team, PlayerRole, PlayerAction, BattingActionType, BattingPlacement, BowlingActionType, BowlingLine } from '../types';
import { getEffectivePlayer } from '../constants';


const MAX_OVERS = 20;

const addOver = (currentOvers: number): number => {
    const balls = Math.round((currentOvers % 1) * 10);
    if (balls === 5) {
        return Math.floor(currentOvers) + 1;
    }
    return currentOvers + 0.1;
};

const getAIBatsmanProfile = (batsman: BattingEntry, teamStrength: number) => {
    const base = teamStrength; // 40-80
    const positionBonus = batsman.position < 5 ? 10 : (batsman.position > 8 ? -15 : 0);
    return {
        timing: base + positionBonus + Math.random() * 10,
        power: base + positionBonus + Math.random() * 10,
        aggression: 50 + (10 - batsman.position) * 2,
        temperament: 40 + positionBonus + Math.random() * 20,
        pressureHandling: 30 + positionBonus + Math.random() * 30,
        fitness: 50 + Math.random() * 20,
    };
};

const getAIBowlerProfile = (teamStrength: number) => {
    const base = teamStrength;
    return {
        pace: base + Math.random() * 15,
        accuracy: base + 5 + Math.random() * 15,
        spin: base - 10 + Math.random() * 15,
        fitness: 50 + Math.random() * 20,
    };
};


const checkMatchEnd = (match: LiveMatchState): LiveMatchState => {
    let matchOver = false;
    let resultMessage = '';

    const isInningsOver = match.wickets >= 10 || match.overs >= MAX_OVERS;

    if (match.innings === 1 && isInningsOver) {
        // Switch innings
        const innings1Data = {
            battingCard: match.battingOrder,
            bowlingCard: match.bowlingOrder,
            totalScore: match.score,
            wickets: match.wickets,
            overs: match.overs,
        };
        const nextBattingTeamId = match.battingTeamId === match.playerTeam.id ? match.opponentTeam.id : match.playerTeam.id;
        
        const nextBattingOrder = match.battingTeamId === match.playerTeam.id ? match.opponentTeamBattingOrder : match.playerTeamBattingOrder;


        return {
            ...match,
            innings: 2,
            battingTeamId: nextBattingTeamId,
            target: match.score + 1,
            score: 0,
            wickets: 0,
            overs: 0,
            commentary: [...match.commentary, `--- End of Innings ---`, `Target is ${match.score + 1}`],
            innings1Data,
            battingOrder: nextBattingOrder,
            bowlingOrder: [],
            currentBatsmanIndex: 0,
            onStrikeBatsmanIndex: 0,
            currentBowlerIndex: -1
        };
    }

    if (match.innings === 2) {
        if (match.target && match.score >= match.target) {
            matchOver = true;
            const winnerName = match.battingTeamId === match.playerTeam.id ? match.playerTeam.name : match.opponentTeam.name;
            resultMessage = `${winnerName} won by ${10 - match.wickets} wickets.`;
        } else if (isInningsOver) {
            matchOver = true;
            if (match.score === match.target! - 1) {
                resultMessage = "Match Tied!";
            } else {
                 const loserName = match.battingTeamId === match.playerTeam.id ? match.playerTeam.name : match.opponentTeam.name;
                 const winnerName = loserName === match.playerTeam.name ? match.opponentTeam.name : match.playerTeam.name;
                 resultMessage = `${winnerName} won by ${match.target! - match.score -1} runs.`;
            }
        }
    }

    return { ...match, matchOver, resultMessage };
}

// Main function to process one ball of the match
export const processBall = (match: LiveMatchState, player: Player, action: string | PlayerAction): LiveMatchState => {
    let newMatch = { ...match };
    newMatch.lastBallMilestone = null; // Clear previous milestone
    let isWicket = false;
    
    const overNumber = Math.floor(newMatch.overs);
    const ballInOver = Math.round((newMatch.overs % 1) * 10) + 1;
    const isOverEnd = ballInOver === 6;

    // 1. Manage and identify bowler
    if (newMatch.currentBowlerIndex === -1 || isOverEnd) {
        const bowlingTeamIsPlayerTeam = newMatch.battingTeamId !== newMatch.playerTeam.id;
        let newBowlerName: string;

        if (bowlingTeamIsPlayerTeam && (player.role === PlayerRole.BOWLER || player.role === PlayerRole.ALL_ROUNDER) && (overNumber % 2 === 0)) {
            newBowlerName = player.name;
        } else {
            const bowlingTeamRoster = bowlingTeamIsPlayerTeam ? newMatch.playerTeamBattingOrder : newMatch.opponentTeamBattingOrder;
            const bowlerIndex = 7 + (overNumber % 4);
            newBowlerName = bowlingTeamRoster[bowlerIndex].playerName;
        }

        let bowler = newMatch.bowlingOrder.find(b => b.playerName === newBowlerName);
        if (!bowler) {
            bowler = { playerName: newBowlerName, overs: 0, runs: 0, wickets: 0 };
            newMatch.bowlingOrder.push(bowler);
        }
        newMatch.currentBowlerIndex = newMatch.bowlingOrder.indexOf(bowler);
        if (isOverEnd) {
             newMatch.commentary.push(`--- End of Over ---`);
             newMatch.commentary.push(`${bowler.playerName} comes into the attack.`);
        }
    }
    const currentBowler = newMatch.bowlingOrder[newMatch.currentBowlerIndex];

    // 2. Identify batsman and get profiles
    const onStrikeBatsman = newMatch.battingOrder[newMatch.onStrikeBatsmanIndex];
    const scoreBeforeBall = onStrikeBatsman.runs;
    
    const isPlayerBatting = onStrikeBatsman.playerName === player.name;
    const isPlayerBowling = currentBowler.playerName === player.name;

    const battingTeam = newMatch.battingTeamId === newMatch.playerTeam.id ? newMatch.playerTeam : newMatch.opponentTeam;
    const bowlingTeam = newMatch.battingTeamId === newMatch.playerTeam.id ? newMatch.opponentTeam : newMatch.playerTeam;

    const effectivePlayer = getEffectivePlayer(player);

    const batsmanProfile = isPlayerBatting ? 
        { ...effectivePlayer.skills.batting, ...effectivePlayer.attributes, fitness: effectivePlayer.skills.fitness } :
        getAIBatsmanProfile(onStrikeBatsman, battingTeam.strength);

    const bowlerProfile = isPlayerBowling ?
        { ...effectivePlayer.skills.bowling, fitness: effectivePlayer.skills.fitness } :
        getAIBowlerProfile(bowlingTeam.strength);

    let battingAction: BattingActionType;
    let battingPlacement: BattingPlacement | undefined;
    let bowlingAction: BowlingActionType;
    let bowlingLine: BowlingLine | undefined;

    if (isPlayerBatting && typeof action === 'object' && 'placement' in action) {
        battingAction = action.type;
        battingPlacement = action.placement;
    } else {
        battingAction = ['defensive', 'normal', 'aggressive'][Math.floor(Math.random() * 3)] as BattingActionType;
    }

    if (isPlayerBowling && typeof action === 'object' && 'line' in action) {
        bowlingAction = action.type;
        bowlingLine = action.line;
    } else {
        bowlingAction = ['safe_delivery', 'standard_delivery', 'attacking_delivery'][Math.floor(Math.random() * 3)] as BowlingActionType;
    }

    // 3. Calculate outcome with new factors
    let battingScore = (batsmanProfile.timing * 0.6 + batsmanProfile.power * 0.4);
    let bowlingScore = (bowlerProfile.accuracy * 0.7 + Math.max(bowlerProfile.pace, bowlerProfile.spin) * 0.3);
    let commentary = "";
    let wicketChanceModifier = 1.0;

    // Factor in pitch and weather
    if (newMatch.pitchCondition === 'Green' && newMatch.weather === 'Overcast') bowlingScore *= 1.15;
    if (newMatch.pitchCondition === 'Dusty') bowlingScore *= (bowlerProfile.spin > bowlerProfile.pace ? 1.2 : 0.9);
    if (newMatch.pitchCondition === 'Flat') battingScore *= 1.1;

    // Factor in fatigue
    const ballsFaced = onStrikeBatsman.balls;
    const batsmanFatiguePenalty = Math.max(0, (ballsFaced - 20) / 100) * (1 - batsmanProfile.fitness / 125);
    battingScore *= (1 - batsmanFatiguePenalty);

    const ballsBowled = Math.floor(currentBowler.overs) * 6 + Math.round((currentBowler.overs % 1) * 10);
    const bowlerFatiguePenalty = Math.max(0, (ballsBowled - 18) / 100) * (1 - bowlerProfile.fitness / 125);
    bowlingScore *= (1 - bowlerFatiguePenalty);
    
    // Factor in mental attributes
    battingScore += (batsmanProfile.aggression - 50) * 0.1;
    battingScore += (batsmanProfile.temperament - 50) * 0.1;

    // Factor in pressure
    if (newMatch.innings === 2 && newMatch.target) {
        const requiredRunRate = (newMatch.target - newMatch.score) / (MAX_OVERS - newMatch.overs);
        const pressure = Math.max(0, (requiredRunRate - 9) * 5 + (newMatch.wickets - 6) * 4);
        const pressureEffect = Math.max(0, pressure - batsmanProfile.pressureHandling) / 100;
        battingScore *= (1 - pressureEffect);
        if (pressureEffect > 0.1) commentary += "The pressure is mounting... ";
    }
    
    // Apply pre-match strategy for AI
    if (!isPlayerBatting) {
        if (newMatch.playerTactic === 'aggressive') battingScore *= 1.1;
        else if (newMatch.playerTactic === 'defensive') battingScore *= 0.9;
    }

    // Tactical choices
    if (battingAction === 'aggressive') {
        battingScore *= 1.25; // Less powerful boost
        wicketChanceModifier *= 2.5; // Higher risk
        if (battingPlacement === 'off_side' && Math.random() < 0.1) isWicket = true; // Edged!
    }
    if (battingAction === 'defensive') {
        battingScore *= 0.6;
        wicketChanceModifier *= 0.7;
    }
    if (battingAction === 'single') battingScore *= 0.8;

    if(bowlingAction === 'attacking_delivery') bowlingScore *= 1.2;
    if(bowlingAction === 'yorker') {
        bowlingScore *= 1.3;
        if (bowlingLine === 'on_stump' && bowlerProfile.accuracy > 75 && Math.random() < 0.1) isWicket = true; // Bowled/LBW
    }
    if(bowlingAction === 'safe_delivery') bowlingScore *= 0.8;
    
    // The core contest calculation
    const contest = battingScore - bowlingScore + (Math.random() * 20 - 10); // More balanced contest
    let runs = 0;

    if (contest < -5 && !isWicket) { // More likely to trigger
        if (Math.random() < (0.08 * wicketChanceModifier)) { // Higher base chance
            isWicket = true;
        }
    }

    if (isWicket) {
        runs = 0;
        commentary += `OUT! A brilliant delivery from ${currentBowler.playerName}, ${onStrikeBatsman.playerName} is gone!`;
    } else if (contest < 10) {
        runs = 0;
        commentary += `Dot ball. Excellent pressure from ${currentBowler.playerName}.`;
    } else if (contest < 20) {
        runs = 1;
        commentary += `A quick single taken by ${onStrikeBatsman.playerName}.`;
    } else if (contest < 28) {
        runs = 2;
        commentary += `Good running, they come back for a second.`;
    } else if (contest < 35) {
        runs = (Math.random() > 0.8 ? 3 : 1);
        commentary += `They push it into the gap and pick up ${runs === 3 ? 'three quick runs!' : 'a single.'}`;
    } else if (contest < 45) {
        runs = 4;
        commentary += `FOUR! That's a glorious shot from ${onStrikeBatsman.playerName}!`;
    } else {
        runs = 6;
        commentary += `SIX! It's out of the park! What a hit by ${onStrikeBatsman.playerName}!`;
    }

    if (isWicket) runs = 0;

    // 4. Update State
    onStrikeBatsman.balls += 1;
    onStrikeBatsman.runs += runs;

    if (isPlayerBatting) {
        const scoreAfterBall = onStrikeBatsman.runs;
        if (scoreBeforeBall < 100 && scoreAfterBall >= 100) {
            newMatch.lastBallMilestone = "CENTURY!";
            commentary += ` WHAT A MOMENT! That's a magnificent CENTURY for ${player.name}! The crowd is on its feet!`;
        } else if (scoreBeforeBall < 50 && scoreAfterBall >= 50) {
            newMatch.lastBallMilestone = "FIFTY!";
            commentary += ` AND THAT'S HIS FIFTY! A well-deserved half-century for ${player.name}! He raises his bat to the crowd.`;
        }
    }

    newMatch.score += runs;
    currentBowler.runs += runs;
    newMatch.overs = addOver(newMatch.overs);

    if (isWicket) {
        onStrikeBatsman.isOut = true;
        newMatch.wickets += 1;
        currentBowler.wickets += 1;

        let nextBatsmanIndex = -1;
        for(let i=0; i < newMatch.battingOrder.length; i++) {
           if (!newMatch.battingOrder[i].isOut && newMatch.battingOrder[i].balls === 0) {
               nextBatsmanIndex = i;
               break;
           }
        }
        
        if (nextBatsmanIndex !== -1) {
            newMatch.currentBatsmanIndex = nextBatsmanIndex;
            newMatch.onStrikeBatsmanIndex = nextBatsmanIndex;
        }
    } else {
       if (runs % 2 === 1) {
            const atCrease = newMatch.battingOrder.filter(b => !b.isOut).slice(0,2);
            const nonStriker = atCrease.find(b => newMatch.battingOrder.indexOf(b) !== newMatch.onStrikeBatsmanIndex);
            if(nonStriker) newMatch.onStrikeBatsmanIndex = newMatch.battingOrder.indexOf(nonStriker);
       }
    }
    
    newMatch.commentary = [...newMatch.commentary, `${overNumber}.${ballInOver}: ${commentary}`];

    if (isOverEnd) {
        currentBowler.overs = Math.floor(currentBowler.overs) + 1;
        const atCrease = newMatch.battingOrder.filter(b => !b.isOut).slice(0,2);
        const nonStriker = atCrease.find(b => newMatch.battingOrder.indexOf(b) !== newMatch.onStrikeBatsmanIndex);
        if(nonStriker) newMatch.onStrikeBatsmanIndex = newMatch.battingOrder.indexOf(nonStriker);
    }
    
    return checkMatchEnd(newMatch);
};


export const simulateAIOver = (match: LiveMatchState, player: Player): LiveMatchState => {
    let newMatch = { ...match };
    for (let i = 0; i < 6; i++) {
        if(newMatch.matchOver) break;
        newMatch = processBall(newMatch, player, "ai_sim");
    }
    return newMatch;
};

export const simulatePlayerOver = (match: LiveMatchState, player: Player): LiveMatchState => {
    let newMatch = { ...match };
    
    for (let i = 0; i < 6; i++) {
        if(newMatch.matchOver) break;
        
        const onStrikeBatsman = newMatch.battingOrder[newMatch.onStrikeBatsmanIndex];
        const isPlayerBatting = onStrikeBatsman?.playerName === player.name && !onStrikeBatsman?.isOut;
        const currentBowler = newMatch.currentBowlerIndex !== -1 ? newMatch.bowlingOrder[newMatch.currentBowlerIndex] : null;
        const isPlayerBowling = currentBowler?.playerName === player.name;

        let playerAction: PlayerAction;

        if (isPlayerBatting) {
            let type: BattingActionType = 'normal';
            if (newMatch.playerTactic === 'aggressive') type = Math.random() > 0.4 ? 'aggressive' : 'normal';
            if (newMatch.playerTactic === 'defensive') type = Math.random() > 0.4 ? 'defensive' : 'single';
            const placements: BattingPlacement[] = ['off_side', 'on_side', 'straight'];
            playerAction = {
                type,
                placement: placements[Math.floor(Math.random() * placements.length)]
            };
        } else if (isPlayerBowling) {
            let type: BowlingActionType = 'standard_delivery';
            if (newMatch.playerTactic === 'aggressive') type = Math.random() > 0.4 ? 'attacking_delivery' : 'standard_delivery';
            if (newMatch.playerTactic === 'defensive') type = Math.random() > 0.4 ? 'safe_delivery' : 'standard_delivery';
            const lines: BowlingLine[] = ['outside_off', 'on_stump', 'leg_side'];
            playerAction = {
                type,
                line: lines[Math.floor(Math.random() * lines.length)]
            };
        } else {
             // Should not happen if called correctly, but as a fallback, sim as AI
            newMatch = processBall(newMatch, player, "ai_sim");
            continue;
        }

        newMatch = processBall(newMatch, player, playerAction);
    }
    return newMatch;
};
