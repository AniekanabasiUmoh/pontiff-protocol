export default function Loading() {
    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
            <div className="text-center space-y-6">
                {/* Ambient Glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#FFD700]/10 rounded-full blur-[100px] pointer-events-none animate-pulse"></div>

                <div className="relative z-10">
                    {/* Animated Cross/Plus */}
                    <div className="flex justify-center mb-8">
                        <div className="relative w-24 h-24">
                            {/* Vertical bar */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-24 bg-[#FFD700] rounded-full animate-pulse"></div>
                            {/* Horizontal bar */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-3 bg-[#FFD700] rounded-full animate-pulse" style={{ animationDelay: '150ms' }}></div>

                            {/* Rotating outer ring */}
                            <div className="absolute inset-0 border-4 border-t-[#FFD700] border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
                        </div>
                    </div>

                    {/* Loading Text */}
                    <h2 className="text-2xl font-bold text-[#FFD700] mb-2 animate-pulse">
                        Consulting The Pontiff
                    </h2>

                    <p className="text-gray-400">
                        Please wait while we commune with the divine...
                    </p>

                    {/* Loading dots */}
                    <div className="flex gap-2 justify-center mt-6">
                        <div className="w-2 h-2 bg-[#FFD700] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-[#FFD700] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-[#FFD700] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                </div>
            </div>
        </div>
    );
}
