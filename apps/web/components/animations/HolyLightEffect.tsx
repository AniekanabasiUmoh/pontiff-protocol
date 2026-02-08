'use client';

import { useEffect, useRef } from 'react';

/**
 * Module 15: Holy Light Effect Component
 *
 * Animated divine light rays emanating from center
 * - CSS-only animation for performance
 * - Subtle pulsing effect
 * - Can be used as background or overlay
 */

interface HolyLightEffectProps {
    intensity?: 'low' | 'medium' | 'high';
    color?: 'gold' | 'white' | 'blue';
}

export function HolyLightEffect({
    intensity = 'medium',
    color = 'gold'
}: HolyLightEffectProps) {
    const colors = {
        gold: 'from-yellow-400/40 via-yellow-200/20',
        white: 'from-white/40 via-white/20',
        blue: 'from-blue-400/40 via-blue-200/20'
    };

    const opacities = {
        low: 'opacity-30',
        medium: 'opacity-50',
        high: 'opacity-70'
    };

    return (
        <div className={`absolute inset-0 overflow-hidden pointer-events-none ${opacities[intensity]}`}>
            {/* Light rays */}
            {[...Array(12)].map((_, i) => (
                <div
                    key={i}
                    className={`absolute top-1/2 left-1/2 h-[200%] w-[20px] origin-top
                        bg-gradient-to-b ${colors[color]} to-transparent
                        animate-holyLight blur-sm`}
                    style={{
                        transform: `rotate(${i * 30}deg)`,
                        animationDelay: `${i * 0.1}s`
                    }}
                />
            ))}

            {/* Central glow */}
            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                w-32 h-32 rounded-full blur-3xl
                bg-gradient-radial ${colors[color]} to-transparent
                animate-pulse`}
            />
        </div>
    );
}

// CSS Animation (add to global.css)
export const holyLightStyles = `
@keyframes holyLight {
    0%, 100% {
        opacity: 0.3;
        transform: rotate(var(--rotation)) scale(1);
    }
    50% {
        opacity: 0.8;
        transform: rotate(var(--rotation)) scale(1.1);
    }
}

.animate-holyLight {
    animation: holyLight 4s ease-in-out infinite;
}
`;
