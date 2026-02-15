'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

interface NavItem {
    label: string;
    href: string;
    icon: string;
    section?: string;
}

const NAV_ITEMS: NavItem[] = [
    { label: 'Faucet', href: '/faucet', icon: 'water_drop', section: 'start' },
    { label: 'Agents', href: '/agents', icon: 'smart_toy', section: 'start' },
    { label: 'RPS Arena', href: '/games/rps', icon: 'sports_mma', section: 'play' },
    { label: 'Poker Table', href: '/games/poker', icon: 'style', section: 'play' },
    { label: 'Judas Protocol', href: '/judas', icon: 'visibility', section: 'play' },
    { label: 'Confessional', href: '/confess', icon: 'psychology_alt', section: 'play' },
    { label: 'Tournaments', href: '/tournaments', icon: 'emoji_events', section: 'compete' },
    { label: 'Leaderboard', href: '/leaderboard', icon: 'leaderboard', section: 'compete' },
    { label: 'Competitors', href: '/competitors', icon: 'shield', section: 'compete' },
    { label: 'Crusades', href: '/crusades', icon: 'gps_fixed', section: 'compete' },
    { label: 'Conversions', href: '/conversions', icon: 'auto_fix_high', section: 'compete' },
    { label: 'Debates', href: '/debates', icon: 'forum', section: 'compete' },
    { label: 'Live Wire', href: '/live', icon: 'electric_bolt', section: 'compete' },
    { label: 'Cathedral', href: '/cathedral', icon: 'account_balance', section: 'economy' },
    { label: 'Indulgences', href: '/indulgences', icon: 'local_fire_department', section: 'economy' },
    { label: 'Membership', href: '/membership', icon: 'card_membership', section: 'economy' },
    { label: 'Election', href: '/election', icon: 'how_to_vote', section: 'economy' },
];

const SECTION_LABELS: Record<string, string> = {
    start: 'START',
    play: 'PLAY',
    compete: 'COMPETE',
    economy: 'ECONOMY',
};

export function Sidebar() {
    const pathname = usePathname();
    const [isExpanded, setIsExpanded] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    // Group nav items by section
    const sections = NAV_ITEMS.reduce((acc, item) => {
        const section = item.section || 'other';
        if (!acc[section]) acc[section] = [];
        acc[section].push(item);
        return acc;
    }, {} as Record<string, NavItem[]>);

    const isActive = (href: string) => pathname?.startsWith(href) ?? false;

    const navContent = (onLinkClick?: () => void) => (
        <nav className="flex-1 overflow-y-auto custom-scrollbar py-2">
            {Object.entries(sections).map(([section, items]) => (
                <div key={section} className="mb-1">
                    <div className={`px-4 py-2 transition-all duration-300 ${isExpanded || onLinkClick ? 'opacity-100' : 'opacity-0 h-0 py-0 overflow-hidden'}`}>
                        <span className="text-[9px] font-mono tracking-[0.2em] text-primary/40 uppercase">
                            {SECTION_LABELS[section] || section}
                        </span>
                    </div>
                    {items.map((item) => {
                        const active = isActive(item.href);
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={onLinkClick}
                                className={`
                    flex items-center gap-3 px-4 py-2.5 mx-1 rounded
                    transition-all duration-200 group relative
                    ${active
                                        ? 'bg-primary/10 text-primary border-l-2 border-primary'
                                        : 'text-gray-500 hover:text-primary hover:bg-white/5 border-l-2 border-transparent'
                                    }
                  `}
                            >
                                <span className={`material-icons text-lg flex-shrink-0 transition-colors ${active ? 'text-primary' : 'text-gray-500 group-hover:text-primary'}`}>
                                    {item.icon}
                                </span>
                                <span className={`text-xs font-medium tracking-wide whitespace-nowrap transition-all duration-300 ${isExpanded || onLinkClick ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>
                                    {item.label}
                                </span>
                                {!isExpanded && !onLinkClick && (
                                    <div className="absolute left-full ml-2 px-2 py-1 bg-obsidian border border-primary/30 rounded text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-lg">
                                        {item.label}
                                    </div>
                                )}
                            </Link>
                        );
                    })}
                </div>
            ))}
        </nav>
    );

    return (
        <>
        {/* ── Mobile Floating Button ── */}
        <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden fixed bottom-12 left-4 z-50 w-12 h-12 rounded-full bg-primary text-background-dark flex items-center justify-center shadow-[0_0_20px_rgba(242,185,13,0.4)] hover:scale-110 transition-transform"
        >
            <span className="material-icons text-xl">menu</span>
        </button>

        {/* ── Mobile Overlay ── */}
        {mobileOpen && (
            <div className="lg:hidden fixed inset-0 z-50 flex">
                {/* Backdrop */}
                <div
                    className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                    onClick={() => setMobileOpen(false)}
                />
                {/* Drawer */}
                <aside className="relative w-64 h-full bg-background-dark/98 border-r border-primary/20 flex flex-col z-10">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 h-14 border-b border-primary/10 flex-shrink-0">
                        <Link href="/" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 group">
                            <div className="w-8 h-8 border border-primary/50 rounded flex items-center justify-center bg-primary/5">
                                <span className="material-icons text-primary text-lg">auto_awesome</span>
                            </div>
                            <span className="text-sm font-bold tracking-widest uppercase text-white">PONTIFF</span>
                        </Link>
                        <button onClick={() => setMobileOpen(false)} className="text-gray-500 hover:text-primary transition-colors">
                            <span className="material-icons">close</span>
                        </button>
                    </div>
                    {navContent(() => setMobileOpen(false))}
                </aside>
            </div>
        )}

        {/* ── Desktop Sidebar ── */}
        <aside
            onMouseEnter={() => setIsExpanded(true)}
            onMouseLeave={() => setIsExpanded(false)}
            className={`
        fixed left-0 top-12 bottom-8 z-40
        flex flex-col
        bg-background-dark/95 backdrop-blur-md
        border-r border-primary/20
        overflow-hidden
        transition-all duration-300 ease-in-out
        ${isExpanded ? 'w-56' : 'w-16'}
        hidden lg:flex
      `}
        >
            {/* Nav Logo — top of sidebar */}
            <Link
                href="/"
                className="flex items-center gap-3 px-4 h-14 border-b border-primary/10 flex-shrink-0 group"
            >
                <div className="w-8 h-8 border border-primary/50 rounded flex items-center justify-center bg-primary/5 group-hover:bg-primary/20 transition-all duration-300 flex-shrink-0">
                    <span className="material-icons text-primary text-lg group-hover:animate-pulse">auto_awesome</span>
                </div>
                <span className={`text-sm font-bold tracking-widest uppercase text-white group-hover:text-primary transition-all duration-300 whitespace-nowrap ${isExpanded ? 'opacity-100' : 'opacity-0 w-0'}`}>
                    PONTIFF
                </span>
            </Link>

            {navContent()}

            {/* Bottom Collapse Button */}
            <div className="flex-shrink-0 border-t border-primary/10 p-2">
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded text-gray-500 hover:text-primary hover:bg-white/5 transition-all"
                >
                    <span className={`material-icons text-lg transition-transform duration-300 ${isExpanded ? '' : 'rotate-180'}`}>
                        chevron_left
                    </span>
                    <span className={`text-[10px] font-mono tracking-wider whitespace-nowrap transition-all duration-300 ${isExpanded ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>
                        COLLAPSE
                    </span>
                </button>
            </div>
        </aside>
        </>
    );
}
