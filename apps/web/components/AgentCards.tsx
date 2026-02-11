'use client';

import Link from 'next/link';

const agents = [
    {
        id: 'berzerker',
        name: 'The Berzerker',
        icon: '⚔️',
        color: 'from-red-900 to-red-700',
        risk: 'High Risk',
        roi: '-10% to +500% ROI',
        fee: '10 GUILT/day',
        quote: 'Fortune favors the bold. Or bankrupts them.',
        description: 'Plays aggressively with 15% wagers. High variance, high reward.'
    },
    {
        id: 'merchant',
        name: 'The Merchant',
        icon: '💰',
        color: 'from-yellow-900 to-yellow-700',
        risk: 'Medium Risk',
        roi: '+5% to +30% ROI',
        fee: '15 GUILT/day',
        quote: 'Slow and steady fills the treasury.',
        description: 'Conservative 5% wagers with pattern analysis. Consistent profits.'
    },
    {
        id: 'disciple',
        name: 'The Disciple',
        icon: '🙏',
        color: 'from-blue-900 to-blue-700',
        risk: 'Low Risk',
        roi: '+15% APY',
        fee: '5 GUILT/day',
        quote: 'Faith rewards patience.',
        description: 'Stakes all funds in Cathedral. Passive compounding rewards.'
    }
];

export function AgentCards() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {agents.map((agent) => (
                <Link
                    key={agent.id}
                    href={`/hire?agent=${agent.id}`}
                    className={`block relative bg-gradient-to-br ${agent.color} rounded-lg p-6 border-2 border-[#D4AF37] hover:scale-105 transition-transform group`}
                >
                    <div className="text-6xl mb-4 text-center group-hover:scale-110 transition-transform">{agent.icon}</div>
                    <h3 className="text-2xl font-bold text-white mb-2 text-center font-cinzel">
                        {agent.name}
                    </h3>
                    <div className="space-y-2 mb-4 text-center">
                        <p className="text-sm text-gray-200">{agent.risk}</p>
                        <p className="text-sm text-gray-200">{agent.roi}</p>
                        <p className="text-sm text-[#D4AF37] font-bold">{agent.fee}</p>
                    </div>
                    <p className="text-sm text-gray-300 italic mb-4 text-center">
                        "{agent.quote}"
                    </p>
                    <p className="text-sm text-gray-200 mb-6 text-center">
                        {agent.description}
                    </p>
                    <div
                        className="block w-full bg-[#D4AF37] group-hover:bg-[#C5A028] text-black font-bold py-3 px-6 rounded text-center transition-colors"
                    >
                        Hire Now
                    </div>
                </Link>
            ))}
        </div>
    );
}
