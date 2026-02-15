'use client';

import { useEffect, useState } from 'react';

const DEFAULT_MESSAGES = [
    { text: '0x71C...9A2 wagered 5,000 $GUILT on RPS', type: 'wager' as const },
    { text: 'AGENT_BERZERKER won 12,400 $GUILT at Poker', type: 'win' as const },
    { text: '0xB2...CC liquidated at rank #42', type: 'loss' as const },
    { text: '0xK1...GOD achieved 100x Multiplier', type: 'record' as const },
    { text: 'CRUSADE: Sector 7 bounty pool increased to 45,000 PNTF', type: 'system' as const },
    { text: 'TOURNAMENT: Grand Inquisition begins in 2h 14m', type: 'system' as const },
    { text: 'The Pontiff is watching.', type: 'system' as const },
    { text: '0xAa...123 bought 10,000 $GUILT', type: 'wager' as const },
    { text: '0xBb...456 lost 2,500 $GUILT in the Arena', type: 'loss' as const },
    { text: '0xCc...789 staked 1,000 $GUILT for Penance', type: 'confession' as const },
    { text: 'AGENT_NECRO lost a duel against AGENT_PALADIN', type: 'loss' as const },
    { text: '0xDd...012 found a rare artifact in the Catacombs', type: 'win' as const },
    { text: '0xEe...345 confessed: "I sold my BTC at $15k"', type: 'confession' as const },
    { text: '0xFf...678 confessed: "I bought a pizza with 10k BTC"', type: 'confession' as const },
    { text: '0x11...999 confessed: "I leveraged longs on LUNA"', type: 'confession' as const },
    { text: '0x22...888 confessed: "I clicked a phishing link"', type: 'confession' as const },
    { text: '0x33...777 confessed: "I ignored the whitepaper"', type: 'confession' as const },
    { text: 'New Crusade launched: "The Purge of the Shitcoins"', type: 'system' as const },
    { text: '0x44...666 achieved rank #1 in the Leaderboard', type: 'record' as const },
    { text: '0x55...555 won the weekly lottery!', type: 'win' as const },
    { text: '0x66...444 burnt 5,000 $GUILT', type: 'system' as const },
    { text: '0x77...333 minted a legendary NFT', type: 'win' as const },
    { text: '0x88...222 sent 100 $GUILT to the wrong address', type: 'loss' as const },
    { text: '0x99...111 forgot their seed phrase', type: 'loss' as const },
    { text: 'The Inquisition is accepting new recruits', type: 'system' as const },
    { text: '0x00...000 confessed: "I fomo\'d into a rug pull"', type: 'confession' as const },
    { text: '0xAb...CdE confessed: "I bought high and sold low"', type: 'confession' as const },
    { text: '0xFed...Cba confessed: "I trade based on tiktok advice"', type: 'confession' as const },
    { text: '0x12...345 confessed: "I lost my life savings on a dog coin"', type: 'confession' as const },
    { text: '0x67...890 confessed: "I believe in the tech (I don\'t)"', type: 'confession' as const },
    { text: 'AGENT_SHADOW assassinated AGENT_LIGHT', type: 'win' as const },
    { text: '0xDe...AdB confessed: "I have paper hands"', type: 'confession' as const },
    { text: '0xBe...Ef1 confessed: "I am a moon boy"', type: 'confession' as const },
    { text: '0xCa...Fe2 confessed: "I shilled a scam"', type: 'confession' as const },
    { text: '0xBa...Be3 confessed: "I use 123456 as my password"', type: 'confession' as const },
    { text: '0xDa...Dd4 confessed: "I sent ETH to a contract address"', type: 'confession' as const },
    { text: '0xFa...Ce5 confessed: "I panic sold at the bottom"', type: 'confession' as const },
    { text: 'Global Sin Level increased by 0.5%', type: 'system' as const },
    { text: '0xAc...Dc6 confessed: "I check my portfolio every 5 seconds"', type: 'confession' as const },
    { text: '0xDc...Ba7 confessed: "I borrow money to buy crypto"', type: 'confession' as const },
    { text: '0xEd...Fe8 confessed: "I tell my family I\'m a genius investor"', type: 'confession' as const },
    { text: '0xFe...Ed9 confessed: "I cry when line go down"', type: 'confession' as const },
];

type MessageType = 'wager' | 'win' | 'loss' | 'confession' | 'record' | 'system' | 'roast';

interface MarqueeTickerProps {
    className?: string;
}

function getTypeColor(type: MessageType): string {
    switch (type) {
        case 'win':
        case 'record':
            return 'text-green-400';
        case 'loss':
            return 'text-red-400';
        case 'confession':
        case 'roast':
            return 'text-primary';
        case 'system':
            return 'text-primary/80';
        case 'wager':
        default:
            return 'text-gray-400';
    }
}

function getTypeLabel(type: MessageType): string | null {
    switch (type) {
        case 'win':
        case 'record':
            return 'NEW';
        case 'loss':
            return 'RIP';
        case 'system':
            return 'SYS';
        case 'confession':
            return 'SIN';
        default:
            return null;
    }
}

export function MarqueeTicker({ className = '' }: MarqueeTickerProps) {
    // Start with unshuffled messages to avoid hydration mismatch
    const [messages, setMessages] = useState(DEFAULT_MESSAGES);
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        // Mark as client-side and shuffle messages
        setIsClient(true);
        setMessages([...DEFAULT_MESSAGES].sort(() => Math.random() - 0.5));

        const fetchConfessions = async () => {
            try {
                const res = await fetch('/api/confession/recent?limit=5');
                if (res.ok) {
                    const data = await res.json();
                    if (data.confessions && data.confessions.length > 0) {
                        const newMessages = data.confessions.map((c: any) => ({
                            text: `CONFESSION: ${c.roast_text ? c.roast_text.slice(0, 60) + '...' : 'Sinner confessed.'}`,
                            type: 'confession' as const
                        }));
                        setMessages([...DEFAULT_MESSAGES, ...newMessages]);
                    }
                }
            } catch (e) {
                console.error('Failed to fetch ticker data', e);
            }
        };

        fetchConfessions();
        const interval = setInterval(fetchConfessions, 60000); // Refresh every minute
        return () => clearInterval(interval);
    }, []);

    return (
        <div className={`overflow-hidden relative h-full flex items-center bg-black/40 ${className}`}>
            {/* Edge fade masks */}
            <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-background-dark to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-background-dark to-transparent z-10 pointer-events-none" />

            {/* Scrolling content — duplicated for seamless loop */}
            <div className="animate-marquee whitespace-nowrap flex items-center gap-12 text-xs font-mono hover:pause-animation">
                {[...messages, ...messages].map((msg, i) => {
                    const label = getTypeLabel(msg.type);
                    return (
                        <span key={i} className={`flex items-center gap-3 ${getTypeColor(msg.type)}`}>
                            {label && (
                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${msg.type === 'loss' ? 'bg-red-900/20 text-red-400 border-red-900/30' :
                                    msg.type === 'win' || msg.type === 'record' ? 'bg-green-900/20 text-green-400 border-green-900/30' :
                                        (msg.type as string) === 'confession' ? 'bg-primary/10 text-primary border-primary/20' :
                                            'bg-gray-800 text-gray-400 border-gray-700'
                                    }`}>
                                    {label}
                                </span>
                            )}
                            {msg.text}
                        </span>
                    );
                })}
            </div>
        </div>
    );
}
