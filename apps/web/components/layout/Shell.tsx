'use client';

import { usePathname } from 'next/navigation';
import { ConnectWalletButton } from '../ConnectWalletButton';
import { Sidebar } from './Sidebar';
import { MarqueeTicker } from './MarqueeTicker';

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="font-display bg-background-dark text-white min-h-screen overflow-x-hidden selection:bg-primary selection:text-background-dark flex flex-col">
      {/* ─── Top Header Bar ─── */}
      <header className="fixed top-0 w-full z-50 h-12 border-b border-primary/20 bg-background-dark/95 backdrop-blur-md flex items-center">
        {/* Left: Vatican Uplink Status */}
        <div className="flex items-center gap-3 px-4 h-full border-r border-primary/10 flex-shrink-0">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_6px_#22c55e]" />
          <span className="text-[10px] font-mono tracking-widest text-gray-400 uppercase hidden sm:inline">
            Vatican Uplink
          </span>
        </div>

        {/* Center: Live Sins Marquee */}
        <div className="flex-1 h-full">
          <MarqueeTicker />
        </div>

        {/* Right: User Stats + Wallet */}
        <div className="flex items-center gap-4 px-4 h-full border-l border-primary/10 flex-shrink-0">
          <div className="hidden md:flex items-center gap-4 text-xs font-mono">
            <div className="flex flex-col items-end">
              <span className="text-[9px] text-gray-600 uppercase tracking-wider">Integrity</span>
              <span className="text-primary font-bold">94.2%</span>
            </div>
            <div className="w-px h-6 bg-primary/20" />
            <div className="flex flex-col items-end">
              <span className="text-[9px] text-gray-600 uppercase tracking-wider">Malice</span>
              <span className="text-red-400 font-bold">5.8%</span>
            </div>
          </div>
          <ConnectWalletButton />
        </div>
      </header>

      {/* ─── Left Sidebar Navigation ─── */}
      <Sidebar />

      {/* ─── Main Content Area ─── */}
      <main className="pt-12 pb-8 lg:ml-16 flex-grow flex flex-col min-h-screen relative">
        {/* Background Pattern */}
        <div className="fixed inset-0 bg-nanobot-pattern opacity-30 pointer-events-none z-0" />

        {/* Corner Decorative Borders */}
        <div className="absolute top-14 left-2 w-8 h-8 border-t-2 border-l-2 border-primary/20 pointer-events-none z-10" />
        <div className="absolute top-14 right-2 w-8 h-8 border-t-2 border-r-2 border-primary/20 pointer-events-none z-10" />

        {/* Page Content */}
        <div className="relative z-10 flex-grow">
          {children}
        </div>
      </main>

      {/* ─── Bottom Footer Bar ─── */}
      <footer className="fixed bottom-0 w-full z-50 h-8 border-t border-primary/20 bg-background-dark/95 backdrop-blur-md flex items-center text-[10px] font-mono lg:ml-16 lg:w-[calc(100%-4rem)]">
        <div className="flex items-center gap-6 px-4 flex-1">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-gray-500">MONAD TESTNET</span>
          </div>
          <div className="hidden sm:flex items-center gap-4 text-gray-600">
            <span>BLK: <span className="text-gray-400">18,239,401</span></span>
            <span>LAT: <span className="text-green-500">12ms</span></span>
            <span>AGENTS: <span className="text-primary">8,921</span></span>
            <span>TVL: <span className="text-primary">$42.1M</span></span>
          </div>
        </div>
        <div className="px-4 text-gray-600 hidden md:block">
          SECURE_CONN_V2 // PONTIFF_PROTOCOL
        </div>
      </footer>
    </div>
  );
}
