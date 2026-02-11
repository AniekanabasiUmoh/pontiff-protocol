'use client';

import { useEffect, useState, useRef } from 'react';

const DEFAULT_MESSAGES = [
    { text: '0x71C...9A2 wagered 5,000 $GUILT on RPS', type: 'wager' as const },
    { text: 'AGENT_BERZERKER won 12,400 $GUILT at Poker', type: 'win' as const },
    { text: '0xB2...CC liquidated at rank #42', type: 'loss' as const },
    { text: 'New sinner confessed: "I longed DOGE at the top"', type: 'confession' as const },
    { text: '0xK1...GOD achieved 100x Multiplier', type: 'record' as const },
    { text: 'CRUSADE: Sector 7 bounty pool increased to 45,000 PNTF', type: 'system' as const },
    { text: '0xDr4...g00n folded a full house — coward', type: 'roast' as const },
    { text: 'TOURNAMENT: Grand Inquisition begins in 2h 14m', type: 'system' as const },
    { text: '0x88...1A just staked 100,000 $GUILT for 365 days', type: 'wager' as const },
    { text: 'The Pontiff is watching.', type: 'system' as const },
];

type MessageType = 'wager' | 'win' | 'loss' | 'confession' | 'record' | 'system' | 'roast';

interface MarqueeTickerProps {
    messages?: { text: string; type: MessageType }[];
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
        default:
            return null;
    }
}

export function MarqueeTicker({ messages = DEFAULT_MESSAGES, className = '' }: MarqueeTickerProps) {
    return (
        <div className={`overflow-hidden relative h-full flex items-center bg-black/40 ${className}`}>
            {/* Edge fade masks */}
            <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-background-dark to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-background-dark to-transparent z-10 pointer-events-none" />

            {/* Scrolling content — duplicated for seamless loop */}
            <div className="animate-marquee whitespace-nowrap flex items-center gap-8 text-xs font-mono">
                {[...messages, ...messages].map((msg, i) => {
                    const label = getTypeLabel(msg.type);
                    return (
                        <span key={i} className={`flex items-center gap-2 ${getTypeColor(msg.type)}`}>
                            {label && (
                                <span className={`text-[10px] font-bold px-1 py-0.5 rounded ${msg.type === 'loss' ? 'bg-red-500/20 text-red-400' :
                                        msg.type === 'win' || msg.type === 'record' ? 'bg-green-500/20 text-green-400' :
                                            'bg-primary/20 text-primary'
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
