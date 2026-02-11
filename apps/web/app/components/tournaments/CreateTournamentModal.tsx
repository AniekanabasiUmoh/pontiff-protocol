import { useState } from 'react';
import { useToast } from '../ui/Toast';

interface CreateTournamentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function CreateTournamentModal({ isOpen, onClose, onSuccess }: CreateTournamentModalProps) {
    const [name, setName] = useState('');
    const [entryFee, setEntryFee] = useState<number>(100);
    const [participants, setParticipants] = useState<number>(8);
    const [startDate, setStartDate] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { showToast } = useToast();

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // Calculate prize pool (simple logic: entry fee * participants)
            // In a real contract, this might be handled differently
            const prizePool = (entryFee * participants).toString();

            const res = await fetch('/api/tournaments/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    entryFee: entryFee.toString(),
                    prizePool,
                    maxParticipants: participants,
                    startDate: startDate ? new Date(startDate).toISOString() : new Date().toISOString(), // Default to now if empty (though UI enforces)
                    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // Default 1 week duration
                })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to create tournament');
            }

            showToast('Tournament created successfully!', 'success');
            onSuccess();
            onClose();
        } catch (err: any) {
            console.error('Create tournament error:', err);
            setError(err.message);
            showToast(err.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="relative w-full max-w-lg bg-[#2C2C2C] border-2 border-[#D4AF37] rounded-lg shadow-[0_0_50px_rgba(212,175,55,0.2)] overflow-hidden font-inter text-white">

                {/* Header */}
                <div className="bg-gradient-to-r from-yellow-900 to-black p-4 border-b border-[#D4AF37] flex items-center justify-between">
                    <h2 className="text-xl font-bold font-cinzel text-[#D4AF37]">Create New Tournament</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white text-xl">✕</button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">

                    {/* Name */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-[#D4AF37]">Tournament Name</label>
                        <input
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. The Grand Inquisition"
                            className="w-full bg-black border border-gray-600 rounded px-3 py-2 text-white focus:border-[#D4AF37] outline-none"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Entry Fee */}
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-300">Entry Fee (GUILT)</label>
                            <input
                                type="number"
                                required
                                min="0"
                                value={entryFee}
                                onChange={(e) => setEntryFee(Number(e.target.value))}
                                className="w-full bg-black border border-gray-600 rounded px-3 py-2 text-white focus:border-[#D4AF37] outline-none"
                            />
                        </div>

                        {/* Participants */}
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-300">Max Participants</label>
                            <select
                                value={participants}
                                onChange={(e) => setParticipants(Number(e.target.value))}
                                className="w-full bg-black border border-gray-600 rounded px-3 py-2 text-white focus:border-[#D4AF37] outline-none"
                            >
                                <option value="8">8 Agents</option>
                                <option value="16">16 Agents</option>
                                <option value="32">32 Agents</option>
                            </select>
                        </div>
                    </div>

                    {/* Start Date */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-300">Start Date</label>
                        <input
                            type="datetime-local"
                            required
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full bg-black border border-gray-600 rounded px-3 py-2 text-white focus:border-[#D4AF37] outline-none"
                        />
                    </div>

                    {/* Summary */}
                    <div className="bg-black/40 p-3 rounded-lg space-y-1 text-sm border border-gray-800">
                        <div className="flex justify-between text-gray-400">
                            <span>Estimated Prize Pool</span>
                            <span className="text-[#D4AF37] font-bold">{(entryFee * participants).toLocaleString()} GUILT</span>
                        </div>
                        <div className="flex justify-between text-gray-400">
                            <span>Format</span>
                            <span>Single Elimination</span>
                        </div>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="bg-red-900/40 border border-red-500 rounded p-2 text-sm text-red-400">
                            {error}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-[#D4AF37] text-black font-bold rounded hover:bg-[#C5A028] disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-cinzel shadow-[0_0_15px_rgba(212,175,55,0.3)]"
                        >
                            {loading ? 'Creating Sacred Grounds...' : 'CREATE TOURNAMENT'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
