'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ConfessionFlow } from '@/app/components/confess/ConfessionFlow'

const PATH_CARDS = [
  { href: '/confess', icon: 'psychology_alt', title: 'Confess Your Sins', desc: 'Submit your worst crypto trades for divine judgment.' },
  { href: '/games/rps', icon: 'sports_mma', title: 'Ritual Combat', desc: 'Stone, Scroll, Dagger — challenge the Pontiff in sacred RPS.' },
  { href: '/games/poker', icon: 'style', title: 'High Altar Poker', desc: 'No bluff survives the all-seeing eye of The Pontiff.' },
  { href: '/hire', icon: 'smart_toy', title: 'Hire An Agent', desc: 'Deploy a bot to do your dirty work in the arena.' },
  { href: '/tournaments', icon: 'emoji_events', title: 'Holy Tournaments', desc: 'Enter high-stakes tourneys. Winner takes the divine prize pool.' },
  { href: '/live', icon: 'electric_bolt', title: 'Vatican Live Wire', desc: 'Direct neural link to the Holy See\'s data streams.' },
]

export default function Home() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <>
      {/* ── Main Confessional (2-column wrapper) ── */}
      <div className="flex-1 flex flex-col xl:flex-row min-h-[calc(100vh-5rem)]">

        {/* ─── Left Column: Confession Input / Results ─── */}
        {/* We use the shared component now */}
        <ConfessionFlow />

        {/* ─── Right Column: Pontiff AI + Recent Confessions Feed ─── */}
        {/* Currently empty/placeholder as per original design */}
        {/* <div className="hidden xl:flex flex-1 flex-col p-12 relative border-l border-primary/10">
           ... Future feed content ...
        </div> */}

      </div>

      {/* ── Choose Your Path Section ── */}
      <div className="w-full px-6 lg:px-12 py-16 border-t border-primary/10 bg-background-dark/80 backdrop-blur-sm relative">
        <div className="absolute inset-0 bg-gold-grain opacity-10 pointer-events-none" />
        <div className="max-w-6xl mx-auto relative z-10">
          {/* Section Header */}
          <div className="text-center mb-16 relative">
            <p className="text-[10px] font-mono text-primary/40 tracking-[0.3em] uppercase mb-3">Navigate the Holy Protocol</p>
            <h2 className="relative inline-block px-8 py-2 text-2xl lg:text-3xl font-display text-primary tracking-[0.2em] uppercase border-y border-primary/20">
              Choose Your Path
            </h2>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {PATH_CARDS.map((card) => (
              <Link
                key={card.href}
                href={card.href}
                className="group relative bg-obsidian border border-primary/20 p-8 flex flex-col items-center text-center gap-5 hover:border-primary/60 transition-all duration-300 cursor-pointer path-card rounded"
              >
                {/* Corner Decorations */}
                <div className="card-corner corner-tl" />
                <div className="card-corner corner-tr" />
                <div className="card-corner corner-bl" />
                <div className="card-corner corner-br" />

                {/* Icon */}
                <div className="w-16 h-16 flex items-center justify-center">
                  <span className="material-icons text-primary text-5xl gold-icon-3d">{card.icon}</span>
                </div>

                {/* Text */}
                <div>
                  <h3 className="text-white text-lg font-bold uppercase tracking-wider mb-2 group-hover:text-primary transition-all">
                    {card.title}
                  </h3>
                  <p className="text-gray-500 font-mono text-xs leading-relaxed uppercase tracking-wide">
                    {card.desc}
                  </p>
                </div>

                {/* Arrow */}
                <span className="material-icons text-primary/30 group-hover:text-primary group-hover:translate-x-1 transition-all text-sm">arrow_forward</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
