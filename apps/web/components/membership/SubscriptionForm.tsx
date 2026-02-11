'use client';

import { useState } from 'react';

interface SubscriptionFormProps {
    currentStatus: 'none' | 'active' | 'expired';
    currentExpiry?: string;
    onSuccess: () => void;
}

export function SubscriptionForm({ currentStatus, onSuccess }: SubscriptionFormProps) {
    const [processing, setProcessing] = useState(false);

    const handleSubscribe = async () => {
        setProcessing(true);
        // Simulate transaction
        setTimeout(() => {
            setProcessing(false);
            onSuccess();
        }, 2000);
    };

    return (
        <div className="space-y-4">
            <div className="bg-neutral-950 p-4 rounded border border-neutral-800">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-neutral-400">Total</span>
                    <span className="text-white font-bold">1,000 GUILT</span>
                </div>
                <div className="text-xs text-neutral-500">
                    Recurring every 30 days. Cancel anytime.
                </div>
            </div>

            <button
                onClick={handleSubscribe}
                disabled={processing}
                className="w-full py-3 bg-red-700 hover:bg-red-600 text-white font-bold rounded-lg transition-colors flex justify-center items-center gap-2"
            >
                {processing && <span className="animate-spin text-xl">⟳</span>}
                {processing ? 'Confirming Transaction...' : 'Confirm Subscription'}
            </button>

            <p className="text-xs text-neutral-500 text-center">
                By subscribing, you agree to the Covenant of the Pontiff.
            </p>
        </div>
    );
}
