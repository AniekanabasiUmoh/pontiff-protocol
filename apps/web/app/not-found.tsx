'use client';

import Link from 'next/link';

export default function NotFound() {
    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
            <div className="max-w-2xl w-full text-center space-y-8">
                {/* Ambient Glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#FFD700]/10 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>

                <div className="relative z-10">
                    {/* 404 */}
                    <h1 className="text-[12rem] lg:text-[16rem] font-bold leading-none text-[#FFD700] text-gold-glow select-none">
                        404
                    </h1>

                    {/* Message */}
                    <h2 className="text-3xl lg:text-4xl font-bold mb-4 text-white">
                        THE PONTIFF CANNOT FIND THIS PAGE
                    </h2>

                    <p className="text-lg text-gray-400 mb-8 max-w-md mx-auto">
                        You have wandered beyond the Vatican's sacred walls.
                        This path leads only to darkness and heresy.
                    </p>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <Link
                            href="/"
                            className="px-8 py-4 bg-[#FFD700] text-black font-bold rounded-lg hover:bg-yellow-400 transition-all hover:scale-105 uppercase tracking-wide"
                        >
                            Return to Vatican
                        </Link>

                        <Link
                            href="/dashboard"
                            className="px-8 py-4 bg-zinc-800 text-white font-bold rounded-lg hover:bg-zinc-700 transition-all border border-zinc-700 uppercase tracking-wide"
                        >
                            Go to Dashboard
                        </Link>
                    </div>

                    {/* Footer Quote */}
                    <p className="text-sm text-gray-600 mt-12 italic">
                        "Those who stray from the path shall find only emptiness."<br />
                        — The Pontiff
                    </p>
                </div>
            </div>
        </div>
    );
}
