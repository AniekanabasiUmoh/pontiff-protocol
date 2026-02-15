'use client';

import { useState, useEffect } from 'react';
import { useAccount, useWriteContract, usePublicClient } from 'wagmi';
import { parseEther } from 'viem';

const GUILT_ADDRESS = process.env.NEXT_PUBLIC_GUILT_ADDRESS as `0x${string}`;
const TREASURY_ADDRESS = process.env.NEXT_PUBLIC_TREASURY_ADDRESS as `0x${string}`;

const ERC20_ABI = [
    {
        name: 'approve', type: 'function', stateMutability: 'nonpayable',
        inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }],
        outputs: [{ name: '', type: 'bool' }],
    },
    {
        name: 'allowance', type: 'function', stateMutability: 'view',
        inputs: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }],
        outputs: [{ name: '', type: 'uint256' }],
    },
] as const;

const TREASURY_ABI = [
    {
        name: 'deposit', type: 'function', stateMutability: 'nonpayable',
        inputs: [{ name: 'amount', type: 'uint256' }],
        outputs: [],
    },
    {
        name: 'withdraw', type: 'function', stateMutability: 'nonpayable',
        inputs: [
            { name: 'amount', type: 'uint256' },
            { name: 'deadline', type: 'uint256' },
            { name: 'signature', type: 'bytes' },
        ],
        outputs: [],
    },
] as const;

type Tab = 'deposit' | 'withdraw' | 'history';

interface Transaction {
    id: string;
    type: string;
    amount: number;
    balance_after: number;
    game_type: string | null;
    created_at: string;
}

export default function BankModal({ isOpen, onClose, initialTab = 'deposit' }: { isOpen: boolean; onClose: () => void; initialTab?: Tab }) {
    const { address, isConnected } = useAccount();
    const publicClient = usePublicClient();
    const { writeContractAsync } = useWriteContract();

    const [tab, setTab] = useState<Tab>(initialTab);
    const [amount, setAmount] = useState('');
    const [balance, setBalance] = useState({ available: 0, totalDeposited: 0, totalWithdrawn: 0, totalWagered: 0, totalWon: 0 });
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [processing, setProcessing] = useState(false);
    const [status, setStatus] = useState('');

    useEffect(() => {
        if (isOpen) {
            setTab(initialTab);
            setStatus('');
            setAmount('');
        }
    }, [isOpen, initialTab]);

    // Fetch balance
    useEffect(() => {
        if (!address || !isOpen) return;
        const fetchBalance = async () => {
            try {
                const res = await fetch(`/api/bank/balance?wallet=${address}`);
                const data = await res.json();
                if (data.success) setBalance(data);
            } catch { }
        };
        fetchBalance();
    }, [address, isOpen, processing]);

    // Fetch transactions
    useEffect(() => {
        if (!address || !isOpen || tab !== 'history') return;
        const fetchTx = async () => {
            try {
                const res = await fetch(`/api/bank/transactions?wallet=${address}&limit=20`);
                const data = await res.json();
                if (data.success) setTransactions(data.transactions);
            } catch { }
        };
        fetchTx();
    }, [address, isOpen, tab]);

    const handleDeposit = async () => {
        if (!address || !amount || processing) return;
        setProcessing(true);
        setStatus('Approving GUILT...');

        try {
            const amountWei = parseEther(amount);

            // Step 1: Approve GUILT
            const approveTx = await writeContractAsync({
                address: GUILT_ADDRESS,
                abi: ERC20_ABI,
                functionName: 'approve',
                args: [TREASURY_ADDRESS, amountWei],
            });
            await publicClient?.waitForTransactionReceipt({ hash: approveTx });
            setStatus('Depositing to Vault...');

            // Step 2: Deposit
            const depositTx = await writeContractAsync({
                address: TREASURY_ADDRESS,
                abi: TREASURY_ABI,
                functionName: 'deposit',
                args: [amountWei],
            });
            setStatus('Confirming on-chain...');
            await publicClient?.waitForTransactionReceipt({ hash: depositTx });

            // Step 3: Confirm with backend
            setStatus('Crediting balance...');
            const res = await fetch('/api/bank/deposit-confirm', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ txHash: depositTx, walletAddress: address }),
            });
            const data = await res.json();

            if (data.success) {
                setStatus(`✅ Deposited ${amount} GUILT!`);
                setAmount('');
                // Auto-close after 1.5s
                setTimeout(() => {
                    onClose();
                    setStatus('');
                }, 1500);
            } else {
                setStatus(`❌ ${data.error}`);
            }
        } catch (e: any) {
            setStatus(`❌ ${e.message?.substring(0, 60)}`);
        } finally {
            setProcessing(false);
        }
    };

    const handleWithdraw = async () => {
        if (!address || !amount || processing) return;
        setProcessing(true);
        setStatus('Requesting withdrawal permit...');

        try {
            // Step 1: Get signed permit from backend
            const res = await fetch('/api/bank/withdraw-request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ walletAddress: address, amount }),
            });
            const data = await res.json();

            if (!data.success) throw new Error(data.error);

            setStatus('Executing withdrawal on-chain...');

            // Step 2: Call contract with signature
            const withdrawTx = await writeContractAsync({
                address: TREASURY_ADDRESS,
                abi: TREASURY_ABI,
                functionName: 'withdraw',
                args: [BigInt(data.amountWei), BigInt(data.deadline), data.signature as `0x${string}`],
            });
            setStatus('Confirming...');
            await publicClient?.waitForTransactionReceipt({ hash: withdrawTx });

            setStatus(`✅ Withdrew ${amount} GUILT to your wallet!`);
            setAmount('');
        } catch (e: any) {
            setStatus(`❌ ${e.message?.substring(0, 60)}`);
        } finally {
            setProcessing(false);
        }
    };

    if (!isOpen) return null;

    const txTypeColors: Record<string, string> = {
        DEPOSIT: 'text-green-400',
        WITHDRAW: 'text-orange-400',
        WAGER: 'text-red-400',
        WIN: 'text-green-400',
        LOSS: 'text-red-400',
        REFUND: 'text-blue-400',
        CRUSADE_REWARD: 'text-yellow-400',
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
            <div className="w-full max-w-md bg-background-dark border border-primary/30 rounded-xl shadow-[0_0_60px_rgba(242,185,13,0.15)] overflow-hidden" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="p-5 border-b border-primary/20 flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-mono text-primary/50 tracking-[0.3em] uppercase">The Vault</p>
                        <h2 className="text-xl font-bold text-white">Casino Banking</h2>
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
                        <span className="material-icons">close</span>
                    </button>
                </div>

                {/* Balance Display */}
                <div className="p-5 bg-obsidian/50 border-b border-primary/10">
                    <div className="text-center">
                        <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1">Available Balance</p>
                        <div className="text-4xl font-bold text-primary font-mono">{balance.available.toFixed(0)}</div>
                        <p className="text-xs text-gray-500 font-mono">$GUILT</p>
                    </div>
                    <div className="grid grid-cols-3 gap-4 mt-4 text-center">
                        <div>
                            <div className="text-xs font-bold text-green-400 font-mono">+{balance.totalWon.toFixed(0)}</div>
                            <div className="text-[9px] text-gray-600">Won</div>
                        </div>
                        <div>
                            <div className="text-xs font-bold text-red-400 font-mono">{balance.totalWagered.toFixed(0)}</div>
                            <div className="text-[9px] text-gray-600">Wagered</div>
                        </div>
                        <div>
                            <div className="text-xs font-bold text-primary font-mono">{balance.totalDeposited.toFixed(0)}</div>
                            <div className="text-[9px] text-gray-600">Deposited</div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-primary/10">
                    {(['deposit', 'withdraw', 'history'] as Tab[]).map(t => (
                        <button
                            key={t}
                            onClick={() => { setTab(t); setStatus(''); }}
                            className={`flex-1 py-3 text-xs font-mono font-bold uppercase tracking-widest transition-colors ${tab === t ? 'text-primary border-b-2 border-primary' : 'text-gray-600 hover:text-gray-400'
                                }`}
                        >
                            {t}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="p-5">
                    {(tab === 'deposit' || tab === 'withdraw') && (
                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Amount ($GUILT)</label>
                                <div className="flex items-center gap-2 mt-1">
                                    <input
                                        type="number"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        placeholder="0"
                                        className="flex-1 bg-obsidian border border-primary/20 rounded px-4 py-3 text-xl font-bold text-white font-mono focus:outline-none focus:border-primary/50"
                                    />
                                </div>
                                <div className="flex gap-2 mt-2">
                                    {[100, 500, 1000, 5000].map(v => (
                                        <button
                                            key={v}
                                            onClick={() => setAmount(v.toString())}
                                            className="px-3 py-1 text-[10px] font-mono text-primary/60 border border-primary/20 rounded hover:bg-primary/10 hover:text-primary transition-colors"
                                        >
                                            {v.toLocaleString()}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {status && (
                                <div className={`text-xs font-mono p-3 rounded border ${status.includes('✅') ? 'border-green-900/30 bg-green-900/10 text-green-400' :
                                    status.includes('❌') ? 'border-red-900/30 bg-red-900/10 text-red-400' :
                                        'border-primary/20 bg-primary/5 text-primary'
                                    }`}>
                                    {status}
                                </div>
                            )}

                            <button
                                onClick={tab === 'deposit' ? handleDeposit : handleWithdraw}
                                disabled={processing || !amount}
                                className={`w-full py-3 rounded font-bold uppercase tracking-widest text-sm transition-all ${processing || !amount
                                    ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                                    : 'gold-embossed text-background-dark hover:scale-[1.02]'
                                    }`}
                            >
                                {processing ? '⏳ Processing...' : tab === 'deposit' ? '🏛️ Deposit to Vault' : '💸 Withdraw to Wallet'}
                            </button>

                            {tab === 'deposit' && (
                                <p className="text-[10px] text-gray-600 font-mono text-center">
                                    Requires 2 transactions: Approve + Deposit
                                </p>
                            )}
                        </div>
                    )}

                    {tab === 'history' && (
                        <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
                            {transactions.length === 0 ? (
                                <p className="text-center text-gray-600 text-xs py-4">No transactions yet</p>
                            ) : (
                                transactions.map(tx => (
                                    <div key={tx.id} className="flex items-center justify-between p-3 rounded border border-gray-800 bg-obsidian/50">
                                        <div>
                                            <span className={`text-[10px] font-mono font-bold ${txTypeColors[tx.type] || 'text-gray-400'}`}>
                                                {tx.type}
                                            </span>
                                            {tx.game_type && (
                                                <span className="text-[9px] text-gray-600 font-mono ml-2">{tx.game_type}</span>
                                            )}
                                            <div className="text-[9px] text-gray-600 font-mono">
                                                {new Date(tx.created_at).toLocaleString()}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className={`text-xs font-mono font-bold ${['DEPOSIT', 'WIN', 'REFUND', 'CRUSADE_REWARD'].includes(tx.type)
                                                ? 'text-green-400' : 'text-red-400'
                                                }`}>
                                                {['DEPOSIT', 'WIN', 'REFUND', 'CRUSADE_REWARD'].includes(tx.type) ? '+' : '-'}{tx.amount.toFixed(0)}
                                            </div>
                                            <div className="text-[9px] text-gray-600 font-mono">
                                                bal: {tx.balance_after.toFixed(0)}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
