'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

type LeaderboardType = 'shame' | 'saints' | 'heretics';

interface LeaderboardEntry {
  rank: number;
  walletAddress: string;
  score: number;
  metadata: any;
}

export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState<LeaderboardType>('shame');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLeaderboard(activeTab);
  }, [activeTab]);

  async function fetchLeaderboard(type: LeaderboardType) {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/leaderboard/${type}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch leaderboard: ${response.statusText}`);
      }

      const data = await response.json();
      setEntries(data.entries || []);
    } catch (err) {
      console.error('Leaderboard fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  }

  const tabs = [
    { id: 'shame', label: 'Hall of Shame', icon: '💀', description: 'Biggest losers' },
    { id: 'saints', label: 'Hall of Saints', icon: '⛪', description: 'Most loyal' },
    { id: 'heretics', label: 'Hall of Heretics', icon: '🔥', description: 'Failed betrayers' },
  ] as const;

  return (
    <div className="min-h-screen bg-black text-white p-8">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-12 text-center">
        <h1 className="text-6xl font-bold mb-4 text-red-500">⚖️ THE LEDGER ⚖️</h1>
        <p className="text-xl text-gray-400">Where All Sins Are Recorded for Eternity</p>
      </div>

      {/* Tabs */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="flex gap-4 justify-center">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as LeaderboardType)}
              className={`px-6 py-4 rounded-lg border-2 transition-all ${
                activeTab === tab.id
                  ? 'bg-red-900 border-red-500 text-white'
                  : 'bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-500'
              }`}
            >
              <div className="text-3xl mb-2">{tab.icon}</div>
              <div className="font-bold">{tab.label}</div>
              <div className="text-sm text-gray-500">{tab.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto">
        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin text-6xl mb-4">⏳</div>
            <p className="text-gray-400">Loading divine records...</p>
          </div>
        ) : error ? (
          <div className="text-center py-20 text-red-500">
            <div className="text-6xl mb-4">❌</div>
            <p>{error}</p>
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <div className="text-6xl mb-4">📜</div>
            <p>No entries recorded yet. Be the first sinner!</p>
          </div>
        ) : (
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="bg-gray-900 border-2 border-red-900 rounded-lg overflow-hidden">
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-4 p-4 bg-red-950 text-red-200 font-bold border-b border-red-900">
                <div className="col-span-1">Rank</div>
                <div className="col-span-6">Wallet Address</div>
                <div className="col-span-3">Score</div>
                <div className="col-span-2">Details</div>
              </div>

              {/* Table Body */}
              {entries.map((entry, index) => (
                <motion.div
                  key={entry.walletAddress}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.02 }}
                  className="grid grid-cols-12 gap-4 p-4 border-b border-gray-800 hover:bg-gray-800 transition-colors"
                >
                  {/* Rank */}
                  <div className="col-span-1 flex items-center">
                    {entry.rank === 1 && <span className="text-3xl">🥇</span>}
                    {entry.rank === 2 && <span className="text-3xl">🥈</span>}
                    {entry.rank === 3 && <span className="text-3xl">🥉</span>}
                    {entry.rank > 3 && <span className="text-gray-400">#{entry.rank}</span>}
                  </div>

                  {/* Wallet */}
                  <div className="col-span-6 flex items-center font-mono text-sm">
                    {entry.walletAddress.slice(0, 6)}...{entry.walletAddress.slice(-4)}
                  </div>

                  {/* Score */}
                  <div className="col-span-3 flex items-center">
                    {activeTab === 'shame' && (
                      <span className="text-red-400 font-bold">
                        ${entry.metadata.totalLoss?.toLocaleString() || '0'}
                      </span>
                    )}
                    {activeTab === 'saints' && (
                      <span className="text-green-400 font-bold">
                        {entry.metadata.loyaltyScore?.toLocaleString() || '0'}
                      </span>
                    )}
                    {activeTab === 'heretics' && (
                      <span className="text-orange-400 font-bold">
                        {entry.metadata.failedCoupCount || 0} coups
                      </span>
                    )}
                  </div>

                  {/* Details */}
                  <div className="col-span-2 flex items-center text-sm text-gray-400">
                    {activeTab === 'shame' && 'Lost'}
                    {activeTab === 'saints' && `${entry.metadata.stakeDays || 0}d staked`}
                    {activeTab === 'heretics' && `$${entry.metadata.totalLoss?.toLocaleString() || '0'}`}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Footer */}
      <div className="max-w-6xl mx-auto mt-12 text-center text-gray-500 text-sm">
        <p>Updated every 5 minutes • Rankings based on blockchain data</p>
        <p className="mt-2">
          "The Pontiff sees all, records all, judges all." - Book of $GUILT 3:16
        </p>
      </div>
    </div>
  );
}
