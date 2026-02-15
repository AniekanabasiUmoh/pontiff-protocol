'use client';

import { useState } from 'react';

interface CreateTournamentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function CreateTournamentModal({ isOpen, onClose, onSuccess }: CreateTournamentModalProps) {
    const [name, setName] = useState('');
    const [prizePool, setPrizePool] = useState('');
    const [maxParticipants, setMaxParticipants] = useState(8);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/tournaments/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    prizePool: parseFloat(prizePool),
                    maxParticipants,
                    startDate: new Date(startDate).toISOString(),
                    endDate: new Date(endDate).toISOString(),
                }),
            });
            const data = await res.json();
            if (data.success) {
                onSuccess();
                onClose();
                setName(''); setPrizePool(''); setStartDate(''); setEndDate('');
            } else {
                setError(data.error || 'Failed to create tournament');
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative bg-neutral-900 border border-neutral-800 rounded-xl w-full max-w-lg p-6 shadow-2xl">
                <h2 className="text-xl font-bold text-white mb-1 uppercase tracking-widest">Create Tournament</h2>
                <p className="text-neutral-500 text-xs font-mono mb-6">Configure the rules of engagement.</p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            required
                            className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-2 text-white text-sm font-mono focus:outline-none focus:border-yellow-600"
                            placeholder="The Grand Inquisition"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Prize Pool (GUILT)</label>
                            <input
                                type="number"
                                value={prizePool}
                                onChange={e => setPrizePool(e.target.value)}
                                required min="1"
                                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-2 text-white text-sm font-mono focus:outline-none focus:border-yellow-600"
                                placeholder="1000"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Max Players</label>
                            <select
                                value={maxParticipants}
                                onChange={e => setMaxParticipants(parseInt(e.target.value))}
                                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-2 text-white text-sm font-mono focus:outline-none focus:border-yellow-600"
                            >
                                {[8, 16, 32, 64, 128].map(n => <option key={n} value={n}>{n}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Start Date</label>
                            <input
                                type="datetime-local"
                                value={startDate}
                                onChange={e => setStartDate(e.target.value)}
                                required
                                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-2 text-white text-sm font-mono focus:outline-none focus:border-yellow-600"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1">End Date</label>
                            <input
                                type="datetime-local"
                                value={endDate}
                                onChange={e => setEndDate(e.target.value)}
                                required
                                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-2 text-white text-sm font-mono focus:outline-none focus:border-yellow-600"
                            />
                        </div>
                    </div>

                    {error && <p className="text-red-400 text-xs font-mono">{error}</p>}

                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-lg text-neutral-400 hover:text-white transition-colors text-sm"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 bg-yellow-700 hover:bg-yellow-600 disabled:opacity-50 text-black font-bold rounded-lg transition-colors text-sm uppercase tracking-widest"
                        >
                            {loading ? 'Creating...' : 'Create Tournament'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
