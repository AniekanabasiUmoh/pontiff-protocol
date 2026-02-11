'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to console in development
        console.error('Error boundary caught:', error);
    }, [error]);

    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
            <div className="max-w-2xl w-full text-center space-y-8">
                {/* Ambient Red Glow for Error */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-red-600/10 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>

                <div className="relative z-10">
                    {/* Error Icon */}
                    <div className="flex justify-center mb-6">
                        <div className="relative">
                            <div className="w-24 h-24 border-4 border-red-500 rounded-full flex items-center justify-center">
                                <span className="text-6xl text-red-500">⚠</span>
                            </div>
                            <div className="absolute inset-0 border-4 border-red-500/30 rounded-full animate-ping"></div>
                        </div>
                    </div>

                    {/* Error Message */}
                    <h1 className="text-4xl lg:text-5xl font-bold mb-4 text-red-500">
                        DIVINE INTERVENTION REQUIRED
                    </h1>

                    <p className="text-xl text-gray-300 mb-4">
                        The sacred circuits have been disrupted.
                    </p>

                    <p className="text-gray-400 mb-8">
                        Something went terribly wrong. The Pontiff's engineers have been notified of this transgression.
                    </p>

                    {/* Error Details (Development Only) */}
                    {process.env.NODE_ENV === 'development' && error.message && (
                        <div className="bg-zinc-900 border border-red-900 rounded-lg p-4 mb-8 text-left">
                            <p className="text-sm text-red-400 font-mono break-all">
                                {error.message}
                            </p>
                            {error.digest && (
                                <p className="text-xs text-gray-600 mt-2">
                                    Digest: {error.digest}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <button
                            onClick={reset}
                            className="px-8 py-4 bg-[#FFD700] text-black font-bold rounded-lg hover:bg-yellow-400 transition-all hover:scale-105 uppercase tracking-wide"
                        >
                            Try Again
                        </button>

                        <Link
                            href="/"
                            className="px-8 py-4 bg-zinc-800 text-white font-bold rounded-lg hover:bg-zinc-700 transition-all border border-zinc-700 uppercase tracking-wide"
                        >
                            Return Home
                        </Link>
                    </div>

                    {/* Footer Quote */}
                    <p className="text-sm text-gray-600 mt-12 italic">
                        "Even in failure, there is redemption."<br />
                        — The Pontiff
                    </p>
                </div>
            </div>
        </div>
    );
}
