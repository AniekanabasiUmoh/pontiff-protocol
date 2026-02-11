'use client'

import { useAccount } from 'wagmi'
import Link from 'next/link'
import { useEffect, useState } from 'react'

const PATH_CARDS = [
  { href: '/confess', icon: 'psychology_alt', title: 'Confess Your Sins', desc: 'Submit your worst crypto trades for divine judgment.' },
  { href: '/games/rps', icon: 'sports_mma', title: 'Ritual Combat', desc: 'Stone, Scroll, Dagger — challenge the Pontiff in sacred RPS.' },
  { href: '/games/poker', icon: 'style', title: 'High Altar Poker', desc: 'No bluff survives the all-seeing eye of The Pontiff.' },
  { href: '/hire', icon: 'smart_toy', title: 'Hire An Agent', desc: 'Deploy a bot to do your dirty work in the arena.' },
  { href: '/tournaments', icon: 'emoji_events', title: 'Holy Tournaments', desc: 'Enter high-stakes tourneys. Winner takes the divine prize pool.' },
  { href: '/live', icon: 'electric_bolt', title: 'Vatican Live Wire', desc: 'Direct neural link to the Holy See\'s data streams.' },
]

const LIVE_SINS = [
  { address: '0x71C...9A2', action: 'wagered 5,000 $GUILT on RPS', type: 'wager' },
  { address: '0xB2...CC4', action: 'lost 12,400 $GUILT at Poker', type: 'loss' },
  { address: '0xDr4...g0n', action: 'won TOURNAMENT: 10.5 ETH', type: 'win' },
  { address: '0x88...1FA', action: 'confessed: "I longed DOGE at the top"', type: 'confession' },
  { address: '0xK1...GOD', action: 'staked 100,000 $GUILT for 365 days', type: 'stake' },
  { address: '0x99...AAA', action: 'hired Agent BERZERKER', type: 'hire' },
  { address: '0xA1...F44', action: 'won 88,000 $GUILT — JACKPOT', type: 'win' },
]

const CONFESSIONS = [
  '/// "I sold my BTC at $15k for a used Honda Civic" ///',
  '/// "Leveraged 100x on a hunch from a fortune cookie" ///',
  '/// "Forgive me father for I have rugpulled" ///',
  '/// "I bought the top and sold the bottom, as is tradition" ///',
  '/// "I told my wife it was a safe investment (it was a memecoin)" ///',
  '/// "I lost my seed phrase in a boating accident" ///',
  '/// "I clicked the link in the Discord DM" ///',
  '/// "I thought LUNA was actually stable" ///',
  '/// "I bought an NFT of a rock for 50 ETH" ///',
  '/// "I panic sold at -10% and fomo\'d back in at +20%" ///',
]

export default function Home() {
  const [mounted, setMounted] = useState(false)
  const [walletInput, setWalletInput] = useState('')
  const [offeringAmount, setOfferingAmount] = useState('0.10')
  const { address, isConnected } = useAccount()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (isConnected && address) {
      setWalletInput(address)
    }
  }, [isConnected, address])

  const handleConfess = (e: React.FormEvent) => {
    e.preventDefault()
    if (walletInput) {
      window.location.href = `/confess?address=${walletInput}`
    }
  }

  return (
    <>
      {/* ── Main Confessional (2-column) ── */}
      <div className="flex-1 flex flex-col xl:flex-row min-h-[calc(100vh-5rem)]">

        {/* ─── Left Column: Confession Input ─── */}
        <div className="flex-1 flex flex-col justify-center items-center p-6 lg:p-12 relative">
          {/* Ambient Glow */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

          <div className="w-full max-w-lg relative z-10 space-y-8">
            {/* Title */}
            <div className="space-y-3">
              <p className="text-primary/60 text-xs font-mono tracking-[0.3em] uppercase">The Eternal Ledger Awaits</p>
              <h1 className="text-4xl lg:text-6xl font-bold tracking-tight text-white leading-[0.95] uppercase">
                CONFESS<br />
                YOUR <span className="text-primary text-gold-glow">SINS</span>
              </h1>
              <p className="text-gray-500 text-sm font-mono max-w-md">
                Submit your wallet or transaction for divine judgment. The Pontiff sees all trades, all losses, all hubris.
              </p>
            </div>

            {/* Wallet / TX Input */}
            <form onSubmit={handleConfess} className="space-y-4">
              <div className="relative group">
                <label className="block text-[10px] font-mono text-primary/60 uppercase tracking-widest mb-2">
                  Wallet Address / TX Hash
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 material-icons text-primary/40 text-lg">fingerprint</span>
                  <input
                    className="w-full bg-obsidian border border-primary/30 rounded p-4 pl-12 text-white font-mono text-sm focus:border-primary focus:ring-1 focus:ring-primary/50 outline-none transition-all placeholder-gray-600"
                    placeholder="0x... or paste transaction hash"
                    type="text"
                    value={walletInput}
                    onChange={(e) => setWalletInput(e.target.value)}
                  />
                  {/* Corner decorations */}
                  <div className="absolute -top-px -left-px w-3 h-3 border-t border-l border-primary/60" />
                  <div className="absolute -top-px -right-px w-3 h-3 border-t border-r border-primary/60" />
                  <div className="absolute -bottom-px -left-px w-3 h-3 border-b border-l border-primary/60" />
                  <div className="absolute -bottom-px -right-px w-3 h-3 border-b border-r border-primary/60" />
                </div>
              </div>

              {/* Offering Amount */}
              <div>
                <div className="flex justify-between items-center text-xs uppercase tracking-widest text-primary/60 font-mono mb-2">
                  <span>Offering Amount</span>
                  <span>Balance: 4.20 ETH</span>
                </div>
                <div className="flex items-center gap-3 bg-obsidian border border-primary/20 rounded p-3">
                  <span className="text-primary font-bold text-xl">Ξ</span>
                  <input
                    className="flex-1 bg-transparent border-none text-right text-2xl font-bold text-white placeholder-gray-700 focus:ring-0 outline-none font-mono"
                    placeholder="0.00"
                    type="text"
                    value={offeringAmount}
                    onChange={(e) => setOfferingAmount(e.target.value)}
                  />
                  <div className="flex gap-1">
                    {['½', '2×', 'MAX'].map((label) => (
                      <button
                        key={label}
                        type="button"
                        className="px-2 py-1 text-[10px] font-mono text-primary/60 border border-primary/20 rounded hover:bg-primary/10 hover:text-primary transition-colors"
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Confess Button */}
              <button
                type="submit"
                className="w-full gold-embossed text-background-dark font-bold uppercase tracking-[0.2em] px-8 py-5 rounded text-base hover:scale-[1.01] transition-transform flex items-center justify-center gap-3 group"
              >
                <span className="material-icons text-2xl group-hover:rotate-12 transition-transform">local_fire_department</span>
                CONFESS
              </button>
            </form>

            {/* Plea Input */}
            <div>
              <label className="block text-[10px] font-mono text-gray-600 uppercase tracking-widest mb-2">
                Optional Plea (visible on the ledger)
              </label>
              <textarea
                className="w-full bg-obsidian border border-gray-800 rounded p-3 text-gray-400 font-mono text-xs focus:border-primary/50 focus:ring-0 outline-none transition-colors placeholder-gray-700 resize-none h-20"
                placeholder="&quot;I didn't know leverage could go negative...&quot;"
              />
            </div>
          </div>
        </div>

        {/* ─── Right Column: AI Judgment + Live Feed ─── */}
        <aside className="w-full xl:w-[420px] bg-obsidian border-t xl:border-t-0 xl:border-l border-primary/20 flex flex-col relative shadow-[-10px_0_30px_rgba(0,0,0,0.5)]">
          {/* The Pontiff AI Card */}
          <div className="p-6 border-b border-primary/10 text-center relative overflow-hidden">
            {/* Background shimmer */}
            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />

            <div className="relative z-10 space-y-4">
              {/* Avatar */}
              <div className="mx-auto w-24 h-24 rounded-full border-2 border-primary/40 bg-background-dark flex items-center justify-center shadow-[0_0_30px_rgba(242,185,13,0.15)] relative">
                <span className="material-icons text-primary text-4xl">auto_awesome</span>
                {/* Rotating ring */}
                <div className="absolute inset-[-4px] border border-primary/20 rounded-full animate-spin" style={{ animationDuration: '20s' }} />
              </div>
              <div>
                <h3 className="text-primary font-bold text-lg tracking-widest uppercase text-gold-glow">The Pontiff</h3>
                <p className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">Awaiting Confession</p>
              </div>

              {/* Tarot-style card element */}
              <div className="mx-auto w-40 h-56 border border-primary/30 rounded-lg bg-gradient-to-b from-primary/5 to-obsidian flex flex-col items-center justify-center gap-3 relative overflow-hidden">
                <div className="absolute inset-0 bg-gold-grain opacity-20 pointer-events-none" />
                <span className="material-icons text-primary/30 text-6xl">visibility</span>
                <div className="text-[10px] text-primary/40 font-mono uppercase tracking-widest">The All-Seeing</div>
                {/* Card corner markers */}
                <div className="absolute top-2 left-2 text-[8px] text-primary/30 font-mono">♱</div>
                <div className="absolute top-2 right-2 text-[8px] text-primary/30 font-mono">♱</div>
                <div className="absolute bottom-2 left-2 text-[8px] text-primary/30 font-mono rotate-180">♱</div>
                <div className="absolute bottom-2 right-2 text-[8px] text-primary/30 font-mono rotate-180">♱</div>
              </div>
            </div>
          </div>

          {/* Live Feed Section */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-primary/10 flex justify-between items-center">
              <h4 className="text-xs font-bold text-primary tracking-widest uppercase flex items-center gap-2">
                <span className="material-icons text-sm">history_edu</span>
                Live Scripture
              </h4>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[10px] text-gray-500 font-mono">LIVE</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {LIVE_SINS.map((sin, i) => (
                <div
                  key={i}
                  className={`p-3 rounded border transition-all duration-200 group cursor-pointer ${sin.type === 'win'
                      ? 'bg-primary/5 border-primary/20 hover:border-primary/40'
                      : sin.type === 'loss'
                        ? 'bg-red-500/5 border-red-500/10 hover:border-red-500/30'
                        : 'bg-transparent border-gray-800 hover:border-primary/20'
                    }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-xs font-mono text-gray-400 group-hover:text-primary transition-colors">{sin.address}</span>
                    <span className={`text-[10px] font-mono ${sin.type === 'win' ? 'text-green-400' :
                        sin.type === 'loss' ? 'text-red-400' :
                          'text-gray-500'
                      }`}>
                      {sin.type === 'win' ? '✦ WIN' : sin.type === 'loss' ? '✗ LOSS' : '●'}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 font-mono group-hover:text-gray-300 transition-colors">{sin.action}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Confession Ticker at Bottom */}
          <div className="border-t border-primary/10 h-10 overflow-hidden flex items-center relative bg-black/40">
            <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-obsidian to-transparent z-10" />
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-obsidian to-transparent z-10" />
            <div className="whitespace-nowrap animate-ticker flex gap-8 items-center">
              {CONFESSIONS.map((c, i) => (
                <span key={i} className="text-primary/50 font-mono text-[10px] tracking-wider">{c}</span>
              ))}
            </div>
          </div>
        </aside>
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
