
import React, { useState, useEffect, useRef } from 'react';
import { Player, LiveMatchState, PlayerAction, BattingActionType, BattingPlacement, BowlingActionType, BowlingLine, PlayerBattingAction, PlayerBowlingAction } from '../types';
import { processBall, simulateAIOver, simulatePlayerOver } from './match-simulation';
import { GoogleGenAI, Modality } from "@google/genai";
import { VolumeUpIcon, VolumeOffIcon } from './icons/StatIcons';

interface MatchScreenProps {
    player: Player;
    initialMatchState: LiveMatchState;
    onMatchEnd: (finalState: LiveMatchState) => void;
}

// Audio Decoding Helpers from Gemini Docs
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}


const Scoreboard: React.FC<{ match: LiveMatchState }> = ({ match }) => {
    const battingTeamName = match.battingTeamId === match.playerTeam.id ? match.playerTeam.name : match.opponentTeam.name;
    const oversDisplay = `${Math.floor(match.overs)}.${Math.round((match.overs % 1) * 10)}`;

    const atCrease = match.battingOrder.filter(b => !b.isOut).slice(0, 2);
    const onStrikeBatsman = atCrease.find((b) => match.onStrikeBatsmanIndex === match.battingOrder.indexOf(b));
    const nonStrikerBatsman = atCrease.find(b => b !== onStrikeBatsman);

    const currentBowler = match.currentBowlerIndex !== -1 ? match.bowlingOrder[match.currentBowlerIndex] : null;

    return (
        <div className="bg-black/50 p-4 rounded-lg shadow-inner mb-4 border border-slate-700">
            <div className="flex justify-between items-center">
                <div className="w-2/5">
                    <p className="text-2xl font-bold text-white truncate">{battingTeamName}</p>
                    {match.innings === 2 && match.target && (
                        <p className="text-sm text-amber-400">Target: {match.target}</p>
                    )}
                </div>
                <div className="text-center flex-shrink-0 mx-4">
                    <p className="text-5xl font-bold font-mono text-amber-400 tracking-tighter">{match.score}-{match.wickets}</p>
                </div>
                <div className="text-right w-2/5">
                    <p className="text-2xl font-bold text-white">Overs: {oversDisplay}</p>
                </div>
            </div>
             <div className="h-1 bg-slate-700 rounded-full mt-3">
                <div className="h-1 bg-amber-400 rounded-full" style={{ width: `${(match.overs / 20) * 100}%`}}></div>
            </div>
             <div className="mt-4 flex justify-between text-white border-t border-slate-700 pt-3 text-base">
                <div>
                    {onStrikeBatsman && <p>{onStrikeBatsman.playerName}* <span className="font-bold">{onStrikeBatsman.runs}</span> <span className="text-slate-400">({onStrikeBatsman.balls})</span></p>}
                    {nonStrikerBatsman && <p>{nonStrikerBatsman.playerName} <span className="font-bold">{nonStrikerBatsman.runs}</span> <span className="text-slate-400">({nonStrikerBatsman.balls})</span></p>}
                </div>
                {currentBowler && (
                    <div className="text-right">
                        <p>Bowler: {currentBowler.playerName}</p>
                        <p className="font-mono text-slate-300">
                            {currentBowler.overs}-{currentBowler.runs}-{currentBowler.wickets}
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
};

const Commentary: React.FC<{ log: string[] }> = ({ log }) => {
    const commentaryEndRef = useRef<null | HTMLDivElement>(null);
    useEffect(() => {
        commentaryEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [log]);

    return (
        <div className="bg-slate-900/50 p-4 rounded-lg flex-grow h-64 overflow-y-auto">
            {log.map((entry, index) => (
                 <p key={index} className="text-slate-300 mb-1.5 text-sm">{entry}</p>
            ))}
            <div ref={commentaryEndRef} />
        </div>
    )
};

const InteractiveActionPanel: React.FC<{ match: LiveMatchState; player: Player; onAction: (action: PlayerAction) => void; }> = ({ match, player, onAction }) => {
    const onStrikeBatsman = match.battingOrder[match.onStrikeBatsmanIndex];
    const isPlayerBatting = match.battingTeamId === player.team!.id && onStrikeBatsman?.playerName === player.name && !onStrikeBatsman?.isOut;

    const [shotType, setShotType] = useState<BattingActionType>('normal');
    const [shotPlacement, setShotPlacement] = useState<BattingPlacement>('straight');
    const [deliveryType, setDeliveryType] = useState<BowlingActionType>('standard_delivery');
    const [deliveryLine, setDeliveryLine] = useState<BowlingLine>('on_stump');

    const handleBatting = () => {
        onAction({ type: shotType, placement: shotPlacement });
    };

    const handleBowling = () => {
        onAction({ type: deliveryType, line: deliveryLine });
    };
    
    if (isPlayerBatting) {
        return (
            <div className="mt-4 p-4 glass-card rounded-lg border border-amber-500/50">
                <h3 className="text-lg font-semibold text-center text-amber-400 mb-4">Batting Controls</h3>
                <div className="grid grid-cols-2 gap-6">
                    {/* Shot Type */}
                    <div className="space-y-2">
                        <h4 className="font-semibold text-slate-300">Shot Type</h4>
                        {(['defensive', 'normal', 'aggressive', 'single'] as BattingActionType[]).map(type => (
                            <button key={type} onClick={() => setShotType(type)} className={`w-full p-2 rounded transition-colors text-sm capitalize ${shotType === type ? 'bg-amber-500 text-slate-900 font-bold' : 'bg-slate-700 hover:bg-slate-600'}`}>{type.replace('_', ' ')}</button>
                        ))}
                    </div>
                    {/* Shot Placement */}
                    <div className="space-y-2">
                         <h4 className="font-semibold text-slate-300">Placement</h4>
                         {(['off_side', 'on_side', 'straight'] as BattingPlacement[]).map(place => (
                            <button key={place} onClick={() => setShotPlacement(place)} className={`w-full p-2 rounded transition-colors text-sm capitalize ${shotPlacement === place ? 'bg-amber-500 text-slate-900 font-bold' : 'bg-slate-700 hover:bg-slate-600'}`}>{place.replace('_', ' ')}</button>
                        ))}
                    </div>
                </div>
                <button onClick={handleBatting} className="w-full mt-6 bg-green-600 hover:bg-green-500 p-3 rounded-lg text-lg font-bold transition-transform transform hover:scale-105">Play Shot</button>
            </div>
        );
    }

    // Player is bowling
    return (
         <div className="mt-4 p-4 glass-card rounded-lg border border-cyan-500/50">
            <h3 className="text-lg font-semibold text-center text-cyan-400 mb-4">Bowling Controls</h3>
            <div className="grid grid-cols-2 gap-6">
                {/* Delivery Type */}
                <div className="space-y-2">
                    <h4 className="font-semibold text-slate-300">Delivery Type</h4>
                    {(['safe_delivery', 'standard_delivery', 'attacking_delivery', 'yorker'] as BowlingActionType[]).map(type => (
                        <button key={type} onClick={() => setDeliveryType(type)} className={`w-full p-2 rounded transition-colors text-sm capitalize ${deliveryType === type ? 'bg-cyan-500 text-slate-900 font-bold' : 'bg-slate-700 hover:bg-slate-600'}`}>{type.replace('_', ' ')}</button>
                    ))}
                </div>
                {/* Delivery Line */}
                <div className="space-y-2">
                     <h4 className="font-semibold text-slate-300">Line</h4>
                     {(['outside_off', 'on_stump', 'leg_side'] as BowlingLine[]).map(line => (
                        <button key={line} onClick={() => setDeliveryLine(line)} className={`w-full p-2 rounded transition-colors text-sm capitalize ${deliveryLine === line ? 'bg-cyan-500 text-slate-900 font-bold' : 'bg-slate-700 hover:bg-slate-600'}`}>{line.replace('_', ' ')}</button>
                    ))}
                </div>
            </div>
            <button onClick={handleBowling} className="w-full mt-6 bg-red-600 hover:bg-red-500 p-3 rounded-lg text-lg font-bold transition-transform transform hover:scale-105">Bowl Ball</button>
        </div>
    );
};


const MatchScreen: React.FC<MatchScreenProps> = ({ player, initialMatchState, onMatchEnd }) => {
    const [match, setMatch] = useState<LiveMatchState>(initialMatchState);
    const [milestoneCelebration, setMilestoneCelebration] = useState<string | null>(null);
    const [playerTurnState, setPlayerTurnState] = useState<'awaiting_choice' | 'playing' | 'ai_turn'>('ai_turn');
    
    // State and refs for voice commentary
    const [isVoiceCommentaryOn, setVoiceCommentaryOn] = useState(false);
    const audioContextRef = useRef<AudioContext | null>(null);
    const nextStartTimeRef = useRef(0);
    const aiRef = useRef<GoogleGenAI | null>(null);
    const lastSpokenCommentaryIndexRef = useRef(-1);

    const isPlayerTurn = (() => {
        if (match.matchOver) return false;
        const onStrikeBatsman = match.battingOrder[match.onStrikeBatsmanIndex];
        const isPlayerBatting = match.battingTeamId === player.team!.id && onStrikeBatsman?.playerName === player.name && !onStrikeBatsman?.isOut;
        
        const isNewOver = (match.overs * 10) % 10 === 0;
        const currentBowler = match.currentBowlerIndex !== -1 ? match.bowlingOrder[match.currentBowlerIndex] : null;
        let isPlayerBowling = false;
        if(isNewOver) {
            // Logic to check if player will bowl this over
             const bowlingTeamIsPlayerTeam = match.battingTeamId !== player.team!.id;
             if (bowlingTeamIsPlayerTeam && (player.role === 'Bowler' || player.role === 'All-rounder') && (Math.floor(match.overs) % 2 === 0)) {
                 isPlayerBowling = true;
             }
        } else {
            isPlayerBowling = match.battingTeamId !== player.team!.id && currentBowler?.playerName === player.name;
        }

        return isPlayerBatting || isPlayerBowling;
    })();

    useEffect(() => {
        if (isPlayerTurn && playerTurnState === 'ai_turn') {
            setPlayerTurnState('awaiting_choice');
        } else if (!isPlayerTurn && playerTurnState !== 'ai_turn') {
            setPlayerTurnState('ai_turn');
        }
    }, [isPlayerTurn, match.overs, playerTurnState]);

    useEffect(() => {
        document.body.classList.add('in-match');
        return () => {
            document.body.classList.remove('in-match');
        };
    }, []);

    useEffect(() => {
        if(match.matchOver) {
            setTimeout(() => onMatchEnd(match), 3000);
        }
    }, [match.matchOver, onMatchEnd, match]);

    useEffect(() => {
        if (match.lastBallMilestone) {
            setMilestoneCelebration(match.lastBallMilestone);
            const timer = setTimeout(() => {
                setMilestoneCelebration(null);
            }, 3000); 
            return () => clearTimeout(timer);
        }
    }, [match.lastBallMilestone, match.commentary.length]);
    
    const speak = async (text: string) => {
        if (!isVoiceCommentaryOn || !audioContextRef.current) return;
    
        if (!aiRef.current) {
            aiRef.current = new GoogleGenAI({ apiKey: process.env.API_KEY });
        }
        const ai = aiRef.current;
    
        try {
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash-preview-tts",
                contents: [{ parts: [{ text: text }] }],
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: {
                        voiceConfig: {
                            prebuiltVoiceConfig: { voiceName: 'Kore' },
                        },
                    },
                },
            });
            
            const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
            if (base64Audio) {
                const ctx = audioContextRef.current;
                nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
                
                const audioBuffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
    
                const source = ctx.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(ctx.destination);
    
                source.start(nextStartTimeRef.current);
                nextStartTimeRef.current += audioBuffer.duration;
            }
        } catch (error) {
            console.error("Error generating speech:", error);
        }
    };
    
    useEffect(() => {
        if (isVoiceCommentaryOn && match.commentary.length > lastSpokenCommentaryIndexRef.current + 1) {
            const newCommentaryIndex = lastSpokenCommentaryIndexRef.current + 1;
            const latestCommentary = match.commentary[newCommentaryIndex];
            
            if (latestCommentary) {
                // Remove the "X.X:" prefix for cleaner speech
                const textToSpeak = latestCommentary.replace(/^\d+\.\d+:\s*/, '');
                speak(textToSpeak);
                lastSpokenCommentaryIndexRef.current = newCommentaryIndex;
            }
        }
    }, [match.commentary, isVoiceCommentaryOn]);


    const handleAction = (action: string | PlayerAction) => {
        if(match.matchOver || milestoneCelebration) return;
        
        let newState: LiveMatchState;
        if (action === 'simulate_over') {
            newState = simulateAIOver(match, player);
        } else if (action === 'simulate_player_over') {
            newState = simulatePlayerOver(match, player);
            setPlayerTurnState('ai_turn');
        }
        else {
            newState = processBall(match, player, action);
        }
        setMatch(newState);
    };
    
    const toggleVoiceCommentary = () => {
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        }
        // Resume context if it was suspended by browser policy
        if (audioContextRef.current.state === 'suspended') {
            audioContextRef.current.resume();
        }
        setVoiceCommentaryOn(prev => !prev);
    };

    return (
        <div className="max-w-4xl mx-auto glass-card p-6 flex flex-col relative" style={{ minHeight: 'calc(100vh - 3rem)' }}>
            {milestoneCelebration && (
                <div className="absolute inset-0 bg-black bg-opacity-80 flex flex-col items-center justify-center z-50 animate-fade-in-out rounded-2xl">
                    <h1 className="text-7xl font-bold text-amber-400 drop-shadow-lg tracking-wider">{milestoneCelebration}</h1>
                    <p className="text-3xl text-white mt-4">A brilliant achievement by {player.name}!</p>
                </div>
            )}
             <div className="absolute top-4 right-4 z-10">
                <button 
                    onClick={toggleVoiceCommentary}
                    className={`p-2 rounded-full transition-colors ${isVoiceCommentaryOn ? 'bg-amber-500 text-slate-900' : 'bg-slate-700 text-white hover:bg-slate-600'}`}
                    aria-label="Toggle Voice Commentary"
                >
                    {isVoiceCommentaryOn ? <VolumeUpIcon /> : <VolumeOffIcon />}
                </button>
            </div>
            <Scoreboard match={match} />
            <Commentary log={match.commentary} />

            {match.matchOver ? (
                 <div className="mt-4 p-4 text-center bg-gradient-to-r from-green-600 to-teal-500 rounded-lg">
                    <h2 className="text-2xl font-bold">{match.resultMessage}</h2>
                </div>
            ) : (
                <>
                    {playerTurnState === 'awaiting_choice' && isPlayerTurn && (
                        <div className="mt-4 p-4 text-center bg-slate-900/50 rounded-lg">
                            <h2 className="text-xl font-bold text-amber-400 mb-4">It's your turn!</h2>
                            <div className="flex gap-4 justify-center">
                                <button onClick={() => setPlayerTurnState('playing')} className="bg-green-600 hover:bg-green-500 p-4 rounded-lg text-lg font-semibold transition-transform transform hover:scale-105 flex-1">Play Ball-by-Ball</button>
                                <button onClick={() => handleAction('simulate_player_over')} className="bg-blue-600 hover:bg-blue-500 p-4 rounded-lg text-lg font-semibold transition-transform transform hover:scale-105 flex-1">Auto-Play Over</button>
                            </div>
                        </div>
                    )}
                    {playerTurnState === 'playing' && isPlayerTurn && (
                        <InteractiveActionPanel match={match} player={player} onAction={handleAction} />
                    )}
                    {playerTurnState === 'ai_turn' && !isPlayerTurn && (
                        <div className="mt-4">
                            <button onClick={() => handleAction('simulate_over')} className="w-full bg-slate-700 hover:bg-amber-600/80 p-4 rounded-lg text-lg font-semibold transition-transform transform hover:scale-105">Simulate Over</button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default MatchScreen;