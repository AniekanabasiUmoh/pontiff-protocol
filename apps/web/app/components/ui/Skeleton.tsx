'use client';

interface SkeletonProps {
    className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
    return (
        <div
            className={`animate-pulse bg-zinc-800/60 rounded ${className}`}
        />
    );
}

export function CardSkeleton() {
    return (
        <div className="border border-zinc-800/40 rounded-xl p-4 space-y-3">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-2/3" />
            <Skeleton className="h-8 w-full" />
        </div>
    );
}

export function StatSkeleton() {
    return (
        <div className="border border-zinc-800/40 rounded-xl p-4 space-y-2">
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-7 w-1/3" />
        </div>
    );
}

export function ListSkeleton({ rows = 5 }: { rows?: number }) {
    return (
        <div className="space-y-2">
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 py-2 border-b border-zinc-800/30">
                    <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
                    <div className="flex-1 space-y-1.5">
                        <Skeleton className="h-3 w-2/5" />
                        <Skeleton className="h-2.5 w-3/5" />
                    </div>
                    <Skeleton className="h-5 w-14" />
                </div>
            ))}
        </div>
    );
}

export function TableSkeleton({ rows = 8, cols = 4 }: { rows?: number; cols?: number }) {
    return (
        <div className="space-y-1">
            {/* Header */}
            <div className={`grid gap-4 px-3 py-2`} style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
                {Array.from({ length: cols }).map((_, i) => (
                    <Skeleton key={i} className="h-3 w-3/4" />
                ))}
            </div>
            {/* Rows */}
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className={`grid gap-4 px-3 py-2.5 border-b border-zinc-800/20`} style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
                    {Array.from({ length: cols }).map((_, j) => (
                        <Skeleton key={j} className="h-3.5" />
                    ))}
                </div>
            ))}
        </div>
    );
}
