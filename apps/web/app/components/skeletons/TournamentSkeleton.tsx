export function TournamentSkeleton() {
    return (
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6 animate-pulse">
            <div className="flex justify-between items-start mb-4">
                <div className="space-y-3 w-2/3">
                    <div className="h-6 bg-neutral-800 rounded w-3/4"></div>
                    <div className="h-4 bg-neutral-800 rounded w-1/2"></div>
                </div>
                <div className="h-6 w-16 bg-neutral-800 rounded-full"></div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="h-10 bg-neutral-800 rounded"></div>
                <div className="h-10 bg-neutral-800 rounded"></div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-neutral-800">
                <div className="h-4 w-24 bg-neutral-800 rounded"></div>
                <div className="h-8 w-24 bg-neutral-800 rounded"></div>
            </div>
        </div>
    );
}
