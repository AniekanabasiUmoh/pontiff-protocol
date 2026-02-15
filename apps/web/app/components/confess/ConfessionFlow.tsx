'use client'

import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseEther, formatEther } from 'viem'
import { ConnectButton, useConnectModal } from '@rainbow-me/rainbowkit'
import { useEffect, useState } from 'react'
import { IlluminatedManuscript } from '@/app/components/confess/IlluminatedManuscript'
import { useToast } from '@/app/components/ui/Toast'
import { GuiltTokenABI, IndulgenceABI } from '@/app/abis'

const INDULGENCE_ADDRESS = process.env.NEXT_PUBLIC_INDULGENCE_ADDRESS as `0x${string}`;
const GUILT_ADDRESS = process.env.NEXT_PUBLIC_GUILT_ADDRESS as `0x${string}`;

const TIERS = [
    { id: 0, name: 'Common', cost: '50', label: 'Minor Sin' },
    { id: 1, name: 'Rare', cost: '100', label: 'Mortal Sin' },
    { id: 2, name: 'Epic', cost: '250', label: 'Cardinal Sin' },
    { id: 3, name: 'Legendary', cost: '500', label: 'Original Sin' },
];

interface Sin {
    type: string
    severity: 'venial' | 'mortal' | 'cardinal'
    description: string
}

interface ConfessionResult {
    sins: Sin[]
    roast: string
    indulgencePrice: string
    message: string
    writUrl?: string
}

export function ConfessionFlow() {
    const [mounted, setMounted] = useState(false)
    const [walletInput, setWalletInput] = useState('')
    const { address, isConnected } = useAccount()
    const { openConnectModal } = useConnectModal()

    // Confession State
    const [isConfessing, setIsConfessing] = useState(false)
    const [confessionResult, setConfessionResult] = useState<ConfessionResult | null>(null)
    const [confessionError, setConfessionError] = useState<string | null>(null)
    const [showShareToast, setShowShareToast] = useState(false)

    // Penance State
    const [showPenance, setShowPenance] = useState(false)
    const [selectedTier, setSelectedTier] = useState(0)
    const [penancePaid, setPenancePaid] = useState(false)
    const { showToast } = useToast()

    // ── Contract Hooks ──
    const { data: guiltBalance, refetch: refetchGuilt } = useReadContract({
        address: GUILT_ADDRESS, abi: GuiltTokenABI, functionName: 'balanceOf',
        args: address ? [address] : undefined, query: { enabled: !!address },
    });

    const { data: allowance, refetch: refetchAllowance } = useReadContract({
        address: GUILT_ADDRESS, abi: GuiltTokenABI, functionName: 'allowance',
        args: address ? [address, INDULGENCE_ADDRESS] : undefined, query: { enabled: !!address },
    });

    const { writeContractAsync, isPending: isTxPending } = useWriteContract();

    useEffect(() => {
        setMounted(true)
    }, [])

    useEffect(() => {
        if (isConnected && address) {
            setWalletInput(address)
        }
    }, [isConnected, address])

    // ── Handlers ──

    const handleConfess = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!walletInput) return
        setIsConfessing(true)
        setConfessionError(null)
        setConfessionResult(null)

        try {
            const response = await fetch('/api/vatican/confess', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    agentWallet: walletInput,
                    type: 'confess',
                    timestamp: new Date().toISOString(),
                }),
            })

            if (!response.ok) {
                const errData = await response.json()
                throw new Error(errData.error || 'Confession failed')
            }

            const data = await response.json()
            if (data.success && data.data) {
                setConfessionResult(data.data)
            } else {
                throw new Error('Invalid response from the Pontiff')
            }
        } catch (err: any) {
            setConfessionError(err.message || 'The Pontiff is unavailable. Try again.')
        } finally {
            setIsConfessing(false)
        }
    }

    const handleShareOnX = () => {
        if (!confessionResult) return
        const sinCount = confessionResult.sins?.length || 0
        const roastPreview = confessionResult.roast?.slice(0, 100) || ''
        const text = `🔥 I confessed ${sinCount} on-chain sins to The Pontiff\n\n"${roastPreview}..."\n\nConfess yours: https://pontiff.gg\n\n#ThePontiff #OnChainSins #GUILT`
        const url = `https://x.com/intent/tweet?text=${encodeURIComponent(text)}`
        window.open(url, '_blank')
        setShowShareToast(true)
        setTimeout(() => setShowShareToast(false), 3000)
    }

    const handleReset = () => {
        setConfessionResult(null)
        setConfessionError(null)
        setShowPenance(false)
        setPenancePaid(false)
        if (!isConnected) setWalletInput('')
    }

    const handlePayPenanceFlow = async () => {
        if (!isConnected) {
            if (openConnectModal) openConnectModal();
            else showToast('Connect wallet to pay penance', 'error');
            return;
        }

        const tier = TIERS[selectedTier];
        const costWei = parseEther(tier.cost);

        // 1. Check Balance
        if (guiltBalance && guiltBalance < costWei) {
            showToast(`Insufficient GUILT. You need ${tier.cost} GUILT.`, 'error');
            return;
        }

        try {
            // 2. Approve if needed
            if (!allowance || allowance < costWei) {
                showToast('Approving GUILT...', 'info');
                await writeContractAsync({
                    address: GUILT_ADDRESS,
                    abi: GuiltTokenABI,
                    functionName: 'approve',
                    args: [INDULGENCE_ADDRESS, costWei],
                });
                return;
            }

            // 3. Absolve
            showToast('Absolving sins...', 'info');
            const hash = await writeContractAsync({
                address: INDULGENCE_ADDRESS,
                abi: IndulgenceABI,
                functionName: 'absolve',
                args: [selectedTier],
            });

            // 4. Notify Backend
            const response = await fetch('/api/vatican/buy-indulgence', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'buyIndulgence',
                    agentWallet: address,
                    tier: tier.name,
                    signature: '0x(contract_call)',
                    timestamp: Date.now(),
                    txHash: hash,
                }),
            });

            if (response.ok) {
                setPenancePaid(true);
                setShowPenance(false);
                showToast('Absolution Granted. Go in peace.', 'success');
                refetchGuilt();
                refetchAllowance();
            } else {
                showToast('Backend sync failed, but on-chain succeeded.', 'info');
            }

        } catch (e: any) {
            console.error('Penance error:', e);
            showToast(e.details || e.message || 'Transaction failed', 'error');
        }
    };

    // Derived Logic for Button State
    const currentTier = TIERS[selectedTier];
    const costWei = parseEther(currentTier.cost);
    const needsApproval = allowance ? allowance < costWei : true;
    const canAfford = guiltBalance ? guiltBalance >= costWei : false;

    return (
        <>
            {/* ── Main Confessional ── */}
            <div className="flex-1 flex flex-col justify-center items-center p-6 lg:p-12 relative">
                {/* Ambient Glow */}
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

                <div className="w-full max-w-lg relative z-10 space-y-8">
                    {/* ── Confession Result State ── */}
                    {confessionResult ? (
                        <div className="w-full">
                            <div className="w-full lg:w-[150%] lg:-ml-[25%]">
                                <IlluminatedManuscript
                                    roast={confessionResult.roast}
                                    sins={confessionResult.sins}
                                    walletAddress={walletInput}
                                    onReset={handleReset}
                                    onPayPenance={() => setShowPenance(true)}
                                    onShare={handleShareOnX}
                                    penanceAmount={currentTier.cost}
                                    penancePaid={penancePaid}
                                    onToast={showToast}
                                />
                            </div>
                        </div>
                    ) : (
                        /* ── Input State ── */
                        <form onSubmit={handleConfess} className="space-y-4">
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

                            <div className="relative group pt-4">
                                <label className="block text-[10px] font-mono text-primary/60 uppercase tracking-widest mb-2">
                                    Wallet Address / TX Hash
                                </label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 material-icons text-primary/40 text-lg">fingerprint</span>
                                    <input
                                        className="w-full bg-obsidian border border-primary/30 rounded p-4 pl-12 text-white font-mono text-sm focus:border-primary focus:ring-1 focus:ring-primary/50 outline-none transition-all placeholder-gray-600"
                                        placeholder="0x... or paste transaction hash"
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

                            <button
                                type="submit"
                                disabled={!walletInput || isConfessing}
                                className="w-full gold-embossed text-background-dark font-bold uppercase tracking-[0.2em] px-8 py-5 rounded text-base hover:scale-[1.01] transition-transform flex items-center justify-center gap-3 group disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isConfessing ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-background-dark/30 border-t-background-dark rounded-full animate-spin" />
                                        SCANNING SINS...
                                    </>
                                ) : (
                                    <>
                                        <span className="material-icons text-2xl group-hover:rotate-12 transition-transform">local_fire_department</span>
                                        CONFESS
                                    </>
                                )}
                            </button>

                            {confessionError && (
                                <div className="p-3 bg-red-900/20 border border-red-900/30 rounded text-red-400 text-center text-xs font-mono">
                                    ✗ {confessionError}
                                </div>
                            )}

                            {/* Subtle connect wallet hint — below everything */}
                            {mounted && !isConnected && (
                                <div className="flex items-center justify-center gap-2 pt-2">
                                    <span className="text-[10px] text-gray-600 font-mono">or</span>
                                    <ConnectButton.Custom>
                                        {({ openConnectModal }) => (
                                            <button
                                                onClick={openConnectModal}
                                                type="button"
                                                className="text-[10px] font-mono text-primary/60 hover:text-primary underline underline-offset-4 decoration-primary/30 hover:decoration-primary transition-colors uppercase tracking-widest"
                                            >
                                                connect wallet for auto-fill
                                            </button>
                                        )}
                                    </ConnectButton.Custom>
                                </div>
                            )}
                        </form>
                    )}
                </div>
            </div>

            {/* ── Penance Modal ── */}
            {showPenance && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="relative bg-obsidian border border-primary/40 max-w-lg w-full shadow-[0_0_60px_rgba(242,185,13,0.15)] overflow-hidden rounded-lg">
                        <div className="h-1 bg-gradient-to-r from-transparent via-primary to-transparent" />

                        <div className="p-8 space-y-6">
                            <div className="text-center">
                                <span className="material-icons text-primary text-4xl mb-3 block">church</span>
                                <p className="text-[10px] font-mono text-primary/60 tracking-[0.3em] uppercase mb-2">Divine Summons</p>
                                <h3 className="text-2xl font-bold text-white uppercase tracking-wider">Pay Your <span className="text-primary text-gold-glow">Penance</span></h3>
                                <p className="text-xs text-gray-500 font-mono mt-2">
                                    The Pontiff has weighed your {confessionResult?.sins?.length || 0} sins. An offering is required for absolution.
                                </p>
                            </div>

                            {/* Tier Selector */}
                            <div className="grid grid-cols-2 gap-3">
                                {TIERS.map((tier) => (
                                    <button
                                        key={tier.id}
                                        onClick={() => setSelectedTier(tier.id)}
                                        className={`p-3 border rounded text-left transition-all ${selectedTier === tier.id
                                            ? 'bg-primary/10 border-primary text-primary'
                                            : 'border-gray-800 text-gray-500 hover:border-primary/30'
                                            }`}
                                    >
                                        <div className="text-xs font-bold uppercase tracking-wider">{tier.name}</div>
                                        <div className="text-lg font-mono font-bold text-white">{tier.cost} G</div>
                                        <div className="text-[10px] opacity-60">{tier.label}</div>
                                    </button>
                                ))}
                            </div>

                            {/* Action Area */}
                            <div className="bg-black/40 rounded p-4 border border-primary/10 space-y-3">
                                <div className="flex justify-between text-xs font-mono text-gray-400">
                                    <span>Your Balance:</span>
                                    <span className={canAfford ? 'text-green-400' : 'text-red-400'}>
                                        {guiltBalance ? parseFloat(formatEther(guiltBalance)).toFixed(0) : '0'} GUILT
                                    </span>
                                </div>

                                <button
                                    onClick={handlePayPenanceFlow}
                                    disabled={isTxPending || !canAfford}
                                    className={`w-full py-4 rounded font-bold uppercase tracking-[0.2em] text-sm flex items-center justify-center gap-3 transition-all ${needsApproval
                                        ? 'bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30'
                                        : 'gold-embossed text-background-dark hover:scale-[1.01]'
                                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                                >
                                    {isTxPending ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                            PROCESSING...
                                        </>
                                    ) : !canAfford ? (
                                        'INSUFFICIENT GUILT'
                                    ) : needsApproval ? (
                                        `APPROVE ${currentTier.cost} GUILT`
                                    ) : (
                                        `ABSOLVE (${currentTier.cost} GUILT)`
                                    )}
                                </button>
                            </div>

                            <button
                                onClick={() => setShowPenance(false)}
                                className="w-full text-center text-[10px] font-mono text-gray-600 hover:text-gray-400 uppercase tracking-widest"
                            >
                                I refuse absolution (cancel)
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Share toast */}
            {showShareToast && (
                <div className="fixed bottom-16 left-1/2 -translate-x-1/2 z-50 bg-primary text-black px-6 py-3 rounded font-mono text-sm font-bold shadow-[0_0_20px_rgba(242,185,13,0.5)] animate-bounce">
                    ✓ Opening X to share your sins...
                </div>
            )}
        </>
    )
}
