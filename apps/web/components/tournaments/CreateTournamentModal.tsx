'use client';

interface CreateTournamentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function CreateTournamentModal({ isOpen, onClose, onSuccess }: CreateTournamentModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                onClick={onClose}
            ></div>

            {/* Modal Content */}
            <div className="relative bg-neutral-900 border border-neutral-800 rounded-xl w-full max-w-lg p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
                <h2 className="text-2xl font-bold text-white mb-4 font-cinzel">Create Tournament</h2>
                <p className="text-neutral-400 mb-6">
                    Configure the rules of engagement for your new tournament.
                </p>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-neutral-300 mb-1">
                            Tournament Title
                        </label>
                        <input
                            type="text"
                            className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-yellow-600 focus:ring-1 focus:ring-yellow-600"
                            placeholder="e.g. The Grand Inquisition"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-neutral-300 mb-1">
                            Entry Fee (ETH)
                        </label>
                        <input
                            type="number"
                            className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-yellow-600 focus:ring-1 focus:ring-yellow-600"
                            placeholder="0.05"
                        />
                    </div>
                </div>

                <div className="mt-8 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg text-neutral-400 hover:text-white transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => {
                            // Mock success for now
                            onSuccess();
                            onClose();
                        }}
                        className="px-6 py-2 bg-yellow-700 hover:bg-yellow-600 text-black font-bold rounded-lg transition-colors"
                    >
                        Create Tournament
                    </button>
                </div>
            </div>
        </div>
    );
}
