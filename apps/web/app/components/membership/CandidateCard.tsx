interface CandidateCardProps {
    candidate: {
        wallet: string;
        isPope: boolean;
        votes: number;
        joinDate: string;
    };
    onVote: (wallet: string) => void;
    canVote: boolean;
    isVoting: boolean;
}

export function CandidateCard({ candidate, onVote, canVote, isVoting }: CandidateCardProps) {
    const shortAddress = `${candidate.wallet.slice(0, 6)}...${candidate.wallet.slice(-4)}`;
    const joinDate = new Date(candidate.joinDate).toLocaleDateString();

    return (
        <div className={`relative bg-neutral-900 border rounded-lg p-6 transition-all hover:-translate-y-1
            ${candidate.isPope
                ? 'border-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.2)]'
                : 'border-neutral-800 hover:border-red-900/50'}`}>

            {candidate.isPope && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-yellow-500 text-black font-bold text-xs uppercase tracking-widest rounded-full shadow-lg">
                    Current Pope
                </div>
            )}

            <div className="text-center mb-4">
                <div className="h-16 w-16 mx-auto bg-neutral-800 rounded-full flex items-center justify-center text-3xl mb-3 border-2 border-neutral-700">
                    {candidate.isPope ? '👑' : '⛪'}
                </div>
                <h4 className="font-mono font-bold text-white">{shortAddress}</h4>
                <p className="text-xs text-neutral-500">Joined {joinDate}</p>
            </div>

            <div className="flex justify-between items-center bg-black/40 rounded p-3 mb-4">
                <span className="text-xs text-neutral-400 uppercase">Votes</span>
                <span className="text-xl font-bold text-white">{candidate.votes}</span>
            </div>

            {canVote && !candidate.isPope && (
                <button
                    onClick={() => onVote(candidate.wallet)}
                    disabled={isVoting}
                    className="w-full py-2 bg-red-900/20 hover:bg-red-900/40 text-red-500 border border-red-900/50 rounded font-bold text-sm transition-colors disabled:opacity-50"
                >
                    {isVoting ? 'Casting...' : 'Vote for Pope'}
                </button>
            )}

            {candidate.isPope && (
                <div className="text-center text-yellow-500 text-sm font-bold py-2">
                    Reigning Pontiff
                </div>
            )}
        </div>
    );
}
