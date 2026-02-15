'use client';

import React from 'react';

interface ErrorBoundaryProps {
    children: React.ReactNode;
    fallback?: React.ReactNode;
    onError?: (error: Error, info: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error?: Error;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, info: React.ErrorInfo) {
        console.error('[ErrorBoundary]', error, info);
        this.props.onError?.(error, info);
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }
            return (
                <div className="flex flex-col items-center justify-center p-8 text-center">
                    <div className="text-red-400 text-4xl mb-3">✝</div>
                    <p className="text-red-400 font-mono text-sm mb-1">The Pontiff is displeased.</p>
                    <p className="text-zinc-500 text-xs mb-4">{this.state.error?.message || 'An error occurred.'}</p>
                    <button
                        onClick={() => this.setState({ hasError: false, error: undefined })}
                        className="px-4 py-2 text-xs font-mono border border-red-900/40 text-red-400 rounded hover:bg-red-900/20 transition-colors"
                    >
                        Retry
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}

/**
 * Inline error state for async data failures (not a class component).
 */
export function InlineError({ message, onRetry }: { message?: string; onRetry?: () => void }) {
    return (
        <div className="flex flex-col items-center justify-center p-6 text-center border border-red-900/20 rounded-xl bg-red-950/10">
            <p className="text-red-400/70 font-mono text-xs mb-2">
                {message || 'Failed to load data.'}
            </p>
            {onRetry && (
                <button
                    onClick={onRetry}
                    className="px-3 py-1.5 text-xs font-mono border border-red-900/30 text-red-400/60 rounded hover:bg-red-900/20 transition-colors"
                >
                    Retry
                </button>
            )}
        </div>
    );
}
