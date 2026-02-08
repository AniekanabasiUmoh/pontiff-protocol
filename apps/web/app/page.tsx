'use client'

import { Confessional } from './components/Confessional'
import { WalletConnect } from './components/WalletConnect'
import { useAccount } from 'wagmi'
import Link from 'next/link'
import { useEffect, useState } from 'react'

// Component that safely uses wagmi hooks after mount
function ConnectedContent() {
  const { isConnected } = useAccount()
  return isConnected ? <Confessional /> : <WalletConnect />
}

export default function Home() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24 bg-black text-red-700 font-cinzel relative overflow-hidden">

      {/* Background Ambient Glow */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-red-900/20 via-black to-black z-0 pointer-events-none" />

      {/* Header / Title */}
      <div className="z-10 max-w-5xl w-full items-center justify-center font-mono text-sm flex flex-col gap-8">
        <h1 className="text-6xl font-black text-center text-red-600 drop-shadow-[0_0_15px_rgba(220,20,60,0.8)] tracking-widest font-cinzel">
          THE PONTIFF
        </h1>
        <p className="text-xl text-zinc-400 font-thin tracking-[0.2em] font-orbitron uppercase">
          Confess. Stake. Betray.
        </p>
      </div>

      {/* Main Action Area */}
      <div className="z-10 flex flex-col items-center gap-12 mt-12 w-full max-w-4xl">

        {/* Confessional (Replacing Simple Wallet Connect) */}
        <div className="w-full flex justify-center scale-110">
          {mounted ? (
            <ConnectedContent />
          ) : (
            <WalletConnect />
          )}
        </div>

        {/* Protocol Modules Grid */}
        <div className="grid text-center lg:max-w-5xl lg:w-full lg:grid-cols-3 lg:text-left gap-6 mt-16 font-inter">

          {/* Module 1: Staking */}
          <Link href="/cathedral" className="group rounded-lg border border-red-900/30 px-5 py-6 transition-all hover:border-red-600 hover:bg-neutral-900/50 hover:shadow-[0_0_20px_rgba(139,0,0,0.3)]">
            <h2 className={`mb-3 text-2xl font-semibold font-cinzel text-red-500`}>
              The Cathedral{' '}
              <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
                -&gt;
              </span>
            </h2>
            <p className={`m-0 max-w-[30ch] text-sm opacity-60 text-zinc-300 font-light`}>
              Stake $GUILT to earn rewards. Pay the tax. Absolve your sins.
            </p>
          </Link>

          {/* Module 2: Judas Protocol */}
          <Link href="/judas" className="group rounded-lg border border-red-900/30 px-5 py-6 transition-all hover:border-red-600 hover:bg-neutral-900/50 hover:shadow-[0_0_20px_rgba(139,0,0,0.3)]">
            <h2 className={`mb-3 text-2xl font-semibold font-cinzel text-red-500`}>
              Judas Protocol{' '}
              <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
                -&gt;
              </span>
            </h2>
            <p className={`m-0 max-w-[30ch] text-sm opacity-60 text-zinc-300 font-light`}>
              The High Stakes Game. Will you cooperate or betray?
            </p>
          </Link>

          {/* Module 3: Indulgences */}
          <Link href="/indulgences" className="group rounded-lg border border-red-900/30 px-5 py-6 transition-all hover:border-red-600 hover:bg-neutral-900/50 hover:shadow-[0_0_20px_rgba(139,0,0,0.3)]">
            <h2 className={`mb-3 text-2xl font-semibold font-cinzel text-red-500`}>
              Indulgences{' '}
              <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
                -&gt;
              </span>
            </h2>
            <p className={`m-0 max-w-[30ch] text-sm opacity-60 text-zinc-300 font-light`}>
              Buy Absolution. Mint Soulbound tokens. Cleanse your wallet.
            </p>
          </Link>

        </div>
      </div>

      {/* Footer */}
      <div className="z-10 mt-24 text-center opacity-40 hover:opacity-100 transition-opacity">
        <p className="text-xs font-mono text-red-900">
          Deployed on Monad Testnet | Chain ID: 10143
        </p>
      </div>
    </main>
  )
}
