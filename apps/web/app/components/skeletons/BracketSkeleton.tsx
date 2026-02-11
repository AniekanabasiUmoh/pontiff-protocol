export function BracketSkeleton() {
    return (
        <div className="overflow-x-auto pb-8">
            <div className="flex gap-12 min-w-max p-4">
                {[1, 2, 3].map((round) => (
                    <div key={round} className="flex flex-col flex-1 min-w-[280px]">
                        <div className="h-6 bg-neutral-800 rounded w-24 mx-auto mb-6 animate-pulse"></div>

                        <div className="flex flex-col justify-around flex-grow gap-4">
                            {[1, 2, 3, 4].map((match) => (
                                <div key={match} className="bg-neutral-900 border border-neutral-800 rounded h-24 w-full animate-pulse"></div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
