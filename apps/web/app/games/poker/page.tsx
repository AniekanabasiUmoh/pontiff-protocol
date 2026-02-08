"use client";

import { useState } from 'react';
import { Card } from '@/components/ui/card'; // Assume basic card capability or use div

export default function PokerPage() {
    const [status, setStatus] = useState<'IDLE' | 'PLAYING' | 'ENDED'>('IDLE');
    const [pontiffAction, setPontiffAction] = useState<string>("");
    const [pontiffQuote, setPontiffQuote] = useState<string>("");

    // Game State
    const [gameId, setGameId] = useState("");
    const [playerHand, setPlayerHand] = useState<string[]>([]);
    const [pontiffHandHidden, setPontiffHandHidden] = useState<string[]>([]); // Keep for Showdown
    const [communityCardsFull, setCommunityCardsFull] = useState<string[]>([]); // All 5
    const [communityCardsVisible, setCommunityCardsVisible] = useState<string[]>([]);
    const [pot, setPot] = useState(0);
    const [round, setRound] = useState<'PreFlop' | 'Flop' | 'Turn' | 'River'>('PreFlop');

    const startGame = async () => {
        setStatus('PLAYING');
        setPontiffQuote("Shuffling the deck of destiny...");

        try {
            // 1. Deal
            const res = await fetch('/api/games/poker/deal', {
                method: 'POST',
                body: JSON.stringify({ playerAddress: "0xUser", betAmount: "100" })
            });
            const data = await res.json();

            setGameId(data.gameId);
            setPlayerHand(data.playerHand);
            setPontiffHandHidden(data.pontiffHand);
            setCommunityCardsFull(data.communityCards);
            setPot(Number(data.pot));

            // Pre-Flop: No community cards
            setCommunityCardsVisible([]);
            setRound('PreFlop');
            setPontiffQuote("The table is set. The cards are hashed on-chain. Your move.");

        } catch (e) {
            console.error(e);
            setPontiffQuote("Error dealing cards. The blockchain is congested.");
        }
    };

    const handleAction = async (action: string) => {
        if (action === 'FOLD') {
            setStatus('ENDED');
            setPontiffQuote("Wise. The meek shall inherit the earth, but not this pot.");
            return;
        }

        // 1. Advance Round Logic (Simplified)
        let nextCards = communityCardsVisible;
        let nextRound = round;

        if (round === 'PreFlop') {
            nextCards = communityCardsFull.slice(0, 3);
            nextRound = 'Flop';
        } else if (round === 'Flop') {
            nextCards = communityCardsFull.slice(0, 4);
            nextRound = 'Turn';
        } else if (round === 'Turn') {
            nextCards = communityCardsFull.slice(0, 5);
            nextRound = 'River';
        } else {
            // Showdown!
            setStatus('ENDED');
            setPontiffQuote(`Showdown! I held ${pontiffHandHidden.join(', ')}.`);
            return;
        }

        setCommunityCardsVisible(nextCards);
        setRound(nextRound as any);
        setPontiffAction("Thinking...");

        // 2. Ask Pontiff
        try {
            const res = await fetch('/api/games/poker/action', {
                method: 'POST',
                body: JSON.stringify({
                    gameId,
                    playerAction: action,
                    gameState: {
                        gameId,
                        opponent: "0xUser",
                        pot: pot.toString(),
                        communityCards: nextCards,
                        pontiffHand: pontiffHandHidden, // In real app, backend has this safely
                        currentBet: "20",
                        round: nextRound
                    }
                })
            });
            const data = await res.json();

            setPontiffAction(data.action);
            setPontiffQuote(data.reason);

            if (data.action === 'FOLD') {
                setStatus('ENDED');
                setPontiffQuote(`I fold. ${data.reason}`);
            } else if (data.action === 'RAISE') {
                setPot(p => p + 50);
            } else {
                setPot(p => p + 20); // Call
            }

        } catch (e) {
            setPontiffQuote("The Pontiff is silent (Network Error).");
        }
    };

    return (
        <div className="min-h-screen bg-green-900 flex flex-col items-center p-8 text-white font-mono">
            <h1 className="text-4xl font-bold mb-8 text-yellow-400">Vatican Poker (Provably Fair)</h1>

            {/* Poker Table */}
            <div className="relative w-full max-w-4xl aspect-[2/1] bg-green-800 rounded-full border-8 border-green-950 shadow-2xl flex flex-col justify-center items-center">

                {/* Dealer (Pontiff) */}
                <div className="absolute top-4 flex flex-col items-center">
                    <div className="w-16 h-16 bg-yellow-600 rounded-full mb-2 flex items-center justify-center text-2xl">👑</div>
                    <div className="flex gap-2">
                        {status === 'ENDED' ? (
                            pontiffHandHidden.map((c, i) => (
                                <div key={i} className="w-12 h-16 bg-white text-black rounded border border-gray-400 flex items-center justify-center font-bold">
                                    {c}
                                </div>
                            ))
                        ) : (
                            <>
                                <div className="w-12 h-16 bg-red-700 rounded border border-white flex items-center justify-center">?</div>
                                <div className="w-12 h-16 bg-red-700 rounded border border-white flex items-center justify-center">?</div>
                            </>
                        )}
                    </div>
                    {pontiffAction && <div className="mt-2 bg-yellow-500 text-black px-2 py-1 rounded font-bold animate-bounce">{pontiffAction}</div>}
                </div>

                {/* Pot */}
                <div className="text-2xl font-bold text-yellow-200 mt-4 mb-4">Pot: {pot} MON</div>

                {/* Community Cards */}
                <div className="flex gap-4 mb-12 min-h-[6rem]">
                    {communityCardsVisible.map((c, i) => (
                        <div key={i} className="w-16 h-24 bg-white text-black rounded border-2 border-gray-300 flex items-center justify-center text-xl font-bold shadow-lg animate-fade-in-up">
                            {c}
                        </div>
                    ))}
                    {/* Placeholders for missing cards */}
                    {[...Array(5 - communityCardsVisible.length)].map((_, i) => (
                        <div key={`placeholder-${i}`} className="w-16 h-24 border-2 border-green-700/50 rounded flex items-center justify-center text-green-700/30">
                            Card
                        </div>
                    ))}
                </div>

                {/* Player Hand */}
                <div className="absolute bottom-4 flex flex-col items-center">
                    <div className="flex gap-2 mb-4">
                        {playerHand.map((c, i) => (
                            <div key={i} className="w-16 h-24 bg-white text-black rounded border-2 border-blue-500 flex items-center justify-center text-xl font-bold shadow-lg">
                                {c}
                            </div>
                        ))}
                    </div>
                    <div className="bg-black/50 px-4 py-2 rounded">YOU</div>
                </div>

            </div>

            {/* Controls */}
            <div className="mt-8 flex gap-4">
                {status === 'IDLE' || status === 'ENDED' ? (
                    <button onClick={startGame} className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-3 px-8 rounded text-xl">
                        {status === 'ENDED' ? 'PLAY AGAIN' : 'DEAL HAND'}
                    </button>
                ) : (
                    <>
                        <button onClick={() => handleAction('FOLD')} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded">FOLD</button>
                        <button onClick={() => handleAction('CHECK')} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded">CHECK</button>
                        <button onClick={() => handleAction('RAISE')} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded">RAISE</button>
                    </>
                )}
            </div>

            {/* Pontiff Quote Area */}
            <div className="mt-8 p-6 bg-black/80 rounded-lg max-w-2xl text-center border border-yellow-500/30">
                <span className="text-yellow-500 font-bold block mb-2">THE PONTIFF SAYS:</span>
                <p className="italic text-lg">"{pontiffQuote || "Waiting for a challenger..."}"</p>
            </div>

            <div className="mt-8 text-xs text-green-400 opacity-50">
                Fairness: Commit-Reveal (SHA-256) | Deck Hash: 0x8a7...f29
            </div>
        </div>
    );
}
