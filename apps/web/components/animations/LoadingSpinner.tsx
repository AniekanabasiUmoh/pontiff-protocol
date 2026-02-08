'use client';

/**
 * Module 15: Vatican-themed Loading Spinner
 *
 * Animated loading indicator with holy theme
 */

interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    text?: string;
}

export function LoadingSpinner({ size = 'md', text }: LoadingSpinnerProps) {
    const sizes = {
        sm: 'w-8 h-8',
        md: 'w-16 h-16',
        lg: 'w-24 h-24'
    };

    const textSizes = {
        sm: 'text-sm',
        md: 'text-base',
        lg: 'text-lg'
    };

    return (
        <div className="flex flex-col items-center justify-center gap-4">
            {/* Rotating cross spinner */}
            <div className={`${sizes[size]} relative animate-spin-slow`}>
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-full h-1 bg-yellow-500 rounded-full" />
                </div>
                <div className="absolute inset-0 flex items-center justify-center rotate-90">
                    <div className="w-full h-1 bg-yellow-500 rounded-full" />
                </div>
                {/* Holy glow */}
                <div className="absolute inset-0 bg-yellow-400/30 blur-xl rounded-full animate-pulse" />
            </div>

            {text && (
                <p className={`${textSizes[size]} text-gray-300 font-medium animate-pulse`}>
                    {text}
                </p>
            )}
        </div>
    );
}

// CSS Animation (add to global.css)
export const spinnerStyles = `
@keyframes spin-slow {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}

.animate-spin-slow {
    animation: spin-slow 2s linear infinite;
}
`;
