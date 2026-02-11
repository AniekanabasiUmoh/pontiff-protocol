export function TournamentSkeleton() {
    return (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden animate-pulse">
            <div className="h-48 bg-neutral-800 w-full"></div>
            <div className="p-6 space-y-4">
                <div className="h-6 bg-neutral-800 rounded w-3/4"></div>
                <div className="h-4 bg-neutral-800 rounded w-1/2"></div>
                <div className="flex justify-between pt-4">
                    <div className="h-8 bg-neutral-800 rounded w-20"></div>
                    <div className="h-8 bg-neutral-800 rounded w-20"></div>
                </div>
            </div>
        </div>
    );
}
