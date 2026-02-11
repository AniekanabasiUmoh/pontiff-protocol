'use client';

import { useState, useEffect } from 'react';

type LeaderboardType = 'shame' | 'saints' | 'heretics';

interface LeaderboardEntry {
  rank: number;
  walletAddress: string;
  score: number;
  metadata: any;
}

const TABS = [
  { id: 'shame' as const, label: 'Hall of Shame', icon: 'skull', desc: 'Biggest losses', color: 'text-red-400' },
  { id: 'saints' as const, label: 'Hall of Saints', icon: 'church', desc: 'Most loyal', color: 'text-green-400' },
  { id: 'heretics' as const, label: 'Hall of Heretics', icon: 'local_fire_department', desc: 'Failed betrayers', color: 'text-orange-400' },
];

// Top 3 podium mock (used when there are no API results yet)
const PODIUM_MOCK = [
  { rank: 2, address: '0xB2A...CC4', name: 'The Merchant', score: '42,091', icon: 'person' },
  { rank: 1, address: '0x71C...9A2', name: 'Degen Lord', score: '128,400', icon: 'person' },
  { rank: 3, address: '0xK1...GOD', name: 'Silent Saint', score: '31,780', icon: 'person' },
];

export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState<LeaderboardType>('shame');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { fetchLeaderboard(activeTab); }, [activeTab]);

  async function fetchLeaderboard(type: LeaderboardType) {
    setLoading(true); setError(null);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/leaderboard/${type}`);
      if (!response.ok) throw new Error(`Failed to fetch: ${response.statusText}`);
      const data = await response.json();
      setEntries(data.entries || []);
    } catch (err) {
      console.error('Leaderboard fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-5rem)] p-6 lg:p-8">
      <div className="max-w-[1200px] mx-auto space-y-8">
        {/* ─── Header ─── */}
        <div className="text-center">
          <p className="text-[10px] font-mono text-primary/50 tracking-[0.3em] uppercase mb-2">The Eternal Record</p>
          <h1 className="text-4xl font-bold text-white tracking-wide uppercase mb-2">
            Hall of <span className="text-primary text-gold-glow">Judgment</span>
          </h1>
          <p className="text-sm text-gray-500 font-mono">Where All Sins Are Recorded for Eternity</p>
        </div>

        {/* ─── Podium (Top 3) ─── */}
        <div className="flex justify-center items-end gap-4 py-6">
          {PODIUM_MOCK.map((p) => {
            const height = p.rank === 1 ? 'h-32' : p.rank === 2 ? 'h-24' : 'h-20';
            const medal = p.rank === 1 ? '🥇' : p.rank === 2 ? '🥈' : '🥉';
            return (
              <div key={p.rank} className="flex flex-col items-center group">
                {/* Avatar */}
                <div className={`w-14 h-14 rounded-full ${p.rank === 1 ? 'bg-primary/20 border-primary/40' : 'bg-obsidian border-gray-700'} border-2 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform`}>
                  <span className={`material-icons ${p.rank === 1 ? 'text-primary' : 'text-gray-500'} text-2xl`}>{p.icon}</span>
                </div>
                <div className="text-xs font-mono text-gray-400 mb-1">{p.name}</div>
                <div className="text-lg font-bold font-mono text-white">{medal}</div>
                <div className={`text-[10px] font-mono ${p.rank === 1 ? 'text-primary' : 'text-gray-500'}`}>{p.score}</div>

                {/* Podium Bar */}
                <div className={`${height} w-24 mt-2 rounded-t-lg ${p.rank === 1 ? 'bg-gradient-to-b from-primary/30 to-primary/10 border-x border-t border-primary/30' :
                    'bg-gradient-to-b from-gray-800 to-gray-900 border-x border-t border-gray-700'
                  } flex items-center justify-center`}>
                  <span className="text-2xl font-bold font-mono text-white/30">#{p.rank}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* ─── Tab Navigation ─── */}
        <div className="flex gap-2 justify-center">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 rounded-lg border text-xs font-mono uppercase tracking-widest transition-all ${activeTab === tab.id
                  ? 'bg-primary/10 border-primary/30 text-primary'
                  : 'bg-obsidian border-gray-800 text-gray-500 hover:border-primary/20 hover:text-white'
                }`}
            >
              <span className="material-icons text-sm">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* ─── Table ─── */}
        <div className="bg-obsidian rounded-lg border border-primary/10 overflow-hidden">
          {loading ? (
            <div className="p-16 text-center">
              <span className="material-icons text-primary/30 text-5xl animate-spin mb-3 block">hourglass_top</span>
              <p className="text-gray-500 font-mono text-sm">Loading divine records...</p>
            </div>
          ) : error ? (
            <div className="p-16 text-center">
              <span className="material-icons text-red-400/50 text-5xl mb-3 block">error_outline</span>
              <p className="text-red-400 text-sm mb-2">{error}</p>
              <button onClick={() => fetchLeaderboard(activeTab)} className="text-primary text-xs hover:underline font-mono">
                Retry
              </button>
            </div>
          ) : entries.length === 0 ? (
            <div className="p-16 text-center">
              <span className="material-icons text-primary/20 text-5xl mb-3 block">history_edu</span>
              <p className="text-gray-500 font-mono text-sm">No entries recorded yet. Be the first sinner!</p>
            </div>
          ) : (
            <>
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-primary/5 text-[10px] font-mono text-gray-500 uppercase tracking-widest border-b border-primary/10">
                <div className="col-span-1">Rank</div>
                <div className="col-span-5">Wallet</div>
                <div className="col-span-3 text-right">Score</div>
                <div className="col-span-3 text-right">Details</div>
              </div>

              {/* Entries */}
              {entries.map((entry, index) => {
                const medal = entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : null;
                return (
                  <div
                    key={entry.walletAddress}
                    className={`grid grid-cols-12 gap-4 px-6 py-4 border-b border-white/5 hover:bg-white/5 transition-colors group ${entry.rank <= 3 ? 'bg-primary/3' : ''
                      }`}
                  >
                    <div className="col-span-1 flex items-center">
                      {medal ? (
                        <span className="text-xl">{medal}</span>
                      ) : (
                        <span className="text-gray-600 font-mono text-sm">#{entry.rank}</span>
                      )}
                    </div>
                    <div className="col-span-5 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                        <span className="material-icons text-primary text-sm">person</span>
                      </div>
                      <span className="font-mono text-sm text-gray-300 group-hover:text-white transition-colors">
                        {entry.walletAddress.slice(0, 6)}...{entry.walletAddress.slice(-4)}
                      </span>
                    </div>
                    <div className="col-span-3 flex items-center justify-end">
                      {activeTab === 'shame' && (
                        <span className="text-red-400 font-bold font-mono">${entry.metadata.totalLoss?.toLocaleString() || '0'}</span>
                      )}
                      {activeTab === 'saints' && (
                        <span className="text-green-400 font-bold font-mono">{entry.metadata.loyaltyScore?.toLocaleString() || '0'}</span>
                      )}
                      {activeTab === 'heretics' && (
                        <span className="text-orange-400 font-bold font-mono">{entry.metadata.failedCoupCount || 0} coups</span>
                      )}
                    </div>
                    <div className="col-span-3 flex items-center justify-end text-xs text-gray-500 font-mono">
                      {activeTab === 'shame' && 'Total Lost'}
                      {activeTab === 'saints' && `${entry.metadata.stakeDays || 0}d staked`}
                      {activeTab === 'heretics' && `$${entry.metadata.totalLoss?.toLocaleString() || '0'}`}
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="text-center text-gray-600 text-[11px] font-mono space-y-1">
          <p>Updated every 5 minutes • Rankings based on blockchain data</p>
          <p className="text-primary/30">&ldquo;The Pontiff sees all, records all, judges all.&rdquo; — Book of $GUILT 3:16</p>
        </div>
      </div>
    </div>
  );
}
