'use client';

import { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';

/**
 * Module 15: Game Result Animation Component
 *
 * Displays animated result overlay with:
 * - Win: Confetti + holy light effect
 * - Loss: Fade to red overlay
 * - Draw: Neutral blue glow
 */

interface GameResultAnimationProps {
    result: 'WIN' | 'LOSS' | 'DRAW';
    amount?: string;
    visible: boolean;
    onComplete?: () => void;
}

export function GameResultAnimation({
    result,
    amount,
    visible,
    onComplete
}: GameResultAnimationProps) {
    const [show, setShow] = useState(false);

    useEffect(() => {
        if (visible) {
            setShow(true);

            // Trigger confetti for wins
            if (result === 'WIN') {
                triggerWinConfetti();
            }

            // Auto-hide after 3 seconds
            const timer = setTimeout(() => {
                setShow(false);
                onComplete?.();
            }, 3000);

            return () => clearTimeout(timer);
        }
    }, [visible, result, onComplete]);

    if (!show) return null;

    return (
        <div className={`fixed inset-0 z-50 flex items-center justify-center pointer-events-none animate-fadeIn`}>
            {/* Holy Light Effect Background */}
            {result === 'WIN' && (
                <div className="absolute inset-0 bg-gradient-radial from-yellow-400/30 via-transparent to-transparent animate-pulse" />
            )}

            {result === 'LOSS' && (
                <div className="absolute inset-0 bg-gradient-radial from-red-600/20 via-transparent to-transparent" />
            )}

            {result === 'DRAW' && (
                <div className="absolute inset-0 bg-gradient-radial from-blue-400/20 via-transparent to-transparent" />
            )}

            {/* Result Text */}
            <div className={`
                relative text-center p-8 rounded-2xl backdrop-blur-lg
                ${result === 'WIN' ? 'bg-green-500/90 text-white shadow-2xl shadow-green-500/50' : ''}
                ${result === 'LOSS' ? 'bg-red-500/90 text-white shadow-2xl shadow-red-500/50' : ''}
                ${result === 'DRAW' ? 'bg-blue-500/90 text-white shadow-2xl shadow-blue-500/50' : ''}
                animate-scaleIn
            `}>
                <div className="text-6xl font-bold mb-4 animate-bounce">
                    {result === 'WIN' && '🎉'}
                    {result === 'LOSS' && '💀'}
                    {result === 'DRAW' && '🤝'}
                </div>

                <h2 className="text-5xl font-black mb-2 tracking-wider">
                    {result === 'WIN' && 'VICTORY!'}
                    {result === 'LOSS' && 'DEFEAT'}
                    {result === 'DRAW' && 'DRAW'}
                </h2>

                {amount && (
                    <p className="text-3xl font-bold mt-4">
                        {result === 'WIN' ? '+' : result === 'LOSS' ? '-' : ''}{amount} GUILT
                    </p>
                )}

                {result === 'WIN' && (
                    <p className="text-xl mt-4 italic">The Pontiff blesses your fortune</p>
                )}

                {result === 'LOSS' && (
                    <p className="text-xl mt-4 italic">Your sins have caught up to you</p>
                )}

                {result === 'DRAW' && (
                    <p className="text-xl mt-4 italic">The scales remain balanced</p>
                )}
            </div>
        </div>
    );
}

/**
 * Trigger confetti animation for wins
 */
function triggerWinConfetti() {
    const duration = 3000;
    const end = Date.now() + duration;

    const colors = ['#FFD700', '#FFA500', '#FF6347', '#FFFFFF'];

    (function frame() {
        confetti({
            particleCount: 3,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors
        });

        confetti({
            particleCount: 3,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors
        });

        if (Date.now() < end) {
            requestAnimationFrame(frame);
        }
    }());

    // Big burst at start
    confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors
    });
}

// CSS-in-JS animations (add to global.css)
export const animationStyles = `
@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}

@keyframes scaleIn {
    from {
        transform: scale(0.5);
        opacity: 0;
    }
    to {
        transform: scale(1);
        opacity: 1;
    }
}

.animate-fadeIn {
    animation: fadeIn 0.5s ease-in-out;
}

.animate-scaleIn {
    animation: scaleIn 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

.bg-gradient-radial {
    background: radial-gradient(circle, var(--tw-gradient-stops));
}
`;
