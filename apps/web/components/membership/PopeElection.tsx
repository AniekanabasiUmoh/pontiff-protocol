'use client';

interface PopeElectionProps {
    isCardinal: boolean;
}

export function PopeElection({ isCardinal }: PopeElectionProps) {
    if (!isCardinal) return null;

    return (
        <div className="bg-gradient-to-r from-neutral-900 to-black border border-neutral-800 p-6 rounded-xl mb-12">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-xl font-bold text-white font-cinzel mb-1">Papal Conclave In Session</h3>
                    <p className="text-neutral-400 text-sm">Cast your vote for the next Pontiff AI model upgrade.</p>
                </div>
                <span className="bg-yellow-900/20 text-yellow-500 border border-yellow-900/50 px-3 py-1 rounded text-xs font-bold uppercase animate-pulse">
                    Voting Active
                </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-neutral-950 p-4 rounded border border-neutral-800 hover:border-neutral-700 cursor-pointer transition-colors">
                    <div className="flex justify-between mb-2">
                        <span className="font-bold text-white">GPT-5 (The Prophet)</span>
                        <span className="text-neutral-500">64%</span>
                    </div>
                    <div className="w-full bg-neutral-800 h-2 rounded-full overflow-hidden">
                        <div className="bg-yellow-600 h-full w-[64%]"></div>
                    </div>
                </div>

                <div className="bg-neutral-950 p-4 rounded border border-neutral-800 hover:border-neutral-700 cursor-pointer transition-colors">
                    <div className="flex justify-between mb-2">
                        <span className="font-bold text-white">Claude 4 (The Scholar)</span>
                        <span className="text-neutral-500">36%</span>
                    </div>
                    <div className="w-full bg-neutral-800 h-2 rounded-full overflow-hidden">
                        <div className="bg-blue-600 h-full w-[36%]"></div>
                    </div>
                </div>
            </div>
        </div>
    );
}
