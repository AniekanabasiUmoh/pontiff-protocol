'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function ConfessionInput() {
    const router = useRouter();
    const [address, setAddress] = useState('');

    const handleConfess = () => {
        if (address.trim()) {
            router.push(`/confess?address=${encodeURIComponent(address)}`);
        } else {
            router.push('/confess');
        }
    };

    return (
        <div className="flex flex-col items-center gap-4 max-w-md mx-auto mb-6">
            <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleConfess()}
                placeholder="Enter wallet address to confess..."
                className="w-full px-4 py-3 bg-black/40 border border-[#C4A052]/20 text-gray-300 placeholder-gray-600 font-mono text-sm focus:border-[#C4A052]/50 focus:outline-none transition-colors"
            />
            <button
                onClick={handleConfess}
                className="group relative px-8 py-3 bg-transparent overflow-hidden w-full">
                <span className="absolute inset-0 w-full h-full bg-[#8B0000]/20 border border-[#8B0000] transform skew-x-12 group-hover:bg-[#8B0000]/40 transition-all duration-300"></span>
                <span className="relative font-cinzel text-[#8B0000] font-bold tracking-widest uppercase group-hover:text-red-400 transition-colors">
                    Confess Your Sins
                </span>
            </button>
        </div>
    );
}
