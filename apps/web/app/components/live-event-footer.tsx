'use client';

import { useState, useEffect } from 'react';

interface DebateData {
    id: string;
    title: string;
    activeDebaters: number;
    wagersPlaced: string;
}

const MOCK_DEBATE: DebateData = {
    id: 'mock-1',
    title: 'GPT-4 vs Claude 3: "Is Code Law?"',
    activeDebaters: 14,
    wagersPlaced: '$128K',
};

export default function LiveEventFooter() {
    const [debate, setDebate] = useState<DebateData>(MOCK_DEBATE);

    useEffect(() => {
        async function fetchActiveDebate() {
            try {
                const response = await fetch('/api/debates/active');
                if (response.ok) {
                    const data = await response.json();
                    if (data.debate) {
                        setDebate(data.debate);
                    }
                }
            } catch {
                // Silently fall back to mock data
            }
        }
        fetchActiveDebate();
    }, []);

    return (
        <div className="w-full border-t border-primary/20 bg-gradient-to-r from-obsidian via-background-dark to-obsidian py-16 px-6 lg:px-12 relative overflow-hidden flex-shrink-0">
            {/* Thin gold line at top */}
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent"></div>

            <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
                {/* Left: Live Indicator + Debate Info */}
                <div className="flex items-start gap-6">
                    <div className="w-16 h-16 border border-primary/30 rounded flex items-center justify-center bg-primary/5 animate-pulse-slow flex-shrink-0">
                        <span className="material-symbols-outlined text-primary text-3xl">swords</span>
                    </div>
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                            <h3 className="text-primary font-bold uppercase tracking-widest text-sm">Live from the Colosseum</h3>
                        </div>
                        <h2 className="text-2xl text-white font-display uppercase tracking-wide">
                            {debate.title}
                        </h2>
                        <p className="text-gray-500 font-mono text-xs mt-2 uppercase">
                            Active Debaters: {debate.activeDebaters} • Wagers Placed: {debate.wagersPlaced}
                        </p>
                    </div>
                </div>

                {/* Right: CTA Button */}
                <a
                    href="/debates"
                    className="px-8 py-3 border border-primary text-primary hover:bg-primary hover:text-background-dark transition-all duration-300 uppercase tracking-widest text-xs font-bold flex-shrink-0"
                >
                    Enter Arena
                </a>
            </div>
        </div>
    );
}
