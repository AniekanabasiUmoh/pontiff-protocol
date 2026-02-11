export function BracketSkeleton() {
    return (
        <div className="flex gap-8 min-w-max animate-pulse">
            {[1, 2, 3].map((round) => (
                <div key={round} className="flex flex-col justify-around gap-8">
                    {[1, 2, 3, 4].slice(0, 4 - round).map((match) => (
                        <div key={match} className="w-64 h-32 bg-neutral-900 border border-neutral-800 rounded-lg"></div>
                    ))}
                </div>
            ))}
        </div>
    );
}
